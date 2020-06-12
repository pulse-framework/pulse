import * as http from 'http';

type Body = { [key: string]: any };

export interface PulseResponse extends Response {
  data?: any;
  timedout?: boolean;
}

export interface apiConfig {
  options: RequestInit;
  baseURL?: string;
  path?: string;
  timeout?: number;
  requestIntercept?: Function;
  responseIntercept?: Function;
}

const ensureProperHeaders = headers => {
  let obj = {};
  Object.keys(headers).forEach(t => {
    obj[t.toLowerCase()] = headers[t];
  });
  return obj;
};

export default class API {
  constructor(public config: apiConfig = { options: {} }) {
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
    let _this = Object.assign(Object.create(Object.getPrototypeOf(this)), this);

    if (config.options && config.options.headers) {
      config.options.headers = ensureProperHeaders({
        ..._this.config.options.headers,
        ...config.options.headers
      });
    }

    _this.config = {
      ..._this.config,
      ...config
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
    let originalType = config.options.headers['content-type'];

    if (payload && payload._parts && payload.getParts) {
      // inject body if not get method
      config.options.body = payload;
      config.options.headers['content-type'] = 'multipart/form-data';
    } else if (typeof payload === 'object') {
      // inject body if not get method
      config.options.body = JSON.stringify(payload);
      config.options.headers['content-type'] = 'application/json';
    } else config.options.body = payload;

    // construct endpoint
    let path = this.config.path ? '/' + this.config.path : '';
    if (endpoint.startsWith('http')) fullUrl = endpoint;
    else fullUrl = `${this.config.baseURL}${path}/${endpoint}`;

    if (config.requestIntercept) config.requestIntercept({ ...config.options, endpoint: fullUrl });

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
      return e;
    }

    // Return the old content type header
    if (originalType) config.options.headers['content-type'] = originalType;

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
