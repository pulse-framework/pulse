# Pulse

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
- ⏳ Timed interval task handler
- 🚌 Event bus
- 🔥 Supports Vue, React and React Native

**Note:** Pulse is still in development, some features are not working yet. In this document they're marked as "coming soon".

If you wish contribute, that is very much welcome! But please reach out first so we don't work on the same thing at the same time, twitter dm @jamiepine or Discord jam#0001

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

new Pulse.Library({
  collections: {
    channels: {},
    posts: {}
  }
});
```

## Setup with VueJS

```js
import Pulse from 'pulse-framework';

const pulse = new Pulse.Library({
  collections: {
    channels: {},
    posts: {}
  }
});

Vue.use(pulse);

export default pulse; // so you can use it outside of Vue too!
```

## Pulse Library

The "Library" refers to the Pulse configuration files, this is where you define and configure collections (with data, filters, actions etc), request config, services, utilities and so on.

This is everything currently supported by the Pulse Library and how it fits in the tree.

```js
const pulse = new Pulse.Library({
  collections: {
    collectionOne: {},
    collectionTwo: {
      // example
      model: {},
      data: {},
      groups: [],
      persist: [],
      routes: {},
      actions: {},
      filters: {},
      watch: {}
    },
    collectionThree: {}
    //etc..
  },
  request: {
    baseURL: 'https://api.notify.me',
    headers: []
  },
  services: {}, // coming soon
  utils: {}, // coming soon
  jobs: {}

  // base
  model: {},
  data: {},
  groups: [],
  persist: [],
  routes: {},
  actions: {},
  filters: {},
  watch: {}
});
```

For small applications you can keep this in one or two files like shown above, but for a medium to large application could build out a file stucture to look like this:

```
├── library
|   ├── index.js
|   ├── request.js
|   ├── channels
|   |   └── index.js
|   |   └── channel.collection.js
|   |   └── channel.actions.js
|   |   └── channel.filters.js
|   |   └── channel.model.js
|   ├── services
|   |   └── ...
|   ├── utils
|   |   └── ...

```

## Basic Usage

Now you can access collections and the entire Pulse instance on within Vue

```js
this.collectionOne;
this.collectionTwo;
this.base; // the root of Pulse is also a collection called "base"
this.request;
this.services;
this.utils;

