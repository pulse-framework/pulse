import { Pulse, State, Computed, CallbackContainer, SubscriptionContainer } from './internal';
import { copy } from './utils';

export interface JobInterface {
  state: State;
  newStateValue?: any;
  background?: boolean;
}

export interface JobConfigInterface {
  perform?: boolean;
  background?: boolean;
}

export class Runtime {
  public instance: () => Pulse;

  // queue system
  public currentJob: JobInterface | null = null;
  private jobsQueue: Array<JobInterface> = [];
  private jobsToRerender: Array<JobInterface> = [];
  private tasksOnceComplete: Array<() => any> = [];

  // used for tracking computed dependencies
  public trackState: boolean = false;
  public foundState: Set<State> = new Set();

  constructor(pulseInstance: Pulse) {
    this.instance = () => pulseInstance;
  }

  /**
   * @internal
   * Creates a Job out of State and new Value and than add it to a job queue
   */
  public ingest(state: State, newStateValue?: any, options: JobConfigInterface = { perform: true, background: false }): void {
    // Create Job
    const job: JobInterface = { state: state, newStateValue: newStateValue, background: options?.background };

    // grab nextState if newState not passed, compute if needed
    if (newStateValue === undefined) {
      job.newStateValue =
        job.state instanceof Computed
          ? // if computed, recompute value
            job.state.computeValue()
          : // otherwise, default to nextState
            job.state.nextState;
    }

    // Push the Job to the Queue (the queue will then processed)
    this.jobsQueue.push(job);

    // Perform the Job
    if (options?.perform) {
      const performJob = this.jobsQueue.shift();
      if (performJob) this.perform(performJob);
      else console.warn('Pulse: Failed to perform Job ', job);
    }
  }

  /**
   * @internal
   * Perform a State Update
   */
  private perform(job: JobInterface): void {
    // Set Job to current
    this.currentJob = job;

    // Set Previous State
    job.state.previousState = copy(job.state._value);

    // Write new value into the State
    job.state.privateWrite(job.newStateValue);

    // Perform SideEffects such as watcher functions
    this.sideEffects(job.state);

    // Set Job as completed (The deps and subs of completed jobs will be updated)
    if (!job.background) this.jobsToRerender.push(job);

    // Reset Current Job
    this.currentJob = null;

    // Logging
    if (this.instance().config.logJobs) console.log(`Pulse: Completed Job(${job.state.name})`, job);

    // Continue the Loop and perform the next job.. if no job is left update the Subscribers for each completed job
    if (this.jobsQueue.length > 0) this.perform(this.jobsQueue.shift());
    else {
      setTimeout(() => {
        // Cause rerender on Subscribers
        this.updateSubscribers();
      });
    }
  }

  /**
   * SideEffects are sideEffects of the perform function.. for instance the watchers
   */
  private sideEffects(state: State) {
    let dep = state.dep;
    // this should not be used on root state class as it would be overwritten by extensions
    // this is used mainly to cause group to generate its output after changing
    if (typeof state.sideEffects === 'function') state.sideEffects();

    // Call Watchers
    for (let watcher in state.watchers) if (typeof state.watchers[watcher] === 'function') state.watchers[watcher](state.getPublicValue());

    // Ingest dependents (Perform is false because it will be performed anyway after this sideEffect)
    dep.deps.forEach(state => this.ingest(state, undefined, { perform: false }));
  }

  /**
   * @internal
   * This will be update all Subscribers of complete jobs
   */
  private updateSubscribers(): void {
    // Check if Pulse has an integration because its useless to go trough this process without framework
    // It won't happen anything because the state has no subs.. but this check here will maybe improve the performance
    if (!this.instance().integrations) {
      this.jobsToRerender = [];
      // TODO maybe a warning but if you want to use PulseJS without framework this might get annoying
      return;
    }

    // Subscriptions that has to be updated
    const subscriptionsToUpdate: Set<SubscriptionContainer> = new Set<SubscriptionContainer>();

    // Map through Jobs to Rerender
    this.jobsToRerender.forEach(job =>
      // Map through subs of the current Job State
      job.state.dep.subs.forEach(subscriptionContainer => {
        // Check if subscriptionContainer is ready
        if (!subscriptionContainer.ready) console.warn("Pulse: SubscriptionContainer isn't ready yet ", subscriptionContainer);

        // For a Container that require props to be passed
        if (subscriptionContainer.passProps) {
          let localKey: string | null = null;

          // Find the local Key for this update by comparing the State instance from this Job to the State instances in the propStates object
          for (let key in subscriptionContainer.propStates) if (subscriptionContainer.propStates[key] === job.state) localKey = key;

          // If matching key is found push it into the SubscriptionContainer propKeysChanged where it later will be build to an changed prop object
          if (localKey) subscriptionContainer.propKeysChanged.push(localKey);
        }
        // Add sub to subscriptions to Update
        subscriptionsToUpdate.add(subscriptionContainer);
      })
    );

    // Perform Component or Callback updates
    // TODO maybe add a unique key to a component and if its the same don't cause a rerender for both -> performance optimization
    subscriptionsToUpdate.forEach(subscriptionContainer => {
      // If Callback based subscription call the Callback Function
      if (subscriptionContainer instanceof CallbackContainer) {
        subscriptionContainer.callback();
        return;
      }

      // If Component based subscription call the updateMethod which every framework has to define
      this.instance().integrations.update(subscriptionContainer.component, this.formatChangedPropKeys(subscriptionContainer));
    });

    // Log Job
    if (this.instance().config.logJobs && subscriptionsToUpdate.size > 0) console.log('Pulse: Rerendered Components ', subscriptionsToUpdate);

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
  public formatChangedPropKeys(subscriptionContainer: SubscriptionContainer): { [key: string]: any } {
    const finalObject: { [key: string]: any } = {};

    // Build Object
    subscriptionContainer.propKeysChanged.forEach(changedKey => {
      if (subscriptionContainer.propStates) finalObject[changedKey] = subscriptionContainer.propStates[changedKey].value;
    });

    return finalObject;
  }

  public getFoundState() {
    this.trackState = false;
    const ret = this.foundState;
    this.foundState = new Set();
    return ret;
  }

  public nextPulse(callback: () => any) {
    this.tasksOnceComplete.push(callback);
  }
}

export default Runtime;
