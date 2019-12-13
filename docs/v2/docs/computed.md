---
title: Computed Data
---

### Computed Data

**Computed functions use the output of a named function as read-only state.**

Pulse properties accessed from inside that function will be tracked as dependencies, so when that data is mutated Pulse will circle back with that Computed function causing it re-run.

Components can use computed functions without needing to re-compute that computed function each time the value is accessed. This leads to less compute opperations resulting in better performance of your application.

```js
channels: {
  groups: ['subscribed'],
  computed: {
    liveChannels({ groups }) => {
      return groups.subscribed.filter(channel => channel.live === true)
    }
  }
}
```

In the above function, the group `subscribed` will be tracked as a dependency, so if the group changes, Pulse will re-run `liveChannels`.

In this case the property `liveChannels` is in a collection and can be found at `pulse.channels.liveChannels`

Computed functions have access to the context object (see [Context Object](/guide/context-object.html)) as the first parameter.

Computed functions can also be dependent on each other via the context object.

::: tip
Computed functions were called "filters" in 1.0, for some strange reason.
:::
