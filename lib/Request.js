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
      let finalResponse = {};
      if (this._requestIntercept) this._requestIntercept();
      fetch(fullURL, finalOptions)
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
          finalResponse = response;
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.indexOf('application/json') !== -1) {
            return response.json();
          } else {
            return response.text();
          }
        })
        .then(responseBody => {
          // this._pendingRequests = this._pendingRequests.filter(
          //   url => url !== fullURL
          // );
          // interceptor for response
          // history here
          this.collect({
            id: Date.now(),
            status: responseBody.status,
            timestamp: new Date(),
            response: responseBody
          });
          if (
            responseBody.status &&
            responseBody.status.code &&
            (responseBody.status.code.toString().startsWith('4') ||
              responseBody.status.code.toString().startsWith('5'))
          )
            reject(responseBody);
          let final = Object.create({
            response: header => {
              return finalResponse;
            }
          });
          for (let key of Object.keys(responseBody)) {
            final[key] = responseBody[key];
          }
          if (this._responseIntercept) this._responseIntercept();
          resolve(final);
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
