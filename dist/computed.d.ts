import State, { SetFunc } from './state';
import Pulse from './pulse';
export declare class Computed<ComputedValueType = any> extends State<ComputedValueType> {
    instance: () => Pulse;
    func: () => ComputedValueType;
    deps?: Array<State>;
    set value(val: ComputedValueType);
    get value(): ComputedValueType;
    set bind(val: ComputedValueType);
    constructor(instance: () => Pulse, func: () => ComputedValueType, deps?: Array<State>);
    computeValue(): ComputedValueType | SetFunc<ComputedValueType>;
    recompute(): void;
    reset(): this;
    patch(): this;
    persist(key?: string): this;
}
export default Computed;
