import API from '../../api';
import { AuthCreds, Session } from './interfaces';

// Authenticate with credentials and return Session object
export async function SessionAuth(creds: AuthCreds): Promise<{ session: Session }> {
  return (await API.post('login')).data;
}

// Get account data
export async function GetAccount(): Promise<{ account: Account }> {
  return (await API.get('account')).data;
}
