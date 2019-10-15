---
title: Mutating Data
---

### Mutating Data

Changing data in Pulse is easy, you just set it to a new value.

```js
collection.currentlyEditingChannel = true;
```

We don't need mutation functions like VueX's "commit" because we use Proxies to intercept changes and queue them to prevent race conditions. Those changes are stored and can be reverted easily. (Intercepting and queueing coming soon)
