import Pulse, { State } from './';
import { defineConfig } from './utils';

export interface StorageConfig {
  type?: 'custom' | 'localStorage';
  prefix?: string;
  async?: boolean;
  get?: any;
  set?: any;
  remove?: any;
}

export default class Storage {
  public isPromise: boolean = false;
  private storageReady: boolean = false;
  private storageType: 'localStorage' | 'custom' = 'localStorage';
  public persistedState: Set<State> = new Set();
  public storageConfig: StorageConfig;
  constructor(private instance: () => Pulse, storageConfig: StorageConfig = {}) {
    this.storageConfig = defineConfig(storageConfig, {
      prefix: 'pulse'
    });

    if (storageConfig.async) this.isPromise = true;

    // assume if user provided get, set or remove methods that the storage type is custom
    if (storageConfig.get || storageConfig.set || storageConfig.remove) {
      this.storageType = 'custom';
    }

    if (this.localStorageAvailable() && this.storageType === 'localStorage') {
      this.storageReady = true;
      storageConfig.get = localStorage.getItem.bind(localStorage);
      storageConfig.set = localStorage.setItem.bind(localStorage);
      storageConfig.remove = localStorage.removeItem.bind(localStorage);
    } else {
      this.storageType = 'custom';

      if (this.check(storageConfig.get) && this.check(storageConfig.set) && this.check(storageConfig.remove)) {
        this.storageReady = true;
      } else {
        this.storageReady = false;
        // bad
      }
    }
  }

  public get(key) {
    if (!this.storageReady) return;

    if (this.isPromise) {
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
      /**
       * @itsRems - 3/23/20
       * Added a try catch to avoid an "unexpected error" when used outside of a Promise - There might be a better way to do this but it fixes the problem for now
       */
      try {
        return JSON.parse(this.storageConfig.get(this.getKey(key)));
      } catch (error) {
        return undefined;
      }
    }
  }

  public set(key, value) {
    if (!this.storageReady) return;
    this.storageConfig.set(this.getKey(key), JSON.stringify(value));
  }

  public remove(key) {
    if (!this.storageReady) return;
    this.storageConfig.remove(this.getKey(key));
  }

  private getKey(key) {
    return `_${this.storageConfig.prefix}_${key}`;
  }

  private check(func) {
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
