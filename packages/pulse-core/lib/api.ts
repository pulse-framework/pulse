// type Body = { [key: string]: any };

export interface PulseResponse<DataType = any> {
  data: DataType;
  timedout?: boolean;
  status: number;
  raw?: Response;
  type?: string;
}

export interface APIConfig {
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
    const formattedHeader = t
      .toLowerCase()
      .split('-')
      .map(token => token.charAt(0).toUpperCase() + token.slice(1))
      .join('-');
    obj[formattedHeader] = headers[t];
  });
  return obj;
};

export class API {
  constructor(public config: APIConfig = { options: {} }) {
    if (config.options && config.options.headers) {
      config.options.headers = ensureProperHeaders(config.options.headers);
    }

    if (!config.options) config.options = {};
  }

  /**
   * Override API config and request options. Returns a modified instance this API with overrides applied.
   * @param config - O
   */
  public with(config: APIConfig): API {
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
      response: PulseResponse | unknown,
      config: APIConfig = API.cloneDefaultConfig(this.config);

    // inject method into request options
    config.options.method = method;

    if (!config.options.headers) config.options.headers = {};

    // inject payload into request body
    if (typeof payload === 'object') {
      // stringify body
      config.options.body = JSON.stringify(payload);
      // if body is object and no content type specified, auto assign content-type to application/json
      if (!config.options.headers['Content-Type'] || !config.options.headers['content-type'])
        config.options.headers['Content-Type'] = 'application/json';
    } else {
      config.options.body = payload;
    }

    // construct endpoint
    let path = this.config.path ? '/' + this.config.path : '';
    if (endpoint.startsWith('http')) fullUrl = endpoint;
    else fullUrl = `${this.config.baseURL ? this.config.baseURL : ''}${path}/${endpoint}`;

    // fire request interceptor
    if (config.requestIntercept) config.requestIntercept({ ...config.options, endpoint: fullUrl });

    // make the request
    let timedout = false;
    if (config.timeout) {
      let t: any;
      const timeout = new Promise<void>(resolve => {
        t = setTimeout(() => {
          timedout = true;
          resolve();
        }, config.timeout);
      });
      const request = new Promise((resolve, reject) => {
        fetch(fullUrl, config.options)
          .then(data => {
            clearTimeout(t);
            resolve(data);
          })
          .catch(reject);
      });
      response = await Promise.race([timeout, request]);
    } else {
      response = await fetch(fullUrl, config.options);
    }

    // if we got here, PulseResponse is the actual response object
    let res: PulseResponse = {
      status: timedout ? 408 : (response as Response)?.status,
      raw: response as Response,
      data: {},
      type: (response as Response)?.headers?.get('content-type') || 'text/plain',
      timedout
    };

    // extract response data
    if (res.type?.includes('application/json')) {
      res.data = await res.raw.json();
    } else if (typeof res?.raw?.text === 'function') {
      res.data = await res.raw.text();
    }

    // fire the response interceptor
    if (config.responseIntercept) config.responseIntercept(res);

    return res;
  }
  static cloneDefaultConfig(config: APIConfig): APIConfig {
    config = { ...config };
    config.options = { ...config.options };
    config.options.headers = { ...config.options.headers };
    return config;
  }
}

export default API;
