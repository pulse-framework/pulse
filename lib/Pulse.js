import { Log, assert } from './Utils';
import Collections from './Collection';
import Request from './Request';
class Pulse {
  constructor({
    collections = {},
    utils = {},
    services = {},
    request = {},
    storage,
    data = {},
    groups = [],
    indexes = [],
    actions = {},
    filters = {},
    routes = {}
  }) {
    // internal state
    this._collections = Object.create(null);
    this._subscribers = [];
    this._mappedProperties = {};
    this._eventBus = this.activateEventBus();
    collections.root = { data, indexes, actions, filters, routes };
    // filter dependency tracker
    this._global = {
      record: false,
      dependenciesFound: [],
      dependencyGraph: {},
      generatedFilters: [],
      allFilters: [],
      regenQueue: [],
      eventBus: this._eventBus,
      initComplete: false,
      request: this.request,
      collectionNamespace: [],
      history: [],
      errors: [],
      dataRef: {},
      storage: {}
    };

    this.request = new Request(this._global, request);

    this.initStorage(storage);

    // init collections
    if (collections) this.initCollections(collections);

    // build a tree of data after collection constructor is finished
    this.buildGlobalDataRefrenceTree();

    // build a dependency graph for smart caching
    this.prepareDependencyGraph();

    // run and analyse the filters to populate the dependecy graph
    this.executeAllFilters();

    // loop through the regen queue to regenerate filters that couldn't execute first time around
    this.processRegenQueue();

    // declare Pulse has finished initialzing
    this._global.initComplete = true;
    Log('INIT_COMPLETE');
  }

  install(Vue) {
    const self = this;
    Vue.mixin({
      beforeCreate() {
        this.$pulse = self._collections.root;
        let collectionKeys = Object.keys(self._collections);
        for (let collection of collectionKeys) {
          if (collection === 'root') return;
          if (this.hasOwnProperty('$' + collection))
            return assert(
              `Error binding collection "${collection}" to Vue instance, "$${collection}" already exists.`
            );
          this['$' + collection] = self._collections[collection]._public;
        }
      }
    });
  }

  // use a proxy to pass messages around pulse that couldn't otherwise be done due to scoping
  activateEventBus() {
    return new Proxy(
      { message: null },
      {
        set: (target, key, value) => {
          if (value === 'processRegenQueue') {
            this.processRegenQueue();
          }
          target[key] = value;
          return true;
        }
      }
    );
  }

  initStorage(storage) {
    let type = 'localStorage';
    // the user wants to use session storage
    if (storage === 'sessionStorage') {
      this.assignStorage(sessionStorage, type);
      type = 'sessionStorage';
      // they have defined their own storage API
    } else if (storage && storage.set && storage.get && storage.remove) {
      this.assignStorage(storage, type);
      type = 'custom';
      // default to local storage
    } else if (window.localStorage) {
      this.assignStorage(localStorage, type);
      // no storage API found
    } else {
      return assert(`No storage API present, data will not persist`);
    }
  }
  assignStorage(storage, type) {
    const storageAPI = {
      type
    };
    //set
    if (storage.set) storageAPI.set = storage.set.bind(storage);
    if (storage.setItem) storageAPI.set = storage.setItem.bind(storage);
    //get
    if (storage.get) storageAPI.get = storage.get.bind(storage);
    if (storage.getItem) storageAPI.get = storage.getItem.bind(storage);
    //remove
    if (storage.remove) storageAPI.remove = storage.remove.bind(storage);
    if (storage.removeItem)
      storageAPI.remove = storage.removeItem.bind(storage);
    //clear
    if (storage.clear) storageAPI.clear = storage.clear.bind(storage);

    this._global.storage = storageAPI;
  }

  // prepare the dependecy graph
  prepareDependencyGraph() {
    let graph = this._global.dependencyGraph;
    let collections = this._global.collectionNamespace;

    for (let collection of collections) {
      graph[collection] = {};
      let _public = this._collections[collection]._public;
      let loop = [];

      let propertiesToRegister = ['filters', 'groups', 'data'];

      for (let i of propertiesToRegister) {
        Object.keys(_public[i]).forEach(name => loop.push(name));
      }
      for (let item of loop) {
        graph[collection][item] = {
          dependencies: [],
          dependents: [],
          dependencyNames: [],
          dependentNames: []
        };
      }
    }
  }

  // build the collection classes
  initCollections(collections) {
    let loop = Object.keys(collections);
    for (let index of loop) {
      this._collections[index] = new Collections(
        {
          name: index,
          global: this._global
        },
        collections[index]
      );
      // check if the instance has a naming conflict
      if (this[index]) {
        assert(
          `Collection name conflict, instance already has "${index}" thus it will not be accessable on the root state tree.`
        );
      } else if (index !== 'root') {
        // bind the collection class to the root state tree
        this[index] = this._collections[index];
      }
      this._global.collectionNamespace.push(index);
    }
  }

  // this is passed into filters, actions and routes so they can access all data within Pulse
  buildGlobalDataRefrenceTree() {
    if (this._collections) {
      let loop = Object.keys(this._collections);
      for (let collection of loop) {
        this._global.dataRef[collection] = this._collections[
          collection
        ]._public;
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
    let lastRegenerated = '';
    // debugger;
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

      if (concatEntryName === lastRegenerated) {
        Log(`Prevented infinate loop for ${concatEntryName}`);
        return;
      }

      this._collections[entry.collection].executeAndAnalyseFilter(
        entry.property
      );

      lastRegenerated = concatEntryName;

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

  // Apparently this is not needed at all.. tf
  updateSubscribers(key, value, collection) {
    // Log(`Updating subscribers for ${key}`);
    // this._subscribers.map(component => {
    //   if (component._isVue) {
    //     console.log(key, component, key);
    //     if (Object.keys(component).includes(key)) {
    //       console.log('COMPONENT UPDATED');
    //       component.$set(component, key, value);
    //     }
    //   } else {
    //     self.processCallbacks(this.state);
    //   }
    // });
  }

  // react native
  processCallbacks(data) {
    if (!self._subscribers.length) return false;
    this._subscribers.forEach(callback => callback(data));
    return true;
  }

  /** you can pass any context in the first argument here */
  commit(name, val) {
    Log(`[COMMIT] ${name}`);
    this._global.history.push({
      oldState: { ...this.state }
    });
    this.mutations[name](
      {
        self: this
      },
      val
    );
  }
}

export default Pulse;
