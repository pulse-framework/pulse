import {
  assert,
  defineConfig,
  validateNumber,
  collectionFunctions,
  objectLoop
} from './helpers';
import Reactive from './reactive';
import Action from './action';
import Computed from './computed';
import {
  Methods,
  Keys,
  CollectionObject,
  CollectionConfig,
  Global,
  JobType,
  ExpandableObject
} from './interfaces';

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

  public collectionSize: number = 0;
  public primaryKey: string | number | boolean = false;

  private internalData: object = {};

  private dataRelations: { [key: string]: any } = {};
  private groupRelations: { [key: string]: any } = {};
  public foreignGroupRelations: { [key: string]: any } = {};

  dispatch: void;

  constructor(
    public name: string,
    protected global: Global,
    root: CollectionObject
  ) {
    this.config = root.config;
    this.dispatch = this.global.dispatch;

    // legacy support
    root.computed = { ...root.computed, ...root.filters };

    root = this.prepareNamespace(root);

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
    groups = this.normalizeGroups(groups);
    // Make indexes reactive
    this.indexes = new Reactive(
      groups, // object
      this.global, // global
      this.name, // collection
      this.keys.indexes, // mutable
      'indexes' // type
    );
    this.namespace.indexes = this.indexes.object;

    // Make entire public object Reactive
    this.public = new Reactive(
      this.namespace,
      this.global,
      this.name,
      [...this.keys.data, ...this.keys.indexes],
      'root'
    );
  }

  initPersist(persist: Array<string>): void {
    if (!Array.isArray(persist)) return;
    for (let i = 0; i < persist.length; i++) {
      const dataName = persist[i];

      // TODO: validate

      this.persist.push(dataName);
      let data = this.global.storage.get(this.name, dataName);
      if (data === undefined || data === null) continue;
      this.public.privateWrite(dataName, data);
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
    Object.keys(model).forEach(property => {
      Object.keys(model[property]).forEach(config => {
        if (config === 'primaryKey') {
          this.primaryKey = property;
        } else if (config === 'type') {
          // if (
          //   [
          //     'string',
          //     'boolean',
          //     'integer',
          //     'number',
          //     'array',
          //     'object'
          //   ].includes(model[property].type)
          // ) {
          //   // model types are properties of the model to type check & validate on collect
          //   if (!this._modelTypes.includes(property)) {
          //     this._modelTypes.push(property);
          //   }
          // }
        } else if (config === 'parent' || config === 'hasOne') {
          this.createDataRelation(
            property,
            model[property].parent || model[property].hasOne,
            model[property].assignTo
          );
        } else if (config === 'has' || config === 'hasMany') {
          this.createGroupRelation(
            property,
            model[property].has || model[property].hasMany,
            model[property].assignTo
          );
        }
      });
    });
  }

  createDataRelation(primaryKeyName, fromCollectionName, assignTo) {
    this.dataRelations[primaryKeyName] = {};
    this.dataRelations[primaryKeyName].fromCollectionName = fromCollectionName;
    if (assignTo) this.dataRelations[primaryKeyName].assignTo = assignTo;
  }

  createGroupRelation(primaryKeyName, fromCollectionName, assignTo) {
    this.groupRelations[primaryKeyName] = {};
    this.groupRelations[primaryKeyName].fromCollectionName = fromCollectionName;
    if (assignTo) this.groupRelations[primaryKeyName].assignTo = assignTo;
  }

  buildGroupFromIndex(groupName: string): Array<number> {
    // console.log(collection, key)
    const constructedArray = [];
    let index = this.indexes.object[groupName];
    for (let i = 0; i < index.length; i++) {
      let id = index[i];
      let data = Object.assign({}, this.internalData[id]);
      if (!data) continue;
      data = this.injectDataByRelation(data);
      data = this.injectGroupByRelation(data, groupName);
      constructedArray.push(data);
    }
    return constructedArray;
  }

  injectDataByRelation(data) {
    // if (data.hasOwnProperty('liveStreamType')) debugger;
    let relations = Object.keys(this.dataRelations);
    if (relations.length > 0)
      for (let i = 0; i < relations.length; i++) {
        const relationKey = relations[i]; // the key on the data to look at
        const rel = this.dataRelations[relationKey]; // an object with fromCollectionName & assignTo
        const assignTo = rel.hasOwnProperty('assignTo')
          ? rel.assignTo
          : rel.fromCollectionName;

        if (data.hasOwnProperty(relationKey)) {
          let foreignData = this.global.getInternalData(
            rel.fromCollectionName,
            data[relationKey]
          );
          data[assignTo] = foreignData;
        }
      }
    return data;
  }

  injectGroupByRelation(data, groupName) {
    let groupRealtions = Object.keys(this.groupRelations);
    if (groupRealtions.length > 0)
      for (let i = 0; i < groupRealtions.length; i++) {
        const relationKey = groupRealtions[i];
        const rel = this.groupRelations[relationKey];

        const assignTo = rel.hasOwnProperty('assignTo') ? rel.assignTo : false;

        if (data.hasOwnProperty(relationKey)) {
          const foreignData = this.global.contextRef[rel.fromCollectionName][
            data[relationKey]
          ];

          if (foreignData) {
            if (assignTo) data[assignTo] = foreignData;
            else data[rel.fromCollectionName] = foreignData;
          }

          // register this relation on the foreign collection for reactive updates
          this.global.createForeignGroupRelation(
            rel.fromCollectionName,
            data[relationKey],
            this.name,
            groupName
          );
        }
      }
    return data;
  }

  createGroups(group) {
    if (group === undefined) group = [];
    else if (!Array.isArray(group)) group = [group];

    for (let i = 0; i < group.length; i++) {
      const groupName = group[i];
      if (!this.indexes.object[groupName]) {
        this.indexes.object[groupName] = [];
      }
    }
    return group;
  }

  // METHODS
  collect(data, group?: string | Array<string>, config?: ExpandableObject) {
    console.log('collecting', data);
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
      // process data item returns "success" as a boolean and affectedIndexes as an array
      const processDataItem = this.processDataItem(dataItem, groups, config);
      if (processDataItem.success) this.collectionSize++;
      // ensure indexes modified by this data item are waiting to be ingested for regen
      processDataItem.affectedIndexes.forEach(index =>
        indexesToRegenOnceComplete.add(index)
      );
    }

    console.log(group, indexesToRegenOnceComplete);

    indexesToRegenOnceComplete.forEach(index => {
      this.global.ingest({
        type: JobType.INDEX_UPDATE,
        collection: this.name,
        property: index,
        value: this.indexes.object[index],
        previousValue: previousIndexValues[index]
      });
    });

    this.global.collecting = false;
  }

  processDataItem(dataItem: object, groups: Array<string> = [], config) {
    if (!this.primaryKey) this.findPrimaryKey(dataItem);

    const key = dataItem[this.primaryKey as number | string];

    // find affected indexes
    let affectedIndexes = [...groups];

    this.global
      .searchIndexes(this.name, key)
      .map(
        index => !affectedIndexes.includes(index) && affectedIndexes.push(index)
      );

    // validate against model

    // ingest the data
    this.global.ingest({
      type: JobType.INTERNAL_DATA_MUTATION,
      collection: this.name,
      property: key,
      value: dataItem
    });

    // add the data to group indexes
    for (let i = 0; i < groups.length; i++) {
      const groupName = groups[i];
      const index = [...this.indexes.object[groupName]];
      if (config.append) index.push(key);
      else index.unshift(key);
      this.indexes.privateWrite(groupName, index);
    }
    return { success: true, affectedIndexes };
  }

  getPreviousIndexValues(groups) {
    const returnData = {};
    for (let i = 0; i < groups; i++) {
      const groupName = groups[i];
      returnData[groupName] = this.indexes.object[groupName];
    }
    return returnData;
  }

  findPrimaryKey(dataItem) {
    if (dataItem.hasOwnProperty('id')) this.primaryKey = 'id';
    else if (dataItem.hasOwnProperty('_id')) this.primaryKey = '_id';
    else if (dataItem.hasOwnProperty('key')) this.primaryKey = 'key';
    if (this.primaryKey) return true;
    else return assert(warn => warn.NO_PRIMARY_KEY);
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

  findById(id) {
    // if (!this.internalData.hasOwnProperty(id))
    //   return assert(warn => warn.INTERNAL_DATA_NOT_FOUND, 'findById');

    if (this.global.runningComputed) {
      let computed = this.global.runningComputed as Computed;
      this.global.relations.createInternalDataRelation(this.name, id, computed);
    }
    return this.internalData[id];
  }

  // action functions
  undo() {}
  throttle() {}

  // group functions
  move(
    ids: number | Array<string | number>,
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

    let sourceIndex = this.indexes.privateGetValue(sourceIndexName);
    for (let i = 0; i < ids.length; i++) sourceIndex.map(id => id !== ids[i]);

    this.global.ingest({
      type: JobType.INDEX_UPDATE,
      collection: this.name,
      property: sourceIndexName,
      value: sourceIndex
    });

    if (destIndexName) {
      let destIndex = this.indexes.privateGetValue(destIndexName);
      for (let i = 0; i < ids.length; i++) destIndex[method](ids[i]);

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

    let destIndex = this.indexes.privateGetValue(destIndexName);
    for (let i = 0; i < ids.length; i++) destIndex[method](ids[i]);

    this.global.ingest({
      type: JobType.INDEX_UPDATE,
      collection: this.name,
      property: destIndexName,
      value: destIndex
    });
  }

  getGroup(property) {
    if (!this.indexes.exists(property))
      return assert(warn => warn.INDEX_NOT_FOUND, 'group') || [];

    if (this.global.runningComputed) {
      let computed = this.global.runningComputed as Computed;
      computed.addRelationToGroup(this.name, property);
    }
    return this.buildGroupFromIndex(property) || [];
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
      return assert(warn => warn.INDEX_NOT_FOUND, 'group');

    if (!Array.isArray(itemsToRemove)) itemsToRemove = [itemsToRemove];

    const index = this.indexes.privateGetValue(groupName);

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
    if (!this.internalData.hasOwnProperty(primaryKey))
      return assert(warn => warn.INTERNAL_DATA_NOT_FOUND, 'update');

    const newObjectKeys = Object.keys(newObject);
    const currentData = Object.assign({}, this.internalData[primaryKey]);

    for (let i = 0; i < newObjectKeys.length; i++) {
      const key = newObjectKeys[i];
      currentData[key] = newObject[key];
    }
    this.global.ingest({
      type: JobType.INTERNAL_DATA_MUTATION,
      collection: this.name,
      property: primaryKey,
      value: currentData
    });
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

  // remove all dynamic indexes, empty all indexes, delete all internal data
  purge() {}

  // external functions
  watch(property, callback) {
    if (!this.externalWatchers[property])
      this.externalWatchers[property] = [callback];
    else this.externalWatchers[property].push(callback);
  }

  // deprecate
  // added removeFromGroup to be more specific, params got switched around, keeping this for backwards compatibility
  remove(itemsToRemove, groupName) {
    return this.removeFromGroup(groupName, itemsToRemove);
  }
}
