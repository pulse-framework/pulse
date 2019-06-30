---
title: Collections
---

## What are collections?

Pulse provides "collections" as a way to easily save data. Collections are designed for data following the same structure or 'model'. So channels, posts, comments, reviews, store items etc.

**Think of a collection like a database table.** Each collection comes with database-like methods to manipulate data. Data is "collected" which is a fancy way to say cached. The beauty of collections is that data can only be collected once, meaning if you need to modify it, there's one place to do so.

In order to achieve this, data we collect must be [**normalized**](#what-is-data-normalization).

## How to use

Collections are defined in the [Pulse library](./library.html), for the purpose of the following examples we'll refer to a collection as just `collection`, but this can be whatever you decide to name your collection(s).

Once you've defined a collection, you can begin saving data to it.

```js
collection.collect(someData);
```

When collecting data its typical you'll need to assign it a [group](#groups).

## What is data normalization?

Put simply, normalizing data is a way to ensure the data we're working with is consistent, accessible and in the structure we expect it. Normalized data is much easier and faster to work with.

In Pulse's case, collection data is stored internally in an object/keys format. Each piece of data is broken up and ingested individually using the "primary key" as a unique identifier. Arrays of primary keys called `indexes` are used to preserve ordering and the grouping of data (see [Groups](#groups)). This allows us to build a database-like environment.

Collected data can be an array of objects containing primary keys (id), or a single object with a primary key.
Here's an example using a basic `posts` dataset and the Pulse `collect()` method.

```js
// single object
post = {
  id: 234,
  title: 'A post!',
  //etc..
}

collect(post)

// array of objects
posts = [
  { id: 323, ... },
  { id: 243, ... },
  { id: 722, ... }
]

collect(posts);
```

## Primary Keys

Because we need to normalize data for Pulse collections to work, each piece of data collected must have a primary key, this has to be unique to avoid data being overwritten.
If your data has `id` or `_id` as a property, we'll use that automatically, but if not then you must define it in a [model](./models).

```js
`primaryKey: 'key'`;
```

or whatever your dataset's unique identifier is.

## Base collection

By default the root of the Pulse library is a collection called "base". It's the same as any other collection, but with some extra data properties and logic built in out of the box. [(More on the base collection)](./base-collection)

## Groups

You should assign data a "group" as you collect it, this is required if you want to use collected data in React/Vue components reactively.

Groups are exposed on the collection namespace. (`collection.groupName`)

```js
collection.collect(somedata, 'groupName');
collection.collect(somedata, ['groupName', 'anotherGroupName']);
```

Groups create arrays of IDs called `indexes`, which are arrays of primary keys used to build arrays of actual data. This makes handing data much faster.

The raw indexes are also accessible if you need them.

```js
collection.indexes.groupName;
// returns: [1, 2, 3, 4, 5];
```

Each time an object's index changes, the related group rebuilds its data from the index. In the above case, `groupName` would be an array containing the data for primary keys 1-5.

You can modify the index directly and it will trigger the group to regenerate with the correct data.

::: warning NOTE
**You must define groups in the collection library if you want them to be exposed publicly to your components, filters and actions. Example below:**
:::

```js
collection: {
  groups: ['groupName', 'anotherGroupName'],
}
```

If necessary, groups can be created dynamically, however they will not be exposed publicly like regular groups. You can still make use of them by calling `collection.getGroup('name')`. This method can be used throughout the Pulse library, and is reactive within filters.

## Built-in Functions

These are default functions attached to every collection. They can be called within your actions in the Pulse Library, or directly on your component.

```js
// put data by id (or array of IDs) into another group
collection.put(2123, 'selected');

// move data by id (or array of IDs) into another group
collection.move([34, 3], 'favorites', 'muted');

// change single or multiple properties in your data
collection.update(2123, {
  avatar: 'url'
});

// replace data (same as adding new data)
collection.collect(res.data.channel, 'selected');

// removes data via primary key from a collection
collection.delete(1234);

// will delete all data and empty all groups for a given collection
collection.purge();

// (coming soon) removes any data from a collection that is not currently referenced in a group
collection.clean();

// (still in development, use with caution) will undo the action its called within, or the last action executed if called from outside
collection.undo();
```

It's recommended to use these functions within Pulse actions. For example, `collection.undo()` called within an action, will undo everything changed within that action, here's an example: (although undo is still not finished but this is how it will work)

```js
actions: {
  doSeveralThings({ routes, collectionOne, undo }, customParam) {

    collectionOne.someValue = 'hi'

    routes.someRoute(customParam).then(res => {

      collectionOne.collect(res.data, 'groupOne')
      collectionOne.someOtherValue = true

    }).catch((error) => undo())
  }
}
```

If the catch block is triggered, the undo method will revert all changes made in this action, setting `customValue` back to its previous value, removing collected data and any changes to `groupOne` and reverting `someOtherValue` also. If the group was created during this action, it will be deleted.
