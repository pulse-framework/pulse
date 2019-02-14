# Pulse

**WARNING STILL IN DEVELOPMENT** Features that are not working yet are marked as "coming soon". If you wish contribute and you understand what is needed to build one of these features, reach out via an issue, twitter dm @jamiepine or Discord jam#0001

Pulse is an application logic library for reactive Javascript frameworks with support for VueJS, React and React Native. Lightweight, modular and powerful, but most importantly easy to understand.

## Features

- ⚙️ Modular stucture using "collections"
- ❤ Familiar terminology
- 🔮 Create data relations between collections
- ✨ Automatic data normalization
- 👯 No data repetition
- ⚡ Cached indexes for performance
- 🕰️ History tracking
- 📕 Error logging
- 🔒 Bad data protection
- 🔥 Supports Vue, React and React Native
- Provides a structure for basic application logic (requests, error logging, authentication)

## Install

```
npm i pulse-framework --save
```

## Simple example

Manually setting up pulse without a framework

```js
import { PulseClass } from "pulse-framework";

new Pulse({
  collections: {
    channels: {},
    posts: {}
  }
});
```

## Pulse with VueJS

```js
import Pulse from "pulse-framework";

Vue.use(Pulse, {
  collections: {
    channels: {},
    posts: {}
  }
});
```

Now you can access collections and the entire Pulse instance on within Vue

```js
this.$channels;
// or
this.$pulse.channels;
```

## Collections

Pulse provides "collections" as a way to easily save data. They automatically handle normalizing and caching the data. Each collection comes with database-like methods to manipulate data.

Once you've defined a collection, you can begin saving data to it.

```js
// basic api call
let response = await axios.get(`http://datatime.lol/feed_me`);

this.$channels.collect(response.data);
```

Collecting data works like a commit in Vuex or a reducer in Redux, it handles preventing race conditions, saving history for time travel and normalizing the data.

## Primary Keys

Because we need to normalize the data for Pulse collections to work, each piece of data must have a primary key, this has to be unique to avoid data being overwritten.
Lukily if your data has `id` or `_id` as a property, we'll use that automatically, but if not then you must define it in a "model". More on that in the models section below.

## Indexes

You can assign data an "index" as you collect it. This is useful because it creates a cache under that name where you can access that data on your component.

```js
pulse.collect(somedata, "indexName");
```

You must define indexes in the collection config if you want them to be accessable by your components.

```js
channels: {
  indexes: ['indexName', 'subscribed'],
  // etc..
  model: {},
  data: {},
  routes: {},
  filters: {},
}
```

Inside pulse the index is simply an ordered array of primary keys for which data is built from. This makes it easy and efficient to sort and move and filter data, without moving or copying the original.

If you do not define an index when collecting data there is a default index named 'default' that contains everything that was collected without an index present (coming soon).

You can now get data using `mapCollection()`

```js
// vue component example
import { mapCollection } from "pulse-framework";

export default {
  data() {
    return {
      ...mapCollection("channels", ["indexName", "subscribed"])
    };
  }
};
```

You can also assign custom names for the data properties within the component

```js
...mapCollection("channels", {
  customName: 'indexName'
  sub: 'subscribed'
})
```

## Data

Pulse has the following "forward facing" data types for each collection

- Indexes (cached arrays of data based on the index of primary keys)
- Data (custom data, like state)
- Filters (like getters, these are cached data based on filter functions you define)
- Actions (functions to do stuff)

"Forward facing" means you can access them under the collection root namespace, like this:

```js
this.$channels.indexName; // array
this.$channels.randomDataName; // boolean
this.$channels.filterName; // cached array
this.$channels.doSomething(); // function
```

If you prefer to seperate everything by type, you can access aread of your collection like so:

```js
this.$channels.index.indexName; //array
this.$channels.data.randomDataName; // boolean
this.$channels.filters.filterName; // cached array
this.$channels.actions.doSomething(); // function
```

If you're worried about namespace collision you can disable binding everything to the collection root and exclusively use the above method (coming soon)

For indexes, if you'd like to access the raw array of primary keys, instead of the constructed data you can under `rawIndex` (coming soon)

```js
this.$channels.rawIndex.indexName; // EG: [ 123, 1435, 34634 ]
```

## Mutating data

Changing data in Pulse is easy, you just change it.

```js
this.$channels.currentlyEditingChannel = true;
```

We don't need mutation functions like "commit" in VueX because we use Proxies to intercept your changes and queue them to prevent race condidtions. Those changes are stored and can be reverted easily.

## Collection Functions

These can happen within actions in your pulse config files, or directly on your component.

```js
// put data by id (or array of IDs) into another index
this.$channels.put(2123, "selected");

// move data by id (or array of IDs) into another index
this.$channels.move([34, 3], "favorites", "muted");

// change single or multiple properties in your data
this.$channels.update(2123, {
  avatar: "url"
});
// replace data (same as adding new data)
this.$channels.collect(res.data.channel, "selected");

// removes data via primary key from a collection
this.$channels.delete(1234);

// removes any data from a collection that is not currently refrenced in an index
// it also clears the history, so undo will not work after you run clean.
this.$channels.clean();

// will undo the last action
this.$channels.undo();
```

## Filters

Filters allow you to alter data before passing it to your component without changing the original data, they're essencially getters in VueX.

They're cached for performance, so each filter is analysed to see which data properties they depend on, and when those data properties change the appropriate filters regenerate.

```js
channels: {
  indexes: ['indexName', 'subscribed'],
  filters: {
    liveChannels({ channels }) => {
      return channels.subscribed.filter(channel => )
    }
  }

}
```

## Actions

Actions are simply functions within your pulse collections that can be called externally. They're asyncronous and can return a promise. A

## Models and Data Relations

(coming soon)

## Errors

(coming soon)

## Data Rejections

(coming soon)

## HTTP Requests

(coming soon)

## Sockets

(coming soon)

If you'd like to see a full example of how everything here can be used, check out examples in src/core
