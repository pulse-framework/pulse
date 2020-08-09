---
title: Collections
---

## Introduction

# Collections

Pulse provides _Collections_ as a way to predictably save external data. Collections are designed for arrays of data following the same structure, usually returned from an API. Such as posts, comments, reviews, store items—for example.

### **Think of a Collection like a database table.**

- Data is stored and indexed by primary key, as a single source of truth\*
- [Groups](#Groups) are unique arrays of primary keys that cache real Collection data as an _output_.
- [Selectors](#Selectors) allow you to refrence a single cached item from a Collection
- Collections include database-like methods to manipulate data.
- Each item collected is its own [State](/docs/state) instance.

\*The beauty of Collections is that data can only be **collected once**, meaning if you need to modify it, there's one place to do so, and everything using that data will update accordingly. Collecting the same data again will overwrite the old data.

## Setup

```ts
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

Configuration is optional, but recomended. The second pair of parentheses is where the config object is passed in.

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
- `groups` [Object]() - Define [Group]() instances on this Collection.
- `selectors` [Object]() - Define [Selector]() instances on this Collection.
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
Groups have all the methods and functionality State does (See [State methods]()), plus aditional methods listed below. The `value` of the State is the Group's index, and the additional `output` property is the cached collection data.
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

## `.collect()`

```js
MyCollection.collect(data);
```

## `.update()`

## `.put()`

## `.delete()`

## `.reset()`

## Collection Instance Stucture
