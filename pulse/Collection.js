import { Log, assert } from "./Utils";

// This class is somewhat similar to modules in typical state storage libraries, but instead supports functions.
// It's state is loaded into the main state tree.
export default class Collection {
  constructor(
    { subscribers, history, errors },
    { model = {}, actions = {}, state = {}, getters = {}, mutations = {} }
  ) {
    this.subscribers = subscribers;
    this._history = history;
    this._errors = errors;
    // external properties
    this.state = Object.create(null);
    this.mutations = Object.create(null);
    this.getters = Object.create(null);
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

    this.collecting = false;

    this.indexesToRegen = [];

    this.primaryKey = null;

    this.watchData();
  }

  // Proxies
  // we shouldn't need to watch the data because it should only be modified by the collect function which handels propegating updates to subscribers automatically
  watchData(obj) {
    this._data = new Proxy(obj || {}, {
      set: (state, key, value) => {
        // Store.updateSubscribers()
        if (this.collecting === false)
          console.log("You modified the data manually???");
        return true;
      }
    });
  }
  // we should however, watch the state.
  watchState(obj) {}

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
      // define the new index
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
  }

  processDataItem(data, index, original) {
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
        // this.indexesToRegen.push()
        console.log(`index ${indexName} requires regeneration.`);
      }
    }

    this._data[data[this.primaryKey]] = data;

    // save the cached array
    if (index) this._cachedData[index] = original;
  }

  dataRejectionHandler(data, message) {
    let error = `[Data Rejection] - ${message} - Data was not collected, but instead saved to the errors object("_errors") on root Pulse instance.`;
    this._errors.push({
      data,
      timestamp: new Date(),
      error
    });
    assert(error);
  }

  createIndex(name, val, key) {
    if (val.constructor === Array) {
      if (!key && !val.hasOwnProperty("id")) {
        assert(`Failed to create index, key or id property required`);
        return;
      }
      this._indexes[name] = val.map(item => item[key ? key : "id"]);
    } else if (typeof val === "object" && val !== null) {
    } else {
      assert(`Unable to create index from value provided`);
    }
  }
}
