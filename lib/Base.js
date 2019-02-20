import Collection from './Collection';

export default class Base extends Collection {
  constructor(
    global,
    {
      // collection
      data = {},
      actions = {},
      routes = {},
      filters = {},
      groups = [],
      persist = []
    }
  ) {
    // Before we invoke the parent class, we define some defaults

    // Defaults
    data.isAuthenticated = false;
    data.pendingRequests = [];
    persist.push('isAuthenticated', 'requestURL');

    // Invoke the parent
    super(
      { name: 'base', global },
      { data, actions, groups, persist, routes, filters }
    );
  }
}