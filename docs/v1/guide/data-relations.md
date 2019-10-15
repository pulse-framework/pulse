---
title: Data Relations
---

### Data Relations

Creating data relations between collections is easy and extremely useful.

But why would you need to create data relations? The simple answer is keeping to our rule that data should not be repeated, but when it is needed in multiple places we should make it dependent on a single copy of that data, which when changed, causes any dependencies using that data to regenerate.

Let's say you have a `channel` and a several `posts` which have been made by that channel. In the post object you have an `owner` property, which is a channel id (the primary key). We can establish a relation between that `owner` id and the primary key in the channel collection. Now when groups or filters are generated for the posts collection, each piece of data will include the full `channel` object.

When that channel is modified, any groups containing a post dependent on that channel will regenerate, and filters dependent on those groups will regenerate also.

Here's a full example using the names I referenced above.

```js
collections: {
  posts: {
    model: {
      owner: {
        hasOne: 'channels', // name of the sister collection
        assignTo: 'channel;' // the local property to assign the channel data to
      }
    }
  },
  channels: {} // etc..
}
```

That's it! It just works.

A situation where this proved extremely satisfying, was updating a channel avatar on the Notify app, every instance of that data changed reactively. Here's a gif of that in action.

![Gif showing reactivity using Pulse relations](https://i.imgur.com/kDjkHNx.gif 'All instances of the avatar update when the source is changed, including the related posts from a different collection.')
