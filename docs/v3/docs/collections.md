---
title: Collections
---

## Introduction

# Collections

Pulse provides _Collections_ as a way to predictably save external data. Collections are designed for arrays of data following the same structure, usually returned from an API. Such as posts, comments, reviews, store items—for example.

### **Think of a Collection like a database table.**

- Data is stored and indexed by primary key, as a single source of truth\*.
- [Groups](#Groups) are arrays of unique primary keys that construct arrays of actual Collection data.
- [Selectors](#Selectors) selects a single item from a Collection by primary key.
- Groups and Selectors cache their `output`, and can be used reactively by components.
- Collections include database-like methods to manipulate data.
- Each item collected is its own [State](state.html) instance.

\*The beauty of Collections is that data can only be **collected once**, meaning if you need to modify it, there's one place to do so, and everything using that data will update accordingly. Collecting the same data again will overwrite the old data.

## Setup

```js
const MyCollection = App.Collection()();
```

This will create a Collection instance, but without any Groups, Selectors or configuration.

::: tip Collections use a double parentheses syntax.
This is to compensate for a Typescript caveat with partially inferred generics. The first parentheses allow the generic `DataType` to be passed explicitly, while the second infers types from the config function. [Learn More]()

```ts
const MyCollection = App.Collection<DataType>()();
```

:::

### With a Typescript interface

```ts
// This interface describes an arbitary data item
interface DataType {
  id: number;
  message: string;
}
// Create the Collection and pass in the datatype as a generic
const MyCollection = App.Collection<DataType>()();
```

The DataType is passed in as a generic type parameter to the first set of parentheses.

### With configuration

Configuration is optional, but recommended. The second pair of parentheses is where the config object is passed in.

```js
const MyCollection = App.Collection<DataType>()(collection => ({
  primaryKey: 'id', // default
  defaultGroup: true // default false
  groups: {},
  selectors: {},
}))
```

**All config parameters** _(All params are optional)_

| property        | type                   | description                                                                                          | default |
| --------------- | ---------------------- | ---------------------------------------------------------------------------------------------------- | ------- |
| `primaryKey?`   | `string`               | Define which property on collected items should be used for indexing.                                | `id`    |
| `name?`         | `string`               | The name of this collection, if used within controllers Collection will inherit the controller name. | N/A     |
| `defaultGroup?` | `Boolean`              | Create a default Group that catches all collected items. [Read More](#groups)                        | `false` |
| `groups?`       | `Object` of `Group`    |                                                                                                      | N/A     |
| `selectors?`    | `Object` of `Selector` |                                                                                                      | N/A     |

::: tip Typescript: Groups and Selectors infer types from config
Collections will infer the types for groups and selectors automatically from the config object. Meaning you do not need to write custom interfaces to have type safety and Intellisense when using your Collection instance.
:::

## Groups

Groups are arrays of primary keys referencing data inside a Collection, we call this an `index`.

Groups provide a cached array of actual collection data mirroring the index. When the index is modified, the `output` will rebuild with actual collection data.

```js
const MyCollection = App.Collection<DataType>()(collection => ({
  groups: {
    MY_GROUP: collection.Group()
  }
}))
```

Groups are dependent on a Collection instance, and so the config function provides the Collection instance as the first and only parameter.

::: tip Groups extend the State class

Groups have all the methods and functionality State does (See [State methods](state.html)), plus additional methods listed below. The `value` of the State is the Group's index, and the additional `output` property is the cached collection data.

:::

```js
MyCollection.groups.MY_GROUP.output; // Actual data
MyCollection.groups.MY_GROUP.index; // Array of primary keys
```

### Default Group

Collections can have a default Group, in which **all** items collected will be included this Group. In order to create default group you can either not define _any_ groups, or use the config param: `defaultGroup: boolean`.

```ts
// With no config:
const MyCollection = App.Collection()();

// With config & custom groups:
const MyCollection = App.Collection()(Collection => {
  defaultGroup: true;
  groups: { ... } // custom groups go here
});
...
```

_Usage:_

```ts
MyCollection.collect({ id: 1, jeff: true }); // goes into default group

MyCollection.getGroup('default').output; // { id: 1, jeff: true }
```

## Group Methods

### `.has()`

Check if a Group has a primary key

```js
MyCollection.groups.MY_GROUP.has(23); // boolean
```

### `.add()`

Add a key to a Group. Takes an options object as the second parameter.

```js
MyCollection.groups.MY_GROUP.add(23, {}); // returns Group instance

interface Options {
  atIndex?: number; // specify explicit index to insert
  method?: 'unshift' | 'push'; // (default: push) method to add to group
  overwrite?: boolean; // (default: false) set to false to leave primary key in place if already present
}
```

### `.remove()`

Remove primary key from Group

```js
MyCollection.groups.MY_GROUP.remove(23); // returns Group instance
```

### `.build()`

Force rebuild the group output, though you should never need to use this method as Collections take care of rebuilding groups automatically.

```js
MyCollection.groups.MY_GROUP.build(); // void
```

## Selectors

Selectors allow you to _select_ a data item from a Collection. Components that need one piece of data such as a "current account" or maybe "current viewing post" would benifit from using Selectors.

```js
const MyCollection = App.Collection<DataType>()(collection => ({
  selectors: {
    MY_SELECTOR: collection.Selector(0)
  }
}))
```

The default value of a selector can be any primary key.
::: tip Selectors extend the Computed class (which extends State)

Selectors store the selected primary key under `Selector.id`, the Collection data matching the selected primary key is cached under `Selector.value`. To understand how Computed works see [Computed]()
:::

```js
MyCollection.selectors.MY_SELECTOR.value; // cached selected Collection data
MyCollection.selectors.MY_SELECTOR.select(1); // select a new primary key
```

Selectors are smart, if you select a primary key that doesn't exist in your Collection yet, the Selector will return an empty object. However once the data is collected under that primary key, the Selector will update seemlessly.

## Selector Methods

### `.select()`

Select a data item by primary key

```js
MyCollection.selectors.MY_SELECTOR.select(23);
```

### `.persist()`

Persist selected key in local storage

```js
MyCollection.selectors.MY_SELECTOR.persist('SELECTOR_KEY');
```

## Collection Methods

# `.collect()`

The Collect method allows you to _collect_ data and add it to a collection (single object or an array of objects). The second parameter is the group you would like the data to be collected into and is optional.

```js
MyCollection.collect(data);
// OR
MyCollection.collect(data, 'myGroupName');
```

Collecting will overwrite data by default if it already exists in collection.

| parameter | type                   | description                                           |
| --------- | ---------------------- | ----------------------------------------------------- |
| `items`   | `Object` or `Object[]` | An array of data objects, must contain a primary key. |
| `groups?` | `string` or `string[]` | Group name or array of group names to add data to.    |
| `config?` | `ConfigObject`         | (See below)                                           |

`ConfigObject`
| property | type | description | default |
| ------------- | -------------------- | ---------------------------------- |---------------------------------- |
| `patch?` | `boolean` | Patch existing collection data instead of overwriting. See [State.patch()](). | `false` |
| `method?` | `"push"` or `"unshift"` | How data should be added to groups. | `"unshift"` |
| `forEachItem?` | `(data) => newData` | An interceptor function to mutate each data item before collection. | N/A

# `.update()`

The update method updates data in a collection by primary key.

```js
MyCollection.update(32, { username: 'jeff' });
```

| parameter     | type                    | description                    |
| ------------- | ----------------------- | ------------------------------ |
| `primaryKeys` | `PrimaryKey` or `State` | The Primary Key to update      |
| `changes`     | `Object`                | Object with changed properties |
| `config?`     | `ConfigObject`          | (See below)                    |

> PrimaryKey is of type `string` | `number`

`ConfigObject`
| property | type | description | default |
| ------------- | ----------- | ---------------------------------- | ------ |
| `deep` | boolean | Deep merge or shallow merge? Shallow will merge just root level properties while deep merge will merge all child objects. | false |

::: details What is deep merging?
Deep merging allows you to target deep properties on an object without affecting the properties around it.

```ts
// Shallow merge
let data = { shallowProperty: { everythingInHereIsNew: true } };
MyCollection.update(32, data);

MyCollection.getValueById(32).shallowProperty; // { everythingInHereIsNew: true }

// Deep merge
let data = { shallowProperty: { deepProperty: true } };
MyCollection.update(32, data, { deep: true });

MyCollection.getValueById(32).shallowProperty; //  { iWasUntouched: true, deepProperty: true }
```

:::

# `.put()`

The put method allows you to _put_ data from one group into another! A great example would be moving a new user from unverified to verified.

**Parameters**

- [primaryKeys (string | number | string[] | number[])]()
- [groupNames (string | string[])]()
- [options (Object)]() _optional_

```js
MyCollection.put([22, 34, 75], 'MyGroupName');
```

# `.reset()`

Reset allows you to easily clear the collection of all data (keeping group structure but removing the data from the groups)

```js
MyCollection.reset();
```

# `.compute()`

This is a function that is used when you would like a computed value based on your data.

**Parameters**

- computeFunction [Function]()

```js
MyCollection.compute(data => {
  // do things then return a value
  return value;
});
```

# `.getGroup()`

Given a group name, this function returns a group object.

**Parameters**

- [groupName (string | string[])]()

**Returns**

- [Group (Group)](#groups)

```js
// Expected to return a group matching the name 'MyGroupName'
MyCollection.getGroup('MyGroupName');
```

# `.findById()`

Fetch data using the primary key/id!

**Parameters**

- [primaryKey (string | number)]()

**Returns**

- [data (Object)]()

```js
MyCollection.findById(23);
```

# `.getValueById()`

Given an id/key, this function returns the raw data from this collection for the provided id.

**Parameters**

- [primaryKey (string | number)]()

```js
// will return the computed value of that data
MyCollection.getValueById(23);
```

# `.remove()`

Remove is an alias function that takes the primary key(s) given, returns functions for the different delete options, and passes the primary keys to the sub-function you call. It returns:

**Parameters**

- [primaryKeys (string | number | string[] | number[])]()

**Returns**

- `remove.fromGroups(groupNames)` [Function]() - Removes the data from the group(s) specified
- `remove.everywhere` [Function]() - Removes the data from all groups

```js
// will remove data with key 2 from the group named MyGroupName
MyCollection.remove(2).fromGroups('MyGroupName');
```

# `.updateDataKey()`

This method allows you to change the primary key of a data item in your collection

**Parameters**

- [oldKey (string | number | string[] | number[])]() -
- [newKey (string | number | string[] | number[])]() -

```js
// the data at key 1 will now have a key of 4550
MyCollection.updateDataKey(1, 4550);
```

# `.rebuildGroupsThatInclude()`

**Parameters**

- [PrimaryKey (string | number)]()
