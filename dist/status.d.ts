import Pulse from './pulse';
import State from './state';
interface StatusObjectData {
    message: string | null;
    status: 'invalid' | 'success' | 'error' | null;
}
export default class StatusTracker {
    private instance;
    state: State<{
        [key: string]: StatusObjectData;
    }>;
    get all(): {
        [key: string]: StatusObjectData;
    };
    constructor(instance: () => Pulse);
    get(key: string): StatusObjectData;
    set(key: string): StatusObject;
    remove(key: string): void;
    clear(key?: string): void;
}
export declare class StatusObject {
    private state;
    private key;
    constructor(state: State<{
        [key: string]: StatusObjectData;
    }>, key: string);
    status(newStatus: 'invalid' | 'success' | 'error' | 'none'): StatusObject;
    message(messageText: string): StatusObject;
}
export {};
