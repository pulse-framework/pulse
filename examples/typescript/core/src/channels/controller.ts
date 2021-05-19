import { Controller, collection, action, state, model, route } from '@pulsejs/core';

// the core module is a file that exports all controllers
import { app, ui } from '../core';
import { Channel, Subscription, NotificationOptions } from './types';

/**
 * Channel Controller Class
 * Using classes is optional, however Typescript classes provide a clean structure to organize and build a controller instance.
 * The Controller class from which this controller extends provides some basic functions to help work with your controller instance
 */
class Channels extends Controller {
  /**
   * Channel State
   * Pulse state instances no longer need reference to the app instance, as it is global.
   */
  public state = {
    searchValue: state<string | null>(null)
  };

  /**
   * Channel Collection
   * Collections can accept modifiers that extends the typing to include the configuration
   */

  public collection = collection<Channel>()
    .createSelector('current')
    .createGroup('subscribed')
    // .groups(['subscribed', 'favorites', 'muted', 'authed'])
    // .selectors(['current'])
    .model(
      data => ({
        // the first occurrence of index() defines the primary key
        id: model.index().string(),
        // username has an index as it is unique and allows for local querying
        username: model.index().string().max(30).min(3),
        // avatar hash is returned by the api, however we want to hide this as it is used for computing
        avatar_hash: model.string().max(100).min(100).hidden().optional(),
        // the compute will only regen if one of its deps changes, otherwise the result is cached
        avatar: model.if(data.avatar_hash).compute(() => app.state.assetURL.value + data.thumbnail_hash)
      }),
      // optional model config
      {
        // allows unknown properties to exist on the data, otherwise they will be stripped
        allowUnknown: true
      }
    )
    .persist({ db: 'sqlite', table: 'channels' });

  /**
   * Channel Routes
   * Routes can be defined within the controller, using a cleaner syntax that provides a generic for the return type
   */
  private routes = {
    get: route<Channel>({ method: 'GET', endpoint: '/channel' }),
    subscribe: route<Subscription>({ method: 'GET', endpoint: '/channel/subscribe/:channel_id' }),
    unsubscribe: route<Subscription>({ method: 'DELETE', endpoint: '/channel/subscribe/:channel_id' })
  };

  /**
   * Subscribe to channel
   * @param {string} channelId - The channel to subscribe to
   * @param {NotificationOption} notificationOption - The notification settings for this subscription
   * This an example action showing how changes can be batched, combined with an api call and errors neatly handled
   */
  public subscribe = action(async ({ onCatch, undo, batch }, channelId: string, notificationOption: NotificationOptions) => {
    // the last parameter is what gets returned, everything before is called in sequence
    onCatch(undo, ui.alert, false);

    // batching will not only group the side effects of a state mutation, but they will be revered if undo() is called
    batch(() => {
      this.collection.put(channelId, ['subscribed']);
      this.collection.update(channelId, { subscription: { notification_options: notificationOption } });
    });

    // routes accept parameters, body and query data neatly in an object format
    const subscription = await this.routes.subscribe({ params: { channelId: this.collection.getSelector('current').id }, query: { limit: 30 } });

    // action exists within a try/catch, so you can throw an error code, triggering onCatch
    if (!subscription.active) throw 'subscription_not_active';

    // update the data again with correct server data, no need to batch since the only point of failure is above
    this.collection.update(channelId, { subscription });

    return true;
  });

  /**
   * Get a channel by username
   * @param {string} username - The channel username to get
   * This example
   */
  public getChannel = action(
    async ({ onCatch }, username: string): Promise<Channel | false> => {
      onCatch(ui.alert, false);

      const channel = await this.routes.get({ query: { username, includeConnections: true, includeModules: true } });

      this.collection.collect(channel, [], { patch: true });

      // access the data by the username index we provided in the model above
      return this.collection.getDataValueByIndex('username', username);
    }
  );
}

export const channels = new Channels();
