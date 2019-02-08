import { Log, assert } from "./Utils";

// This class is somewhat similar to modules in typical state storage libraries, but instead supports functions.
// It's state is loaded into the main state tree.
export default class Collection {
  constructor(
    {
      name,
      subscribers,
      history,
      errors,
      updateSubscribers,
      globalDataRefrence,
      global
    },
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
    // from parent class
    this._name = name;
    this._subscribers = subscribers;
    this._history = history;
    this._errors = errors;
    this.updateSubscribers = updateSubscribers;

    // external properties
    this.data = this.initProxy(data);
    this.mutations = Object.create(null);
    this.actions = Object.create(null);
    this.routes = Object.create(null);
    this._model = model; // the model for validating data
    this._filters = filters;
    this._data = Object.create(null); // the internal data store
    this._indexes = Object.create(null); // arrays of primary keys

    this._dataProxy = null;
    this._globalDataRefrence = globalDataRefrence;
    this._indexesToRegen = [];
    this._collecting = false;
    this._localDataReference = [];
    this._primaryKey = null;
    this._collectionSize = 0;
    this._global = global;
    this._regenQueue = this._global.regenQueue;

    this._localActionRefrence = {
      collect: this.collect,
      undo: this.undo,
      move: this.move,
      update: this.update,
      put: this.put,
      delete: this.delete
    };

    this.allDependents = [];
    this.childDependents = [];
    // any forward facing data properties need to be present before runtime, so we must map any indexes to the collection's data property in the constructor.
    this.defineIndexes([...indexes, ...groups]);

    //  build a namespace tree that can be used by collections to access eachother
    this.mapFilterNamespaceToData(filters);

    this.prepareDependencyGraph();

    this.initRoutes(routes);

    this.initActions(actions);
  }

  checkNamespace(name) {
    const avalible = !!this.data.hasOwnProperty(name);
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

  // We shouldn't need to watch the data because it should only be modified by the collect function which handels propegating updates to subscribers automatically. But in the event that the user does modify the data manually, we should push that update to subscribers.
  initProxy(obj) {
    return new Proxy(obj || {}, {
      set: (target, key, value) => {
        // prevent from firing update if it is being handled by the collect method.
        if (this._collecting === false) {
          // do cool shit
        }
        target[key] = value;
        return true;
      },
      get: (target, key, value) => {
        if (this._global.record) {
          this._global.dependenciesFound.push({
            property: key,
            collection: this._name
          });
        }
        return target[key];
      }
    });
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
    this._global.record = false;
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

      if (!location2.dependents.includes(key2)) {
        location2.dependents.push(key2);
      }
    }
  }

