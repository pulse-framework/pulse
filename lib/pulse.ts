import State, { StateGroup } from './state';
import Computed from './computed';
import Collection from './collection/collection';
import SubController from './sub';
import Runtime from './runtime';
import Storage from './storage';
import API, { apiConfig } from './api/api';
import Group from './collection/group';
export interface PulseConfig {
  storagePrefix?: string;
  computedDefault?: any;
  framework?: any;
  storage?: {};
}

export default class Pulse {
  public runtime: Runtime;
  public storage: Storage;
  public subController: SubController;
  public intergration: any = null;
  constructor(public config: PulseConfig) {
    this.subController = new SubController(this);
    this.runtime = new Runtime(this);
    this.storage = new Storage(this, config.storage || {});
  }
  /**
   * Create Pulse API
   * @param config Object
   * @param config.options Object - Typescript default: RequestInit (headers, credentials, mode, etc...)
   * @param config.baseURL String - Url to prepend to endpoints (without trailing slash)
   * @param config.timeout Number - Time to wait for request before throwing error
   */
  public API = (config: apiConfig) => new API(config);
  /**
   * Create Pulse state
   * @param initialState Any - the value to initialze a State instance with
   */
  public State = (initialState: any) => new State(this, initialState);
  /**
   * Create many Pulse states at the same time
   * @param stateGroup Object with keys as state name and values as initial state
   */
  public StateGroup = (stateGroup: any) => StateGroup(this, stateGroup);
  /**
   * Create a Pulse computed function
   * @param deps Array - An array of state items to depend on
   * @param func Function - A function where the return value is the state, ran every time a dep changes
   */
  public Computed = (deps: Array<any>, func: Function) =>
    new Computed(this, deps, func);
  /**
   * Create a Pulse collection
   * @param config object
   * @param config.primaryKey The primary key for the collection.
   * @param config.groups Define groups for this collection.
   */
  public Collection = (config: any) => new Collection(this, config);
  /**
   * Reset to initial state.
   * - Supports: State, Collections and Groups
   * - Removes persisted state from storage.
   * @param Items Array of items to reset
   */
  public reset(items: Array<State | Group | Collection>): void {}
}

// Handy utils
export function persist(items: Array<State>): void {
  items.forEach(item => item.persist(item.storageKey));
}
