import { Log, assert } from "./Utils";

// This class is somewhat similar to modules in typical state storage libraries, but instead supports functions.
// It's state is loaded into the main state tree.
export default class Collection {
  constructor(
    { name, subscribers, history, errors, updateSubscribers },
    { data = {}, model = {}, actions = {}, mutations = {}, indexes = [] }
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

    this._model = model; // the model for validating data
    this._data = Object.create(null); // the internal data store
    this._indexes = Object.create(null); // arrays of primary keys

    this._indexesToRegen = [];
    this._collecting = false;
    this._primaryKey = null;
    this._collectionSize = 0;

    // any forward facing data properties need to be present before runtime, so we must map any indexes to the collection's data property in the constructor.
    this.defineIndexes(indexes);

    // add proxy to data property to watch for manual changes
    this.watchData(this.data);
  }

  // We shouldn't need to watch the data because it should only be modified by the collect function which handels propegating updates to subscribers automatically. But in the event that the user does modify the data manually, we should push that update to subscribers.
  watchData(obj) {
    this.data = new Proxy(obj || {}, {
      set: (state, key, value) => {
        // prevent from firing update if it is being handled by the collect method.
        if (this._collecting === false) {
          // this.updateSubscribers()
        }
        return true;
      }
    });
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
        collection: this._name,
        timestamp: new Date(),
        dataCollected: data,
        indexesCreated: newIndex ? index : null,
        indexesModified: newIndex ? null : index
      }
    });

    this._collecting = false;
    Log(`Collected ${data.length} items. With index: ${index}`);

    this.processCacheRegenQueue();
    // update index specific
    if (index) this.updateData(data, index);
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
