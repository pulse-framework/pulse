import Dep from './dep';
import Pulse from './';
import { copy } from './utils';

export class State {
  public masterValue: any = null;
  public set value(val: any) {
    this.masterValue = val;
  }
  public get value(): any {
    if (this.instance().runtime.trackState)
      this.instance().runtime.foundState.add(this);
    return this.masterValue;
  }
  // public value: any = null;
  public previousState: any = null;
  public dep: Dep = null;
  public nextState: any = null;
  public isSet: boolean = false;
  public exists: boolean = false;
  public storageKey: string;
  // Mutation method returns new value, can be overwritten by extended classes.
  public mutation: () => any;

  public set bind(value: any) {
    this.set(value);
  }
  public get bind(): any {
    return this.masterValue;
  }
  constructor(
    public instance: () => Pulse,
    public initalState: any,
    deps: Array<Dep> = []
  ) {
    this.dep = new Dep(deps);
    this.privateWrite(initalState);
    this.nextState = copy(initalState);
  }
  /**
   * Pulse.State.set() - Directly set state to a new value
   * @param {Object} newState - The new value for this state
   */
  public set(newState: any): this {
    // ingest update using most basic mutation method
    this.instance().runtime.ingest(this, newState);

    this.isSet = true;

    return this;
  }
  public patch(targetWithChange): this {
    return this;
  }
  public interval(setFunc: (currentValue: any) => any, ms?: number): this {
    setInterval(() => {
      this.set(setFunc(this.value));
    }, ms || 1000);
    return this;
  }
  public persist(key): this {
    if (!key) console.error('Pulse persist error: Missing storage key');
    this.storageKey = key;
    let value = this.instance().storage.get(this.storageKey);
    if (value) this.instance().runtime.ingest(this, value);
    else this.instance().storage.set(this.storageKey, this.value);
    return this;
  }
  public key(key: string): void {
    this.storageKey = key;
  }
  public type(type: any): this {
    return this;
  }
  public watch(func: Function): this {
    return this;
  }
  public toggle(): this {
    return this;
  }
  public reset(): this {
    // this should go through runtime, but eh
    this.isSet = false;
    this.previousState = null;
    this.privateWrite(this.initalState);
    this.instance().storage.remove(this.storageKey);
    return this;
  }

  public privateWrite(value: any): void {
    this.exists = !!value;
    this.masterValue = value;
    if (this.storageKey) this.instance().storage.set(this.storageKey, value);
  }
  public relate(state: State | Array<State>) {
    if (!Array.isArray(state)) state = [state];

    // add this to foriegn dep
    state.forEach(state => state && state.dep.deps.add(this));

    // refrence foriegn dep locally for cleanup
    this.dep.dynamic.add(this);
  }
}

export type StateGroupDefault = {
  [key: string]: State | any;
};
export const StateGroup = (instance: () => Pulse, stateGroup: Object): any => {
  let group: any = {};
  for (let name in stateGroup) {
    group[name] = new State(instance, stateGroup[name]);
    group[name].storageKey = name;
  }
  return group;
};
export default State;
