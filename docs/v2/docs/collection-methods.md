---
title: Collection Methods
---

## About Collection Methods

Collections have some out-of-the-box functionality, you can use these functions in the [Context Object](/v2/docs/context-object.html) or as `collection.functionName()`.

::: tip Note
Collections extend Modules, so all [Module Methods](/v2/docs/module-methods.html) exist as collections methods too.
:::

This also means these functions are part of the [Module Namespace](/v2/docs/modules.html#namespacing), so don't create any data or actions with the same name as one of these functions!

## `collect()`

## `collectByKeys()`

## `update()`

## `delete()`

## `findById()`

## `put()`

## `move()`

## `getGroup()`

## `newGroup()`

## `deleteGroup()`

## `remove()`

::: danger DEPRICATED
Please use [removeFromGroup()](#removefromgroup)
:::

## `removeFromGroup()`

## `increment()`

## `decrement()`

## `purge()`

## `debounce()`

## `watchData()`

## `purge()`

## `cleanse()`

| Name        | Type     | Description                                                                                                | Filters | Actions |
| ----------- | -------- | ---------------------------------------------------------------------------------------------------------- | ------- | ------- |
| findById    | Function | A helper function to return data directly by primary key.                                                  | True    | True    |
| collect     | Function | The collect function, to save data to this collection.                                                     | False   | True    |
| put         | Function | Insert data into a group by primary key.                                                                   | False   | True    |
| move        | Function | Move data from one group to another.                                                                       | False   | True    |
| update      | Function | Mutate properties of a data entry by primary key.                                                          | False   | True    |
| delete      | Function | Delete data.                                                                                               | False   | True    |
| deleteGroup | Function | Delete data in a group                                                                                     | False   | True    |
| clear       | Function | Remove unused data.                                                                                        | False   | True    |
| undo        | Function | Revert all changes made by this action.                                                                    | False   | True    |
| throttle    | Function | Used to prevent an action from running more than once in a specified time frame. EG: throttle(2000) for 2s | False   | True    |
| purge       | Function | Clears all collection data and empties groups.                                                             | False   | True    |
