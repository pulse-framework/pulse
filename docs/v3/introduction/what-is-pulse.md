---
title: Welcome
---

<br />
<br />

## Introduction

# Pulse Framework `3.0`

Created by [@jamiepine](https://twitter.com/jamiepine)

> _Pulse is a global state and logic framework for reactive TypeScript & Javascript applications. Supporting frameworks like VueJS, React and React Native._

<!-- Using HTML instead of Markdown links because they get themed with an 'external' badge -->
<!-- TODO: Figure out if there's a way to remove the external badge so we can use sane syntax -->
<a href="https://discord.gg/RjG8ShB" target="_blank">
  <img src="https://discordapp.com/api/guilds/658189217746255881/embed.png" alt="Join Discord"></a>
<a href="https://twitter.com/pulseframework" target="_blank">
  <img src="https://img.shields.io/twitter/follow/pulseframework.svg?label=Pulse+on+Twitter" alt="Follow Pulse on Twitter"></a>
<a href="https://twitter.com/jamiepine" target="_blank">
  <img src="https://img.shields.io/twitter/follow/jamiepine.svg?label=Jamie+on+Twitter" alt="Follow Jamie Pine on Twitter"></a>

<!-- [![Join Discord](https://discordapp.com/api/guilds/658189217746255881/embed.png)](https://discord.gg/RjG8ShB)
[![Follow Pulse on Twitter](https://img.shields.io/twitter/follow/pulseframework.svg?label=Pulse+on+Twitter)](https://twitter.com/pulseframework)
[![Follow Jamie Pine on Twitter](https://img.shields.io/twitter/follow/jamiepine.svg?label=Jamie+on+Twitter)](https://twitter.com/jamiepine) -->

```ts
const App = new Pulse();

const Hello = App.State('the sound of music');
```

Lightweight, modular and powerful. An alternative to `Redux`/`VueX`/`MobX` and request libraries such as `Axios`/`Request.js`. Use Pulse to create a **_core_** state & logic library for your application; plug and play directly into any UI Framework.

## Why Pulse?

Pulse provides a clean-cut toolset to build a Javascript application quickly and efficiently. It encourages developers to construct a core library that can be dropped into any UI framework. Your `core` is the brain of your application, it will handle everything from state management, API requests to all logic and calculations. Pulse will supply pre-computed data to your UI components, in the framework of your choice with complete reactivity.

### TypeScript

Pulse is written in TypeScript and is designed to support it heavily. Everything is type safe out of the box and encourages you to write clean typed code, however Pulse can still be used without TypeScript.

## Quick Walk-Through

### :zap: **State** — [App.State()]()

A handy container to store, manipulate and relate data.

```ts
const MY_STATE = App.State(true);
```

...with a range of chainable methods.

```js
MY_STATE.toggle().persist().set().type().watch().reset().undo(); // etc...
```

### :robot: Computed State — [App.Computed()]()

Computed State is an extension of State. It computes a value from a function that you provide, and caches it to avoid unnecessary recomputation.

```ts
const MY_COMPUTED = App.Computed(() => !!MY_STATE.value);
```

It will magically recompute when it's dependencies change and can track dependencies automatically or manually.

### :sparkles: Collections — [App.Collection()]()

A DB/ORM-like class for front-end data collection.

Collections are designed for arrays of data following the same structure, usually returned from an API. They have handy features to work with that data and act as a single source of truth.

```ts
const AccountCollection = App.Collection()();

AccountCollection.collect(data);
```

### :sparkles: Groups — [Collection.Group()]()

Groups handy to provide arrays of collection data and can be used independently in your components.

```ts
const AUTHED = AccountCollection.Group([1, 2, 3]);

AUTHED.output; // [{ id: 1, ...}...]
```

When the index of a Group is modified, it will "rebuild" the `output` with actual collection data.

### :telephone_receiver: Promise based HTTP request API — [App.API()]()

Create an API instance to make requests.

```ts
const API = App.API({
  baseURL: 'https://my.api.me',
  timeout: 10000,
  options: { credentials: 'include' }
});
```

Create routes for your API as functions.

```ts
const GetAccount = async () => (await API.get('/account')).data;
```

### :floppy_disk: Persisted Storage API — [App.Storage()]()

```ts
// localStorage is automatic, so here's a custom example
App.Storage({
  async: true,
  get: AsyncStorage.getItem,
  set: AsyncStorage.setItem,
  remove: AsyncStorage.removeItem
});
```

### :timer_clock: Turn back the clock — [State.undo()]()

```ts
const MY_STATE = App.State('hello');

MY_STATE.set('bye');

MY_STATE.undo();

MY_STATE.value; // Expected Output: "hello"
```

### :bus: Events — [App.Event()]()

```ts
const ALERT = App.Event();

ALERT.emit({ message: 'notify events best events!' });
ALERT.on(renderAlert);

useEvent(ALERT, renderAlert); // React Hook with auto cleanup!

ALERT.onNext(() => {}) // onetime-use callback useful for event chaining.
```

### :hourglass_flowing_sand: [WIP] CRON Jobs — [App.Job()]()

```ts
App.Job(60000, () => {
  // do something
}).start();
```

### :first_quarter_moon: Lifecycle hooks — [State.watch()]() / [App.onReady()]() / [App.nextPulse()]()

```ts
MY_STATE.watch('name', () => {
  // do something when MY_STATE changes
});
```

### :construction: Task queuing for race condition prevention
```ts
App.runtime
```

### :closed_book: [WIP] Error handling
A global error handler can be very useful, this is a basic example. App.Action() uses this automatically.
```ts
// Set up error handler
App.onError((error, config) => {
  console.error('uh oh', error)
})
// Usage
try {
// do stuff here
} catch (e) {
  App.Error(e, { quiet: true });
}
```

### :leaves: Lightweight (only 37KB) with 0 dependencies

### :fire: Supports Vue, React, React Native and NextJS
```ts
yarn add @pulsejs/core // install the Pulse core

yarn add @pulsejs/react // React integration
yarn add @pulsejs/vue // Vue integration
yarn add @pulsejs/next // Next integration
```
### :yellow_heart: Well documented (I'm getting there...)
