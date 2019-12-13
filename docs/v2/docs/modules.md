---
title: Modules
---

## Concept

Pulse Modules allow you to organize your codebase into sections. There are several types of module, but all extend the functionality of the Module class. The other types are [Collections]() & [Services](), though more might be added in future.

::: tip Base Module
The root of Pulse is itself a module called "base", the regular module config can be used on the root of the library object. An example of this can be found in the [Pulse Library]() documentation. Read more on the [Base Module]().
:::

Modules are comprised of the following features:

- [Data]() - Reactive data.
- [Actions]() - Named functions.
- [Computed Functions]() - Named functions that create a cached output with dependency tracking.
- [Watchers]() - Functions that are triggered by data mutations of the same name.
- [Routes]() - API endpoints specific to this module.
- [Persisting]() - Data from that module that will persist reloads. 
- [Static Data]() - Non reactive data.


## Namespacing

By default, you can access everything under the collection namespace, like this:

```js
collection.someDataName;
collection.computedDataName;
collection.doSomething();
collection.groupName; // collection only
```

But if you prefer to separate everything by type, you can access some areas of your module like so:

```js
collection.computed.computedDataName;
collection.actions.doSomething();
collection.groups.groupName; // collection only
```

For groups, if you'd like to access the raw array of primary keys, instead of the constructed data you can under `indexes`. Which is also reactive, so you can mutate the index and it will subsquently regen the corresponding group to reflect the index.

```js
collection.indexes.groupName; // EG: [ 123, 1435, 34634 ]
```


