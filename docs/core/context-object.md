---
title: Context Object
---

### Context Object

The context object allows full access to the Pulse instance and all its features. All parameters passed in the function call will be shifted one to the right to make room for the context object.

The following Pulse features receive the context object the first parameter.

- [Computed Functions](/docs/computed.html) as part of Modules
- [Actions](/docs/actions.html) as part of Modules
- [Watchers](/docs/watchers.html) as part of Modules
- [onReady]() as part of Modules
- [requestIntercept]() as part of the Request object
- [responseIntercept]() as part of the Request object

| Name                                                       | Type      | Description                                                                                     | Collection only |
| ---------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------- | --------------- |
| All modules                                                | Object(s) | For each module within Pulse, the specific context object for that module can be found by name. | false           |
| [All module methods](/v2/docs/module-methods.html)         | Functions | `forceUpdate()` & `watch()` etc..                                                               | false           |
| [All collection methods](/v2/docs/collection-methods.html) | Functions | `findById()` & `collect()` etc..                                                                | true            |
| data                                                       | Object    | The local data for the current module.                                                          | false           |
| routes                                                     | Object    | The local routes for the current module.                                                        | false           |
| actions                                                    | Object    | The local actions for the current module.                                                       | false           |
| computed                                                   | Object    | The local computed values for the current module.                                               | false           |
| groups                                                     | Object    | The local groups for the current collection.                                                    | true            |
| indexes                                                    | Object    | The local indexes for the current collection.                                                   | true            |
| services                                                   | Object    | The services object                                                                             | false           |
| utils                                                      | Object    | The utils object                                                                                | false           |

This is just a style tip but we typically deconstruct the context object like follows:

```js
const actionName = ({ data }, customParam) => {
  data.boof = 'pack' + customParam1;
  return data.boof;
};
```

Usage:

```js
pulse.actionName(customParam);
```

You can have as many custom parameters as you need, like a regular function.

You can mutate data on the context object, just avoid doing that in Computed functions— and never mutate the same piece of data in a watcher that the watcher is watching as you will consequently create a paradox and all life as we know it will be sucked into the void.
