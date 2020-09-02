import Pulse from './pulse';

// default event payload
export type EventPayload = { [key: string]: any };
// type of the callback an event should receive
export type EventCallbackFunc<P = EventPayload> = (payload: P) => void;
// type of the function used as an alias to create an event instance, with a generic for the payload type
export type CreateEventFunc = <P = EventPayload>(config?: EventConfig<P>) => Event<P>;
// type of the function expected to init many events
export type EventsObjFunc = (createEventFunc: CreateEventFunc) => { [key: string]: Event };

// Configuration for event constructor
export interface EventConfig<P = EventPayload> {
  payload?: P;
  name?: string;
  maxSubs?: number;
  destroyAfterUses?: number;
  enabled?: boolean;
}
// Event class
export class Event<P = EventPayload> {
  // store the callbacks as a set of functions
  private callbacks: Set<EventCallbackFunc<P>>;
  // store the amount of uses for this event, undefined by default unless set in config
  private uses: number;

  constructor(public instance: () => Pulse, public config: EventConfig<P>) {
    // initiate uses state if applicable
    if (config.destroyAfterUses) this.uses = 0;
  }
  // register subscribers
  public on(callback: EventCallbackFunc<P>): () => void {
    // on returns a clean up function, defined here for multiple return points
    const cleanupFunc = () => this.unsub(callback);

    // if maxSubs is set, and there are less than or equal to the maximum, fail silently.
    if (this.config.maxSubs !== undefined && this.callbacks.size <= this.config.maxSubs) return cleanupFunc;

    // if destroy after uses is truthy and the uses is less than or equal the destroy amount
    if (this.config.destroyAfterUses && this.uses > this.config.destroyAfterUses) {
      this.destroy();
      return cleanupFunc;
    }
    // add the callback to Event callback set and return cleanup function
    this.callbacks.add(callback);
    return cleanupFunc;
  }
  // run all the callbacks in this event and pass the payload
  public emit(payload?: P) {
    // if Event is disabled block emitting
    if (this.config.enabled !== undefined && !this.config.enabled) return;
    // foreach callback, invoke the saved function
    this.callbacks.forEach(callback => callback(payload));
    // increment the uses if
    if (this.uses !== undefined) this.uses++;
  }
  public unsub(callback: EventCallbackFunc<P>) {
    this.callbacks.delete(callback);
  }
  public destroy() {}
}
