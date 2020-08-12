import State, { StateGroup } from './state';
import Computed from './computed';
import Collection, { GroupObj, DefaultDataItem, SelectorObj, CollectionConfig, Config } from './collection/collection';
import SubController from './sub';
import Runtime from './runtime';
import Storage, { StorageMethods } from './storage';
import API, { apiConfig } from './api/api';
import Group, { GroupName, PrimaryKey } from './collection/group';
import use, { Integration } from './integrations/use';
import { Controller, ControllerConfig, FuncObj, StateObj } from './controller';
import Data from './collection/data';
import { extractAll } from './utils';

export interface PulseConfig {
  storagePrefix?: string;
  computedDefault?: any;
  waitForMount?: boolean;
  framework?: any;
  frameworkConstructor?: any;
  storage?: StorageMethods;
  logJobs?: boolean;
  /**
   * Typically, Pulse waits for a Core to be initialized before running any Computed functions.
   * Set this `true` to bypass that functionality, and always do an initial computation.
   */
  noCore?: boolean;
}

interface ErrorObject {
  code: number; // if the error was because of a request, this will be the request error code
  message: string;
  action: Function; // reference to action in which the error occurred
  raw: any; // The raw error
}

export default class Pulse {
  public ready: boolean = false;
  public runtime: Runtime;
  public storage: Storage;
  public controllers: { [key: string]: any } = {};
  public subController: SubController;
  public errorHandlers: Set<(error: ErrorObject) => void> = new Set();
  public integration: Integration = null;

  // Context reference
  private computed: Set<Computed> = new Set();
  private core: { [key: string]: any } = {};

  constructor(public config: PulseConfig = {}) {
    this.subController = new SubController();
    this.runtime = new Runtime(() => this);
    this.storage = new Storage(() => this, config.storage || {});
    if (config.framework) this.initFrameworkIntegration(config.framework);
    this.globalBind();
    if (this.config.noCore === true) this.onInstanceReady();
  }

  public initFrameworkIntegration(frameworkConstructor) {
    use(frameworkConstructor, this);
  }

  public Controller = <S = StateObj, C = Collection, A = FuncObj, H = FuncObj, R = FuncObj>(
    config: Partial<ControllerConfig<S, C, A, H, R>>,
    spreadToRoot?: any
  ): Controller<S, C, A, H, R> => {
    return new Controller<S, C, A, H, R>(config, spreadToRoot);
  };

  public Core = <CoreType>(core?: CoreType): CoreType => {
    if (!this.ready && core) this.onInstanceReady(core);

    return this.core as CoreType;
  };

  private onInstanceReady(core?: { [key: string]: any }) {
    this.ready = true;

    if (core)
      // Copy core object structure without destorying this.core object reference
      for (let p in core) this.core[p] = core[p];

    this.computed.forEach(instance => instance.recompute());
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
  public State = <T>(initial: T) => new State<T>(() => this, initial);
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
  public Computed = <T = any>(func: () => any, deps?: Array<any>) => {
    const computed = new Computed<T>(() => this, func, deps);
    this.computed.add(computed);
    return computed;
  };

  public Jeff = (func: () => any) => {
    // return func;
  };

  public onError(handler: (error: ErrorObject) => void) {}
  public Error(error: any, code?: string) {}

  public Action(func: Function) {
    return () => {
      const returnValue = func();

      return returnValue;
    };
  }

  /**
   * Create a Pulse collection with automatic type inferring
   * @param config object | function returning object
   * @param config.primaryKey string - The primary key for the collection.
   * @param config.groups object - Define groups for this collection.
   */
  public Collection = <DataType = DefaultDataItem>() => {
    return <G = GroupObj, S = SelectorObj>(config: Config<DataType, G, S>) => {
      return new Collection<DataType, G, S>(() => this, config);
    };
  };
  /**
   * Reset to initial state.
   * - Supports: State, Collections and Groupss
   * - Removes persisted state from storage.
   * @param Items Array of items to reset
   */
  public reset(items: Array<State | Group | Collection>): void {}
  public nextPulse(callback: () => any): void {
    this.runtime.nextPulse(callback);
  }
  public setStorage(storageConfig: StorageMethods): void {
    const persistedState = this.storage.persistedState;
    this.storage = new Storage(() => this, storageConfig);
    this.storage.persistedState = persistedState;
    this.storage.persistedState.forEach(state => state.persist(state.name));
  }
  public Storage(storageConfig: StorageMethods): void {
    return this.setStorage(storageConfig);
  }

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
  items.forEach(item => item.persist(item.name));
}
