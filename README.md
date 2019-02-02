# Pulse

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

Pulse provides "collections" as a way to easily and efficiently save data. They automatically handle normalizinng and caching data.

Once you've defined a collection, you can begin saving data to it.

```js
// basic api call
let response = await axios.get(`http://datatime.lol/feed_me`);

Pulse.$channels.collect(response.data);
```

Collecting data works like a commit in Vuex or a reducer in Redux, it handles preventing race conditions, saving history for time travel and normalizing the data.

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
pulse.$channel.clean();

// will undo the last action
pulse.$channel.undo();
```
