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
    obj[t.toLowerCase()] = headers[t];
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
      data: any,
      response: PulseResponse | unknown,
      config: APIConfig = { ...this.config };

    // inject method into request options
    config.options.method = method;

    if (!config.options.headers) config.options.headers = {};
    let originalType = config.options.headers['content-type'] || config.options.headers['Content-Type'];

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
    else fullUrl = `${this.config.baseURL ? this.config.baseURL : ''}${path}/${endpoint}`;

    if (config.requestIntercept) config.requestIntercept({ ...config.options, endpoint: fullUrl });

    let timedout = false;
    if (this.config.timeout) {
      let t: any;
      const timeout = new Promise(resolve => {
        t = setTimeout(() => {
          timedout = true;
          resolve();
        }, this.config.timeout);
      });
      const request = new Promise((resolve, reject) => {
        fetch(fullUrl, this.config.options)
          .then(data => {
            clearTimeout(t);
            resolve(data);
          })
          .catch(reject);
      });
      response = await Promise.race([timeout, request]);
    } else {
      response = await fetch(fullUrl, this.config.options);
    }

    // Return the old content type header
    if (originalType) config.options.headers['content-type'] = originalType;

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

    if (config.responseIntercept) config.responseIntercept(res);

    return res;
  }
}

export default API;
