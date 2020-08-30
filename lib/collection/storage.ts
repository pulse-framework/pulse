import State from "../state";
import { defineConfig } from "../utils";
import Collection from "./collection";

export interface CollectionStorageConfig {
  type: /*'custom' | */ 'indexedDB';
  prefix: string;
  async?: boolean;
  get?: any;
  set?: any;
  remove?: any;
}

export default class CollectionStorage {
  public storageConfig: CollectionStorageConfig;
  public collections: Collection[] = [];
  public storageReady: Boolean = false;
  private indexedClient = window.indexedDB;
  private stores: string[] = [];

  constructor(storageConfig: CollectionStorageConfig) {
    this.storageConfig = defineConfig(storageConfig, {
      prefix: 'pulseDB',
      type: 'indexedDB'
    });
    if (window && typeof window !== undefined) this.execute(() => {
      this.storageReady = true;
    });
  }

  public async getAll(collection: Collection): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      if (!this.storeExists(collection.config.name)) {
        if (!await this.createStore(collection.config.name, collection.config.primaryKey)) {
          console.error(`[Pulse] unknown error trying to create a store for collection ${collection.config.name}`);
        }
      }
      this.execute(async (db) => {
        const transaction = await db.transaction(collection.config.name, 'readwrite');
        transaction.oncomplete = resolve;
        transaction.onerror = reject;
        const store = transaction.objectStore(collection.config.name);
        const request = store.openCursor();
        request.onerror = reject;
        const returnable: any[] = [];
        request.onsuccess = function (event) {
          const cursor = event.target.result;
          if (cursor) {
            returnable.push(cursor.value);
            cursor.continue();
          } else {
            return resolve(returnable);
          }
        }
      })
    })
  }

  public async getOne(collection: Collection, key: string | number) {
    return new Promise(async (resolve, reject) => {
      if (!this.storeExists(collection.config.name)) {
        if (!await this.createStore(collection.config.name, collection.config.primaryKey)) {
          console.error(`[Pulse] unknown error trying to create a store for collection ${collection.config.name}`);
        }
      }
      this.execute(async (db) => {
        const transaction = await db.transaction(collection.config.name, '');
        transaction.oncomplete = resolve;
        transaction.onerror = reject;
        const store = transaction.objectStore(collection.config.name);
        const request = store.get(key);
        request.onerror = reject;
        request.onsuccess = function () {
          return resolve(request.result.name);
        }
      })
    })
  }

  public async removeOne(collection: Collection, key: string | number) {
    return new Promise(async (resolve, reject) => {
      if (!this.storeExists(collection.config.name)) {
        if (!await this.createStore(collection.config.name, collection.config.primaryKey)) {
          console.error(`[Pulse] unknown error trying to create a store for collection ${collection.config.name}`);
        }
      }
      this.execute(async (db) => {
        const transaction = await db.transaction(collection, 'readwrite');
        transaction.oncomplete = resolve;
        transaction.onerror = reject;
        const request = transaction.objectStore(collection.config.name).delete(key);
        request.onerror = reject;
        request.onsuccess = resolve;
      })
    });
  }


  public async updateOne(collection: Collection, object: any) {
    return new Promise(async (resolve, reject) => {
      if (!this.storeExists(collection.config.name)) {
        if (!await this.createStore(collection.config.name, collection.config.primaryKey)) {
          console.error(`[Pulse] unknown error trying to create a store for collection ${collection.config.name}`);
        }
      }
      this.execute(async (db) => {
        const transaction = await db.transaction(collection, 'readwrite');
        transaction.oncomplete = resolve;
        transaction.onerror = reject;
        const store = transaction.objectStore(collection.config.name);
        const request = store.get(object[collection.config.primaryKey]);
        request.onerror = reject;
        request.onsuccess = function (event) {
          let data = event.target.result;
          data = object;
          const update = store.put(data);
          update.onerror = reject;
          update.onsuccess = resolve;
        }
      })
    })
  }

  public async storeOne(collection: Collection, object: any) {
    try {
      await new Promise(async (resolve, reject) => {
        if (!this.storeExists(collection.config.name)) {
          if (!await this.createStore(collection.config.name, collection.config.primaryKey)) {
            console.error(`[Pulse] unknown error trying to create a store for collection ${collection.config.name}`);
          }
        }
        this.execute(async (db) => {
          const transaction = await db.transaction(collection.config.name, 'readwrite');
          transaction.oncomplete = resolve;
          transaction.onerror = reject;
          transaction.objectStore(collection.config.name).add(object);
        })
      });
      return true;
    } catch (error) {
      console.log(`[Pulse] Unknown error trying to persist collection data`);
      return false;
    }
  }

  public async storeAll(collection: Collection) {
    if (!collection.config.name) return;
    try {
      await new Promise(async (resolve, reject) => {
        if (!this.storeExists(collection.config.name)) {
          if (!await this.createStore(collection.config.name, collection.config.primaryKey)) {
            console.error(`[Pulse] unknown error trying to create a store for collection ${collection.config.name}`);
          }
        }
        await this.execute(async (db) => {
          const transaction = await db.transaction(collection.config.name, 'readwrite');
          transaction.oncomplete = resolve;
          transaction.onerror = reject;
          const store = transaction.objectStore(collection.config.name);
          const keys = Object.keys(collection.data);
          for (const key of keys) {
            const value = collection.data[key].value;
            const _req = store.add(value);
          }
        });
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // private async getTransaction (collection: Collection, action: 'readwrite' | '') {
  //   if (!collection.config.name) {
  //     console.error(`[Pulse] no collection name found, cannot persist data !`);
  //   }
  //   if (!this.storeExists(collection.config.name)) {
  //     if (!await this.createStore(collection.config.name, collection.config.primaryKey)) {
  //       console.error(`[Pulse] unknown error trying to create a store for collection ${collection.config.name}`);
  //     }
  //   }
  //   const transaction = this.execute((db) => {
  //     db.transaction([`${collection.config.name}`], 'readwrite')
  //   });
  //   return transaction;
  // }

  private async createStore(name: string, index: string | number): Promise<boolean> {
    try {
      if (this.storeExists(name)) return true;
      await new Promise((resolve, reject) => {
        this.execute(async (db) => {
          if (this.storeExists(name)) return resolve();
          const store = db.createObjectStore(name, { keyPath: index });
          store.transaction.oncomplete = resolve;
          store.transaction.onerror = reject;
        }, true).then(resolve).catch(reject);
      });
      this.stores.push(name);
      return true;
    } catch (error) {
      return false;
    }
  }

  private storeExists(name: string) {
    return this.stores.includes(name);
  }

  private handleStores (stores: any) {
    Object.keys(stores).forEach((key) => {
      const value = stores[key];
      if (!this.storeExists(value) && key !== "length") this.stores.push(value);
    });
  }

  private async execute(func: any, upgrade = false) {
    try {
      if (!window.indexedDB) throw new Error();
      await new Promise(async (resolve, reject) => {
        const key = "PULSE_IDB_VERSION_KEY_UNIQUE";
        let v = Number(localStorage.getItem(key));
        if (!v) v = 1;
        if (upgrade) v = v+1;
        localStorage.setItem(key, v.toString());
        const request = this.indexedClient.open(this.storageConfig.prefix, v);
        request.onerror = reject;
        request.onupgradeneeded = async (event: any) => {
          const db = event.target.result;
          this.handleStores(db.objectStoreNames);
          await func(db);
          return resolve();
        }
        request.onsuccess = async (event: any) => {
          const db = event.target.result;
          this.handleStores(db.objectStoreNames);
          await func(db);
          return resolve();
        };
      });
      return true;
    } catch (e) {
      this.storageReady = false;
      return false;
    }
  }
}