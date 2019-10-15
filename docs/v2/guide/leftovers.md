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

## Collection Functions

## HTTP Requests & Routes

## Models

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
        collect(res.subscriptions, 'subscriptions')
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
