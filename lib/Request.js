import Collection from './Collection';

export default class Request extends Collection {
  constructor(
    global,
    {
      // request specific
      baseURL,
      requestIntercept,
      responseIntercept,
      headers
    }
  ) {
    // Before we invoke the parent class, we define some defaults
    let groups = ['history'];

    // Invoke the parent
    super({ name: 'request', global }, { groups });

    // inside super you need the class constructor datas
    // this._pendingRequests = this._global.dataRef.base.pendingRequests;
    let pendingRequests = [];
    this.standardHeader = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      credentials: 'include',
      mode: 'cors'
    };
    if (headers)
      Object.keys(headers).forEach(header => {
        this.standardHeader[header] = headers[header];
      });

    this._global.request = {
      get: this.get.bind(this),
      post: this.post.bind(this),
      put: this.put.bind(this),
      patch: this.patch.bind(this),
      delete: this.delete.bind(this)
    };
  }

  send(url, method, body = {}) {
    return new Promise((resolve, reject) => {
      // request interceptors
      let finalHeaders = this.standardHeader;
      let fullURL = `${this._global.dataRef.base.requestURL}/${url}`;
      body = JSON.stringify(body);
      // if (this._pendingRequests.includes(fullURL)) return;
      // this._pendingRequests.push(fullURL);
      fetch(fullURL, {
        ...finalHeaders,
        method,
        body: method == 'get' ? null : body
      })
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
          console.log('[API RESPONSE]', finalRes);
          this.collect(
            {
              id: Date.now(),
              status: finalRes.status,
              timestamp: new Date(),
              response: finalRes
            },
            'history'
          );
          resolve(finalRes);
        })
        .catch(reject);
    });
  }

  get(url) {
    return this.send(url, 'get');
  }
  post(url, body) {
    return this.send(url, 'post', body);
  }
  patch(url, body) {
    return this.send(url, 'patch', body);
  }
  delete(url, body) {
    return this.send(url, 'delete', body);
  }
  put(url, body) {
    return this.send(url, 'put', body);
  }
}
