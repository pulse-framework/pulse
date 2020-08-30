import Pulse, { Collection } from '.';
import State from './state';
export declare function cleanState<T>(state: State<T>): object;
export declare function resetState(items: Iterable<State | Collection | any>): State<any>;
/**
 * A helper function to extract all instances of a target instance from an object
 * If this function fails, it will do so silently, so it can be safely used without much knowledge of `inObj`.
 * @param findClass Class to extract instances of
 * @param inObj Object to find all instances of `findType` within
 */
export declare function extractAll<I extends new (...args: any) => any, O>(findClass: I, inObj: O): Set<InstanceType<I>>;
export declare function getPulseInstance(state: State): Pulse;
export declare function normalizeDeps(deps: Array<State> | State): State<any>[];
export declare const copy: (val: any) => any;
export declare function normalizeGroups(groupsAsArray?: any): object;
export declare function shallowmerge(source: any, changes: any): any;
export declare function defineConfig<C>(config: C, defaults: any): C;
export declare function genId(): string;
export declare function isFunction(func: () => any): boolean;
export declare function isAsync(func: () => any): boolean;
export declare function isWatchableObject(value: any): boolean;
export declare function normalizeMap(map: any): {
    key: any;
    val: any;
}[];
export declare function cleanse(object: any): any;
export declare function validateNumber(mutable: any, amount: any): boolean;
