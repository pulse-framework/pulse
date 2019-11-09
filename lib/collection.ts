import {
  assert,
  defineConfig,
  validateNumber,
  collectionFunctions,
  objectLoop,
  key
} from './helpers';
import Reactive from './reactive';
import Action from './action';
import Computed from './computed';
import Dep from './dep';
import { JobType } from './runtime';
import {
  Methods,
  Keys,
  CollectionObject,
  CollectionConfig,
  Global,
  ExpandableObject
} from './interfaces';
import { RelationTypes, Key } from './relationController';

export default class Collection {
  private namespace: CollectionObject;
  public public: Reactive;
  public indexes: Reactive;
  public config: CollectionConfig = {};
  public keys: Keys = {};
  public methods: Methods = {};

  public actions: { [key: string]: Action } = {};
  public computed: { [key: string]: Computed } = {};
  public watchers: { [key: string]: any } = {};
  public externalWatchers: { [key: string]: any } = {};
  public persist: Array<string> = [];
  public local: { [key: string]: any } = {};
  public model: { [key: string]: any } = {};
  public throttles: Array<Action> = [];
  public onReady?: Function;
  public collectionSize: number = 0;
  public primaryKey: string | number | boolean = false;

  private internalData: object = {};
  public internalDataDeps: object = {}; // this contains the dep classes for all internal data
  private internalDataWithPopulate: Array<string> = [];

  dispatch: void;

  constructor(
    public name: string,
    protected global: Global,
    public root: CollectionObject
  ) {
    this.config = root.config;
    this.dispatch = this.global.dispatch;

    // legacy support ("filters" changed to "computed")
    root.computed = { ...root.computed, ...root.filters };

    root = this.prepareNamespace(root);

    if (root.onReady) this.onReady = root.onReady;
    this.initReactive(root.data, root.groups);
    this.initRoutes(root.routes);
    this.initActions(root.actions);
    this.initWatchers(root.watch);
    this.initComputed(root.computed);

    this.initModel(root.model);
    this.initPersist(root.persist);
  }

  prepareNamespace(root: CollectionObject) {
    // map collection methods
    collectionFunctions.map(
      func => (this.methods[func] = this[func].bind(this))
    );

    if (root.local) this.local = root.local;

    // for each type set default and register keys
    ['data', 'actions', 'computed', 'indexes', 'routes', 'watch'].forEach(
      type => {
        if (type !== 'indexes' && !root[type]) root[type] = {};
        this.keys[type] =
          type === 'indexes' ? root['groups'] || [] : Object.keys(root[type]);
      }
    );

    // assign namespace, this is used by initReactive
    this.namespace = Object.assign(
      Object.create({ ...this.methods }), // bind methods to prototype
      {
        routes: {},
        indexes: {},
        actions: root.actions,
        ...root.computed,
        ...root.data,
        ...this.normalizeGroups(root.groups)
      }
    );
    return root;
  }

  // groups are defined by the user as an array of strings, this converts them into object/keys
  normalizeGroups(groupsAsArray: any = []) {
    const groups: object = {};
    for (let i = 0; i < groupsAsArray.length; i++) {
      const groupName = groupsAsArray[i];
      groups[groupName] = [];
    }
    return groups;
  }

  runWatchers(property) {
    const watcher = this.watchers[property];
    if (watcher) watcher();
    const externalWatchers = this.externalWatchers[property];
    if (externalWatchers)
      externalWatchers.forEach(func =>
        typeof func === 'function' ? func() : false
      );
  }

  initReactive(data: object = {}, groups: Array<any> | object = []) {
    // Make indexes reactive
    this.indexes = new Reactive(
      this.normalizeGroups(groups), // object
      this.global, // global
      this, // collection
      this.keys.indexes, // mutable
      'indexes' // type
    );
    this.namespace.indexes = this.indexes.object;

    // Make entire public object Reactive
    this.public = new Reactive(
      this.namespace,
      this.global,
      this,
      [...this.keys.data, ...this.keys.indexes],
      'root'
    );
  }

