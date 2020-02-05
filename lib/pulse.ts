import State, { StateGroup } from './state';
import Computed from './computed';
import Collection from './collection/collection';
import SubController from './sub';
import Runtime from './runtime';
import Storage from './storage';
import Request from './request';
import Group from './collection/group';
export interface PulseConfig {
  storagePrefix?: string;
  computedDefault?: any;
  framework?: any;
  storage?: {};
}

export default class Pulse {
  public subController: SubController;
  public runtime: Runtime;
  public storage: Storage;
  constructor(public config: PulseConfig) {
    this.subController = new SubController(this);
    this.runtime = new Runtime(this);
    this.storage = new Storage(this, config.storage || {});
  }
  /**
   * Create Pulse state
   * @param any initialState - the value to initialze a State instance with
   */
  public State = (initialState: any) => new State(this, initialState);
  public StateGroup = (stateGroup: any) => StateGroup(this, stateGroup);
  public Action = (config: any) => new Collection(this);
  public Reactive = (config: any) => new Collection(this);
  public Computed = (deps: Array<any>, func: Function) =>
    new Computed(this, deps, func);
  public Controller = (config: any) => new Collection(this);
  public Collection = (config: any) => new Collection(this, config);
  public Request = Request;
  /**
   * Reset to initial state.
   * - Supports: State, Collections and Groups
   * - Removes persisted state from storage.
   * @param Array items - Array of items to reset
   */
  public reset(items: Array<State | Group | Collection>): void {}
}

// Handy utils
export function persist(items: Array<State>): void {
  items.forEach(item => item.persist(item.storageKey));
}
