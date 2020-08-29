import Pulse, { State } from './';
import { defineConfig, isFunction, isAsync } from './utils';

export interface StorageConfig {
  type: 'custom' | 'localStorage';
  prefix: string;
  async?: boolean;
  get?: any;
  set?: any;
  remove?: any;
}

export default class Storage {
  public storageConfig: StorageConfig;
  private storageReady: boolean = false;
  public persistedState: Set<State> = new Set();

  constructor(private instance: () => Pulse, storageConfig: StorageConfig) {
    this.storageConfig = defineConfig(storageConfig, {
      prefix: 'pulse',
      type: 'localStorage'
    });

    // assume if user provided get, set or remove methods that the storage type is custom
    if (storageConfig.get || storageConfig.set || storageConfig.remove) {
      this.storageConfig.type = 'custom';
    }

    if (this.localStorageAvailable() && this.storageConfig.type === 'localStorage') {
      this.storageConfig.get = localStorage.getItem.bind(localStorage);
      this.storageConfig.set = localStorage.setItem.bind(localStorage);
      this.storageConfig.remove = localStorage.removeItem.bind(localStorage);
      this.storageReady = true;
    } else {
      // Local storage not available, fallback to custom.
      this.storageConfig.type = 'custom';
      // ensuring all required storage properties are set
      if (isFunction(storageConfig.get) && isFunction(storageConfig.set) && isFunction(storageConfig.remove)) {
        // if asynchronous and developer did not explicitly define so, check
        if (this.storageConfig.async === undefined && isAsync(storageConfig.get)) this.storageConfig.async = true;
        this.storageReady = true;
      } else {
        console.warn('Pulse Error: Persistent storage not configured, check get, set and remove methods', storageConfig);
        this.storageReady = false;
      }
    }
  }

  public get(key: string) {
    if (!this.storageReady) return;
    try {
      if (this.storageConfig.async) {
        return new Promise((resolve, reject) => {
          this.storageConfig
            .get(this.getKey(key))
            .then(res => {
              // if result is not JSON for some reason, return it.
              if (typeof res !== 'string') return resolve(res);

              resolve(JSON.parse(res));
            })
            .catch(reject);
        });
      } else {
        return JSON.parse(this.storageConfig.get(this.getKey(key)));
      }
    } catch (error) {
      console.warn('Pulse: Failed to get local storage value', error);
      return undefined;
    }
  }

  public set(key: string, value: any) {
    if (!this.storageReady) return;
    this.storageConfig.set(this.getKey(key), JSON.stringify(value));
  }

  public remove(key: string) {
    if (!this.storageReady) return;
    this.storageConfig.remove(this.getKey(key));
  }

  private getKey(key: string) {
    return `_${this.storageConfig.prefix}_${key}`;
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
