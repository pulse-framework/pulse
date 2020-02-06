import { App } from './pulse';

export const DARK_THEME = App.State(false)
	// .persist('DARK_THEME')
	.interval(value => !value)
	.type(Boolean);

export const AUTH_TOKEN = App.State('')
	.persist('DARK_THEME')
	.type(String);

export const THE_TIME = App.State(new Date())
	.interval(() => new Date(), 10)
	.type(String);
