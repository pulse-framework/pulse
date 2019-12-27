import Runtime from './runtime';
import Module from './module';
import Collection from './module/modules/collection';
import SubController from './subController';
import RelationController from './relationController';
import Storage from './storage';
import Request from './collections/request';
import { genId, log, defineConfig } from './helpers';
import {
  Private,
  RootCollectionObject,
  RootConfig,
  ModuleInstance
} from './interfaces';
import { JobType } from './runtime';
import use, { Intergration } from './intergrations/use';

export default class Pulse {
  public _private: Private;
  static instance = null;

  static intergration: Intergration;
  static use: Function = plugin => use(plugin, Pulse);

  static React?: Function;
  static install?: Function;
  constructor(root: RootCollectionObject = {}) {
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
      global: {
        config: this.initConfig(root.config),
        contextRef: {},
        // Instances
        subs: null,
        relations: null,
        storage: null,
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
        // Function aliases
        getInternalData: this.getInternalData.bind(this),
        getContext: this.getContext.bind(this),
        log: this.log.bind(this),
        getModuleInstance: this.getModuleInstance.bind(this),
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
    self.global.subs = new SubController(self.global);

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
    this._private.global.log('**Init Complete**');
    this._private.global.initComplete = true;
    log('INIT COMPLETE', Object.assign({}, this));
    try {
      globalThis.__pulse = this;
    } catch {}
    if (!this._private.global.config.bindInstanceTo) {
      try {
        window[this._private.global.config.bindInstanceTo as string] = this;
      } catch (e) {}
    }
    if (Pulse.intergration) Pulse.intergration.onReady(Pulse);
  }

  public wrapped(ReactComponent, mapData) {
    return Pulse.React(ReactComponent, mapData);
  }

  public mapData(func, instance) {
    // if component is not already registered
    if (!instance.__pulseUniqueIdentifier)
      this._private.global.subs.registerComponent(instance, {}, func);
    // return mapData func
    return this._private.global.subs.mapData(func, instance);
  }

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
        baseModuleAlias: false,
        mapDataUnderPropName: false,
        bindInstanceTo: false
      });
    } else {
      // merge config
      config = { ...this._private.global.config, ...config };
    }

    // detect if framework passed in is a React constructor
    if (!Pulse.intergration && config.framework) {
      Pulse.use(config.framework, Pulse);
    }
    if (!Pulse.intergration) {
      console.warn('Pulse Warning - No intergrated framework');
    }

    config.framework = Pulse.intergration.name;
    config.frameworkConstructor = Pulse.intergration.frameworkConstructor;

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

    if (this['utils']) context['utils'] = this['utils'];

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

  subscribe(instance: any, properties: Function) {}

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

  public getModuleInstance(name: string): ModuleInstance {
    const self = this._private;
    let moduleInstance: ModuleInstance;
    if (self.modules.hasOwnProperty(name)) moduleInstance = self.modules[name];
    if (self.collections.hasOwnProperty(name))
      moduleInstance = self.collections[name];
    return moduleInstance;
  }

  log(thing): void {
    if (!this._private.global.config.logJobs) return;

    console.log('RUNTIME JOB', thing);
  }
  logJobs() {
    this._private.global.config.logJobs = true;
  }
}

globalThis.Pulse = Pulse; // ReMOVE THIS
