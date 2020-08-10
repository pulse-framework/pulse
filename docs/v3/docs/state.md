---
title: State
---

## Introduction

# State

State is the foundation of Pulse, most everything either _is_ State or _extends_ the functionality of State. It is used to preserve a value, while providing a toolkit to use and mutate it.

State also has the ability to track its dependents and issue "reactive" side effects such as recomputing [Computed State]() and updating React/Vue components.

**Basic Usage**

```typescript
const App = new Pulse();

const MY_STATE = App.State<Boolean>(true);
```

- State accepts an optional generic type for type safety, if none is supplied the type will be inferred from the initial value provided.
- The only parameter of State is the initial value.
- Methods to modify, mutate and access the State value are chainable.

```typescript
MY_STATE.persist().type(Boolean).toggle(); // false
```

_Refer to Typescript / Intellisense for detailed param descriptions_

## `.set()`

_Allows you to mutate a value_

```typescript
const MY_STATE = App.State(true);

MY_STATE.set(false); // the value is now reactively set to false
```

## `.value`

_Provides the current value (read-only)_

```typescript
const MY_STATE = App.State('hello');

MY_STATE.value; // Expected Output: "hello"
```

## `.bind`

_Provides the current value (reactive, can be written to, automatically invokes `set()`)_

```typescript
const MY_STATE = App.State('hello');

MY_STATE.bind = 'bye';
```

## `.undo()`

_Revert to previous state_

```typescript
const MY_STATE = App.State('hello');

MY_STATE.set('bye');

MY_STATE.undo();

MY_STATE.value; // Expected Output: "hello"
```

## `.previousState`

_Returns the previous state_

```typescript
MY_STATE.set('bye');

MY_STATE.previousState; // hello
```

## `.type()`

Force State to only allow mutations of provided type.

```typescript
MY_STATE.type(Boolean);
```

## `.key()`

Provide a name (or key) to identify the state, required for SSR and persisting

Not required if using [Controllers]() as the key will be set automatically based on the key of the object the State is present in.

```typescript
MY_STATE.key('MY_STATE');
```

## `.name`

_The name of the state, can be set directly or using above `key()`_

```typescript
MY_STATE.name; // MY_STATE
```

## `.persist()`

_Will preserve state in the appropriate local storage for the environment (web / mobile)_

## `.exists`

_Returns truthiness of the current value_

## `.is()`

_Equivalent to `===`_

## `.isNot()`

_Equivalent to `!==`_

## `.initialState`

_The starting value as established in code_

## `.onNext()`

_A callback that fires on the next mutation, then destroys itself._

```typescript
import Pulse from 'pulse-framework';
const App = new Pulse();

const MY_STATE = App.State(true).onNext(() => {
  // do some stuff
});
```

## `.patch()`

_A function to edit ("patch") deep properties of an object, provided the State value is an object_

## `.watch()`

_A keyed callback that will fire every mutation, provides current value in as first param in callback_

## `.removeWatcher()`

_Remove a watcher by key_

## `.relate()`

_[WIP] Associate two State instances, used for Group, Data and Computed_

## `.reset()`

_Reset state to initial value_

## `.toggle()`

_If current value is a boolean, this will invert it._

## `.interval()`

_A mutation callback fired on a self contained interval_
