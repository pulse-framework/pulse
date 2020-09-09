---
title: Pulse Library
---

# Pulse Library

The "Library" refers to the Pulse configuration files, this is where you define and configure collections and basic config for everything within Pulse.

The library itself is an object, the `Pulse.Library` constructor takes it as the only parameter.

```js

import Pulse from 'pulse-framework'

export default new Pulse.Library({
    config: {
        framework: 'vue'
    }
    collections: {
        // A collection named "test"
        test: {
            data: {
                hi: true
            },
            actions: {
                doSomething({ data }) {
                    return data.hi
                }
            }
        }
    }
})

```

::: tip Tip
We export the initialized Pulse library so that it can be imported into our components, which is necessary in React though not so much in Vue.
:::

For small applications you can keep this in one or two files like shown above, but a medium to large application building out a file structure like this might be preferred:

```
├── library
|   ├── index.js
|   ├── request.js
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

### Tree example

This is everything currently supported by the Pulse Library and how it fits in the object tree, use this as a reference when building your library to ensure you put everything in the right place.

```js
const pulse = new Pulse.Library({
  collections: {
    collectionOne: {},
    collectionTwo: {
      // example
      model: {},
      data: {},
      groups: [],
      persist: [],
      routes: {},
      actions: {},
      filters: {},
      watch: {}
    },
    collectionThree: {}
    //etc..
  },
  request: {
    baseURL: 'https://api.notify.me',
    headers: []
  },
  services: {}, // coming soon
  utils: {}, // coming soon
  jobs: {}

  // base
  model: {},
  data: {},
  groups: [],
  persist: [],
  routes: {},
  actions: {},
  filters: {},
  watch: {}
});
```
