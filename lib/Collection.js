import { Log, assert } from './Utils';

// This class is somewhat similar to modules in typical state storage libraries, but instead supports functions.
// It's state is loaded into the main state tree.
export default class Collection {
  constructor(
    { name, subscribers, updateSubscribers, global },
    {
      data = {},
      model = {},
      actions = {},
      filters = {},
      indexes = [],
      groups = [],
      routes = {}
    }
  ) {
    this._name = name;
    // from parent class
    this._subscribers = subscribers;
    this.updateSubscribers = updateSubscribers;

    this._actionRefrence = {
      collect: this.collect.bind(this),
      undo: this.undo.bind(this),
      move: this.move.bind(this),
      update: this.update.bind(this),
      put: this.put.bind(this),
      delete: this.delete.bind(this)
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
    this._mutableData = [];
    this._dataProxy = null;
    this._indexesToRegen = [];
    this._collecting = false;
    this._primaryKey = null;
    this._collectionSize = 0;
    this._global = global;
    this._regenQueue = this._global.regenQueue;
    this._relations = [];

    // analyse the model
    this.parseModel(model);

    // initialize routes & actions
    this.initData(data);
    this.initGroups([...indexes, ...groups]);
    this.initRoutes(routes);
    this.initFilters(filters);
    this.initActions(actions);

    this.prepareNamespace();

    console.log(this);
  }

  parseModel(model) {
    Object.keys(model).forEach(property => {
      Object.keys(model[property]).forEach(config => {
        if (config === 'primaryKey') {
          this._primaryKey = property;
        } else if (config === 'parent') {
          // if this is a valid collection
          let collection = model[property].parent;
          if (this._global.collectionNamespace.includes(collection)) {
            this._relations.push(collection);
          } else {
            assert(`"${collection}" is not a valid collection.`);
          }
        }
      });
    });
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
        actions[actionName](
          {
            ...this._global.dataRef,
            ...this._actionRefrence,
            routes: this._public.routes
          },
          customParam
        );

        // declare action has finsihed
      };
      // }
    }
  }

  // reserves the namespace on the component instance before runtime
  prepareNamespace() {
    // settings here..
    Object.keys(this._public).forEach(category => {
      if (['data', 'actions', 'groups', 'filters'].includes(category)) {
        Object.keys(this._public[category]).forEach(item => {
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
          console.log(`you set ${key}`);
          target[key] = value;
          this._allowInternalChange = false;
        } else if (this._mutableData.includes(key)) {
          target[key] = value;
          this.findAndUpdateDependents(key);
        } else {
          assert(
            `Cannot set data property "${key}" in collection "${
              this._name
            }". Filters and groups are not mutable.`
          );
        }
        return true;
      },
      get: (target, key, value) => {
        if (
          this._global.record &&
          // prevent proxy from reporting access to these properties, as they have their own proxy
          !['filters', 'groups', 'indexes', 'data'].includes(key)
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
    // debugger;
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

      if (!location2.dependents.includes(key2)) {
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
      this._regenQueue.push({
        type: 'filter',
        property: parsedFilter.property,
        collection: parsedFilter.collection
      });
    }
    // send a message back to the main class. Refrencing would be impossible without creating a circular refrence, so to avoid that we use proxies to trigger events
    this._global.eventBus.message = 'processRegenQueue';
  }

  executeFilter(filter) {
    let data = this._filters[filter]({
      // spread each collection's data to the filter
      ...this._global.dataRef
    });
    // filter executed, now ensure the door is closed before deliverUpdate, as that will trigger the proxy's set trap- and with this still true it will cause an infinate loop.
    this._global.record = false;

    // update subscribers
    this.deliverUpdate('filters', data, filter);
  }

  // this will fill the index array with the correposonding data
  buildDataFromIndex(index) {
    // constuct the data from the index
    let data = this._indexes[index].map(id => this._data[id]);

    // apply a default sort rule to the index here, maybe?

    this.deliverUpdate('groups', data, index);
  }

  deliverUpdate(type, data, name) {
    // process update, allowInternalChange instructs Proxy to bypass user mutation validation and to not search for dependents to update, as it is already taken care of
    this._allowInternalChange = true;
    this._public[type][name] = data;
    // update root namespaces, eventually add setting here for users that want to disable root namespace assignment
    if (this._public.hasOwnProperty(name) && this._global.initComplete) {
      this._allowInternalChange = true;
      this._public[name] = data;
    }

    this.updateSubscribers(name, data);
  }

  collect(data, index) {
    // validate
    if (!data)
      return assert(
        `Collect error on collection ${this._name}: Data undefined`
      );
    if (!Array.isArray(data)) data = [data];

    console.log(data);
    this._collecting = true;
    let indexIsArray = false;
    let indexesModified = [];
    let indexesCreated = [];
    // create the index
    if (index) {
      if (Array.isArray(index)) {
        indexIsArray = true;
        for (let i of index) {
          this._indexesToRegen.push(i);
          if (!this._indexes[i]) {
            this._indexes[i] = [];
          }
          indexesModified.push(i);
        }
      } else {
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

    this.findIndexesToRegen(data[this._primaryKey]);

    // add the data internally
    this._data[data[this._primaryKey]] = data;
    this._collectionSize++;
  }

  findIndexesToRegen(primaryKey) {
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
  }

  findPrimaryKey(item) {
    let genericPrimaryIds = ['id', '_id'];
    // detect a primary key
    for (let key of genericPrimaryIds) {
      console.log(key);
      if (item.hasOwnProperty(key)) this._primaryKey = key;
    }
    if (!this._primaryKey)
      this.dataRejectionHandler(item, 'No primary key supplied.');
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

      this.updateAllIndexesByDataID(id);
    } else {
      assert(`Data for id "${id}" not found in collection ${this._name}`);
    }
  }

  // removes data via primary key from a collection
  delete() {}

  clean() {}

  increment(primaryKey, property, amount) {
    if (!validateNumberForDataProperty(primaryKey, property, amount)) return;
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
    this.findIndexesToRegen(primaryKey);
    this.regenerateIndexes();
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

  updateAllIndexesByDataID(id) {
    let loop = Object.keys(this._indexes);
    let indexes = [];
    for (let index of loop) {
      if (this._indexes[index].includes(id)) indexes.push(index);
    }
    this.findAndUpdateDependents(indexes);
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
}
