import Runtime from './runtime';
import Collection from './collection';
import SubController from './subController';
import Storage from './storage';
import Request from './collections/request';
import Base from './collections/base';
import { uuid, normalizeMap, log } from './helpers';
import {
  Private,
  RequestConfig,
  RootCollectionObject,
  JobType
} from './interfaces';
import RelationController from './relationController';

export default class Library {
  _private: Private;
  [key: string]: any;

  constructor(root: RootCollectionObject) {
    this._private = {
      runtime: null,
      events: {},
      global: {
        config: root.config,
        initComplete: false,
        runningAction: false,
        runningWatcher: false,
        runningComputed: false,
        collecting: false,
        subs: new SubController(this.getContext.bind(this)),
        relations: null,
        storage: null,
        dispatch: this.dispatch.bind(this),
        getInternalData: this.getInternalData.bind(this),
        getContext: this.getContext.bind(this),
        createForeignGroupRelation: this.createForeignGroupRelation.bind(this),
        contextRef: {},
        getDep: this.getDep.bind(this),
        uuid
      }
    };

    ['utils', 'services', 'staticData'].forEach(type => {
      if (root[type]) this[type] = root[type];
    });

    this._private.global.storage = new Storage();
    this._private.global.relations = new RelationController(
      this._private.global
    );

    this.initCollections(root);
    this.initRuntime();
    this.bindCollectionPublicData();
    this.runAllComputed();
    this._private.global.initComplete = true;
    log('INIT COMPLETE', Object.assign({}, this));
    if (!this._private.global.config.ssr) {
      try {
        window._pulse = this;
      } catch (e) {}
    }
  }

  runAllComputed() {
    const collectionKeys = Object.keys(this._private.collections);
    for (let i = 0; i < collectionKeys.length; i++) {
      const collection = this._private.collections[collectionKeys[i]];

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

  getInternalData(collection, primaryKey) {
    return this._private.collections[collection].findById(primaryKey);
  }

  getDep(collection, name) {
    return this._private.collections[collection].public.getDep(name);
  }

  initCollections(root: RootCollectionObject) {
    this._private.collections = {};
    let collectionKeys = Object.keys(root.collections);
    for (let i = 0; i < collectionKeys.length; i++) {
      const collection = root.collections[collectionKeys[i]];
      this._private.collections[collectionKeys[i]] = new Collection(
        collectionKeys[i],
        this._private.global,
        collection
      );
    }
    if (this._private.global.config.enableRequest !== false)
      this._private.collections['request'] = new Request(
        this._private.global,
        root.request || {}
      );
    if (this._private.global.config.enableBase !== false)
      this._private.collections['base'] = new Base(this._private.global, root);
  }

  initRuntime() {
    this._private.runtime = new Runtime(
      this._private.collections,
      this._private.global
    );
  }

  bindCollectionPublicData() {
    let collectionKeys = Object.keys(this._private.collections);
    for (let i = 0; i < collectionKeys.length; i++) {
      const collection = this._private.collections[collectionKeys[i]];
      this._private.global.contextRef[collectionKeys[i]] =
        collection.public.object;
      this[collectionKeys[i]] = collection.public.object;
    }
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
    let component = this._private.global.subs.componentStore[
      instance.__pulseUniqueIdentifier
    ];
    if (component) {
      component.instance = instance;
      component.ready = true;
    }
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
      return returnData;
    }
  }

  createForeignGroupRelation(
    foreignCollection,
    foreignData,
    dependentCollection,
    dependentGroup
  ) {
    this._private.collections[foreignCollection].foreignGroupRelations[
      foreignData
    ] = {
      collection: dependentCollection,
      groupToRegen: dependentGroup
    };
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
}
