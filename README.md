# Pulse

Pulse is an application logic library for reactive Javascript frameworks with support for VueJS, React and React Native. Lightweight, modular and powerful, but most importantly easy to understand.

<p align="center">
    <a href="https://patreon.com/jamiepine"><img src="https://img.shields.io/badge/donate-patreon-F96854.svg" alt="Donate on patreon"></a>
    <a href="https://twitter.com/jamiepine"><img src="https://img.shields.io/twitter/follow/jamiepine.svg?label=Follow" alt="Follow on twitter"></a>
    <a href="https://discord.gg/mynamejeff"><img src="https://discordapp.com/api/guilds/234289824406831104/embed.png" alt="Join Discord"></a>
    <a href="https://npmjs.com/pulse-framework"><img src="https://img.shields.io/npm/v/pulse-framework.svg" alt="NPM Package Version"></a>
    <a href="https://npmjs.com/pulse-framework"><img src="https://img.shields.io/npm/dm/pulse-framework.svg" alt="NPM Monthly Downloads"></a>
    <a href="https://npmjs.com/pulse-framework"><img src="https://img.shields.io/npm/dw/pulse-framework.svg" alt="NPM Weekly Downloads"></a>
    <a href="https://npmjs.com/pulse-framework"><img src="https://img.shields.io/npm/dt/pulse-framework.svg" alt="NPM Total Downloads"></a>
    <a href="https://npmjs.com/pulse-framework"><img src="https://img.shields.io/bundlephobia/min/pulse-framework.svg" alt="NPM Bundle MIN Size"></a>
    <a href="https://github.com/jamiepine/pulse"><img src="https://img.shields.io/github/license/jamiepine/pulse.svg" alt="GitHub License"></a>
    <a href="https://github.com/jamiepine/pulse"><img src="https://img.shields.io/github/languages/code-size/jamiepine/pulse.svg" alt="GitHub Code Size"></a>
    <a href="https://github.com/jamiepine/pulse"><img src="https://img.shields.io/github/repo-size/jamiepine/pulse.svg" alt="GitHub Repo Size"></a>
</p>

## Features

