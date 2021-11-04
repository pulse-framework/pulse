import { Pulse } from './pulse';
import { IJob } from './internal';

export class Tracker {
  jobs: Set<IJob> = new Set();

  constructor(public instance: () => Pulse, changeFunc: () => void) {
    this.instance().runtime.trackers.add(this);
    changeFunc();
    this.instance().runtime.trackers.delete(this);
  }

  public ingest(job: IJob) {
    this.jobs.add(job);
  }

  public undo() {}

  public destroy() {}
}
