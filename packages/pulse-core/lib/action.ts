// Actions provide modifiers that can help with function execution
// Track/Undo class is aliased, however action takes care of self containing multiple instances of track/undo
import { Pulse } from './pulse';
import { Tracker } from './internal';

// This object contains all trackers created during the execution of an action
interface ActionContext {
  trackers: Set<Tracker>;
  errorHandlers: (false | ((e: unknown) => unknown))[];
}

// Alias for the return type of the action modifiers
type Modifiers = ReturnType<typeof actionMods>;

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
  public func(): HigherOrderFunc<T> {
    if (this.action.constructor.name === 'AsyncFunction') return this._func.bind(this) as HigherOrderFunc<T>;
    else if (this.action.constructor.name === 'Function') return this._funcSync.bind(this) as HigherOrderFunc<T>;
    else console.warn('This is not a function');
  }

  /**
   * @internal
   * The higher order function
   */
  private async _func() {
    const context: ActionContext = {
      trackers: new Set(),
      errorHandlers: []
    };
    try {
      // invoke the function and supply the modifiers
      return await this.action(actionMods.call(this, context), ...arguments);
    } catch (e) {
      let returnFalse: boolean = false;
      // on error, run the error callbacks
      for (const [index, callback] of context.errorHandlers.entries()) {
        if (typeof callback == 'boolean') {
          returnFalse = true;
          continue;
        }
        if (index == context.errorHandlers.length - 1) return callback(e);
        else callback(e);
      }
      if (returnFalse) return false;
    } finally {
      context.trackers.forEach(tracker => tracker.destroy());
    }
  }
  /**
   * @internal
   * The higher order function
   */
  private _funcSync() {
    const context: ActionContext = {
      trackers: new Set(),
      errorHandlers: []
    };
    try {
      // invoke the function and supply the modifiers
      return this.action(actionMods.call(this, context), ...arguments);
    } catch (e) {
      let returnFalse: boolean = false;
      // on error, run the error callbacks
      for (const [index, callback] of context.errorHandlers.entries()) {
        if (typeof callback == 'boolean') {
          returnFalse = true;
          continue;
        }
        if (index == context.errorHandlers.length - 1) return callback(e);
        else callback(e);
      }
      if (returnFalse) return false;
    } finally {
      context.trackers.forEach(tracker => tracker.destroy());
    }
  }
}

function actionMods(context: ActionContext){
  return {
    onCatch: (...callbacks: (false | ((e: unknown) => unknown))[]) => {
      // call default global error handler
      callbacks.unshift((e: unknown) => this.instance().createError(e, { fromAction: this }));
      context.errorHandlers = callbacks;
    },

    // finally: (func: () => unknown) => {},

    undo: () => {
      context.trackers.forEach(tracker => tracker.undo());
    },

    /**
     * @public
     * This creates a tracker bound to the execution context, can be used several times in a single action.
     */
    batch: (func: () => unknown) => {
      this.instance().batch(func);
    },

    /**
     * @public
     * This creates a tracker bound to the execution context, can be used several times in a single action.
     */
    track: (func: () => unknown) => {
      const tracker = new Tracker(this.instance, func);
      context.trackers.add(tracker);
      return tracker;
    },

    uncaught: (e?: unknown) =>  {
      if (e) throw e;
    }
  }
}
