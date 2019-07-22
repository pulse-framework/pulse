// This file handles external components subscribing to pulse.
// It also handles subscribing mapData properties to collections

import { uuid } from "./helpers";
import { Global, ComponentContainer } from "./interfaces";
import Dep from "./dep";

interface SubscribingComponentObject {
  componentUUID: string;
  keys: Array<string>;
}

export default class SubController {
  private uuid: any = uuid;
  private subscribingComponentKey: number = 0;
  private subscribingComponent: boolean | SubscribingComponentObject = false;
  private unsubscribingComponent: boolean = false;
  private skimmingDeepReactive: boolean = false;
  private lastAccessedDep: null | Dep = null;

  public componentStore: { [key: string]: ComponentContainer } = {};

  constructor(private getContext: any) {}

  registerComponent(instance, config) {
    let uuid = instance.__pulseUniqueIdentifier;
    if (!uuid) {
      // generate UUID
      uuid = this.uuid();
      // inject uuid into component instance
      const componentContainer = {
        instance: instance,
        uuid,
        ready: config.waitForMount ? false : true
      };
      instance.__pulseUniqueIdentifier = uuid;

      this.componentStore[uuid] = componentContainer;
    } else {
      this.mount(instance);
    }
    return uuid;
  }

  mount(instance) {}

  unmount(instance) {}

  subscribePropertiesToComponents(properties, componentUUID) {
    // provisionally get keys of mapped data
    const provision = properties(this.getContext());
    const keys = Object.keys(provision);

    // mapData has a user defined local key, we need to include that in the subscription so we know what to update on the component later.
    this.subscribingComponentKey = 0;
    this.subscribingComponent = {
      componentUUID,
      keys
    };
    const returnToComponent = properties(this.getContext());
    this.subscribingComponent = false;
    this.subscribingComponentKey = 0;
    return returnToComponent;
  }
  prepareNext(dep) {
    this.lastAccessedDep = dep;
    if (!this.skimmingDeepReactive) this.subscribingComponentKey++;
  }
  foundDeepReactive() {
    this.skimmingDeepReactive = true;
    // undo changes
    this.lastAccessedDep.subscribers.pop();
    this.subscribingComponentKey--;
  }
  exitDeepReactive() {
    this.skimmingDeepReactive = false;
    //redo changes
    this.lastAccessedDep.subscribe();
    this.subscribingComponentKey++;
  }
}
