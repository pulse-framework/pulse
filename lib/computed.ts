import State, { reset } from './state';
import Pulse from './pulse';
import Dep from './dep';

export class Computed<ComputedValueType = any> extends State<ComputedValueType> {
  // private cleanup: Set<State> = new Set();
  constructor(public instance: () => Pulse, public func: Function, public deps?: Array<State>) {
    super(instance, instance().config.computedDefault || null);

    if (deps) deps.forEach(state => state.dep.depend(this));
    this.computeValue = () => {
      if (deps) return func();
      instance().runtime.trackState = true;
      const computed = func();
      let dependents = instance().runtime.getFoundState();
      dependents.forEach(state => state.dep.depend(this));
      return computed;
    };
    const output = this.computeValue();

    this.set(output);
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
}

export default Computed;
