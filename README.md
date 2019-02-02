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
- ⚡ Cached indexes for fast getters
- 🕰️ Commit history tracking
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
