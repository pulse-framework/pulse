import Pulse from './';
import { State } from './';

export class Computed extends State {
  private func: Function;
  private cleanup: Set<State> = new Set();
  constructor(instance: Pulse, func: Function, deps?: Array<State>) {
    super(instance, instance.config.computedDefault || null);

    this.func = func;

    if (deps) deps.forEach(state => state.dep.deps.add(this));

    this.mutation = () => {
      if (deps) return this.func();
      else {
        this.instance.runtime.trackState = true;
        let result = this.func();
        let found = this.instance.runtime.getFoundState();
        found.forEach(state => state.dep.deps.add(this));
        return result;
      }
    };

    // initial
    const output = this.mutation();
    this.set(output);
  }
}

export default Computed;
