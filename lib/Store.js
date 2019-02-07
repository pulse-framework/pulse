import { Log, assert } from "./Utils";

import Collections from "./Collection";

class Store {
  constructor({
    collections = {},
    data = {},
    indexes = [],
    actions = {},
    mutations = {},
    filters = {},
    routes = {}
  }) {
    // internal state
    this._collections = Object.create(null);
    this._globalDataRefrence = Object.create(null);
    this._subscribers = [];
    this._history = [];
    this._errors = [];
    this._eventBus = this.activateEventBus();
    collections.root = { data, indexes, actions, mutations, filters };

    // filter dependency tracker
    this._global = {
      record: false,
      dependenciesFound: [],
      dependencyGraph: {},
      generatedFilters: [],
      allFilters: [],
      regenQueue: [],
      eventBus: this._eventBus,
      initComplete: false
    };

    // init collections
    if (collections) this.initCollections(collections);

    // bind root collection data to root
    this.data = this._collections.root.data;

    if (!this._initComplete) {
      // build a tree of data after collection constructor is finished
      this.buildGlobalDataRefrenceTree();

      // filters depend on other data properties, and we need to know what they are so when one thing changes, only the correct caches should regerate
      this.executeAllFilters();

      this.processRegenQueue();
      this._global.initComplete = true;
    }
    Log("***INIT COMPLETE***");
    console.log(this._global.regenQueue);
  }

  subscribe(context) {
    this._subscribers.push(context);
  }

  activateEventBus() {
    return new Proxy(
      { message: null },
      {
        set: (target, key, value) => {
          if (value === "processRegenQueue") {
            this.processRegenQueue();
          }
          target[key] = value;
          return true;
        }
      }
    );
  }

  // build the collection classes
  initCollections(collections) {
    let loop = Object.keys(collections);
    for (let index of loop) {
      this._collections[index] = new Collections(
        {
          name: index,
          subscribers: this._subscribers,
          history: this._history,
          errors: this._errors,
          updateSubscribers: this.updateSubscribers,
          globalDataRefrence: this._globalDataRefrence,
          global: this._global
        },
        collections[index]
      );
      // check if the instance has a naming conflict
      if (this[index]) {
        assert(
          `Collection name conflict, instance already has "${index}" thus it will not be accessable on the root state tree.`
        );
      } else if (index !== "root") {
        // bind the collection class to the root state tree
        this[index] = this._collections[index];
      }
    }
  }

  buildGlobalDataRefrenceTree() {
    if (this._collections) {
      let loop = Object.keys(this._collections);
      for (let collection of loop) {
        this._globalDataRefrence[collection] = this._collections[
          collection
        ].data;
      }
    }
  }

  executeAllFilters() {
    let loop = Object.keys(this._collections);
    for (let collection of loop) {
      this._collections[collection].analyseFilters();
    }
  }

  processRegenQueue() {
    this.lastRegenerated = "";

    // if we called this function from the collection class
    if (this._global.regenQueue.length === 0) return;
    Log(
      `Regen queue processing. There are ${
        this._global.regenQueue.length
      } in the queue.`
    );
    // for dev purposes, prevent infinate loop
    for (let item of this._global.regenQueue) {
      // this removes the first item of the array and saves it to `entry`
      const entry = this._global.regenQueue.shift();
      const concatEntryName = `${entry.collection}/${entry.property}`;

      if (concatEntryName === this.lastRegenerated) {
        Log(`Prevented infinate loop for ${concatEntryName}`);
        return;
      }

      // different actions for different types of property, filters and indexes (groupes)
      switch (entry.type) {
        case "filter":
          this._collections[entry.collection].executeAndAnalyseFilter(
            entry.property
          );

          break;
        case "index":
          // indexes can only have dependents, as they're based directly on the main data stucture, those dependents are filters.
          console.log("NOT DONE YET");
          break;
      }
      this.lastRegenerated = concatEntryName;
      Log(
        `There are ${
          this._global.regenQueue.length
        } properties left to regenerate.`
      );
    }
    // loop!

    if (this._global.regenQueue.length > 0) this.processRegenQueue();
    // if we don't clear the generated filters, the filter analysis will fail next time around, causing an infinate loop! das bad
    else this._global.generatedFilters = new Array();
  }

  // Bind collection functions to root
  collect(data, index) {
    this._collections.root.collect(data, index);
  }

  // Anytime we detect a change, this function will push the updates to the subscribed components for both Vue and React
  updateSubscribers(key, value) {
    this._subscribers.map(component => {
      if (component._isVue) {
        if (component.hasOwnProperty(key)) {
          component.$set(component, key, value);
        }
      } else {
        self.processCallbacks(this.state);
      }
    });
  }

  processCallbacks(data) {
    if (!self._subscribers.length) return false;
    this._subscribers.forEach(callback => callback(data));
    return true;
  }

  // mapState: Returns any state names passed as properties or if blank the entire state tree
  mapState(properties = []) {
    if (properties.length == 0) return this.state;
    let ret = {};
    properties.forEach(prop => {
      ret[prop] = this.state[prop];
    });
    return ret;
    return null;
  }
  mapCollection(collection, properties = []) {
    if (properties.length == 0) {
      return this._collections[collection].data;
    }
    let ret = {};
    properties.forEach(prop => {
      ret[prop] = this._collections[collection].data[prop];
    });
    return ret;
  }
  mapData(queryFunc) {
    return queryFunc(this._globalDataRefrence);
  }

  /** you can pass any context in the first argument here */
  commit(name, val) {
    Log(`[COMMIT] ${name}`);
    this._history.push({
      oldState: { ...this.state }
    });
    this.mutations[name](
      {
        self: this
      },
      val
    );
  }
  undo() {
    // if (this._history.length == 0) return
    // setTimeout(() => {
    //     this.state = this._history[0].oldState
    // }, 0)
    // this._history = this._history.slice(1)
  }
}

export default Store;
