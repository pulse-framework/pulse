import Pulse from './pulse';
import { State, Computed, DefaultDataItem, CollectionConfig, Collection, FuncType, Action, EventPayload, EventConfig, Event } from './internal';

// create global instance
export const instance = new Pulse();

export function state<T>(initialState: T): State<T>;
export function state<T>(computedFunc: () => T): Computed<T>;
export function state<T>(value: T | (() => T)): State<T> | Computed<T> {
  if (typeof value == 'function') {
    return new Computed<T>(() => instance, (value as unknown) as () => T);
  }
  return new State<T>(() => instance, value);
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

export interface RouteConfig {
  method?: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE';
  endpoint?: string;
}

export interface CallRouteConfig {
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: Record<string, any>;
}

export function route<ResponseType = any>(config?: RouteConfig) {
  return async (config?: CallRouteConfig): Promise<ResponseType> => {
    return null;
  };
}

export const core = instance.core;
export const nextPulse = instance.nextPulse;
export const track = instance.track;
export const batch = instance.batch;
export const setStorage = instance.setStorage;
export const configure = instance.configure;
