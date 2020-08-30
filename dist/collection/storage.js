"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
class CollectionStorage {
    constructor(storageConfig) {
        this.collections = [];
        this.storageReady = false;
        this.indexedClient = window.indexedDB;
        this.stores = [];
        this.storageConfig = utils_1.defineConfig(storageConfig, {
            prefix: 'pulseDB',
            type: 'indexedDB'
        });
        if (window && typeof window !== undefined)
            this.execute(() => {
                this.storageReady = true;
            });
    }
    getAll(collection) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (!this.storeExists(collection.config.name)) {
                    if (!(yield this.createStore(collection.config.name, collection.config.primaryKey))) {
                        console.error(`[Pulse] unknown error trying to create a store for collection ${collection.config.name}`);
                    }
                }
                this.execute((db) => __awaiter(this, void 0, void 0, function* () {
                    const transaction = yield db.transaction(collection.config.name, 'readwrite');
                    transaction.oncomplete = resolve;
                    transaction.onerror = reject;
                    const store = transaction.objectStore(collection.config.name);
                    const request = store.openCursor();
                    request.onerror = reject;
                    const returnable = [];
                    request.onsuccess = function (event) {
                        const cursor = event.target.result;
                        if (cursor) {
                            returnable.push(cursor.value);
                            cursor.continue();
                        }
                        else {
                            return resolve(returnable);
                        }
                    };
                }));
            }));
        });
    }
    getOne(collection, key) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (!this.storeExists(collection.config.name)) {
                    if (!(yield this.createStore(collection.config.name, collection.config.primaryKey))) {
                        console.error(`[Pulse] unknown error trying to create a store for collection ${collection.config.name}`);
                    }
                }
                this.execute((db) => __awaiter(this, void 0, void 0, function* () {
                    const transaction = yield db.transaction(collection.config.name, '');
                    transaction.oncomplete = resolve;
                    transaction.onerror = reject;
                    const store = transaction.objectStore(collection.config.name);
                    const request = store.get(key);
                    request.onerror = reject;
                    request.onsuccess = function () {
                        return resolve(request.result.name);
                    };
                }));
            }));
        });
    }
    removeOne(collection, key) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (!this.storeExists(collection.config.name)) {
                    if (!(yield this.createStore(collection.config.name, collection.config.primaryKey))) {
                        console.error(`[Pulse] unknown error trying to create a store for collection ${collection.config.name}`);
                    }
                }
                this.execute((db) => __awaiter(this, void 0, void 0, function* () {
                    const transaction = yield db.transaction(collection, 'readwrite');
                    transaction.oncomplete = resolve;
                    transaction.onerror = reject;
                    const request = transaction.objectStore(collection.config.name).delete(key);
                    request.onerror = reject;
                    request.onsuccess = resolve;
                }));
            }));
        });
    }
    updateOne(collection, object) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (!this.storeExists(collection.config.name)) {
                    if (!(yield this.createStore(collection.config.name, collection.config.primaryKey))) {
                        console.error(`[Pulse] unknown error trying to create a store for collection ${collection.config.name}`);
                    }
                }
                this.execute((db) => __awaiter(this, void 0, void 0, function* () {
                    const transaction = yield db.transaction(collection, 'readwrite');
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
                    };
                }));
            }));
        });
    }
    storeOne(collection, object) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    if (!this.storeExists(collection.config.name)) {
                        if (!(yield this.createStore(collection.config.name, collection.config.primaryKey))) {
                            console.error(`[Pulse] unknown error trying to create a store for collection ${collection.config.name}`);
                        }
                    }
                    this.execute((db) => __awaiter(this, void 0, void 0, function* () {
                        const transaction = yield db.transaction(collection.config.name, 'readwrite');
                        transaction.oncomplete = resolve;
                        transaction.onerror = reject;
                        transaction.objectStore(collection.config.name).add(object);
                    }));
                }));
                return true;
            }
            catch (error) {
                console.log(`[Pulse] Unknown error trying to persist collection data`);
                return false;
            }
        });
    }
    storeAll(collection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!collection.config.name)
                return;
            try {
                yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    if (!this.storeExists(collection.config.name)) {
                        if (!(yield this.createStore(collection.config.name, collection.config.primaryKey))) {
                            console.error(`[Pulse] unknown error trying to create a store for collection ${collection.config.name}`);
                        }
                    }
                    yield this.execute((db) => __awaiter(this, void 0, void 0, function* () {
                        const transaction = yield db.transaction(collection.config.name, 'readwrite');
                        transaction.oncomplete = resolve;
                        transaction.onerror = reject;
                        const store = transaction.objectStore(collection.config.name);
                        const keys = Object.keys(collection.data);
                        for (const key of keys) {
                            const value = collection.data[key].value;
                            const _req = store.add(value);
                        }
                    }));
                }));
                return true;
            }
            catch (error) {
                return false;
            }
        });
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
    createStore(name, index) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.storeExists(name))
                    return true;
                yield new Promise((resolve, reject) => {
                    this.execute((db) => __awaiter(this, void 0, void 0, function* () {
                        if (this.storeExists(name))
                            return resolve();
                        const store = db.createObjectStore(name, { keyPath: index });
                        store.transaction.oncomplete = resolve;
                        store.transaction.onerror = reject;
                    }), true).then(resolve).catch(reject);
                });
                this.stores.push(name);
                return true;
            }
            catch (error) {
                return false;
            }
        });
    }
    storeExists(name) {
        return this.stores.includes(name);
    }
    handleStores(stores) {
        Object.keys(stores).forEach((key) => {
            const value = stores[key];
            if (!this.storeExists(value) && key !== "length")
                this.stores.push(value);
        });
    }
    execute(func, upgrade = false) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!window.indexedDB)
                    throw new Error();
                yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    const key = "PULSE_IDB_VERSION_KEY_UNIQUE";
                    let v = Number(localStorage.getItem(key));
                    if (!v)
                        v = 1;
                    if (upgrade)
                        v = v + 1;
                    localStorage.setItem(key, v.toString());
                    const request = this.indexedClient.open(this.storageConfig.prefix, v);
                    request.onerror = reject;
                    request.onupgradeneeded = (event) => __awaiter(this, void 0, void 0, function* () {
                        const db = event.target.result;
                        this.handleStores(db.objectStoreNames);
                        yield func(db);
                        return resolve();
                    });
                    request.onsuccess = (event) => __awaiter(this, void 0, void 0, function* () {
                        const db = event.target.result;
                        this.handleStores(db.objectStoreNames);
                        yield func(db);
                        return resolve();
                    });
                }));
                return true;
            }
            catch (e) {
                this.storageReady = false;
                return false;
            }
        });
    }
}
exports.default = CollectionStorage;
