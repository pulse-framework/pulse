# Pulse

**WARNING STILL IN DEVELOPMENT, A LOT OF FUNCTION IS NOT COMPLETE**

Pulse is a state management library for reactive Javascript frameworks with support for VueJS, React and React Native.

Created by @jamiepine, @f3ltron and @joaof

Pulse is similar to Redux in function, but styled more like VueX. Our goal is to create a structure that is lightweight, modular and powerful, but most importantly, easy to understand.

## Features

- ⚙️ Modular stucture using "collections"
- ❤ Famillar terminology
- 🔮 Create data realtions between collections
- ✨ Automatic data normalization
- 👯 No data repetition
- ⚡ Cached indexes for performance
- 🕰️ History tracking
- 📕 Error logging
- 🔒 Bad data protection
- 🔥 Supports Vue, React and React Native
- Provides a structure for basic application logic (requests, error logging, authentication)

## Simple example

Setting up pulse

```js
import Pulse from "pulse";

new Pulse({
  collections: {
    channels: {},
    posts: {}
  }
});
```

Pulse provides "collections" as a way to easily save data. They automatically handle normalizing and caching the data.

Once you've defined a collection, you can begin saving data to it.

```js
// basic api call
let response = await axios.get(`http://datatime.lol/feed_me`);

Pulse.$channels.collect(response.data);
```

Collecting data works like a commit in Vuex or a reducer in Redux, it handles preventing race conditions, saving history for time travel and normalizing the data.

You can define collections easily, but the root of pulse is also a "collection", so to get started, you can just use `pulse.collect()`

Otherwise collections are accessed with a \$ before the name like this: `pulse.$collectionName.collect()`

## Primary Keys

Because we need to normalize the data for Pulse collections to work, each piece of data must have a primary key, this has to be unique to avoid data being overwritten.
Lukily if your data has `id` or `_id` as a property, we'll use that automatically, but if not then you must define it in a "model". More on that in the models section below.

## Indexes

You can assign data an "index" as you collect it. This is useful because it creates a cache under that name where you can access that data on your component.

```js
pulse.collect(somedata, "indexName");
```

You can now get that data using `mapData()`

```js
// vue component example
export default {
  data() {
    return {
      ...pulse.mapData("indexName")
    };
  }
};
```

Or with a collection you can use `mapCollection()`

```js
export default {
  data() {
    return {
      ...pulse.mapCollection("collectionName", "indexName")
    };
  }
};
```

You can define your own data properties too

## Actions

These can happen within actions in pulse, or directly on your component.

```js
// put data by id (or array of IDs) into another index
pulse.$channel.put(2123, "selected");

// move data by id (or array of IDs) into another index
pulse.$channel.move([34, 3], "favorites", "muted");

// change single or multiple properties in your data
pulse.$channel.update(2123, {
  avatar: "url"
});
// replace data (same as adding new data)
pulse.$channel.collect(res.data.channel, "selected");

// removes data via primary key from a collection
pulse.$channel.delete(1234);

// removes any data from a collection that is not currently refrenced in an index
// it also clears the history, so undo will not work after you run clean.
pulse.$channel.clean();

// will undo the last action
pulse.$channel.undo();
```

## Another example

This might help you understand how you could use Pulse in a real world scenario

```js
new Pulse({
  collections: {
    // collection name
    channels: {
      // define some namespaces for your collection, any data collected under these names will be cached and accessible through them EG: channels.collect(data, 'subscribed')
      indexes: ["suggested", "favorites", "subscribed"],

      // filters are bound to data and cached, just like indexes
      filters: {
        recentlyActive({ filter }) {
          return filter({
            from: "subscribed",
            byProperty: "lastActive"
          });
        }
      },

      // a place to define any extra data properties your collection might need
      // they're reactive and accesable directly, just like regular state
      data: {
        channelOpen: false
      },

      // actions aren't required, but can do many things at once
      actions: {
        // first paramater is any functions to use from Pulse, everything after is yours.
        async getSubscribedChannels({ request, collect }, username) {
          // built in request handler
          let res = await request.get(`/channels/subscribed/${username}`);
          // collect data
          collect(res.data.channels, "subscribed");
          // collect to a sister collection, 3rd param is the name of the collection
          collect(
            res.data.posts,
            ["subscribed", res.data.channel.username],
            "posts"
          );
        }
      }
    },
    // collections don't need any paramaters to function
    posts: {}
  }
});
```

From what we've just created, you can now use mapCollection to access data

```js
...mapCollection('channels', ['subscribed', 'recentlyActive', 'channelOpened'])
```

As you can see we can access indexes, filters and regular data easily in our component, and it's all cached, reactive, and based on our collections internal database.
