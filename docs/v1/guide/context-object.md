---
title: Context Object
---

### Context Object

[Filters](/guide/filters.html), [actions](/guide/actions.html) and [watchers](/guide/watchers.html) receive the "context" object the first parameter.

| Name               | Type      | Description                                                                                                | Filters | Actions |
| ------------------ | --------- | ---------------------------------------------------------------------------------------------------------- | ------- | ------- |
| Collection Objects | Object(s) | For each collection within pulse, this is its public data and functions.                                   | True    | True    |
| routes             | Object    | The local routes for the current collection.                                                               | False   | True    |
| actions            | Object    | The local actions for the current collection.                                                              | True    | True    |
| filters            | Object    | The local filters for the current collection.                                                              | True    | True    |
| groups             | Object    | The local groups for the current collection.                                                               | True    | True    |
| findById           | Function  | A helper function to return data directly by primary key.                                                  | True    | True    |
| collect            | Function  | The collect function, to save data to this collection.                                                     | False   | True    |
| put                | Function  | Insert data into a group by primary key.                                                                   | False   | True    |
| move               | Function  | Move data from one group to another.                                                                       | False   | True    |
| update             | Function  | Mutate properties of a data entry by primary key.                                                          | False   | True    |
| delete             | Function  | Delete data.                                                                                               | False   | True    |
| deleteGroup        | Function  | Delete data in a group                                                                                     | False   | True    |
| clear              | Function  | Remove unused data.                                                                                        | False   | True    |
| undo               | Function  | Revert all changes made by this action.                                                                    | False   | True    |
| throttle           | Function  | Used to prevent an action from running more than once in a specified time frame. EG: throttle(2000) for 2s | False   | True    |
| purge              | Function  | Clears all collection data and empties groups.                                                             | False   | True    |
