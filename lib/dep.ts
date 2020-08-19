import { SubscriptionContainer } from './sub';
import State from './state';
export default class Dep {
  // static
  public deps: Set<any> = new Set();
  public subs: Set<SubscriptionContainer> = new Set();
  public dynamic: Set<State> = new Set(); // cleanout foriegn deps on update

  constructor(initialDeps?: Array<Dep>) {
    if (initialDeps) initialDeps.forEach(dep => this.deps.add(dep));
  }

  public depend(instance: State) {
    if (instance.dep === this) return;
    this.deps.add(instance);
  }
}
