export default class Request {
  constructor({ baseURL, requestIntercept, responseIntercept, headers }) {
    this.baseURL = baseURL;
    this._requestHistory = [];
    this._pendingRequests = [];
    this.standardHeader = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Access-Control-Allow-Origin': 'https://notify.me'
      },
      credentials: 'include',
      mode: 'cors'
    };
    if (headers)
      Object.keys(headers).forEach(header => {
        this.standardHeader[header] = headers[header];
      });
  }

  send(url, method, body = {}) {
    return new Promise((resolve, reject) => {
      // request interceptors
      let finalHeaders = this.standardHeader;
      let fullURL = `${this.baseURL}/${url}`;
      body = JSON.stringify(body);
      // if (this._pendingRequests.includes(fullURL)) return;
      this._pendingRequests.push(fullURL);
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
          this._pendingRequests = this._pendingRequests.filter(
            url => url !== fullURL
          );
          // interceptor for response
          // history here
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
