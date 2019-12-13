---
title: Pulse Library
---

The "Library" refers to the Pulse configuration files, this is where you define and configure modules, collections and all other Pulse config. Although, once initialzed using `new Pulse()` we typically refer to the instance as the "core".

The Library itself is an object, the `Pulse` constructor takes it as the only parameter. Below is a basic configuration example.

_Note: not all features are used in this example:_

```js
import Pulse from 'pulse-framework';
import React from 'react';

import collections from './collections';
import modules from './modules';
import services from './services';
import storage from './storage';
import * as utils from './utils';

export default new Pulse({
  config: {
    framework: React,
    computedDefault: {}
  },
  request: {
    baseURL: 'https://api.notify.me',
    headers: {}
  },
  data: {
    isAuthenticated: false,
    environment: 'mobile'
  },
  collections,
  modules,
  storage,
  services,
  utils,
  jobs
});
```

::: tip Tip
We export the initialized Pulse so that it can be imported into our components, which is necessary in React though not so much in Vue.
:::

For small applications you can keep this in one or two files, but a medium to large application building out a file structure like this might be preferred:

```
├── core
|   ├── index.js
|   ├── request.js
|   ├── collections
    |   ├── channels
    |   |   └── index.js
    |   |   └── channel.collection.js
    |   |   └── channel.actions.js
    |   |   └── channel.filters.js
    |   |   └── channel.model.js
|   ├── services
|   |   └── ...
|   ├── utils
|   |   └── ...

```

You're free to do whatever suits your project.

### All possible config properties

// table here
