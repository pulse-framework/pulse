import { State, SubscriptionContainer } from './internal';

export class Dep {
  public deps: Set<any> = new Set();
  public subs: Set<SubscriptionContainer> = new Set();

  constructor(initialDeps?: Array<Dep>) {
    if (initialDeps) initialDeps.forEach(dep => this.deps.add(dep));
  }

  public depend(instance: State) {
    if (instance.dep === this) return;
    this.deps.add(instance);
  }
}

export default Dep;
