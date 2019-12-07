import Runtime from './runtime';
import Collection from './module/modules/collection';
import SubController from './subController';
import RelationController from './relationController';
import Storage from './storage';
import Request from './collections/request';
import { ReactWrapper, useFramework } from './wrappers/ReactWithPulse';
import { genId, log, defineConfig } from './helpers';
import {
  Private,
  RootCollectionObject,
  RootConfig,
  ModuleInstance
} from './interfaces';
import { JobType } from './runtime';
import Module from './module';

export default class Pulse {
  _private: Private;
  static instance = null;
  static useFramework = useFramework;
  static React = ReactWrapper.bind(Pulse);
  [key: string]: any;
  constructor(root: RootCollectionObject = {}) {
    // Private object contains all internal Pulse data
    this._private = {
      modules: {},
      collections: {},
      helpers: {},
      services: {},
      keys: {
        modules: ['base'],
        collections: [],
        services: []
      },
      events: {},
      // global is passed in to all classes, must not contain cyclic references
      global: {
        config: this.initConfig(root.config),

        // State
        initComplete: false,
        runningWatcher: false,
        runningComputed: false,
        runningPopulate: false,
        mappingData: false,
        collecting: false,
        touching: false,
        touched: false,
        gettingContext: false,

        contextRef: {},
        // Instances
        subs: null,
        relations: null,
        storage: null,
        // Function aliases
        getInternalData: this.getInternalData.bind(this),
        getContext: this.getContext.bind(this),
        log: this.log.bind(this),
        uuid: genId
      }
    };
    const self = this._private;

    // Bind static objects directly to instance
    ['utils', 'staticData'].forEach(type => {
      if (root[type]) this[type] = root[type];
    });

    // Create storage instance
    self.global.storage = new Storage(root.storage);

    // Create controller instances
    self.global.relations = new RelationController(self.global);
    self.global.subs = new SubController();

    // init Runtime class into the global object
    this.initRuntime();

    this.registerModules(root);

    this.runAllComputed();

    this.runAllOnReady();

    this.initComplete();
  }

  registerModules(root: RootCollectionObject) {
    let self = this._private,
      namespace = {};

    // register base module
    self.modules.base = new Module('base', self.global, root);

    // alias base module public properties
    for (let property of self.modules.base.public.properties)
      if (
        [
          ...self.modules.base.public.mutableProperties,
          ...self.modules.base.keys.computed
        ].includes(property)
      )
        self.modules.base.public.createReactiveAlias(this, property);
      else this[property] = self.modules.base.public.object[property];

    // assign actions to root
    for (let property of self.modules.base.keys.actions)
      this[property] = self.modules.base.public.object[property];

    // optionally register request module
    if (root.request) {
      self.modules.request = new Request(self.global, root.request);
      self.keys.modules.unshift('request');
      namespace['request'] = self.modules.request.public.object;
    }

    // for each module type, and if module type exits on root, create module instances
    ['modules', 'collections', 'services'].forEach(category => {
      if (!root[category]) return;

      // declare module names as keys within respective category
      self.keys[category] = [
        ...self.keys[category],
        ...Object.keys(root[category])
      ];

      // for each module instance within this category
      self.keys[category].forEach(instanceName => {
        if (instanceName === 'base' || instanceName === 'request') return;

        let instanceConfig = root[category][instanceName],
          moduleStore: any = self[category],
          useCat: boolean = false;

        // switch differnet categories to init the correct constructor
        switch (category) {
          case 'modules':
            moduleStore[instanceName] = new Module(
              instanceName,
              self.global,
              instanceConfig
            );

            break;
          case 'collections':
            moduleStore[instanceName] = new Collection(
              instanceName,
              self.global,
              instanceConfig
            );
            break;
          case 'services':
            moduleStore[instanceName] = new Module(
              instanceName,
              self.global,
              instanceConfig
            );
            useCat = true;
            break;
        }

        let publicObject = moduleStore[instanceName].public.object;

        // assign instance to namespace
        if (useCat) {
          // if the category does not exist on the namespace create it
          if (!namespace[category]) namespace[category] = {};
          // assign the public object from the module instance to the corresponding namspace with category
          namespace[category][instanceName] = publicObject;
          // the same thing as above except without category
        } else namespace[instanceName] = publicObject;
      });
    });

    // preserve refrence of clean namespace object
    self.global.contextRef = {
      ...namespace,
      base: self.modules.base.public.object
    };

    // bind namespace to root of pulse
    for (let key in namespace) this[key] = namespace[key];

    if (self.global.config.baseModuleAlias)
      this['base'] = self.modules.base.public.object;
  }

