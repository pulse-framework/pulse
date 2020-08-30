import Collection from "./collection";
export interface CollectionStorageConfig {
    type: 'indexedDB';
    prefix: string;
    async?: boolean;
    get?: any;
    set?: any;
    remove?: any;
}
export default class CollectionStorage {
    storageConfig: CollectionStorageConfig;
    collections: Collection[];
    storageReady: Boolean;
    private indexedClient;
    private stores;
    constructor(storageConfig: CollectionStorageConfig);
    getAll(collection: Collection): Promise<any[]>;
    getOne(collection: Collection, key: string | number): Promise<unknown>;
    removeOne(collection: Collection, key: string | number): Promise<unknown>;
    updateOne(collection: Collection, object: any): Promise<unknown>;
    storeOne(collection: Collection, object: any): Promise<boolean>;
    storeAll(collection: Collection): Promise<boolean>;
    private createStore;
    private storeExists;
    private handleStores;
    private execute;
}
