// Global Subscription Controller
// This class handles external components subscribing to Pulse.
import { Pulse, State } from './internal';
import Collection from './collection/collection';

export type SubscriptionContainer = ComponentContainer | CallbackContainer;

export class ComponentContainer {
  public component: any;

  // Only needed object orientated subscriptions
  public passProps: boolean = false;
  public propStates?: { [key: string]: State }; // States which will than be returned as prop object by the integration
  public propKeysChanged: Array<string> = []; // needed to build updatedData for the integration updateMethod.. it temporary saves changed state keys to build later with it the prop object

  public ready: boolean = false;
  public subs: Set<State> = new Set<State>([]); // States that are subscribed by this component

  constructor(component: any, subs?: Set<State>) {
    this.component = component;
    if (subs) this.subs = subs;
  }
}

export class CallbackContainer extends ComponentContainer {
  public callback: Function;

  constructor(callback: Function, subs?: Set<State>) {
    super(null, subs);
    this.callback = callback;
  }
}

export class SubController {
  public pulseInstance;

  // Component based Subscription
  public components: Set<ComponentContainer> = new Set();

  // Callback based Subscription
  public callbacks: Set<CallbackContainer> = new Set();

  constructor(pulseInstance: Pulse) {
    this.pulseInstance = pulseInstance;
  }

  /**
   * Subscribe to Pulse State with a returned object of props this props can than be returned by the component (See react-integration)
   */
  public subscribeWithSubsObject(
    subscriptionInstance: any,
    subs: { [key: string]: State } = {}
  ): { subscriptionContainer: SubscriptionContainer; props: { [key: string]: State['value'] } } {
    const subscriptionContainer = this.registerSubscription(subscriptionInstance);

    const props: { [key: string]: State } = {};
    subscriptionContainer.passProps = true;
    subscriptionContainer.propStates = { ...subs };

    // Go through subs
    let localKeys = Object.keys(subs);
    localKeys.forEach(key => {
      const state = subs[key];

      // Add State to SubscriptionContainer Subs
      subscriptionContainer.subs.add(state);

      // Add SubscriptionContainer to State Subs
      state.dep.subs.add(subscriptionContainer);

      // Add state to props
      props[key] = state.value;
    });

    return {
      subscriptionContainer: subscriptionContainer,
      props: props
    };
  }

  /**
   * Subscribe to Pulse State
   */
  public subscribeWithSubsArray(subscriptionInstance: any, subs: Array<State> = []): SubscriptionContainer {
    const subscriptionContainer = this.registerSubscription(subscriptionInstance, subs);

    subs.forEach(state => {
      // Add State to SubscriptionContainer Subs
      if (state instanceof Collection) {
        const collection = state as Collection;
        if (collection.groups?.default) state = collection.getGroup('default');
        else throw 'usePulse error, Collection has no default group';
      }

      subscriptionContainer.subs.add(state);

      // Add SubscriptionContainer to State Subs
      state.dep.subs.add(subscriptionContainer);
    });

    return subscriptionContainer;
  }

  /**
   * Registers the Component/Callback Subscription and returns a SubscriptionContainer
   */
  public registerSubscription(integrationInstance: any, subs: Array<State> = []): SubscriptionContainer {
    // - Callback based Subscription
    if (typeof integrationInstance === 'function') {
      const callbackContainer = new CallbackContainer(integrationInstance as Function, new Set(subs));
      this.callbacks.add(callbackContainer);
      callbackContainer.ready = true;

      return callbackContainer;
    }

    // - Component based Subscription
    const componentContainer = new ComponentContainer(integrationInstance);

    // Instantiate the componentContainer in a Component (for instance see react.integration PulseHOC)
    integrationInstance.componentContainer = componentContainer;

    this.components.add(componentContainer);
    if (!this.pulseInstance.config.waitForMount) componentContainer.ready = true;

    return componentContainer;
  }

  /**
   * This will mount the component (Mounts currently only useful in Component based Subscription)
   */
  public mount(integrationInstance: any) {
    if (integrationInstance.componentContainer) integrationInstance.componentContainer.ready = true;
  }

  /**
   * Unsubscribe a component or callback
   */
  public unsubscribe(subscriptionInstance: any) {
    const unsub = (subscriptionContainer: CallbackContainer | ComponentContainer) => {
      subscriptionContainer.ready = false;

      // Removes SubscriptionContainer from State subs
      subscriptionContainer.subs.forEach(state => {
        state.dep.subs.delete(subscriptionInstance);
      });
    };

    if (subscriptionInstance instanceof CallbackContainer) unsub(subscriptionInstance);
    else if (subscriptionInstance.componentContainer) unsub(subscriptionInstance.componentContainer);
  }
}

export default SubController;
