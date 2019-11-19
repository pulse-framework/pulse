import { Global } from './interfaces';
import { Job } from './runtime';

export default class Action {
  public executing: boolean = false;
  public changes: Set<Job> = new Set();
  public exec: Function;
  public debouncing: any;
  public ms: number;
  private debounceCallback: Function;
  constructor(
    private collection: string,
    private global: Global,
    public action: any,
    public actionName: string
  ) {
    this.prepare(action, global, this.global.contextRef.undo);
  }

  private prepare(action, global, undo) {
    const _this = this;

    this.exec = function() {
      const context = global.getContext(_this.collection);

      // wrap undo function with action context
      context.undo = error => undo(this, error);

      _this.declareActionRunning();

      // run action with context
      const result = action.apply(
        null,
        [context].concat(Array.prototype.slice.call(arguments))
      );

      _this.declareActionFinishedRunning();

      return result;
    };
  }

  //
  private declareActionRunning() {
    // empty actions previous cached changes
    this.changes.clear();
    this.executing = true;
    // allow runtime to track nested action
    this.global.runtime.runningActions.push(this);
    this.global.runtime.runningAction = this;
  }

  private declareActionFinishedRunning() {
    let runtime = this.global.runtime;

    this.executing = false;
    this.changes.clear();

    runtime.runningActions.pop();
    // restore previous running action
    const previousAction =
      runtime.runningActions[runtime.runningActions.length - 1];
    if (previousAction) runtime.runningAction = previousAction;
  }

  public async debounce(stealthMom: Function, amount: number) {
    // already interval running, cancel
    if (this.debouncing) clearInterval(this.debouncing);
    // set countdown to original amount
    this.ms = amount;
    return new Promise(resolve => {
      // set debouncing to current interval
      this.debouncing = setInterval(() => {
        // if this interval makes it to zero
        if (this.ms == 0) {
          clearInterval(this.debouncing);
          this.debouncing = false;
          return resolve(stealthMom());
        }
        --this.ms;
        // ensure this interval runs every millisecond
      }, 1);
    });
  }

  public async softDebounce(callback: Function, amount: number) {
    this.ms = amount;
    this.debounceCallback = callback;
    if (this.debouncing) return;
    this.debouncing = setInterval(() => {
      if (this.ms == 0) {
        clearInterval(this.debouncing);
        this.debouncing = false;
        this.debounceCallback();
      }
      --this.ms;
    }, 1);
  }
}