  parseKey(key) {
    return {
      collection: key.split("/")[0],
      property: key.split("/")[1]
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
        type: "filter",
        property: filter,
        collection: this._name
      });
      return true;
    }
    return false;
  }

  // this function returns all the dependents decending from a particular filter
  findAllDependents(filter) {
    console.log("LOOP START", filter);

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
    console.log("OOOOOH", dependenciesFound);
    return dependenciesFound;
  }

  // this function should run when any data is changed. It will find all filters that need to be regnerated now that the parent data has changed.
  findAndUpdateDependents(propertyChanged) {
    let allDependents = this.findAllDependents(propertyChanged);
    this.pushDependentsToRegenQueue(allDependents);
  }

  pushDependentsToRegenQueue(dependentFilters) {
    console.log("LOOP WORKED", dependentFilters);
    for (let filter of dependentFilters) {
      let parsedFilter = this.parseKey(filter);
      this._regenQueue.push({
        type: "filter",
        property: parsedFilter.property,
        collection: parsedFilter.collection
      });
    }
    // send a message back to the main class. Refrencing would be impossible without creating a circular refrence, so to avoid that we use proxies to trigger events
    this._global.eventBus.message = "processRegenQueue";
  }

  executeFilter(filter) {
    let data = this._filters[filter]({
      // spread each collection's data to the filter
      ...this._globalDataRefrence
    });

    // update subscribers
    this.deliverDataUpdate(data, filter);
  }

  filter(filter) {
    let from = filter.from;
    if (this.data.hasOwnProperty(from)) {
      // the source to filter from is in this collection
    } else {
    }
  }

  // reserves the namespace on the component instance before runtime
  mapFilterNamespaceToData(filters) {
    // map filters
    let loop = Object.keys(filters);
    for (let filterName of loop) {
      // set the property to an empty array, until we've parsed the filter

      this.data[filterName] = [];
      this._global.allFilters.push(filterName);
    }
  }

  initRoutes(routes) {
    let loop = Object.keys(routes);
    for (let routeName of loop) {
      this.routes[routeName] = function(customParam) {
        return routes[routeName](this._global.request, customParam);
      };
    }
  }

  initActions(actions) {
    let loop = Object.keys(actions);
    for (let actionName of loop) {
      // if (this.checkNamespace(actionName)) {
      // build a wrapper around the action to provide it data and intercept usage
      this.data[actionName] = function() {
        // declare action is running

        // run action
        actions[actionName]({
          ...this._globalDataRefrence,
          ...this._localActionRefrence,
          routes: this.routes
        });

        // declare action has finsihed
      };
      // }
    }
  }

  prepareDependencyGraph() {
    let graph = this._global.dependencyGraph;
    graph[this._name] = {};
    let loop = Object.keys(this.data);
    for (let item of loop) {
      graph[this._name][item] = {
        dependencies: [],
        dependents: [],
        dependencyNames: [],
        dependentNames: []
      };
    }
  }

  // this will fill the index array with the correposonding data
  buildDataFromIndex(index) {
    // constuct the data from the index
    let data = this._indexes[index].map(id => this._data[id]);

    // apply a default sort rule to the index here, maybe?

    this.deliverDataUpdate(data, index);
  }

  deliverDataUpdate(data, index) {
    this.data[index] = data;
    this.updateSubscribers(index, data);
  }

  defineIndexes(indexes) {
    for (let index of indexes) this.createIndex(index);
  }

  // creates an index
  createIndex(index) {
    if (this.data[index] || this._indexes[index])
      return assert(`Duplicate declaration for index ${index}`);
    // create a new empty array for the index
    this._indexes[index] = new Array();
    this.data[index] = new Array();
  }

  collect(data, index) {
    this._collecting = true;
    let indexIsArray = false;
    let indexesModified = [];
    let indexesCreated = [];
    // create the index
    if (index) {
      this._indexesToRegen.push(index);
      if (Array.isArray(index)) {
        indexIsArray = true;
        for (let i of index) {
          if (!this._indexes[i]) {
            this._indexes[i] = [];
          }
          indexesModified.push(i);
        }
      } else {
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
    this._history.push({
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

    // add the indexes to the regen queue first
    for (let index of this._indexesToRegen) {
      this.buildDataFromIndex(index);
      // any filters dependent on the indexes we've added data too should be regenerated
      if (this._globalDataRefrence[this._name][index])
        this.findAndUpdateDependents(index);
    }
  }

  processDataItem(data, index) {
    // validate against model

    // if no primary key defined in the model, search for a generic one.
    if (!this._primaryKey) this.findPrimaryKey(data);

    // if that primary key does not exist on this data item, reject.
    if (!data.hasOwnProperty(this._primaryKey))
      this.dataRejectionHandler(data, "Primary key mismatch");

    // check if we already have the data
    if (this._data[data[this._primaryKey]]) {
      // see if it exists on any other indexes?
    }

    // push id into index provided it doesn't already exist on that index
    if (index && !this._indexes[index].includes(index)) {
      this._indexes[index].push(data[this._primaryKey]);
    }

    // check existing indexes for primary key id, here is where we determin which, if any, indexes need to be regenerated
    let loop = Object.keys(this._indexes);
    for (let indexName of loop) {
      if (
        // don't bother checking this index
        indexName !== index &&
        // the data item exists already in another index
        this._indexes[indexName].includes(data[this._primaryKey]) &&
        // we haven't already established this index needs regeneration
        !this._indexesToRegen.includes(indexName)
      ) {
        this._indexesToRegen.push(indexName);
      }
    }
    // add the data internally
    this._data[data[this._primaryKey]] = data;
    this._collectionSize++;
  }

  findPrimaryKey(item) {
    let genericPrimaryIds = ["id", "_id"];
    // detect a primary key
    for (let key of genericPrimaryIds)
      if (item.hasOwnProperty(key)) this._primaryKey = key;
    if (!this._primaryKey)
      this.dataRejectionHandler(item, "No primary key supplied.");
  }

  undo() {
    Log("undo requested, coming soon!");
  }

  put() {}

  move() {}

  update() {}

  delete() {}

  clean() {}
  // this processes any

  // used to save errors to the instance
  dataRejectionHandler(data, message) {
    let error = `[Data Rejection] - ${message} - Data was not collected, but instead saved to the errors object("_errors") on root Pulse instance.`;
    this._errors.push({
      data,
      timestamp: new Date(),
      error
    });
    assert(error);
  }
}
