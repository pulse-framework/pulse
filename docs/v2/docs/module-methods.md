---
title: Module Methods
---

## About Module Methods

Modules have some out-of-the-box functionality, you can use these functions in the [Context Object](/v2/docs/context-object.html) or as `module.functionName()`.

This also means these functions are part of the [Module Namespace](/v2/docs/modules.html#namespacing), so don't create any data or actions with the same name as one of these functions!

## `forceUpdate()`

## `watch()`

## `throttle()`

## `addStaticData()`

## `undo()`

::: warning
Undo is ONLY useable from the [Context Object](/v2/docs/context-object.html), and not from outside the module. This is because `undo()` is relevent to the specific action it was called in, see [Actions](/v2/docs/modules.html#actions)
:::

![Undo in Pulse](https://i.imgur.com/wSAkxuX.png)
