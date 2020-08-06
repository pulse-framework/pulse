import { State } from './state';
import Collection from './collection';
import Computed from './computed';

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
  public shit: Pick<ControllerConfig<S, C, A, H, R>, 'state' | 'collection' | 'actions' | 'helpers' | 'routes' | 'name'>;
  public name?: string;

  public state: this['config']['state'];
  public collection: this['config']['collection'];
  public actions: this['config']['actions'];
  public helpers: this['config']['helpers'];
  public routes: this['config']['routes'];
  private pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
    const copy = {} as Pick<T, K>;

    keys.forEach((key) => (copy[key] = obj[key]));

    return copy;
  }
  constructor(public config: ControllerConfig<S, C, A, H, R>) {
    const shit = this.pick(config, ...(Object.keys(config) as []));

    this.shit = shit;
  }
  private applyKeys() {
    // for (const instanceName in this.state) this.config.state[instanceName].key(instanceName);
  }
}
