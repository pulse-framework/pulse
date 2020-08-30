import Pulse, { State } from './';
export interface StorageConfig {
    type: 'custom' | 'localStorage';
    prefix: string;
    async?: boolean;
    get?: any;
    set?: any;
    remove?: any;
}
export default class Storage {
    private instance;
    storageConfig: StorageConfig;
    private storageReady;
    persistedState: Set<State>;
    constructor(instance: () => Pulse, storageConfig: StorageConfig);
    get(key: string): any;
    set(key: string, value: any): void;
    remove(key: string): void;
    private getKey;
    private localStorageAvailable;
}
