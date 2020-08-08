---
title: State
---

## Introduction

# State

This is the foundation of Pulse, most everything either _is_ State or _extends_ the functionality of State.

State is used to preserve a value, while providing a toolkit to use and mutate it. It also has the ability to track its dependents and issue "reactive" side effects such as recomputing Computed state and updating React/Vue components.

**Basic Usage**

```typescript
const App = new Pulse();

const MY_STATE = App.State<Boolean>(true);
```

- State accepts a generic type for type saftey
- The only parameter of State is the default value, methods to modify, mutate and access the State value are chainable.

```typescript
MY_STATE.persist().type(Boolean).toggle(); // false
```

_Refer to Typescript / Intellisense for detailed param descriptions_

## `State.set()`

_Allows you to mutate a value_

```typescript
const MY_STATE = App.State(true);

MY_STATE.set(false); // the value is now reactively set to false
```

## `State.value`

_Provides the current value (read-only)_

```typescript
const MY_STATE = App.State('hello');

MY_STATE.value; // Expected Output: "hello"
```

## `State.bind`

_Provides the current value (reactive, can be written to, automatically invokes `set()`)_

```typescript
const MY_STATE = App.State('hello');

MY_STATE.bind = 'bye';
```

## `State.undo()`

_Revert to previous state_

```typescript
const MY_STATE = App.State('hello');

MY_STATE.set('bye');

MY_STATE.undo();

MY_STATE.value; // Expected Output: "hello"
```

## `State.previousState`

_Returns the previous state_

```typescript
MY_STATE.set('bye');

MY_STATE.previousState; // hello
```

## `State.type()`

Force State to only allow mutations of provided type.

```typescript
MY_STATE.type(Boolean);
```

## `State.key()`

Provide a name (or key) to identify the state, required for SSR and persisting

Not required if using [Controllers]() as the key will be set automatically based on the key of the object the State is present in.

```typescript
MY_STATE.key('MY_STATE');
```

## `State.name`

_The name of the state, can be set directly or using above `key()`_

```typescript
MY_STATE.name; // MY_STATE
```

## `State.persist()`

_Will preserve state in the appropriate local storage for the environment (web / mobile)_

## `State.exists`

_Returns truthiness of the current value_

## `State.is()`

_Equivalent to `===`_

## `State.isNot()`

_Equivalent to `!==`_

## `State.initialState`

_The starting value as established in code_

## `State.onNext()`

_A callback that fires on the next mutation, then destroys itself._

```typescript
import Pulse from 'pulse-framework';
const App = new Pulse();

const MY_STATE = App.State(true).onNext(() => {
  // do some stuff
});
```

## `State.patch()`

_A function to edit ("patch") deep properties of an object, provided the State value is an object_

## `State.watch()`

_A keyed callback that will fire every mutation, provides current value in as first param in callback_

## `State.removeWatcher()`

_Remove a watcher by key_

## `State.relate()`

_[WIP] Associate two State instances, used for Group, Data and Computed_

## `State.reset()`

_Reset state to initial value_

## `State.toggle()`

_If current value is a boolean, this will invert it._

## `State.interval()`

_A mutation callback fired on a self contained interval_