// without vue
pulse.collectionOne;
// etc
```

**NOTE:** Going forward the examples will just use `collection` to represent a given collection.

## Collections

Pulse provides "collections" as a way to easily save data. They automatically handle normalizing and caching. Collections are designed for arrays of data following the same stucture or 'model'. So channels, posts, comments, reviews etc.
Each collection comes with database-like methods to manipulate data.

Once you've defined a collection, you can begin saving data to it.

```js
collection.collect(someData);
```

Collecting data works like a commit in Vuex or a reducer in Redux, it handles data normalization, history and race condition prevention.

## Base collection

By default the root of the Pulse library is a collection called "base". It's the same as any other collection, but with some extra data properties and logic built in out of the box.

## Default Properties

The `base` and `request` collections are created by default, with their own custom data properties and logic related to those properties. Use of these is optional, but can save you time!

| Property             | type    | default | Description                                                        |
| -------------------- | ------- | ------- | ------------------------------------------------------------------ |
| base.isAuthenticated | Boolean | false   | Can be set manually, wi                                            |
| base.appReady        | Boolean | false   | Once Pulse has completed initialization, this will be set to true. |
| request.baseURL      | String  | null    | The base URL for making HTTP requests.                             |

More will be added soon!

## Primary Keys

Because we need to normalize data for Pulse collections to work, each piece of data collected must have a primary key, this has to be unique to avoid data being overwritten.
If your data has `id` or `_id` as a property, we'll use that automatically, but if not then you must define it in a "model". More on that in the models section later.

## Groups

You can assign data a "group" as you collect it. This is useful because it creates a cache under that namespace where you can access that data on your component. The group will regenerate if any of the data referenced within changes.

```js
collection.collect(somedata, 'groupName');
```

Groups create arrays of IDs called "indexes", which are arrays of primary keys used to build data. This makes handing the data much faster.

The raw indexes are also accessable if you need them.

```js
collection.indexes.groupName;
// returns: [1, 2, 3, 4, 5];
```

Each time an index changes, the corresponding group rebuilds its data from the index. In the above case, `groupName` would be an array containing the data for primary keys 1-5.

NOTE: You can modify the index directly and it will still trigger the group to regenerate.

You must define groups in the collection library if you want them to be exposed on the collection so your components, filters and actions can read them directly.

```js
collection: {
  groups: ['groupName', 'anotherGroupName'],
}
```

Groups can be created dynamically, but they won't be exposed on the collection like regular groups. You can still make use of them by calling `collection.getGroup('name')`. This method can be used throughout the Pulse library, and is reactive within filters. More information on the getGroup() method, and ones similar later on.

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

## Actions

Actions are simply functions within your pulse collections that can be called externally. They're asyncronous and can return a promise.

Actions recieve a context object (see Context Object) as the first paramater, this includes every registered collection by name and the routes object.

```js
actionName({ collectionOne, CollectionTwo, routes, data });
```

## Collection Functions

These can happen within your actions in the Pulse Library, or directly on your component.

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

It's recommended to use these functions within Pulse actions. For example, `collection.undo()` called within an action, will undo everything changed within that action, here's an example:

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

## Filters

Filters allow you to alter data before passing it to your component without changing the original data, they're essencially getters in VueX.

They're cached for performance, meaning the output of the filter function is what gets served to the component, so each time it is accessed the entire filter doesn't need to re-run.

Each filter is analysed to see which data properties they depend on, and when those data properties change the appropriate filters regenerate.

```js
channels: {
  groups: ['subscribed'],
  filters: {
    liveChannels({ groups }) => {
      return groups.subscribed.filter(channel => channel.live === true)
    }
  }
}
```

Filters have access to the context object which contains groups, data, filters and actions from this collection, and other collections under their namespace.

Filters can also be dependent on eachother, as they also recieve the `context object`.

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

## Models

Collections allow you to define models for the data that you collect. This is great for ensuring valid data is always passed to your components. It also allows you to define data relations bewtween collections, as shown in the next section.

Heres an example of a model.

```js
collection: {
  model: {
    id: {
      // id is the default primary key, but you can set another
      // property to a primary key if your data is different.
      primaryKey: true;
      type: Number; // coming soon
      required: true; // coming soon
    }
  }
}
```

Data that does not fit the model requirements you define will not be collected, it will instead be saved in the Errors object as a "Data Rejection", so you can easily debug.

## Data Relations

Creating data relations between collections is easy and extremely useful.

But why would you need to create data relations? The simple answer is keeping to our rule that data should not be repeated, but when it is needed in multiple places we should make it dependent on a single copy of that data, which when changed, causes any dependecies using that data to regenerate.

Lets say you have a `channel` and a several `posts` which have been made by that channel. In the post object you have an `owner` property, which is a channel id (the primary key). We can establish a relation between that `owner` id and the primary key in the channel collection. Now when groups or filters are generated for the posts collection, each piece of data will include the full `channel` object.

When that channel is modified, any groups containing that a post dependent on that channel will regenerate, and filters dependent on those groups will regenerate also.

Here's a full example using the names I refrenced above.

```js
collections: {
  posts: {
    model: {
      owner: {
        parent: 'channels', // name of the sister collection
        assignTo: 'channel;' // the local propery to assign the channel data to
      }
    }
  },
  channels: {} // etc..
}
```

That's it! It just works.

A situation where this proved extremely satisfying, was updating a channel avatar on the Notify app, every instance of that data changed reactively. Here's a gif of that in action.

![Gif showing reactivity using Pulse relations](https://i.imgur.com/kDjkHNx.gif 'All instances of the avatar update when the source is changed, including the related posts from a different collection.')

## Services

Pulse provides a really handy container for c

## Event Bus

(coming soon)

## Errors

(implemented but description coming soon)

## Data Rejections

(implemented but description coming soon)

## HTTP Requests

(implemented but description coming soon)

## Sockets

(coming soon)

## Jobs

(coming soon)

Similar to cron jobs, provides an API for setting up interval based tasks for your application, ensures the interval is registered and unregistered correctly and is unique.

## Extra information

### Use case: groups

To better help you understand how groups could be useful to you, here's an example of how Notify.me uses groups.
Lets take `accounts` on Notify. Accounts can "favorite" and "mute" channels, on our API we store an array of channel ids that the user has muted, for example:

```js
account: {
  id: 235624,
  email: 'hello@jamiepine.com',
  username: 'Jamie Pine',
  muted: [12643, 34666, 34575],
  favorites: [34634, 23535]
}
```

When our API returns the `subscriptions` data, we will use the `muted` and `favorites` indexes on the `account` object to build groups of real data that our components can use.

```js
// Accounts collection
accounts: {
  groups: ['authed'],
  actions: {
    // after login, we get the user's account
    refresh({ routes, collect, channels }) {
      routes.refresh().then(res => {
        collect(res.account, 'authed')
        // populate the indexes on the post collection
        channels.put(res.account.muted, 'muted')
        channels.put(res.account.favorites, 'favorites')
      })
    }
  }
}
// Channels collection
channels: {
  groups: ['subscriptions', 'favorites', 'muted'],
  actions: {
    // get the subscriptions from the API
    loadSubsciptions({ routes, collect }) {
      routes.getSubscriptions().then(res => {
        collect(res.subsciptions, 'subscriptions')
      })
    }
  }
}
```

When we finally call `loadSubsciptions()` the groups `favorites` and `muted` will already be populated with primary keys, so when the data is collected, these groups will regenerate with fully built data ready for the component.

Now it's as easy as accessing `channels.favorites` from within Vue to render a list of favorite channels. Or we could write filters within pulse using the favorites group.

To add a favorite channel, the action could look like this:

```js
channels: {
  actions: {
    favorite({ channels, routes, undo }, channelId) {
      // update local data first
      channels.put(channelId, 'favorites')
      // make change on API in background
      routes.favoriteChannel(channelId).catch(() => undo())
    }
  }
}
```

If the API failed to make that change, `undo()` will revert every change made in this action.
