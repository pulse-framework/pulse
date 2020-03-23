import Pulse, { State } from './';

export interface StorageMethods {
  type?: 'custom' | 'localStorage';
  async?: boolean;
  get?: any;
  set?: any;
  remove?: any;
}

export default class Storage {
  public isPromise: boolean = false;
  private storageReady: boolean = false;
  private storageType: 'localStorage' | 'custom' = 'localStorage';
  private storagePrefix: string = 'pulse';
  public persistedState: Set<State> = new Set();
  constructor(private instance: Pulse, private storageMethods: StorageMethods = {}) {
    if (this.instance.config.storagePrefix) this.storagePrefix = this.instance.config.storagePrefix;

    if (storageMethods.async) this.isPromise = true;

    // assume if user provided get, set or remove methods that the storage type is custom
    if (storageMethods.get || storageMethods.set || storageMethods.remove) {
      this.storageType = 'custom';
    }

    if (this.localStorageAvailable() && this.storageType === 'localStorage') {
      this.storageReady = true;
      storageMethods.get = localStorage.getItem.bind(localStorage);
      storageMethods.set = localStorage.setItem.bind(localStorage);
      storageMethods.remove = localStorage.removeItem.bind(localStorage);
    } else {
      this.storageType = 'custom';

      if (
        this.check(storageMethods.get) &&
        this.check(storageMethods.set) &&
        this.check(storageMethods.remove)
      ) {
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
        this.storageMethods
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
       * Added a trycatch to avoid an "unexpected error" when used outside of a Promise - There might be a better way to do this but it fixes the problem for now
       */
      try {
        return JSON.parse(this.storageMethods.get(this.getKey(key)));
      } catch (error) {
        return undefined;
      }
    }
  }

  public set(key, value) {
    if (!this.storageReady) return;
    this.storageMethods.set(this.getKey(key), JSON.stringify(value));
  }

  public remove(key) {
    if (!this.storageReady) return;
    this.storageMethods.remove(this.getKey(key));
  }

  private getKey(key) {
    return `_${this.storagePrefix}_${key}`;
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
