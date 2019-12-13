---
title: HTTP Requests
---

### HTTP Requests

Pulse replaces the need to use a third party HTTP request library such as Axios. Define endpoints within your modules & collections, then easily handle the response and process response data.

The request object goes in the root of the Pulse config.

```js
  request: {
    baseURL: 'https://api.notify.me'
    headers: {
      'Access-Control-Allow-Origin': 'https://notify.me'
      //etc..
    }
  }
  // for context ...
  modules: {}
  collections: {}
  storage: {}
  //etc..
```

Now you can define a routes object in your modules & collections:

```js
routes: {
  getStuff: request => request.get('stuff/something'),
  postStuff: (request, body) => request.post('stuff/something', body)
}
```

Each route takes in the request object as the first parameter, which contains HTTP methods like, GET, POST, PATCH, DELETE etc.

Any parameters passed to the route function will be available after the "request" param.

Route functions are promises, meaning you can either use then() or async/await.

You can access routes externally or within Pulse actions.

```js
collection.routes.getStuff();
```

```js
actions: {
  doSomething({collection, routes}) {
    return routes.getStuff().then(res => {
      collection.collect(res.data)
    })
  }
}
```

The request library is an extension of a module, meaning it's built on top of the Module class. So data such as `baseURL` and the `headers` can be changed reactively.

```js
request.baseURL = 'https://api.notify.gg';

request.headers['Origin'] = 'https://notify.me';
```

## Request Interceptors

Two useful hooks to modify requests before they're sent, and the responses as they're recieved. Here's an example as used for authentication.

```js
request: {
    baseURL: 'http://localhost:3000',
    // static headers
    headers: {
      'Access-Control-Allow-Origin': 'https://notify.me',
    }
    requestIntercept({ data, accounts }) {
      // inject the auth token from a collection/module called "accounts"
      data.headers.token = accounts.jwtToken;
    },
    responseIntercept({ error }, response) {
      // if the request was not successful send to a custom error handler module
      if (!response.ok) error.handle(response.data)
    }
  },
```

Since the headers object is static, the interceptors can be used to dynamically inject data from anywhere in Pulse into your request.
