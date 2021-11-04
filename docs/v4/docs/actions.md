---
title: Actions
---

## Introduction

# Actions

Actions are functions, sometimes literally just functions. However there are some added benifits to using Pulse Actions. Authomatic try/catch wraping, state tracking, undoing, and more!

### Basic Usage
```ts
import { action } from '@pulsejs/core';

const doSomething = action(({}, num) => {

  const newnum = num + 1

  return `I Did Something ${newnum}`

})
```

## Async Actions 

You can also use async functions as an action. This becomes escpecially powerful with the `onCatch()` modifier.

```ts
const doSomethingAsync = action(async ({onCatch}) => {

  return await somethingAsync()

})
```

## Modifiers

Modifiers are helper functioned that are passed in an object as the first argument of your action function. We recommend deconstructing this object and only pulling the functions you need.

# `onCatch()`

Catches any errors and passes it to the first argument in the function it's given.

```ts
const doSomethingBad = action(({onCatch}) => {
  
  onCatch((e) => console.error) // throws "a bad word was said"

  throw new Error('a bad word was said.')
})

doSomethingBad() // returns: void
```

# `track()`

Track any state changes within the action, then do something!

```ts
const MY_STATE = state('a state') 

const changeState = action(({track}) => {
  track(() => 'lol')
  MY_STATE.set()
})
```