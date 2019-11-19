import { Global } from './interfaces';
import Dep from './Dep';
import Computed from './computed';
import { DynamicRelation } from './relationController';
import Action from './action';

export interface Job {
  type: JobType;
  collection: string;
  property: string | number | Computed;
  value?: any;
  previousValue?: any;
  dep?: Dep;
  fromAction?: boolean | Action;
  config?: Object;
}

export enum JobType {
  PUBLIC_DATA_MUTATION = 'PUBLIC_DATA_MUTATION',
  INTERNAL_DATA_MUTATION = 'INTERNAL_DATA_MUTATION',
  INDEX_UPDATE = 'INDEX_UPDATE',
  COMPUTED_REGEN = 'COMPUTED_REGEN',
  GROUP_UPDATE = 'GROUP_UPDATE',
  SOFT_GROUP_UPDATE = 'SOFT_GROUP_UPDATE',
  DELETE_INTERNAL_DATA = 'DELETE_INTERNAL_DATA'
}
export default class Runtime {
  public updatingSubscribers: Boolean = false;

  public runningJob: Job | boolean = false;
  private ingestQueue: Array<Job> = [];
  private completedJobs: Array<Job> = [];
  private archivedJobs: Array<Job> = [];

  // global action state
  public runningActions: Array<Action> = [];
  public runningAction: Action | boolean = false;

  // private collections: Object;
  private config: Object;

  constructor(private collections: Object, private global: Global) {
    global.ingest = this.ingest.bind(this);
    global.ingestDependents = this.ingestDependents.bind(this);
    this.config = global.config;
  }

  // The primary entry point for Runtime, all jobs should come through here
  public ingest(job: Job): void {
    this.ingestQueue.push(job);
    this.global.log(job);
    // don't begin the next job until this one is fully complete
    if (!this.runningJob) {
      this.findNextJob();
    }
  }

  private findNextJob() {
    // shift the next job from the queue
    let next = this.ingestQueue.shift();

    if (!next.dep && next.type !== JobType.INDEX_UPDATE)
      // groups, computed and indexes will not have their Dep class, so get it.
      next.dep = this.global.getDep(next.property, next.collection);

    this.runningJob = next;
    // execute the next task in the queue
    this.performJob(next);
  }

  private loadPreviousValue(job: Job) {
    let location: string;
    if (job.type === JobType.INDEX_UPDATE) location = 'indexes';
    else if (
      job.type === JobType.COMPUTED_REGEN ||
      job.type === JobType.SOFT_GROUP_UPDATE
    )
      location = 'public';
    return this.collections[job.collection][location].privateGet(job.property);
  }

  private performJob(job: Job): void {
    const pre = job.hasOwnProperty(job.previousValue);

    switch (job.type) {
      case JobType.PUBLIC_DATA_MUTATION:
        this.performPublicDataUpdate(job);
        this.collections[job.collection].runWatchers(job.property);
        break;
      case JobType.INTERNAL_DATA_MUTATION:
        this.performInternalDataUpdate(job);
        break;
      case JobType.INDEX_UPDATE:
        if (!pre) job.previousValue = this.loadPreviousValue(job);

        this.performIndexUpdate(job);
        break;
      case JobType.COMPUTED_REGEN:
        if (!pre) job.previousValue = this.loadPreviousValue(job);
        this.performComputedOutput(job);
        this.collections[job.collection].runWatchers(job.property.name);
        break;
      case JobType.GROUP_UPDATE:
        this.performGroupRebuild(job);
        this.collections[job.collection].runWatchers(job.property);
        break;
      case JobType.SOFT_GROUP_UPDATE:
        if (!pre) job.previousValue = this.loadPreviousValue(job);
        this.performGroupRebuild(job);
        this.collections[job.collection].runWatchers(job.property);
        break;
      case JobType.DELETE_INTERNAL_DATA:
        this.performInternalDataDeletion(job);
        break;
      default:
        break;
    }

    // unpack dependents
    if (job.dep && job.dep.dependents.size > 0) {
      this.ingestDependents(job.dep.dependents);
    }

    this.finished();
  }

  public ingestDependents(dependents: Set<any>): void {
    // this is called twice below
    const ingestComputed = (computed: Computed) =>
      this.ingest({
        type: JobType.COMPUTED_REGEN,
        collection: computed.collection,
        property: computed,
        dep: this.global.getDep(computed.name, computed.collection)
      });

    // for each dependent stored in dep class
    dependents.forEach(dependent => {
      // there are two types of dependents stored: Computed and DynamicRelation
      if (dependent instanceof Computed) ingestComputed(dependent);
      else if (dependent instanceof DynamicRelation) {
        // one might think using "instanceOf" would work as expected below
        // but it doesn't, alas I hate javascript.
        // temp fix: constructor.name - be my guest try and fix this??
        const type = dependent.updateThis.constructor.name;
        // DynamicRelation can store either Computed or Dep (internal)
        if (type === Computed.name)
          ingestComputed(dependent.updateThis as Computed);
        else if (type === Dep.name) {
          // ingest internal data mutation without a value will result in a soft group update
          this.ingest({
            type: JobType.INTERNAL_DATA_MUTATION,
            collection: (dependent.updateThis as Dep).collection.name,
            property: (dependent.updateThis as Dep).propertyName
          });
        }
      }
    });
  }

