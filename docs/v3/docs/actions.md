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

## Wrapped Actions 

### `App.Action()`
::: warning
 This feature is not currently functional. It is being worked on currently and should be released in the following few days. Check Discord for updates!
:::
This is a wrapper function for actions, it contains a built in try/catch + error handler for cleaner syntax. It also provides helper functions as the first parameter, offsetting custom parameters by one. The second parameter in the declaration would be the first parameter when the action is called. 

```js [WIP, Coming Soon]
export const MyAction = App.Action(() => {
  // do something
});
```

```js
export const MyAction = App.Action(({ onError, undo, debounce }) => {
  onError(undo); // configure action to revert all state changes on error
  debounce(300); // configure action to debounce at a rate of 300ms

  // do something
});
```
