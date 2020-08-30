import Pulse from '..';
import State from '../state';
export declare function PulseHOC(ReactComponent: any, deps?: Array<State> | {
    [key: string]: State;
} | State, pulseInstance?: Pulse): any;
declare type PulseHookArray<T> = {
    [K in keyof T]: T[K] extends State<infer U> ? U : never;
};
declare type PulseHookResult<T> = T extends State<infer U> ? U : never;
export declare function usePulse<X extends State<any>[]>(deps: X | [], pulseInstance?: Pulse): PulseHookArray<X>;
export declare function usePulse<X extends State<any>>(deps: X, pulseInstance?: Pulse): PulseHookResult<X>;
declare const _default: {
    name: string;
    bind(pulseInstance: Pulse): void;
    updateMethod(componentInstance: any, updatedData: Object): void;
    onReady(pulseInstance: any | Pulse): void;
};
export default _default;
