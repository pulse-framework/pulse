// prettier-ignore
import { State, StateGroup, Computed, Collection, GroupObj, DefaultDataItem, SelectorObj, Config, SubController, Runtime, Storage, Event, EventPayload, EventConfig, EventsObjFunc, StorageConfig, API, APIConfig, Group, Controller, ControllerConfig, FuncObj, StateObj, StatusTracker, Integration, Integrations, Action, FuncType } from './internal';
import { Tracker } from './tracker';
import { HistoryItem } from './state';
import { CollectionConfig } from './collection/collection';
import { HigherOrderFunc } from './action';

export interface PulseConfig {
  computedDefault?: any;
  waitForMount?: boolean;
  storage?: StorageConfig;
  logJobs?: boolean;
  noCore?: boolean;
  globalHistory?: boolean;
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
  public history: HistoryItem[] = [];

  // integrations
  public integrations: Integrations;
  static initialIntegrations: Integration[] = [];

  // Core reference
  public core: { [key: string]: any } = {};
  // Context reference
  public _computed: Set<Computed> = new Set();
  public _state: Set<State> = new Set();
  public _collections: Set<Collection> = new Set();
  private nonce = 0;
  public config: PulseConfig = {};

  constructor() {
    this.integrations = new Integrations(() => this);
    this.subController = new SubController(this);
    this.status = new StatusTracker(() => this);
    this.runtime = new Runtime(this);
    this.storage = new Storage(() => this, this.config.storage || {});

    this.globalBind();
    this.integrations.pulseReady();
  }

  public onCoreReady(core?: { [key: string]: any }) {
    this.ready = true;

    // Copy core object structure without destroying this.core object reference
    if (core) for (let p in core) this.core[p] = core[p];

    this._computed.forEach(instance => instance.recompute());

    this.integrations.coreReady();
  }

  public with(integration: Integration): this {
    this.integrations.use(integration);
    return this;
  }

  public nextPulse(callback: () => any): void {
    this.runtime.nextPulse(callback);
  }

  public track(changeFunc: () => void) {
    return new Tracker(() => this, changeFunc);
  }

  public batch(batchFunc: () => void): void {
    this.runtime.batch(batchFunc);
  }

  public setStorage(config: StorageConfig): void {
    const persistedState = this.storage.persistedState;
    this.storage = new Storage(() => this, config);
    this.storage.persistedState = persistedState;
    this.storage.persistedState.forEach(state => state.persist(state.name));
  }

  public createError(error: any, info?: { fromAction?: any }): void {
    // handle
  }

  /**
   * Global reference to the first pulse instance created this runtime
   */
  private globalBind() {
    try {
      if (!globalThis.__pulse__) globalThis.__pulse__ = Pulse;
      if (!globalThis.__pulse__app) globalThis.__pulse__app = this;
    } catch (error) {} // fail silently
  }

  public getNonce() {
    this.nonce++;
    return this.nonce;
  }
  public configure(config: PulseConfig) {
    this.config = config;
  }
}

export const instance = new Pulse();

export default instance;

export function state<T>(initialState: T) {
  if (typeof initialState == 'function') {
    return new Computed<T>(() => instance, (initialState as unknown) as () => T);
  }
  return new State<T>(() => instance, initialState);
}

export function collection<DataType extends DefaultDataItem = DefaultDataItem>(config: CollectionConfig = {}) {
  const collection = new Collection<DataType, any, any>(() => instance, config);
  return collection;
}

export function action<T extends FuncType>(func: T) {
  return new Action(() => this, func).func();
}

export function event<P = EventPayload>(config?: EventConfig<P>) {
  return new Event(() => this, config);
}

export interface RouteConfig {
  method?: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE';
  endpoint?: string;
}

export interface CallRouteConfig {
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: Record<string, any>;
}

export function route<ResponseType = any>(config?: RouteConfig) {
  return async (config?: CallRouteConfig): Promise<ResponseType> => {
    return null;
  };
}
