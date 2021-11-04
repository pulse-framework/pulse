---
title: Setup With React
---

# React Setup

## Installation

```
yarn add @pulsejs/core @pulsejs/react
```

Think of `@pulsejs/react` as an extension of Pulse in the context of React. It provides access to all core functions + React only helpers such as the `usePulse` hook. We can't forget to install the `@pulsejs/core` as it is used by the React integration.

## Initialization

As of version 4.0, Pulse no longer requires you to initialize an instance.

If you wish to setup your core the "official" way, see [this guide](../docs/core.html#definition)

## Functional Components: `usePulse()`

`usePulse` is a React hook that _subscribes_ a React functional component to State instances.

```ts
const myStateValue = usePulse(core.MY_STATE);
```

> Both the input and the return value are an array, allowing you to subscribe to more than one State.

It also supports extensions of State, such as Computed, Groups, Selectors and even Collection Data, meaning you can also use functions that return State, such as `Collection.getData()`

::: tip NOTE: usePulse returns the value, not the instance.
The return value is `State.value`, not the State instance. For Groups it's slightly different, you'll get the `Group.output`, which is the useful data for your component.
:::

### Example Component

```tsx
import { usePulse } from '@pulsejs/react';
import React from 'react';
import core from './core';

export default function Component(): React.FC {
  const [account] = usePulse([core.accounts.collection.selectors.CURRENT]);

  return <>{account.username}</>;
}
```

### State Arrays

usePulse also supports **arrays** of State instances, returning values as an array that can be destructured.

```ts
const [myState, anotherState] = usePulse([core.MY_STATE, core.ANOTHER_STATE]);
```

The names of the values can be anything, though we recommend they be the camel case counter-part to the State instance name. This is completely typesafe as of version `3.1`

## Class Components: `PulseHOC()`

```js
import { PulseHoc } from '@pulsejs/react';

class Component extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}

export default PulseHoc(Component, [core.MY_STATE]);
```

::: warning
PulseHOC is a low priority WIP and has not been tested at the time of writing these docs, if you need this and it doesn't work, please let us know via Discord
:::

## Additional Hooks

Pulse's React integration also provides some helpful hooks for functional React components, the documentation for these hooks can be found in the sections for the parent functionality.

- [useWatcher()](/v4/docs/state.html#methods) - A hook to use State watchers with auto cleanup/
- [useEvent()](/v4/docs/events.html#useevent) - A hook to use a Pulse Event with a cleaner syntax and auto cleanup.