import { App } from './pulse';

interface AccountData {
  id: number;
  username: string;
}

export const AccountCollection = App.Collection<AccountData>({
  name: 'accounts',
  primaryKey: 'id'
});

AccountCollection.collect({ id: 1, username: 'jamie' });