  public initPersist(persist: Array<string>): void {
    if (!Array.isArray(persist)) return;

    for (let i = 0; i < persist.length; i++) {
      const dataName = persist[i];

      // register this
      this.persist.push(dataName);

      if (this.global.storage.isPromise) {
        this.global.storage.get(this.name, dataName).then(data => {
          if (data === undefined || data === null) return;
          this.global.ingest({
            type: JobType.PUBLIC_DATA_MUTATION,
            value: data,
            property: dataName,
            collection: this.name,
            dep: this.global.getDep(dataName, this.name)
          });
        });
      } else {
        let data = this.global.storage.get(this.name, dataName);
        if (data === undefined || data === null) continue;
        this.public.privateWrite(dataName, data);
      }
    }
  }

  initActions(actions: object = {}) {
    let actionKeys = Object.keys(actions);
    for (let i = 0; i < actionKeys.length; i++) {
      const action = actions[actionKeys[i]];
      this.actions[actionKeys[i]] = new Action(
        this.name,
        this.global,
        action,
        actionKeys[i]
      );

      this.public.privateWrite(actionKeys[i], this.actions[actionKeys[i]].exec);
    }
  }

  initWatchers(watchers: object = {}) {
    let watcherKeys = Object.keys(watchers);
    for (let i = 0; i < watcherKeys.length; i++) {
      const watcher = watchers[watcherKeys[i]];
      this.watchers[watcherKeys[i]] = () => {
        this.global.runningWatcher = {
          collection: this.name,
          property: watcherKeys[i]
        };
        const watcherOutput = watcher(this.global.getContext(this.name));
        this.global.runningWatcher = false;
        return watcherOutput;
      };
    }
    this.watchers._keys = watcherKeys;
  }

  initComputed(computed: object): void {
    objectLoop(
      computed,
      (computedName: string, computedFunction: () => void) => {
        this.computed[computedName] = new Computed(
          this.global,
          this.name,
          computedName,
          computedFunction
        );
        this.public.object[computedName] = [];
      },
      this.keys.computed
    );
  }

  initRoutes(routes: ExpandableObject) {
    const self = this;
    const routeWrapped = routeName => {
      return function() {
        let requestObject = Object.assign({}, self.global.request);
        requestObject.context = self.global.getContext();
        return routes[routeName].apply(
          null,
          [requestObject].concat(Array.prototype.slice.call(arguments))
        );
      };
    };
    objectLoop(
      routes,
      routeName =>
        (this.public.object.routes[routeName] = routeWrapped(routeName))
    );
  }

  initModel(model = {}) {
    this.model = model;
    Object.keys(model).forEach(property => {
      Object.keys(model[property]).forEach(config => {
        switch (config) {
          case 'primaryKey':
            this.primaryKey = property;
            break;
          case 'populate':
            this.internalDataWithPopulate.push(property);
            break;
        }
      });
    });
  }

  private getData(id) {
    return { ...this.internalData[id] };
  }

  public buildGroupFromIndex(groupName: string): Array<number> {
    const constructedArray = [];
    // get index directly
    let index = this.indexes.privateGet(groupName);
    if (!index) return [];

    // for every primaryKey in the index
    for (let i = 0; i < index.length; i++) {
      // primaryKey of data
      let id = index[i];
      // copy data from internal database
      let data = this.getData(id);
      // if none found skip
      if (!data) continue;
      // inject dynamic data
      data = this.injectDynamicRelatedData(id, data);

      constructedArray.push(data);
    }
    return constructedArray;
  }

  // rebuilding an entire group is expensive on resources, but is
  // not nessisary if only one piece of data has changed
  // this function will replace a single piece of data without rebuilding
  // the entire group
  public softUpdateGroupData(
    primaryKey: string | number,
    groupName: string
  ): Array<any> {
    let index: Array<any> = this.indexes.privateGet(groupName);

    // find the data's position within index
    let position: number = index.indexOf(primaryKey);

    // if group is dynamic, just build the group from index.
    if (!this.public[groupName]) return this.buildGroupFromIndex(groupName);

    // copy the current group output
    let currentGroup: Array<any> = [this.public[groupName]];

    // get data for primaryKey
    let data: { [key: string]: any } = { ...this.internalData[primaryKey] };

    data = this.injectDynamicRelatedData(primaryKey, data);

    // replace at known position with updated data
    currentGroup[position] = data;

    return currentGroup;
  }

