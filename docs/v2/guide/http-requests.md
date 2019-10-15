---
title: HTTP Requests
---

### HTTP Requests

Pulse completely replaces the need to use a third party HTTP request library such as Axios. Define endpoints within your collection and easily handle the response and collect the data.

First you must define your `baseURL` in the request config (in the root of your Pulse library):

```js
  request: {
    baseURL: 'https://api.notify.me'
    headers: {
      'Access-Control-Allow-Origin': 'https://notify.me'
      //etc..
    }
  }
  // for context ...
  collections: {}
  storage: {}
  //etc..
```

Now you can define routes in your collections:

```js
routes: {
  getStuff: request => request.get('stuff/something');
}
```

Each route takes in the request object as the first parameter, which contains HTTP methods like, GET, POST, PATCH, DELETE etc.

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

The request library is an extension of a collection, meaning it's built on top of the collection class. It's exposed on the instance the same way as a collection, data such as `baseURL` and the `headers` can be changed on the fly.

```js
request.baseURL = 'https://api.notify.gg';

request.headers['Origin'] = 'https://notify.me';
```

Request history is saved (collected) into the request collection by default, though this can be disabled:

```js
request: {
  saveHistory: false;
}
```

HTTP requests will eventually have many more useful features, but for now basic function is implemented.
