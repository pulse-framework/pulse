// Actions provide modifiers that can help with function execution
// Track/Undo class is aliased, however action takes care of self containing multiple instances of track/undo
import { Pulse } from './internal';
import { Tracker } from './internal';

// This object contains all trackers created during the execution of an action
interface ActionContext {
  trackers: Set<Tracker>;
  errorHandlers: Array<(e: unknown) => unknown>;
}

// Alias for the return type of the action modifiers
type Modifiers = InstanceType<typeof ActionModifiers>;

// The Action definition function type
export type FuncType = (modifiers: Modifiers, ...args: any) => any;

// The higher order function type created by the Action class
export type HigherOrderFunc<F extends FuncType> = F extends (modifiers: Modifiers, ...args: infer P) => ReturnType<F>
  ? (...args: P) => ReturnType<F>
  : never;

/**
 * @class
 * Pulse Action
 */
export class Action<T extends FuncType = FuncType> {
  public name: string;

  constructor(public instance: () => Pulse, private action: T) {}

  /**
   * @public
   * Return the higher order function with the correct types & context
   */
  public hoc(): HigherOrderFunc<T> {
    return this._hoc.bind(this) as HigherOrderFunc<T>;
  }

  /**
   * @internal
   * The higher order function
   */
  private async _hoc() {
    const context: ActionContext = {
      trackers: new Set(),
      errorHandlers: []
    };
    try {
      // invoke the function and supply the modifiers
      this.action(new ActionModifiers(this.instance, context), ...arguments);
    } catch (e) {
      // on error, run the error callbacks
      for (const [index, callback] of context.errorHandlers.entries()) {
        if (index == context.errorHandlers.length - 1) return callback(e);
        else callback(e);
      }
    } finally {
      context.trackers.forEach(tracker => tracker.destroy());
    }
    return;
  }
}

export class ActionModifiers {
  constructor(public instance: () => Pulse, public context: ActionContext) {}
  public onError(...callbacks: ((e: unknown) => unknown)[]) {
    this.context.errorHandlers = callbacks;
  }

  public handle(e: unknown) {
    this.instance().Error(e, { fromAction: this });
    return false;
  }

  public finally(func: () => unknown) {}

  public undo() {
    this.context.trackers.forEach(tracker => tracker.undo());
  }

  /**
   * @public
   * This creates a tracker bound to the execution context, can be used several times in a single action.
   */
  public batch(func: () => unknown) {
    this.instance().batch(func);
  }

  /**
   * @public
   * This creates a tracker bound to the execution context, can be used several times in a single action.
   */
  public track(func: () => unknown) {
    const tracker = new Tracker(this.instance, func);
    this.context.trackers.add(tracker);
    return tracker;
  }

  public uncaught(e?: unknown) {
    if (e) throw e;
  }
}

const App = {
  Action: <T extends FuncType>(func: T) => {
    return new Action(() => new Pulse(), func).hoc();
  }
};

export const MyAction = App.Action(async (action, myParam: boolean) => {
  action.onError(action.undo, action.uncaught);

  action.batch(() =>
    action.track(() => {
      // state changes
    })
  );

  return myParam;
});

MyAction;
