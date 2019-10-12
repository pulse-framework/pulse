import { uuid } from './helpers';
import { Global } from './interfaces';
import { Job } from './runtime';

export default class Action {
  public executing: boolean = false;
  public uuid: string;
  public changes: Set<Job> = new Set();
  public exec: () => {};

  constructor(
    private collection: string,
    private global: Global,
    public action: any,
    public actionName: string
  ) {
    this.uuid = uuid();
    this.prepare(action, global, this.global.contextRef.undo);
  }

  prepare(action, global, undo) {
    const _this = this;

    this.exec = function() {
      // empty actions previous cached changes
      this.changes.clear();

      const context = global.getContext(_this.collection);
      context.undo = error => {
        return undo(this.actionName, this.uuid, error);
      };
      global.runningAction = _this;

      _this.executing = true;

      const result = action.apply(
        null,
        [context].concat(Array.prototype.slice.call(arguments))
      );

      _this.executing = false;
      global.runningAction = false;

      this.changes.clear();

      return result;
    };
  }
}
