import { log, objectLoop, log } from './helpers';
import { Job, Global } from './interfaces';
import Dep from './Dep';

export enum JobType {
  PUBLIC_DATA_MUTATION = 'PUBLIC_DATA_MUTATION',
  INTERNAL_DATA_MUTATION = 'INTERNAL_DATA_MUTATION',
  INDEX_UPDATE = 'INDEX_UPDATE',
  COMPUTED_REGEN = 'COMPUTED_REGEN',
  GROUP_UPDATE = 'GROUP_UPDATE',
  DEEP_PUBLIC_DATA_MUTATION = 'DEEP_PUBLIC_DATA_MUTATION',
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

  constructor(private collections: Object, private global: Global) {
    global.ingest = this.ingest.bind(this);
    this.config = global.config;
  }

  // The primary entry point for Runtime, all jobs should come through here
  public ingest(job: Job): void {
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
      case JobType.DELETE_INTERNAL_DATA:
        this.performInternalDataDeletion(job);
        break;
      default:
        break;
    }

    // unpack dependents
    if (job.dep && job.dep.dependents.size > 0) {
      // log(`Queueing ${dep.dependents.size} dependents`);
      job.dep.dependents.forEach(computed => {
        // get dep from public computed output
        this.ingest({
          type: JobType.COMPUTED_REGEN,
          collection: computed.collection,
          property: computed,
          dep: this.global.getDep(computed.name, computed.collection)
        });
      });
    }
    this.finished();
  }

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
    job.previousValue = this.overwriteInternalData(
      job.collection,
      job.property,
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
          type: JobType.GROUP_UPDATE,
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
    // if action is running, save that action instance inside job payload
    job.fromAction = this.global.runningAction;
    // during runtime log completed job ready for component updates
    if (this.global.initComplete) this.completedJobs.push(job);
    // if data is persistable ensure storage is updated with new data
    this.persistData(job);
    // inform Dep class that the job is complete
    if (job.dep) (job.dep as Dep).changed();
    // inform the collection that the job is complete
    this.collections[job.collection].changed(job.property);
    // if either of these contain tickets, the relation controller will ingest updates
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
          if (!componentsToUpdate[uuid]) {
            componentsToUpdate[uuid] = {};
            componentsToUpdate[uuid][key] = job.value;
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
      const keys = Object.keys(newData);
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
