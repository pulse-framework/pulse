// Global Subscription Controller
// This class handles external components subscribing to Pulse.

import Pulse from '.';
import { State } from './';
import { genId } from './utils';

export type SubscriptionContainer = ComponentContainer | CallbackContainer;

export interface SubscribingComponentObject {
  componentUUID: string;
  keys: Array<string>;
}

export class ComponentContainer {
  public keysChanged: Array<string>; // used to preserve local keys to update before update is performed, cleared every update
  public ready: boolean = true;
  public passProps: boolean = false;
  public mappedStates?: { [key: string]: State };
  constructor(public instance: any, public subs?: Set<State>) {}
}

export class CallbackContainer extends ComponentContainer {
  constructor(public callback: Function, public subs?: Set<State>) {
    super(null);
  }
}

export default class SubController {
  public components: Set<ComponentContainer> = new Set();
  public callbacks: Set<CallbackContainer> = new Set();

  constructor(public instance: Pulse) {}

  /**
   * Subscribe to Pulse state WITH return object
   */
  public mapToProps(
    instance: any,
    subs: { [key: string]: State } = {}
  ): { [key: string]: State['value'] } {
    let cC = this.registerComponent(instance);
    let returnProps = {};
    cC.passProps = true;
    cC.mappedStates = { ...subs };

    let localKeys = Object.keys(subs);
    localKeys.forEach(key => {
      let state = subs[key];
      if (state instanceof State) {
        cC.subs.add(state);
        state.dep.subs.add(cC);
        returnProps[key] = state.value;
      }
    });

    return { cC, props: returnProps };
  }

  /**
   * Subscribe to Pulse state WITHOUT return object
   */
  public subscribe(instance: any, subs: Array<State> = []): SubscriptionContainer {
    let cC = this.registerComponent(instance, subs);
    subs.forEach(state => {
      if (state instanceof State) {
        cC.subs.add(state);
        state.dep.subs.add(cC);
      }
    });
    return cC;
  }

  // create and return component container
  public registerComponent(instance, subs?): SubscriptionContainer {
    if (typeof instance === 'function') {
      // is this a callback based subscription?
      let cC = new CallbackContainer(instance as Function, new Set(subs));
      this.callbacks.add(cC);
      return cC;
      // is this a HOC based subscription
    } else {
      let cC = new ComponentContainer(instance);
      this.components.add(cC);
      instance.pulseComponentContainer = cC;
      return cC;
    }
  }

  public mount(instance: any) {
    if (!instance.pulseComponentContainer) return;
    instance.pulseComponentContainer.ready = true;
  }
  /**
   * Unsubscribe a component or callback
   * @param instance - Either a CallbackContainer or a bound component instance
   */
  public unsubscribe(instance: any) {
    const unsub = (cC: CallbackContainer | ComponentContainer) => {
      cC.ready = false;
      // remove component container from subs' dep
      cC.subs.forEach(state => {
        state.dep.subs.delete(cC);
      });
    };
    if (instance instanceof CallbackContainer) unsub(instance);
    else if (instance.pulseComponentContainer) unsub(instance.pulseComponentContainer);
  }
}
