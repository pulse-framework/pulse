import { ComponentContainer } from './sub';
import State from './state';
export default class Dep {
  public deps: Set<any> = new Set();
  public subs: Set<ComponentContainer> = new Set();
  constructor(initialDeps?: Array<Dep>) {
    if (initialDeps) initialDeps.forEach(dep => this.deps.add(dep));
  }
}
