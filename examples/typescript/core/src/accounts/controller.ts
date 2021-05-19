import {
  action,
  Controller,
  // log, callback,
  state,
  event,
  collection
} from '@pulsejs/core';

class Accounts extends Controller {
  public state = {
    authToken: state<string | null>(null).persist()
  };
  public collection = collection<Account>().createGroup('jeff').createGroup('twan').createSelector('mine');
}

export const accounts = new Accounts();
