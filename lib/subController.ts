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
  public lastAccessedDep: null | Dep = null;

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
    this.trackAllDeps = true;
    const evaluated = func(this.global.contextRef);
    this.trackedDeps.forEach(dep => {
      if (!dep.rootProperty) deps.add(dep);
    });
    this.trackedDeps = new Set();
    this.trackAllDeps = false;

    let mapToProps: boolean =
      !Array.isArray(evaluated) && typeof evaluated === 'object';

    return { mapToProps, deps, evaluated };
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
    const ret = {
      deps: new Set(),
      evaluated: null
    };
    normalizeMap(func).forEach(({ key, val }) => {
      let moduleInstanceName = val.split('/')[0];
      let property = val.split('/')[1];
      let moduleInstance = this.global.contextRef[moduleInstanceName];
      let res = this.global.subs.analyseDepsFunc(() => {
        return { [key]: moduleInstance[property] };
      });
      ret.deps.add(res.dep);
      ret.evaluated[key] = res.evaluated[key];
    });
    return ret;
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
      evaluated = legacyRes.evaluated;
    } else {
      let res = this.global.subs.analyseDepsFunc(func as Function);
      deps = res.deps;
      evaluated = res.evaluated;
      mapToProps = res.mapToProps;
    }

    if (mapToProps) cC.evaluated = evaluated;

    // create subscription
    deps.forEach(dep => dep.subscribe(cC));

    if (returnInfo) return { evaluated, deps, mapToProps, legacy };
    return evaluated;
  }
}
