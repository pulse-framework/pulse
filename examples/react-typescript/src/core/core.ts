// import Pulse first
import { App } from "./app";
import { accounts } from "./controllers/accounts";
import { test } from "./controllers/test";

// Create API instance
export const API = App.API({
	baseURL: "https://my.api.me",
	timeout: 10000,
	options: {
		credentials: "include",
	},
});

// export static core
export const core = App.Core({
	accounts,
	test,
});

// export core as internal alias function
export type ICore = typeof core;
