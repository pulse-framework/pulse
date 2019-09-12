import Runtime from './runtime';
import Collection from './collection';
import SubController from './subController';
import Storage from './storage';
import Request from './collections/request';
import Base from './collections/base';
import withPulse from './wrappers/ReactWithPulse';
import { uuid, normalizeMap, log, defineConfig, parse } from './helpers';
import { Private, RootCollectionObject, DebugType } from './interfaces';
import { JobType } from './runtime';

import RelationController, { Key } from './relationController';
import Dep from './dep';

export default class Library {
  _private: Private;
  [key: string]: any;
  constructor(root: RootCollectionObject = {}) {
    // Private object contains all internal Pulse data
    this._private = {
      runtime: null,
      events: {},
      collections: {},
      collectionKeys: [],
      // global is passed in to all classes, must not contain cyclic references
      global: {
        config: this.prepareConfig(root.config),
        // State
        initComplete: false,
        runningAction: false,
        runningWatcher: false,
        runningComputed: false,
        runningPopulate: false,
        mappingData: false,
        collecting: false,
        touching: false,
        touched: false,
        contextRef: {},
        // Instances
        subs: new SubController(this.getContext.bind(this)),
        relations: null,
        storage: null,
        // Function aliases
        ticket: this.ticket.bind(this),
        cleanupTickets: this.cleanupTickets.bind(this),
        dispatch: this.dispatch.bind(this),
        getInternalData: this.getInternalData.bind(this),
        getContext: this.getContext.bind(this),
        getDep: this.getDep.bind(this),
        uuid
      }
    };

    // Bind static objects to instance (utils and services eventually should be initialized)
    ['utils', 'services', 'staticData'].forEach(type => {
      if (root[type]) this[type] = root[type];
    });

    // Create storage instance
    this._private.global.storage = new Storage(root.storage);

    // Create relation controller instance
    this._private.global.relations = new RelationController(
      this._private.global
    );

    // Prepare
    this.initCollections(root);
    this.initRuntime();

    // Finalize
    this.bindCollectionPublicData();
    this.runAllComputed();

    this.initComplete();
  }

  initCollections(root: RootCollectionObject) {
    this._private.collectionKeys = [];
    if (root.collections) {
      this._private.collectionKeys = [
        ...Object.keys(root.collections),
        ...this._private.collectionKeys
      ];
      for (let i = 0; i < this._private.collectionKeys.length; i++) {
        // Create collection instance
        this._private.collections[
          this._private.collectionKeys[i]
        ] = new Collection(
          this._private.collectionKeys[i], // name
          this._private.global, // global
          root.collections[this._private.collectionKeys[i]] // collection config
        );
      }
    }
    // Create request class
    if (this._private.global.config.enableRequest !== false)
      this._private.collectionKeys.push('request');
    this._private.collections['request'] = new Request(
      this._private.global,
      root.request || {}
    );

    // Create base class
    if (this._private.global.config.enableBase !== false) {
      this._private.collectionKeys.push('base');
      this._private.collections['base'] = new Base(this._private.global, root);
    }
  }

  initRuntime() {
    this._private.runtime = new Runtime(
      this._private.collections,
      this._private.global
    );
  }

  private bindCollectionPublicData(): void {
    for (let i = 0; i < this._private.collectionKeys.length; i++) {
      const collection = this._private.collections[
        this._private.collectionKeys[i]
      ];
      this._private.global.contextRef[this._private.collectionKeys[i]] =
        collection.public.object;
      this[this._private.collectionKeys[i]] = collection.public.object;
    }
  }

  runAllComputed() {
    for (let i = 0; i < this._private.collectionKeys.length; i++) {
      const collection = this._private.collections[
        this._private.collectionKeys[i]
      ];

      const computedKeys = collection.keys.computed;
      for (let i = 0; i < computedKeys.length; i++) {
        const computedName = computedKeys[i];
        this._private.runtime.performComputedOutput({
          collection: collection.name,
          property: computedName,
          type: JobType.COMPUTED_REGEN
        });
        collection.runWatchers(computedName);
      }
    }
  }

  initComplete() {
    this._private.global.initComplete = true;
    log('INIT COMPLETE', Object.assign({}, this));
    if (!this._private.global.config.ssr) {
      try {
        window._pulse = this;
      } catch (e) {}
    }
  }

  public wrapped(ReactComponent, mapData) {
    const config = this._private.global.config;
    if (config.framework === 'react' && config.frameworkConstructor) {
      return withPulse(
        this,
        config.frameworkConstructor,
        ReactComponent,
        mapData
      );
    } else return false;
  }

  private prepareConfig(config) {
    // defaults
    config = defineConfig(config, {
      framework: null,
      waitForMount: false,
      autoUnmount: false
    });

    // detect if framework passed in is a React constructor
    if (
      config.framework &&
      config.framework.hasOwnProperty(
        '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'
      )
    ) {
      config.frameworkConstructor = config.framework;
      config.framework = 'react';
    }

    if (config.framework === 'react') {
      if (config.waitForMount != false) config.waitForMount = true;
      if (config.autoUnmount != false) config.autoUnmount = true;
    }
    return config;
  }

