import { Pulse, Dep } from './internal';
import { copy, shallowmerge } from './utils';
import { deepmerge } from './helpers/deepmerge';

export class State<ValueType = any> {
  // a unique key for this State
  public name?: string;
  // internal storage for the current value
  public _value: ValueType = null;
  // getter for the current value
  public get value(): ValueType {
    if (this.instance().runtime.trackState) this.instance().runtime.foundState.add(this);
    return this._value;
  }
  // dependency manager class
  public dep: Dep;

  // watchers
  public watchers?: { [key: string]: any };
  // the previous value of this State
  public previousState: ValueType = null;
  // a copy of the current value that will be used if no param is passed on State.set()
  public nextState: ValueType = null;
  // if the value has been changed from initial value
  public isSet: boolean = false;
  // should Pulse attempt to persist this State value
  public persistState: boolean;
  // if this State locked to a particular type
  public typeOfVal?: string;
  // for extended classes to perform actions upon state change
  public sideEffects?: Function;
  // for extended classes to store a derived value, such as Group
  public output?: any;
  // getter and setter for the State value, best for I/O binding
  public set bind(value: ValueType) {
    this.set(value);
  }
  public get bind(): ValueType {
    return this._value;
  }
  // is value truthey or falsey
  public get exists(): boolean {
    return !!this.value;
  }

  constructor(public instance: () => Pulse, public initialState, deps: Array<Dep> = []) {
    // initialize the dependency manager
    this.dep = new Dep(deps);
    // write the initial value to this State
    this.privateWrite(initialState);
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
    this.instance().storage.handleStatePersist(this, key);
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
    // if persist was attempted before, but no key was provided retry persist function
    if (!this.name && this.persistState) this.persist(key);
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

  public getPersistableValue(): any {
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
  instance.privateWrite(instance.initialState);
  if (instance.persistState) instance.instance().storage.remove(instance.name);
}

export type SetFunc<ValueType> = (state: ValueType) => ValueType;