  // This should be called on every piece of data retrieved when building a group from an index
  private injectDynamicRelatedData(
    primaryKey: string | number,
    data: { [key: string]: any }
  ): any {
    // for each populate function extracted from the model for this data
    this.internalDataWithPopulate.forEach(property => {
      const dep = this.global.getDep(primaryKey, this.name, true);
      this.global.runningPopulate = dep;
      // run populate function passing in the context and the data
      const populated = this.model[property].populate(
        this.global.getContext(),
        data
      );

      this.global.runningPopulate = false;
      // inject result to data
      data[property] = populated;
    });
    return data;
  }

  public createGroups(group) {
    if (group === undefined) group = [];
    else if (!Array.isArray(group)) group = [group];

    for (let i = 0; i < group.length; i++) {
      const groupName = group[i];
      if (!this.indexes.exists(groupName)) {
        this.indexes.addProperty(groupName, []);
        // this.indexes.privateWrite(groupName, []);
      }
    }
    return group;
  }

  private getPreviousIndexValues(groups) {
    const returnData = {};
    for (let i = 0; i < groups; i++) {
      const groupName = groups[i];
      returnData[groupName] = this.indexes.privateGet(groupName);
    }
    return returnData;
  }

  private findPrimaryKey(dataItem) {
    if (dataItem.hasOwnProperty('id')) this.primaryKey = 'id';
    else if (dataItem.hasOwnProperty('_id')) this.primaryKey = '_id';
    else if (dataItem.hasOwnProperty('key')) this.primaryKey = 'key';
    if (this.primaryKey) return true;
    else return assert(warn => warn.NO_PRIMARY_KEY);
  }
  // if a computed function evaluates and creates a relation to internal data
  // that does not exist yet, we create the dep class and save it in advance
  // so that if the data ever arrives, it will reactively dependent update accordingly
  private depForInternalData(primaryKey: string | number): Dep {
    let dep: Dep;
    // debugger;
    if (!this.internalDataDeps[primaryKey]) {
      dep = new Dep(this.global, 'internal', this, primaryKey);
      this.internalDataDeps[primaryKey] = dep;
    } else {
      dep = this.internalDataDeps[primaryKey];
    }
    return dep;
  }

  // search the collection for the appropriate dep for a given group
  // consider relacting this with a more absolute
  private depForGroup(groupName: string): Dep {
    let dep: Dep;
    // no group is found publically, use index instead
    if (this.public.exists(groupName)) {
      dep = this.global.getDep(groupName, this.name);
    } else if (this.indexes.exists(groupName)) {
      dep = this.global.getDep(groupName, this.indexes.object);
    } else {
      dep = this.indexes.tempDep(groupName);
    }
    return dep;
  }

  replaceIndex(indexName: string, newIndex: Array<string | number>) {
    if (!Array.isArray(newIndex) || typeof indexName !== 'string')
      return assert(warn => warn.INVALID_PARAMETER, 'replaceIndex');
    this.global.ingest({
      type: JobType.INDEX_UPDATE,
      collection: this.name,
      property: indexName,
      value: newIndex
    });
  }

  // METHODS

