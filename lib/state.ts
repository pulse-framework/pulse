import Dep from './dep';
import Pulse from './';
import { copy } from './utils';

export class State {
  public masterValue: any = null;
  public set value(val: any) {
    this.masterValue = val;
  }
  public get value(): any {
    if (this.instance().runtime.trackState) this.instance().runtime.foundState.add(this);
    return this.masterValue;
  }
  // public value: any = null;
  public previousState: any = null;
  public dep: Dep = null;
  public nextState: any = null;
  public isSet: boolean = false; // has been changed from inital value
  public exists: boolean = false; // is value truthey or falsey
  public storageKey: string;
  public valueType: string;
  // Mutation method returns new value, can be overwritten by extended classes.
  public mutation: () => any;

  public set bind(value: any) {
    this.set(value);
  }
  public get bind(): any {
    return this.masterValue;
  }
  private watchers: { [key: string]: any } = {};
  constructor(public instance: () => Pulse, public initalState: any, deps: Array<Dep> = []) {
    this.dep = new Dep(deps);
    this.privateWrite(initalState);
    this.nextState = copy(initalState);
  }
  /**
   * Directly set state to a new value, if nothing is passed in State.nextState will be used as the next value
   * @param {Object} newState - The new value for this state
   */
  public set(newState?: any): this {
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
    const supportedConstructors = ['String', 'Boolean', 'Array', 'Object', 'Number'];
    if (typeof type === 'function' && supportedConstructors.includes(type.name)) {
      this.valueType = type.name.toLowerCase();
    }
    return this;
  }
  public watch(key: number | string, callback: Function): this {
    if (typeof key !== 'string' || typeof key !== 'number' || typeof callback !== 'function') {
      console.error('Pulse watch, missing key or function');
    }

    this.watchers[key] = callback;
    return this;
  }
  public removeWatcher(key: number | string): this {
    delete this.watchers[key];
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

  // returns a fresh copy of the current value
  public copy(): any {
    return copy(this.masterValue);
  }

  public is(x: any) {
    return this.value === x;
  }

  public isNot(x: any) {
    return this.value !== x;
  }

  public privateWrite(value: any): void {
    this.exists = !!value;
    this.masterValue = value;

    for (let watcher in this.watchers) {
      if (typeof this.watchers[watcher] === 'function') this.watchers[watcher](value);
    }

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
