import Pulse, { State } from './';
import { defineConfig, isFunction, isAsync } from './utils';

export interface StorageConfig {
  type?: 'custom' | 'localStorage';
  prefix?: string;
  async?: boolean;
  get?: any;
  set?: any;
  remove?: any;
}

export default class Storage {
  public config: StorageConfig;
  private storageReady: boolean = false;
  public persistedState: Set<State> = new Set();

  constructor(private instance: () => Pulse, config: StorageConfig) {
    this.config = defineConfig(config, {
      prefix: 'pulse',
      type: 'localStorage'
    });

    // assume if user provided get, set or remove methods that the storage type is custom
    if (this.config.get || this.config.set || this.config.remove) {
      this.config.type = 'custom';
    }

    if (this.localStorageAvailable() && this.config.type === 'localStorage') {
      this.config.get = localStorage.getItem.bind(localStorage);
      this.config.set = localStorage.setItem.bind(localStorage);
      this.config.remove = localStorage.removeItem.bind(localStorage);
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
      } catch (error) {
        console.warn('Pulse: Failed to get local storage value', error);
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

  private localStorageAvailable() {
    try {
      localStorage.setItem('_', '_');
      localStorage.removeItem('_');
      return true;
    } catch (e) {
      return false;
    }
  }
}
