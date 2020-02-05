// Global Subscription Controller
// This class handles external components subscribing to Pulse.

import Pulse from '.';
import State from './state';
import { genId } from './utils';

export interface SubscribingComponentObject {
  componentUUID: string;
  keys: Array<string>;
}

export class ComponentContainer {
  public uuid: string = genId();
  public ready: boolean = true;
  constructor(public instance: any, public deps?: Set<State>) {}
}

export default class SubController {
  public componentStore: { [key: string]: ComponentContainer } = {};

  constructor(public instance: Pulse) {}

  subscribe(instance: any, deps: Array<State> = []) {
    let cC = this.registerComponent(instance);
    deps.forEach(state => state instanceof State && cC.deps.add(state));
    cC.deps;
  }

  // create and return component container
  public registerComponent(instance) {
    let componentContainer = new ComponentContainer(instance);
    this.componentStore[componentContainer.uuid] = componentContainer;
    return componentContainer;
  }
}
