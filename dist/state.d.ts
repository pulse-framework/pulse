import Dep from './dep';
import Pulse from './pulse';
export declare class State<ValueType = any> {
    instance: () => Pulse;
    initalState: any;
    _value: ValueType;
    set value(val: ValueType);
    get value(): ValueType;
    dep: Dep;
    output?: any;
    watchers?: {
        [key: string]: any;
    };
    previousState: ValueType;
    nextState: ValueType;
    isSet: boolean;
    persistState: boolean;
    name?: string;
    typeOfVal?: string;
    sideEffects?: Function;
    set bind(value: ValueType);
    get bind(): ValueType;
    get exists(): boolean;
    constructor(instance: () => Pulse, initalState: any, deps?: Array<Dep>);
    /**
     * Directly set state to a new value, if nothing is passed in State.nextState will be used as the next value
     * @param newState - The new value for this state
     */
    set(newState?: ValueType | SetFunc<ValueType>, options?: {
        background?: boolean;
    }): this;
    getPublicValue(): ValueType;
    patch(targetWithChange: any, config?: {
        deep?: boolean;
    }): this;
    interval(setFunc: (currentValue: any) => any, ms?: number): this;
    persist(key?: string): this;
    onNext(callback: (value: ValueType) => void): void;
    key(key: string): this;
    type(type: any): this;
    watch(key: number | string, callback: (value: any) => void): this;
    undo(): void;
    removeWatcher(key: number | string): this;
    toggle(): this;
    reset(): this;
    copy(): any;
    is(x: any): boolean;
    isNot(x: any): boolean;
    privateWrite(value: any): void;
    private isCorrectType;
    destroy(): void;
    protected getPersistableValue(): any;
}
export declare type StateGroupDefault = {
    [key: string]: State | any;
};
export declare const StateGroup: (instance: () => Pulse, stateGroup: Object) => any;
export default State;
export declare function reset(instance: State): void;
export declare type SetFunc<ValueType> = (state: ValueType) => ValueType;
export declare function persistValue(key: string): void;
