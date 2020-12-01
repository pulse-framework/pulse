import { Pulse } from './internal';

// default event payload
export type EventPayload = any;
// type of the callback an event should receive
export type EventCallbackFunc<P = EventPayload> = (payload: P) => void;
// type of the function used as an alias to create an event instance, with a generic for the payload type
export type CreateEventFunc = <P = EventPayload>(config?: EventConfig<P>) => Event<P>;
// type of the function expected to init many events
export type EventsObjFunc = (createEventFunc: CreateEventFunc) => { [key: string]: Event };

// Configuration for event constructor
export interface EventConfig<P = EventPayload> {
  name?: string;
  maxSubs?: number;
  enabled?: boolean;
  disableAfterUses?: number;
  throttle?: number;
  queue?: boolean;
}

// Event class
export class Event<P = EventPayload> {
  // store the callbacks as a set of functions
  private callbacks: Set<EventCallbackFunc<P>> = new Set();
  // store the amount of uses for this event, undefined by default unless set in config
  private uses: number;
  private currentTimeout: any | number;
  //
  private queue: Array<P>;
  // should never be defined, but holds reference to the Payload type for useEvent to read
  public payload: P;

  private onNextCallback: (payload?: P) => any;

  constructor(public instance: () => Pulse, public config: EventConfig<P> = {}) {
    // initiate uses state if applicable
    if (config.disableAfterUses) this.uses = 0;
    if (config.queue) this.queue = [];
  }

  // register subscribers
  public on(callback: EventCallbackFunc<P>): () => void {
    // on returns a clean up function, defined here for multiple return points
    const cleanupFunc = () => this.unsub(callback);

    // if maxSubs is set, and there are less than or equal to the maximum, fail silently.
    if (this.config.maxSubs !== undefined && this.callbacks.size <= this.config.maxSubs) return cleanupFunc;

    // if destroy after uses is truthy and the uses is less than or equal the destroy amount
    if (this.config.disableAfterUses && this.uses > this.config.disableAfterUses) {
      this.disable();
      return cleanupFunc;
    }

    // add the callback to Event callback set and return cleanup function
    this.callbacks.add(callback);
    return cleanupFunc;
  }

  // run all the callbacks in this event and pass the payload
  public emit(payload?: P): void {
    // if Event is disabled block emitting
    if (this.config.enabled !== undefined && !this.config.enabled) return;

    if (this.config.throttle) {
      this.handleThrottle(payload);
    } else {
      this.emitter(payload);
    }
  }

  public disable(): void {
    this.config.enabled = false;
  }

  public onNext(callback: (payload?: P) => any) {
    this.onNextCallback = callback;
  }

  // Private functions
  private emitter(payload: P) {
    // foreach callback, invoke the saved function
    this.callbacks.forEach(callback => callback(payload));

    if (typeof this.onNextCallback === 'function') {
      this.onNextCallback(payload);
      delete this.onNextCallback;
    }
    // increment the uses if
    if (this.uses !== undefined) this.uses++;
  }

  private unsub(callback: EventCallbackFunc<P>): void {
    this.callbacks.delete(callback);
  }

  private handleThrottle(payload: P): void {
    const throttling = this.currentTimeout !== undefined;
    // throttling with a queue? push to queue and reset timeout
    if (throttling && this.queue) {
      this.queue.push(payload);
      clearTimeout(this.currentTimeout);
      this.currentTimeout = undefined;
    }

    // throttling without a queue? exit
    else if (throttling) return;
    // throttle is not running, begin timeout chain
    else {
      const looper = (payload: P) => {
        this.currentTimeout = setTimeout(() => {
          this.currentTimeout = undefined;
          // emit the event with passed in payload
          this.emitter(payload);
          // if using the queue grab the next payload from the queue and loop back with a new timer
          if (this.queue && this.queue.length > 0) looper(this.queue.shift());
        }, this.config.throttle);
      };
      looper(payload);
    }
    //
    return;
  }
}
