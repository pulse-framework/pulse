import { Pulse, State } from './internal';
import { defineConfig, isAsync } from './utils';

export interface StorageConfig {
  type?: 'custom' | 'localStorage';
  prefix?: string;
  async?: boolean;
  get?: any;
  set?: any;
  remove?: any;
}

export class Storage {
  public config: StorageConfig;
  private storageReady: boolean = false;
  public persistedState: Set<State> = new Set();

  constructor(private instance: () => Pulse, config: StorageConfig) {
    this.config = defineConfig(config, {
      prefix: 'pulse',
      type: 'localStorage'
    });
    // assume if user provided get, set or remove methods that the storage type is custom
    if (this.config.get || this.config.set || this.config.remove) this.config.type = 'custom';

    const ls = this.getLocalStorage();
    if (this.config.type === 'localStorage' && ls) {
      // assign localStorage crud functions to config object
      ['get', 'set', 'remove'].forEach(type => (this.config[type] = ls[`${type}Item`].bind(ls)));
      this.storageReady = true;
    } else {
      // Local storage not available, fallback to custom.
      this.config.type = 'custom';
      // ensuring all required storage properties are set
      if (isFunction(this.config.get) && isFunction(this.config.set) && isFunction(this.config.remove)) {
        // if asynchronous and developer did not explicitly define so, check
        if (this.config.async === undefined && isAsync(this.config.get)) this.config.async = true;
        this.storageReady = true;
      } else {
        // console.warn('Pulse Error: Persistent storage not configured, check get, set and remove methods', this.config);
        this.storageReady = false;
      }
    }
  }

  public get(key: string) {
    if (!this.storageReady) return;
    if (this.config.async) {
      return new Promise((resolve, reject) => {
        this.config
          .get(this.getKey(key))
          .then(res => {
            // if result is not JSON for some reason, return it.
            if (typeof res !== 'string') return resolve(res);
            resolve(JSON.parse(res));
          })
          .catch(reject);
      });
    } else {
      try {
        return JSON.parse(this.config.get(this.getKey(key)));
      } catch (e) {
        return undefined;
      }
    }
  }

  public set(key: string, value: any) {
    if (!this.storageReady) return;
    this.config.set(this.getKey(key), JSON.stringify(value));
  }

  public remove(key: string) {
    if (!this.storageReady) return;
    this.config.remove(this.getKey(key));
  }

  private getKey(key: string) {
    return `_${this.config.prefix}_${key}`;
  }
  // used by State and Selector to persist value inside storage

  public handleStatePersist(state: State, key: string) {
    const storage = this;
    // validation
    if (!key && state.name) {
      key = state.name;
    } else if (!key) {
      return;
      // console.warn('Pulse Persist Error: No key provided');
    } else {
      state.name = key;
    }
    // add ref to state instance inside storage
    storage.persistedState.add(state);

    // handle the value
    const handle = (storageVal: any) => {
      // if no storage value found, set current value in storage
      if (storageVal === null) storage.set(state.name, state.getPersistableValue());
      // if Selector, select current storage value
      else if (typeof state['select'] === 'function' && (typeof storageVal === 'string' || typeof storageVal === 'number'))
        state['select'](storageVal);
      // otherwise just ingest the storage value so that the State updates
      else state.instance().runtime.ingest(state, storageVal);
    };
    // Check if promise, then handle value
    if (storage.config.async) storage.get(state.name).then((value: any) => handle(value));
    // non promise
    else handle(storage.get(state.name));
  }

  private getLocalStorage() {
    try {
      const ls = window?.localStorage ? window.localStorage : localStorage;
      if (typeof ls.getItem !== 'function') return false;
      return ls;
    } catch (e) {
      return false;
    }
  }
}

function isFunction(func: () => any) {
  return typeof func === 'function';
}

export default Storage;

// Handy utils
export function persist(items: Array<State>): void {
  items.forEach(item => item.persist(item.name));
}
