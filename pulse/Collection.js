import { Log, assert } from "./Utils";

// This class is somewhat similar to modules in typical state storage libraries, but instead supports functions.
// It's state is loaded into the main state tree.
export default class Collection {
  constructor(
    { name, subscribers, history, errors, updateSubscribers },
    { model = {}, actions = {}, mutations = {}, indexes = [] }
  ) {
    // from parent class
    this._name = name;
    this._subscribers = subscribers;
    this._history = history;
    this._errors = errors;
    this.updateSubscribers = updateSubscribers;
    // external properties
    this.data = Object.create(null);
    this.mutations = Object.create(null);
    this.actions = Object.create(null);

    // the model for validating data
    this._model = model;
    // the internal data store
    this._data = Object.create(null);
    // indexes, arrays of primary keys used to filter data
    // EG: {suggested: [1,2,3...]}
    this._indexes = Object.create(null);
    // arrays generated from indexes, used by getters to avoid recalcuation
    this._cachedData = Object.create(null);

    this._indexesToRegen = [];

    this.collecting = false;
    this.primaryKey = null;
    this.collectionSize = 0;

    this.defineIndexes(indexes);
  }

  // Proxies
  // we shouldn't need to watch the data because it should only be modified by the collect function which handels propegating updates to subscribers automatically
  watchData(obj) {
    this.data = new Proxy(obj || {}, {
      set: (state, key, value) => {
        if (this.collecting === false) {
          console.log("data can be modified manually, but is not reccomended");
          // Store.updateSubscribers()
        }
        return true;
      }
    });
  }
  // we should however, watch the state.
  watchState(obj) {}

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
    this.collecting = true;
    let newIndex = true;
    // create the index
    if (index) {
      if (this._indexes[index]) newIndex = false;
      // return this.dataRejectionHandler(
      //   data,
      //   `Index "${index}" already in use.`
      // );
      // define the new index internally
      this._indexes[index] = [];
    }
    // process the data
    if (!Array.isArray(data)) this.processDataItem(data, index);
    else for (let item of data) this.processDataItem(item, index, data);

    // update any existing indexes where data has been added
    // this.processIndexes();
    // record the changes
    this._history.push({
      collected: {
        timestamp: new Date(),
        dataCollected: data,
        indexesCreated: newIndex ? index : null,
        indexesModified: newIndex ? null : index
      }
    });

    this.collecting = false;
    Log(`Collected ${data.length} items. With index: ${index}`);

    this.processCacheRegenQueue();
    // update index specific
    if (index) this.updateData(data, index);
    // update get all
  }

  processDataItem(data, index) {
    // validate against model

    // if no primary key defined in the model, search for a generic one.
    if (!this.primaryKey) {
      let genericPrimaryIds = ["id", "_id"];
      // detect a primary key
      for (let key of genericPrimaryIds)
        if (data.hasOwnProperty(key)) this.primaryKey = key;
      if (!this.primaryKey)
        this.dataRejectionHandler(data, "No primary key supplied.");
    }

    if (!data.hasOwnProperty(this.primaryKey))
      this.dataRejectionHandler(data, "Primary key mismatch");

    // check if we already have the data if so, send to the update handler
    // if (this._data[data[this.primaryKey]]) {
    //   this.updateData(data);
    //   return;
    // }

    // push id into index
    if (index) this._indexes[index].push(data[this.primaryKey]);

    // check existing indexes for primary key, here is where we determin which, if any, indexes need to be regenerated and cached
    let loop = Object.keys(this._indexes);
    for (let indexName of loop) {
      if (
        indexName !== index &&
        this._indexes[indexName].includes(data[this.primaryKey])
      ) {
        // save the index
        this._indexesToRegen.push(index);
        console.log(`index ${indexName} requires regeneration.`);
      }
    }
    // add the data internally
    this._data[data[this.primaryKey]] = data;
    this.collectionSize++;
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
