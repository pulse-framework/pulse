---
title: Authentication
---

## Basic authentication

Assuming you use a JWT as a Bearer token, this example shows simple login functionality in pulse

```js
import Pulse from 'pulse-framework';

const core = new Pulse({
  // settings for the request
  request: {
    baseURL: 'https://api.mysite.com',

    // do something before each request
    requestIntercept({ base }, options) {
      options.headers.token = `Bearer ${base.token}`;
    },

    // do something after each request
    responseIntercept({ base }, response) {
      if (response.status === 401) base.isAuthenticated = false;
    }
  },
  modules: {
    auth: {
      data: {
        token: null,
        isAuthenticated: false
      },
      persist: ['token'],
      routes: {
        login: (request, creds) => request.post('login', creds)
      },
      actions: {
        login({ routes, data }, creds) {
          return routes.login(creds).then(res => (data.token = res.token));
        }
      }
    }
  }
});

// Call login
core.login({ username: 'jamie', password: 'jeff' });
```
