// The account object as returned by the API
export interface Account {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  avatar_hash?: string;
  has_password: boolean;
  has_verified_email: boolean;
  has_mfa: boolean;
}

export interface Session {
  id: string;
  token: string;
}
// Any properties that are not returned by the API and generated locally
export interface ComputedAccountData {
  avatar?: string;
}

export interface AuthCreds {
  email?: string;
  username?: string;
  password?: string;
}

export interface AccountSettings {
  THEME?: 'lunchtime' | 'midnight' | 'eclipse';
  SHARE_USAGE_DATA?: boolean;
  BLOCKED_WORDS?: string[];
  USER_COUNTRY?: string;
}
