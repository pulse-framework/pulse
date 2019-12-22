---
title: Pulse Concepts
---

## Structure

Pulse was designed to take all business logic out of components, meaning your React/Vue/Angular components are essencially puppets for Pulse to orchestrate. The benifit of keeping logic seperate to visual components is versitility, upgradablity and cleanliness. An example would be with Notify's codebase, we built most of our app using Pulse in a repository called "core" and then our components are mostly markup, css and a router file. Both our mobile app in React Native and our webapp in Vue behave exactly the same aside from a few visual differences, as both use the core.

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

The typical way to use Pulse is with another framework, learn how to intergrate this into [React]() or [Vue]() for automatic component re-renders when Pulse data changes.

A manual way to listen for a state change would be using `watch()`

```js
pulse.watch('something', ({ data }) => {
    if (data.something) // do something only if true
})
```
