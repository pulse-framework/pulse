// This file handles external components subscribing to pulse.
// It also handles subscribing mapData properties to collections

import { genId, cleanse, isWatchableObject, defineConfig } from './helpers';
import Dep from './dep';
import { worker } from 'cluster';
import { Global } from './interfaces';

interface SubscribingComponentObject {
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
    console.log('new component tracker', this.uuid);
  }
}

export default class SubController {
  public subscribingComponentKey: number = 0;
  public trackingComponent: boolean | string = false;
  public lastAccessedDep: null | Dep = null;

  // used by getAllDepsForProperties to get several dep classes
  public trackAllDeps: boolean = false;
  public trackedDeps: Set<Dep> = new Set();
  public componentStore: { [key: string]: ComponentContainer } = {};

  constructor() {}

  registerComponent(instance, config) {
    config = defineConfig(config, {
      waitForMount: false,
      blindSubscribe: false
    });
    let componentContainer = new ComponentContainer(instance, config);

    this.componentStore[componentContainer.uuid] = componentContainer;

    return componentContainer.uuid;
  }

  get(id: string): ComponentContainer | boolean {
    return this.componentStore[id] || false;
  }

  mount(instance) {
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

  untrack(instance) {
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

  // returns all deps accessed within a function,
  // does not register any dependencies
  getAllDepsForProperties(properties: Function): any {
    let deps: Set<Dep> = new Set();
    this.trackAllDeps = true;
    const evaluated = properties();
    this.trackedDeps.forEach(dep => {
      if (!dep.rootProperty) deps.add(dep);
    });
    this.trackedDeps = new Set();
    this.trackAllDeps = false;

    let isMapData = !Array.isArray(evaluated) && typeof evaluated === 'object';
    return { isMapData, deps, evaluated };
  }
}
