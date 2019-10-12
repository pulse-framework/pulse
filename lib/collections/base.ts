import Collection from '../collection';
import { Global, RootCollectionObject } from '../interfaces';

export default class Request extends Collection {
  constructor(global: Global, root: RootCollectionObject = {}) {
    root = Object.assign({}, root);

    // Base as a collection is configured directly from the root of the Pulse config,
    // thus to be verbose we remove the properties only used for global setup
    // default collection properties like data, computed, actions etc will remain
    delete root.collections;
    delete root.request;

    // if user has not created data or persist properties, create them for the defaults.
    if (!root.data) root.data = {};
    if (!root.persist) root.persist = [];

    // can be used to preserve authenticated state
    // automatically persists if local storage is availible
    root.data['isAuthenticated'] = false;
    root.persist.push('isAuthenticated');

    // can be used to declare once the app has finished initilazation, does not affect Pulse
    root.data['appReady'] = false;

    super('base', global, root);
  }
}
