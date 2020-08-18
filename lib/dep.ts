import { SubscriptionContainer } from './sub';
import State from './state';
export default class Dep {
  public deps: Set<any> = new Set(); // Dependencies from the State
  public subs: Set<SubscriptionContainer> = new Set(); // Subscriptions for instance a component subscribes to a state to get rerendered if the state changes
  public dynamic: Set<State> = new Set(); // cleanout foriegn deps on update

  constructor(initialDeps?: Array<Dep>) {
    if (initialDeps) initialDeps.forEach(dep => this.deps.add(dep));
  }

  public depend(instance: State) {
    if (instance.dep === this) return;
    this.deps.add(instance);
  }
}