  public collect(
    data,
    group?: string | Array<string>,
    config?: ExpandableObject
  ) {
    config = defineConfig(config, {
      append: true
    });
    this.global.collecting = true;
    // normalise data
    if (!Array.isArray(data)) data = [data];

    // if groups don't already exist, create them dynamically
    const groups: Array<string> = this.createGroups(group);
    // groups now contains just the groups directly modified by this collect

    // preserve index previous values
    const previousIndexValues: object = this.getPreviousIndexValues(groups);

    const indexesToRegenOnceComplete = new Set();

    // process data items
    for (let i = 0; i < data.length; i++) {
      const dataItem = data[i];

      if (dataItem === null) continue;
      // process data item returns "success" as a boolean and affectedIndexes as an array
      const processDataItem = this.processDataItem(dataItem, groups, config);

      if (!processDataItem) continue;

      if (processDataItem.success) this.collectionSize++;
      // ensure indexes modified by this data item are waiting to be ingested for regen
      processDataItem.affectedIndexes.forEach(index =>
        indexesToRegenOnceComplete.add(index)
      );
    }

    indexesToRegenOnceComplete.forEach(index => {
      this.global.ingest({
        type: JobType.INDEX_UPDATE,
        collection: this.name,
        property: index,
        value: this.indexes.privateGet(index),
        previousValue: previousIndexValues[index],
        dep: this.global.getDep(index, this.indexes.object)
      });
    });

    this.global.collecting = false;
  }

  private processDataItem(
    dataItem: object,
    groups: Array<string> = [],
    config
  ) {
    if (!this.primaryKey) this.findPrimaryKey(dataItem);

    if (!this.primaryKey) return false;

    const key = dataItem[this.primaryKey as number | string];

    // find affected indexes
    let affectedIndexes = [...groups];

    // searchIndexesForPrimaryKey returns an array of indexes that include that primaryKey
    // for each index found, if it is not already known, add to affected indexes
    this.searchIndexesForPrimaryKey(key).map(
      index => !affectedIndexes.includes(index) && affectedIndexes.push(index)
    );

    // validate against model

    // create the dep class
    if (!this.internalDataDeps[key])
      this.internalDataDeps[key] = new Dep(this.global, 'internal', this, key);

    // ingest the data
    this.global.ingest({
      type: JobType.INTERNAL_DATA_MUTATION,
      collection: this.name,
      property: key,
      value: dataItem,
      dep: this.internalDataDeps[key]
    });

    // add the data to group indexes
    for (let i = 0; i < groups.length; i++) {
      const groupName = groups[i];
      let index = this.indexes.privateGet(groupName);

      // remove key if already present in index
      index = index.filter(k => k != key);

      if (config.append) index.push(key);
      else index.unshift(key);

      // write index
      this.indexes.privateWrite(groupName, index);
    }
    return { success: true, affectedIndexes };
  }

  private searchIndexesForPrimaryKey(
    primaryKey: string | number
  ): Array<string> {
    // get a fresh copy of the keys to include dynamic indexes
    const keys = this.indexes.getKeys();

    let foundIndexes: Array<string> = [];

    // for every index
    for (let i = 0; i < keys.length; i++) {
      const indexName = keys[i];

      // if the index includes the primaryKey
      if (this.indexes.privateGet(indexName).includes(primaryKey))
        foundIndexes.push(indexName);
    }
    return foundIndexes;
  }

  // return a piece of intenral data from the collection
  // can create dynamic relationships when used in certain circumstances
  public findById(id: string | number): { [key: string]: any } {
    let internalDep: Dep = this.depForInternalData(id);

    // if used in computed function, create a dynamic relation
    if (this.global.runningComputed) {
      let computed = this.global.runningComputed as Computed;
      this.global.relations.relate(computed, internalDep);
    }

    // if used in populate() function, create a dynamic relation
    if (this.global.runningPopulate) {
      let populate = this.global.runningPopulate as Dep;
      this.global.relations.relate(populate, internalDep);
    }

    return this.internalData[id];
  }

  // return a group of data from a collection
  // can create dynamic relationships when used in certain circumstances
  public getGroup(property): Array<any> {
    let groupDep: Dep = this.depForGroup(property);

    // if used in computed function, create a dynamic relation
    if (this.global.runningComputed) {
      let computed: Computed = this.global.runningComputed as Computed;
      this.global.relations.relate(computed, groupDep);
    }

    // if used in populate() function, create a dynamic relation
    if (this.global.runningPopulate) {
      let dataDep: Dep = this.global.runningPopulate as Dep;
      this.global.relations.relate(dataDep, groupDep);
    }

    // get group is not cached, so generate a fresh group from the index
    return this.buildGroupFromIndex(property) || [];
  }

