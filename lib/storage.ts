import Pulse, { State } from './';
import { defineConfig } from './utils';

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
      // fallback
      this.storageConfig.type = 'custom';
      if (this.check(storageConfig.get) && this.check(storageConfig.set) && this.check(storageConfig.remove)) {
        this.storageReady = true;
      } else {
        this.storageReady = false;
      }
    }
  }

  public get(key: string) {
    if (!this.storageReady) return;

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
      // Added a try catch to avoid an "unexpected error" when used outside of a Promise - There might be a better way to do this but it fixes the problem for now - Rems
      try {
        return JSON.parse(this.storageConfig.get(this.getKey(key)));
      } catch (error) {
        return undefined;
      }
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

  private check(func: () => any) {
    return typeof func === 'function';
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
