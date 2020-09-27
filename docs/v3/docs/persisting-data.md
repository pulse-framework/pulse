---
title: Persisting Data
---

# Persisting Data

It's common for applications to store data on the client browser, Pulse makes it easy to achieve this. On refresh the State value will magically load if present in storage.

```js
const MY_STATE = App.State('hello').persist('storage-key-here');
```

## Configuration

Configuration is optional. In browser environments Pulse automatically integrates with the local storage API and so calling `State.persist()` just works.

```js
const App = new Pulse();

App.Storage({
    prefix: 'my_app' // custom storage key prefix (optional)
    async: false,
    set: ...
    get: ...
    remove: ...
});
```

::: tip Note
Currently it is not possible to persist data Collection data. If you need this functionality consider helping design it, join our [Discord](https://discord.gg/KvuJva)
:::

::: warning React Native & non browser users:
Some environments, such as React Native, do not have local storage. You must bind a custom storage solution as shown above, in React Native you can use `AsyncStorage`.
:::

More features will be added to data persisting soon, such as persisting entire collection data, custom storage per collection and more configuration options.