  // handle job loop flow
  private finished(): void {
    this.runningJob = false;
    if (this.completedJobs.length > 5000) return;

    // If there's already more stuff in the queue, loop.
    if (this.ingestQueue.length > 0) {
      this.findNextJob();
      return;
    }

    // Wait until callstack is empty to check if we should finalise this body of work
    setTimeout(() => {
      if (this.ingestQueue.length === 0) {
        if (!this.updatingSubscribers) this.compileComponentUpdates();
        this.cleanup();
      } else {
        // loop more!
        this.findNextJob();
      }
    });
  }

  // ****************** Perform Functions ****************** //
  private performPublicDataUpdate(job: Job): void {
    this.writeToPublicObject(job.collection, 'data', job.property, job.value);
    this.completedJob(job);
  }

  private performInternalDataUpdate(job: Job): void {
    // if job was not ingested with a value, get the most recent value from collection database
    if (!job.value) {
      if (this.collections[job.collection].internalData[job.property])
        job.value = this.collections[job.collection].internalData[job.property];
      // this would usually be redundant, since the data has not changed, but since the relationController has no access to the collections, but does need to trigger data to rebuild, it issues an internal data "update". It's own data has not changed, but the dynamic data related to it via populate() has.
    }

    // overwrite or insert the data into collection database
    this.overwriteInternalData(
      job.collection,
      job.property as string | number,
      job.value
    );

    // collection function handels ingesting indexes to update itself, since it waits until
    // all internal data has been ingested before handling the affected indexes
    // however for direct data modifications we should update afected indexes
    if (!this.global.collecting) {
      // affected indexes is an array of indexes that have this primary key (job.property) present.
      const affectedIndexes: Array<string> = this.collections[
        job.collection
      ].searchIndexesForPrimaryKey(job.property);

      affectedIndexes.forEach(index => {
        // since this is a singular piece of data that has changed, we do not need to
        // rebuild the entire group, so we can soft rebuild
        let modifiedGroup = this.collections[
          job.collection
        ].softUpdateGroupData(job.property, index);

        this.ingest({
          type: JobType.SOFT_GROUP_UPDATE,
          collection: job.collection,
          value: modifiedGroup,
          property: index,
          dep: this.global.getDep(index, job.collection)
          // we do not need a previousValue because groups are cached outputs and reversing the internal data update will do the trick
        });
      });
    }

    this.completedJob(job);
  }

  private performInternalDataDeletion(job: Job): void {
    const c = this.collections[job.collection];
    // preserve previous value
    // job.previousValue = { ...c.internalData[job.property] };
    // delete data
    delete c.internalData[job.property];
    // find indexes affected by this data deletion
    const indexesToUpdate = this.collections[
      job.collection
    ].searchIndexesForPrimaryKey(job.collection, job.property);

    // for each found index, perform index update
    for (let i = 0; i < indexesToUpdate.length; i++) {
      const indexName = indexesToUpdate[i];
      const newIndex = [...c.indexes.object[indexName]].filter(
        id => id !== job.property
      );
      this.ingest({
        type: JobType.INDEX_UPDATE,
        collection: c.name,
        property: indexName,
        value: newIndex,
        dep: this.global.getDep(job.property, job.collection)
      });
    }
    this.completedJob(job);
  }

  private performIndexUpdate(job: Job): void {
    // Update Index
    this.collections[job.collection].indexes.privateWrite(
      job.property,
      job.value
    );
    this.completedJob(job);

    // Group must also be updated
    this.ingest({
      type: JobType.GROUP_UPDATE,
      collection: job.collection,
      property: job.property,
      dep: this.global.getDep(job.property, job.collection)
    });
  }

  private performGroupRebuild(job: Job): void {
    // soft group rebuilds already have a generated value, otherwise generate the value
    if (!job.value) {
      job.value = this.collections[job.collection].buildGroupFromIndex(
        job.property
      );
    }

    // TODO: trigger relaction controller to update group relations
    // this.global.relations.groupModified(job.collection, job.property);

    this.writeToPublicObject(job.collection, 'group', job.property, job.value);
    this.completedJob(job);
  }

  public performComputedOutput(job: Job): void {
    const computed =
      typeof job.property === 'string'
        ? this.collections[job.collection].computed[job.property]
        : job.property;

    job.value = computed.run();
    // Commit Update
    this.writeToPublicObject(
      job.collection,
      'computed',
      computed.name,
      job.value
    );
    this.completedJob(job);
  }

