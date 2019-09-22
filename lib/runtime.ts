import { log, objectLoop, log, cleanse } from './helpers';
import { Job, Global } from './interfaces';
import Dep from './Dep';
import Computed from './computed';

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
  public running: Boolean = false;
  public updatingSubscribers: Boolean = false;

  private ingestQueue: Array<Job> = [];
  private completedJobs: Array<Job> = [];
  private archivedJobs: Array<Job> = [];

  // private collections: Object;
  private config: Object;

  // T wan is the best
  constructor(private collections: Object, private global: Global) {
    global.ingest = this.ingest.bind(this);
    global.ingestDependents = this.ingestDependents.bind(this);
    this.config = global.config;
  }

  // The primary entry point for Runtime, all jobs should come through here
  public ingest(job: Job): void {
    // if (job.property instanceof Computed) console.log(job);

    this.ingestQueue.push(job);

    if (!this.running) {
      this.findNextJob();
    }
  }

  private findNextJob() {
    this.running = true;
    // shift the next job from the queue
    let next = this.ingestQueue.shift();

    if (!next.dep)
      // groups, computed and indexes will not have their Dep class, so get it.
      next.dep = this.global.getDep(next.property, next.collection);

    // execute the next task in the queue
    this.performJob(next);
  }

  private performJob(job: Job): void {
    switch (job.type) {
      case JobType.PUBLIC_DATA_MUTATION:
        this.performPublicDataUpdate(job);
        this.collections[job.collection].runWatchers(job.property);
        break;
      case JobType.INTERNAL_DATA_MUTATION:
        this.performInternalDataUpdate(job);
        break;
      case JobType.INDEX_UPDATE:
        this.performIndexUpdate(job);
        break;
      case JobType.COMPUTED_REGEN:
        this.performComputedOutput(job);
        this.collections[job.collection].runWatchers(job.property.name);
        break;
      case JobType.GROUP_UPDATE:
        this.performGroupRebuild(job);
        this.collections[job.collection].runWatchers(job.property);
        break;
      case JobType.SOFT_GROUP_UPDATE:
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
    if (job.dep && job.dep.dependents.size > 0)
      this.ingestDependents(job.dep.dependents);

    this.finished();
  }

  public ingestDependents(dependents: Set<any>): void {
    dependents.forEach(dependent => {
      if (dependent instanceof Computed) {
        this.ingest({
          type: JobType.COMPUTED_REGEN,
          collection: dependent.collection,
          property: dependent,
          dep: this.global.getDep(dependent.name, dependent.collection)
        });

        // if a Dep is within a Dep it should be for internal data within a colleciton
      } else if (dependent instanceof Dep && dependent.type === 'internal') {
        this.ingest({
          type: JobType.INTERNAL_DATA_MUTATION,
          collection: dependent.colleciton.name,
          property: dependent.propertyName
        });
      }
    });
  }

  // Hello, if you can read this message, then you are okay.

  // handle job loop flow
  private finished(): void {
    this.running = false;
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

    // overwrite or insert the data into collection database saving the previous value to job.previousValue, since this.overwriteInternalData returns it.
    job.previousValue = this.overwriteInternalData(
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
    job.previousValue = { ...c.internalData[job.property] };
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
    // preserve old index
    job.previousValue = this.collections[job.collection].indexes[job.property];
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
    // console.log(job);

    // if action is running, save that action instance inside job payload
    job.fromAction = this.global.runningAction;
    // during runtime log completed job ready for component updates
    if (this.global.initComplete) this.completedJobs.push(job);
    // if data is persistable ensure storage is updated with new data
    this.persistData(job);
    // update dynamic relations
    if (job.dep) {
      // this.global.relations.update(job.dep.dynamicRelation);
    }
  }

  // ****************** End Runtime Events ****************** //

  private compileComponentUpdates(): void {
    if (!this.global.initComplete) return;
    this.updatingSubscribers = true;
    log('ALL JOBS COMPLETE', this.completedJobs);
    log('Updating components...');

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
              cleanse(value)
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
    collection: string,
    type: string,
    key: string,
    value: any
  ): void {
    if (type === 'indexes') {
      if (!this.collections[collection][type].object.hasOwnProperty(key))
        return;
      this.collections[collection][type].privateWrite(key, value);
    } else {
      if (!this.collections[collection].public.object.hasOwnProperty(key))
        return;
      this.collections[collection].public.privateWrite(key, value);
    }
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
