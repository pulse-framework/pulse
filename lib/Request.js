const Collection = require('./Collection');

module.exports = class Request extends Collection {
  constructor(
    global,
    {
      // request specific
      baseURL,
      requestIntercept,
      responseIntercept,
      mode,
      credentials,
      headers,
      saveHistory
    }
  ) {
    // Before we invoke the parent class, we define some defaults
    let groups = [];
    let persist = ['baseURL'];
    let data = {
      baseURL,
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    };

    if (!baseURL) data.baseURL = null;

    if (headers)
      Object.keys(headers).forEach(header => {
        data.headers[header] = headers[header];
      });

    // Invoke the parent
    super({ name: 'request', global }, { groups, data, persist });

    this._requestIntercept = requestIntercept;
    this._responseIntercept = responseIntercept;

    this._saveHistory = typeof this._saveHistory == 'undefined' ? true : false;
    // inside super you need the class constructor datas
    // this._pendingRequests = this._global.dataRef.base.pendingRequests;
    let pendingRequests = [];
    this.fetchOptions = {};

    if (credentials) data.credentials = credentials;
    if (mode) data.mode = mode;

    this.fetchOptions.credentials = data.credentials;
    this.fetchOptions.mode = data.mode;

    this._global.request = {
      get: this.get.bind(this),
      post: this.post.bind(this),
      put: this.put.bind(this),
      patch: this.patch.bind(this),
      delete: this.delete.bind(this)
    };
  }

  send(url, method, body, headers) {
    return new Promise((resolve, reject) => {
      // request interceptors
      let allHeaders = Object.assign({}, this._public.headers);
      if (headers)
        Object.keys(headers).forEach(header => {
          allHeaders.headers[header] = headers[header];
        });
      let fullURL = `${this._global.dataRef.request.baseURL}/${url}`;
      body = JSON.stringify(body);
      // if (this._pendingRequests.includes(fullURL)) return;
      // this._pendingRequests.push(fullURL);
      const finalOptions = Object.assign(
        {
          headers: allHeaders,
          method: method.toUpperCase(),
          body: method == 'get' ? null : body
        },
        this.fetchOptions
      );
      if (this._requestIntercept) this._requestIntercept();
      fetch(fullURL, finalOptions)
        .then(async response => {
          const contentType = response.headers.get('content-type');

          // extract body
          if (contentType && contentType.indexOf('application/json') !== -1) {
            body = await response.json();
          } else {
            body = await response.text();
          }

          // history
          if (!this._saveHistory)
            this.collect({
              id: Date.now(),
              status: response.status,
              timestamp: new Date(),
              response: body
            });

          // inject headers into prototype
          let final;

          // If reponse body is an object, create a custom object with response function in prototype, so headers and the full response data can be accessed outside of this class
          if (!Array.isArray(body) && typeof body === 'object') {
            final = Object.create({
              response: () => {
                return response;
              }
            });
            for (let key of Object.keys(body)) {
              final[key] = body[key];
            }
            // if the body is not an object, we can not inject a prototype, so just return the rew body
          } else {
            final = body;
          }
          // intercept response
          if (this._responseIntercept) this._responseIntercept();

          // reject if bad response status
          if (response.ok || response.redirected) return resolve(final);

          // resolve response
          reject(final);
        })
        .catch(reject);
    });
  }

  get(url, headers) {
    return this.send(url, 'get', {}, headers);
  }
  post(url, body, headers) {
    return this.send(url, 'post', body, headers);
  }
  patch(url, body, headers) {
    return this.send(url, 'patch', body, headers);
  }
  delete(url, body, headers) {
    return this.send(url, 'delete', body, headers);
  }
  put(url, body, headers) {
    return this.send(url, 'put', body, headers);
  }
};
