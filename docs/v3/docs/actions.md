---
title: Actions
---

## Introduction

# Actions

Actions are functions, sometimes literally just functions. However there are some added benifits to using Pulse Actions.

::: tip Where do I put them?
Actions are best inside an `actions.ts` file in a [Controller]() directory, exported individually.

Then, you can use `import * as actions from './actions'` to register them to a Controller.
:::

This is an example of a regular function used as an action. It has a try catch so that errors can be caught and processed within the core, not the UI code.

```js
export async function MyAction() {
  try {
    // perform action
  } catch (e) {
    App.Error(e);
  }
}
```

> App.Error() is a configurable global error handler. You might want to emit an event to trigger a UI error popup, for example.

## `App.Action()`

```js [WIP, Coming Soon]
export const MyAction = App.Action(() => {
  // do something
});
```

```js
export const MyAction = App.Action(({ undo, debounce, onError }) => {
  undo();
  debounce(300);
  // do something

  onError(() => {
    // handle
  });
});
```
