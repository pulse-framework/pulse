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
      onLoad
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
      findById: this.findById.bind(this),
      getGroup: this.getGroup.bind(this),
      newGroup: this.newGroup.bind(this),
      forceUpdate: this.forceUpdate.bind(this),
      throttle: this.throttle.bind(this),
      remove: this.remove.bind(this),
      removeGroup: this.remove.bind(this),
      set: this.set.bind(this)
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

    this._onLoad = onLoad;
    this._model = model;
    this._filters = filters;
    this._local = local;

    this._data = {}; // the internal data store
    this._indexes = {}; // arrays of primary keys
    this.watchers = {};

    // direct or dynamic data relations for filters
    this._filtersRelatedToData = {};
    this._filtersRelatedToGroup = {};

    this._relations = {};

    this._groupRelations = {};
    this._foreignGroupRelations = [];

    this._subscribedToData = {};

    this._persist = [];
    this._throttles = [];
    this._mutableData = [];
    this._indexesToRegen = [];
    this._filtersToForceRegen = [];

    this._collectionSize = 0;
    this._primaryKey = null;

    this._executing = false;
    this._collecting = false;
    this._performingAction = false;
    this._allowInternalChange = false;

    // so other collections can access this collection's internal data
    this._global.internalDataRef[this._name] = this._data;

    this._storage = {};
    this._storage.get = key => JSON.parse(this._global.storage.get(key));
    this._storage.set = (key, value) =>
      this._global.storage.set(key, JSON.stringify(value));
    // this._storage.remove = prepareStorage.remove.bind(_storage);
    // this._storage.clear = prepareStorage.clear.bind(_storage);

    // analyse the model
    this.initModel(model);

    // initialize routes & actions
    this.initData(data);
    this.initGroups(indexes.concat(groups));
    this.initRoutes(routes);
    this.initFilters(filters);
    this.initActions(actions);

    // Bind watchers
    this.watchers = watch;

    // map collection categories to shared namespace
    this.prepareNamespace();

    // Load persisted values from storage
    this.initPersist(persist);
  }

  /**
   * Initializse the data and deep reactivity
   * @param {Object} data
   */
  initData(data) {
    Object.keys(data).forEach(key => {
      this._mutableData.push(key);
      this.initDeepReactivity(data, key);
    });
    this._public.data = this.initProxy(data);
  }

  /**
   * Initializse the groups and their respective indexes.
   * @param {Array} groups
   */
  initGroups(groups) {
    this._public.groups = this.initProxy({});
    for (let index of groups) {
      if (this._public.groups[index] || this._indexes[index])
        return assert(`Duplicate declaration for index ${index}`);
      // create a new empty array for the index
      this._indexes[index] = new Array();
      this._public.groups[index] = new Array();
    }
  }

  /**
   * Initializse the filters
   * @param {Object} filters
   */
  initFilters(filters) {
    // map filters
    let loop = Object.keys(filters);
    // this._public.filters = this.initProxy({});
    for (let filterName of loop) {
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
    let loop = Object.keys(routes);
    for (let routeName of loop) {
      this._public.routes[routeName] = customParam => {
        return routes[routeName](this._global.request, customParam);
      };
    }
  }

  /**
   * Initializse the actions
   * @param {Object} routes
   */
  initActions(actions) {
    for (let actionName of Object.keys(actions)) {
      // build a wrapper around the action to provide it data and intercept usage
      this._public.actions[actionName] = customParam => {
        if (this._throttles.includes(actionName)) return Promise.reject();

        // declare action is running
        this._performingAction = actionName;

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

        // run action
        let runAction = actions[actionName](context, customParam);

        // declare action has finsihed
        this._performingAction = false;

        return runAction;
      };
      // }
    }
  }

  /**
   * Initializse persist
   * @param {Array} persist
   */
  initPersist(persist = []) {
    for (let property of persist) {
      this._persist.push(property);
      let storageKey = `_${this._name}_${property}`;
      // find property in storage
      if (!this._public.hasOwnProperty(property))
        return assert(
          `Unable to persist property "${property}" in collection "${
            this._name
          }" as it does not exist.`
        );

      let type = this.searchNamespaceForProperty(property);
      let data = this._storage.get(storageKey);
      if (data) {
        if (type) {
          this._allowInternalChange = true;
          this._public[type][property] = data;
          this._allowInternalChange = false;

          if (this._public.hasOwnProperty(property)) {
            this._allowInternalChange = true;
            this._public[property] = data;
            this._allowInternalChange = false;
          }
          this.initDeepReactivity(this._public, property);
        } else {
          assert(`Unable to persist. Could not determin property type.`);
        }
      } else {
        if (type) {
          this._storage.set(storageKey, this._public[type][property]);
        }
      }
    }
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
    else
      objectWithCustomPrototype = Object.create({
        rootProperty,
        ...this._actionRefrence
      });

    for (let property of Object.keys(obj))
      objectWithCustomPrototype[property] = obj[property];

    if (deepProxy)
      return new Proxy(objectWithCustomPrototype, {
        set: (target, key, value) => {
          if (Object.getPrototypeOf(target).rootProperty) {
            let rootProperty = Object.getPrototypeOf(target).rootProperty;
            if (this._mutableData.includes(rootProperty)) {
              target[key] = value;
              this.updateSubscribers(rootProperty, this._public[rootProperty]);
              // this.findAndUpdateDependents(rootProperty);
            }
            return true;
          }
          target[key] = value;
          return true;
        },
        get: (target, key, value) => {
          // this._validateProxy = true;
          return target[key];
        }
      });

    return new Proxy(objectWithCustomPrototype, {
      set: (target, key, value) => {
        if (
          !this._global.initComplete ||
          this._allowInternalChange
          // this._executing
        ) {
          target[key] = value;
          this._allowInternalChange = false;
          return true;
        }

        // For regular mutations to root data
        if (this._mutableData.includes(key)) {
          target[key] = value;
          // in case this new data is an object, we should apply proxies to eligible sub properties
          this.initDeepReactivity(target, key);
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

  isWatchableObject(value) {
    let type = typeof value;
    return (
      value != null &&
      type == 'object' &&
      !(value instanceof HTMLElement) &&
      !Array.isArray(value)
    );
  }

  initDeepReactivity(target, key) {
    // return;
    let nextToAnalyse = [];
    let rootProperty;

    if (this.isWatchableObject(target[key])) {
      // find root property otherwise set to the name of this object
      if (Object.getPrototypeOf(target).rootProperty) {
        rootProperty = Object.getPrototypeOf(target).rootProperty;
      } else {
        rootProperty = key;
      }
      // make rootProperty a proxy
      this._allowInternalChange = true;
      target[key] = this.initProxy(target[key], rootProperty, true);

      // push all children of rootPropery to queue
      for (let property of Object.keys(target[key])) {
        if (this.isWatchableObject(target[key][property]))
          nextToAnalyse.push({ target: target[key], key: property });
      }
      const loop = () => {
        let next = nextToAnalyse;
        nextToAnalyse = [];
        // loop over queue
        for (let item of next) {
          let key = item.key;
          let target = item.target;
          // convert target to proxy

          target[key] = this.initProxy(target[key], rootProperty, true);

          // loop over properties of item in queue
          for (let property of Object.keys(target[key])) {
            // is the property an object?
            if (this.isWatchableObject(target[key][property])) {
              // if so push target to queue to check properties next round
              nextToAnalyse.push({ target: target[key], key: property });
            }
          }
        }
        if (nextToAnalyse.length > 0) loop();
        else this._allowInternalChange = false;
      };
      loop();
    }
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
        } else if (config === 'parent') {
          this.createDataRelation(
            property,
            model[property].parent,
            model[property].assignTo
          );
        } else if (config === 'has') {
          this.createGroupRelation(
            property,
            model[property].has,
            model[property].assignTo
          );
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

    this.emitToRoot('createForeignGroupRelation', {
      collection: this._name
    });
  }

  // returns the address of a public property
  searchNamespaceForProperty(property) {
    // debugger;
    let searchable = ['filters', 'data', 'groups'];
    for (let type of searchable) {
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

  // reserves the namespace on the component instance before runtime
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
    let genericPrimaryIds = ['id', '_id'];
    // detect a primary key
    for (let key of genericPrimaryIds) {
      if (item.hasOwnProperty(key)) this._primaryKey = key;
    }
    if (!this._primaryKey)
      this.dataRejectionHandler(item, 'No primary key supplied.');
  }

  createRelationForIndex(index) {
    for (let primaryKey of Object.keys(this._relations))
      this._relations[primaryKey][index] = [];
  }

  /**
   * For each relation the in _groupRelations...
   * @param {Object} name - description
   */
  createRelationForGroup(index) {}

  // this is called by the main class once all collections have been constructed, it runs through each filter, executing the function. It  then uses the data proxy to detect which properties the filter wants to access, and saves them in a dependency graph. NOTE: If the filter has an if statement, and a property is
  analyseFilters() {
    if (!this._filters) return;
    let loop = Object.keys(this._filters);
    for (let filter of loop) {
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
    let found = this._global.dependenciesFound;

    // empty the list of dependencies for next loop
    this._global.dependenciesFound = [];

    // preliminarily loop over dependencys to find missing dependents
    for (let dependency of found) {
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

  rebuildGroupsWithRelations() {
    // for (let relationKey of Object.keys(this._groupRelations)) {
  }

  // this will fill the index array with the correposonding data and include relational data
  buildGroupFromIndex(index) {
    // constuct the data from the index
    let data = this._indexes[index].map(id => {
      let data = this._data[id];

      // Data relations
      for (let relationKey of Object.keys(this._relations)) {
        let rel = this._relations[relationKey];
        let assignTo = rel.hasOwnProperty('assignTo') ? rel.assignTo : false;

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
      for (let relationKey of Object.keys(this._groupRelations)) {
        let rel = this._groupRelations[relationKey];
        let assignTo = rel.hasOwnProperty('assignTo') ? rel.assignTo : false;

        if (data.hasOwnProperty(relationKey)) {
          let foreignData = this._global.dataRef[rel.fromCollectionName][
            relationKey
          ];

          if (foreignData) {
            if (assignTo) data[assignTo] = foreignData;
            else data[rel.fromCollectionName] = foreignData;
          }
        }
      }

      return data;
    });

    if (
      this._public.hasOwnProperty(index) ||
      this._public.groups.hasOwnProperty(index)
    )
      // deliver data to public object
      this.deliverUpdate('groups', data, index);

    // update public index refrence
    this._allowInternalChange = true;
    this._public.indexes[index] = this._indexes[index];
    this._allowInternalChange = false;

    // trigger other collections to regen their groups if any depend on groups from this collection
    if (this._foreignGroupRelations) {
      for (let collection of this._foreignGroupRelations) {
        this.emitToRoot('rebuildGroupsWithRelations', {
          collection
        });
      }
    }

    // return data for functions like "findGroup"
    return data;
  }

  // Source data has been modified, these are the functions that will update the relevent indexes and filters to regnerate
  internalDataModified(primaryKey) {
    this.findGroupsToRegen(primaryKey);
    this.findFiltersToRegen(primaryKey);
    this.regenerateGroupsAndFilters();
  }

  deliverUpdate(type, data, name) {
    // process update, allowInternalChange instructs Proxy to bypass user mutation validation and to not search for dependents to update, as it is already taken care of
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
  }

  updateSubscribers(key, data) {
    Log(`Updating subscribers for ${key}`);
    // trigger watcher for data
    if (this.watchers.hasOwnProperty(key))
      // push to bottom of call stack to ensure dependencies have generated
      setTimeout(() => this.watchers[key](this._global.dataRef));
    // persist data if need be
    this.persistData(key, data);

    if (this._subscribedToData[key])
      for (let item of this._subscribedToData[key]) {
        item.component.$set(item.component, item.key, data);
      }
  }

  recordHistory(type, data) {
    let historyItem = {
      type,
      timestamp: Date.now(),
      collection: this._name,
      fromAction: this._performingAction,
      data
    };
    this._global.history.push(historyItem);
  }

  populateDependencies(found, filter) {
    let depGraph = this._global.dependencyGraph;
    for (let dependency of found) {
      // Register dependencies of this filter, only filters have this.
      let key1 = `${dependency.collection}/${dependency.property}`;
      let location1 = depGraph[this._name][filter];

      if (!location1.dependencies.includes(key1)) {
        location1.dependencies.push(key1);
      }
      // register this filter as a dependent for the foreign filter or data property
      let key2 = `${this._name}/${filter}`;
      let location2 = depGraph[dependency.collection][dependency.property];

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
    let glob = this._global;
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
    for (let dep of dependents) {
      lastRound.push(dep);
      dependenciesFound.push(dep);
    }
    const loop = () => {
      loops++;
      let loopChildren = lastRound;
      lastRound = [];
      for (let dep of loopChildren) {
        let depParsed = this.parseKey(dep);
        let search = graph[depParsed.collection][depParsed.property].dependents;
        for (let childDep of search) {
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
      for (let i of propertyChanged) {
        let deps = this.findAllDependents(i);
        for (let dep of deps)
          if (!allDependents.includes(dep)) allDependents.push(dep);
      }
    } else {
      allDependents = this.findAllDependents(propertyChanged);
    }
    Log(`Found dependents: ${JSON.stringify(allDependents)}`);
    this.pushDependentsToRegenQueue(allDependents);
  }

  pushDependentsToRegenQueue(dependentFilters) {
    for (let filter of dependentFilters) {
      let parsedFilter = this.parseKey(filter);
      // check if already in regen queue
      if (
        !this._regenQueue.find(
          item =>
            item.property === parsedFilter.property &&
            item.collection === parsedFilter.collection
        )
      ) {
        // add to queue
        this._regenQueue.push({
          type: 'filter',
          property: parsedFilter.property,
          collection: parsedFilter.collection
        });
      }
    }
    // send a message back to the main class. Refrencing would be impossible without creating a circular refrence, so to avoid that we use proxies to trigger events
    this.emitToRoot('processRegenQueue');
  }

  forceUpdate(filter) {
    this._regenQueue.push({
      type: 'filter',
      property: filter,
      collection: this._name
    });
    this.emitToRoot('processRegenQueue');
  }

  collect(data, index) {
    // validate
    if (!data)
      return assert(
        `Collect error on collection ${this._name}: Data undefined`
      );
    if (!Array.isArray(data)) data = [data];

    this._collecting = true;
    let indexIsArray = false;
    let indexesModified = [];
    let indexesCreated = [];

    // create the index
    if (index) {
      if (Array.isArray(index)) {
        indexIsArray = true;
        for (let i of index) {
          this.createRelationForIndex(i);
          this._indexesToRegen.push(i);
          if (!this._indexes[i]) {
            this._indexes[i] = [];
          }
          indexesModified.push(i);
        }
      } else {
        this.createRelationForIndex(index);
        this._indexesToRegen.push(index);
        if (!this._indexes[index]) {
          this._indexes[index] = [];
        }
        indexesCreated.push(index);
      }
    }
    // process the data
    if (!Array.isArray(data)) this.processDataItem(data, index);
    else for (let item of data) this.processDataItem(item, index, data);

    // update any existing indexes where data has been added

    // record the changes
    this.recordHistory('collect', {
      dataCollected: data,
      indexesCreated,
      indexesModified
    });

    this._collecting = false;
    console.log(
      `Collected ${data.length} items in ${this._name}. With index: ${index}`
    );

    this.regenerateGroupsAndFilters();
  }

  processDataItem(data, index) {
    let overwrite = true;
    // validate against model
    // if no primary key defined in the model, search for a generic one.
    if (!this._primaryKey) this.findPrimaryKey(data);

    // if that primary key does not exist on this data item, reject.
    if (!data.hasOwnProperty(this._primaryKey))
      return this.dataRejectionHandler(data, 'Primary key mismatch');

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
    if (index && !this._indexes[index].includes(itemID)) {
      this._indexes[index].push(itemID);
    }

    for (let relationKey of Object.keys(this._relations)) {
      let relation = this._relations[relationKey];
      if (Array.isArray(relation[index]))
        relation[index].push(data[relationKey]);
    }

    // if we've already collected this item, it may exist in other indexes, so regenerate those.
    // (bug: hasOwnProperty didn't work here)
    if (Object.keys(this._data).includes(itemID))
      this.findGroupsToRegen(itemID);

    // Some filters might have direct links to this piece of data or index (EG: "getGroup()" or "findByID()")
    this.findFiltersToRegen(itemID, index);

    // add the data internally
    this._data[itemID] = data;
    if (overwrite) this._collectionSize++;
  }

  findGroupsToRegen(itemID) {
    Log(`looking for indexes for ${itemID}`);
    // check existing indexes for primary key id, here is where we determin which, if any, indexes need to be regenerated
    for (let indexName of Object.keys(this._indexes)) {
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

  findFiltersToRegen(primaryKey, indexes) {
    //
    const findFilters = (source, index) => {
      Object.keys(this[source]).forEach(filterName => {
        if (this[source][filterName].includes(index)) {
          // push the filter to the regen queue, but only if it is not already there.
          if (!this._filtersToForceRegen.includes(filterName))
            this._filtersToForceRegen.push(filterName);
        }
      });
    };

    // for several indexes
    if (Array.isArray(indexes))
      for (let index of indexes) findFilters('_filtersRelatedToGroup', index);
    // for a singular index
    else findFilters('_filtersRelatedToGroup', indexes);
    // for singular data
    findFilters('_filtersRelatedToData', primaryKey);
  }

  regenerateGroupsAndFilters() {
    // add the indexes to the regen queue first
    for (let i of this._indexesToRegen) {
      Log(`Rebuilding index ${i}`);
      let index = this._indexesToRegen.shift();
      this.buildGroupFromIndex(index);
      // any filters dependent on the indexes we've added data too should be regenerated
      if (this._global.dataRef[this._name][index])
        this.findAndUpdateDependents(index);
    }
    // check for filters to force regen and push them to the regen queue. The regen queue will not accept the same filter twice, so if the dependency graph finds this filter too, it won't generate twice.
    let filtersToForceRegenEncoded = [];
    for (let filter of this._filtersToForceRegen)
      filtersToForceRegenEncoded.push(`${this._name}/${filter}`);
    // the regen queue function need the filter concat with the collection name
    this.pushDependentsToRegenQueue(filtersToForceRegenEncoded);
    // clean up once sent
    this._filtersToForceRegen = [];
  }

  // this function
  undo() {
    Log('undo requested, coming soon!');
  }

  // move data by id (or array of IDs) into another index
  move(ids, sourceIndex, destIndex) {
    // Validate
    if (!this._indexes[sourceIndex])
      return assert(`Index "${sourceIndex}" not found`);
    if (!this._indexes[destIndex])
      return assert(`Index "${destIndex}" not found`);
    if (!Array.isArray(ids)) ids = [ids];

    // record previous values
    let history = {
      ids,
      previousSourceIndex: sourceIndex,
      previousDestIndex: destIndex
    };

    // make changes
    for (let id of ids) {
      if (!this._data[id])
        return assert(
          `Data for id "${id}" not found in collection ${this._name}`
        );

      // remove from source index
      this._indexes[sourceIndex] = this._indexes[sourceIndex].filter(
        item => item !== id
      );

      //add to dest index
      this._indexes[destIndex].push(id);
    }

    // rebuild groups
    this.buildGroupFromIndex(sourceIndex);
    this.buildGroupFromIndex(destIndex);

    // record history
    this.recordHistory('move', history);

    // update dependents
    this.findAndUpdateDependents([sourceIndex, destIndex]);
  }

  remove(data, group) {
    // validate
    if (!this._indexes[group]) return assert(`Group "${group}" not found.`);
    if (!Array.isArray(data)) data = [data];
    // are we dealing with full data or an index
    if (data[0].hasOwnProperty(this._primaryKey)) {
      // we're dealing with full data, so we need to validate and map to ids
      data = data.map(item => item[this._primaryKey]);
    } else if (typeof data[0] !== 'number') {
      return assert(`Unable to remove data.`);
    }

    let previousValue = this._indexes[group];

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
  put(ids, destIndex) {
    // Validate
    if (!this._indexes[destIndex])
      return assert(`Index "${destIndex}" not found`);
    if (!Array.isArray(ids)) ids = [ids];

    // record previous value
    let previousDestIndex = Object.assign({}, this._indexes[destIndex]);

    // Loop
    for (let id of ids) {
      if (!this._data[id])
        return assert(
          `Data for id "${id}" not found in collection ${this._name}`
        );
      this._indexes[destIndex].push(id);
    }

    this.buildGroupFromIndex(destIndex);

    this.recordHistory('put', {
      ids,
      previousDestIndex
    });

    this.findAndUpdateDependents(destIndex);
  }

  // change single or multiple properties in your data
  update(id, propertiesToChange) {
    if (this._data[id]) {
      let data = this._data[id];

      let loop = Object.keys(propertiesToChange);

      let history = {
        dataId: id,
        previousValues: {},
        newValues: propertiesToChange
      };

      for (let property of loop) {
        if (!data.hasOwnProperty(property))
          assert(`Data "${id}" does not have property "${property}" to update`);

        history.previousValues[property] = data[property];

        data[property] = propertiesToChange[property];
      }

      this.recordHistory('update', history);

      this.internalDataModified(id);
    } else {
      assert(`Data for id "${id}" not found in collection ${this._name}`);
    }
  }

  findById(id) {
    // if called from within a filter create an internal index tied to this filter, now when dependent data is changed we can regenerate this filter
    if (this._executing) this._filtersRelatedToData[this._executing] = [id];
    // if filtername is not specified, it was called from outside, in which case could never be reactive
    if (this._data[id]) return this._data[id];
    else {
      // this can be hooked on the collection config
      // this.emit('onMissingId', id)
      Log(`findByID: Item "${id}" not found in collection "${this._name}"`);
    }
  }

  getGroup(id) {
    if (this._executing) this._filtersRelatedToGroup[this._executing] = [id];

    if (this._indexes[id]) return this.buildGroupFromIndex(id);
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
    debugger;
    const deleteFunction = primaryKey => {
      // if (!Object.keys(this._data).includes(primaryKey)) return;
      let deletedData = Object.assign({}, this._data.primaryKey);
      delete this._data[primaryKey];

      this.recordHistory('delete', {
        deleted: deletedData
      });

      this.internalDataModified(primaryKey);
    };
    if (Array.isArray(items))
      for (let primaryKey of items) deleteFunction(primaryKey);
    else deleteFunction(items);
  }

  deleteGroup(group) {
    if (!this._indexes[group]) return assert(`Group "${group}" not found.`);
    // delete actual data
    for (let id of this._indexes[group]) {
      if (this._data[id]) delete this._data[id];
    }
    let previousValue = this._indexes[group];
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

  clean() {}

  increment(primaryKey, property, amount) {
    if (!validateNumberForDataProperty(primaryKey, property, amount)) return;

    this._data[primaryKey][property] += amount;

    this.recordHistory('increment', {
      previousValue: amount
    });

    this.internalDataModified(primaryKey);
  }

  decrement(primaryKey, property, amount) {
    if (!validateNumberForDataProperty(primaryKey, property, amount)) return;

    this._data[primaryKey][property] -= amount;

    this.recordHistory('decrement', {
      previousValue: amount
    });

    this.internalDataModified(primaryKey);
  }

  throttle(amount) {
    // preserve current action name on invoke
    let actionToThrottle = this._performingAction;
    this._throttles.push(actionToThrottle);
    setTimeout(() => {
      this._throttles = this._throttles.filter(
        action => action !== actionToThrottle
      );
    }, amount);
  }

  set(target, mutation) {
    console.log(target, mutation);
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
