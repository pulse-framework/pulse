import Pulse, {State, Computed} from './';
import {copy} from './utils';
import {CallbackContainer, SubscriptionContainer} from './sub';

export interface JobInterface {
	state: State
	newStateValue?: any
	background?: boolean
}

export interface JobConfigInterface {
	perform?: boolean
	background?: boolean
}

export default class Runtime {
	public puleInstance: Pulse;

	private current: JobInterface | null = null;
	private queue: Array<JobInterface> = [];
	private completed: Array<JobInterface> = [];

	private tasksOnceComplete: Array<() => any> = [];

	public trackState: boolean = false;
	public foundState: Set<State> = new Set();

	constructor(pulseInstance: Pulse) {
		this.puleInstance = pulseInstance;
	}

	/**
	 * @internal
	 * Creates a Job out of the State and the new Value and add it to a queue
	 */
	public ingest(state: State, newStateValue?: any, options: JobConfigInterface = {perform: true}): void {
		const job: JobInterface = {
			state: state,
			newStateValue: newStateValue,
			background: options?.background
		};

		// grab nextState if newState not passed, compute if needed
		if (newStateValue === undefined) {
			job.newStateValue =
				job.state instanceof Computed
					? // if computed, recompute value
					job.state.computeValue()
					: // otherwise, default to nextState
					job.state.nextState;
		}

		// Push the Job to the Queue (the queue is then processed)
		this.queue.push(job);

		// Perform the Job
		if (options?.perform) {
			const performJob = this.queue.shift();
			if (performJob)
				this.perform(performJob);
			else
				console.warn("Pulse: Failed to perform Job ", job)
		}
	}

	/**
	 * @internal
	 * Perform a State Update
	 */
	private perform(job: JobInterface): void {
		// Set Job to current
		this.current = job;

		// Set Previous State
		job.state.previousState = copy(job.state._masterValue);

		// Write new value into the State
		job.state.privateWrite(job.newStateValue);

		// Perform SideEffects like watcher functions
		this.sideEffects(job.state);

		// Set Job as completed (The deps and subs of completed jobs will be updated)
		if (!job.background)
			this.completed.push(job);

		// Reset Current Job
		this.current = null;

		// Logging
		if (this.puleInstance.config.logJobs)
			console.log(`Pulse: Completed Job(${job.state.name})`, job);

		// Continue the Loop and perform the next job.. if no job is left update the Subscribers for each completed job
		if (this.queue.length > 0) {
			const performJob = this.queue.shift();
			if (performJob)
				this.perform(performJob);
			else
				console.warn("Pulse: Failed to perform Job ", job);
		} else {
			// https://stackoverflow.com/questions/9083594/call-settimeout-without-delay
			setTimeout(() => {
				// Cause rerender on Subscribers
				this.updateSubscribers();
			})
		}
	}

	/**
	 * @internal
	 * SideEffects are sideEffects of the perform function.. for instance the watchers
	 */
	private sideEffects(state: State) {
		let dep = state.dep;

		// cleanup dynamic deps
		dep.dynamic.forEach((state) => {
			state.dep.deps.delete(dep);
		});
		dep.dynamic = new Set();

		// this should not be used on root state class as it would be overwritten by extentions
		// this is used mainly to cause group to generate its output after changing
		if (typeof state.sideEffects === 'function')
			state.sideEffects();

		// Call Watchers
		for (let watcher in state.watchers)
			if (typeof state.watchers[watcher] === 'function')
				state.watchers[watcher](state.getPublicValue());

		// Ingest dependents (Perform is false because it will be performed anyway after this sideEffect)
		dep.deps.forEach((state) => this.ingest(state, undefined, {perform: false}));
	}

	/**
	 * @internal
	 * This will be update all Subscribers of complete jobs
	 */
	private updateSubscribers(): void {
		// Check if Pulse has an integration because its useless to go trough this process without framework
		// It won't happen anything because the state has no subs.. but this check here will maybe improve the performance
		if (!this.puleInstance.integration) {
			this.completed = [];
			// TODO maybe a warning but if you want to use PulseJS without framework this might get annoying
			return;
		}

		// Components that has to be updated
		const componentsToUpdate: Set<SubscriptionContainer> = new Set<SubscriptionContainer>();

		// Map through completed Jobs
		this.completed.forEach((job) =>
			// Map through subs of the current Job State
			job.state.dep.subs.forEach((subscriptionContainer) => {
				// For a Container that require props to be passed
				if (subscriptionContainer.passProps) {
					let localKey: string | null = null;

					// Find the local Key for this update by comparing the State instance from this Job to the State instances in the mappedStates object
					for (let key in subscriptionContainer.propStates)
						if (subscriptionContainer.propStates[key] === job.state)
							localKey = key;

					// If matching key is found push it into the SubscriptionContainer
					if (localKey)
						subscriptionContainer.propKeysChanged.push(localKey);
				}
				componentsToUpdate.add(subscriptionContainer);
			})
		);

		// Perform Component or Callback updates
		componentsToUpdate.forEach((subscriptionContainer) => {
			// If Callback based subscription call the Callback Function
			if (subscriptionContainer instanceof CallbackContainer) {
				subscriptionContainer.callback();
				return;
			}

			// If Component based subscription call the updateMethod which every framework has to define
			if (this.puleInstance.integration?.updateMethod)
				this.puleInstance.integration?.updateMethod(subscriptionContainer.component, this.formatChangedPropKeys(subscriptionContainer));
			else
				console.warn("Pulse: The framework which you are using doesn't provide an updateMethod so it might be possible that no rerender will be triggered");
		});

		// Log Job
		if (this.puleInstance.config.logJobs && componentsToUpdate.size > 0)
			console.log("Pulse: Rerendered Components ", componentsToUpdate);

		// Reset completed Jobs
		this.completed = [];

		// Run any tasks for next runtime
		this.tasksOnceComplete.forEach((task) => typeof task === 'function' && task());
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
			if (subscriptionContainer.propStates)
				finalObject[changedKey] = subscriptionContainer.propStates[changedKey].value;
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
