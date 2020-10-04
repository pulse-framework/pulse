import { Collection, State, Computed, Event } from './internal';

export type StateObj = { [key: string]: State | Computed };
export type FuncObj = { [key: string]: (...args: any) => any };
export type EventObj = { [key: string]: Event };
export type AnyObj = { [key: string]: any };

//
export interface ControllerConfig {
  name?: string;
  root: { [key: string]: any };
  state: StateObj;
  collection: Collection<any>;
  collections: { [key: string]: Collection<any> };
  events: EventObj;
  actions: FuncObj;
  helpers: FuncObj;
  routes: FuncObj;
}

export class Controller<O extends Partial<ControllerConfig> = Partial<ControllerConfig>> {
  public name?: string;
  public config: O;

  // expose State tree
  public state: this['config']['state'];
  // primary collection
  public collection: this['config']['collection'];
  public collections: this['config']['collections'];
  // alias groups and selectors for primary collection
  public groups: this['config']['collection']['groups'];
  public selectors: this['config']['collection']['selectors'];
  // events object
  public events: this['config']['events'];

  // actions, helpers and routes simply containers for functions
  public actions: this['config']['actions'];
  public helpers: this['config']['helpers'];
  public routes: this['config']['routes'];

  // convert config to partial type to allow for certain config properties to be excluded
  constructor(config: Partial<O>) {
    this.config = config as Required<O>;

    // assign every property in config to root, types inferred above at declaration (state, collection etc..)
    for (const sectionName in this.config) this[sectionName as string] = this.config[sectionName];

    // if primary collection is actually an instance of Collection alias groups and selectors
    if (this.config.collection instanceof Collection) {
      this.groups = this.config.collection.groups;
      this.selectors = this.config.collection.selectors;
    }

    // assign State keys by property name
    for (const name in this.state)
      if (name && this.state[name] instanceof State) {
        const state: any = this.state[name];
        if (!state.name) state.key(name);
        // assign Event keys by property name
      } else if (name && this.state[name] instanceof Event) {
        const event: any = this.state[name];
        if (!event.config.name) event.config.name = name;
      }
  }
  public root<R extends AnyObj = AnyObj>(bindObj: R): this & R {
    for (const propertyName in bindObj) this[propertyName as string] = bindObj[propertyName];
    return this as this & R;
  }
  public reset(): void {
    for (const name in this.state) this.state[name] instanceof State && this.state[name].reset();
    for (const name in this.collections) this.collections[name] instanceof State && this.collections[name].reset();
    if (this.collection instanceof Collection) this.collection.reset();
  }
}
