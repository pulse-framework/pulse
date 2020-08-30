"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require("./");
const utils_1 = require("./utils");
const sub_1 = require("./sub");
class Runtime {
    constructor(pulseInstance) {
        // queue system
        this.currentJob = null;
        this.jobsQueue = [];
        this.jobsToRerender = [];
        this.tasksOnceComplete = [];
        // used for tracking computed dependencies
        this.trackState = false;
        this.foundState = new Set();
        this.instance = () => pulseInstance;
    }
    /**
     * @internal
     * Creates a Job out of State and new Value and than add it to a job queue
     */
    ingest(state, newStateValue, options = {
        perform: true,
        background: false
    }) {
        // Create Job
        const job = {
            state: state,
            newStateValue: newStateValue,
            background: options === null || options === void 0 ? void 0 : options.background
        };
        // grab nextState if newState not passed, compute if needed
        if (newStateValue === undefined) {
            job.newStateValue =
                job.state instanceof _1.Computed
                    ? // if computed, recompute value
                        job.state.computeValue()
                    : // otherwise, default to nextState
                        job.state.nextState;
        }
        // Push the Job to the Queue (the queue will then processed)
        this.jobsQueue.push(job);
        // Perform the Job
        if (options === null || options === void 0 ? void 0 : options.perform) {
            const performJob = this.jobsQueue.shift();
            if (performJob)
                this.perform(performJob);
            else
                console.warn('Pulse: Failed to perform Job ', job);
        }
    }
    /**
     * @internal
     * Perform a State Update
     */
    perform(job) {
        // Set Job to current
        this.currentJob = job;
        // Set Previous State
        job.state.previousState = utils_1.copy(job.state._value);
        // Write new value into the State
        job.state.privateWrite(job.newStateValue);
        // Perform SideEffects such as watcher functions
        this.sideEffects(job.state);
        // Set Job as completed (The deps and subs of completed jobs will be updated)
        if (!job.background)
            this.jobsToRerender.push(job);
        // Reset Current Job
        this.currentJob = null;
        // Logging
        if (this.instance().config.logJobs)
            console.log(`Pulse: Completed Job(${job.state.name})`, job);
        // Continue the Loop and perform the next job.. if no job is left update the Subscribers for each completed job
        if (this.jobsQueue.length > 0)
            this.perform(this.jobsQueue.shift());
        else {
            setTimeout(() => {
                // Cause rerender on Subscribers
                this.updateSubscribers();
            });
        }
    }
    /**
     * @internal
     * SideEffects are sideEffects of the perform function.. for instance the watchers
     */
    sideEffects(state) {
        let dep = state.dep;
        // this should not be used on root state class as it would be overwritten by extensions
        // this is used mainly to cause group to generate its output after changing
        if (typeof state.sideEffects === 'function')
            state.sideEffects();
        // Call Watchers
        for (let watcher in state.watchers)
            if (typeof state.watchers[watcher] === 'function')
                state.watchers[watcher](state.getPublicValue());
        // Ingest dependents (Perform is false because it will be performed anyway after this sideEffect)
        dep.deps.forEach(state => this.ingest(state, undefined, { perform: false }));
    }
    /**
     * @internal
     * This will be update all Subscribers of complete jobs
     */
    updateSubscribers() {
        // Check if Pulse has an integration because its useless to go trough this process without framework
        // It won't happen anything because the state has no subs.. but this check here will maybe improve the performance
        if (!this.instance().integration) {
            this.jobsToRerender = [];
            // TODO maybe a warning but if you want to use PulseJS without framework this might get annoying
            return;
        }
        // Subscriptions that has to be updated
        const subscriptionsToUpdate = new Set();
        // Map through Jobs to Rerender
        this.jobsToRerender.forEach(job => 
        // Map through subs of the current Job State
        job.state.dep.subs.forEach(subscriptionContainer => {
            const instance = this.instance();
            instance.collectionStorage.collections.forEach((collection) => {
                instance.collectionStorage.storeAll(collection);
            });
            // Check if subscriptionContainer is ready
            if (!subscriptionContainer.ready)
                console.warn("Pulse: SubscriptionContainer isn't ready yet ", subscriptionContainer);
            // For a Container that require props to be passed
            if (subscriptionContainer.passProps) {
                let localKey = null;
                // Find the local Key for this update by comparing the State instance from this Job to the State instances in the propStates object
                for (let key in subscriptionContainer.propStates)
                    if (subscriptionContainer.propStates[key] === job.state)
                        localKey = key;
                // If matching key is found push it into the SubscriptionContainer propKeysChanged where it later will be build to an changed prop object
                if (localKey)
                    subscriptionContainer.propKeysChanged.push(localKey);
            }
            // Add sub to subscriptions to Update
            subscriptionsToUpdate.add(subscriptionContainer);
        }));
        // Perform Component or Callback updates
        // TODO maybe add a unique key to a component and if its the same don't cause a rerender for both -> performance optimization
        subscriptionsToUpdate.forEach(subscriptionContainer => {
            var _a, _b;
            // If Callback based subscription call the Callback Function
            if (subscriptionContainer instanceof sub_1.CallbackContainer) {
                subscriptionContainer.callback();
                return;
            }
            // If Component based subscription call the updateMethod which every framework has to define
            if ((_a = this.instance().integration) === null || _a === void 0 ? void 0 : _a.updateMethod)
                (_b = this.instance().integration) === null || _b === void 0 ? void 0 : _b.updateMethod(subscriptionContainer.component, this.formatChangedPropKeys(subscriptionContainer));
            else
                console.warn("Pulse: The framework which you are using doesn't provide an updateMethod so it might be possible that no rerender will be triggered");
        });
        // Log Job
        if (this.instance().config.logJobs && subscriptionsToUpdate.size > 0)
            console.log('Pulse: Rerendered Components ', subscriptionsToUpdate);
        // Reset Jobs to Rerender
        this.jobsToRerender = [];
        // Run any tasks for next runtime
        this.tasksOnceComplete.forEach(task => typeof task === 'function' && task());
        this.tasksOnceComplete = [];
    }
    /**
     * @internal
     * Builds an object out of propKeysChanged in the SubscriptionContainer
     */
    formatChangedPropKeys(subscriptionContainer) {
        const finalObject = {};
        // Build Object
        subscriptionContainer.propKeysChanged.forEach(changedKey => {
            if (subscriptionContainer.propStates)
                finalObject[changedKey] = subscriptionContainer.propStates[changedKey].value;
        });
        return finalObject;
    }
    getFoundState() {
        this.trackState = false;
        const ret = this.foundState;
        this.foundState = new Set();
        return ret;
    }
    nextPulse(callback) {
        this.tasksOnceComplete.push(callback);
    }
}
exports.default = Runtime;
