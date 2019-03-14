const { Log, assert, warn } = require('./Utils');
const Collections = require('./Collection');
const Base = require('./Base');
const Request = require('./Request');
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
    persist = [],
    actions = {},
    filters = {},
    watch = {},
    routes = {}
  }) {
    // internal state
    this._collections = Object.create(null);
    this._subscribers = [];
    this._mappedProperties = {};
    this._eventBus = this.activateEventBus();
    // collections.root = { data, indexes, actions, filters, routes };
    // filter dependency tracker
    this._global = {
      regenQueue: [],
      errors: [],
      history: [],
      allFilters: [],
      collectionNamespace: [],
      analysingComponent: '',
      componentDependencyGraph: {},
      subscribedComponents: {},
      updateSubscribers: this.updateSubscribers,
      eventBus: this._eventBus,
      dependenciesFound: [],
      dependencyGraph: {},
      generatedFilters: [],
      record: false,
      initComplete: false,
      request: {},
      dataRef: {},
      internalDataRef: {},
      storage: {},
      relations: {}
    };

    this.initStorage(storage);

    // init collections
    this.initCollections(
      collections,
      { data, indexes, actions, filters, routes, groups, watch, persist },
      request
    );

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
      data() {
        return self.mapCollections();
      },
      beforeCreate() {
        // build component dependency graph
        if (this.$options.parent && !this.$options.parent.pulse) {
          this.$options.parent.pulse = self;
        }
        if (this.$vnode) {
          self._global.analysingComponent = this.$vnode.tag;
          self._global.subscribedComponents[this.$vnode.tag] = this;
        }
      },
      beforeUpdate() {
        // re-analyse
        // console.log(`${this.$vnode ? this.$vnode.tag : ''} updating...`);
      }
    });
  }

  mapCollections() {
    // console.log('MAPPING');
    const returnData = {};
    Object.keys(this._global.dataRef).forEach(collection => {
      returnData[collection] = this._global.dataRef[collection];
    });
    return returnData;
  }

  mapData(properties) {
    const returnData = {};
    this.normalizeMap(properties).forEach(({ key, val }) => {
      let collection = val.split('/')[0];
      let property = val.split('/')[1];
      if (
        this._global.dataRef.hasOwnProperty(collection) &&
        this._global.dataRef[collection].hasOwnProperty(property)
      ) {
        returnData[key] = this._global.dataRef[collection][property];
      }
    });
    return returnData;
  }

  normalizeMap(map) {
    return Array.isArray(map)
      ? map.map(key => ({ key, val: key }))
      : Object.keys(map).map(key => ({ key, val: map[key] }));
  }

  // subscribe a component to changes from pulse
  subscribe(context) {
    this._subscribers.push(context);
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
  initCollections(collections, base, request) {
    // the base collection class contains prefined data
    this._collections.base = new Base(this._global, base, request);
    this._collections.request = new Request(this._global, request);
    this._global.collectionNamespace = ['base', 'request'];

    Object.keys(collections).forEach(collection => {
      this._global.collectionNamespace.push(collection);
      this._collections[collection] = new Collections(
        {
          name: collection,
          global: this._global
        },
        collections[collection]
      );
    });

    Object.keys(this._collections).forEach(collection => {
      // check if the instance has a naming conflict
      if (this[collection]) {
        assert(
          `Collection name conflict, instance already has "${collection}" thus it will not be accessable on the root state tree.`
        );
      } else {
        // bind the collection public data to the root state tree
        this[collection] = this._collections[collection]._public;
      }
    });
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

      if (concatEntryName === this.lastRegenerated) {
        warn(`Prevented infinate loop for ${concatEntryName}`);
        this.lastRegenerated = '';
        return;
      }

      this._collections[entry.collection].executeAndAnalyseFilter(
        entry.property
      );

      this.lastRegenerated = concatEntryName;

      Log(
        `There are ${
          this._global.regenQueue.length
        } properties left to regenerate.`
      );
    }
    // loop!
    if (this._global.regenQueue.length > 0) this.processRegenQueue();
    else {
      // if we don't clear the generated filters, the filter analysis will fail next time around, causing an infinate loop! das bad
      // this._global.generatedFilters = new Array();
      this.lastRegenerated = '';
    }
  }

  // Bind collection functions to root
  collect(data, index) {
    this._collections.root.collect(data, index);
  }

  // react native
  processCallbacks(data) {
    if (!self._subscribers.length) return false;
    this._subscribers.forEach(callback => callback(data));
    return true;
  }
}

module.exports = Pulse;
