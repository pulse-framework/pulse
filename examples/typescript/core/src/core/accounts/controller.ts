import { action, Controller, log, callback, state, event, collection } from '@pulsejs/core/lib';
=
class Accounts extends Controller {
  public state = {
    authToken: state<string | null>(null).persist()
  };
  public collection = collection<Account>().group('jeff').group('twan').selector('mine');
}

export const accounts = new Accounts();
