import { Controller, collection, action, state, model, route } from '@pulsejs/core';
// the core module is a file that exports all controllers
import { app, ui } from '../core';
import { Channel, Subscription, NotificationOptions } from './types';

/**
 * @Controller Channels
 */
class Channels extends Controller {
  public state = {
    searchValue: state<string | null>(null)
  };

  public collection = collection<Channel>()
    .createGroups(['subscribed', 'muted', 'previous'])
    .createSelector('current')
    .model(
      data => ({
        id: model.index().string(),
        username: model.index().string().max(30).min(3),
        avatar_hash: model.string().max(100).min(100).hidden().optional(),
        avatar: model.if(data.avatar_hash).compute(() => app.state.assetURL.value + data.thumbnail_hash)
      }),
      {
        allowUnknown: true
      }
    )
    .persist({ db: 'sqlite', table: 'channels' });

  private routes = {
    get: route<Channel>({ method: 'GET', endpoint: '/channel' }),
    subscribe: route<Subscription>({ method: 'GET', endpoint: '/channel/subscribe/:channel_id' }),
    unsubscribe: route<Subscription>({ method: 'DELETE', endpoint: '/channel/subscribe/:channel_id' })
  };

  /**
   * @action Subscribe to channel
   * @param {string} channelId - The channel to subscribe to
   * @param {NotificationOption} notificationOption - The notification settings for this subscription
   */
  public subscribe = action(async ({ onCatch, undo, batch }, channelId: string, notificationOption: NotificationOptions) => {
    onCatch(undo, ui.alert, false);
    // batch state changes to group side-effects & revert changes with undo onCatch
    batch(() => {
      this.collection.put(channelId, ['subscribed']);
      this.collection.update(channelId, { subscription: { notification_options: notificationOption } });
    });
    // create the subscription on the api, passing params & query
    const subscription = await this.routes.subscribe({
      params: {
        channelId: this.collection.selectors.current.id
      },
      query: { limit: 30 }
    });
    if (!subscription.active) throw 'subscription_not_active';

    this.collection.update(channelId, { subscription });
    return true;
  });

  /**
   * @action Get a channel by username
   * @param {string} username - The channel username to get
   */
  public getChannel = action(
    async ({ onCatch }, username: string): Promise<Channel | false> => {
      onCatch(ui.alert, false);

      const channel = await this.routes.get({ query: { username, includeConnections: true, includeModules: true } });

      this.collection.collect(channel, [], { patch: true });
      return this.collection.getDataValueByIndex('username', username);
    }
  );
}

export const channels = new Channels();

channels.collection.selectors.current;
channels.collection.groups.subscribed;
