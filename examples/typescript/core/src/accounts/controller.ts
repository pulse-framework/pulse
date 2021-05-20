import {
  action,
  Controller,
  // log, callback,
  state,
  // form,
  model,
  event,
  collection
} from '@pulsejs/core';

class Accounts extends Controller {
  public state = {
    authToken: state<string | null>(null).persist()
    // createAccount: form(data => ({
    //   username: model.string().min(3).max(50).required(),
    //   password: model.string().min(8).max(50).required(),
    //   passwordVerify: model.equalTo(data.password).required().hidden()
    // }))
  };

  public collection = collection<Account>().createGroups(['jeff', 'lol']);
}

export const accounts = new Accounts();

// accounts.state.createAccount.getProperty('username').hasError;
// accounts.state.createAccount.getProperty('username').errorMessage;

function Test<T extends string>(items: T[]) {
  const obj: Record<T, boolean> = {} as Record<T, boolean>;
  // items.forEach(item => obj[item] = true);
  return obj;
}

const test = Test(['jeff', 'haha']);
