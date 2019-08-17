import { log, objectLoop, log } from './helpers';
import { JobType, Job, Global } from './interfaces';

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
    global.searchIndexes = this.searchIndexes.bind(this);
    this.config = global.config;
  }

  public ingest(job: Job): void {
    // if (
    //   job.property === 'feed' &&
    //   job.type === JobType.INDEX_UPDATE &&
    //   job.value.length > 60
    // )
    //   debugger;

    this.ingestQueue.push(job);
    if (!this.running) {
      this.findNextJob();
    }
  }

  private findNextJob() {
    this.running = true;
    let next = this.ingestQueue.shift();

    // non public data properties such as groups, computed and indexes will not have their dep, so get it.
    if (!next.dep)
      next.dep = this.collections[next.collection].public.getDep(next.property);

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
      case JobType.BULK_INTERNAL_DATA_MUTATION:
        // this.performInternalDataUpdate(collection, property, value);
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

    // unpack dependent computed
    if (job.dep && job.dep.dependents.size > 0) {
      // log(`Queueing ${dep.dependents.size} dependents`);
      job.dep.dependents.forEach(computed => {
        // get dep from public computed output
        this.ingest({
          type: JobType.COMPUTED_REGEN,
          collection: computed.collection,
          property: computed,
          dep: this.collections[computed.collection].public.getDep(
            computed.name
          )
        });
      });
    }
    this.finished();
  }

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

  // Jobs runtime can perform
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
    // only look for indexes if we're not collecting data

    if (this.global.collecting) {
      // dependecies handled by master collection
    } else {
      //handle dependecies here
    }

    // find and ingest direct depenecies on data
    this.global.relations.internalDataModified(job.collection, job.property);

    this.findIndexesToUpdate(job.collection, job.property);
    this.completedJob(job);
  }

  private performInternalDataDeletion(job: Job): void {
    const c = this.collections[job.collection];
    // preserve previous value
    job.previousValue = { ...c.internalData[job.property] };
    // delete data
    delete c.internalData[job.property];
    // find indexes affected by this data deletion
    const indexesToUpdate = this.searchIndexes(job.collection, job.property);

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
        dep: this.collections[job.collection].public.getDep(job.property)
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
      dep: this.collections[job.collection].public.getDep(job.property)
    });
  }
  private performGroupRebuild(job: Job): void {
    job.value = this.collections[job.collection].buildGroupFromIndex(
      job.property
    );
    this.ingestForeignRelatedGroups(job.collection, job.property);
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

  // Handlers for committing updates
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

  private completedJob(job: Job): void {
    job.fromAction = this.global.runningAction;
    if (this.global.initComplete) this.completedJobs.push(job);
    this.persistData(job);
  }

  private compileComponentUpdates(): void {
    if (!this.global.initComplete) return;
    this.updatingSubscribers = true;
    log('ALL JOBS COMPLETE', this.completedJobs);
    log('Updating components...');

    const componentsToUpdate = {};

    const subscribe = (value, subscribers) => {
      for (let i = 0; i < subscribers.length; i++) {
        const uuid = subscribers[i].componentUUID;
        const key = subscribers[i].key;
        if (!componentsToUpdate[uuid]) {
          componentsToUpdate[uuid] = {};
          componentsToUpdate[uuid][key] = value;
        } else {
          componentsToUpdate[uuid][key] = value;
        }
      }
    };

    for (let i = 0; i < this.completedJobs.length; i++) {
      const job = this.completedJobs[i];
      if (job.dep) subscribe(job.value, job.dep.subscribers);
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

  private findIndexesToUpdate(collection, keys): void {
    const foundIndexes = new Set();
    const c = this.collections[collection];

    if (!Array.isArray(keys)) keys = [keys];

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const searchIndexes = this.searchIndexes(collection, key);
      searchIndexes.forEach(index => foundIndexes.add(index));
    }

    // foundIndexes.forEach((index: string) => {
    //   this.ingest({
    //     type: JobType.INDEX_UPDATE,
    //     collection: c.name,
    //     property: index,
    //     dep: this.collections[c.name].indexes.getDep(index)
    //   });
    // });
  }
  // when groups are rebuilt, find other groups that are dependent on this group
  // (defined using "hasMany" in the model) and ingest those groups into the queue.
  private ingestForeignRelatedGroups(collection: string, groupName: string) {
    let relations = this.collections[collection].foreignGroupRelations;
    objectLoop(relations, (relationKey, relation) => {
      if (relationKey === groupName)
        this.ingest({
          type: JobType.GROUP_UPDATE,
          collection: relation.collection,
          property: relation.groupToRegen,
          dep: this.collections[relation.collection].public.getDep(
            relation.groupToRegen
          )
        });
    });
  }

  private searchIndexes(
    collection: string,
    primaryKey: string | number
  ): Array<string> {
    const c = this.collections[collection];
    const keys = Object.keys(c.indexes.object);

    let foundIndexes = [];
    for (let i = 0; i < keys.length; i++) {
      const indexName = keys[i];
      if (c.indexes.object[indexName].includes(primaryKey))
        foundIndexes.push(indexName);
    }
    return foundIndexes;
  }

  private overwriteInternalData(
    collection: string,
    primaryKey: string | number,
    newData: any
  ): object | boolean {
    const currentData = Object.assign(
      {},
      this.collections[collection].internalData[primaryKey]
    );
    if (currentData[primaryKey]) {
      // data already exists, merge objects and return previous object
      const keys = Object.keys(newData);
      for (let i = 0; i < keys.length; i++) {
        const property = keys[i];
        this.collections[collection].internalData[primaryKey][property] =
          newData[property];
      }
      return currentData;
    } else {
      // data does not exist, write and return false
      this.collections[collection].internalData[primaryKey] = newData;
      return false;
    }
  }
}
