const { Log, assert, warn } = require('./Utils');

// The heart of Pulse.
module.exports = class Collection {
  constructor(
    { name, global },
    {
      data = {},
      model = {},
      actions = {},
      filters = {},
      indexes = [],
      groups = [],
      routes = {},
      watch = {},
      persist = [],
      local = {},
      onReady
    }
  ) {
    this._name = name;

    this._actionRefrence = {
      collect: this.collect.bind(this),
      undo: this.undo.bind(this),
      move: this.move.bind(this),
      update: this.update.bind(this),
      put: this.put.bind(this),
      delete: this.delete.bind(this),
      deleteGroup: this.deleteGroup.bind(this),
      findById: this.findById.bind(this),
      getGroup: this.getGroup.bind(this),
      newGroup: this.newGroup.bind(this),
      forceUpdate: this.forceUpdate.bind(this),
      throttle: this.throttle.bind(this),
      remove: this.remove.bind(this),
      set: this.set.bind(this),
      increment: this.increment.bind(this),
      decrement: this.decrement.bind(this),
      purge: this.purge.bind(this),
      watch: this.watch.bind(this),
      replaceIndex: this.replaceIndex.bind(this)
    };

    // this is used to pass the collections public properties into other collections without creating a circular refrence for the entire collection. It also helps control namespace.
    const publicObject = {
      groups: {},
      data: {},
      actions: {},
      filters: {},
      routes: {},
      indexes: {}
    };

    // Create proxy on the for public data
    this._public = this.initProxy(publicObject);

    // Bind refrences to parent objects
    this._global = global;
    this._regenQueue = this._global.regenQueue;

    this._onReady = onReady;
    this._model = model;
    this._filters = filters;
    this._local = local;

    this._data = {}; // the internal data store
    this._indexes = {}; // arrays of primary keys
    this._watchers = {};
    this._storage = {};

    // direct or dynamic data relations for filters
    this._filtersRelatedToData = {};
    this._filtersRelatedToGroup = {};

    this._relations = {};

    this._groupRelations = {};
    this._foreignGroupRelations = {};

    this._subscribedToData = {};

    this._watchers = {};
    this._internalWatchers = {};

    this._persist = [];
    this._throttles = [];
    this._modelTypes = [];
    this._mutableData = [];
    this._indexesToRegen = [];
    this._filtersToForceRegen = [];
    this._actionProcessingStack = [];

    this._collectionSize = 0;
    this._primaryKey = null;

    this._executing = false;
    this._collecting = false;
    this._performingAction = false;
    this._allowInternalChange = false;

    // so other collections can access this collection's internal data
    this._global.internalDataRef[this._name] = this._data;

    this.initStorage();

    // analyse the model
    this.initModel(model);

    // initialize routes & actions
    this.initData(data);
    this.initGroups(indexes.concat(groups));
    this.initRoutes(routes);
    this.initFilters(filters);
    this.initActions(actions);

    // Bind watchers
    this.initWatchers(watch);

    // map collection categories to shared namespace
    this.prepareNamespace();

    // Load persisted values from storage
    this.initPersist(persist);

    this.initOnReady(onReady);
  }

  initStorage() {
    // Check if the chosen storage system is a promise
    this._storageIsPromise = this._global.storage.async ? true : false;
    if (this._global.storage.get('_') instanceof Promise)
      this._storageIsPromise = true;

    let asyncGet = key => {
      return new Promise(async resolve => {
        try {
          let res = await this._global.storage.get(key);
          // if result is a string, JSON parse, otherwise just return
          if (typeof res !== 'string') return resolve(res);
          let parsed = JSON.parse(res);
          return resolve(parsed);
        } catch {
          resolve(null);
        }
      });
    };

    let syncGet = key => {
      let res = this._global.storage.get(key);
      try {
        // if result is a string, JSON parse, otherwise just return
        let parsed = JSON.parse(res);
        return parsed;
      } catch (e) {
        return res;
      }
    };

    // bind and wrap get function
    this._storage.get = key =>
      this._storageIsPromise ? asyncGet(key) : syncGet(key);

    // bind and wrap set function
    this._storage.set = (key, value) => {
      this._global.storage.set(key, JSON.stringify(value));
    };

    // bind and wrap remove function
    this._storage.remove = key => this._global.storage.remove(key);

    // this._storage.clear = prepareStorage.clear.bind(_storage);
  }

  /**
   * Initializse persist
   * @param {Array} persist
   */
  initPersist(persist) {
    persist.forEach(property => {
      this._persist.push(property);
      let storageKey = `_${this._name}_${property}`;

      // find property in storage
      if (!this._public.hasOwnProperty(property))
        return assert(
          `Unable to persist property "${property}" in collection "${
            this._name
          }" as it does not exist.`
        );

      // Validate property exists and determine category

      let category = this.searchNamespaceForProperty(property);
      if (!category)
        return assert(`Unable to persist. Property does not exist.`);

      // Async get method
      if (this._storageIsPromise) {
        this._storage.get(storageKey).then(data => {
          if (data === null || data === undefined) return;
          this._public[category][property] = data;
          if (this._public.hasOwnProperty(property))
            this._public[property] = data;
        });

        // Synchronous get method
      } else {
        let data = this._storage.get(storageKey);

        if (data === null || data === undefined) return;

        // The syncronous version needs to take care of it's
        data = this.initDeepReactivity(data, property);

        this._allowInternalChange = true;
        this._public[category][property] = data;

        if (this._public.hasOwnProperty(property)) {
          this._allowInternalChange = true;
          this._public[property] = data;
        }
      }
    });
  }

  /**
   * Initializse the data and deep reactivity
   * @param {Object} data
   */
  initData(data) {
    Object.keys(data).forEach(key => {
      this._mutableData.push(key);
      data[key] = this.initDeepReactivity(data[key], key);
    });
    this._public.data = this.initProxy(data);
  }

  /**
   * Initializse the groups and their respective indexes.
   * @param {Array} groups
   */
  initGroups(groups) {
    this._public.groups = this.initProxy({});
    for (let i = 0; i < groups.length; i++) {
      const index = groups[i];
      if (this._public.groups[index] || this._indexes[index])
        return assert(`Duplicate declaration for index ${index}`);
      // create a new empty array for the index
      this._indexes[index] = new Array();
      this._public.groups[index] = new Array();
      this._public.indexes[index] = new Array();
    }
    // proxify indexes
    this._public.indexes = this.initProxy(this._public.indexes, 'indexes');
  }

  /**
   * Initializse the filters
   * @param {Object} filters
   */
  initFilters(filters) {
    // map filters
    const keys = Object.keys(filters);
    // this._public.filters = this.initProxy({});
    for (let i = 0; i < keys.length; i++) {
      const filterName = keys[i];
      // set the property to an empty array, until we've parsed the filter
      this._public.filters[filterName] = [];
      this._global.allFilters.push(filterName);
    }
  }

  /**
   * Initializse the routes
   * @param {Object} routes
   */
  initRoutes(routes) {
    const keys = Object.keys(routes);
    for (let i = 0; i < keys.length; i++) {
      const routeName = keys[i];
      const _this = this;
      this._public.routes[routeName] = function() {
        return routes[routeName].apply(
          null,
          [_this._global.request].concat(Array.prototype.slice.call(arguments))
        );
      };
    }
  }

  getContextObject() {
    const context = Object.assign(
      {
        data: this._public.data,
        filters: this._public.filters,
        groups: this._public.groups,
        actions: this._public.actions,
        routes: this._public.routes
      },
      this._global.dataRef,
      this._actionRefrence,
      { local: this._local }
    );
    return context;
  }

  /**
   * Initializse the actions
   * @param {Object} actions
   */
  initActions(actions) {
    const _this = this;

    const keys = Object.keys(actions);
    for (let i = 0; i < keys.length; i++) {
      const actionName = keys[i];
      // build a wrapper around the action to provide context control execution
      this._public.actions[actionName] = function() {
        // if throttle present, return promise rejection, in case action is waiting on a promise.
        if (_this._throttles.includes(actionName)) return Promise.resolve();

        // preserve custom arguments
        const customArguments = arguments;

        // a unique identifier for this invocation, used by undo
        const actionIdentifier = Math.random();

        // if action is running inside another action, record that action identifier.
        let parentAction = null;
        if (_this._actionProcessingStack.length > 0)
          parentAction =
            _this._actionProcessingStack[
              _this._actionProcessingStack.length - 1
            ].actionIdentifier;

        // get context object
        const context = _this.getContextObject();

        // replace default undo method with an action unique undo method
        context.undo = function(error) {
          return _this.undo(actionName, actionIdentifier, error);
        };

        // wrap action in an intermediary function to preserve context
        const runAction = function() {
          return actions[actionName].apply(
            null,
            [context].concat(Array.prototype.slice.call(customArguments))
          );
        };

        const actionPackage = {
          id: actionIdentifier,
          name: actionName,
          parentAction,
          runAction
        };

        return _this.executeAction(actionPackage);
      };
    }
  }

  executeAction(actionPackage) {
    // declare this action has begun execution
    this._performingAction = actionPackage.name;

    // capture everything needed to re-run this action in context
    this._actionProcessingStack.push(actionPackage);

    // invoke action
    const actionOutput = actionPackage.runAction();

    // declare action has finsihed
    this._performingAction = false;

    // remove this action from the bottom of the action stack
    this._actionProcessingStack.pop();

    // if last action in the queue, cleanup
    if (this._actionProcessingStack.length === 0) {
      // optionally wipe history
    }

    return actionOutput;
  }

  initWatchers(watchers) {
    const _this = this;
    let keys = Object.keys(watchers);
    for (let index = 0; index < keys.length; index++) {
      const watchFunctionName = keys[index];
      this._watchers[watchFunctionName] = function() {
        const runWatcher = watchers[watchFunctionName](
          _this.getContextObject()
        );
        return runWatcher;
      };
    }
  }

  initOnReady(onReady) {
    const _this = this;
    this._onReady = function() {
      if (onReady) onReady(_this.getContextObject());
    };
  }

  /**
   * Initializse data proxy
   * @param {Object} obj - the object to apply the proxy to.
   * @param {Boolean} rootProperty - The root property in the collection for deep reactivity.
   */
  initProxy(obj = {}, rootProperty = false, deepProxy = false) {
    // inject custom prototype "rootProperty"
    let objectWithCustomPrototype;

    if (rootProperty)
      objectWithCustomPrototype = Object.create({ rootProperty });
    else {
      let proto = Object.assign({}, this._actionRefrence, rootProperty);
      objectWithCustomPrototype = Object.create(proto);
    }

    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const property = keys[i];
      objectWithCustomPrototype[property] = obj[property];
    }

    if (deepProxy)
      // this proxy enables deep reactivity, a smaller proxy to be installed on all sub propertys of the collection root data
      return new Proxy(objectWithCustomPrototype, {
        set: (target, key, value) => {
          if (Object.getPrototypeOf(target).rootProperty) {
            let rootProperty = Object.getPrototypeOf(target).rootProperty;
            if (this._mutableData.includes(rootProperty)) {
              target[key] = value;
              this.updateSubscribers(rootProperty, this._public[rootProperty]);
              this.findAndUpdateDependents(rootProperty);
            }
            return true;
          }
          target[key] = value;
          return true;
        },
        get: (target, key, value) => {
          return target[key];
        }
      });
    else if (rootProperty === 'indexes')
      // this proxy allows direct modification to an index, and will trigger the relevent group to rebuild
      return new Proxy(objectWithCustomPrototype, {
        set: (target, key, value) => {
          target[key] = value;
          if (!this._allowInternalChange) {
            this.replaceIndex(key, value, true);
          }
          return true;
        },
        get: (target, key, value) => {
          return target[key];
        }
      });
    // the primary proxy for the collection's root data
    return new Proxy(objectWithCustomPrototype, {
      set: (target, key, value) => {
        if (!this._global.initComplete || this._allowInternalChange) {
          target[key] = value;
          this._allowInternalChange = false;
          return true;
        }

        // For regular mutations to root data
        if (this._mutableData.includes(key)) {
          let previousValue = target[key];

          target[key] = value;

          this.recordHistory('mutation', {
            key,
            rootProperty,
            previousValue,
            newValue: value
          });

          // in case this new data is an object, we should apply proxies to eligible sub properties
          let data = this.initDeepReactivity(target[key], key);

          // set value to this property
          target[key] = data;

          // set value on the "data" property to mirror this root property
          this._allowInternalChange = true;
          this._public['data'][key] = value;
          this._allowInternalChange = false;

          // first push the change
          this.updateSubscribers(key, value);
          // now process any dependents that are affected by this change
          this.findAndUpdateDependents(key);

          return true;
        }

        // if data is not found on collection root, check prototype for root property name

        if (Object.keys(this._public).includes(key)) {
          assert(
            `Cannot set data property "${key}" in collection "${
              this._name
            }". Filters and groups are not mutable.`
          );
        } else {
          assert(
            `Cannot set data property "${key}" in collection "${
              this._name
            }" as "${key}" does not exist.`
          );
        }
        return true;
      },
      get: (target, key, value) => {
        if (Object.getPrototypeOf(target).rootProperty) {
          return target[key];
        }
        if (
          this._global.record &&
          // prevent proxy from reporting access to categories
          !['filters', 'groups', 'indexes', 'data', 'actions'].includes(key) &&
          // ensure we havent already found this dependency
          this._global.dependenciesFound.filter(
            item => item.property === key && item.collection === this._name
          ).length === 0
        ) {
          this._global.dependenciesFound.push({
            property: key,
            collection: this._name
          });
        }
        return target[key];
      }
    });
  }

  replaceIndex(index, value, preventIndexUpdate) {
    let previousIndex = this._indexes[index];
    this._indexes[index] = value;
    this.buildGroupFromIndex(index, preventIndexUpdate);
    this.findAndUpdateDependents(index);
    this.recordHistory('indexMutation', {
      index,
      previousIndex,
      newIndex: value
    });
  }

  isWatchableObject(value) {
    let type = typeof value;
    return (
      value != null &&
      type == 'object' &&
      !this.isHTMLElement(value) &&
      !Array.isArray(value)
    );
  }

  isHTMLElement(obj) {
    try {
      return obj instanceof HTMLElement;
    } catch (e) {
      return (
        typeof obj === 'object' &&
        obj.nodeType === 1 &&
        typeof obj.style === 'object' &&
        typeof obj.ownerDocument === 'object'
      );
    }
  }

  initDeepReactivity(data, rootProperty) {
    // return;
    let nextToAnalyse = [];

    if (!this.isWatchableObject(data)) return data;

    // return this object as a proxy
    const returnProxy = this.initProxy(data, rootProperty, true);

    // push all children of rootPropery to queue
    const keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      const property = keys[i];
      if (this.isWatchableObject(data[property]))
        nextToAnalyse.push({ target: data, key: property });
    }

    const loop = () => {
      const next = nextToAnalyse;
      nextToAnalyse = [];
      // loop over queue
      for (let i = 0; i < next.length; i++) {
        const { key, target } = next[i];
        // convert target to proxy
        this._allowInternalChange = true;
        target[key] = this.initProxy(target[key], rootProperty, true);

        // loop over properties of item in queue
        // is the property an object?
        const keys = Object.keys(target[key]);
        for (let i = 0; i < keys.length; i++) {
          const property = keys[i];
          if (this.isWatchableObject(target[key][property]))
            // if so push target to queue to check properties next round
            nextToAnalyse.push({ target: target[key], key: property });
        }
      }

      if (nextToAnalyse.length > 0) loop();
      else this._allowInternalChange = false;
    };
    loop();
    return returnProxy;
  }

  /**
   * Initializse the model configuration.
   * @param {Object} model
   */
  initModel(model) {
    Object.keys(model).forEach(property => {
      Object.keys(model[property]).forEach(config => {
        if (config === 'primaryKey') {
          this._primaryKey = property;
        } else if (config === 'type') {
          if (
            [
              'string',
              'boolean',
              'integer',
              'number',
              'array',
              'object'
            ].includes(model[property].type)
          ) {
            // model types are properties of the model to type check & validate on collect
            if (!this._modelTypes.includes(property)) {
              this._modelTypes.push(property);
            }
          } else {
            assert(
              `Error in model in collection "${this._name}", type "${
                model[property].type
              }" is not valid.`
            );
          }
        } else if (config === 'parent' || config === 'hasOne') {
          let hasOne = model[property].parent || model[property].hasOne;
          this.createDataRelation(property, hasOne, model[property].assignTo);
        } else if (config === 'has' || config === 'hasMany') {
          let hasMany = model[property].has || model[property].hasMany;
          this.createGroupRelation(property, hasMany, model[property].assignTo);
        }
      });
    });
  }

  /**
   * Establish a data relation with another collection.
   * @param {String} primaryKeyName
   * @param {String} fromCollectionName
   * @param {String} assignTo
   */
  createDataRelation(primaryKeyName, fromCollectionName, assignTo) {
    // if this is a valid collection
    if (!this._global.collectionNamespace.includes(fromCollectionName))
      return assert(`"${collection}" is not a valid collection.`);
    // create an object for group names, which will contain arrays of primary keys
    this._relations[primaryKeyName] = {};
    //
    this._relations[primaryKeyName].fromCollectionName = fromCollectionName;
    if (assignTo) this._relations[primaryKeyName].assignTo = assignTo;
  }

  /**
   * Establish a data relation with another collection, but for entire groups
   * @param {String} primaryKeyName
   * @param {String} fromCollectionName
   * @param {String} assignTo
   */
  createGroupRelation(primaryKeyName, fromCollectionName, assignTo) {
    if (!this._global.collectionNamespace.includes(fromCollectionName))
      return assert(`"${collection}" is not a valid collection.`);

    this._groupRelations[primaryKeyName] = {};

    this._groupRelations[
      primaryKeyName
    ].fromCollectionName = fromCollectionName;

    if (assignTo) this._groupRelations[primaryKeyName].assignTo = assignTo;
  }

  // returns the address of a public property
  searchNamespaceForProperty(property) {
    const searchable = ['filters', 'data', 'groups'];
    for (let i = 0; i < searchable.length; i++) {
      const type = searchable[i];
      if (Object.keys(this._public[type]).includes(property)) {
        return type;
      }
    }
    return false;
  }

  validateNamespace(context, property) {
    Object.keys(context).forEach(prop => {
      if (context.hasOwnProperty(property)) {
        warn(`Duplicate property "${property}" on collection "${this._name}"`);
        return false;
      }
    });
    return true;
  }

  // reserves the namespace for all categories on the component instance before runtime
  prepareNamespace() {
    // settings here..
    Object.keys(this._public).forEach(category => {
      if (['data', 'actions', 'groups', 'filters'].includes(category)) {
        Object.keys(this._public[category]).forEach(item => {
          if (this.validateNamespace(this._public, item))
            this._public[item] = this._public[category][item];
        });
      }
    });
  }

  checkNamespace(name) {
    const avalible = !!this._public.data.hasOwnProperty(name);
    if (!avalible) {
      assert(
        `Namespace error "${name}" is already taken for collection "${
          this._name
        }".`
      );
      return false;
    }
    return true;
  }

  persistData(key, value) {
    if (this._persist.includes(key)) {
      let storageKey = `_${this._name}_${key}`;
      Log(`Persisting data with key ${storageKey}`);
      this._storage.set(storageKey, value);
    }
  }

  findPrimaryKey(item) {
    const genericPrimaryIds = ['id', '_id'];
    // detect a primary key
    for (let i = 0; i < genericPrimaryIds.length; i++) {
      const key = genericPrimaryIds[i];
      if (item.hasOwnProperty(key)) this._primaryKey = key;
    }
    if (!this._primaryKey)
      this.dataRejectionHandler(item, 'No primary key supplied.');
  }

  createRelationForIndex(index) {
    const keys = Object.keys(this._relations);
    for (let i = 0; i < keys.length; i++) {
      const primaryKey = keys[i];
      this._relations[primaryKey][index] = [];
    }
  }

  // this is called by the main class once all collections have been constructed, it runs through each filter, executing the function. It  then uses the data proxy to detect which properties the filter wants to access, and saves them in a dependency graph.
  analyseFilters() {
    if (!this._filters) return;
    const keys = Object.keys(this._filters);
    for (let i = 0; i < keys.length; i++) {
      const filter = keys[i];
      this.executeAndAnalyseFilter(filter);
    }
  }
  // this is called by the local analyseFilters() loop and the main class during regen queue processing
  executeAndAnalyseFilter(filter) {
    Log(`Analysing filter "${filter}"`);
    // open the door allowing each collection's data proxy to record which properties are accessed by this filter
    this._global.record = true;

    // execute the filter
    this.executeFilter(filter);

    // data recorded, close door
    const found = this._global.dependenciesFound;

    // empty the list of dependencies for next loop
    this._global.dependenciesFound = [];

    // preliminarily loop over dependencys to find missing dependents
    for (let i = 0; i < found.length; i++) {
      const dependency = found[i];
      if (this.checkForMissingDependency(dependency, filter))
        // don't register anything to dependency graph, this will get done once all depenecies are clear, avoids us having to check or prevent dependency graph from having duplicate entries.
        return;
    }
    this.populateDependencies(found, filter);

    // mark is as generated so other filters know they are in the clear!
    this._global.generatedFilters.push(this._name + filter);
    Log(`Generated ${filter} for collection ${this._name}`);
  }

  executeFilter(filter) {
    this._executing = filter;

    const context = Object.assign(
      {
        data: this._public.data,
        filters: this._public.filters,
        groups: this._public.groups,
        actions: this._public.actions
      },
      this._global.dataRef,
      this._actionRefrence,
      { local: this._local }
    );

    let data = this._filters[filter](context);

    this._executing = false;
    // filter executed, now ensure the door is closed before deliverUpdate, as that will trigger the proxy's set trap- and with this still true it will cause an infinate loop.
    this._global.record = false;
    // if the result of the filter is null or undefined, chang
    if (data === undefined || data === null) data = false;
    // update subscribers
    this.deliverUpdate('filters', data, filter);
  }

  emitToRoot(type, data = {}) {
    this._global.eventBus.message = {
      type,
      data
    };
  }
  // this will fill the index array with the correposonding data and include relational data
  buildGroupFromIndex(index, preventIndexUpdate) {
    // constuct the data from the index
    const constructedArray = [];
    for (let i = 0; i < this._indexes[index].length; i++) {
      let id = this._indexes[index][i];
      let data = this._data[id];
      if (!data) continue;

      // Data relations
      let relations = Object.keys(this._relations);
      if (relations.length > 0)
        for (let i = 0; i < relations.length; i++) {
          const relationKey = relations[i];
          const rel = this._relations[relationKey];
          const assignTo = rel.hasOwnProperty('assignTo')
            ? rel.assignTo
            : false;

          if (data.hasOwnProperty(relationKey)) {
            let foreignData = this._global.internalDataRef[
              rel.fromCollectionName
            ][data[relationKey]];

            if (foreignData) {
              if (assignTo) data[assignTo] = foreignData;
              else data[rel.fromCollectionName] = foreignData;
            }
          }
        }

      // group relations
      let groupRealtions = Object.keys(this._groupRelations);
      if (groupRealtions.length > 0)
        for (let i = 0; i < groupRealtions.length; i++) {
          const relationKey = groupRealtions[i];
          const rel = this._groupRelations[relationKey];

          const assignTo = rel.hasOwnProperty('assignTo')
            ? rel.assignTo
            : false;

          if (data.hasOwnProperty(relationKey)) {
            const foreignData = this._global.dataRef[rel.fromCollectionName][
              data[relationKey]
            ];

            if (foreignData) {
              if (assignTo) data[assignTo] = foreignData;
              else data[rel.fromCollectionName] = foreignData;
            }

            // register this relation on the foreign collection for reactive updates
            this.emitToRoot('createForeignGroupRelation', {
              // foreign collection
              foreignCollection: rel.fromCollectionName,
              foreignData: data[relationKey],
              // from this collection
              dependentCollection: this._name,
              dependentGroup: index
            });
          }
        }
      constructedArray.push(data);
    }

    if (
      this._public.hasOwnProperty(index) ||
      this._public.groups.hasOwnProperty(index)
    )
      // deliver data to public object
      this.deliverUpdate('groups', constructedArray, index);

    // update public index refrence
    if (!preventIndexUpdate) {
      this._allowInternalChange = true;
      this._public.indexes[index] = this._indexes[index];
      this._allowInternalChange = false;
    }

    this.findFiltersToRegenFromRelatedGroup(index);

    // return data for functions like "findGroup"
    return constructedArray;
  }

  // Source data has been modified, these are the functions that will update the relevent indexes and filters to regnerate
  internalDataModified(primaryKey) {
    // if array, find and push all dependents to queue
    if (Array.isArray(primaryKey)) {
      for (let i = 0; i < primaryKey.length; i++) {
        const pK = primaryKey[i];
        this.findGroupsToRegen(pK);
        this.findFiltersToRegenFromRelatedData(pK);
      }
    } else {
      // otherwise find the dependents for a single piece of data
      this.findGroupsToRegen(primaryKey);
      this.findFiltersToRegenFromRelatedData(primaryKey);
    }
    // process regen queue
    this.regenerateGroupsAndFilters();
  }

  deliverUpdate(type, data, name) {
    // process update, allowInternalChange instructs Proxy to bypass user mutation validation and to not search for dependents to update, as it is already taken care of.
    this._allowInternalChange = true;
    this._public[type][name] = data;
    this._allowInternalChange = false;
    // update root namespaces, eventually add setting here for users that want to disable root namespace assignment
    if (this._public.hasOwnProperty(name)) {
      this._allowInternalChange = true;
      this._public[name] = data;
      this._allowInternalChange = false;
    }
    this.updateSubscribers(name, data);

    // trigger other collections to regen their groups if any depend on data modified from this collection
    const keys = Object.keys(this._foreignGroupRelations);
    for (let i = 0; i < keys.length; i++) {
      const property = keys[i];
      if (name === property)
        this.emitToRoot(
          'rebuildGroupsWithRelations',
          this._foreignGroupRelations[property]
        );
    }
  }

  updateSubscribers(key, data) {
    Log(`Updating subscribers for ${key}`);
    // trigger watcher for data
    if (this._watchers.hasOwnProperty(key))
      // push to bottom of call stack to ensure dependencies have generated
      setTimeout(() => this._watchers[key](this._global.dataRef));

    if (this._internalWatchers.hasOwnProperty(key))
      setTimeout(() => {
        for (let i = 0; i < this._internalWatchers[key].length; i++) {
          const callback = this._internalWatchers[key][i];
          callback();
        }
      });

    // persist data if need be
    this.persistData(key, data);

    let framework = this._global.config.framework;
    if (this._subscribedToData[key])
      for (let i = 0; i < this._subscribedToData[key].length; i++) {
        const item = this._subscribedToData[key][i];
        if (framework === 'vue' || item.component.hasOwnProperty('$vnode'))
          item.component.$set(item.component, item.key, data);
        else if (
          framework === 'react' ||
          item.component.hasOwnProperty('_reactInternalInstance')
        ) {
          let stateData = {};
          stateData[item.key] = data;

          if (item.component.state.hasOwnProperty('_mounted')) {
            if (item.component.state._mounted)
              item.component.setState(stateData);
          } else {
            item.component.setState(stateData);
          }
          // vanilla JS
        } else {
          // nothing yet, maybe a configurable callback
        }
      }
  }

  recordHistory(type, data) {
    let fromAction = null;
    let fromActionIdentifier = null;
    let fromActionParentIdentifier = null;

    if (this._actionProcessingStack.length === 0 && type === 'mutation') return;

    if (this._actionProcessingStack.length > 0) {
      let currentAction = this._actionProcessingStack[
        this._actionProcessingStack.length - 1
      ];

      fromActionIdentifier = currentAction.id;
      fromAction = currentAction.name;

      if (currentAction.parentAction)
        fromActionParentIdentifier = currentAction.parentAction.id;
    }
    let historyItem = {
      type,
      timestamp: Date.now(),
      collection: this._name,
      fromAction,
      fromActionIdentifier,
      fromActionParentIdentifier,
      data
    };
    this._global.history.push(historyItem);
  }

  populateDependencies(found, filter) {
    const depGraph = this._global.dependencyGraph;
    for (let i = 0; i < found.length; i++) {
      const dependency = found[i];
      // Register dependencies of this filter, only filters have this.
      const key1 = `${dependency.collection}/${dependency.property}`;
      const location1 = depGraph[this._name][filter];

      if (!location1.dependencies.includes(key1)) {
        location1.dependencies.push(key1);
      }
      // register this filter as a dependent for the foreign filter or data property
      const key2 = `${this._name}/${filter}`;
      const location2 = depGraph[dependency.collection][dependency.property];

      if (
        location2 &&
        location2.dependents &&
        !location2.dependents.includes(key2)
      ) {
        location2.dependents.push(key2);
      }
    }
  }

  // ensure it is a filter that has not been generated yet, if it hasn't we should save it to the queue to be checked again after more have been analysed
  checkForMissingDependency(dependency, filter) {
    const glob = this._global;
    if (
      // ensure the dependency is a filter, not an index (group). Indexes should be regenerated before the regen queue is processed. This could be removed if you make the regen queue regen indexes too.
      glob.allFilters.includes(dependency.property) &&
      !glob.generatedFilters.includes(
        dependency.collection + dependency.property
      )
    ) {
      Log(
        `Dependent "${
          dependency.property
        }" has not been analysed yet, saving this filter to regen queue.`
      );
      this._regenQueue.push({
        type: 'filter',
        property: filter,
        collection: this._name
      });
      return true;
    }
    return false;
  }

  // this function returns all the dependents decending from a particular filter
  findAllDependents(filter) {
    const graph = this._global.dependencyGraph;
    const dependents = graph[this._name][filter].dependents;
    const dependenciesFound = [];
    let loops = 0;
    let lastRound = [];
    for (let i = 0; i < dependents.length; i++) {
      const dep = dependents[i];
      lastRound.push(dep);
      dependenciesFound.push(dep);
    }
    const loop = () => {
      loops++;
      const loopChildren = lastRound;
      lastRound = [];
      for (let i = 0; i < loopChildren.length; i++) {
        const dep = loopChildren[i];
        const depParsed = this.parseKey(dep);
        const search =
          graph[depParsed.collection][depParsed.property].dependents;
        for (let i = 0; i < search.length; i++) {
          const childDep = search[i];
          lastRound.push(childDep);
          dependenciesFound.push(childDep);
        }
      }
      if (loops > 1000)
        return assert(`Maximum stack exceeded for dependent search.`);
      else if (lastRound.length !== 0) loop();
    };
    loop();
    return dependenciesFound;
  }

  // this function should run when any data is changed. It will find all filters that need to be regnerated now that the parent data has changed.
  findAndUpdateDependents(propertyChanged) {
    let allDependents = [];
    if (Array.isArray(propertyChanged)) {
      for (let i = 0; i < propertyChanged.length; i++) {
        const deps = this.findAllDependents(propertyChanged[i]);
        for (let i = 0; i < deps.length; i++) {
          const dep = deps[i];
          if (!allDependents.includes(dep)) allDependents.push(dep);
        }
      }
    } else {
      allDependents = this.findAllDependents(propertyChanged);
    }
    Log(`Found dependents: ${JSON.stringify(allDependents)}`);
    this.pushDependentsToRegenQueue(allDependents);
  }

  pushDependentsToRegenQueue(dependentFilters) {
    for (let i = 0; i < dependentFilters.length; i++) {
      const { property, collection } = this.parseKey(dependentFilters[i]);
      // check if already in regen queue
      if (
        !this._regenQueue.find(
          item => item.property === property && item.collection === collection
        )
      ) {
        // add to queue
        this._regenQueue.push({
          type: 'filter',
          property: property,
          collection: collection
        });
      }
    }
    // send a message back to the main class. Refrencing would be impossible without creating a circular refrence, so to avoid that we use proxies to trigger events
    this.emitToRoot('processRegenQueue');
  }

  forceUpdate(property) {
    if (this._filters.hasOwnProperty(property)) {
      this._regenQueue.push({
        type: 'filter',
        property: property,
        collection: this._name
      });
      this.emitToRoot('processRegenQueue');
    } else if (this._mutableData.includes(property)) {
      this.initDeepReactivity(this._public[property], property);
      this.updateSubscribers(property, this._public[property]);
      this.findAndUpdateDependents(property);
    }
  }

  collect(data, group) {
    // debugger;
    // validate
    if (!data)
      return assert(
        `Collect error on collection ${this._name}: Data undefined`
      );
    if (!Array.isArray(data)) data = [data];

    this._collecting = true;
    let indexIsArray = false;
    const indexesModified = [];
    const indexesCreated = [];

    // create the index
    if (group) {
      if (Array.isArray(group)) {
        indexIsArray = true;
        for (let ind = 0; ind < group.length; ind++) {
          const i = group[ind]; // TODO: this should be switched.
          this.createRelationForIndex(i);
          this._indexesToRegen.push(i);

          // if index does not exist, create blank index
          if (!this._indexes[i]) this._indexes[i] = [];

          indexesModified.push({
            indexName: i,
            previousValue: this._indexes[i]
          });
        }
      } else {
        this.createRelationForIndex(group);
        this._indexesToRegen.push(group);
        if (!this._indexes[group]) {
          this._indexes[group] = [];
        }
        indexesCreated.push(group);
      }
    }
    // process the data
    if (!Array.isArray(data)) {
      this.processDataItem(data, group);
    } else {
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        this.processDataItem(item, group, data);
      }
    }

    // update any existing indexes where data has been added

    // record the changes
    this.recordHistory('collect', {
      dataCollected: data,
      indexesCreated,
      indexesModified
    });

    this._collecting = false;
    Log(
      `Collected ${data.length} items in ${this._name}. With index: ${group}`
    );
    this.regenerateGroupsAndFilters();
  }

  processDataItem(data, index) {
    let overwrite = true;
    // validate against model
    // if no primary key defined in the model, search for a generic one.
    if (!this._primaryKey) this.findPrimaryKey(data);

    // data should not be null, but null is an object
    if (data === null)
      return this.dataRejectionHandler(data, `Data cannot be null`);

    // however data must be an object
    if (typeof data !== 'object')
      return this.dataRejectionHandler(
        data,
        `Collected data must be an object, but we recieved ${typeof data}`
      );

    for (let i = 0; i < this._modelTypes.length; i++) {
      let propertyName = this._modelTypes[i];
      let type = this._model[propertyName].type;
      data[propertyName] = this.validateDataPropertyAgainstType(
        data[propertyName],
        type
      );
    }

    // if that primary key does not exist on this data item, reject.
    if (!data.hasOwnProperty(this._primaryKey))
      return this.dataRejectionHandler(data, 'Primary key mismatch. ');

    let itemID = data[this._primaryKey];

    // check if we already have the data
    let currentData = this._data[itemID];
    if (currentData) {
      Object.keys(currentData).forEach(property => {
        if (!data.hasOwnProperty(property)) {
          data[property] = currentData[property];
        }
      });
      overwrite = false;
    }

    // push id into index provided it doesn't already exist on that index
    if (index) {
      if (!Array.isArray(index)) index = [index];
      for (let i = 0; i < index.length; i++) {
        const groupName = index[i];
        if (!this._indexes[groupName].includes(itemID)) {
          this._indexes[groupName].push(itemID);
        }
      }
    }

    const keys = Object.keys(this._relations);
    for (let i = 0; i < keys.length; i++) {
      const relationKey = keys[i];
      const relation = this._relations[relationKey];
      if (Array.isArray(relation[index]))
        relation[index].push(data[relationKey]);
    }

    // if we've already collected this item, it may exist in other indexes, so regenerate those.
    // (bug: hasOwnProperty didn't work here)
    if (Object.keys(this._data).includes(itemID))
      this.findGroupsToRegen(itemID);

    // Some filters might have direct links to this piece of data or index (EG: "getGroup()" or "findByID()")
    this.findFiltersToRegenFromRelatedData(itemID);
    this.findFiltersToRegenFromRelatedGroup(index);

    // add the data internally
    this._data[itemID] = data;
    if (overwrite) this._collectionSize++;
  }

  validateDataPropertyAgainstType(value, type) {
    switch (type) {
      case 'array':
        return Array.isArray(value) ? value : [];
      case 'string':
        return typeof value === 'string' ? value : '';
      case 'boolean':
        return typeof value === 'boolean' ? value : false;
      case 'integer':
        return typeof value === 'number' ? value : 0;
      case 'number':
        return typeof value === 'number' ? value : 0;
      case 'object':
        return typeof value === 'object' ? value : {};
      default:
        assert(`Data validation failed. Type: "${type}" not supported`);
        return null;
    }
  }

  findGroupsToRegen(itemID) {
    Log(`looking for indexes for ${itemID}`);
    // check existing indexes for primary key id, here is where we determin which, if any, indexes need to be regenerated
    const keys = Object.keys(this._indexes);
    for (let i = 0; i < keys.length; i++) {
      const indexName = keys[i];
      if (
        // the data item exists already in another index
        this._indexes[indexName].includes(itemID) &&
        // we haven't already established this index needs regeneration
        !this._indexesToRegen.includes(indexName)
      ) {
        this._indexesToRegen.push(indexName);
      }
    }
  }

  // whenever a specific piece of data changes this should fire
  findFiltersToRegenFromRelatedData(primaryKey) {
    if (this._filtersRelatedToData[primaryKey]) {
      for (let i = 0; i < this._filtersRelatedToData[primaryKey].length; i++) {
        const filterName = this._filtersRelatedToData[primaryKey][i];
        if (!this._filtersToForceRegen.includes(filterName))
          this._filtersToForceRegen.push(filterName);
      }
    }
  }
  // whenever a group changes/updates this should fire
  findFiltersToRegenFromRelatedGroup(groupName) {
    if (this._filtersRelatedToGroup[groupName]) {
      for (let i = 0; i < this._filtersRelatedToGroup[groupName].length; i++) {
        const filterName = this._filtersRelatedToGroup[groupName][i];
        if (!this._filtersToForceRegen.includes(filterName))
          this._filtersToForceRegen.push(filterName);
      }
    }
  }

  regenerateGroupsAndFilters() {
    // add the indexes to the regen queue first

    for (let _i = 0; _i < this._indexesToRegen.length; _i++) {
      let index = this._indexesToRegen[_i];
      // const element = array[_i];
      // let index = this._indexesToRegen.shift();
      Log(`Rebuilding group "${index}" in collection "${this._name}"`);

      this.buildGroupFromIndex(index);
      // any filters dependent on the indexes we've added data to should be regenerated
      if (this._global.dataRef[this._name][index])
        this.findAndUpdateDependents(index);
    }
    // reset
    this._indexesToRegen = [];
    // check for filters to force regen and push them to the regen queue. The regen queue will not accept the same filter twice, so if the dependency graph finds this filter too, it won't generate twice.
    for (let i = 0; i < this._filtersToForceRegen.length; i++) {
      const filter = this._filtersToForceRegen[i];
      this.pushDependentsToRegenQueue([`${this._name}/${filter}`]);
      this.findAndUpdateDependents(filter);
    }
    // clean up once sent
    this._filtersToForceRegen = [];
  }

  // this function

  undo(action, actionIdentifier, error) {
    let thingsToRevert = this._global.history.filter(
      item => item.fromActionIdentifier === actionIdentifier
    );
    this.emitToRoot('undo', thingsToRevert);

    if (error) throw error;
  }

  // move data by id (or array of IDs) into another index
  move(ids, sourceIndex, destIndex, method) {
    // Validate
    if (!this._indexes[sourceIndex])
      return assert(`Index "${sourceIndex}" not found`);

    if (
      destIndex !== false &&
      destIndex != undefined &&
      !this._indexes[destIndex]
    )
      return assert(`Index "${destIndex}" not found`);

    if (!Array.isArray(ids)) ids = [ids];

    // record previous values
    let history = {
      ids,
      fromIndex: sourceIndex,
      toIndex: destIndex,
      previousFromIndexValue: this._indexes[sourceIndex],
      previousToIndexValue: this._indexes[destIndex]
    };

    // make changes
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (!this._data[id])
        return assert(
          `Data for id "${id}" not found in collection ${this._name}`
        );

      // remove from source index
      this._indexes[sourceIndex] = this._indexes[sourceIndex].filter(
        item => item !== id
      );

      //add to dest index
      if (destIndex)
        method === 'unshift'
          ? this._indexes[destIndex].unshift(id)
          : this._indexes[destIndex].push(id);
    }

    // rebuild groups
    this.buildGroupFromIndex(sourceIndex);
    if (destIndex) this.buildGroupFromIndex(destIndex);

    // record history
    this.recordHistory('move', history);

    // update dependents
    if (destIndex) this.findAndUpdateDependents([sourceIndex, destIndex]);
    else this.findAndUpdateDependents([sourceIndex]);
  }

  /**
   *
   * @param {Object} name - description
   */
  remove(data, group) {
    // validate
    if (typeof group !== 'undefined' && !this._indexes[group])
      return assert(`Group "${group}" not found.`);
    else if (!group) return this.delete(data);

    if (!Array.isArray(data)) data = [data];
    // are we dealing with full data or an index
    if (
      typeof data[0] == 'object' &&
      data[0].hasOwnProperty(this._primaryKey)
    ) {
      // we're dealing with full data, so we need to validate and map to ids
      data = data.map(item => item[this._primaryKey]);
    } else if (typeof data[0] !== 'number') {
      return assert(`Unable to remove data.`);
    }

    let previousValue = this._indexes[group].concat([]);

    this._indexes[group] = this._indexes[group].filter(
      key => !data.includes(key)
    );
    this.buildGroupFromIndex(group);

    this.recordHistory('remove', {
      group,
      previousValue
    });

    this.findAndUpdateDependents(group);
  }

  // put data by id (or array of IDs) into another index
  put(ids, destIndex, method) {
    // Validate
    if (!this._indexes[destIndex])
      return assert(`Index "${destIndex}" not found`);
    if (!Array.isArray(ids)) ids = [ids];

    // record previous value
    let previousDestIndex = this._indexes[destIndex].concat([]);

    // Loop
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      let removeTargetID = [];
      // prevent the same ID from being added removing from old position and push/unshift
      if (this._indexes[destIndex].includes(id)) {
        removeTargetID = this._indexes[destIndex].filter(_id => _id != id);
      } else {
        removeTargetID = this._indexes[destIndex];
      }

      if (method === 'unshift') removeTargetID.unshift(id);
      else removeTargetID.push(id);

      this._indexes[destIndex] = removeTargetID;
    }

    this.buildGroupFromIndex(destIndex);

    this.recordHistory('put', {
      group: destIndex,
      ids,
      previousDestIndex
    });

    this.findAndUpdateDependents(destIndex);
  }

  // change single or multiple properties in your data
  update(id, propertiesToChange) {
    if (this._data[id]) {
      const data = this._data[id];

      const history = {
        dataId: id,
        previousValues: {},
        newValues: propertiesToChange
      };

      const keys = Object.keys(propertiesToChange);

      for (let i = 0; i < keys.length; i++) {
        const property = keys[i];
        // if (!data.hasOwnProperty(property))
        //   assert(`Data "${id}" does not have property "${property}" to update`);

        history.previousValues[property] = data[property];

        data[property] = propertiesToChange[property];
      }

      this.recordHistory('update', history);

      this.internalDataModified(id);
    } else {
      assert(`Data for id "${id}" not found in collection ${this._name}`);
    }
  }

  createRelationForFilterToData(filter, primaryKey) {
    if (
      Array.isArray(this._filtersRelatedToData[primaryKey]) &&
      !this._filtersRelatedToData[primaryKey].includes(filter)
    ) {
      this._filtersRelatedToData[primaryKey].push(filter);
    } else {
      this._filtersRelatedToData[primaryKey] = [filter];
    }
  }
  createRelationForFilterToGroup(filter, groupName) {
    if (
      Array.isArray(this._filtersRelatedToGroup[groupName]) &&
      !this._filtersRelatedToGroup[groupName].includes(filter)
    ) {
      this._filtersRelatedToGroup[groupName].push(filter);
    } else {
      this._filtersRelatedToGroup[groupName] = [filter];
    }
  }

  findById(id) {
    // if called from within a filter create an internal index tied to this filter, now when dependent data is changed we can regenerate this filter
    if (this._executing)
      this.createRelationForFilterToData(this._executing, id);
    // if filtername is not specified, it was called from outside, in which case could never be reactive
    if (this._data[id]) return this._data[id];
    else {
      // this can be hooked on the collection config
      // this.emit('onMissingId', id)
      Log(`findByID: Item "${id}" not found in collection "${this._name}"`);
    }
  }

  getGroup(groupName) {
    if (this._executing)
      this.createRelationForFilterToGroup(this._executing, groupName);

    if (this._indexes[groupName]) return this.buildGroupFromIndex(groupName);
    else return [];
  }

  newGroup(name, indexArray) {
    if (!Object.keys(this._indexes).includes(name)) {
      this._indexes[name] = indexArray;

      this.recordHistory('newGroup', {
        createdGroup: name,
        data: indexArray
      });
    }
  }

  modifyGroup(group) {}

  // removes data via primary key from a collection
  delete(items) {
    if (this._indexes[items])
      return assert(
        `Delete function only supports primary keys for data, if you're trying to delete a group, please use deleteGroup()`
      );
    const deleteFunction = primaryKey => {
      // preserve data
      let deletedData = Object.assign({}, this._data.primaryKey);
      // delete data
      delete this._data[primaryKey];
      // record deletion
      this.recordHistory('delete', {
        primaryKey,
        deleted: deletedData
      });
    };
    if (Array.isArray(items))
      for (let i = 0; i < items.length; i++) {
        const primaryKey = items[i];
        deleteFunction(primaryKey);
      }
    else deleteFunction(items);

    // update dependents
    this.internalDataModified(items);
  }

  deleteGroup(group) {
    if (!this._indexes[group]) return assert(`Group "${group}" not found.`);
    // delete actual data

    for (let i = 0; i < this._indexes[group].length; i++) {
      const id = this._indexes[group][i];
      if (this._data[id]) delete this._data[id];
    }
    const previousValue = this._indexes[group];
    // empty index array
    this._indexes[group] = [];
    // construct data
    this.buildGroupFromIndex(group);

    this.recordHistory('deleteGroup', {
      group,
      previousValue
    });

    this.findAndUpdateDependents(group);
  }

  purge() {
    // empty data
    this._data = {};
    const keys = Object.keys(this._indexes);
    for (let i = 0; i < keys.length; i++) {
      const groupName = keys[i];
      this._indexes[groupName] = [];
      this._indexesToRegen.push(groupName);
    }
    this.regenerateGroupsAndFilters();
  }

  clean() {}

  increment(primaryKey, property, amount) {
    if (!this.validateNumberForDataProperty(primaryKey, property, amount))
      return;

    this._data[primaryKey][property] += amount;

    this.recordHistory('increment', {
      primaryKey,
      property,
      amount
    });

    this.internalDataModified(primaryKey);
  }

  decrement(primaryKey, property, amount) {
    if (!this.validateNumberForDataProperty(primaryKey, property, amount))
      return;

    this._data[primaryKey][property] -= amount;

    this.recordHistory('decrement', {
      primaryKey,
      property,
      amount
    });

    this.internalDataModified(primaryKey);
  }

  throttle(amount) {
    // preserve current action name on invoke
    let actionToThrottle = this._performingAction;

    this._throttles.push(actionToThrottle);

    setTimeout(() => {
      // remove throttle
      this._throttles = this._throttles.filter(
        action => action !== actionToThrottle
      );
    }, amount);
  }

  // debounce(param1, param2) {
  //   let action;
  //   let amount;
  //   let isInternal = false;
  //   if (typeof param1 === 'number') {
  //     amount = param2
  //     action = this._actionProcessingStack[this._actionProcessingStack.length - 1]
  //     isInternal = true
  //   } else if (typeof param1 === 'function') {
  //     amount = param2
  //     action = param1
  //   }
  //   this._debouncing[this._performingAction] = action

  //   // set debouncer
  //   const setDebounce = () => {
  //     this._debounce[this._performingAction] = setTimeout(() => {
  //       this._
  //   }, amount);
  //   }
  //   // if the current action is debouncing
  //   if (this._debouncing[this._performingAction]) {
  //     // destory current debouncer
  //     clearTimeout(this._debouncing[this._performingAction])
  //     // set debouncer
  //     return setDebounce()
  //     if (isInternal) return Promise.resolve(false)
  //   } else {
  //     // set debouncer
  //     setDebounce()
  //     // resolve
  //     if (isInternal) return Promise.resolve(true)
  //   }

  // }

  set(target, mutation) {
    Log(target, mutation);
  }

  watch(property, callback) {
    if (!this._public[property])
      return assert(
        `Error in watch function, property "${property}" does not exist`
      );
    if (!this._internalWatchers[property])
      this._internalWatchers[property] = [];
    this._internalWatchers[property].push(callback);
  }

  validateNumberForDataProperty(primaryKey, property, amount) {
    if (
      !this._data[primaryKey] ||
      !this._data[primaryKey][property] ||
      typeof amount !== 'number' ||
      typeof this._data[primaryKey][property] !== 'number'
    ) {
      assert(`Property ${property} for ${primaryKey} is not a number`);
      return false;
    }
    return true;
  }

  // used to save errors to the instance
  dataRejectionHandler(data, message) {
    let error = `[Data Rejection] - ${message} - Data was not collected, but instead saved to the errors object("_errors") on root Pulse instance.`;
    this._global.errors.push({
      data,
      timestamp: new Date(),
      error
    });
    assert(error);
  }

  parseKey(key) {
    return {
      collection: key.split('/')[0],
      property: key.split('/')[1]
    };
  }
};
