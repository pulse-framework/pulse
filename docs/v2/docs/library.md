---
title: Pulse Library
---

### Library

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

## Example structure

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

## Config Options

Pulse accepts config options as follows:

```js
import Pulse from 'pulse-framework';
import React from 'react';

const pulse = new Pulse({
    config: {
        framework: React
    }
    data: {
        something: true
    }
})
```

Below are all the config options available:

| Name                 | Type           | Description                                                                                                                                                                                                                                               | Default |
| -------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| framework            | Constructor    | Currently either `Vue` or `React`                                                                                                                                                                                                                         | `null`  |
| waitForMount         | Boolean        | Should we wait until component mounted before allowing updates?                                                                                                                                                                                           | `false` |
| autoUnmount          | Boolean        | Should Pulse automatically forget component when it unmounts?                                                                                                                                                                                             | `true`  |
| computedDefault      | any            | If a computed function returns `null` or `undefined` return this instead.                                                                                                                                                                                 | `null`  |
| logJobs              | Boolean        | Debugger: will console.log all Pulse internal runtime operations                                                                                                                                                                                          | `false` |
| baseModuleAlias      | String / FALSE | By default the root of pulse is a module named `base`, but it is not found under `pulse.base` unless this is true. You can still access properties from base on the root instance, EG: `pulse.something`, but with this you can do `pulse.base.something` | `false` |
| mapDataUnderPropName | String / FALSE | If set, Pulse will pass the component a prop under this name containing mapped properties, this is only backwards compatiblity from 1.0                                                                                                                   | `false` |
