---
title: Computed State
---

## Introduction

# Computed State

Computed State is an extension of [State](./state.md). It computes a value from a function that you provide, and caches it to avoid unnecessary recomputation.

- It will magically recompute when its dependencies change.
- Computed can track dependencies automatically or manually.

::: tip Note: Some State features are disabled
Unlike State you can not directly mutate it, so `.set()`, `.bind` are disabled.

`.persist()` is also blocked as persisting a computed value isn't necessary.

Other State methods are still useable! Refer to [State Methods](./state.md#methods).
:::

## Example

```ts
const App = new Pulse();

const MY_COMPUTED = App.Computed(() => 1 + 2);

MY_COMPUTED.value; // 3
```

The function provided here is a simple math equation.

In this case there is no reason for this Computed State to ever recompute, we didn't define any dependencies and none were used during the compute function.

Here is an example with a dependency:

```ts
const MY_STATE = App.State(5);

const MY_COMPUTED = App.Computed(() => MY_STATE.value + 2);

MY_COMPUTED.value; // 7
```

Now when `MY_STATE` changes, `MY_COMPUTED` will recompute

```ts
MY_STATE.set(2);

MY_COMPUTED.value; // 4
```

::: tip How does it work?
The State class has a reactive getter `State.value`. When the computed function begins Pulse will listen for any State instances that have their value accessed, and will register them as a dependency of the Computed State.

This works for Groups, Selectors, Collection Data and anything that extends the State class.
:::

## Methods

### `.recompute()`

_Forces the Computed instance to recompute_

```typescript
MY_COMPUTED.recompute();
```

## Initial compute
Computed functions need to compute their value initially, however doing this upon declaration can cause issues depending on data accessed within the compute function.

Normally Pulse applications use `App.Core()` to export the [Core](), but this function also acts as a way to finalize Pulse. This is a perfect opportunity to compute the initial values for all Computed instances.

```ts
const App = new Pulse(); 

const MY_COMPUTED = App.Computed(() => 1 + 1);

MY_COMPUTED.value // undefined

const core = App.Core(myCore);

MY_COMPUTED.value // 2
```


If they were to compute immediately after declaration, other State / Computed values in your core might not be defined yet, throwing many angry errors.

If this is not the behavior you want, or you are not using a core you can bypass this logic using the config option `noCore: true`
```ts
const App = new Pulse({ noCore: true });

const MY_COMPUTED = App.Computed(() => 1 + 1);

MY_COMPUTED.value // 2
```