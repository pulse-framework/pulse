import Pulse from '.';
import { State } from './';
export declare type SubscriptionContainer = ComponentContainer | CallbackContainer;
export declare class ComponentContainer {
    component: any;
    passProps: boolean;
    propStates?: {
        [key: string]: State;
    };
    propKeysChanged: Array<string>;
    ready: boolean;
    subs: Set<State>;
    constructor(component: any, subs?: Set<State>);
}
export declare class CallbackContainer extends ComponentContainer {
    callback: Function;
    constructor(callback: Function, subs?: Set<State>);
}
export default class SubController {
    pulseInstance: any;
    components: Set<ComponentContainer>;
    callbacks: Set<CallbackContainer>;
    constructor(pulseInstance: Pulse);
    /**
     * Subscribe to Pulse State with a returned object of props this props can than be returned by the component (See react-integration)
     */
    subscribeWithSubsObject(subscriptionInstance: any, subs?: {
        [key: string]: State;
    }): {
        subscriptionContainer: SubscriptionContainer;
        props: {
            [key: string]: State['value'];
        };
    };
    /**
     * Subscribe to Pulse State
     */
    subscribeWithSubsArray(subscriptionInstance: any, subs?: Array<State>): SubscriptionContainer;
    /**
     * Registers the Component/Callback Subscription and returns a SubscriptionContainer
     */
    registerSubscription(integrationInstance: any, subs?: Array<State>): SubscriptionContainer;
    /**
     * This will mount the component (Mounts currently only useful in Component based Subscription)
     */
    mount(integrationInstance: any): void;
    /**
     * Unsubscribe a component or callback
     */
    unsubscribe(subscriptionInstance: any): void;
}
