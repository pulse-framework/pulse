import App from '../../app';
import { AuthCreds } from './interfaces';
import { state } from './state';
import * as routes from './routes';

import { ICore } from '../../core';
const core = App.Core<ICore>();

export async function login(creds: AuthCreds): Promise<void> {
  try {
    // make API request
    const res = await routes.SessionAuth(creds);
    if (!res?.session?.token) throw 'session_not_returned';
    // set the token in storage
    state.SESSION_TOKEN.set(res.session.token);
    // global error handler
  } catch (e) {
    App.Error(e, 'login_error');
  }
}
