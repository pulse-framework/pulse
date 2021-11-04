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
  API
} from './internal';
import { Console } from 'console';
import { PulseResponse } from './api';

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

export interface RouteConfig {
  // method: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE';
  baseURL?: string;
  timeout?: number;
  options?: RequestInit;
}

export interface CallRouteConfig {
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: Record<string, any>;
  method?: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE';
  options?: RequestInit;
}

/**
 * @param config.headers Headers to be sent on each request
 * @param config.baseURL The URL to be used on each request (if left empty, defaults to current hostname)
 * @returns The configured route function
 */
export function route<ResponseType = any>(config?: RouteConfig) {
  if (config.baseURL.endsWith('/')) {
    config.baseURL = config.baseURL.substring(0, config.baseURL.length);
  }
  const api = new API({
    options: config.options,
    baseURL: config.baseURL,
    timeout: config.timeout || undefined // this is just incease the user passes 0, it should be treated as undefined
  });
  /**
   * @param method The HTTP MEthod to use on this request
   * @param
   */
  return async <ResponseType = any>(path: string, inConfig?: CallRouteConfig): Promise<PulseResponse> => {
    // if(inConfig.path.startsWith('/')){inConfig.path = inConfig.path.substring(1)}
    try {
      if (inConfig.options) {
        api.config.options = { ...api.config.options, ...inConfig.options };
      }
      const searchParams = new URLSearchParams();

      if (!inConfig.method) {
        inConfig.method = 'GET';
      }

      switch (inConfig.method) {
        case 'DELETE':
          return await api.delete(path);
        case 'GET':
          const query = inConfig.query
            ? Object.keys(inConfig.query)
                .map(key => `${key}=${encodeURIComponent(inConfig.query[key])}`)
                .join('&')
            : null;
          return await api.get(`${path}${query ? '?' + query : ''}`);
        case 'PATCH':
          return await api.patch(path, inConfig.body);
        case 'POST':
          return await api.post(path, inConfig.body);
        case 'PUT':
          return await api.put(path, inConfig.body);
        default:
          searchParams;
          return await api.get(
            `${path}?${Object.keys(inConfig.query)
              .map(key => key + `=${encodeURIComponent(inConfig.query[key])}`)
              .join('&')}`
          );
      }
    } catch (e) {
      // throw e;
      return Promise.reject(e);
    }
  };
}

export const setCore = <CoreType>(core?: CoreType): CoreType => instance.core<CoreType>(core);
export const nextPulse = instance.nextPulse;
export const track = instance.track;
export const batch = instance.batch;
export const setStorage = instance.setStorage;
export const configure = instance.configure;
