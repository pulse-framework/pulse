---
title: Welcome
---

<br />
<br />

## Introduction

# Pulse Framework `3.0`

Created by [@jamiepine]() | Sponsored and maintained by the [Notify Team]()

> _Pulse is a global state and logic framework for reactive Typescript & Javascript applications. Supporting frameworks like VueJS, React and React Native._

<p align="left">
  <a href="https://discord.gg/RjG8ShB"><img src="https://discordapp.com/api/guilds/658189217746255881/embed.png" alt="Join Discord"></a>
  <a href="https://patreon.com/jamiepine"><img src="https://img.shields.io/badge/donate-patreon-F96854.svg" alt="Donate on patreon"></a>
  <a href="https://twitter.com/jamiepine"><img src="https://img.shields.io/twitter/follow/jamiepine.svg?label=Jamie's Twitter" alt="Follow on twitter"></a>
  <a href="https://twitter.com/pulseframework"><img src="https://img.shields.io/twitter/follow/pulseframework.svg?label=Pulse+Twitter" alt="Follow Pulse on twitter"></a>
</p>

```ts
const App = new Pulse();

const Hello = App.State<string>('the sound of music');
```

Lightweight, modular and powerful. An alternative to `Redux`/`VueX`/`MobX` and request libraries such as `Axios`/`Request.js`. Use Pulse to creare a **_core_** state & logic library for your application; plug and play directly into any UI Framework.

## Why Pulse?

Pulse provides a clean-cut toolset to build a Javascript application quickly and efficiently. It encourges developers to construct a core library that can be dropped into any UI framework. Your `core` is the brain of your application, it will handle everything from state management, API requests to all logic and calculations. Pulse will supply pre-computed data to your UI components, in the framework of your choice with complete reactivity.

### Typescript

Pulse is written in Typescript and is designed to support it heavily. Everything is type safe out of the box and encourages you to write clean typed code.

## Quick Walk-Through

### :zap: **State** — [App.State()]()

A handy container to store, manipulate and relate data.

```ts
const MY_STATE = App.State<boolean>(true);
```

...with a range of chainable methods.

```js
MY_STATE.toggle().persist().set().type().watch().reset().undo(); // etc...
```

### :robot: Computed State — [App.Computed()]()

A function in which the return value is cached inside an extended State instance. Will magically recompute when it's dependencies change. Can track dependencies automatically or manually.

```ts
const MY_COMPUTED = App.Computed<boolean>(() => MY_STATE.toggle());
```

### :sparkles: Collections — [App.Collection()]()

A DB/ORM-like class for front-end data collection.

Collections are designed for arrays of data following the same structure, usually returned from an API. They have handy features to work with that data and act as a single source of truth.

```ts
const AccountCollection = App.Collection()();

AccountCollection.collect(data);
```

### :sparkles: Groups — [Collection.Group()]()

Groups handy to provide arrays of collection data and can be used independently in your components. When the index of a group is modified, it will "rebuild" the `output` with actual collection data.

```ts
const AccountCollection = App.Collection<DataType>()((Collection) => {
  groups: {
    AUTHED: Collection.Group();
  }
});

AccountCollection.groups.AUTHED.output; // cached data
```

### :telephone_receiver: Promise based HTTP request API — [App.API()]()

```ts
const API = App.API({
  baseURL: 'https://my.api.me',
  timeout: 10000,
  options: { credentials: 'include' }
});
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

### :bus: Event bus — [App.on()]()

```ts
App.on('EVENT_NAME', (payload) => {
  // do something
});

App.emit('EVENT_NAME', payload);
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

App.nextPulse(() => {
  MY_STATE.removeWatcher('name');
});
```

### :construction: Task queuing for race condition prevention

### :closed_book: [WIP] Error logging & snapshot bug reporting

### :leaves: Lightweight (only 100KB) with 0 dependencies

### :fire: Supports Vue, React and React Native `usePulse()`

### :yellow_heart: Well documented (I'm getting there...)
