import SubController from './subController';
import Runtime from './runtime';
import Collection from './module/modules/collection';
import Dep from './dep';
import Action from './action';
import Computed from './computed';
import { JobType } from './runtime';
import RelationController from './relationController';
import Module from './module';

export interface RequestConfig {
  baseURL?: string;
  requestIntercept?: () => void;
  responseIntercept?: () => void;
  mode?: 'cors' | 'same-origin' | 'no-cors' | 'navigate';
  credentials?: 'omit' | 'same-origin';
  include?: any;
  headers?: object;
  saveHistory?: boolean;
  timeout?: number;
}

export interface Watcher {
  collection: string;
  property: string;
}

export interface RootConfig {
  framework?: any;
  frameworkConstructor?: any;
  waitForMount?: boolean;
  autoUnmount?: boolean;
  logJobs: boolean;
  computedDefault: boolean;
  baseModuleAlias?: boolean;
  mapDataUnderPropName?: string;
  debugMode?: Set<DebugType>;
  bindInstanceTo: string | boolean;
}
export interface CollectionConfig {}

export interface CollectionObject {
  config?: CollectionConfig;
  data?: Object;
  persist?: Array<string>;
  groups?: Array<string>;
  actions?: Object;
  computed?: Object;
  filters?: Object;
  watch?: Object;
  routes?: Object;
  model?: Object;
  local?: Object;
  onReady?: Function;
  staticData?: Object;
  // private
  indexes?: Object;
}

export interface RootCollectionObject extends CollectionObject {
  services?: any;
  modules?: any;
  config?: RootConfig;
  request?: object;
  collections?: object;
}

export interface Methods {
  collect?: Function;
  replaceIndex?: Function;
  getGroup?: Function;
  newGroup?: Function;
  deleteGroup?: Function;
  removeFromGroup?: Function;
  update?: Function;
  increment?: Function;
  decrement?: Function;
  delete?: Function;
  purge?: Function;
  throttle?: Function;
  watch?: Function;
  findById?: Function;
  forceUpdate?: Function;
  debounce?: Function;
  cleanse?: Function;
}

export interface Keys {
  staticData: string[];
  data?: Array<string>;
  computed?: Array<string>;
  actions?: Array<string>;
  indexes?: Array<string>;
}

export interface Global {
  subs: SubController;
  runtime?: Runtime;
  config: RootConfig;
  initComplete: boolean;
  collecting: boolean;
  touching: boolean;
  mappingData: boolean;
  runningComputed: boolean | Computed;
  runningWatcher: boolean | Watcher;
  runningPopulate: boolean | Object;
  gettingContext: boolean;
  touched: boolean | Dep;
  contextRef: object;
  relations?: RelationController;
  storage: Storage;
  // aliases
  getContext: Function;
  getInternalData: Function;
  uuid: Function;
  ingest?: Function;
  ingestDependents?: Function;
  getModuleInstance?: Function;
  request?: Object;
  log: Function;
}

modules: any;
export type ModuleInstance = Module | Collection;

export interface Private {
  global: Global;
  keys: any;
  modules?: { [key: string]: Module };
  collections?: { [key: string]: Collection };
  services?: { [key: string]: Module };
  helpers?: { [key: string]: Module };
  events?: { [key: string]: Array<(payload?: any) => any> };
}

export enum DebugType {
  ERRORS,
  ASSERT,
  JOBS,
  EVENTS
}

export interface Job {
  type: JobType;
  collection: string;
  property: string | number | Computed;
  value?: any;
  previousValue?: any;
  dep?: Dep;
  fromAction?: boolean | Action;
}
