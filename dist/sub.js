"use strict";
// Global Subscription Controller
// This class handles external components subscribing to Pulse.
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackContainer = exports.ComponentContainer = void 0;
class ComponentContainer {
    constructor(component, subs) {
        // Only needed object orientated subscriptions
        this.passProps = false;
        this.propKeysChanged = []; // needed to build updatedData for the integration updateMethod.. it temporary saves changed state keys to build later with it the prop object
        this.ready = false;
        this.subs = new Set([]); // States that are subscribed by this component
        this.component = component;
        if (subs)
            this.subs = subs;
    }
}
exports.ComponentContainer = ComponentContainer;
class CallbackContainer extends ComponentContainer {
    constructor(callback, subs) {
        super(null, subs);
        this.callback = callback;
    }
}
exports.CallbackContainer = CallbackContainer;
class SubController {
    constructor(pulseInstance) {
        // Component based Subscription
        this.components = new Set();
        // Callback based Subscription
        this.callbacks = new Set();
        this.pulseInstance = pulseInstance;
    }
    /**
     * Subscribe to Pulse State with a returned object of props this props can than be returned by the component (See react-integration)
     */
    subscribeWithSubsObject(subscriptionInstance, subs = {}) {
        const subscriptionContainer = this.registerSubscription(subscriptionInstance);
        const props = {};
        subscriptionContainer.passProps = true;
        subscriptionContainer.propStates = Object.assign({}, subs);
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
    subscribeWithSubsArray(subscriptionInstance, subs = []) {
        const subscriptionContainer = this.registerSubscription(subscriptionInstance, subs);
        subs.forEach(state => {
            // Add State to SubscriptionContainer Subs
            subscriptionContainer.subs.add(state);
            // Add SubscriptionContainer to State Subs
            state.dep.subs.add(subscriptionContainer);
        });
        return subscriptionContainer;
    }
    /**
     * Registers the Component/Callback Subscription and returns a SubscriptionContainer
     */
    registerSubscription(integrationInstance, subs = []) {
        // - Callback based Subscription
        if (typeof integrationInstance === 'function') {
            const callbackContainer = new CallbackContainer(integrationInstance, new Set(subs));
            this.callbacks.add(callbackContainer);
            callbackContainer.ready = true;
            return callbackContainer;
        }
        // - Component based Subscription
        const componentContainer = new ComponentContainer(integrationInstance);
        // Instantiate the componentContainer in a Component (for instance see react.integration PulseHOC)
        integrationInstance.componentContainer = componentContainer;
        this.components.add(componentContainer);
        if (!this.pulseInstance.config.waitForMount)
            componentContainer.ready = true;
        return componentContainer;
    }
    /**
     * This will mount the component (Mounts currently only useful in Component based Subscription)
     */
    mount(integrationInstance) {
        if (integrationInstance.componentContainer)
            integrationInstance.componentContainer.ready = true;
    }
    /**
     * Unsubscribe a component or callback
     */
    unsubscribe(subscriptionInstance) {
        const unsub = (subscriptionContainer) => {
            subscriptionContainer.ready = false;
            // Removes SubscriptionContainer from State subs
            subscriptionContainer.subs.forEach(state => {
                state.dep.subs.delete(subscriptionInstance);
            });
        };
        if (subscriptionInstance instanceof CallbackContainer)
            unsub(subscriptionInstance);
        else if (subscriptionInstance.componentContainer)
            unsub(subscriptionInstance.componentContainer);
    }
}
exports.default = SubController;
