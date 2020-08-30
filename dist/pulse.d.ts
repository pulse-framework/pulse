import State from './state';
import Computed from './computed';
import Collection, { GroupObj, DefaultDataItem, SelectorObj, Config } from './collection/collection';
import SubController from './sub';
import Runtime from './runtime';
import Storage, { StorageConfig } from './storage';
import API, { apiConfig } from './api/api';
import Group from './collection/group';
import { Integration } from './integrations/use';
import { Controller, ControllerConfig, FuncObj, StateObj } from './controller';
import StatusTracker from './status';
import CollectionStorage, { CollectionStorageConfig } from './collection/storage';
export interface PulseConfig {
    computedDefault?: any;
    waitForMount?: boolean;
    framework?: any;
    frameworkConstructor?: any;
    storage?: StorageConfig;
    collectionStorage?: CollectionStorageConfig;
    logJobs?: boolean;
    /**
     * Typically, Pulse waits for a Core to be initialized before running any Computed functions.
     * Set this `true` to bypass that functionality, and always do an initial computation.
     */
    noCore?: boolean;
}
export declare const defaultConfig: PulseConfig;
interface ErrorObject {
    code: number;
    message: string;
    action: Function;
    raw: any;
}
export default class Pulse {
    config: PulseConfig;
    ready: boolean;
    runtime: Runtime;
    status: StatusTracker;
    storage: Storage;
    collectionStorage: CollectionStorage;
    controllers: {
        [key: string]: any;
    };
    subController: SubController;
    errorHandlers: Set<(error: ErrorObject) => void>;
    integration: Integration;
    private computed;
    private core;
    constructor(config?: PulseConfig);
    initFrameworkIntegration(frameworkConstructor: any): void;
    Controller: <S = StateObj, C = Collection<DefaultDataItem, GroupObj, SelectorObj>, A = FuncObj, H = FuncObj, R = FuncObj>(config: Partial<ControllerConfig<S, C, A, H, R>>, spreadToRoot?: any) => Controller<S, C, A, H, R>;
    Core: <CoreType>(core?: CoreType) => CoreType;
    private onInstanceReady;
    /**
     * Create Pulse API
     * @param config Object
     * @param config.options Object - Typescript default: RequestInit (headers, credentials, mode, etc...)
     * @param config.baseURL String - Url to prepend to endpoints (without trailing slash)
     * @param config.timeout Number - Time to wait for request before throwing error
     */
    API: (config: apiConfig) => API;
    /**
     * Create Pulse state
     * @param initialState Any - the value to initialze a State instance with
     */
    State: <T>(initial: T) => State<T>;
    /**
     * Create many Pulse states at the same time
     * @param stateGroup Object with keys as state name and values as initial state
     */
    StateGroup: (stateGroup: any) => any;
    /**
     * Create a Pulse computed function
     * @param deps Array - An array of state items to depend on
     * @param func Function - A function where the return value is the state, ran every time a dep changes
     */
    Computed: <T = any>(func: () => any, deps?: Array<any>) => Computed<T>;
    onError(handler: (error: ErrorObject) => void): void;
    Error(error: any, code?: string): void;
    Action(func: Function): () => any;
    /**
     * Create a Pulse collection with automatic type inferring
     * @param config object | function returning object
     * @param config.primaryKey string - The primary key for the collection.
     * @param config.groups object - Define groups for this collection.
     */
    Collection: <DataType = DefaultDataItem>() => <G = GroupObj, S = SelectorObj>(config: Config<DataType, G, S>) => Collection<DataType, G, S>;
    /**
     * Reset to initial state.
     * - Supports: State, Collections and Groups
     * - Removes persisted state from storage.
     * @param Items Array of items to reset
     */
    reset(items: Array<State | Group | Collection>): void;
    nextPulse(callback: () => any): void;
    setStorage(storageConfig: StorageConfig): void;
    Storage(storageConfig: StorageConfig): void;
    /**
     * Global refrence to the first pulse instance created this runtime
     */
    private globalBind;
}
export declare function persist(items: Array<State>): void;
export {};
