import Dep from './dep';
import Pulse from './pulse';
import { copy, shallowmerge } from './utils';
import { deepmerge } from './helpers/deepmerge';

export class State<ValueType = any> {
  public _masterValue: ValueType = null;
  public set value(val: ValueType) {
    this._masterValue = val;
  }
  public get value(): ValueType {
    if (this.instance().runtime.trackState) this.instance().runtime.foundState.add(this);
    return this._masterValue;
  }
  public output?: any;
  public watchers: { [key: string]: any } = {};
  public previousState: ValueType = null;
  public dep: Dep = null;
  public nextState: ValueType = null;
  public isSet: boolean = false; // has been changed from inital value
  public persistState: boolean = false;
  public name?: string;
  public valueType?: string;
  // sideEffects can be set by extended classes, such as Groups to build their output.
  public sideEffects?: Function;

  public set bind(value: ValueType) {
    this.set(value);
  }
  public get bind(): ValueType {
    return this._masterValue;
  }
  public get exists(): boolean {
    return !!this.value; // is value truthey or falsey
  }

  constructor(public instance: () => Pulse, public initalState, deps: Array<Dep> = []) {
    this.dep = new Dep(deps);
    this.privateWrite(initalState);
    this.nextState = copy(initalState);
  }

  /**
   * Directly set state to a new value, if nothing is passed in State.nextState will be used as the next value
   * @param newState - The new value for this state
   */
  public set(
    newState?: ValueType | SetFunc<ValueType>,
    options: { background?: boolean } = {}
  ): this {
    // if newState not provided, just ingest update with existing value
    if (newState === undefined) {
      this.instance().runtime.ingest(this, undefined);
      return this;
    }
    // if newState is a function, run that function and supply existing value as first param
    if (typeof newState === 'function')
      newState = (newState as SetFunc<ValueType>)(this._masterValue);

    // check type if set and correct otherwise exit
    if (this.valueType && !this.isCorrectType(newState)) {
      console.warn(
        `Pulse: Error setting state: Incorrect type (${typeof newState}) was provided. Type fixed to ${
          this.valueType
        }`
      );
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
    return this._masterValue;
  }

  public patch(targetWithChange, config: { deep?: boolean } = {}): this {
    if (!(typeof this._masterValue === 'object')) return this;

    this.nextState =
      config.deep === false
        ? shallowmerge(this.nextState, targetWithChange)
        : deepmerge(this.nextState, targetWithChange);

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
    if (!key && this.name) {
      key = this.name;
    } else if (!key) {
      console.warn('Pulse Persist Error: No key provided');
    } else {
      this.name = key;
    }
    const storage = this.instance().storage;
    storage.persistedState.add(this);
    if (storage.isPromise) {
      storage.get(this.name).then((val: ValueType) => {
        if (val === null) storage.set(this.name, this.value);
        this.instance().runtime.ingest(this, val);
      });
    } else {
      let value = storage.get(this.name);
      if (value === null) storage.set(this.name, this.value);
      else this.instance().runtime.ingest(this, value);
    }
    return this;
  }

  // this creates a watcher that will fire a callback then destroy itself after invoking
  public onNext(callback: (value: ValueType) => void) {
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
      this.valueType = type.name.toLowerCase();
    }
    return this;
  }

  public watch(key: number | string, callback: (value: any) => void): this {
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
    if (typeof this._masterValue === 'boolean') {
      // @ts-ignore
      this.set(!this._masterValue);
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

  public relate(state: State | Array<State>) {
    if (!Array.isArray(state)) state = [state];
    // add this to foriegn dep
    state.forEach(state => state && state.dep.depend(this));
    // refrence foriegn dep locally for cleanup
    this.dep.dynamic.add(this);
  }

  // INTERNAL
  public privateWrite(value: any) {
    this._masterValue = copy(value);
    this.nextState = copy(value);

    if (this.persistState) this.instance().storage.set(this.name, value);
  }

  private isCorrectType(value): boolean {
    let type: string = typeof value;
    if (type === 'object' && Array.isArray(value)) type = 'array';
    return type === this.valueType;
  }

  public destroy(): void {
    this.dep.deps.clear();
    this.dep.subs.clear();
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
