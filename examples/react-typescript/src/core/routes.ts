import { API } from '.';
import { AccountBody } from './interfaces';
import { AUTH_TOKEN } from './state';

/**
 * Login to my cool API
 */
export async function login(creds: {
  username: string;
  password: string;
}): Promise<{ account: AccountBody; token: string }> {
  let response = (await API.post('auth/login', creds)).data;

  AUTH_TOKEN.set(response.token);

  return response;
}