  // action functions
  undo(action: Action) {
    // runtime stores changes in action
    action.changes.forEach(job => {
      if (job.hasOwnProperty('previousValue')) {
        const currentValue = job.value;
        job.value = job.previousValue;
        job.previousValue = currentValue;
        this.global.ingest(job);
      }
    });
  }

  throttle(amount: number = 0) {
    // if action is currently running save in throttles
    if (this.global.runningAction) {
      this.throttles.push(this.global.runningAction as Action);
    }

    // after the certain amount has possed remove the throttle via filter
    setTimeout(() => {
      this.throttles = this.throttles.filter(
        action => action !== (this.global.runningAction as Action)
      );
    }, amount);
  }

  // group functions
  move(
    ids: number | string | Array<string | number>,
    sourceIndexName: string,
    destIndexName?: string,
    method: 'push' | 'unshift' = 'push'
  ) {
    // validation
    if (!this.indexes.exists(sourceIndexName))
      return assert(warn => warn.INDEX_NOT_FOUND, 'move');

    if (destIndexName && !this.indexes.exists(destIndexName))
      return assert(warn => warn.INDEX_NOT_FOUND, 'move');

    if (!Array.isArray(ids)) ids = [ids];

    let sourceIndex = this.indexes.privateGet(sourceIndexName);
    for (let i = 0; i < ids.length; i++)
      sourceIndex = sourceIndex.filter(id => id !== ids[i]);

    this.global.ingest({
      type: JobType.INDEX_UPDATE,
      collection: this.name,
      property: sourceIndexName,
      value: sourceIndex
    });

    if (destIndexName) {
      let destIndex = this.indexes.privateGet(destIndexName);

      for (let i = 0; i < ids.length; i++) {
        // destIndex = destIndex.filter(k => k != ids[i]);

        if (destIndex.includes(ids[i])) continue;

        // push or unshift id into current index
        destIndex[method](ids[i]);
      }

      this.global.ingest({
        type: JobType.INDEX_UPDATE,
        collection: this.name,
        property: destIndexName,
        value: destIndex
      });
    }
  }

  put(
    ids: number | Array<string | number>,
    destIndexName: string,
    method: 'push' | 'unshift' = 'push'
  ) {
    // validation
    if (!this.indexes.exists(destIndexName))
      return assert(warn => warn.INDEX_NOT_FOUND, 'put');

    if (!Array.isArray(ids)) ids = [ids];

    // get current index
    let destIndex = this.indexes.privateGet(destIndexName);

    // loop over every id user is trying to add into current index
    for (let i = 0; i < ids.length; i++) {
      // destIndex = destIndex.filter(k => k != ids[i]);

      if (destIndex.includes(ids[i])) continue;

      // push or unshift id into current index
      destIndex[method](ids[i]);
    }

    this.global.ingest({
      type: JobType.INDEX_UPDATE,
      collection: this.name,
      property: destIndexName,
      value: destIndex
    });
  }

  newGroup(groupName: string, indexValue?: Array<string | number>) {
    if (this.indexes.object.hasOwnProperty(groupName))
      return assert(warn => warn.GROUP_ALREADY_EXISTS, 'newGroup');

    this.global.ingest({
      type: JobType.INDEX_UPDATE,
      collection: this.name,
      property: groupName,
      value: indexValue
    });
  }
  deleteGroup(groupName: string) {
    this.global.ingest({
      type: JobType.INDEX_UPDATE,
      collection: this.name,
      property: groupName,
      value: []
    });
  }
  removeFromGroup(
    groupName: string,
    itemsToRemove: number | string | Array<number | string>
  ) {
    if (!this.indexes.exists(groupName))
      return assert(warn => warn.INDEX_NOT_FOUND, 'removeFromGroup');

    if (!Array.isArray(itemsToRemove)) itemsToRemove = [itemsToRemove];

    const index = this.indexes.privateGet(groupName);

    const newIndex = index.filter(
      id => !(itemsToRemove as Array<number | string>).includes(id)
    );

    this.global.ingest({
      type: JobType.INDEX_UPDATE,
      collection: this.name,
      property: groupName,
      value: newIndex
    });
  }

