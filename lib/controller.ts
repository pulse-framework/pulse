import { Collection, State, Computed, Event } from './internal';

export type StateObj = { [key: string]: State | Computed };
export type FuncObj = { [key: string]: () => any };

export interface ControllerConfig<S, C, A, H, R> {
  name?: string;
  state: S;
  collection: C;
  actions: A;
  helpers: H;
  routes: R;
}

export class Controller<S = StateObj, C = Collection, A = FuncObj, H = FuncObj, R = FuncObj> {
  public name?: string;

  public state: this['config']['state'];
  public collection: this['config']['collection'];
  // public groups: this['config']['collection']['groups'];
  // public selectors: this['config']['collection']['selectors'];
  public actions: this['config']['actions'];
  public helpers: this['config']['helpers'];
  public routes: this['config']['routes'];

  public config: ControllerConfig<S, C, A, H, R>;

  constructor(config: Partial<ControllerConfig<S, C, A, H, R>>, spreadToRoot?: any) {
    this.config = config as Required<ControllerConfig<S, C, A, H, R>>;

    for (const propertyName in spreadToRoot) this[propertyName] = spreadToRoot[propertyName];

    for (const sectionName in this.config) {
      this[sectionName] = this.config[sectionName];
    }

    // if (this.config.collection instanceof Collection) {
    //   this.groups = this.config.collection.groups;
    //   this.selectors = this.config.collection.selectors;
    // }

    this.applyKeys();
  }
  private applyKeys(): void {
    for (const name in this.state)
      if (name && this.state[name] instanceof State) {
        const state: any = this.state[name];
        if (!state.name) state.key(name);
      } else if (name && this.state[name] instanceof Event) {
        const event: any = this.state[name];
        if (!event.config.name) event.config.name = name;
      }
  }
}
