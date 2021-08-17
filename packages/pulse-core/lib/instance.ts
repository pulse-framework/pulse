import Pulse from './pulse';
import { State, Computed, DefaultDataItem, CollectionConfig, Collection, FuncType, Action, EventPayload, EventConfig, Event, API } from './internal';
import { Console } from 'console';
import { PulseResponse } from './api';

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
  // method: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE';
  headers?: RequestInit['headers']
  baseURL?: string;
  options?: RequestInit
}

export interface CallRouteConfig {
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: Record<string, any>;
}

/**
 * 
 * @param config.headers Headers to be sent on each request
 * @param config.baseURL The URL to be used on each request (if left empty, defaults to current hostname)
 * @returns The configured route function
 */
export function route<ResponseType = any>(config?: RouteConfig) {
  if(config.baseURL.endsWith('/')){config.baseURL = config.baseURL.substring(0, config.baseURL.length)}
  const api = new API({
    options: config.options,
    baseURL: config.baseURL,
  });
  /**
   * @param method The HTTP MEthod to use on this request
   * @param
   */
  return async (method: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE', path: string, inConfig?: CallRouteConfig): Promise<PulseResponse> => {
    // if(inConfig.path.startsWith('/')){inConfig.path = inConfig.path.substring(1)}
    try{
      switch (method) {
        case 'DELETE':
          return await api.delete(path)
        case 'GET':
          return await api.get(path + inConfig.query ? `?${inConfig.query}` : '')
        case 'PATCH':
          return await api.patch(path, inConfig.body)
        case 'POST':
          return await api.post(path, inConfig.body)
        case 'PUT':
          return await api.put(path, inConfig.body)
        default:
          return await api.get(path + inConfig.query ? `?${inConfig.query}` : '')
      }
    } catch(e) {
      // throw e;
      return Promise.reject(e)
    }
  };
}

export const core = instance.core;
export const nextPulse = instance.nextPulse;
export const track = instance.track;
export const batch = instance.batch;
export const setStorage = instance.setStorage;
export const configure = instance.configure;
