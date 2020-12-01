import { Pulse, State, SetFunc } from './internal';

export class Computed<ComputedValueType = any> extends State<ComputedValueType> {
  // private cleanup: Set<State> = new Set();
  public set value(val: ComputedValueType) {
    console.error('Error: Can not mutate Computed value, please use recompute()');
  }

  public get value(): ComputedValueType {
    return this._value;
  }

  public set bind(val: ComputedValueType) {
    console.error('Error: Can not bind Computed value');
  }

  constructor(public instance: () => Pulse, public func: () => ComputedValueType, public deps?: Array<State>) {
    super(instance, instance().config.computedDefault || null);

    if (typeof func !== 'function') throw new TypeError('A compute function must be provided to Computed.');

    if (deps) deps.forEach(state => state.dep.depend(this));

    // if Core will not be used, or Pulse in a post-core state (ready), compute immediately
    if (instance().config.noCore === true || instance().ready) this.recompute();
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

  public reset(): this {
    super.reset();
    this.recompute();
    return this;
  }

  public patch() {
    console.error('Error, can not use patch method on Computed since the value is dynamic.');
    return this;
  }

  public persist(key?: string): this {
    console.error('Computed state can not be persisted, remove call to .persist()', key);
    return this;
  }
}

export default Computed;
