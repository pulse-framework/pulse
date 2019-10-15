---
title: Persisting Data
---

### What is Persisting?

It's a common need for applications to store little pieces of data on the clients browser, Pulse makes it beyond easy to achieve this. Simply putting the name of a data property in the `persist` array on your collection will store it in local storage. On initialization properties saved in local storage will automatically be loaded back into state.

```js
collection: {
  data: {
    haha: true;
  }
  persist: ['haha'];
}
```

Pulse will only save the data property into local storage if it has been set to something other than the original value defined in the collection.

::: tip Note
Currently it is not possible to persist data collected using the `collect` method, this would be better suited for "indexed storage", as local storage requires stringifying the data. If you need this functionality consider opening an issue or making a PR yourself.
:::
Pulse integrates directly with local storage and session storage, and even has an API to configure your own storage.

```js
{
  collections: {...}
  // use session storage
  storage: 'sessionStorage'
  // use custom storage
  storage: {
    async: false,
    set: ...
    get: ...
    remove: ...
    clear: ...
  }
}
```

Local storage is the default and you don't need to define a storage object for it to work.

::: warning React Native & non browser users:
Some environments, such as React Native, do not have local storage. You must bind a custom storage solution as shown above, in React Native you can use Async Storage. If your storage solution is asyncronous, you can toggle that there to be sure, otherwise Pulse will attempt to detect it.
:::

More features will be added to data persisting soon, such as persisting entire collection data, custom storage per collection and more configuration options.
