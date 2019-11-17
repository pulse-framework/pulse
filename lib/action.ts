import {uuid} from './helpers';
import {Global} from './interfaces';
import {Job} from './runtime';

export default class Action {
  public executing: boolean = false;
  public uuid: string;
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
    this.uuid = uuid();
    this.prepare(action, global, this.global.contextRef.undo);
  }

  async debounce(stealthMom: Function, amount: number) {
    // already interval running, cancel
    if (this.debouncing) clearInterval(this.debouncing);
    // set countdown to original amount
    this.ms = amount;
    return new Promise(resolve => {
      // debugger;
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

  async softDebounce(callback: Function, amount: number) {
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

  prepare(action, global, undo) {
    const _this = this;

    this.exec = function() {
      // empty actions previous cached changes
      _this.changes.clear();

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

      _this.changes.clear();

      return result;
    };
  }
}
