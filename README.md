# Pulse

**WARNING STILL IN DEVELOPMENT** Features that are not working yet are marked as "coming soon". If you wish contribute, that is very much welcome! But please reach out first so we don't work on the same thing at the same time, twitter dm @jamiepine or Discord jam#0001

Pulse is an application logic library for reactive Javascript frameworks with support for VueJS, React and React Native. Lightweight, modular and powerful, but most importantly easy to understand.

## Features

- ⚙️ Modular stucture using "collections"
- ❤ Familiar terminology
- 🔮 Create data relations between collections
- ✨ Automatic data normalization
- 👯 No data repetition
- ⚡ Cached data & filters with dependency based regeneration
- 🔒 Model based data validation
- 🕰️ History tracking with smart undo functions
- 📕 Error logging & snapshot bug reporting
- 💾 Optional persisted state
- 📞 API for HTTP requests and websocket connections
- 🔧 Wappers for helpers, utilities and service workers
- 🔑 Pre-built authentication layer
- 🚧 Task queuing for race condition prevention
- 🚌 Event bus
- 🔥 Supports Vue, React and React Native

## Install

```
npm i pulse-framework --save
```

## Vanilla Setup

Manually setting up pulse without a framework

```js
import Pulse from 'pulse-framework';

new Pulse({
  collections: {
    channels: {},
    posts: {}
  }
});
```

## Setup with VueJS

```js
import Pulse from 'pulse-framework';

const pulse = new Pulse({
  collections: {
    collectionOne: {},
    collectionTwo: {
      model: {},
      data: {},
      groups: [],
      persist: [],
      routes: {},
      actions: {},
      filters: {}
      // etc..
    }
  }
});

Vue.use(pulse);
```

## Basic Usage

Now you can access collections and the entire Pulse instance on within Vue

```js
this.$collectionOne;
this.$collectionTwo;

// without vue
pulse.collectionOne;
```

Going forward examples are written using `this.collectionName` which is

## Collections

Pulse provides "collections" as a way to easily save data. They automatically handle normalizing and caching the data. Each collection comes with database-like methods to manipulate data.

Once you've defined a collection, you can begin saving data to it.

```js
collectionName.collect(someData);
```

Collecting data works like a commit in Vuex or a reducer in Redux, it handles preventing race conditions, saving history for time travel and normalizing the data.

## Primary Keys

Because we need to normalize the data for Pulse collections to work, each piece of data must have a primary key, this has to be unique to avoid data being overwritten.
Lukily if your data has `id` or `_id` as a property, we'll use that automatically, but if not then you must define it in a "model". More on that in the models section below.

## Groups

You can assign data a "group" as you collect it. This is useful because it creates a cache under that namespace where you can access that data on your component. The group will regenerate if any of its data changes.

Groups create arrays of IDs called indexes internally within Pulse, which are arrays of primary keys used to build data.

```js
collectionName.collect(somedata, 'groupName');
```

You must define groups in the collection config if you want them to be accessable by your components.

```js
collectionName: {
  groups: ['groupName', 'anotherGroupName'],
}
```

Inside pulse the groups is simply an ordered array of primary keys for which data is built from. This makes it easy and efficient to sort and move and filter data, without moving or copying the original.

If you do not define a group when collecting data the 'default' group contains everything that was collected without a defined group name (coming soon).

## Using data

Inside your component you can return any data from Pulse very easily.

```js
// VueJS computed properties
computed: {
  subscribedChannels() {
    return this.$channels.subscribed
  }
}
```

or directly within the template

```HTML
<div>{{ $channels.subscribed }}</div>
```

## Persisting Data

To persist data use an array on your collection with the names of data properties you want to save locally.

```js
collectionName: {
  data: {
    haha: true;
  }
  persist: ['haha'];
}
```

Pulse intergrates directly with local storage and session storage, and even has an api to configure your own storage.

```js
{
  collections: {...}
  // use session storage
  storage: 'sessionStorage'
  // use custom storage
  storage: {
    set: ...
    get: ...
    remove: ...
    clear: ...
  }
}
```

Local storage is the default, you don't need to use the storage object for it to work.

More features will be added to data persisting soon, such as custom storage per collection and more configuration options.

## Collection Namespace

Pulse has the following namespaces for each collection

- Groups (cached data based on arrays of primary keys)
- Data (custom data, good for stuff related to a collection, but not part the main body of data like booleans and strings)
- Filters (like getters, these are cached data based on filter functions you define)
- Actions (functions to do stuff)

By default, you can access everything under the collection root namespace, like this:

```js
this.$channels.groupName; // array
this.$channels.randomDataName; // boolean
this.$channels.filterName; // cached array
this.$channels.doSomething(); // function
```

But if you prefer to seperate everything by type, you can access areas of your collection like so:

```js
this.$channels.groups.groupName; //array
this.$channels.data.randomDataName; // boolean
this.$channels.filters.filterName; // cached array
this.$channels.actions.doSomething(); // function
```

If you're worried about namespace collision you can disable binding everything to the collection root and exclusively use the above method (coming soon)

For groups, if you'd like to access the raw array of primary keys, instead of the constructed data you can under `index` (coming soon)

```js
this.$channels.index.groupName; // EG: [ 123, 1435, 34634 ]
```

## Mutating data

Changing data in Pulse is easy, you just set it to a new value.

```js
this.$channels.currentlyEditingChannel = true;
```

We don't need mutation functions like VueX's "commit" because we use Proxies to intercept changes and queue them to prevent race condidtions. Those changes are stored and can be reverted easily. (Intercepting and queueing coming soon)

## Collection Functions

These can happen within actions in your pulse config files, or directly on your component.

```js
// put data by id (or array of IDs) into another group
this.$channels.put(2123, 'selected');

// move data by id (or array of IDs) into another group
this.$channels.move([34, 3], 'favorites', 'muted');

// change single or multiple properties in your data
this.$channels.update(2123, {
  avatar: 'url'
});
// replace data (same as adding new data)
this.$channels.collect(res.data.channel, 'selected');

// removes data via primary key from a collection
this.$channels.delete(1234);
// (comming soon)

// removes any data from a collection that is not currently refrenced in a group
// it also clears the history, so undo will not work after you run clean.
this.$channels.clean();
// (comming soon)

// will undo the last action
this.$channels.undo();
```

## Filters

Filters allow you to alter data before passing it to your component without changing the original data, they're essencially getters in VueX.

They're cached for performance, so each filter is analysed to see which data properties they depend on, and when those data properties change the appropriate filters regenerate.

```js
channels: {
  groups: ['groupName', 'subscribed'],
  filters: {
    liveChannels({ channels }) => {
      return channels.subscribed.filter(channel => )
    }
  }

}
```

## Actions

Actions are simply functions within your pulse collections that can be called externally. They're asyncronous and can return a promise.

Actions recieve a context object as the first paramater, this includes every registered collection by name and the routes object.

```js
actionName({ collectionOne, Collection2, routes });
```

## Models and Data Relations

(coming soon)

## Services

Pulse provides a really handy container for c

## Event Bus

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
