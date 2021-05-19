// prettier-ignore
import { State, StateGroup, Computed, Collection, GroupObj, DefaultDataItem, SelectorObj, Config, SubController, Runtime, Storage, Event, EventPayload, EventConfig, EventsObjFunc, StorageConfig, API, APIConfig, Group, Controller,   Action, FuncType, Integrations, Integration, Tracker, HistoryItem, CollectionConfig } from './internal';

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
  // public status: StatusTracker;
  public storage: Storage;
  public controllers: { [key: string]: any } = {};
  public subController: SubController;
  public errorHandlers: Set<(error: ErrorObject) => void> = new Set();
  public history: HistoryItem[] = [];

  // integrations
  public integrations: Integrations;
  static initialIntegrations: Integration[] = [];

  // Core reference
  public _core: { [key: string]: any } = {};
  // Context reference
  public _computed: Set<Computed> = new Set();
  public _state: Set<State> = new Set();
  public _collections: Set<Collection> = new Set();
  private nonce = 0;
  public config: PulseConfig = {};

  constructor() {
    this.integrations = new Integrations(() => this);
    this.subController = new SubController(this);
    // this.status = new StatusTracker(() => this);
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

  public core<CoreType>(core?: CoreType): CoreType {
    if (!this.ready && core) this.onCoreReady(core);
    return this._core as CoreType;
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

export default Pulse;
