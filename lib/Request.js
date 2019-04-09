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
      headers
    }
  ) {
    // Before we invoke the parent class, we define some defaults
    let groups = [];
    let persist = ['baseURL'];
    let data = {
      baseURL,
      mode: 'cors',
      credentials: 'include'
    };

    if (!baseURL) data.baseURL = null;

    // Invoke the parent
    super({ name: 'request', global }, { groups, data, persist });

    // inside super you need the class constructor datas
    // this._pendingRequests = this._global.dataRef.base.pendingRequests;
    let pendingRequests = [];
    this.standardHeader = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    };

    if (credentials) data.credentials = credentials;
    if (mode) data.mode = mode;

    this.standardHeader.credentials = data.credentials;
    this.standardHeader.mode = data.mode;
    if (headers)
      Object.keys(headers).forEach(header => {
        this.standardHeader.headers[header] = headers[header];
      });

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
      let allHeaders = this.standardHeader;
      if (headers)
        Object.keys(headers).forEach(header => {
          allHeaders.headers[header] = headers[header];
        });
      let fullURL = `${this._global.dataRef.request.baseURL}/${url}`;
      body = JSON.stringify(body);
      // if (this._pendingRequests.includes(fullURL)) return;
      // this._pendingRequests.push(fullURL);
      const finalHeaders = Object.assign(allHeaders, {
        method: method.toUpperCase(),
        body: method == 'get' ? null : body
      });
      fetch(fullURL, finalHeaders)
        .then(response => {
          // if weird status reject()
          // historic status
          // if (res.status >= 200 && res.status < 300) {
          //   return res;
          // } else {
          //   let err = new Error(res.statusText);
          //   err.response = res;
          //   throw err;
          // }
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.indexOf('application/json') !== -1) {
            return response.json();
          } else {
            return response.text();
          }
        })
        .then(finalRes => {
          // this._pendingRequests = this._pendingRequests.filter(
          //   url => url !== fullURL
          // );
          // interceptor for response
          // history here
          this.collect({
            id: Date.now(),
            status: finalRes.status,
            timestamp: new Date(),
            response: finalRes
          });
          if (
            finalRes.status &&
            finalRes.status.code &&
            (finalRes.status.code.toString().startsWith('4') ||
              finalRes.status.code.toString().startsWith('5'))
          )
            reject(finalRes);
          resolve(finalRes);
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
