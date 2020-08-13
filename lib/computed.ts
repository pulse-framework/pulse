import State, { reset, SetFunc } from './state';
import Pulse from './pulse';
import Dep from './dep';

export class Computed<ComputedValueType = any> extends State<ComputedValueType> {
  // private cleanup: Set<State> = new Set();
  public set value(val: ComputedValueType) {
    console.error('Error: Can not mutate Computed value, please use recompute()');
  }

  public get value(): ComputedValueType {
    return super.value;
  }

  public set bind(val: ComputedValueType) {
    console.error('Error: Can not bind Computed value');
  }

  constructor(public instance: () => Pulse, public func: () => ComputedValueType, public deps?: Array<State>) {
    super(instance, instance().config.computedDefault || null);

    if (deps) deps.forEach(state => state.dep.depend(this));

    // if Core will not be used, compute immediately
    if(instance().config.noCore === true) this.recompute()
  }

  public computeValue(): ComputedValueType | SetFunc<ComputedValueType> {
    if (this.deps) return this.func();
    this.instance().runtime.trackState = true;
    const computed = this.func();
    let dependents = this.instance().runtime.getFoundState();
    dependents.forEach(state => state.dep.depend(this));
    return computed;
  }

  public recompute(): void {
    this.set(this.computeValue());
  }

  public reset() {
    reset(this);
    this.recompute();
    return this;
  }

  public patch() {
    throw 'Error, can not use patch method on Computed since the value is dynamic.';
    return this;
  }

  public persist(key?: string): this {
    console.error('Computed state can not be persisted, remove call to .persist()', key);
    return this;
  }
}

export default Computed;
