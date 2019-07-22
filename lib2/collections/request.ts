import Collection from "../collection";
import { Global, ExpandableObject, RequestConfig } from "../interfaces";

type Method = "get" | "put" | "post" | "patch" | "delete";

export default class Request extends Collection {
  private timeout: number;
  private options: ExpandableObject;
  private saveHistory: boolean;

  private requestIntercept: (
    context: ExpandableObject,
    options: ExpandableObject
  ) => void;
  private responseIntercept: (
    context: ExpandableObject,
    response: ExpandableObject
  ) => void;

  constructor(global: Global, requestConfig: RequestConfig) {
    // Before we invoke the parent class, we define some defaults
    let groups = [];
    let persist = ["baseURL"];
    let data = {
      baseURL: requestConfig.baseURL || null,
      mode: "cors",
      credentials: "same-origin",
      headers: {
        Accept: "application/json"
      }
    };

    if (requestConfig.headers)
      Object.keys(requestConfig.headers).forEach(header => {
        data.headers[header] = requestConfig.headers[header];
      });

    if (requestConfig.credentials) data.credentials = requestConfig.credentials;
    if (requestConfig.mode) data.mode = requestConfig.mode;

    super("request", global, { groups, data, persist });

    this.requestIntercept = requestConfig.requestIntercept;
    this.responseIntercept = requestConfig.responseIntercept;
    this.timeout = requestConfig.timeout;
    this.saveHistory =
      typeof requestConfig.saveHistory === "undefined" ? true : false;

    this.global.request = {
      get: this.get.bind(this),
      post: this.post.bind(this),
      put: this._put.bind(this),
      patch: this.patch.bind(this),
      delete: this.delete.bind(this),
      queryify: this.queryify.bind(this)
    };
  }

  get(url: string, headers?: ExpandableObject) {
    return this.send(url, "get", {}, headers);
  }

  post(url: string, body?: ExpandableObject, headers?: ExpandableObject) {
    return this.send(url, "post", body, headers);
  }

  _put(url: string, body?: ExpandableObject, headers?: ExpandableObject) {
    return this.send(url, "put", body, headers);
  }

  patch(url: string, body?: ExpandableObject, headers?: ExpandableObject) {
    return this.send(url, "patch", body, headers);
  }

  delete(url: string, body?: ExpandableObject, headers?: ExpandableObject) {
    return this.send(url, "delete", body, headers);
  }

  async send(
    url: string,
    method: Method,
    body: ExpandableObject | string = {},
    headers: ExpandableObject
  ) {
    const requestHeaders = Object.assign({}, this.public.object.headers);

    if (headers)
      Object.keys(headers).forEach(header => {
        requestHeaders[header] = headers[header];
      });

    // If method is not get set application type
    if (method !== "get" && requestHeaders["Content-Type"] === undefined)
      requestHeaders["Content-Type"] = "application/json";

    let fullURL;

    if (url.startsWith("http")) fullURL = url;
    else fullURL = `${this.public.object.baseURL}/${url}`;

    // Stringify body
    body = JSON.stringify(body);

    // Build options
    this.options = {};
    this.options.credentials = this.public.object.credentials;
    this.options.mode = this.public.object.mode;

    // Build final fetch options object
    const options = Object.assign(
      {
        headers: requestHeaders,
        method: method.toUpperCase(),
        body: method === "get" ? null : body
      },
      this.options
    );

    if (this.requestIntercept)
      this.requestIntercept(this.global.getContext(), options);

    let response: any;

    if (this.timeout) {
      response = await Promise.race([
        fetch(fullURL, options),
        new Promise((resolve, reject) =>
          setTimeout(() => reject("timeout"), this.timeout)
        )
      ]);
    } else {
      response = await fetch(fullURL, options);
    }

    const contentType = response.headers.get("content-type");

    // extract body
    if (contentType && contentType.indexOf("application/json") !== -1) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    // history
    if (!this.saveHistory)
      this.collect({
        id: Date.now(),
        status: response.status,
        timestamp: new Date(),
        response: body
      });

    // inject headers into prototype
    let final;

    // If reponse body is an object, create a custom object with response function in prototype, so headers and the full response data can be accessed outside of this class
    if (!Array.isArray(body) && typeof body === "object") {
      final = Object.create({
        response: () => {
          return response;
        }
      });
      const keys = Object.keys(body);
      for (let i = 0; i < keys.length; i++) {
        const property = keys[i];
        final[property] = body[property];
      }
      // if the body is not an object, we can not inject a prototype, so just return the rew body
    } else {
      final = body;
    }
    // intercept response
    if (this.responseIntercept) {
      response.data = body;
      this.responseIntercept(this.global.getContext(), response);
    }

    // reject if bad response status
    if (response.ok || response.redirected) return final;

    // resolve response
    throw final;
  }

  // Adapted from: https://github.com/Gozala/querystring/blob/master/encode.js
  queryify(obj) {
    const stringifyPrimitive = function(value) {
      switch (typeof value) {
        case "string":
          return value;

        case "boolean":
          return value ? "true" : "false";

        case "number":
          return isFinite(value) ? value : "";

        default:
          return "";
      }
    };
    // validate input
    if (typeof obj != "object") return;

    return Object.keys(obj)
      .map(key => {
        const encodedKey = encodeURIComponent(stringifyPrimitive(key)) + "=";
        // if value is an array, encode with same key as parent
        if (Array.isArray(obj[key]))
          return obj[key]
            .map(value => {
              return encodedKey + encodeURIComponent(stringifyPrimitive(value));
            })
            .join("&");
        // join encoded key with value
        return encodedKey + encodeURIComponent(stringifyPrimitive(obj[key]));
      })
      .join("&");
  }
}
