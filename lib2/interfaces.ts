import SubController from './subController';
import Runtime from './runtime';
import Collection from './collection';
import Dep from './dep';
import Action from './action';
import Computed from './computed';

export interface ExpandableObject {
  [key: string]: any;
}

export interface RequestConfig {
  baseURL?: string;
  requestIntercept?: () => void;
  responseIntercept?: () => void;
  mode?: 'cors' | 'same-origin' | 'no-cors' | 'navigate';
  credentials?: 'omit' | 'same-origin';
  include?: any;
  headers?: ExpandableObject;
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
  enableBase: boolean;
  enableRequest: boolean;
}
export interface CollectionConfig {}

export interface CollectionObject {
  config?: CollectionConfig;
  data?: object;
  persist?: Array<string>;
  groups?: Array<string>;
  actions?: object;
  computed?: object;
  filters?: object;
  watch?: object;
  routes?: object;
  model?: object;
  local?: object;
  // private
  indexes?: object;
}

export interface RootCollectionObject extends CollectionObject {
  config?: RootConfig;
  request?: object;
  collections?: object;
}

export interface Methods {
  collect?: void;
  replaceIndex?: void;
  getGroup?: void;
  newGroup?: void;
  deleteGroup?: void;
  removeFromGroup?: void;
  update?: void;
  increment?: void;
  decrement?: void;
  delete?: void;
  purge?: void;
  watch?: void;
  findById?: void;
}

export interface Keys {
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
  runningAction: boolean | Action;
  runningComputed: boolean | Computed;
  runningWatcher: boolean | Watcher;
  contextRef: ExpandableObject;
  storage: any;
  getDep: any;
  // aliases
  createForeignGroupRelation: any;
  searchIndexes: any;
  dispatch: any;
  getContext: any;
  getInternalData: any;
  uuid: any;
  ingest?: any;
  request?: any;
  relations?: any;
}

export interface Private {
  global: Global;
  runtime: Runtime;
  collections?: { [key: string]: Collection };
  events?: { [key: string]: Array<(payload?: any) => any> };
}

export const enum JobType {
  PUBLIC_DATA_MUTATION = 'PUBLIC_DATA_MUTATION',
  INTERNAL_DATA_MUTATION = 'INTERNAL_DATA_MUTATION',
  INDEX_UPDATE = 'INDEX_UPDATE',
  COMPUTED_REGEN = 'COMPUTED_REGEN',
  GROUP_UPDATE = 'GROUP_UPDATE',
  DEEP_PUBLIC_DATA_MUTATION = 'DEEP_PUBLIC_DATA_MUTATION',
  BULK_INTERNAL_DATA_MUTATION = 'BULK_INTERNAL_DATA_MUTATION',
  DELETE_INTERNAL_DATA = 'DELETE_INTERNAL_DATA'
}

export interface Job {
  type: JobType;
  collection: string;
  property: string;
  value?: any;
  previousValue?: any;
  dep?: Dep;
  fromAction?: boolean | Action;
}

export interface ComponentContainer {
  instance: any;
  uuid: string;
  ready: boolean;
}
