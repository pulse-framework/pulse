import Dep from './dep';
import Pulse from './root';
import { copy } from './utils';

export default class State {
  public value: any = null;
  public previousState: any = null;
  public dep: Dep = null;
  public nextState: any = null;
  public isSet: boolean = false;
  public storageKey: string;
  // Mutation method returns new value, can be overwritten by extended classes.
  public mutation: () => any;

  public set bind(value: any) {
    this.set(value);
  }
  public get bind(): any {
    return this.value;
  }
  constructor(
    private instance: Pulse,
    public initalState: any,
    deps: Array<Dep> = []
  ) {
    this.dep = new Dep(deps);
    this.value = initalState;
    this.nextState = copy(initalState);
  }
  public set(newState: any): this {
    // ingest update using most basic mutation method
    this.instance.runtime.ingest(this, newState);

    this.isSet = true;

    return this;
  }
  public patch(targetWithChange): this {
    return this;
  }
  public persist(key): this {
    if (!key) console.error('Pulse persist error: Missing storage key');
    this.storageKey = key;
    let value = this.instance.storage.get(this.storageKey);
    if (value) this.instance.runtime.ingest(this, value);
    else this.instance.storage.set(this.storageKey, this.value);
    return this;
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
    this.instance.storage.remove(this.storageKey);
    return this;
  }

  public privateWrite(value: any): void {
    this.value = value;
    if (this.storageKey) this.instance.storage.set(this.storageKey, value);
  }
}

export const StateGroup = (
  instance: Pulse,
  stateGroup: Object
): { [key: string]: State } => {
  let group: any = {};
  for (let name in stateGroup) {
    group[name] = new State(instance, stateGroup[name]);
    group[name].storageKey = name;
  }
  return group;
};