  public loopModules(callback: Function) {
    const keys = this._private.keys;
    for (let moduleType in keys)
      keys[moduleType].forEach(moduleName =>
        callback(this._private[moduleType][moduleName])
      );
  }

  private initRuntime() {
    this._private.global.runtime = new Runtime(
      this._private.collections,
      this._private.global
    );
  }

  private runAllComputed(): void {
    this.loopModules(
      moduleInstance =>
        moduleInstance.keys.computed &&
        moduleInstance.keys.computed.forEach(computedKey => {
          const computed = moduleInstance.computed[computedKey];
          // console.log(computed);
          this._private.global.runtime.queue({
            type: JobType.COMPUTED_REGEN,
            collection: moduleInstance,
            property: computed
          });
          // moduleInstance.runWatchers(computed.name);
        })
    );
    // console.log(this._private.global.runtime);
    this._private.global.runtime.run();
  }
  private runAllOnReady(): void {
    this.loopModules(moduleInstance => {
      if (moduleInstance.onReady)
        moduleInstance.onReady(this._private.global.getContext(moduleInstance));
    });
  }

  initComplete() {
    this._private.global.initComplete = true;
    log('INIT COMPLETE', Object.assign({}, this));
    if (!this._private.global.config.ssr) {
      try {
        globalThis.__pulse = this;

        window.pulse = this;
        window._pulse = this._private;
      } catch (e) {}
    }
  }

  // public wrapped(ReactComponent, mapData) {
  //   const config = this._private.global.config;
  //   if (config.framework === 'react' && config.frameworkConstructor) {
  //     return withPulse(
  //       this,
  //       config.frameworkConstructor,
  //       ReactComponent,
  //       mapData
  //     );
  //   } else {
  //     throw '[PULSE ERROR]: Error using pulse.wrapped(), framework not defined in Pulse global config (set to React constructor)';
  //   }
  // }

  public initConfig(config: RootConfig): RootConfig {
    // if constructor already init
    if (!this._private) {
      // define config
      config = defineConfig(config, {
        framework: null,
        frameworkConstructor: null,
        waitForMount: false,
        autoUnmount: true,
        computedDefault: null,
        logJobs: false,
        baseModuleAlias: false
      });
    } else {
      // merge config
      config = { ...this._private.global.config, ...config };
    }

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

    if (this._private) this._private.global.config = config;

    return config;
  }

  // THIS WONT WORK
  getInternalData(collection, primaryKey) {
    return this._private.collections[collection].findById(primaryKey);
  }

  public getContext(moduleInstance?: ModuleInstance): { [key: string]: any } {
    let context: Object = {};
    this._private.global.gettingContext = true; // prevent reactive getters from tracking dependencies while building context

    if (!moduleInstance) {
      context = this._private.global.contextRef;
    } else context = (moduleInstance as ModuleInstance).getSelfContext();

    // spread base context
    context = {
      base: this._private.modules.base.public.object,
      ...this._private.modules.base.public.object, // invokes getters, dat bad
      ...context
    };

    this._private.global.gettingContext = false;
    return context;
  }

  public getContextRef() {
    return this._private.global.contextRef;
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

  subscribe(instance: any, properties: Function): Function {
    console.log(arguments);
    const uuid = instance.uuid;

    return (() => this.unmount(instance)).bind(this);
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

  // re-init storage object with new config
  public updateStorage(storageConfig: {}): void {
    this._private.global.storage = new Storage(storageConfig);
    // re-init all collections persist to ensure correct values
    this._private.keys.collections.forEach(collectionName => {
      let collection = this._private.collections[collectionName];
      collection.initPersist(collection.root.persist);
    });
  }

  log(thing): void {
    if (!this._private.global.config.logJobs) return;

    console.log('RUNTIME JOB', thing);
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
