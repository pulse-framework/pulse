import Pulse, { State, Computed } from './';
import { copy } from './utils';
import { CallbackContainer, ComponentContainer, SubscriptionContainer } from './sub';
import Group from './collection/group';

export interface Job {
  state: State;
  newState?: any;
}
export default class Runtime {
  private current: Job = null;
  private queue: Array<Job> = [];
  private complete: Array<Job> = [];

  public trackState: boolean = false;
  public foundState: Set<State> = new Set();

  constructor(private instance: Pulse) {}

  public ingest(state: State, newState?: any, perform: boolean = true): void {
    let job: Job = { state, newState };
    // grab nextState if newState not passed
    if (arguments[1] === undefined) job.newState = job.state.nextState;

    this.queue.push(job);

    // if no current job, begin the next!
    if (perform) this.perform(this.queue.shift());
  }

  private perform(job: Job): void {
    // debugger;
    this.current = job;
    job.state.previousState = copy(job.state.masterValue);

    // write new value as result of mutation
    job.state.privateWrite(job.newState);

    // set next state for future mutations
    job.state.nextState = copy(job.newState);

    // perform side effects
    this.sideEffects(job.state);

    // declare completed
    this.complete.push(job);
    // console.log('job', job);
    this.current = null;

    // continue the loop and perform the next job or update subscribers
    if (this.queue.length > 0) this.perform(this.queue.shift());
    else {
      setTimeout(() => {
        this.updateSubscribers();
      });
    }
  }

  private sideEffects(state: State) {
    let dep = state.dep;

    // cleanup dynamic deps
    dep.dynamic.forEach(state => {
      state.dep.deps.delete(dep);
    });
    dep.dynamic = new Set();

    // this should not be used on root state class as it would be overwritten by extentions
    // this is used mainly to cause group to generate its output after changing
    if (typeof state.sideEffects === 'function') state.sideEffects();

    // ingest dependents
    dep.deps.forEach(state => {
      this.ingest(state, state.mutation(), false);
    });
  }

  private updateSubscribers(): void {
    let componentsToUpdate: Set<SubscriptionContainer> = new Set();
    this.complete.forEach(job =>
      job.state.dep.subs.forEach(cC => {
        // for containers that require props to be passed
        if (cC.passProps) {
          let localKey: string;
          // find the local key for this update by comparing the State instance from this job to the state instances in the mappedStates object
          for (let key in cC.mappedStates) if (cC.mappedStates[key] === job.state) localKey = key;
          // once a matching key is found push it into the SubscriptionContainer
          if (localKey) cC.keysChanged.push(localKey);
        }
        componentsToUpdate.add(cC);
      })
    );

    // perform component or callback updates
    componentsToUpdate.forEach(cC => {
      // are we dealing with a CallbackContainer?
      if (cC instanceof CallbackContainer) {
        // just invoke the callback
        (cC as CallbackContainer).callback();
        // is this a ComponentContainer
      } else if (cC instanceof ComponentContainer) {
        // call the current intergration's update method
        this.instance.intergration.updateMethod(cC.instance, Runtime.assembleUpdatedValues(cC));
      }
    });
    this.complete = [];
  }

  public getFoundState() {
    this.trackState = false;
    const ret = this.foundState;
    this.foundState = new Set();
    return ret;
  }

  static assembleUpdatedValues(cC: SubscriptionContainer) {
    let returnObj: any = {};
    cC.keysChanged.forEach(changedKey => {
      // extract the value from State for changed keys
      returnObj[changedKey] = cC.mappedStates[changedKey].value;
    });
    return returnObj;
  }
}
