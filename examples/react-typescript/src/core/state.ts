import { App } from './pulse';

export const DARK_THEME = App.State(false)
  // .persist('DARK_THEME')
  .interval(value => !value, 3000)
  .type(Boolean);

export const AUTH_TOKEN = App.State('')
  .persist('DARK_THEME')
  .type(String);

export const THE_TIME = App.State(new Date())
  .interval(() => new Date())
  .type(String);

export const SESSION_DURATION = App.Computed([THE_TIME], function() {
  return ((THE_TIME.value.getTime() - THE_TIME.initalState.getTime()) / 1000).toFixed();
});
