import { ComponentContainer } from './sub';
import { State } from '.';
export default class Dep {
  // static
  public deps: Set<any> = new Set();
  public subs: Set<ComponentContainer> = new Set();
  public dynamic: Set<State> = new Set(); // cleanout foriegn deps on update

  constructor(initialDeps?: Array<Dep>) {
    if (initialDeps) initialDeps.forEach(dep => this.deps.add(dep));
  }
}
