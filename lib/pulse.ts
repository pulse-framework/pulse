// prettier-ignore
import { State, StateGroup, Computed, Collection, GroupObj, DefaultDataItem, SelectorObj, Config, SubController, Runtime, Storage, Event, EventPayload, EventConfig, EventsObjFunc, StorageConfig, API, APIConfig, Group, Controller, ControllerConfig, FuncObj, StateObj, StatusTracker, Integrations } from './internal';

export interface PulseConfig {
  computedDefault?: any;
  waitForMount?: boolean;
  storage?: StorageConfig;
  logJobs?: boolean;
  noCore?: boolean;
}

export const defaultConfig: PulseConfig = {
  noCore: false
};

interface ErrorObject {
  code: number; // if the error was because of a request, this will be the request error code
  message: string;
  action: Function; // reference to action in which the error occurred
  raw: any; // The raw error
}

export class Pulse {
  public ready: boolean = false;
  public runtime: Runtime;
  public status: StatusTracker;
  public storage: Storage;
  public controllers: { [key: string]: any } = {};
  public subController: SubController;
  public errorHandlers: Set<(error: ErrorObject) => void> = new Set();
  public integrations: Integrations;

  // Core reference
  private core: { [key: string]: any } = {};
  // Context reference
  private _computed: Set<Computed> = new Set();
  private _state: Set<State> = new Set();
  private _collections: Set<Collection> = new Set();

  constructor(public config: PulseConfig = defaultConfig) {
    this.integrations = new Integrations(() => this);
    this.subController = new SubController(this);
    // this.status = new StatusTracker(() => this);
    this.runtime = new Runtime(this);
    this.storage = new Storage(() => this, config.storage);
    // if (config.framework) this.initFrameworkIntegration(config.framework);
    if (this.config.noCore === true) this.onInstanceReady();
    this.globalBind();
  }

  public Core<CoreType>(core?: CoreType): CoreType {
    if (!this.ready && core) this.onInstanceReady(core);
    return this.core as CoreType;
  }

  public Controller<O extends Partial<ControllerConfig>>(config: Partial<O>): Controller<O> {
    return new Controller<O>(config);
  }

  /**
   * Create Pulse state
   * @param initialState Any - the value to initialize a State instance with
   */
  public State<T>(initial: T) {
    const state = new State<T>(() => this, initial);
    this._state.add(state);
    return state;
  }
  /**
   * Create a Pulse computed function
   * @param deps Array - An array of state items to depend on
   * @param func Function - A function where the return value is the state, ran every time a dep changes
   */
  public Computed<T = any>(func: () => any, deps?: Array<any>) {
    const computed = new Computed<T>(() => this, func, deps);
    this._computed.add(computed);
    return computed;
  }

  /**
   * Create a Pulse collection with automatic type inferring
   * @param config object | function returning object
   * @param config.primaryKey string - The primary key for the collection.
   * @param config.groups object - Define groups for this collection.
   */
  public Collection<DataType = DefaultDataItem>() {
    return <G = GroupObj, S = SelectorObj>(config: Config<DataType, G, S>) => {
      const collection = new Collection<DataType, G, S>(() => this, config);
      this._collections.add(collection);
      return collection;
    };
  }
  /**
   * Create a Pulse Action
   */
  public Action(func: Function) {
    return () => {
      const returnValue = func();

      return returnValue;
    };
  }

  /**
   * Create Pulse API
   * @param config Object
   * @param config.options Object - Typescript default: RequestInit (headers, credentials, mode, etc...)
   * @param config.baseURL String - Url to prepend to endpoints (without trailing slash)
   * @param config.timeout Number - Time to wait for request before throwing error
   */
  public API(config: APIConfig) {
    return new API(config);
  }

  /**
   * Create a Pulse Event
   */
  public Event<P = EventPayload>(config?: EventConfig<P>) {
    return new Event(() => this, config);
  }

  /**
   * Create multiple Pulse Events simultaneously while maintaining type safety
   */
  public EventGroup<E extends EventsObjFunc>(eventsFunc?: E): ReturnType<E> {
    // invoke the EventsObjFunc and pass in the CreateEventFunc
    const eventObj = eventsFunc(config => new Event(() => this, config));
    // assign name from key if undefined in EventConfig
    for (const eventName in eventObj) if (!eventObj[eventName].config.name) eventObj[eventName].config.name = eventName;
    // return the object and cast return value
    return eventObj as ReturnType<E>;
  }

  public Storage(config: StorageConfig): void {
    return this.setStorage(config);
  }

  /**
   * Create many Pulse states at the same time
   * @param stateGroup Object with keys as state name and values as initial state
   */
  public StateGroup(stateGroup: any) {
    return StateGroup(() => this, stateGroup);
  }

  /**
   * Create a Pulse Error
   */
  public Error(error: any, code?: string) {}

  /**
   * Reset to initial state.
   * - Supports: State, Collections and Groups
   * - Removes persisted state from storage.
   * @param Items Array of items to reset
   */
  public reset(items: Array<State | Group | Collection>): void {}

  /**
   * onError handler
   */
  public onError(handler: (error: ErrorObject) => void) {}

  /**
   * nextPulse helper function
   */
  public nextPulse(callback: () => any): void {
    this.runtime.nextPulse(callback);
  }

  // INTERNAL FUNCTIONS
  private onInstanceReady(core?: { [key: string]: any }) {
    this.ready = true;

    // Copy core object structure without destroying this.core object reference
    if (core) for (let p in core) this.core[p] = core[p];

    this._computed.forEach(instance => instance.recompute());
  }
  // public initFrameworkIntegration(frameworkConstructor: any) {
  //   use(frameworkConstructor, this);
  // }
  public use(): this {
    return this;
  }

  public setStorage(config: StorageConfig): void {
    const persistedState = this.storage.persistedState;
    this.storage = new Storage(() => this, config);
    this.storage.persistedState = persistedState;
    this.storage.persistedState.forEach(state => state.persist(state.name));
  }

  /**
   * Global reference to the first pulse instance created this runtime
   */
  private globalBind() {
    try {
      if (!globalThis.__pulse__) globalThis.__pulse__ = Pulse;
      if (!globalThis.__pulse__app) globalThis.__pulse__app = this;
    } catch (error) {
      // fail silently
    }
  }
}

export default Pulse;
