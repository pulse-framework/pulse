import State, { StateGroup } from './state';
import deepmerge from 'deepmerge';
import Computed from './computed';
import Collection from './collection/collection';
import SubController from './sub';
import Runtime from './runtime';
import Storage from './storage';
import API, { apiConfig } from './api/api';
import Group from './collection/group';
import use, { Intergration } from './intergrations/use';
export interface PulseConfig {
  storagePrefix?: string;
  computedDefault?: any;
  waitForMount?: boolean;
  framework?: any;
  frameworkConstructor?: any;
  storage?: {};
}

export default class Pulse {
  public runtime: Runtime;
  public storage: Storage;
  public subController: SubController;
  public intergration: Intergration = null;
  constructor(public config: PulseConfig) {
    this.subController = new SubController(this);
    this.runtime = new Runtime(this);
    this.storage = new Storage(this, config.storage || {});
    this.initFrameworkIntergration(config.framework);
    this.globalBind();
    deepmerge({}, {});
  }
  public initFrameworkIntergration(frameworkConstructor) {
    use(frameworkConstructor, this);
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
  public State = (initialState: any) => new State(() => this, initialState);
  /**
   * Create many Pulse states at the same time
   * @param stateGroup Object with keys as state name and values as initial state
   */
  public StateGroup = (stateGroup: any) => StateGroup(() => this, stateGroup);
  /**
   * Create a Pulse computed function
   * @param deps Array - An array of state items to depend on
   * @param func Function - A function where the return value is the state, ran every time a dep changes
   */
  public Computed = (func: Function, deps?: Array<any>) =>
    new Computed(() => this, func, deps);
  /**
   * Create a Pulse collection
   * @param config object
   * @param config.primaryKey The primary key for the collection.
   * @param config.groups Define groups for this collection.
   */
  public Collection = (config: any) => new Collection(() => this, config);
  /**
   * Reset to initial state.
   * - Supports: State, Collections and Groups
   * - Removes persisted state from storage.
   * @param Items Array of items to reset
   */
  public reset(items: Array<State | Group | Collection>): void {}

  /**
   * Global refrence to the first pulse instance created this runtime
   */
  private globalBind() {
    try {
      if (!globalThis.__pulse) globalThis.__pulse = this;
    } catch (error) {
      // fail silently
    }
  }
}

// Handy utils
export function persist(items: Array<State>): void {
  items.forEach(item => item.persist(item.storageKey));
}

type Ojb = { [key: string]: any };

export function SSR(instance: () => Pulse, tree: Ojb): Ojb {
  let pulse = instance();

  return;
}

// SSR
//  1. Detect if Node & Next
//  2. Save each State to globalThis.__NEXT_DATA__.__PULSE_DATA__
//  3. Increment globalThis.__NEXT_DATA__.__PULSE_DATA__.stateKey

// 3. If not NODE load state
