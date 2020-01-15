// Global Subscription Controller
// This class handles external components subscribing to Pulse.

import {
  genId,
  cleanse,
  isWatchableObject,
  defineConfig,
  normalizeMap
} from './helpers';
import Dep from './dep';
import { worker } from 'cluster';
import { Global } from './interfaces';

export interface SubscribingComponentObject {
  componentUUID: string;
  keys: Array<string>;
}

export class ComponentContainer {
  public uuid: string = genId();
  public ready: boolean = true;
  public deps: Set<Dep> = new Set();
  public mappedDeps: { [key: string]: Dep } = {};
  public manualDepTracking: boolean = false;
  public evaluated: Object;
  constructor(
    public instance: any,
    public config: {
      waitForMount: boolean;
      blindSubscribe: boolean;
    },
    public depsFunc?: Function
  ) {
    this.manualDepTracking = typeof this.depsFunc !== 'undefined';
    instance.__pulseUniqueIdentifier = this.uuid;
    if (config.waitForMount) this.ready = false;
  }
}

export default class SubController {
  public subscribingComponentKey: number = 0;
  public trackingComponent: boolean | string = false;

  // used by discoverDeps to get several dep classes
  public trackAllDeps: boolean = false;
  public trackedDeps: Set<Dep> = new Set();
  public componentStore: { [key: string]: ComponentContainer } = {};

  constructor(private global: Global) {}

  public registerComponent(instance, config, depsFunc) {
    config = defineConfig(config, {
      waitForMount: this.global.config.waitForMount,
      blindSubscribe: false
    });
    let componentContainer = new ComponentContainer(instance, config, depsFunc);

    this.componentStore[componentContainer.uuid] = componentContainer;

    return componentContainer;
  }

  // returns all deps accessed within a function,
  // does not register any dependencies
  public analyseDepsFunc(func: Function): any {
    let deps: Set<Dep> = new Set();
    let mappedDeps: { [key: string]: Dep } = {};
    this.trackAllDeps = true;
    const evaluated = func(this.global.contextRef);
    const localKeys: Array<string> = Object.keys(evaluated);
    let i = 0;
    this.trackedDeps.forEach(dep => {
      // prevent deep reactive deps from being tracked
      if (!dep.rootProperty) {
        // add dep to set
        deps.add(dep);
        mappedDeps[localKeys[i]] = dep;
        i++; // only increment if not deep reactive ;)
      }
    });
    this.trackedDeps = new Set();
    this.trackAllDeps = false;

    let mapToProps: boolean =
      !Array.isArray(evaluated) && typeof evaluated === 'object';

    return { mapToProps, deps, evaluated, mappedDeps };
  }

  public get(id: string): ComponentContainer | boolean {
    return this.componentStore[id] || false;
  }

  public mount(instance) {
    console.log(instance.__pulseUniqueIdentifier);
    let component: ComponentContainer = this.componentStore[
      instance.__pulseUniqueIdentifier
    ];

    if (component) {
      component.instance = instance;
      component.ready = true;
    } else {
      console.error('you did something wrong');
    }
  }

  public unmount(instance) {
    const uuid = instance.__pulseUniqueIdentifier;
    if (!uuid) return;

    let component: ComponentContainer = this.componentStore[
      instance.__pulseUniqueIdentifier
    ];

    // clean up deps to avoid memory leaks
    component.deps.forEach(dep => dep.subscribers.delete(component));
    // delete reference to this component instance from store
    delete this.componentStore[instance.__pulseUniqueIdentifier];
  }

  legacyMapData(func) {
    // PUT DEPRICATION WARNING HERE PLS
    const deps: Set<Dep> = new Set();
    let evaluated = null;
    let mappedDeps = null;
    let norm = normalizeMap(func);
    for (let i = 0; i < norm.length; i++) {
      const { key, val } = norm[i];
      let moduleInstanceName = val.split('/')[0];
      let property = val.split('/')[1];
      let moduleInstance = this.global.getModuleInstance(moduleInstanceName);
      let analysed = this.global.subs.analyseDepsFunc(() => {
        return { [key]: moduleInstance.public.object[property] };
      });
      analysed.deps.forEach(dep => deps.add(dep));

      // this if statement is here because of a weird bug that with all my JS knowlege I can't explain, only doesn't work on JavascriptCore engine, iOS
      let bool = typeof analysed.evaluated === 'object';

      if (bool) {
        if (!evaluated) evaluated = {};
        if (!mappedDeps) mappedDeps = {};
        evaluated[key] = analysed.evaluated[key];
        mappedDeps[key] = analysed.mappedDeps[key];
      }
    }

    return { deps, evaluated, mappedDeps };
  }

  public mapData(
    func: Function | Object,
    componentInstance: any,
    returnInfo?: boolean
  ): Object {
    // get container instance for component
    let cC: ComponentContainer = this.get(
        componentInstance.__pulseUniqueIdentifier
      ) as ComponentContainer,
      deps: Set<any> = new Set(),
      mappedDeps: { [key: string]: Dep },
      evaluated: Object = {},
      mapToProps: boolean = false,
      legacy: boolean = false;

    if (typeof func === 'object') {
      legacy = true;
      // force mapToProps as we know this old method requires that
      mapToProps = true;
      // Pulse 1.0 compatiblity, should depricate soon!
      const legacyRes = this.legacyMapData(func);
      deps = legacyRes.deps;
      mappedDeps = legacyRes.mappedDeps;
      evaluated = legacyRes.evaluated;
    } else {
      let res = this.global.subs.analyseDepsFunc(func as Function);
      deps = res.deps;
      mappedDeps = res.mappedDeps;
      evaluated = res.evaluated;
      mapToProps = res.mapToProps;
    }

    if (mapToProps) {
      cC.evaluated = evaluated;
      cC.mappedDeps = mappedDeps;
    }

    // create subscription
    deps.forEach(dep => dep && dep.subscribe(cC));

    if (returnInfo) return { evaluated, deps, mapToProps, legacy, mappedDeps };
    return evaluated;
  }
}
