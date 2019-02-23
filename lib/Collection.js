import { Log, assert, warn } from './Utils';

// This class is somewhat similar to modules in typical state storage libraries, but instead supports functions.
// It's state is loaded into the main state tree.
export default class Collection {
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
      persist = []
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
      findById: this.findById.bind(this)
    };

    // this is used to pass the collections public properties into other collections without creating a circular refrence for the entire collection. It also helps control namespace.
    this._public = this.initProxy({
      groups: Object.create(null),
      data: Object.create(null),
      actions: Object.create(null),
      filters: Object.create(null),
      routes: Object.create(null),
      ...this._actionRefrence
    });

    this._model = model; // the model for validating data
    this._filters = filters;
    this._data = Object.create(null); // the internal data store
    this._indexes = Object.create(null); // arrays of primary keys
    this._filterIndexes = Object.create(null);
    this._mutableData = [];
    this._dataProxy = null;
    this._indexesToRegen = [];
    this._filtersToForceRegen = [];
    this._collecting = false;
    this._primaryKey = null;
    this._collectionSize = 0;
    this._global = global;
    this._regenQueue = this._global.regenQueue;
    this._executing = false;
    this._relations = {};

    // so other collections can access this collection's internal data
    this._global.internalDataRef[this._name] = this._data;

    this._storage = Object.create(null);
    this._storage.get = key => JSON.parse(this._global.storage.get(key));
    this._storage.set = (key, value) =>
      this._global.storage.set(key, JSON.stringify(value));
    // this._storage.remove = prepareStorage.remove.bind(_storage);
    // this._storage.clear = prepareStorage.clear.bind(_storage);

    // analyse the model
    this.parseModel(model);

    // initialize routes & actions
    this.initData(data);
    this.initGroups([...indexes, ...groups]);
    this.initRoutes(routes);
    this.initFilters(filters);
    this.initActions(actions);

    this.prepareNamespace();

    this.initPersist(persist);
  }

  parseModel(model) {
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
        }
      });
    });
  }

  createDataRelation(primaryKeyName, fromCollectionName, assignTo) {
    // if this is a valid collection
    if (!this._global.collectionNamespace.includes(fromCollectionName))
      return assert(`"${collection}" is not a valid collection.`);
    // create an object for group names, which will contain arrays of primary keys
    this._relations[primaryKeyName] = {};
    this._relations[primaryKeyName].fromCollectionName = fromCollectionName;
    if (assignTo) this._relations[primaryKeyName].assignTo = assignTo;
  }

  initGroups(indexes) {
    this._public.groups = this.initProxy({});
    for (let index of indexes) {
      if (this._public.groups[index] || this._indexes[index])
        return assert(`Duplicate declaration for index ${index}`);
      // create a new empty array for the index
      this._indexes[index] = new Array();
      this._public.groups[index] = new Array();
    }
  }

  initData(data) {
    Object.keys(data).forEach(key => this._mutableData.push(key));
    this._public.data = this.initProxy(data);
  }

  initFilters(filters) {
    // map filters
    let loop = Object.keys(filters);
    this._public.filters = this.initProxy({});
    for (let filterName of loop) {
      // set the property to an empty array, until we've parsed the filter
      this._public.filters[filterName] = [];
      this._global.allFilters.push(filterName);
    }
  }

  initRoutes(routes) {
    let loop = Object.keys(routes);
    for (let routeName of loop) {
      this._public.routes[routeName] = customParam => {
        return routes[routeName](this._global.request, customParam);
      };
    }
  }

  initActions(actions) {
    let loop = Object.keys(actions);
    for (let actionName of loop) {
      // if (this.checkNamespace(actionName)) {
      // build a wrapper around the action to provide it data and intercept usage
      this._public.actions[actionName] = customParam => {
        // console.log(arguments);
        // declare action is running

        // run action
        return actions[actionName](
          {
            ...this._global.dataRef,
            ...this._actionRefrence,
            data: this._public.data,
            filters: this._public.filters,
            groups: this._public.groups,
            actions: this._public.actions,
            routes: this._public.routes
          },
          customParam
        );

        // declare action has finsihed
      };
      // }
    }
  }

  initPersist(persist = []) {
    this._persist = [];
    for (let property of persist) {
      this._persist.push(property);
      let storageKey = `_${this._name}_${property}`;
      // find property in storage
      if (!this._public.hasOwnProperty(property))
        return assert(
          `Unable to persist property "${property}" as it does not exist.`
        );
      let type = this.searchNamespaceForProperty(property);
      if (this._storage.get(storageKey)) {
        if (type) {
          this._allowInternalChange = true;
          this._public[type][property] = this._storage.get(storageKey);

          if (this._public.hasOwnProperty(property)) {
            this._allowInternalChange = true;
            this._public[property] = this._storage.get(storageKey);
          }
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

  initProxy(obj) {
    return new Proxy(obj || {}, {
      set: (target, key, value) => {
        // during initialization, allow proxy to be edited without intercepting
        if (!this._global.initComplete) {
          target[key] = value;
        } else if (this._allowInternalChange === true) {
          // only update dependencies if pulse has finished initalizing and the data is not a filter or index
          Log(`Internally mutating value ${key}`);
          target[key] = value;
        } else if (this._mutableData.includes(key)) {
          Log(`User mutated data: "${key}"`);

          target[key] = value;

          // first push the change
          this.updateSubscribers(key, value);
          // now process any dependents that are affected by this change
          this.findAndUpdateDependents(key);
        } else {
          assert(
            `Cannot set data property "${key}" in collection "${
              this._name
            }". Filters and groups are not mutable.`
          );
        }
        this._allowInternalChange = false;
        return true;
      },
      get: (target, key, value) => {
        if (
          this._global.record &&
          // prevent proxy from reporting access to these properties, as they have their own proxy
          !['filters', 'groups', 'indexes', 'data', 'actions'].includes(key)
        ) {
          this._global.dependenciesFound.push({
            property: key,
            collection: this._name
          });
        } else if (this._global.initComplete) {
          // console.log(`READING ${key}`);
          let depGraph = this._global.componentDependencyGraph;
          let component = this._global.analysingComponent;
          let encodedKey = `${this._name}/${key}`;
          if (
            depGraph.hasOwnProperty(component) &&
            !depGraph[component].includes(encodedKey)
          ) {
            // console.log('ACCESSED: ', encodedKey);
            depGraph[component].push(encodedKey);
          } else depGraph[component] = [encodedKey];
        }
        return target[key];
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

    Log(`Dependents found: ${found.length}`);

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

      if (location2 && !location2.dependents.includes(key2)) {
        location2.dependents.push(key2);
      }
    }
  }

  parseKey(key) {
    return {
      collection: key.split('/')[0],
      property: key.split('/')[1]
    };
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
    let lastRound = [];
    for (let dep of dependents) {
      lastRound.push(dep);
      dependenciesFound.push(dep);
    }
    const loop = () => {
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
      if (lastRound.length !== 0) loop();
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
    this._global.eventBus.message = 'processRegenQueue';
  }

  executeFilter(filter) {
    this._executing = filter;
    let data = this._filters[filter]({
      // spread each collection's data to the filter
      ...this._global.dataRef,
      ...this._actionRefrence,
      // findById: id => this.findById(id, filter),
      data: this._public.data,
      filters: this._public.filters,
      groups: this._public.groups,
      actions: this._public.actions
    });
    this._executing = false;
    // filter executed, now ensure the door is closed before deliverUpdate, as that will trigger the proxy's set trap- and with this still true it will cause an infinate loop.
    this._global.record = false;

    // update subscribers
    this.deliverUpdate('filters', data, filter);
  }

  // this will fill the index array with the correposonding data and include relational data
  buildDataFromIndex(index) {
    // constuct the data from the index
    let data = this._indexes[index].map(id => {
      let data = this._data[id];
      for (let relationKey of Object.keys(this._relations)) {
        let rel = this._relations[relationKey];
        // debugger;
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
      return data;
    });

    // apply a default sort rule to the index here, maybe?
    this.deliverUpdate('groups', data, index);
  }

  deliverUpdate(type, data, name) {
    // process update, allowInternalChange instructs Proxy to bypass user mutation validation and to not search for dependents to update, as it is already taken care of
    this._allowInternalChange = true;
    this._public[type][name] = data;
    // update root namespaces, eventually add setting here for users that want to disable root namespace assignment
    if (this._public.hasOwnProperty(name)) {
      this._allowInternalChange = true;
      this._public[name] = data;
    }
    this.updateSubscribers(name, data);
  }

  // This will
  updateSubscribers(key, data) {
    this.persistData(name, data);

    Log(`Updating subscribers for ${key}`);

    let encodedKey = `${this._name}/${key}`;

    for (let component of Object.keys(this._global.componentDependencyGraph)) {
      if (
        this._global.componentDependencyGraph[component].includes(encodedKey) &&
        this._global.subscribedComponents[component]
      ) {
        this._global.subscribedComponents[component].$forceUpdate();
      }
    }
  }

  persistData(key, value) {
    if (this._persist.includes(key)) {
      let storageKey = `_${this._name}_${key}`;
      Log(`Persisting data with key ${storageKey}`);
      this._storage.set(storageKey, value);
    }
  }

  createRelationForIndex(index) {
    for (let primaryKey of Object.keys(this._relations))
      this._relations[primaryKey][index] = [];
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
    this._global.history.push({
      collected: {
        collection: this._name,
        timestamp: new Date(),
        dataCollected: data,
        indexesCreated,
        indexesModified
      }
    });

    this._collecting = false;
    Log(`Collected ${data.length} items. With index: ${index}`);

    this.regenerateIndexes();
  }

  processDataItem(data, index) {
    // validate against model
    // if no primary key defined in the model, search for a generic one.
    if (!this._primaryKey) this.findPrimaryKey(data);

    // if that primary key does not exist on this data item, reject.
    if (!data.hasOwnProperty(this._primaryKey))
      this.dataRejectionHandler(data, 'Primary key mismatch');

    // check if we already have the data
    if (this._data[data[this._primaryKey]]) {
      // see if it exists on any other indexes?
    }

    // push id into index provided it doesn't already exist on that index
    if (index && !this._indexes[index].includes(index)) {
      this._indexes[index].push(data[this._primaryKey]);
    }

    for (let relationKey of Object.keys(this._relations)) {
      let relation = this._relations[relationKey];
      if (Array.isArray(relation[index]))
        relation[index].push(data[relationKey]);
    }

    // if we've already collected this item, it may exist in other indexes, so regenerate those.
    if (Object.keys(this._data).includes(data[this._primaryKey])) {
      findIndexesToRegen(data[this._primaryKey]);
    }
    this.findFilterIndexesToRegen(data[this._primaryKey]);

    // add the data internally
    this._data[data[this._primaryKey]] = data;
    this._collectionSize++;
  }

  findIndexesToRegen(primaryKey) {
    Log(`looking for indexes for ${primaryKey}`);
    // check existing indexes for primary key id, here is where we determin which, if any, indexes need to be regenerated
    let loop = Object.keys(this._indexes);
    for (let indexName of loop) {
      if (
        // the data item exists already in another index
        this._indexes[indexName].includes(primaryKey) &&
        // we haven't already established this index needs regeneration
        !this._indexesToRegen.includes(indexName)
      ) {
        this._indexesToRegen.push(indexName);
      }
    }
  }

  findFilterIndexesToRegen(primaryKey) {
    // find filters to regen for data that was queried manually
    Object.keys(this._filterIndexes).forEach(filterName => {
      if (this._filterIndexes[filterName].includes(primaryKey)) {
        // push filter directly into regen queue
        Log('AYYY WE COLLECTED THE THING');
        if (!this._filtersToForceRegen.includes(filterName))
          this._filtersToForceRegen.push(filterName);
      }
    });
  }

  regenerateIndexes() {
    // add the indexes to the regen queue first
    for (let i of this._indexesToRegen) {
      Log(`Rebuilding index ${i}`);
      let index = this._indexesToRegen.shift();
      this.buildDataFromIndex(index);
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

  findPrimaryKey(item) {
    let genericPrimaryIds = ['id', '_id'];
    // detect a primary key
    for (let key of genericPrimaryIds) {
      if (item.hasOwnProperty(key)) this._primaryKey = key;
    }
    if (!this._primaryKey)
      this.dataRejectionHandler(item, 'No primary key supplied.');
  }

  // Source data has been modified, these are the functions that will update the relevent indexes and filters to regnerate
  internalDataModified(primaryKey) {
    this.findIndexesToRegen(primaryKey);
    this.findFilterIndexesToRegen(primaryKey);
    this.regenerateIndexes();
  }

  // this function
  undo() {
    Log('undo requested, coming soon!');
  }
  // put data by id (or array of IDs) into another index
  put(id, index, moveTo) {
    if (!this._indexes[index]) return assert(`Index "${index}" not found`);
    if (this._data[id]) {
      this._indexes[index].push(id);
      if (moveTo) {
        if (!this._indexes[moveTo]) return assert(`Index "${index}" not found`);
        this._indexes[moveTo] = this._indexes[moveTo].filter(
          item => item !== id
        );
        // rebuild old index
        this.buildDataFromIndex(index);
        // rebuild dest index
        this.buildDataFromIndex(moveTo);

        this.findAndUpdateDependents([moveTo, index]);
      } else {
        this.buildDataFromIndex(index);
        this.findAndUpdateDependents(index);
      }
    } else {
      // run missing id event or
      assert(`Data for id "${id}" not found in collection ${this._name}`);
    }
  }

  // move data by id (or array of IDs) into another index
  move(id, index, moveTo) {
    this.put(id, index, moveTo);
  }

  // change single or multiple properties in your data
  update(id, propertiesToChange) {
    if (this._data[id]) {
      let data = this._data[id];

      let loop = Object.keys(propertiesToChange);

      for (let property of loop) {
        if (!data.hasOwnProperty(property))
          assert(`Data "${id}" does not have property "${property}" to update`);

        data[property] = propertiesToChange[property];
      }
      this.internalDataModified(primaryKey);
    } else {
      assert(`Data for id "${id}" not found in collection ${this._name}`);
    }
  }

  findById(id) {
    // debugger;
    // if called from within a filter create an internal index tied to this filter, this will mean when the data is changed we can regenerate this filter
    if (this._executing) this._filterIndexes[this._executing] = [id];
    // if filtername is not specified, it was called from outside, in which case could never be reactive
    if (this._data[id]) return this._data[id];
    else {
      // this can be hooked on the collection config
      // this.emit('onMissingId', id)
      Log(`findByID: Item "${id}" not found in collection "${this._name}"`);
    }
  }

  // removes data via primary key from a collection
  delete() {}

  clean() {}

  increment(primaryKey, property, amount) {
    if (!validateNumberForDataProperty(primaryKey, property, amount)) return;

    this.internalDataModified(primaryKey);
  }

  decrement(primaryKey, property, amount) {
    if (!validateNumberForDataProperty(primaryKey, property, amount)) return;
    this._data[primaryKey][property] -= amount;
    this._global.history.push({
      decremented: {
        collection: this._name,
        timestamp: new Date(),
        dataCollected: data,
        indexesCreated,
        indexesModified
      }
    });
    this.internalDataModified(primaryKey);
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

  // this processes any

  // updateAllIndexesByDataID(id) {
  //   let loop = Object.keys(this._indexes);
  //   let indexes = [];
  //   for (let index of loop) {
  //     if (this._indexes[index].includes(id)) indexes.push(index);
  //   }
  //   this.findAndUpdateDependents(indexes);
  // }

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
}
