import { Core } from '../../core';

export function UpdateAccount() {
  Core().accounts.collection.findById(1);
  return true;
}

export function UpdateAccount2() {
  return true;
}
