import {
  assert,
  defineConfig,
  validateNumber,
  collectionFunctions,
  objectLoop
} from './helpers';
import Reactive from './reactive';
import Action from './action';
import Filter from './filter';
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
  public filters: { [key: string]: Filter } = {};
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

    root = this.prepareNamespace(root);

    this.initReactive(root.data, this.namespace.groups);
    this.initRoutes(root.routes);
    this.initActions(root.actions);
    this.initWatchers(root.watch);
    this.initFilters(root.filters);

    this.initModel(root.model);
    this.initPersist(root.persist);
  }

  prepareNamespace(root: CollectionObject) {
    // map collection methods
    collectionFunctions.map(
      func => (this.methods[func] = this[func].bind(this))
    );

    // for each type set default and register keys
    ['data', 'actions', 'filters', 'indexes', 'routes', 'watch'].forEach(
      type => {
        if (type !== 'indexes' && !root[type]) root[type] = {};
        this.keys[type] =
          type === 'indexes' ? root[type] || [] : Object.keys(root[type]);
      }
    );

    // assign namespace, this is used by initReactive
    this.namespace = Object.assign(
      Object.create({ ...this.methods }), // bind methods to prototype
      {
        routes: {},
        indexes: {},
        actions: root.actions,
        ...root.filters,
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

  initReactive(data: object = {}, groups: object = {}) {
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

  initFilters(filters: object): void {
    this.filters = {};
    objectLoop(
      filters,
      (filterName: string, filterFunction: () => void) => {
        this.filters[filterName] = new Filter(
          this.global,
          this.name,
          filterName,
          filterFunction
        );
        this.public.object[filterName] = [];
      },
      this.keys.filters
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
          [self.global.request].concat(Array.prototype.slice.call(arguments))
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
    let relations = Object.keys(this.dataRelations);
    if (relations.length > 0)
      for (let i = 0; i < relations.length; i++) {
        const relationKey = relations[i];
        const rel = this.dataRelations[relationKey];
        const assignTo = rel.hasOwnProperty('assignTo') ? rel.assignTo : false;

        if (data.hasOwnProperty(relationKey)) {
          let foreignData = this.global.contextRef[rel.fromCollectionName][
            data[relationKey]
          ];

          if (foreignData) {
            if (assignTo) data[assignTo] = foreignData;
            else data[rel.fromCollectionName] = foreignData;
          }
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
    if (!Array.isArray(group)) group = [group];
    for (let i = 0; i < group.length; i++) {
      const groupName = group[i];
      if (!this.indexes.object[groupName]) {
        this.indexes.object[groupName] = [];
      }
    }
    return group;
  }

  // METHODS
  collect(data, group?: string, config?: ExpandableObject) {
    config = defineConfig(config, {
      append: true
    });
    this.global.collecting = true;
    // normalise data
    if (!Array.isArray(data)) data = [data];
    const groups = this.createGroups(group);
    const previousIndexValues = this.getPreviousIndexValues(groups);

    // process data items
    for (let i = 0; i < data.length; i++) {
      const dataItem = data[i];
      const dataProcessed = this.processDataItem(dataItem, groups, config);
      if (dataProcessed) this.collectionSize++;
    }

    // dispatch regen indexes and groups
    for (let i = 0; i < groups.length; i++) {
      const groupName = groups[i];

      // processDataItem takes care of adding the data, submit
      this.global.ingest({
        type: JobType.INDEX_UPDATE,
        collection: this.name,
        property: groupName,
        value: this.indexes.object[groupName],
        previousValue: previousIndexValues[groupName]
      });
    }

    this.global.collecting = false;
  }

  processDataItem(dataItem, groups, config) {
    if (!this.primaryKey) this.findPrimaryKey(dataItem);

    const key = dataItem[this.primaryKey as number | string];

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
    return true;
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
    if (!this.internalData.hasOwnProperty(id))
      return assert(warn => warn.INTERNAL_DATA_NOT_FOUND, 'findById');

    if (this.global.runningFilter) {
      let filter = this.global.runningFilter as Filter;
      filter.addRelationToInternalData(this.name, id);
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

    if (this.global.runningFilter) {
      let filter = this.global.runningFilter as Filter;
      filter.addRelationToGroup(this.name, property);
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

    if (!validateNumber(amount, currentData[primaryKey][property]))
      return assert(
        warn => warn.PROPERTY_NOT_A_NUMBER,
        decrement ? 'decrement' : 'increment'
      );

    if (decrement) currentData[primaryKey][property] -= amount;
    else currentData[primaryKey][property] += amount;

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
  remove() {}
}
