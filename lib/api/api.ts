import * as http from 'http';

type Body = { [key: string]: any };

interface PulseResponse extends Response {
  data?: any;
  timedout?: boolean;
}

export interface apiConfig {
  options: RequestInit;
  baseURL?: string;
  timeout?: number;
  requestIntercept?: Function;
  responseIntercept?: Function;
}

const ensureProperHeaders = (headers) => {
  let newHeaders = {};
  Object.keys(headers).forEach(key => {
    const value = headers[key];
    newHeaders[key.toLowerCase()] = value;
  })
  return newHeaders;
}

export default class API {
  constructor(public config: apiConfig = { options: {} }) {
    /**
     * Make all headers lowerCase
     */
    if (config.options && config.options.headers) {
      config.options.headers = ensureProperHeaders(config.options.headers);
    } 
    if (!config.options) config.options = {};
  }

  /**
   * Override API config and request options. Returns a modified instance this API with overrides applied.
   * @param config - O
   */
  public with(config: apiConfig): API {
    let _this = { ...this };
    if (config.options && config.options.headers) {
      config.options.headers = ensureProperHeaders(config.options.headers);
    }
    _this.config = {
      ..._this.config,
      ...config,
    };
    return _this;
  }
  public get(endpoint: string) {
    return this.send('GET', endpoint);
  }
  public post(endpoint: string, payload?: any) {
    return this.send('POST', endpoint, payload);
  }
  public put(endpoint: string, payload?: any) {
    return this.send('PUT', endpoint, payload);
  }
  public patch(endpoint: string, payload?: any) {
    return this.send('PATCH', endpoint, payload);
  }
  public delete(endpoint: string, payload?: any) {
    return this.send('DELETE', endpoint, payload);
  }

  private async send(method: string, endpoint, payload?: any): Promise<PulseResponse> {
    // initial definitions
    let fullUrl: string,
      data: any,
      response: PulseResponse | unknown,
      config: apiConfig = { ...this.config };

    // inject method into request options
    config.options.method = method;

    if (!config.options.headers) config.options.headers = {};

    if (typeof payload === 'object') {
      // inject body if not get method
      config.options.body = JSON.stringify(payload);
      // auto set header to application/json
      if (!config.options.headers.hasOwnProperty('content-type')) {
        config.options.headers['content-type'] = 'application/json';
      }
    } else config.options.body = payload;

    // construct endpoint
    if (endpoint.startsWith('http')) fullUrl = endpoint;
    else fullUrl = `${this.config.baseURL}/${endpoint}`;

    if (config.requestIntercept) config.requestIntercept(config.options);

    try {
      if (this.config.timeout) {
        response = await Promise.race([
          fetch(fullUrl, this.config.options),
          setTimeout(
            () =>
              Promise.reject(() => {
                const timeoutError: PulseResponse = Response.error();
                timeoutError.timedout = true;
                return timeoutError;
              }),
            this.config.timeout
          )
        ]);
      } else {
        response = await fetch(fullUrl, this.config.options);
      }
    } catch (e) {
      response = Response.error();
    }

    // if we got here, PulseResponse is the actual response object
    let res = response as PulseResponse;
    let contentType = res.headers.get('content-type');

    // extract response data
    if (contentType && contentType.indexOf('application/json') !== -1) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    res.data = data;

    if (config.responseIntercept) config.responseIntercept(res);

    return res;
  }
}

const NotifyAPI = new API({
  timeout: 500,
  options: {}
});

export const getChannel = channelId =>
  NotifyAPI.with({
    options: { headers: { ['Content-Type']: 'multipart/form-data' } }
  }).get(`channels/${channelId}`);
