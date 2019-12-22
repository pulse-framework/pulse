---
title: Modules
---

## Concept

Pulse Modules allow you to organize your codebase into sections. There are several types of module, but all extend the functionality of the Module class. The other types are [Collections]() & [Services](), though more might be added in future.

::: tip Base Module
The root of Pulse is itself a module called "base", the regular module config can be used on the root of the library object. An example of this can be found in the [Pulse Library]() documentation. Read more on the [Base Module]().
:::

Modules are comprised of the following features:

- [Data](#data) - Reactive data. `data`
- [Actions](#actions) - Named functions. `actions`
- [Watchers](#watchers) - Functions that are triggered by data mutations of the same name. `watch`
- [Computed Data](#computed-data) - Named functions that create a cached output with dep tracking. `computed`
- [Static Data](#static-data) - Non reactive data. `staticData`
- [Routes](/v2/docs/http-requests.html) - API endpoints specific to this module. `routes`
- [Persisting](/v2/docs/persisting-data.html) - Data from that module that will persist reloads. `persist`

_NOTE: the `code` at the end is the property name you'll need to use these features in a module object._

## Namespacing

Naming things is sometimes a head-scratching task for most developers, in Pulse, data, actions, computed data and static data all share the same namespace, so TLDR: don't give two things the same name in the same module!

By default, you can access everything under the module namespace, like this:

```js
module.someDataName; // reactive data
module.computedDataName; // Computed data
module.doSomething(); // an Action
module.groupName; // a group (collection only)
```

But if you prefer to separate everything by type, you can access some areas of your module like so:

```js
module.computed.computedDataName;
module.actions.doSomething();
module.groups.groupName;
```

If you're using Pulse's [request](/v2/docs/http-requests.html) API and have defined at least one route, you'll have the `routes` object in your module namespace.

If you're using a [Collection](/v2/docs/collections.html) (which extends this Module class) you'll have `groups` and `indexes` too.

## Data

To understand how data works you must first understand [Reactivity](/v2/docs/concepts.html#reactivity)

Data can be set in a module using the `data` property, for example

```js
const myModule = {
  data: {
    something: true
  }
};
```

Once you register this module in Pulse it that data will now be accesible at `pulse.myModule.something`

## Actions

Actions are simply functions within your pulse modules that can be called externally.

Actions receive the context object (see [Context Object](#context-object)) as the first parameter.

```js
actionName({ moduleOne, moduleTwo }, customParam, ...etc) {
  // do something
  moduleOne.collect
  moduleTwo.anotherAction()
  moduleTwo.someOtherData = true
};
```

## Watchers

Watchers are named functions that will run when something by the corresponding name changes within this module. For example a data property named `jeff` will trigger a watcher named `jeff` to run directly after.

```js
const myModule = {
  data: {
    jeff: true
  },
  watch: {
    jeff(context) {
      console.log('name jeff');
    }
  }
};
```

Watchers receive the context object (see [Context Object](#context-object)) as the first parameter.

WARNING: do not mutate the data you're watching from within a watcher, it will cause an ifinite loop!

## Computed Data

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

In this case the property `liveChannels` is in a module and can be found at `pulse.channels.liveChannels`

Computed functions have access to the context object (see [Context Object](/guide/context-object.html)) as the first parameter.

Computed functions can also be dependent on each other via the context object.

::: tip
Computed functions were called "filters" in 1.0, for some strange reason.
:::

## Static Data

Static data is everything it says on the tin, its data that will not trigger any changes in Pulse when mutated.

```js
const myModule = {
    data: {
        reactive: true
    }
    staticData: {
        isReactive: false
    }
}
```

Notice how I didn't use the name `reactive` again in `staticData`, since it goes under the same namespace we can't reuse that property name!
