---
title: Ideas
---

# Ideas

This is a dump for things we could implement in the future

## Data Model

```js
App.Model((model, data) => {
  return {
    id: model.index(),
    thumbnail_hash: model.string().max(100).min(100).hidden().optional()
    thumbnail: model.compute(() => AppState.URL.value + data.thumbnail_hash).if(data.thumbnail_hash)
    connections: model.relate(Connections)
    settings: model.level('owner'),
  }
})
```



# Collection Relations
```ts
Users.relate(Posts, 'posts')
```
- posts property will be deleted and auto collected into posts
- group will be created automatically on Posts as the user id
- users output will contain posts


## Pulse 4
Pulse instance would be global, not needing to import `App`.

```js
import { Controller, collection, state, model } from '@pulsejs/core';

// the core module is a file that exports all controllers
import { api, ui } from './core';

interface Channel {
  id: string;
  username: string;
  avatar: string;
  subscription?: Subscription;
}

interface Subscription {
  id: string;
  active: boolean;
  notification_options: any;
}

 /**
   * Channel Controller Class
   * Using classes is optional, however Typescript classes provide a clean structure to organize and build a controller instance.
   * The Controller class from which this controller extends provides some basic functions to help work with your controller instance
   */
class Channels extends Controller () {
  /**
   * Channel State
   * Pulse state instances no longer need reference to the app instance, as it is global.
   */
  public state = {
    searchValue: state<string | null>(null)
  }

  /**
   * Channel Routes
   * Routes can be defined within the controller, using a cleaner syntax that provides a generic for the return type
   */
  private routes = {
    subscribe: route<Subscription>({ method: 'GET', endpoint: '/channel/subscribe/:channel_id' }),
    unsubscribe: route<Subscription>({ method: 'DELETE', endpoint: '/channel/subscribe/:channel_id' })
  };

  /**
   * Channel Collection
   * Collections can accept modifiers that extends the typing to include the configuration
   */
  public collection = collection<Channel>()
    .groups(['subscribed', 'favorites', 'muted', 'authed'])
    .selectors(['current'])
    .model({
      id: model.index(),
      username: model.index().string().max(30).min(3),
      avatar_hash: model.string().max(100).min(100).hidden().optional(),
      avatar: model.if(data.avatar_hash).compute(() => AppState.URL.value + data.thumbnail_hash)
    })
    .persist({ db: 'sqlite', table: 'channels' });

  /**
   * Subscribe to channel
   * @param {string} channel_id
   * This an example action showing how changes can be batched, combined with an api call and errors neatly handled
   */
  public subscribe = action(({ onCatch, undo, batch }, channel_id: string) => {
    onCatch(undo, ui.alert);

    batch(() => this.collection.put(channel_id, 'subscribed'));

    const subscription = this.routes.subscribe({ params: { channel_id: this.collection.current.id }, query: { limit: 30 } });

    batch(() => this.collection.update(channel_id, { subscription }));
  })
};

export default new ChannelController();

```