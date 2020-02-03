// Global Subscription Controller
// This class handles external components subscribing to Pulse.

import { genId } from './utils';
import Dep from './dep';
import Pulse from './root';

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
  public componentStore: { [key: string]: ComponentContainer } = {};

  constructor(public instance: Pulse) {}

  public registerComponent(instance, config, depsFunc) {
    let componentContainer = new ComponentContainer(instance, config, depsFunc);

    this.componentStore[componentContainer.uuid] = componentContainer;

    return componentContainer;
  }
}
