---
title: Collections
---

# `App.Collection()`

Pulse provides "collections" as a way to easily save data. Collections are designed for data following the same structure or "model". Such as posts, comments, reviews, store items- for example.

**Think of a collection like a database table.** Each collection comes with database-like methods to manipulate data. Data is "collected" which is a fancy way to say cached. The beauty of collections is that data can only be collected once, meaning if you need to modify it, there's one place to do so, and everything using that data will update accordingly.

**\*In order to achieve this, data we collect must be [**normalized**](#what-is-data-normalization).\***

Collections are defined in the [Pulse library](./library.html), for the purpose of the following examples we'll refer to a collection as just `collection`, but this can be whatever you decide to name your collection(s).

Once you've defined a collection, you can begin saving data to it.

```js
collection.collect(someData);
```

To learn how to use `collect()` in detail see [collection-methods/collect()](/v2/docs/collection-methods.html#collect).

## What is data normalization?

Put simply, normalizing data is a way to ensure the data we're working with is consistent, accessible and in the structure we expect it. Normalized data is much easier and faster to work with.

In Pulse's case, collection data is stored internally in an object/keys format. Each piece of data is broken up and ingested individually using the "primary key" as a unique identifier. Arrays of primary keys called `indexes` are used to preserve ordering and the grouping of data (see [Groups](#groups)). This allows us to build a database-like environment.

Collected data can be an array of objects containing primary keys (id), or a single object with a primary key.
Here's an example using a basic `posts` dataset and the Pulse `collect()` method.

```js
// Single object
const post = {
  id: 234,
  title: 'A post!',
  // etc...
}

collect(post);

// Array of objects
const posts = [
  { id: 323, ... },
  { id: 243, ... },
  { id: 722, ... }
]

collect(posts);
```

## Primary Keys

Each data item collected by Pulse must have a unique id to that collection, we call this a "primary key", Pulse will use that primary key in indexes (see [Groups](/v2/docs/collections.html#groups)) and when using `collection.findById()` see [Collection Methods](/v2/docs/collection-methods.html#findbyid).

If your data has `id` or `_id` as a property, Pulse will use that automatically, but if not then you must define it in the collection [model](/v2/docs/collections.html#models). EG:

```js
model: {
  uuid: {
    type: String;
    primaryKey: true;
  }
}
```

In the above case, we set the primary key for this collection to `uuid`.


There is a config toggle that makes `base` show up by name, set `baseModuleAlias: true` in the global [config](/v2/docs/library.html#config-options). _This was added as a backwards compatiblity feature._

## Groups

You should assign data a "group" as you collect it, this is required if you want to use collected data in React/Vue and have mutations in Pulse reactively cause component updates.

Groups are exposed on the collection namespace. (`collection.groupName`)

```js
collection.collect(somedata, 'groupName');
collection.collect(somedata, ['groupName', 'anotherGroupName']);
```

::: tip A use-case example
Lets say you have a collection named `posts` for your application, you might define a group called `feed` as that you collect into while scrolling through a feed. Now lets say a user "favorites" a post, you can now put that post into a group called `favorites` using the [`collection.put()`](/v2/docs/collection-methods.html#put) method.

Now both `feed` and `favorites` can be used by your components.
:::

### Groups are based on `indexes`

Arrays of IDs called `indexes` are created; which are simply arrays of primary keys, used to build arrays of complete data.

The raw indexes are also accessible if you need them.

```js
collection.indexes.groupName;
// returns: [1, 2, 3, 4, 5];
```

Each time an object's index changes, the related group rebuilds its data from the index. In the above case, `groupName` would be an array containing the data for primary keys 1-5.

You can modify the index directly and it will trigger the group to regenerate with the correct data.

::: warning NOTE
**You must define groups in the collection library if you want them to be exposed publicly to your components, computed and actions. Example below:**
:::

```js
collection: {
  groups: ['groupName', 'anotherGroupName'],
}
```

If necessary, groups can be created dynamically, however they will not be exposed publicly like regular groups. You can still make use of them by calling `collection.getGroup('name')`. This method can be used throughout the Pulse library, and is reactive within computed functions.

## Models

Collections allow you to define models for the data that you collect. This is great for ensuring valid data is always passed to your components. It also allows you to define data relations between collections, as shown in the next section.

Here's an example of a model:

```js
collection: {
  model: {
    id: {
      primaryKey: true,
      type: Number, // coming soon
      required: true, // coming soon
    }
  }
}
```

Data that does not fit the model requirements you define will not be collected, it will instead be saved in the Errors object as a "Data Rejection", so you can easily debug.

## `populate()`

Creating data relations between collections is easy and extremely useful using the `populate()` function in the collection model.

But why would you need to create data relations? The simple answer is keeping to our rule that data should not be repeated, but when it is needed in multiple places we should make it dependent on a single copy of that data, which when changed, causes any dependencies using that data to regenerate.

Let's say you have a `channel` and a several `posts` which have been made by that channel. In the post object you have an `owner` property, which is a channel id (the primary key). We can establish a relation between that `owner` id and the primary key in the channel collection. Now when groups or computed data is generated for the posts collection, each piece of data will include the full `channel` object.

When that channel is modified, any groups containing a post dependent on that channel will regenerate, and computed data dependent on those groups will regenerate also.

Here's a full example using the names I referenced above.

```js
collections: {
  posts: {
    model: {
      channel: {
        populate({ channels }, data) {
          return channels.findById(data.owner);
        }
      }
    }
  },
  channels: {} // etc..
}
```

That's it! It just works. Now each piece of data in the `channels` collection, when access within a group, will have a new property named `channel` with the value being the latest copy of the channel object.

The first parameter of the populate function is the [Context Object]() and the second is the current piece of data being evaluated against the model.

A situation where this proved extremely satisfying, was updating a channel avatar on the Notify app, every instance of that data changed reactively. Here's a gif of that in action.

![Gif showing reactivity using Pulse relations](https://i.imgur.com/kDjkHNx.gif 'All instances of the avatar update when the source is changed, including the related posts from a different collection.')
