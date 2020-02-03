type Body = { [key: string]: any };

interface PulseResponse extends Response {
  data?: any;
}
export default class Request {
  constructor(parameters) {}
  static timeout: 0;
  static options: {};
  static baseURL: string;
  static API(config) {
    // make better?
    if (config.timeout) this.timeout = config.timeout;
    if (config.baseURL) this.baseURL = config.baseURL;
    this.options = config;

    return {
      get: (endpoint: string) => this.send(endpoint),
      post: (endpoint: string, body: Body) => this.send(endpoint),
      patch: (endpoint: string, body: Body) => this.send(endpoint),
      delete: (endpoint: string, body: Body) => this.send(endpoint)
    };
  }
  static async send(endpoint): Promise<PulseResponse> {
    let body: any;
    let response: PulseResponse | unknown;
    let fullURL = this.baseURL ? this.baseURL + endpoint : endpoint;

    if (this.timeout) {
      response = await Promise.race([
        fetch(fullURL, this.options),
        new Promise((resolve, reject) =>
          setTimeout(() => reject('timeout'), this.timeout)
        )
      ]);
    } else {
      response = await fetch(fullURL, this.options);
    }

    // if we got here, PulseResponse is the actual response object
    let res = response as PulseResponse;

    const contentType = res.headers.get('content-type');

    // extract body
    if (contentType && contentType.indexOf('application/json') !== -1) {
      body = await res.json();
    } else {
      body = await res.text();
    }

    res.data = body;

    return res;
  }
}
