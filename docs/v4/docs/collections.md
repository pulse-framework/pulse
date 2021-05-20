---
title: Collections
---

## Introduction

# Collections

Pulse provides _Collections_ as a way to predictably save external data. Collections are designed for arrays of data following the same structure, usually returned from an API. Such as posts, comments, reviews, store items—for example.

```js
Users.collect(users);
```

### **Think of a Collection like a database table.**

- Data is stored and indexed by primary key, as a single source of truth\*.
- [Groups](#Groups) are arrays of unique primary keys that construct arrays of actual Collection data.
- [Selectors](#Selectors) selects a single item from a Collection by primary key.
- Groups and Selectors cache their `output`, and can be used reactively by components.
- Collections include database-like methods to manipulate data.
- Each item collected is stored inside an extended [State](state.html) instance, called [Data]().
- Collections will eventually support persistence in the browser [WIP].

> *The beauty of Collections is that data can only be **collected once**, meaning if you need to modify it, there's one place to do so, and everything using that data will update accordingly. Collecting the same data again will overwrite the old data.

## Setup

```js
const Users = App.Collection()();
```

This will create a Collection instance, but without any Groups, Selectors or configuration. We've called this collection "Users" for the purposes of this documentation.

::: tip Collections use a double parentheses syntax.
This is to compensate for a Typescript caveat with partially inferred generics. The first parentheses allow the generic `DataType` to be passed explicitly, while the second infers types from the config function. [Learn More]()

```ts
const Users = App.Collection<DataType>()();
```
:::

### With a Typescript interface

```ts
// This interface describes an arbitrary data structure for a "user".
interface User {
  id: number;
  name: string;
}

// Create the Collection and pass in the User as a generic
const Users = App.Collection<User>()();
```

The DataType is passed in as a generic type parameter to the first set of parentheses.

### With configuration

Configuration is optional, but recommended. The second pair of parentheses is where the config object or function returning a config object is passed in.

```js
const Users = App.Collection()(({ Group, Selector }) => ({
  primaryKey: 'id', // default is 'id'
  defaultGroup: true // default false
  groups: {
    favorites: Group()
  },
  selectors: {
    current: Selector()
  },
}))
```
> We use a function so the Collection being created can be used as context when creating Groups and Selectors.

**All config parameters** _(All params are optional)_

| property        | type                   | description                                                                                          | default |
| --------------- | ---------------------- | ---------------------------------------------------------------------------------------------------- | ------- |
| `primaryKey?`   | `string`               | Define which property on collected items should be used for indexing.                                | `id`    |
| `name?`         | `string`               | The name of this collection, if used within controllers Collection will inherit the controller name. | N/A     |
| `defaultGroup?` | `boolean`              | Create a default Group that catches all collected items. [Read More](#groups)                        | `false` |
| `groups?`       | `Object` of `Group`    |  An object of Group instances.                                                                                                    | N/A     | 
| `selectors?`    | `Object` of `Selector` |                  An object of Selector instances.                                                                                    | N/A     |

::: tip Typescript: Groups and Selectors infer types from config
Collections will infer the types for groups and selectors automatically from the config object. Meaning you do not need to write custom interfaces to have type safety and Intellisense when using your Collection instance.
:::

## Groups

Often applications need to categorize and preserve ordering of structured data and Groups are the cleanest way to do. Designed to be directly used within UI components, they allow you to cluster together data from a Collection as an array of primary keys.

The value of the group is called the `index`, from which Groups will construct a cached array of _actual collection data_, called the `output`. 
```js
index -> [12, 43, 54, 65]

output -> [{ id: 12, name: 'jeff' }, ...]
```

When the index is modified, the output will rebuild with collection data.

```js
const Users = App.Collection()(({ Group }) => ({
  groups: {
    myGroup: Group()
  }
}))
```

Groups are dependent on a Collection instance, and so the Collection config function provides the Collection instance as the first and only parameter.

::: tip Groups extend the State class

Groups have all the methods and functionality State does (See [State methods](state.html)), plus additional methods listed below. The `value` of the State is the Group's index (aliased as `index`), and the additional `output` property is the cached collection data.

:::

```js
Users.groups.myGroup.output; // Actual data
Users.groups.myGroup.value; // array of desired primary keys in this group
Users.groups.myGroup.index; // same as above but 1:1 with output
```

`Group.index` is always 1:1 with `Group.output`, while `Group.value` contains the primary keys desired to be in a Group, even if they don't exist in the Collection.

### Create Groups dynamically
It's a common pattern in Pulse to create groups dynamically (This means after the Collection has been defined). Though in Typescript these Groups will not be part of the Collection type.

```js
const newGroup = Users.Group([1, 2, 3]);
```
In the above example the Group is hard-coded, but to really take advantage of dynamically created Groups we could do something like this:

```js
Users.collect(user)
Posts.collect(user.posts, user.id)
```
Here we have two Collections, one for users and another for posts, which are owned by users. We can collect posts specific to a user and group them automatically by the user's id.

We can access the posts data for a specific user by using [getGroup()]() and passing the user id. 
```js
Posts.getGroup(user.id).output
```


### The default Group

Collections can have a default Group, in which **all** items collected will be included this Group. In order to create default group you can either not define _any_ groups, or use the config param: `defaultGroup: true`.

```ts
// With no config:
const Users = App.Collection()();

// With config & custom groups:
const Users = App.Collection()(() => ({
  defaultGroup: true;
  groups: { ... } // custom groups go here
}));
...
```

::: details An example collecting into the default group

```ts
Users.collect({ id: 1, name: 'jeff' }); // goes into default group

Users.getGroup('default').output; // [{ id: 1, name: 'jeff' }]
```

:::


## Group Methods

### `.has()`

Check if a Group has a primary key.

```js
Users.groups.myGroup.has(23); // boolean
```

### `.add()`

Add a key to a Group. Takes an options object as the second parameter.

```js
Users.groups.myGroup.add(23); // returns Group instance
```
Optional second parameter is a config object (`GroupAddOptions`)
```js
Users.groups.myGroup.add(23, { 
  atIndex: 2,
  softRebuild: false
}); 
```
| parameter | type                   | description                                           |
| --------- | ---------------------- | ----------------------------------------------------- |
| `atIndex?`   | `number` | Specify explicit index to insert. |
| `softRebuild?` | `boolean` | Group will avoid rebuilding from scratch, save performance. (default true)       |
| `method?` | `unshift` or `push`         | Method to add to group, add items to the top or bottom of the array. (default "push")                     |
| `overwrite?` | `boolean`         | Set to `false` to leave primary key in place if already present. (default true)                                 |


:::  details What is Soft Rebuild?
When Groups `build` they loop over the index and pull data from the Collection. Sometimes this involves running the `Collection.compute()` function on each data item. For large groups this can be a very expensive operation. Soft Rebuild is used when we know specific items are being added/removed from a group at a specific index. Pulse will update the output instead of building from scratch.
:::

### `.remove()`

Remove primary key from Group. 


```js
Users.groups.myGroup.remove(23);
```
Returns the Group instance.

### `.build()`

Build the Group output from index. This method maps the Group's index to Collection data values optionally running the `Collection.compute()` callback (if applicable) on each data item.

```js
Users.groups.myGroup.build();
```

You should never need to use this method directly as Pulse will automatically build the output when necessary.

#### Lazy Building

Lazy building is a default, but optional configuration for Groups that defers the building of `output` until it is accessed. It does not affect the way your code functions, but is a great performance boost.

```ts
const myGroup = Users.Group([], { lazyBuild: true }) // <- default is true
```
In our tests this feature lead to 7.5 times less compute on building Groups throughout our application.

## Selectors

Selectors allow you to _select_ a data item from a Collection. Components that need one piece of data such as a "current user" or maybe "current viewing post" would benefit from using Selectors.

```js
const Users = App.Collection()(({ Selector }) => ({
  selectors: {
    current: Selector(0)
  }
}))
```

The default value of a selector can be any primary key.
::: tip Selectors extend the Computed class (which extends State)

Selectors store the selected primary key under `Selector.id`, the Collection data matching the selected primary key is cached under `Selector.value`. To understand how Computed works see [Computed]()
:::

```js
Users.selectors.current.value; // cached selected Collection data
Users.selectors.current.select(1); // select a new primary key
```

Selectors are smart, if you select a primary key that doesn't exist in your Collection yet, the Selector will return an empty object. However once the data is collected under that primary key, the Selector will update seamlessly.

## Selector Methods

### `.select()`

Select a data item by primary key

```js
Users.selectors.mySelector.select(23);
```

### `.persist()`

Persist selected key in local storage

```js
Users.selectors.mySelector.persist('SELECTOR_KEY');
```

## Collection Methods

# `.collect()`

The Collect method allows you to _collect_ data and add it to a collection (single object or an array of objects). The second parameter is the group(s) you would like the data to be collected into and is optional.

```js
Users.collect(data);
// OR
Users.collect(data, 'myGroup');
```

Collecting will overwrite data by default if it already exists in collection.

::: tip Note: Data must have a primary key
In order to be collected, the data must contain a primary key which matches the Collection's config. By default this is `id`, but can be configured otherwise.
:::

| parameter | type                   | description                                           |
| --------- | ---------------------- | ----------------------------------------------------- |
| `items`   | `Object` or `Object[]` | An array of data objects, must contain a primary key. |
| `groups?` | `string` or `string[]` | Group name or array of group names to add data to.    |
| `config?` | `CollectOptions`         | (See below)                                           |

`CollectOptions`
| property | type | description | default |
| ------------- | -------------------- | ---------------------------------- |---------------------------------- |
| `patch?` | `boolean` | Patch existing collection data instead of overwriting. See [State.patch()](). | `false` |
| `method?` | `"push"` or `"unshift"` | How data should be added to groups. | `"unshift"` |
| `forEachItem?` | `(data) => newData` | An interceptor function to mutate each data item before collection. | N/A

# `.update()`

The update method updates data in a collection by primary key.

```js
Users.update(32, { name: 'Channing Tatum' });
```

| parameter     | type                    | description                    |
| ------------- | ----------------------- | ------------------------------ |
| `primaryKeys` | `PrimaryKey` or `State` | The Primary Key to update      |
| `changes`     | `Object`                | Object with changed properties |
| `config?`     | `UpdateOptions`          | (See below)                    |

> PrimaryKey is of type `string` | `number`

`UpdateOptions`
| property | type | description | default |
| ------------- | ----------- | ---------------------------------- | ------ |
| `deep` | boolean | Deep merge or shallow merge? Shallow will merge just root level properties while deep merge will merge all child objects. | false |

::: details What is deep merging?
Deep merging allows you to target deep properties on an object without affecting the properties around it.

```ts
// Shallow merge
let data = { shallowProperty: { everythingInHereIsNew: true } };
Users.update(32, data);

Users.getValueById(32).shallowProperty; // { everythingInHereIsNew: true }

// Deep merge
let data = { shallowProperty: { deepProperty: true } };
Users.update(32, data, { deep: true });

Users.getValueById(32).shallowProperty; //  { iWasUntouched: true, deepProperty: true }
```

:::

# `.getGroup()`

Given a group name, this function returns a Group instance. 

```js
Users.getGroup('myGroup');
```
::: tip Note
This method will _always_ return a Group instance, even if the group does not exist. In which case it will be stored as a "provisional" Group, this is to allow the Group to be depended on before it has been created — useful for [Computed State]() to work flawlessly without extra logic from the developer.
:::

::: details An example with usePulse()
The `getGroup()` method can be used directly in the [`usePulse()`]() React hook. It will return the Group `output` instead of the `value`.
```js
const myGroup = usePulse(Users.getGroup('myGroup'))
```
:::
::: details An example with usePulse() depending on a Group before it exists
The `getGroup()` method creates a "provisional" Group instance called myNewGroup, as myNewGroup didn't already exist in the Collection. Once the group is created, in this example by the `collect()` method, it is now moved into `Collection.groups()`.
```js
const myGroup = usePulse(Users.getGroup('myNewGroup'))

MyCollection.collect(data, 'myNewGroup');

// myGroup = data
```
:::
::: details An example with Computed State
The `getGroup()` method can be used within [`Computed State`](). It will reactively link the Group to the Computed State instance as a dependency.
```js
const MY_COMPUTED = App.Computed(() => {
  return Users.getGroup('myGroup').output;
})
```
This is a basic example with no advantage in being computed, however you can perform logic or sorting on the group data.
:::

# `.getData()`

Fetch Data instance using the primary key.

```js
Users.getData(27);
```
::: tip Note
This method will _always_ return a Data instance, even if the data does not exist. With the same benefits as `getGroup()`
:::
An alternate method to this would be [`getDataValue()`]() which will return just the value without the instance, and `null` if Data does not exist.


::: details An example with usePulse()
The `findById()` method can be used directly in the [`usePulse()`]() React hook. It will return the Data `value`.
```js
const myData = usePulse(Users.findById(27))
```
Your component will now be dependent on the data item with primary key 27 directly.
:::

# `.getDataValue()`

Returns data from a collection by primary key, the only parameter. 

If no data is found this method will return an empty object.

```js
Users.getDataValue(23);
```
Warning: This method can **NOT** be used with `usePulse()`

# `.put()`

The put method allows you to add a key or multiple keys into a group or multiple groups. It is an alias for [Group.add()](), with the added benefit of putting into several groups at once. It will also create groups dynamically if they are not already present.

```js
Users.put(75, ['favorites', 'someNewGroup']);
```

# `.move()`

This method allows you to move a key or multiple keys from a group or multiple groups. It will remove the key from the group(s) specified as the second parameter.

```js
Users.move(75, 'favorites', 'someNewGroup');
```


**Parameters**
| parameter     | type                    | description                    |
| ------------- | ----------------------- | ------------------------------ |
| `primaryKeyOrKeys` | `PrimaryKey` or `Array` of `PrimaryKey` | The Primary Key to update, can be a string or number.    |
| `groupNameOrNames`     | `Array` of `string` | Groups to put data item(s) into. |
| `options?`     | [`GroupAddOptions`]()          | See Group.add()                 |



# `.remove()`

This method returns two methods.

### `remove().fromGroups()`
This method will remove a primary key from specific groups.
```js
Users.remove(27).fromGroups(['favorites'])
```
### `remove().everywhere()`
This method removes data from all groups and deletes from the Collection.
```js
Users.remove(27).everywhere()
```

# `.reset()`

Reset allows you to easily clear the collection of all data (keeping group structure but removing the data from the groups)

```js
Users.reset();
```

# `.compute()`

This method allows you to mutate data as
```js
Users.compute(data => {
  // do things then return a value 
  return value;
});
```

# `.updateDataKey()`

This method allows you to change the primary key of a data item in your Collection.
```js
// the data at key 1 will now have a key of 4550
Users.updateDataKey(1, 4550);
```

