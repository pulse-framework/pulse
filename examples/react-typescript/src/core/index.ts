import { App } from './pulse';
import * as state from './state';
import * as routes from './routes';
import { AccountCollection } from './collections';

// Create API instance
export const API = App.API({
  baseURL: 'https://my.api.me',
  timeout: 10000,
  options: {
    credentials: 'include'
  }
});

export default {
  state: { ...state },
  routes: { ...routes },
  collections: {
    accounts: AccountCollection
  },
  API
};
