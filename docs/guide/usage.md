## Dump

## Default Properties

The `base` and `request` collections are created by default, with their own custom data properties and related logic. Use of these is optional, but can save you time!

| Property             | type    | default                                 | Description                                                                                                                                                                                      |
| -------------------- | ------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| base.isAuthenticated | Boolean | false                                   | Can be set manually, but will automatically set true if a Set-Cookie header is present on a request response. And automatically set false if a 401 error is returned on a request. (coming soon) |
| base.appReady        | Boolean | false                                   | Once Pulse has completed initialization, this will be set to true.                                                                                                                               |
| request.baseURL      | String  | null                                    | The base URL for making HTTP requests.                                                                                                                                                           |
| request.headers      | Object  | (See [Request](#http-requests--routes)) | Headers for outgoing HTTP requests.                                                                                                                                                              |

More will be added soon!

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