  // internal data functions
  update(primaryKey: string | number, newObject: { [key: string]: any }) {
    // if the primary key has changed, we should update it internally for this data
    let updateDataKey = false;
    if (!this.internalData.hasOwnProperty(primaryKey))
      return assert(warn => warn.INTERNAL_DATA_NOT_FOUND, 'update');

    const newObjectKeys = Object.keys(newObject);
    const currentData = Object.assign({}, this.internalData[primaryKey]);

    for (let i = 0; i < newObjectKeys.length; i++) {
      const key = newObjectKeys[i];
      if (key === this.primaryKey) updateDataKey = true;
      currentData[key] = newObject[key];
    }
    this.global.ingest({
      type: JobType.INTERNAL_DATA_MUTATION,
      collection: this.name,
      property: primaryKey,
      value: currentData
    });

    if (updateDataKey)
      this.updateDataKey(
        newObject[primaryKey], // old primary key
        currentData[this.primaryKey as string | number] // new primary key
      );
  }
  increment(
    primaryKey: string | number,
    property: string,
    amount: number,
    decrement?: boolean
  ) {
    if (!this.internalData.hasOwnProperty(primaryKey))
      return assert(
        warn => warn.INTERNAL_DATA_NOT_FOUND,
        decrement ? 'decrement' : 'increment'
      );

    const currentData = Object.assign({}, this.internalData[primaryKey]);

    if (!validateNumber(amount, currentData[property]))
      return assert(
        warn => warn.PROPERTY_NOT_A_NUMBER,
        decrement ? 'decrement' : 'increment'
      );

    if (decrement) currentData[property] -= amount;
    else currentData[property] += amount;

    this.global.ingest({
      type: JobType.INTERNAL_DATA_MUTATION,
      collection: this.name,
      property: primaryKey,
      value: currentData
    });
  }
  decrement(primaryKey: string | number, property: string, amount: number) {
    this.increment(primaryKey, property, amount, true);
  }

  delete(primaryKeys: string | number | Array<string | number>) {
    if (!Array.isArray(primaryKeys)) primaryKeys = [primaryKeys];
    for (let i = 0; i < primaryKeys.length; i++) {
      const primaryKey = primaryKeys[i];
      this.global.ingest({
        type: JobType.DELETE_INTERNAL_DATA,
        collection: this.name,
        property: primaryKey
      });
    }
  }

  updateDataKey(oldKey: string | number, newKey: string | number): void {
    // create copy of data & data dep
    const dataCopy = { ...this.internalData[oldKey] },
      depCopy = { ...this.internalDataDeps[oldKey] };

    // delete old refrences
    delete this.internalData[oldKey];
    delete this.internalDataDeps[oldKey];

    // apply the data and dependency in storage
    this.internalData[newKey] = dataCopy;
    this.internalDataDeps[newKey] = depCopy;
  }

  // remove all dynamic indexes, empty all indexes, delete all internal data
  purge() {}

  // external functions
  watch(property, callback) {
    if (!this.externalWatchers[property])
      this.externalWatchers[property] = [callback];
    else this.externalWatchers[property].push(callback);
  }

  forceUpdate(property: string): void {
    // ensure property exists on collection
    if (this.public.exists(property)) {
      // if property is directly mutable

      if (this.public.mutable.includes(property)) {
        this.global.ingest({
          type: JobType.PUBLIC_DATA_MUTATION,
          property,
          collection: this.name,
          value: this.public.privateGet(property),
          dep: this.global.getDep(property, this.name)
        });

        // if property is a computed method
      } else if (this.computed[property]) {
        this.global.ingest({
          type: JobType.COMPUTED_REGEN,
          property,
          collection: this.name,
          dep: this.global.getDep(property, this.name)
        });
      }
    }
  }

  // deprecate
  // added removeFromGroup to be more specific, params got switched around, keeping this for backwards compatibility
  remove(itemsToRemove, groupName) {
    return this.removeFromGroup(groupName, itemsToRemove);
  }
}
