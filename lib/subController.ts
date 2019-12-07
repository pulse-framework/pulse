// This file handles external components subscribing to pulse.
// It also handles subscribing mapData properties to collections

import { genId, cleanse, isWatchableObject, defineConfig } from './helpers';
import Dep from './dep';
import { worker } from 'cluster';

interface SubscribingComponentObject {
  componentUUID: string;
  keys: Array<string>;
}

export class ComponentContainer {
  public uuid: string;
  public ready: boolean;
  constructor(
    public instance: any,
    public config: {
      waitForMount: boolean;
      blindSubscribe: boolean;
    }
  ) {
    this.uuid = genId();
    instance.__pulseUniqueIdentifier = this.uuid;
    if (config.waitForMount) this.ready = false;
  }
}

export default class SubController {
  public subscribingComponentKey: number = 0;
  public trackingComponent: boolean | string = false;
  // public unsubscribingComponent: boolean = false;
  public skimmingDeepReactive: boolean = false;
  public lastAccessedDep: null | Dep = null;

  public componentStore: { [key: string]: ComponentContainer } = {};

  constructor(private getContextRef) {}

  registerComponent(instance, config) {
    config = defineConfig(config, {
      waitForMount: false,
      blindSubscribe: false
    });
    let uuid = instance.__pulseUniqueIdentifier;
    if (!uuid) {
      let componentContainer = new ComponentContainer(instance, config);

      this.componentStore[componentContainer.uuid] = componentContainer;
    } else {
      this.mount(instance);
    }
    return uuid;
  }

  get(id: string): ComponentContainer | boolean {
    return this.componentStore[id] || false;
  }

  mount(instance) {
    let component = this.componentStore[instance.__pulseUniqueIdentifier];

    if (component) {
      component.instance = instance;
      component.ready = true;
    }
  }

  unmount(instance) {
    const uuid = instance.__pulseUniqueIdentifier;
    if (!uuid) return;

    // delete reference to this component from store
    delete this.componentStore[instance.__pulseUniqueIdentifier];
  }
}
