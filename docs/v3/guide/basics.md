---
title: Pulse Basics
---

## Reactivity

Reactive data is state that will react to mutations in order to cause component re-renders. More traditional programming styles will use a function to "update state" (like setState in React), whereas frameworks like Vue and Pulse modify the object in such away that tracks for changes automatically, causing components that have "subscribed" to that data to re-render, as well as other interal side-effects within Pulse which will be explained later in these docs (Computed data and Watchers).

In Pulse the simplest example possible would look like this:

```js
import Pulse from 'pulse-framework';

const pulse = new Pulse({
  data: {
    something: true
  }
});
```

Changing that data can now be done as if it were a plain Javascript object:

```js
pulse.something = false;
```

The typical way to use Pulse is with another framework, learn how to intergrate this into [React]() or [Vue]() for automatic component re-renders when data changes using `mapData()`.

A manual way to listen for a state change would be using `watch()`

```js
pulse.watch('something', ({ data }) => {
    if (data.something) // do something only if true
})
```

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
