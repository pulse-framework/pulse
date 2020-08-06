import { State } from './state';
import Collection from './collection';

export type StateInitializer = { [key: string]: State };
export type ActionInitializer = { [key: string]: () => any };

export interface ControllerConfig<S, C, A> {
  name?: string;
  state: S;
  collection: C;
  actions: A;
  helpers: any;
  routes: any;
}

export class Controller<S = StateInitializer, C = Collection, A = ActionInitializer> {
  public name?: string;

  public state: this['config']['state'] | S;
  public collection: this['config']['collection'];
  public actions: this['config']['actions'];

  constructor(public config: ControllerConfig<S, C, A>) {
    this.name = config.name;
    this.state = config.state;
  }
}