  getInternalData(collection, primaryKey) {
    return this._private.collections[collection].findById(primaryKey);
  }

  // returns Dep instance by "touching" reactive property revealing its Dep class
  // if collection param is present we'll assume the property param is the name of the property, not a reference to the property itself
  getDep(property: any, collection: string): Dep {
    this._private.global.touching = true;

    // "touching" is simply invoking the property's getter

    if (typeof collection === 'string') {
      this._private.collections[collection].public.object[property];
    } else if (typeof collection === 'object') {
      collection[property];
    }

    // Extract the dep
    const dep = this._private.global.touched as Dep;
    this._private.global.touching = false;
    this._private.global.touched = null;

    return dep as Dep;
  }

  dispatch(type: string, payload) {
    switch (type) {
      case 'mutation':
        this._private.runtime.ingest({
          type: JobType.PUBLIC_DATA_MUTATION,
          collection: payload.collection,
          property: payload.key,
          value: payload.value,
          dep: payload.dep
        });
        break;

      default:
        break;
    }
  }

  getContext(collection) {
    const c = this._private.collections[collection];
    if (!c) return this._private.global.contextRef;
    return {
      ...this._private.global.contextRef,
      ...c.methods,
      data: c.public.object,
      indexes: c.indexes.object,
      groups: c.public.object,
      computed: c.public.object,
      routes: c.public.object.routes,
      local: c.local
    };
  }

  install(Vue) {
    this._private.global.config.framework = 'vue';
    const pulse = this;
    const config = pulse._private.global.config;
    Vue.mixin({
      beforeCreate() {
        Object.keys(pulse._private.global.contextRef).forEach(collection => {
          this['$' + collection] = pulse._private.global.contextRef[collection];
        });

        if (pulse.utils) this.$utils = pulse.utils;
        if (pulse.services) this.$services = pulse.services;
        if (pulse.staticData) this.$staticData = pulse.staticData;

        this.mapData = properties =>
          pulse.mapData(
            properties,
            this,
            {
              waitForMount: config.waitForMount
            },
            pulse
          );
      },
      mounted() {
        if (this.__pulseUniqueIdentifier && config.waitForMount)
          pulse.mount(this);
      },
      beforeDestroy() {
        if (this.__pulseUniqueIdentifier && config.autoUnmount)
          pulse.unmount(this);
      }
    });
  }

  mount(instance) {
    this._private.global.subs.mount(instance);
  }

  unmount(instance) {
    this._private.global.subs.unmount(instance);
  }

  mapData(properties, instance = {}, _config = {}, pulseAlias?: any) {
    let pulse = pulseAlias ? pulseAlias : this;
    const config = {
      waitForMount: true,
      ..._config
    };
    const componentUUID = pulse._private.global.subs.registerComponent(
      instance,
      config
    );

    this._private.global.mappingData = true;
    // new cool mapData method
    if (typeof properties === 'function') {
      return pulse._private.global.subs.subscribePropertiesToComponents(
        properties,
        componentUUID
      );
      // legacy support....
    } else if (typeof properties === 'object') {
      let returnData = {};
      normalizeMap(properties).forEach(({ key, val }) => {
        let collection = val.split('/')[0];
        let property = val.split('/')[1];
        let c = pulse._private.global.getContext()[collection];
        returnData[
          key
        ] = pulse._private.global.subs.subscribePropertiesToComponents(() => {
          return { [key]: c[property] };
        }, componentUUID)[key];
      });
      this._private.global.mappingData = false;
      return returnData;
    }
  }

  emit(name: string, payload: any): void {
    if (this._private.events[name])
      for (let i = 0; i < this._private.events[name].length; i++) {
        const callback = this._private.events[name][i];
        callback(payload);
      }
  }
  on(name: string, callback: () => any): void {
    if (!Array.isArray(this._private.events[name]))
      this._private.events[name] = [callback];
    else this._private.events[name].push(callback);
  }

  // root alias for relationController to access ticket function of a given collection
  ticket(collection: string, uuid: string, key: Key) {
    const primaryKey = parse(key).primaryKey;
    this._private.collections[collection].ticket(uuid, primaryKey);
  }

  // root alias for relationController to access cleanupTicket function of a given collection
  cleanupTickets(key): void {
    const parsed = parse(key);

    this._private.collections[parsed.collection].cleanupTickets(
      parsed.primaryKey
    );
  }

  log(type: DebugType): void {
    // let debugMode: Set<DebugType> = this._private.global.config.debugMode;
    // if (debugMode.size === 0) return;
    // if (debugMode.has(DebugType.ERRORS)) {
    // }
    // log(DebugType.ASSERT, `There was an error with "${thing}", bad :(`);
    // const AssertMessages = {
    //   INDEX_UPDATE_FAILED: (collection, property) =>
    //     `The type ${collection} is ${property}.`
    //   // and more
    // };
    // function _log(callback) {
    // }
    // _log(({ AssertMessages }) => AssertMessages.INDEX_UPDATE_FAILED(thing, thing2));
  }
}