- ⚙️ Modular structure using "collections"
- ⚡ Cached data & filters with dependency based regeneration
- ✨ Automatic data normalization
- 🔒 Model based data validation
- 🕰️ History tracking with smart undo functions
- 🔮 Create data relations between collections
- 🤓 Database style functions
- 💎 SSOT architecture (single source of truth)
- 📕 Error logging & snapshot bug reporting
- 🔧 Wappers for helpers, utilities and service workers
- 🚧 Task queuing for race condition prevention
- 📞 Promise based HTTP requests and websocket connections
- ⏳ Timed interval task handler
- 🚌 Event bus
- 💾 Persisted data API for localStorage, sessionStorage & more
- 🔑 Optional pre-built authentication layer
- 🍃 Lightweight (only 22KB) with 0 dependencies
- 🔥 Supports Vue, React and React Native
- ❤ Well documented (I'm getting there...)

**Note:** Pulse is still in development, some features are not working yet. In this document they're marked as "coming soon".

If you wish contribute, that is very much welcome! But please reach out first so we don't work on the same thing at the same time, twitter dm @jamiepine or Discord jam#0001

## Why Pulse?

After exploring the many options for Javascript state libraries, including the popular VueX and Redux, I felt like I needed a simpler solution. I wanted to get more out of a library than just state management― something that could provide solid structure for the **entire** application. It needed to be stuctured and simple, but also scalable. This library provides everything needed to get a reactive javascript front-end application working fast, taking care to follow best practices and to employ simple terminology that makes sense even to beginners.

I built this framework reflective of the architecture in which we use at Notify.me, and as a replacement for VueX at Notify also, making sure it is also compatible with React and vanilla environments. The team at Notify love it and I think you will too.

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

## Setup with Vue & React

```js
import Pulse from 'pulse-framework';

const pulse = new Pulse.Library({
  collections: {
    channels: {},
    posts: {}
  }
});

Vue.use(pulse); // VUE ONLY

export default pulse; // so you can use the instance anywhere that you import this file, needed for React, optional for Vue.
```

## Pulse Library

The "Library" refers to the Pulse configuration files, this is where you define and configure collections (with data, filters, actions etc), request config, services, utilities and so on.

This is everything currently supported by the Pulse Library and how it fits in the tree. It might not make sense to you now, but use this as reference later on once you've read all the individual sections.

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

For small applications you can keep this in one or two files like shown above, but a medium to large application building out a file stucture like this might be preferred:

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

Now you can access collections and the entire Pulse instance

```js
// Vanilla & React
import pulse from '.../pulse';

pulse.collectionOne;
pulse.collectionTwo;

// or in VueJS
this.$collectionOne;
this.$collectionTwo;
```

**NOTE:** Going forward the examples will just use `collection` to represent a given collection, how you access them is dependent on the framework you're using Pulse with.

## Collections

Pulse provides "collections" as a way to easily save data. Collections are designed for data following the same stucture or 'model'. So channels, posts, comments, reviews, store items etc. Think of a collection like a database table.
Each collection comes with database-like methods to manipulate the collected data.

Once you've defined a collection, you can begin saving data to it.

```js
collection.collect(someData, 'groupName');
```

_"groupName" will be explained shortly_

Collecting data works like a pre-built Vuex mutation function or a reducer in Redux, it handles data normalization, history and race condition prevention behind the scenes.

Collected data can be an array of objects each with a primary key, or a single object with a primary key.

Here's an example using a basic `posts` dataset and the Pulse `collect()` method.

```js
// single object
const post = {
  id: 234,
  title: 'A post!',
  //etc..
}

collection.collect(post, 'feed')

// array of objects
const posts = [
  { id: 323, ... },
  { id: 243, ... },
  { id: 722, ... }
]

collection.collect(posts , 'feed');
```

## What is data normalization?

Put simply, normalizing data is a way to ensure the data we're working with is consistent, accessible and in the structure we expect it. Normalized data is much easier and faster to work with.

In Pulse's case, collection data is stored internally in an object/keys format. Each piece of data is broken up and ingested individually using the "primary key" as a unique identifier. Arrays of primary keys called `indexes` are used to preserve ordering and the grouping of data (see [Groups](#groups)). This allows us to build a database-like environment.

## Primary Keys

Because we need to normalize data for Pulse collections to work, each piece of data collected must have a primary key, this has to be unique to avoid data being overwritten.
If your data has `id` or `_id` as a property, we'll use that automatically, but if not then you must define it in a "model":

```js
`primaryKey: 'key'`;
```

or whatever your dataset's unique identifier is. More on that in the models section later.

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

NOTE: **You must define groups in the collection library if you want them to be exposed publicly to your components, filters and actions:**

```js
collection: {
  groups: ['groupName', 'anotherGroupName'],
}
```

If necessary, groups can be created dynamically, however they will not be exposed publicly like regular groups. You can still make use of them by calling `collection.getGroup('name')`. This method can be used throughout the Pulse library, and is reactive within filters. More information on the `getGroup()` method, and ones similar later on.

## Using Data

Using data in VueJS and React is simple with `mapData()`. It will return an object containing Pulse data properties that you request. The string must contain a slash, first the name of the collection, then the data property.

```js
pulse.mapData({
  localName: 'collection/property'
});
// returns: { localName: value }
```

You can set `localName` to anything that suits your component.

You can now bind each returned property to the data in your component using object spreading. In VueJS the `mapData()` funtion is available on the Vue instance as `this.mapData()`.

```js
// VueJS
data() {
  return {
    ...this.mapData({
      customName: 'collection/property',
    })
    // etc..
    localDataHere: true,
  },
}

// React
import pulse from '../pulseLib.js'

class extends Component {
  constructor(props) {
    super(props)
    this.state = {
      ...pulse.mapData({
        customName: 'collection/property',
      }, this)
      // etc..
      localDataHere: true,
    }
  }

}
```

`mapData()` has access to all public facing **data, filters, groups, indexes** and even **actions**. Using mapData enures this component is tracked as a dependency inside Pulse so that it can be reactive.

Now you can access `customName` in the component instance.

**Note: `mapData()` is read-only.** To mutate data or call actions, you must use the Pulse instance itself. A good way is to export the Pulse instance and import it into your component as shown earlier.

_For convenience with Vue, each collection is fully accessible on the component (non-reactively) under \$ namespace: `this.$collection.somethingToChange = true`._

In Vue, mapped data can be used in computed methods and even trigger Vue watchers, just like regular Vue data.

In React, data should be mapped to state, and it is compatible with React hooks.

## Base Collection

By default the root of the Pulse library is a collection called "base". It's the same as any other collection, but with some extra data properties and logic built in out of the box.

## Default Properties

The `base` and `request` collections are created by default, with their own custom data properties and related logic. Use of these is optional, but can save you time!

| Property             | type    | default                                 | Description                                                                                                                                                                        |
| -------------------- | ------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| base.isAuthenticated | Boolean | false                                   | Can be set manually, but will automatically set true if a Set-Cookie header is present on a request response. And automatically set false if a 401 error is returned on a request. |
| base.appReady        | Boolean | false                                   | Once Pulse has completed initialization, this will be set to true.                                                                                                                 |
| request.baseURL      | String  | null                                    | The base URL for making HTTP requests.                                                                                                                                             |
| request.headers      | Object  | (See [Request](#http-requests--routes)) | Headers for outgoing HTTP requests.                                                                                                                                                |

More will be added soon!

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

Pulse intergrates directly with local storage and session storage, and even has an API to configure your own storage.

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

More features will be added to data persisting soon, such as persisting entire collection data, custom storage per collection and more configuration options.

## Collection Namespace

Pulse has the following namespaces for each collection

- Groups (cached data based on arrays of primary keys)
- Data (custom data, good for stuff related to a collection, but not part the main body of data like booleans and strings)
- Filters (like VueX getters, these are cached data based on filter functions you define)
- Actions (functions to do stuff)

By default, you can access everything under the collection namespace, like this:

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

For groups, if you'd like to access the raw array of primary keys, instead of the constructed data you can under `indexes`.

```js
collection.indexes.groupName; // EG: [ 123, 1435, 34634 ]
```

## Mutating Data

Changing data in Pulse is easy, you just set it to a new value.

```js
collection.currentlyEditingChannel = true;
```

We don't need mutation functions like VueX's "commit" because we use Proxies to intercept changes and queue them to prevent race condidtions. Those changes are stored and can be reverted easily. (Intercepting and queueing coming soon)

## Actions

Actions are simply functions within your pulse collections that can be called externally.

Actions receive a context object (see [Context Object](#context-object)) as the first paramater, this includes every registered collection by name, the routes object and all default collection functions.

```js
actionName({ collectionOne, collectionTwo }, customParam, ...etc) {
  // do something
  collectionOne.collect
  collectionTwo.anotherAction()
  collectionTwo.someOtherData = true
};
```

## Collection Functions

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

// (coming soon) removes any data from a collection that is not currently refrenced in a group
collection.clean();

// (coming soon) will undo the action its called within, or the last action executed if called from outside
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

## Filters

Filters allow you to alter data before passing it to your component without changing the original data. Essentially getters in VueX.

They're cached for performance, meaning the output of the filter function is what gets served to the component, so each time it is accessed the entire filter doesn't need to re-run.

Each filter is analyzed to see which data properties they depend on, and when those data properties change the appropriate filters regenerate.

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

Filters have access to the context object (see [Context Object](#context-object)) as the first paramater.

Filters can also be dependent on each other via the context object.

## Context Object

Filters and actions receive the "context" object the first paramater.

| Name               | Type      | Description                                                                                                | Filters | Actions |
| ------------------ | --------- | ---------------------------------------------------------------------------------------------------------- | ------- | ------- |
| Collection Objects | Object(s) | For each collection within pulse, this is its public data and functions.                                   | True    | True    |
| routes             | Object    | The local routes for the current collection.                                                               | False   | True    |
| actions            | Object    | The local actions for the current collection.                                                              | True    | True    |
| filters            | Object    | The local filters for the current collection.                                                              | True    | True    |
| groups             | Object    | The local groups for the current collection.                                                               | True    | True    |
| findById           | Function  | A helper function to return data directly by primary key.                                                  | True    | True    |
| collect            | Function  | The collect function, to save data to this collection.                                                     | False   | True    |
| put                | Function  | Insert data into a group by primary key.                                                                   | False   | True    |
| move               | Function  | Move data from one group to another.                                                                       | False   | True    |
| update             | Function  | Mutate properties of a data entry by primary key.                                                          | False   | True    |
| delete             | Function  | Delete data.                                                                                               | False   | True    |
| deleteGroup        | Function  | Delete data in a group                                                                                     | False   | True    |
| clear              | Function  | Remove unused data.                                                                                        | False   | True    |
| undo               | Function  | Revert all changes made by this action.                                                                    | False   | True    |
| throttle           | Function  | Used to prevent an action from running more than once in a specified time frame. EG: throttle(2000) for 2s | False   | True    |
| purge              | Function  | Clears all collection data and empties groups.                                                             | False   | True    |

## HTTP Requests & Routes

Pulse completely replaces the need to use a third party HTTP request library such as Axios. Define endpoints within your collection and easily handle the response and collect the data.

First you must define your `baseURL` in the request config (in the root of your Pulse library):

```js
  request: {
    baseURL: 'https://api.notify.me'
    headers: {
      'Access-Control-Allow-Origin': 'https://notify.me'
      //etc..
    }
  }
  // for context ...
  collections: {}
  storage: {}
  //etc..
```

Now you can define routes in your collections:

```js
routes: {
  getStuff: request => request.get('stuff/something');
}
```

Each route takes in the request object as the first paramater, which contains HTTP methods like, GET, POST, PATCH, DELETE etc.

Route functions are promises, meaning you can either use then() or async/await.

You can access routes externally or within Pulse actions.

```js
collection.routes.getStuff();
```

```js
actions: {
  doSomething({collection, routes}) {
    return routes.getStuff().then(res => {
      collection.collect(res.data)
    })
  }
}
```

The request library is an extention of a collection, meaning it's built on top of the collection class. It's exposed on the instance the same way as a collection, data such as `baseURL` and the `headers` can be changed on the fly.

```js
request.baseURL = 'https://api.notify.gg';

request.headers['Origin'] = 'https://notify.me';
```

Request history is saved (collected) into the request collection by default, though this can be disabled:

```js
request: {
  saveHistory: false;
}
```

HTTP requests will eventually have many more useful features, but for now basic function is implemented.

## Models

Collections allow you to define models for the data that you collect. This is great for ensuring valid data is always passed to your components. It also allows you to define data relations between collections, as shown in the next section.

Here's an example of a model:

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

Let's say you have a `channel` and a several `posts` which have been made by that channel. In the post object you have an `owner` property, which is a channel id (the primary key). We can establish a relation between that `owner` id and the primary key in the channel collection. Now when groups or filters are generated for the posts collection, each piece of data will include the full `channel` object.

When that channel is modified, any groups containing a post dependent on that channel will regenerate, and filters dependent on those groups will regenerate also.

Here's a full example using the names I referenced above.

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

Pulse provides a really handy container for services... (finish this)

## Event Bus

(coming soon)

## Errors

(implemented but description coming soon)

## Data Rejections

(implemented but description coming soon)

## Sockets

(coming soon)

## Jobs

(coming soon)

Similar to cron jobs, provides an API for setting up interval based tasks for your application, ensures the interval is registered and unregistered correctly and is unique.

## Extra information

### Use case: groups

To better help you understand how groups could be useful to you, here's an example of how Notify.me uses groups.

Lets take `accounts` on Notify. Accounts can "favorite" and "mute" channels, on our API we store an array of channel ids that the user has muted, they're called "indexes".

```js
account: {
  id: 235624,
  email: 'hello@jamiepine.com',
  username: 'Jamie Pine',
  muted: [12643, 34666, 34575],
  favorites: [34634, 23535]
}
```

When our API returns the `subscriptions` data, we will use the `muted` and `favorites` indexes on the `account` object to build groups of real data that our components can use. Obviously this data must already be collected in order to be included.

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
    loadSubscriptions({ routes, collect }) {
      routes.getSubscriptions().then(res => {
        collect(res.subsciptions, 'subscriptions')
      })
    }
  }
}
```

When we finally call `loadSubscriptions()` the groups `favorites` and `muted` will already be populated with primary keys, so when the data is collected, these groups will regenerate with fully built data ready for the component.

Now it's as easy as accessing `channels.favorites` from within Vue to render an array of favorite channels. Or we could write filters within Pulse using the favorites group.

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
