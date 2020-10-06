import App from '../../app';
import { Account, AccountSettings, ComputedAccountData } from './interfaces';
import { computeHash } from './helpers';

export const state = {
  // store the master copy of the current account
  AUTHED_ACCOUNT: App.State<Partial<Account>>({}),
  // store the session token & persist
  SESSION_TOKEN: App.State('jeff').persist().type(String),
  // store the last email & persist
  LAST_EMAIL: App.State('').persist().type(String),
  // store account settings
  SETTINGS: App.State<AccountSettings>({}),
  // store MFA credentials
  MFA_CREDS: App.State<{ ticket?: string; code?: string }>({})
};

// a component friendly version of the account
const ACCOUNT = App.Computed<Account & ComputedAccountData>(() => {
  return {
    ...state.AUTHED_ACCOUNT.value,
    avatar: computeHash(state.AUTHED_ACCOUNT.value.avatar_hash)
  };
});

export const computed = { ACCOUNT };
