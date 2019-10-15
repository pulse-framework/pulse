---
title: Filters
---

### Filters

Filters allow you to alter data before passing it to your component without changing the original data. Essentially getters in VueX.

They're cached for performance, meaning the output of the filter function is what gets served to the component, so each time it is accessed the entire filter doesn't need to re-run.

Each filter is analyzed to see which data properties they depend on, and when those data properties change the appropriate filters regenerate.

```js
channels: {
  groups: ['subscribed'],
  filters: {
    liveChannels({ groups }) => {
      return groups.subscribed.filter(channel => channel.live === true)
    }
  }
}
```

Filters have access to the context object (see [Context Object](/guide/context-object.html)) as the first parameter.

Filters can also be dependent on each other via the context object.
