---
title: State
---

## Introduction

# State

State is the foundation of Pulse, most everything either _is_ State or _extends_ the functionality of State. It is used to preserve a value, while providing a toolkit to use and mutate it.

State also has the ability to track its dependents and issue "reactive" side effects such as recomputing [Computed State](./computed.md) and updating React/Vue components.

### Basic Usage

```js
const App = new Pulse();

const MY_STATE = App.State(true);
```

- State accepts an optional generic type for type safety, if none is supplied the type will be inferred from the initial value provided.
- The only parameter of State is the initial value.
- Methods to modify, mutate and access the State value are chainable.

```js
MY_STATE.toggle().persist().set().type().watch().reset().undo(); // etc...
```

## Explicit Types

```ts
const MY_STATE = App.State<boolean>(true);
```

## Properties

# `.value`

Provides the current value (read-only)

```ts
const MY_STATE = App.State('hello');

MY_STATE.value; // Expected Output: "hello"
```

# `.bind`

Provides the current value (reactive, can be written to, automatically invokes `set()`)

```ts
const MY_STATE = App.State('hello');

MY_STATE.bind = 'bye';
```

# `.previousState`

Returns the previous state

```ts
MY_STATE.set('bye');

MY_STATE.previousState; // hello
```

# `.nextState`

Returns the current state, but mutable. You can make static modifications to the current value without affecting the actual value.

If you call the [.set()]() method without passing a new value, nextState will be used.

```ts
const MY_ARRAY = App.State([1, 2, 3]);

MY_ARRAY.nextState.push(4);

MY_ARRAY.set(); 
```

# `.initialState`

The starting value as established in code

## Methods

Refer to Typescript / Intellisense for detailed param descriptions

# `.set()`

Allows you to mutate a value

```ts
const MY_STATE = App.State(true);

MY_STATE.set(false); // the value is now reactively set to false
```

# `.undo()`

Revert to previous state

```ts
const MY_STATE = App.State('hello');

MY_STATE.set('bye');

MY_STATE.undo();

MY_STATE.value; // Expected Output: "hello"
```

# `.type()`

Force State to only allow mutations of provided type. This is different from Typescript as it enforces the type at runtime. Some extensions of State are by default forced to a particular type, such as [Groups]() (Array) and [Data]() (Object).

```ts
MY_STATE.type(Boolean);
```
The type function takes in the JS constructor for that type, possible options are:
```js
Boolean, String, Object, Array, Number 
```

# `.key()`

Provide a name to identify the State, required for SSR and State persistance.
```ts
MY_STATE.key('MY_STATE');
```

Not required if using [Controllers]() as the key will be set automatically based on the key in the object the State defined within.


```ts
MY_STATE.name; // MY_STATE
```

# `.persist()`

Will preserve State value in the appropriate local storage for the current environment (web / mobile).

Storage can be configured in the [Pulse Instance]() config, but will default to localStorage on web.

```ts
MY_STATE.persist();
```

::: tip Local storage key 
In the example we are not providing a key as the first and only parameter, this would only work in cases where the State is used within a Controller or StateGroup. In which case the key would be extracted from the object.
```ts
App.Controller({
  state: {
    MY_STATE: App.State().persist()
  }
})
```
The local storage key will be `MY_STATE`.

Otherwise the key must set directly:
```ts
const MY_STATE = App.State(true).persist('MY_STATE')
```
If no key is provided Pulse will warn in development, but fail silently in production.
:::

# `.exists`

Returns truthiness of the current value

# `.is()`

Equivalent to `===`
```ts
if (MY_STATE.is(true)) {
  // do something
}
```

# `.isNot()`
  Equivalent to `!==`
```ts
if (MY_STATE.isNot(true)) {
  // do something
}
```

# `.onNext()`

A callback that fires on the next mutation, then destroys itself. It will only fire once.

```ts
MY_STATE.onNext(() => {
  // do something
})
```

# `.patch()`
  A function to mutate properties of an object, provided the State value is an object. 

```ts
const MY_OBJ_STATE = App.State({ thingOne: true, thingTwo: true })

MY_STATE.patch({ thingOne: false });
```
Patch can also target deep properties with the `deep: true` config option.
```ts
const MY_OBJ_STATE = App.State({ things: { thingOne: true, thingTwo: true }, })

MY_STATE.patch({ things: { thingOne: false } }, { deep: true });
```
In this case `things.thingTwo` will remain untouched.

# `.watch()`

A callback that will fire every mutation.

```ts
MY_STATE.watch((value) => {
  // do something
})
```
### When should I use watchers?

Usually you would "subscribe" to State changes with something such as `usePulse()` in React or `mapCore()` in Vue, this exposes the State value to the component reactively. Typically this method is for rendering the State value in your component.

Watchers however, are for when you want a *side effect* function to run as a result of mutating that State, either in your core itself or within a component.


The watch function is not chainable like most State methods, as it returns a cleanup key instead. 
```ts
const cleanupKey = MY_STATE.watch((value) => {})

cleanupKey // 1
```


### When should I cleanup?

If you need to use a watcher in component code, it is important to cleanup as if the component unmounts and the watcher remains it can cause memory leaks.
This is not important if your watcher is inside your core code, as it doesn't "unmount" like components do.

```ts
const cleanupKey = MY_STATE.watch((value) => {})

MY_STATE.removeWatcher(cleanupKey)
```

### `useWatcher()`

If you use React and don't fancy cleaning up after yourself the `useWatcher()` hook exists in the `@pulsejs/react` integration.
```ts
import { useWatcher } from '@pulsejs/react';

export function MyComponent (props) {

  useWatcher(MY_STATE, (value) => {
    // do something
  })

  return <div></div>
}
```
It will automatically cleanup when the component unmounts!

# `.reset()`
Reset state to initial value
```js
MY_STATE.reset();
```


# `.toggle()`

If current value is a boolean, this will invert it.
```js
const MY_STATE = App.State(true);

MY_STATE.toggle();

MY_STATE.value; // true
```

# `.interval()`
  A mutation callback fired on a self contained interval, useful for logic that operates on an interval basis. As the interval is contained within State, it is protected from being created more that once, a memory leak which is a common in vanilla JS–especially with frameworks like React and Vue.
```ts
const TIMER = App.State(0);

TIMER.interval((value) => {
  return value++
}, 1000);
```
```ts
TIMER.clearInterval()
```
