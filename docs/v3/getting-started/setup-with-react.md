---
title: Setup With React
---

# React Setup

## Installation

```
npm i pulse-framework
```

## Initialization

```ts
import Pulse from 'pulse-framework';
import React from 'react';

export const App = new Pulse({
    framework: React;
})
```

Follow this [guide]() to learn how to set up your core

## usePulse()

usePulse is a React hook that _subscribes_ a component to State instances.

It also supports Computed, Groups, Selectors and even Collection Data, meaning you can use functions that return State, such as `Collection.findById()`

```tsx
import { usePulse } from 'pulse-framework';
import React from 'react';
import core from './core';

export default function App(): React.FC {
  const [account] = usePulse(core.accounts.collection.selectors.CURRENT);

  return <>{account.username}</>;
}
```
