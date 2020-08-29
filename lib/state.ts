import Dep from './dep';
import Pulse from './pulse';
import { copy, shallowmerge } from './utils';
import { deepmerge } from './helpers/deepmerge';

export class State<ValueType = any> {
  public _value: ValueType = null;
  public set value(val: ValueType) {
    this._value = val;
  }
  public get value(): ValueType {
    if (this.instance().runtime.trackState) this.instance().runtime.foundState.add(this);
    return this._value;
  }
  public dep: Dep = null;
  public output?: any;
  public watchers?: { [key: string]: any };
  public previousState: ValueType = null;
  public nextState: ValueType = null;
  public isSet: boolean = false; // has been changed from inital value
  public persistState: boolean;
  public name?: string;
  public typeOfVal?: string;
  // sideEffects can be set by extended classes, such as Groups to build their output.
  public sideEffects?: Function;

  public set bind(value: ValueType) {
    this.set(value);
  }
  public get bind(): ValueType {
    return this._value;
  }
  public get exists(): boolean {
    return !!this.value; // is value truthey or falsey
  }

  constructor(public instance: () => Pulse, public initalState, deps: Array<Dep> = []) {
    this.dep = new Dep(deps);
    this.privateWrite(initalState);
  }

  /**
   * Directly set state to a new value, if nothing is passed in State.nextState will be used as the next value
   * @param newState - The new value for this state
   */
  public set(newState?: ValueType | SetFunc<ValueType>, options: { background?: boolean } = {}): this {
    // if newState not provided, just ingest update with existing value
    if (newState === undefined) {
      this.instance().runtime.ingest(this, undefined);
      return this;
    }
    // if newState is a function, run that function and supply existing value as first param
    if (typeof newState === 'function') newState = (newState as SetFunc<ValueType>)(this._value);

    // check type if set and correct otherwise exit
    if (this.typeOfVal && !this.isCorrectType(newState)) {
      console.warn(`Pulse: Error setting state: Incorrect type (${typeof newState}) was provided. Type fixed to ${this.typeOfVal}`);
      return this;
    }

    // ingest update using most basic mutation method
    if (options.background) {
      this.privateWrite(newState);
      if (this.sideEffects) this.sideEffects();
    } else {
      this.instance().runtime.ingest(this, newState);
    }

    this.isSet = true;
    return this;
  }

  public getPublicValue(): ValueType {
    if (this.output !== undefined) return this.output;
    return this._value;
  }

  public patch(targetWithChange, config: { deep?: boolean } = {}): this {
    if (!(typeof this._value === 'object')) return this;

    this.nextState = config.deep === false ? shallowmerge(this.nextState, targetWithChange) : deepmerge(this.nextState, targetWithChange);

    this.set();
    return this;
  }

  public interval(setFunc: (currentValue: any) => any, ms?: number): this {
    setInterval(() => {
      this.set(setFunc(this.value));
    }, ms || 1000);
    return this;
  }

  public persist(key?: string): this {
    this.persistState = true;
    persistValue.bind(this)(key);
    return this;
  }

  // this creates a watcher that will fire a callback then destroy itself after invoking
  public onNext(callback: (value: ValueType) => void) {
    if (!this.watchers) this.watchers = {};
    this.watchers['_on_next_'] = () => {
      callback(this.getPublicValue());
      delete this.watchers['_on_next_'];
    };
  }

  public key(key: string): this {
    this.name = key;
    return this;
  }

  public type(type: any): this {
    const supportedConstructors = ['String', 'Boolean', 'Array', 'Object', 'Number'];
    if (typeof type === 'function' && supportedConstructors.includes(type.name)) {
      this.typeOfVal = type.name.toLowerCase();
    }
    return this;
  }

  public watch(key: number | string, callback: (value: any) => void): this {
    if (!this.watchers) this.watchers = {};

    if (typeof key !== 'string' || typeof key !== 'number' || typeof callback !== 'function') {
      // console.error('Pulse watch, missing key or function');
    }
    this.watchers[key] = callback;
    return this;
  }

  public undo() {
    this.set(this.previousState);
  }

  public removeWatcher(key: number | string): this {
    delete this.watchers[key];
    return this;
  }

  public toggle(): this {
    if (typeof this._value === 'boolean') {
      // @ts-ignore
      this.set(!this._value);
    }
    return this;
  }

  public reset(): this {
    reset(this);
    return this;
  }

  // returns a fresh copy of the current value
  public copy(): any {
    return copy(this.value);
  }

  public is(x: any) {
    return this.value === x;
  }

  public isNot(x: any) {
    return this.value !== x;
  }

  // public relate(state: State | Array<State>) {
  //   if (!Array.isArray(state)) state = [state];
  //   // add this to foriegn dep
  //   state.forEach(state => state && state.dep.depend(this));
  //   // refrence foriegn dep locally for cleanup
  //   this.dep.dynamic.add(this);
  // }

  // INTERNAL
  public privateWrite(value: any) {
    this._value = copy(value);
    this.nextState = copy(value);

    if (this.persistState) this.instance().storage.set(this.name, this.getPersistableValue());
  }

  private isCorrectType(value): boolean {
    let type: string = typeof value;
    if (type === 'object' && Array.isArray(value)) type = 'array';
    return type === this.typeOfVal;
  }

  public destroy(): void {
    this.dep.deps.clear();
    this.dep.subs.clear();
  }

  protected getPersistableValue(): any {
    return this.value;
  }
}

export type StateGroupDefault = {
  [key: string]: State | any;
};
export const StateGroup = (instance: () => Pulse, stateGroup: Object): any => {
  let group: any = {};
  for (let name in stateGroup) {
    group[name] = new State(instance, stateGroup[name]);
    group[name].name = name;
  }
  return group;
};
export default State;

export function reset(instance: State) {
  instance.isSet = false;
  instance.previousState = null;
  instance.privateWrite(instance.initalState);
  if (instance.persistState) instance.instance().storage.remove(instance.name);
}

export type SetFunc<ValueType> = (state: ValueType) => ValueType;

// this function exists outside the state class so it can be imported into other classes such as selector for custom persist logic
export function persistValue(key: string) {
  // validation
  if (!key && this.name) {
    key = this.name;
  } else if (!key) {
    console.warn('Pulse Persist Error: No key provided');
  } else {
    this.name = key;
  }
  const storage = this.instance().storage;
  // add ref to this instance inside storage
  storage.persistedState.add(this);

  // handle the value
  const handle = (storageVal: any) => {
    if (storageVal === null) storage.set(this.name, this.getPersistableValue());
    else if (typeof this.select === 'function') this.select(storageVal);
    else this.instance().runtime.ingest(this, storageVal);
  };
  // Check if promise, then handle value
  if (storage.isPromise) storage.get(this.name).then(handle);
  else handle(storage.get(this.name));
}
