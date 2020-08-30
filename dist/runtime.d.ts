import Pulse, { State } from './';
import { SubscriptionContainer } from './sub';
export interface JobInterface {
    state: State;
    newStateValue?: any;
    background?: boolean;
}
export interface JobConfigInterface {
    perform?: boolean;
    background?: boolean;
}
export default class Runtime {
    instance: () => Pulse;
    currentJob: JobInterface | null;
    private jobsQueue;
    private jobsToRerender;
    private tasksOnceComplete;
    trackState: boolean;
    foundState: Set<State>;
    constructor(pulseInstance: Pulse);
    /**
     * @internal
     * Creates a Job out of State and new Value and than add it to a job queue
     */
    ingest(state: State, newStateValue?: any, options?: JobConfigInterface): void;
    /**
     * @internal
     * Perform a State Update
     */
    private perform;
    /**
     * @internal
     * SideEffects are sideEffects of the perform function.. for instance the watchers
     */
    private sideEffects;
    /**
     * @internal
     * This will be update all Subscribers of complete jobs
     */
    private updateSubscribers;
    /**
     * @internal
     * Builds an object out of propKeysChanged in the SubscriptionContainer
     */
    formatChangedPropKeys(subscriptionContainer: SubscriptionContainer): {
        [key: string]: any;
    };
    getFoundState(): Set<State<any>>;
    nextPulse(callback: () => any): void;
}
