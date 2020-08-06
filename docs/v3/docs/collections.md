---
title: Collections
---
## Introduction
# Collections

Pulse provides *Collections* as a way to predictably save external data. Collections are designed for groups of data following the same structure, usually returned from an API. Such as posts, comments, reviews, store items—for example.

 ### **Think of a Collection like a database table.** 
 - Data is stored and indexed by primary key, as a single source of truth*
 - [Groups](#Groups) are unique arrays of primary keys that cache real Collection data as an *output*.
 - [Selectors](#Selectors) allow you to refrence a single cached item from a Collection
 - Collections include database-like methods to manipulate data.
 - Each item collected is its own [State](/docs/state) instance.

*The beauty of Collections is that data can only be **collected once**, meaning if you need to modify it, there's one place to do so, and everything using that data will update accordingly.

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
The DataType is passed in as a generic to the first set of parentheses. 

### With configuration
Configuration is optional, but recomended. The second pair of parentheses is where the config object is passed in. 
```js
const MyCollection = App.Collection<DataType>()(Collection => ({
  primaryKey: 'id',
  indexAll: true
  groups: {},
  selectors: {},
}))
```
::: tip Type Saftey
   Collections will infer the types for groups and selectors automatically from the config object. Meaning you do not need to write custom interfaces to have type saftey and Intellisense when using your Collection instance.
:::
**All config parameters** *(All params are optional)*
- `primaryKey` [String]() - Define which property on collected items should be used for indexing.
- `indexAll` [Boolean]() - Create a default Group that catches all collected items.
- `groups` [Object]() - Define [Group]() instances on this Collection.
- `selectors` [Object]() - Define [Selector]() instances on this Collection.
- `name` [string]() - Create a default Group that catches all collected items.

 ## Groups

 ## Selectors 

 ## `collect()`
 ```js
MyCollection.collect(data)
```
## `update()`
## `put()`
## `delete()`
## `reset()`

## Collection Instance Stucture
