---
title: Collections
---

## Introduction

# Collections

Pulse provides _Collections_ as a way to predictably save external data. Collections are designed for arrays of data following the same structure, usually returned from an API. Such as posts, comments, reviews, store items—for example.

### **Think of a Collection like a database table.**
- Data is stored and indexed by primary key, as a single source of truth\*
- [Groups](#Groups) are unique arrays of primary keys that cache real Collection data as an _output_.
- [Selectors](#Selectors) allow you to reference a single cached item from a Collection
- Collections include database-like methods to manipulate data.
- Each item collected is its own [State](/docs/state) instance.

\*The beauty of Collections is that data can only be **collected once**, meaning if you need to modify it, there's one place to do so, and everything using that data will update accordingly. Collecting the same data again will overwrite the old data.

## Setup

```js
const MyCollection = App.Collection()();
```

This will create a Collection instance, but without any Groups, Selectors or configuration.

::: tip Collections use a double parentheses syntax.
This is to compensate for a Typescript caveat with partially inferred generics. [Learn More]()
:::

### With a Typescript interface
```ts
// This interface describes an arbitary data item

interface DataType {
  id: number;
  message: string;
}
// Create the Collection and pass in the datatype
const MyCollection = App.Collection<DataType>()();
```

The DataType is passed in as a generic type parameter to the first set of parentheses.

### With configuration

Configuration is optional, but recommended. The second pair of parentheses is where the config object is passed in. 

```js
const MyCollection = App.Collection<DataType>()(Collection => ({
  primaryKey: 'id', // default
  indexAll: true // default false
  groups: {},
  selectors: {},
}))
```

::: tip Type Safety
Collections will infer the types for groups and selectors automatically from the config object. Meaning you do not need to write custom interfaces to have type Safety and Intellisense when using your Collection instance.
:::

**All config parameters** _(All params are optional)_

- `primaryKey` [String]() - Define which property on collected items should be used for indexing.

- `indexAll` [Boolean]() - Create a default Group that catches all collected items.
- `groups` [Object]() - Define [Group](#groups) instances on this Collection.
- `selectors` [Object]() - Define [Selector](#selectors) instances on this Collection.
- `name` [string]() - Create a default Group that catches all collected items.

## Groups


Groups are arrays of primary keys referencing data inside a Collection, we call this the `index`.

Groups provide a cached array of actual collection data mirroring the index. When the index is modified, the `output` will rebuild with actual collection data.

```js
const MyCollection = App.Collection<DataType>()(Collection => ({
  groups: {
    MY_GROUP: Collection.Group()
  }
}))
```

Groups are dependent on a Collection instance, thus the config function returns the Collection instance.
::: tip Groups extend the State class

   Groups have all the methods and functionality State does (See [State methods]()), plus additional methods listed below. The `value` of the State is the Group's index, and the additional `output` property is the cached collection data.

:::

```js
MyCollection.groups.MY_GROUP.output; // Actual data
MyCollection.groups.MY_GROUP.index; // Array of primary keys
```

### Group methods

> `Group.has()` [Function]() - Check if a Group has a primary key


```js
MyCollection.groups.MY_GROUP.has(23); // boolean
```

> `Group.add()` [Function]() - Add a key to a Group. Takes an options object as the second parameter.

```js
MyCollection.groups.MY_GROUP.add(23, {}); // returns Group instance

interface Options {
  atIndex?: number; // specify explicit index to insert
  method?: 'unshift' | 'push'; // (default: push) method to add to group
  overwrite?: boolean; // (default: false) set to false to leave primary key in place if already present
}
```

> `Group.remove()` [Function]() - Remove primary key from Group

```js
MyCollection.groups.MY_GROUP.remove(23); // returns Group instance
```

> `Group.build()` [Function]() - Force rebuild the group output, though you should never need to use this method as Collections take care of rebuilding groups automatically.

```js
MyCollection.groups.MY_GROUP.build(); // void
```

## Selectors

Selectors allow you to _select_ a data item from a Collection. Components that need one piece of data such as a "current account" or maybe "current viewing post" would benifit from using Selectors.

```js
const MyCollection = App.Collection<DataType>()(Collection => ({
  selectors: {
    MY_SELECTOR: Collection.Selector(0)
  }
}))
```

The default value of a selector can be any primary key.
::: tip Selectors extend the Computed class (which extends State)

  Selectors store the selected primary key under `Selector.selected`, the Collection data matching the selected primary key is cached under `Selector.value`. To understand how Computed works see [Computed]()

:::

```js
MyCollection.selectors.MY_SELECTOR.value; // cached selected Collection data
MyCollection.selectors.MY_SELECTOR.select(1); // select a new primary key
```


## `collect()`

The Collect method allows you to _collect_ data and add it to a collection (single object or an array of objects). The second parameter is the group you would like the data to be collected into and is optional. 

### Parameters
- `data` [Object]()
- `groupNames` [string | string[]]() - optional

::: tip Collect can only accept objects
  The Collect function can **only** accept an object or an array of objects. If you try to pass any other primitive data type it will not work.
:::

```js
  MyCollection.collect(data)
  // OR
  MyCollection.collect(data, 'myGroupName')
```

## `update()`

The update method _updates_ data in a collection given an id. The first parameter is the id/key of the data you would like to update. The second parameter is an object with the updated values 

### Parameters
- `primaryKeys` [string | number | string[] | number[]]()
- `newData` [Object]()

```js
MyCollection.update(32, data)
```

## `put()`

The put method allows you to _put_ data from one group into another! A great example would be moving a new user from unverified to verified.

### Parameters
- `primaryKeys` [string | number | string[] | number[]]()
- `groupNames` [string | string[]]()
- `options` [Object]() _optional_


```js
MyCollection.put([22, 34, 75], 'MyGroupName')
```

## `deleteData()`

Delete data from your collection

### Parameters
- `primaryKeys` [string | number | string[] | number[]]()

```js
MyCollection.deleteData(21)
```

## `reset()`


Reset allows you to easily clear the collection of all data (keeping group structure but removing the data from the groups)

```js
MyCollection.reset()
```

## `compute()`

This is a function that is used when you would like a computed value based on your data. This is only really used by the [getValueById()](#getvaluebyid) function.

### Parameters
- computeFunction [Function]()

```js
MyCollection.compute((data) => {
  // do things then return a value
  return value;
})
```

## `getGroup()`

Given a group name, this function returns a group object.

### Parameters
- `groupName` [string | string[]]()
### Returns
- `Group` [Group](#groups)

```js
// Expected to return a group matching the name 'MyGroupName'
MyCollection.getGroup('MyGroupName')
```

## `findById()`

Fetch data using the primary key/id!

### Parameters
- `primaryKey` [string | number]()
### Returns
- `data` [object]()

```js
MyCollection.findById(33)
```

## `getValueById()` 

Given an id/key, this function returns the computed value of the data, using the [compute](#compute) function.

### Parameters
- `primaryKey` [string | number]()

```js
// will return the computed value of that data
MyCollection.getValueById(21)
```

## `remove()`

Remove is an alias function that takes the primary key(s) given, returns functions for the different delete options, and passes the primary keys to the sub-function you call. It returns:

### Parameters
- `primaryKeys` [string | number | string[] | number[]]()
### Returns
- `remove.fromGroups(groupNames)` [Function]() - Removes the data from the group(s) specified
- `remove.everywhere` [Function]() - Removes the data from all groups and the base collection

```js
// will remove data with key 2 from the group named MyGroupName
MyCollection.remove(2).fromGroups('MyGroupName') 
```

## `updateDataKey()`

This method allows you to easily change the key of any piece of data in your collection

### Parameters
- `oldKey` [string | number | string[] | number[]]() - 
- `newKey` [string | number | string[] | number[]]() - 

```js 
// the data at key 1 will now have a key of 4550
MyCollection.updateDataKey(1, 4550)
```

## `regenGroupsThatInclude()`

### Parameters
- `PrimaryKey` [string | number]()
