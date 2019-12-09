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
  constructor(
    public instance: any,
    public config: {
      waitForMount: boolean;
      blindSubscribe: boolean;
    }
  ) {
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

  public registerComponent(instance, config) {
    config = defineConfig(config, {
      waitForMount: this.global.config.waitForMount,
      blindSubscribe: false
    });
    let componentContainer = new ComponentContainer(instance, config);

    this.componentStore[componentContainer.uuid] = componentContainer;

    return componentContainer.uuid;
  }

  // returns all deps accessed within a function,
  // does not register any dependencies
  public analyseFunctionForReactiveProperties(func: Function): any {
    let deps: Set<Dep> = new Set();
    this.trackAllDeps = true;
    const evaluated = func(this.global.contextRef);
    this.trackedDeps.forEach(dep => {
      if (!dep.rootProperty) deps.add(dep);
    });
    this.trackedDeps = new Set();
    this.trackAllDeps = false;

    let isMapData = !Array.isArray(evaluated) && typeof evaluated === 'object';
    return { isMapData, deps, evaluated };
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

  public untrack(instance) {
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

  public mapData(func: Function | Object, componentInstance: any): Object {
    // get container instance for component
    let componentContainer: ComponentContainer = this.get(
      componentInstance.__pulseUniqueIdentifier
    ) as ComponentContainer;

    let deps: Set<Dep> = new Set(),
      evaluated: Object = {};

    if (typeof func === 'object') {
      // Pulse 1.0 compatiblity, should depricate soon!
      normalizeMap(func).forEach(({ key, val }) => {
        let moduleInstanceName = val.split('/')[0];
        let property = val.split('/')[1];
        let moduleInstance = this.global.contextRef[moduleInstanceName];
        let res = this.global.subs.analyseFunctionForReactiveProperties(() => {
          return { [key]: moduleInstance[property] };
        });
        deps.add(res.dep);
        evaluated[key] = res.evaluated[key];
      });
    } else {
      let res = this.global.subs.analyseFunctionForReactiveProperties(
        func as Function
      );
      deps = res.deps;
      evaluated = res.evaluated;
    }

    // create subscription
    deps.forEach(dep => dep.subscribe(componentContainer));

    return evaluated;
  }
}
