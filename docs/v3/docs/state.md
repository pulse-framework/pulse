---
title: State
---

# `App.State()`

This is the foundation of Pulse, most everything either *is* State or *extends* the functionality of State.

State is used to preserve a value, while providing a toolkit to use and mutate it. It also has the ability to track its dependents and issue "reactive" side effects such as recomputing Computed state and updating React/Vue components. 

**Basic Usage**
```typescript
import Pulse from 'pulse-framework';
const App = new Pulse();

const MY_STATE = App.State(true); // the parameter here is the default value of the state. Here, this state is a boolean with a default value of true.
// ...
```
**NOTE** All functions are chain-able!

## **Available functions and properties**

*Refer to Typescript / Intellisense for detailed param descriptions*

### `State.set()` 
*Allows you to mutate a value*

```typescript
const MY_STATE = App.State(true);
// ...
MY_STATE.set(false); // the value is now reactively set to false
// ...
```

### `State.value` 
*Provides the current value (read-only)*

```typescript
const MY_STATE = App.State("hello My name is Jam!");
// ...
console.log(MY_STATE.value) // Expected Output: "hello My name is Jam!"
// ...
```

### `State.bind` 
*Provides the current value (reactive, can be written to, automatically invokes `set()`)*

```typescript
const MY_STATE = App.State("hello My name is Jam!");
// ...
console.log(MY_STATE.value) // Expected Output: "hello My name is Jam!"
MY_STATE.bind = "My name is not Jam!"
console.log(MY_STATE.value) // Expected Output: "My name is not Jam!"
// ...
```

### `State.undo()` 
*Revert to previous state*

```typescript
const MY_STATE = App.State("hello My name is Jam!");
// ...
console.log(MY_STATE.value) // Expected Output: "hello My name is Jam!"
MY_STATE.bind = "My name is not Jam!"
console.log(MY_STATE.value) // Expected Output: "My name is not Jam!"

MY_STATE.undo() // << Undo the value change
console.log(MY_STATE.value) // Expected Output: "hello My name is Jam!"
// ...
```

### `State.previousState` 
*Returns the previous state*

```typescript
const MY_STATE = App.State("hello My name is Jam!");
// ...
console.log(MY_STATE.value) // Expected Output: "hello My name is Jam!"
MY_STATE.bind = "My name is not Jam!"
console.log(MY_STATE.value) // Expected Output: "My name is not Jam!"

console.log(MY_STATE.previousState) // Expected Output: "hello My name is Jam!"
// ...
```

### `State.type()` 
*Force State to only allow mutations of provided type*

```typescript
import Pulse from 'pulse-framework';
const App = new Pulse();

const MY_STATE = App.State(true); // the parameter here is the default value of the state. Here, this state is a boolean with a default value of true.
MY_STATE.type(Boolean)

```

### `State.key()` 
*Provide a name (or key) to identify the state, required for SSR and persisting*

```typescript
import Pulse from 'pulse-framework';
const App = new Pulse();

const MY_STATE = App.State(true).key('My_State');
```

### `State.name` 
*The name of the state, can be set directly or using above `key()`*

### `State.persist()` 
*Will preserve state in the appropriate local storage for the environment (web / mobile)*

### `State.exists` 
*Returns truthiness of the current value*

### `State.is()` 
*Equivalent to `===`*

### `State.isNot()` 
*Equivalent to `!==`*

### `State.initialState` 
*The starting value as established in code*

### `State.onNext()` 
*A callback that fires on the next mutation, then destroys itself.*

```typescript
import Pulse from 'pulse-framework';
const App = new Pulse();

const MY_STATE = App.State(true).onNext(() => {
    // do some stuff 
});
```

### `State.patch()` 
*A function to edit ("patch") deep properties of an object, provided the State value is an object*

### `State.watch()` 
*A keyed callback that will fire every mutation, provides current value in as first param in callback*

### `State.removeWatcher()` 
*Remove a watcher by key*

### `State.relate()` 
*[WIP] Associate two State instances, used for Group, Data and Computed*

### `State.reset()` 
*Reset state to initial value*

### `State.toggle()` 
*If current value is a boolean, this will invert it.*

### `State.interval()` 
*A mutation callback fired on a self contained interval*