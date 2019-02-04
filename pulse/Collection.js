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
      dependencyController
    },
    {
      data = {},
      model = {},
      actions = {},
      mutations = {},
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
    this._global = dependencyController;
    this._regenQueue = this._global.regenQueue;
    // any forward facing data properties need to be present before runtime, so we must map any indexes to the collection's data property in the constructor.
    this.defineIndexes([...indexes, ...groups]);

    //  build a namespace tree that can be used by collections to access eachother
    this.mapFilterNamespaceToData(filters);
  }

  // We shouldn't need to watch the data because it should only be modified by the collect function which handels propegating updates to subscribers automatically. But in the event that the user does modify the data manually, we should push that update to subscribers.
  initProxy(obj) {
    return new Proxy(obj || {}, {
      set: (target, key, value) => {
        // prevent from firing update if it is being handled by the collect method.
        if (this._collecting === false) {
          // this.updateSubscribers()
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

  // this is called by the main class once all collections have been constructed, it runs through each filter, executing the function. It  then uses the data proxy to detect which properties the filter wants to access, and saves them in a dependency graph.
  analyseFilters() {
    if (!this._filters) return;

    let loop = Object.keys(this._filters);

    for (let filter of loop) {
      let missingDependency = false;
      // open the door allowing each collection's data proxy to record which properties are accessed by this filter
      this._global.record = true;

      // execute the filter
      this.executeFilter(filter);

      let found = this._global.dependenciesFound;

      // data recorded, close door
      this._global.record = false;

      // empty the list of dependencies for next loop
      this._global.dependenciesFound = [];

      let depGraph = this._global.dependencyGraph;

      // if the dependency graph does not have an entry for this collection, make one
      if (!depGraph[this._name]) depGraph[this._name] = {};

      // if no entry for this filter, make one
      if (!depGraph[this._name][filter]) depGraph[this._name][filter] = {};

      // loop over the found dependencies and register this filter as a child in the dependency graph
      for (let dependency of found) {
        // if the dependency is a filter and has not yet been analysed, add this filter to the regen queue
        if (this.checkForMissingDependency(dependency.property, filter))
          missingDependency = true;

        // REGISTER DEPENDENCIES (the dependencies)
        let ownProperty = depGraph[this._name][filter];

        if (ownProperty.dependencies) {
          ownProperty.dependencies.push({
            collection: this._name,
            property: dependency.property
          });
        } else {
          ownProperty.dependencies = [
            {
              collection: this._name,
              property: dependency.property
            }
          ];
        }
        // REGISTER ON FOREIGN PROPERTIES (the dependants)
        let foreignDep = depGraph[dependency.collection];
        let property = dependency.property;

        // if there is already an entry for this property
        if (foreignDep[property]) {
          let entry = foreignDep[property];
          entry.names.push(filter);
          entry.dependents.push({
            collection: dependency.collection,
            property: filter
          });
        } else {
          let entry = (foreignDep[property] = {});
          entry.names = [filter];
          entry.dependents = [
            {
              collection: dependency.collection,
              property: filter
            }
          ];
        }
      }
      // if there's no missing dependencies for this filter, mark is as generated so other filters know they are in the clear!
      if (!missingDependency)
        this._global.generatedFilters.push(this._name + filter);
    }
  }

  checkForMissingDependency(dependency, filter) {
    if (
      this._global.allFilters.includes(dependency) &&
      !this._global.generatedFilters.includes(this._name + dependency)
    ) {
      this._regenQueue.push({
        type: "filter",
        property: filter,
        collection: this._name
      });
      return true;
    }
    return false;
  }

  executeFilter(filter) {
    this.data[filter] = this._filters[filter]({
      // pass this collection's data as "data" to the filter
      data: this.data,
      // spread each collection's data to the filter
      ...this._globalDataRefrence
    });
    this._global.generatedFilters.push(this._name + filter);
    // update subscribers
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
      // set the property to null, until we've parsed the filter
      this.data[filterName] = null;
      this._global.allFilters.push(filterName);
    }
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
    this.data[index] = this._indexes[index];
  }

  collect(data, index) {
    this._collecting = true;
    let indexIsArray = false;
    let indexesModified = [];
    let indexesCreated = [];
    // create the index
    if (index) {
      if (Array.isArray(index)) {
        indexIsArray = true;
        for (let i of index) {
          if (this._indexes[i]) indexesModified.push(i);
          this._indexes[i] = [];
        }
      } else {
        if (this._indexes[index]) indexesCreated.push(index);
        this._indexes[index] = [];
      }
    }
    // process the data
    if (!Array.isArray(data)) this.processDataItem(data, index);
    else for (let item of data) this.processDataItem(item, index, data);

    // update any existing indexes where data has been added
    // this.processIndexes();
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

    this.processCacheRegenQueue();

    // update indexes, bind the data and notify subscribers
    if (indexIsArray && index) {
      for (let i in index) this.updateData(data, i);
    } else if (index) {
      this.updateData(data, index);
    }
    // update get all
  }

  processDataItem(data, index) {
    // validate against model

    // if no primary key defined in the model, search for a generic one.
    if (!this._primaryKey) {
      let genericPrimaryIds = ["id", "_id"];
      // detect a primary key
      for (let key of genericPrimaryIds)
        if (data.hasOwnProperty(key)) this._primaryKey = key;
      if (!this._primaryKey)
        this.dataRejectionHandler(data, "No primary key supplied.");
    }

    if (!data.hasOwnProperty(this._primaryKey))
      this.dataRejectionHandler(data, "Primary key mismatch");

    // check if we already have the data if so, send to the update handler
    // if (this._data[data[this._primaryKey]]) {
    //   this.updateData(data);
    //   return;
    // }

    // push id into index
    if (index) this._indexes[index].push(data[this._primaryKey]);

    // check existing indexes for primary key, here is where we determin which, if any, indexes need to be regenerated and cached
    let loop = Object.keys(this._indexes);
    for (let indexName of loop) {
      if (
        indexName !== index &&
        this._indexes[indexName].includes(data[this._primaryKey])
      ) {
        // save the index
        this._indexesToRegen.push(index);
        console.log(`index ${indexName} requires regeneration.`);
      }
    }
    // add the data internally
    this._data[data[this._primaryKey]] = data;
    this._collectionSize++;
  }

  // this will fill the index array with the correposonding data
  regenerateCachedIndex(index) {
    return this._indexes[index].map(id => this._data[id]);
  }

  // this processes any
  processCacheRegenQueue() {
    for (let index of this._indexesToRegen) {
      this.updateData(this.regenerateCachedIndex(index), index);
    }
  }

  // runs when new data is added
  updateData(data, index) {
    if (this.data[index]) {
      this.data[index] = data;
      this.updateSubscribers(index, data);
    }
    // else this.data.$dynamic[index] = data;
  }

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

  // this should be rewritten, it's not currently used
  // createIndex(name, val, key) {
  //   if (val.constructor === Array) {
  //     if (!key && !val.hasOwnProperty("id")) {
  //       assert(`Failed to create index, key or id property required`);
  //       return;
  //     }
  //     this._indexes[name] = val.map(item => item[key ? key : "id"]);
  //   } else if (typeof val === "object" && val !== null) {
  //   } else {
  //     assert(`Unable to create index from value provided`);
  //   }
  // }
}
