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

```js
collection.collect();
```

Retrieving and sorting data from an external source, like an API, is the primary function of [Collections](). They are structured around a particular dataset, wherein you expect to be gathering several data objects following the same model.

It is possible to collect either a single object, or an array of objects— however if your API returns an _object of objects_ see [`collectByKeys()`](#collectbykeys)

[Groups](/v2/docs/collections.html#groups) preserve the ordering and grouping of data using indexes, which are simply arrays of ids. The Collect method will take care of adding collected items to a group, and creating a group if one does not already exist.

### _Parameters_ `()`

| Key      | Type                                | Description                                                                   | Required                    |
| -------- | ----------------------------------- | ----------------------------------------------------------------------------- | --------------------------- |
| `data`   | [Object]() or [Array]()<[Object]()> | The data object or array of data objects                                      | [true]()                    |
| `group`  | [Object]() or [Array]()<[String]()> | Group name or array of group names [Groups](/v2/docs/collections.html#groups) | [false]() but recommended\* |
| `config` | <[Object]()>                        | CONFIG OPTIONS BELOW                                                          | [true]()                    |

- \*If you collect without a group the only way to use that data will be [`findById()`](#findbyid) and [`watchData()`](#watchdata).
- If you collect data into a group you haven't already defined in your collection config, it will be a dynamic group that can only be accessed by `getGroup()`, see [Dynamic Groups]()
- Data objects must contain a [Primary Key](/v2/docs/collections.html#primary-keys)

### _Config Options_ `{}`

| Key      | Type          | Description                               | Required  |
| -------- | ------------- | ----------------------------------------- | --------- |
| `append` | <[Boolean]()> | Append the data to groups instead of push | [true]()  |
| `byKeys` | <[Boolean]()> | The functionality of `collectByKeys()`    | [false]() |

### Examples

```js
const sampleData = { id: 1, something: true };
collection.collect(sampleData, 'myGroup');
```

```js
const sampleData = [
    { id: 1, something: true },
    { id: 2, something: true }
    { id: 3, something: true }
];
collection.collect(sampleData, 'myGroup');
```

```js
const myCollection = {
  model: {
    snowflake: {
      primaryKey: true
    }
  }
};
```

You can now access the data you collected by the group you assigned in `collect()`

```js
console.log(collection.myGroup);
// outputs: [{ id: 1, something: true }, ...]
```

### Extra information:

Your group also can be used in computed functions & actions, here's an example with a computed function.

```js
computeSomething({ groups, data }) {
     return groups.myGroup.find(item => item.id === data.chosenItemId);
}
```

This is a computed function that returns the piece of data from a group with an id that matches `someId`.

FYI: when either `myGroup` or `chosenItemId` change, `computeSomething` will re-run, see [Computed](/v2/docs/modules.html#computed-data).

You would usually be doing more complex logic on the group's data in a computed function, as getting a piece of data can be done easily _without_ the group using `findById()`

```js
computeSomething({ findById }) {
     return findById(someId);
}
```

## `collectByKeys()`

```js
collection.collectByKeys();
```

This method has the exact same parameters as `collect()` apart from the `data` param, which is expected to different. **Refer to the `collect()` method for the other params.**

This method actually calls `collect()` under the hood, but forces a config property called `byKeys`, eg:

```js
collection.collect(someData, 'myGroup', { byKeys: true });
```

You can use collect with the config instead if that tickles your fancy. But this function was created as a handy alias.

Sometimes, depending on the API you're retrieveing data from, you might recieve "post-normalised" data, aka an object of objects, in this case Pulse should not attempt to perform normalise logic, which is why this function is nessisary.

Here's an example of "post-normalised" data:

```js
const myData = {
  123: { id: 123, anything: true },
  321: { id: 321, anything: true },
  999: { id: 999, anything: true }
};
```

The `id` or "primary key" is also the key of the object in a normalised Javascript object set

## `update()`

```js
collection.update();
```

## `delete()`

```js
collection.delete();
```

## `findById()`

```js
collection.findById();
```

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
