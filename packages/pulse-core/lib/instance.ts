import Pulse from './pulse';
import {
  State,
  Dep,
  Computed,
  DefaultDataItem,
  CollectionConfig,
  Collection,
  FuncType,
  Action,
  EventPayload,
  EventConfig,
  Event,
} from './internal';
import { Console } from 'console';
import { route } from './route';

// create global instance
export const instance = new Pulse();

export function state<T>(initialState: T, deps?: Array<Dep>): State<T>;
export function state<T>(computedFunc: () => T, deps?: Array<State>): Computed<T>;
export function state<T>(value: T | (() => T), deps?: Array<State | Dep>): State<T> | Computed<T> {
  if (typeof value == 'function') {
    return new Computed<T>(() => instance, (value as unknown) as () => T, deps as Array<State>);
  }
  return new State<T>(() => instance, value, deps as Array<Dep>);
}

export function collection<DataType extends DefaultDataItem = DefaultDataItem>(config: CollectionConfig = {}) {
  const collection = new Collection<DataType, {}, {}>(() => instance, config);
  return collection;
}

export function action<T extends FuncType>(func: T) {
  return new Action(() => instance, func).func();
}

export function event<P = EventPayload>(config?: EventConfig<P>) {
  return new Event(() => instance, config);
}

export {route}

export const setCore = <CoreType>(core?: CoreType): CoreType => instance.core<CoreType>(core);
export const nextPulse = instance.nextPulse;
export const track = instance.track;
export const batch = instance.batch;
export const setStorage = instance.setStorage;
export const configure = instance.configure;
