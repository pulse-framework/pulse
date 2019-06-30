---
title: Authentication
---

## Basic authentication

- Assuming you use a JWT as a Bearer token.
- Remember in Pulse, "base" is the name of the root collection.
- Actions, watchers, requestIntercept and responseIntercept all recieve the "context" object as the first parameter, allowing full access to anything within Pulse
- Watchers can watch data, groups or filters, they should be the same name as the thing you're watching, whenever they change the watch function will run.

```js
import Pulse from 'pulse-framework';

const core = new Pulse.Library({
  // settings for the request
  request: {
    baseURL: 'https://api.mysite.me',

    // do something before each request
    requestIntercept({ base }, options) {},

    // do something after each request
    responseIntercept({ base }, response) {
      if (response.status === 401) base.isAuthenticated = false;
    }
  },
  // define a route for login
  routes: {
    login: (request, creds) => request.post('login', creds)
  },
  data: {
    token: null
  },
  persist: ['token'],
  watch: {
    // when the token changes, update the request handler
    token({ data, request }) {
      request.headers.Bearer = `Bearer ${data.token}`;
    }
  },
  actions: {
    // this action calls the login route, then saves the token to the data
    login({ routes, data }, creds) {
      return routes.login(creds).then(res => (data.token = res.token));
    }
  }
});

// Call login
core.base.login({ username: 'jamie', password: 'jeff' });
```