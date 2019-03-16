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

## Why Pulse?

After exploring the many options for Javascript state libraries, including the popular VueX and Redux, I felt like I needed a simpler solution. I wanted to get more out of a library than just state management, I needed something that could provide solid structure for the entire application. Everything from data handling to sockets and HTTP requests. I built this framework reflective of the architecture in which we use at Notify.me, and as a replacement for VueX at Notify also, making sure it is also compatible with React and vanilla environments.

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
this.collectionOne;
this.collectionTwo;

// without vue
pulse.collectionOne;
```

**NOTE:** Going forward the examples will just use `collection` to represent a given collection.

## Collections

Pulse provides "collections" as a way to easily save data. They automatically handle normalizing and caching data. Each collection comes with database-like methods to manipulate data.

Once you've defined a collection, you can begin saving data to it.

```js
collection.collect(someData);
```

Collecting data works like a commit in Vuex or a reducer in Redux, it handles data normalization, history and race condition prevention.

## Primary Keys

Because we need to normalize data for Pulse collections to work, each piece of data must have a primary key, this has to be unique to avoid data being overwritten.
If your data has `id` or `_id` as a property, we'll use that automatically, but if not then you must define it in a "model". More on that in the models section below.

## Groups

You can assign data a "group" as you collect it. This is useful because it creates a cache under that namespace where you can access that data on your component. The group will regenerate if any of its data changes.

```js
collection.collect(somedata, 'groupName');
```

Groups create arrays of IDs called "indexes" internally, which are arrays of primary keys used to build data. This makes handing the data much faster and efficient.

You must define groups in the collection config if you want them to be accessable by your components.

```js
collection: {
  groups: ['groupName', 'anotherGroupName'],
}
```

## Using data

Inside your component you can return any data from Pulse very easily.

```js
// VueJS computed properties
computed: {
  subscribedChannels() {
    return this.channels.subscribed
  }
}
```

or directly within the template

```HTML
<div>{{ channels.subscribed }}</div>
```

## Persisting Data

To persist data use an array on your collection with the names of data properties you want to save locally.

```js
collection: {
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

Local storage is the default and you don't need to define a storage object for it to work.

More features will be added to data persisting soon, such as custom storage per collection and more configuration options.

## Collection Namespace

Pulse has the following namespaces for each collection

- Groups (cached data based on arrays of primary keys)
- Data (custom data, good for stuff related to a collection, but not part the main body of data like booleans and strings)
- Filters (like getters, these are cached data based on filter functions you define)
- Actions (functions to do stuff)

By default, you can access everything under the collection root namespace, like this:

```js
collection.groupName; // array
collection.randomDataName; // boolean
collection.filterName; // cached array
collection.doSomething(); // function
```

But if you prefer to seperate everything by type, you can access areas of your collection like so:

```js
collection.groups.groupName; //array
collection.data.randomDataName; // boolean
collection.filters.filterName; // cached array
collection.actions.doSomething(); // function
```

If you're worried about namespace collision you can disable binding everything to the collection root and exclusively use the above method (coming soon)

For groups, if you'd like to access the raw array of primary keys, instead of the constructed data you can under `index` (coming soon)

```js
collection.index.groupName; // EG: [ 123, 1435, 34634 ]
```

## Mutating data

Changing data in Pulse is easy, you just set it to a new value.

```js
collection.currentlyEditingChannel = true;
```

We don't need mutation functions like VueX's "commit" because we use Proxies to intercept changes and queue them to prevent race condidtions. Those changes are stored and can be reverted easily. (Intercepting and queueing coming soon)

## Collection Functions

These can happen within actions in your pulse config files, or directly on your component.

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
// (comming soon)

// removes any data from a collection that is not currently refrenced in a group
// it also clears the history, so undo will not work after you run clean.
collection.clean();
// (comming soon)

// will undo the last action
collection.undo();
```

## Filters

Filters allow you to alter data before passing it to your component without changing the original data, they're essencially getters in VueX.

They're cached for performance, so each filter is analysed to see which data properties they depend on, and when those data properties change the appropriate filters regenerate.

```js
channels: {
  groups: ['groupName', 'subscribed'],
  filters: {
    liveChannels({ groups }) => {
      return groups.subscribed.filter(channel => )
    }
  }

}
```

Filters have access to the context object which contains groups, data, filters and actions from this collection, and other collections under their namespace.

## Actions

Actions are simply functions within your pulse collections that can be called externally. They're asyncronous and can return a promise.

Actions recieve a context object as the first paramater, this includes every registered collection by name and the routes object.

```js
actionName({ collectionOne, CollectionTwo, routes, data });
```

## Context Object

Filters and actions recieve the "context" object the first paramater.

| Name               | Type      | Description                                                              | Filters | Actions |
| ------------------ | --------- | ------------------------------------------------------------------------ | ------- | ------- |
| Collection Objects | Object(s) | For each collection within pulse, this is its public data and functions. | True    | True    |
| routes             | Object    | The local routes for the current collection.                             | False   | True    |
| actions            | Object    | The local actions for the current collection.                            | True    | True    |
| filters            | Object    | The local filters for the current collection.                            | True    | True    |
| groups             | Object    | The local groups for the current collection.                             | True    | True    |
| findById           | Function  | A helper function to return data directly by primary key.                | True    | True    |
| collect            | Function  | The collect function, to save data to this collection.                   | False   | True    |
| put                | Function  | Insert data into a group by primary key.                                 | False   | True    |
| move               | Function  | Move data from one group to another.                                     | False   | True    |
| update             | Function  | Mutate properties of a data entry by primary key.                        | False   | True    |
| delete             | Function  | Delete data.                                                             | False   | True    |
| clear              | Function  | Remove unused data.                                                      | False   | True    |
| undo               | Function  | Revert all changes made by this action.                                  | False   | True    |

## Models and Data Relations

(coming soon)

## Services

Pulse provides a really handy container for c

## Event Bus

(coming soon)

## Errors

(coming soon)

## Data Rejections

(implemented but description coming soon)

## HTTP Requests

(implemented but description coming soon)

## Sockets

(coming soon)

If you'd like to see a full example of how everything here can be used, check out examples in src/core