  // ****************** Handlers ****************** //

  private completedJob(job: Job): void {
    // if action is running, save that action instance inside job payload
    job.fromAction = this.runningAction;
    // during runtime log completed job ready for component updates
    if (this.global.initComplete) this.completedJobs.push(job);
    // if data is persistable ensure storage is updated with new data
    this.persistData(job);

    // tell the dep the parent changed
    if (job.dep) job.dep.changed(job.value, job.config);

    // if running action save this job inside the action class
    if (this.runningAction) (this.runningAction as Action).changes.add(job);
  }

  // ****************** End Runtime Events ****************** //

  private compileComponentUpdates(): void {
    if (!this.global.initComplete) return;
    this.updatingSubscribers = true;
    this.global.log('ALL JOBS COMPLETE', this.completedJobs);
    this.global.log('Updating components...');

    const componentsToUpdate = {};

    // for all completed jobs
    for (let i = 0; i < this.completedJobs.length; i++) {
      const job = this.completedJobs[i];

      // if job has a Dep class present
      // Dep class contains subscribers to that property (as a completed job)
      if (job.dep) {
        let subscribers: Array<any> = job.dep.subscribers;

        // for all the subscribers
        for (let i = 0; i < subscribers.length; i++) {
          // add to componentsToUpdate (ensuring update & component is unique)
          const uuid = subscribers[i].componentUUID;
          const key = subscribers[i].key;
          // below is a band-aid, caused by (what I believe to be) deep reactive properties submitting several updates for the same mutation, one for each level deep, since the parent is triggered as well
          // if (!key) continue;

          // if this component isn't already registered for this particular update, add it.
          if (!componentsToUpdate[uuid]) {
            componentsToUpdate[uuid] = {};
            componentsToUpdate[uuid][key] = job.value;
            // otherwise add the update to the component
          } else {
            componentsToUpdate[uuid][key] = job.value;
          }
        }
      }
    }

    this.updateSubscribers(componentsToUpdate);
    this.completedJobs = [];
  }

  private updateSubscribers(componentsToUpdate) {
    // console.log('updating subscribers', componentsToUpdate);
    const componentKeys = Object.keys(componentsToUpdate);
    for (let i = 0; i < componentKeys.length; i++) {
      const componentID = componentKeys[i];
      const componentInstance = this.global.subs.componentStore[componentID];
      if (!componentInstance || !componentInstance.instance) return;
      const propertiesToUpdate = componentsToUpdate[componentID];
      const dataKeys = Object.keys(propertiesToUpdate);
      // Switch depending on framework

      switch (this.global.config.framework) {
        case 'vue':
          dataKeys.forEach(property => {
            const value = propertiesToUpdate[property];
            componentInstance.instance.$set(
              componentInstance.instance,
              property,
              // this prevents vue from adding getters/setters to any objects, but might be wasteful computation
              // considering this is not important and does not change perfomance, its probably best to not bother cleansing every
              // value update. actually thinking about it this is terrbile. remove this soon.
              // honestly it's only here because I have OCD.
              // cleanse(value)
              value
            );
          });
          break;
        case 'react':
          componentInstance.instance.setState(propertiesToUpdate);
          // console.log(propertiesToUpdate);
          break;

        default:
          break;
      }
    }
  }

  private persistData(job: Job): void {
    if (job.type === JobType.INTERNAL_DATA_MUTATION) return;
    if (this.collections[job.collection].persist.includes(job.property)) {
      this.global.storage.set(job.collection, job.property, job.value);
    }
  }

  private cleanup(): void {
    setTimeout(() => {
      this.updatingSubscribers = false;
    });
  }

  // ****************** Misc Handlers ****************** //

  private writeToPublicObject(
    collectionName: string,
    type: string,
    key: string,
    value: any
  ): void {
    try {
      if (type === 'indexes') {
        if (!this.collections[collectionName][type].object.hasOwnProperty(key))
          return;
        this.collections[collectionName][type].privateWrite(key, value);
      } else {
        if (!this.collections[collectionName].public.object.hasOwnProperty(key))
          return;
        this.collections[collectionName].public.privateWrite(key, value);
      }
    } catch (e) {}
  }

  private overwriteInternalData(
    collection: string,
    primaryKey: string | number,
    newData: any
  ): object | boolean {
    const internalData = this.collections[collection].internalData;
    // create a copy of the original data
    const currentData = internalData[primaryKey]
      ? { ...internalData[primaryKey] }
      : false;

    if (currentData) {
      // data already exists, merge objects and return previous object
      const keys = Object.keys(newData || {});
      for (let i = 0; i < keys.length; i++) {
        const property = keys[i];
        internalData[primaryKey][property] = newData[property];
      }
      return currentData;
    } else {
      // data does not exist, write and return false
      internalData[primaryKey] = newData;
      return false;
    }
  }
}
