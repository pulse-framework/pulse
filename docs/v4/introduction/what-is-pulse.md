---
title: Welcome
---

<br />
<br />

## Introduction

# Pulse `v4.0`

Created by [@jamiepine](https://twitter.com/jamiepine)

Pulse is a global state and logic framework for reactive TypeScript & Javascript applications. Supporting frameworks like VueJS, React and React Native.
```ts
import { state } from '@pulsejs/core';

const hello = state('the sound of music');
```
<br/>

<!-- Using HTML instead of Markdown links because they get themed with an 'external' badge -->
<!-- TODO: Figure out if there's a way to remove the external badge so we can use sane syntax -->
<a href="https://npm.im/@pulsejs/core">
  <img src="https://img.shields.io/npm/dm/pulse-framework.svg" alt="npm nonthly downloads"></a>
<a href="https://npm.im/@pulsejs/core">
  <img src="https://img.shields.io/npm/dt/pulse-framework.svg" alt="npm total downloads"></a>
<a href="https://discord.gg/RjG8ShB" target="_blank">
  <img src="https://discordapp.com/api/guilds/658189217746255881/embed.png" alt="Join Discord"></a>
<a href="https://twitter.com/pulseframework" target="_blank">
  <img src="https://img.shields.io/twitter/follow/pulseframework.svg?label=Pulse+on+Twitter" alt="Follow Pulse on Twitter"></a>
<a href="https://twitter.com/jamiepine" target="_blank">
  <img src="https://img.shields.io/twitter/follow/jamiepine.svg?label=Jamie+on+Twitter" alt="Follow Jamie Pine on Twitter"></a>

<!-- [![Join Discord](https://discordapp.com/api/guilds/658189217746255881/embed.png)](https://discord.gg/RjG8ShB)
[![Follow Pulse on Twitter](https://img.shields.io/twitter/follow/pulseframework.svg?label=Pulse+on+Twitter)](https://twitter.com/pulseframework)
[![Follow Jamie Pine on Twitter](https://img.shields.io/twitter/follow/jamiepine.svg?label=Jamie+on+Twitter)](https://twitter.com/jamiepine) -->



## Motivation
Most state libraries come along with complex syntax, confusing terminology and lack functionality out of the box. Pulse gets straight to the point providing not only the tools needed to create small and large scale applications, but also a structure to ensure you follow best practices.  

### Primary concepts 
- Business logic should be separated from UI components*.
- Data should be stored in one place, as a single source of truth.
- Business logic should be separated by the data it supports.
- State should be both mutable and immutable, but clearly differentiated.
- Code should be simple, readable and upgradable.

While Pulse is modular, and you can use it selectively anywhere, its best used to create a `core`; we define this as a singular application, class or object that contains all the state, actions, data models and request handlers for your application.

::: tip Native support for TypeScript
Pulse is written in TypeScript and is designed to support it heavily. Everything is typesafe out of the box resulting in maintainable and predictable code, however Pulse can still be used without TypeScript.
:::

_*In small scale applications you might not need to separate business logic, and other solutions such as [React Query]() might be better suited. You should make this decision based on if you intend to use your core in multiple projects, or you want the freedom to replace components or even your entire UI in the future._


### It could look something like this...
In this example we create a data model, a collection to store data to fit that model, a route to fetch data and an action to tie it all together.

_[Skip ahead]() for a breakdown on the individual concepts._
```ts
import { state, computed, route, action, model } from '@pulsejs/core'

// describe a data structure
export const User = model.create({
  id: model.primaryKey(),
  username: model.string().min(3).max(20),
  verified: model.bool().optional()
})

// create a collection to store users
export const users = collection(User)

// define API routes to query relevant data
export const routes = {
  getUser: route({ method: 'GET', endpoint: 'user/:user_id' })
}

// define an action to get the user
export const getUser = action(async ({ onCatch }, userId) => {
  onCatch(console.error)

  const user = await routes.getUser({ params: { user_id: userId } })

  users.collect(user)
});
```

For Typescript users, the collection is completely type-safe and inferred directly from the model.
```ts
type User = {
  id: string;
  username: string;
  verified?: boolean;
}
```

This is but a small example of the power of Pulse, lets go over a few more features before you dive into the rest of the documentation.

## Quick Walk-Through

### :zap: **State** 

A handy container to store, manipulate and relate data. 

State is the foundation of Pulse with many other features extending the functionality of State.

```ts
import { state } from '@pulsejs/core';

const MyState = state(true);

MyState.value // true
```

State comes with a range of chainable methods.

```js
MyState.toggle().persist().set().type().watch().reset().undo(); // etc...
```

### :six_pointed_star:   React Integration
usePulse, one among many custom hooks provided by Pulse, allowing React components to subscribe to State changes. It also works with Computed State, Collections, Data, Groups and Selectors.
```ts
const MyState = state('hi');

function MyReactComponent() {
  const myStateValue = usePulse(MyState)

  return <h1>{myStateValue}</h1>;
}
```

### :robot: Computed State

Computed State is an extension of State. It computes a value from a function that you provide, and caches it to avoid unnecessary recomputation.

```ts
const MyComputedState = computed(() => !!MyState.value);
```

It will magically recompute when it's dependencies change and can track dependencies automatically or manually.

### :sparkles: Collections

A DB/ORM-like class for front-end data collection.

Collections are designed for arrays of data following the same structure, usually returned from an API. They have handy features to work with that data and act as a single source of truth.

```ts
const UserCollection = collection<DataType>({ primaryKey: 'id' });

const users = [
    { id: 1, username: 'jamie' },
    { id: 2, username: 'notify' }
]

UserCollection.collect(users);

UserCollection.items; // user[]
```

### :sparkles: Groups 

Groups handy to provide arrays of collection data and can be used independently in your components.

```ts
const UserCollection = collection({
  groups: ['mine', 'following']
})

UserCollection.collect(data, ['mine']); 

UserCollection.selectors.mine.output; // [{ id: 1, ...}...]
```
_Groups work with usePulse()_

When the index of a Group is modified, it will "rebuild" the `output` with actual collection data.

### :sparkles: Selectors 

Groups handy to provide arrays of collection data and can be used independently in your components.

```ts
const UserCollection = collection({
  selectors: ['current']
})

UserCollection.selectors.current.select(2);

UserCollection.selectors.current //
```
_Selectors work with usePulse()_

When the index of a Group is modified, it will "rebuild" the `output` with actual collection data.

### :telephone_receiver: Query Client

Create an Query Client instance to make requests.

```ts
import { createQueryClient } from '@pulse/core';
import Axios from 'axios';

createQueryClient({
  use: Axios,
  baseURL: state('https://api.notify.me')
  headers: {
    Authorization: state((token) => `Bearer ${token}`)
  }
})
```

### :warning: Error handling
Create a global error handler to make sense of errors.

```ts
import { createErrorHandler } from '@pulse/core';

createErrorHandler((e, context) => {
  const error = {};

  // some very simplified error parsing...
  if (e.message) error.message = e;
  if (e.code) error.code = e;

  return error
})
```
The return value must always fit the typing of `ErrorDetails`, so that all subsequent handlers are dealing with the same data structure.

### :floppy_disk: Persistance
localStorage integration is automatic, so here's a custom example.
```ts
import { createStorage } from '@pulsejs/core';

createStorage({
  async: true,
  get: AsyncStorage.getItem,
  set: AsyncStorage.setItem,
  remove: AsyncStorage.removeItem
});
```

### :timer_clock: Turn back the clock 
State remembers its previous state, and can be reverted at anytime.
```ts
const myState = state(true).set(false);

myState.undo();

myState.value; // true
```
To take that a step further, combined with actions we can track batches of state changes and undo them if something didn't go to plan...
```ts
import { state, action, batch } from '@pulsejs/core';

const myAction = action(async ({ onCatch, undo }) => {
  onCatch(undo)

  // respond immediately to interaction by mutating local state
  batch(() => {
    something.state.myState.set(123);
    something.collection.put(1, 'newGroup');
  })
  
  // if the asynchronous request below throws an error, onCatch is triggered and the changes are reverted
  const data = await sendSomeAsyncData();
})
```

### :bus: Events
```ts
import { event } from '@pulsejs/core';
 
const Alert = event<EventPayload>();

Alert.emit({ message: 'notify events best events!' });
Alert.on(renderAlert);

// React Hook with auto cleanup!
useEvent(Alert, (payload) => {
  // render some ui stuff...
  console.log(payload.message);
}); 

Alert.onNext(() => {}) // one-time use callback
```

### :bus: Controllers
```ts
import { Controller, state, computed, route, action } from '@pulsejs/core';
 
class MyController extends Controller {
  constructor () {
    super();
  }

  // define a collection, or many—its up to you!
  public collection = collection();

  // define state, these aren't really function examples
  public state = {
    myState: state(0),
    myComputed: computed(() => this.myState.is(true))
  }

  // define routes
  public routes = {
    getPost: route({ method: 'GET', endpoint: 'post/:post_id' })
  }
  
  // define actions
  public myAction = action(async ({ onCatch }, postId: string) => {
    onCatch(console.error, alert);

    const data = await this.route.getPost({ params: { post_id: postId } });

    this.collection.collect(data)
  }) 
}
```

### :construction: Task queuing for race condition prevention
```ts
App.runtime
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
