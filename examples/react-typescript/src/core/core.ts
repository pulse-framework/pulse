// import Pulse first
import { App } from "./pulse";
import { accounts } from "./controllers/accounts";
// then import controllers

// Create API instance
export const API = App.API({
	baseURL: "https://my.api.me",
	timeout: 10000,
	options: {
		credentials: "include",
	},
});

// export static core
export const core = {
	accounts,
};

// export core as internal alias function
export type Core = typeof core;
