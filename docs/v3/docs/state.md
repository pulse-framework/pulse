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
MY_STATE.persist().type(Boolean).toggle(); // false
```

## Explicit Types

```ts
const MY_STATE = App.State<boolean>(true);
```

## Properties

# `.value`

_Provides the current value (read-only)_

```typescript
const MY_STATE = App.State('hello');

MY_STATE.value; // Expected Output: "hello"
```

# `.bind`

_Provides the current value (reactive, can be written to, automatically invokes `set()`)_

```typescript
const MY_STATE = App.State('hello');

MY_STATE.bind = 'bye';
```

# `.previousState`

_Returns the previous state_

```typescript
MY_STATE.set('bye');

MY_STATE.previousState; // hello
```

# `.initialState`

The starting value as established in code

## Methods

_Refer to Typescript / Intellisense for detailed param descriptions_

# `.set()`

_Allows you to mutate a value_

```typescript
const MY_STATE = App.State(true);

MY_STATE.set(false); // the value is now reactively set to false
```

# `.undo()`

_Revert to previous state_

```typescript
const MY_STATE = App.State('hello');

MY_STATE.set('bye');

MY_STATE.undo();

MY_STATE.value; // Expected Output: "hello"
```

# `.type()`

Force State to only allow mutations of provided type. This is different from Typescript as it enforces the type at runtime. Some extensions of State are by default forced to a particular type, such as [Groups]() (Array) and [Data]() (Object).

```typescript
MY_STATE.type(Boolean);
```
The type function takes in the JS constructor for that type, possible options are:
```js
Boolean, String, Object, Array, Number 
```

# `.key()`

Provide a name to identify the State, required for SSR and State persistance.
```typescript
MY_STATE.key('MY_STATE');
```

Not required if using [Controllers]() as the key will be set automatically based on the key in the object the State defined within.


```typescript
MY_STATE.name; // MY_STATE
```

# `.persist()`

Will preserve state in the appropriate local storage for the environment (web / mobile)

# `.exists`

Returns truthiness of the current value

# `.is()`

Equivalent to `===`
```typescript
if (MY_STATE.is(true)) {
  // do something
}
```

# `.isNot()`
  Equivalent to `!==`
```typescript
if (MY_STATE.isNot(true)) {
  // do something
}
```

# `.onNext()`

A callback that fires on the next mutation, then destroys itself. It will only fire once.

```typescript
MY_STATE.onNext(() => {
  // do something
})
```

# `.patch()`
  A function to mutate properties of an object, provided the State value is an object. 

```typescript
const MY_OBJ_STATE = App.State({ thingOne: true, thingTwo: true })

MY_STATE.patch({ thingOne: false });
```
Patch can also target deep properties with the `deep: true` config option.
```typescript
const MY_OBJ_STATE = App.State({ things: { thingOne: true, thingTwo: true }, })

MY_STATE.patch({ things: { thingOne: false } }, { deep: true });
```
In this case `things.thingTwo` will remain untouched!

# `.watch()`

A callback that will fire every mutation.

```typescript
MY_STATE.watch((value) => {
  // do something
})
```
### When should I use watchers?

Usually you would "subscribe" to State changes with something such as `usePulse()` in React or `mapCore()` in Vue, this exposes the State value to the component reactively. Typically this method is for rendering the State value in your component.

Watchers however, are for when you want a *side effect* function to run as a result of mutating that State, either in your core itself or within a component.


The watch function is not chainable like most State methods, as it returns a cleanup key instead. 
```typescript
const cleanupKey = MY_STATE.watch((value) => {})

cleanupKey // 1
```


### When should I cleanup?

If you need to use a watcher in component code, it is important to cleanup as if the component unmounts and the watcher remains it can cause memory leaks.
This is not important if your watcher is inside your core code, as it doesn't "unmount" like components do.

```typescript
const cleanupKey = MY_STATE.watch((value) => {})

MY_STATE.removeWatcher(cleanupKey)
```

### `useWatcher()`

If you use React and don't fancy cleaning up after yourself the `useWatcher()` hook exists in the `@pulsejs/react` integration.
```typescript
import { useWatcher } from '@pulsejs/react';

export function MyComponent (props) {

  useWatcher(MY_STATE, (value) => {
    // do something
  })

  return <div></div>
}
```
It will automatically cleanup when the component unmounts!


# `.relate()`

[WIP] Associate two State instances, used for Group, Data and Computed

# `.reset()`

Reset state to initial value

# `.toggle()`

If current value is a boolean, this will invert it.

# `.interval()`

A mutation callback fired on a self contained interval
