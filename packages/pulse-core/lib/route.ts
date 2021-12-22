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

export class Route {
  constructor(public config: APIConfig = { options: {} }) {
	// ensure headers are in the correct format
    if (config.options && config.options.headers) {
      config.options.headers = ensureProperHeaders(config.options.headers);
    }
	// ensure the fetch options are present
    if (!config.options) config.options = {};
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

  public async send(method: string, endpoint, payload?: any): Promise<PulseResponse> {
    // initial definitions
    let fullUrl: string,
      response: PulseResponse | unknown,
      config: APIConfig = Route.cloneDefaultConfig(this.config);

    // inject method into request options
    config.options.method = method;

    if (!config.options.headers) config.options.headers = {};

    // inject payload into request body
    if (typeof payload === 'object') {
      // stringify body
      config.options.body = JSON.stringify(payload);
      // if body is object and no content type specified, auto assign content-type to application/json
      if (!config.options.headers['Content-Type'])
        config.options.headers['Content-Type'] = 'application/json';
    } else {
      config.options.body = payload;
    }

    // construct endpoint
    if (endpoint.startsWith('http')) fullUrl = endpoint;
    else fullUrl = `${this.config.baseURL ? this.config.baseURL : ''}${endpoint}`;

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

    return res;
  }
  static cloneDefaultConfig(config: APIConfig): APIConfig {
    const cfg = { ...config };
    cfg.options = { ...config.options };
    cfg.options.headers = { ...config.options.headers };
    return cfg;
  }
}



//// NEW API

export interface RouteConfig {
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
 * @param config.options normal fetch options such as headers, credentials, etc.
 * @param config.baseURL The URL to be used on each request (if left empty, defaults to current hostname)
 * @returns The configured route function
 */
export function route(config?: RouteConfig) {
  // if no baseURL is provided, use the current hostname
  if(typeof config.baseURL !== 'string'){config.baseURL=''}

  if (config.baseURL.endsWith('/')) {
    config.baseURL = config.baseURL.substring(0, config.baseURL.length);
  }
  const route = new Route({
    options: config.options,
    baseURL: config.baseURL,
    timeout: config.timeout || undefined // this is just incease the user passes 0, it should be treated as undefined
  });
  /**
   * @param path The path to be appended to the baseURL
   * @param config.params The params to be appended to the path
   * @param config.query The query params to be appended to the POST path
   * @param config.body The body to be sent with the request
   * @param config.method The method to be used for the request
   * @param config.options The fetch options to be used for the request 
   */
  return async <ResponseType>(path: string, inConfig?: CallRouteConfig): Promise<PulseResponse<ResponseType>> => {
    // if(inConfig.path.startsWith('/')){inConfig.path = inConfig.path.substring(1)}
    try {
      if(path.startsWith('/')){path = path.substring(1)}
      if (inConfig.options) {
        route.config.options = { ...route.config.options, ...inConfig.options };
      }

      if (!inConfig.method) {
        inConfig.method = 'GET';
      }
	  else{
		inConfig.method = inConfig.method.toUpperCase() as typeof inConfig.method;
	  }

	  const query = inConfig.query
		? Object.keys(inConfig.query)
			.map(key => `${key}=${encodeURIComponent(inConfig.query[key])}`)
			.join('&')
		: null;

	  const params = inConfig.params
		? Object.keys(inConfig.params)
			.map(key => `${key}=${encodeURIComponent(inConfig.params[key])}`)
			.join('&')
		: null;
	  

      switch (inConfig.method) {
        case 'PATCH':
          return await route.send('PATCH', path, inConfig.body);
        case 'POST':
          return await route.send('POST', `${path}${params ? `?${params}` : ''}`, inConfig.body);
        case 'PUT':
          return await route.send("PUT", path, inConfig.body);
        default:
          return await route.send(inConfig.method, `${path}${query ? `?${query}` : ''}`);
      }
    } catch (e) {
      // throw e;
      return Promise.reject(e);
    }
  };
}