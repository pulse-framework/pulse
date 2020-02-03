import Pulse, { State, Computed } from './root';
import { copy } from './utils';

export interface Job {
  state: State;
  newState: any;
}
export default class Runtime {
  private current: Job = null;
  private queue: Array<Job> = [];
  private complete: Array<Job> = [];
  constructor(private instance: Pulse) {}

  public ingest(state: State, newState: any) {
    let job: Job = { state, newState };
    this.queue.push(job);
    if (!this.current) this.nextJob();
  }

  private nextJob() {
    let job: Job = this.queue.shift();
    if (job) this.perform(job);
  }

  private perform(job: Job): void {
    this.current = job;
    job.state.previousState = copy(job.state.value);

    // write new value as result of mutation
    job.state.privateWrite(job.newState);

    // set next state for future mutations
    job.state.nextState = copy(job.newState);

    // perform side effects
    this.sideEffects(job.state);

    // declare completed
    this.complete.push(job);
    console.log('job', job);
    this.current = null;
    this.nextJob();
  }

  private sideEffects(state: State) {
    state.dep.deps.forEach(state => {
      if (state instanceof Computed) {
        this.ingest(state, state.mutation());
      }
    });
  }
}
