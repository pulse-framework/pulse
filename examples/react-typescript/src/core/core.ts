// import Pulse first
import { App } from "./pulse";
import { accounts } from "./controllers/accounts";
import { test } from "./controllers/test";
import Pulse from "pulse-framework";
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
export const core = App.Core({
	accounts,
	test,
});

// export core as internal alias function
export type ICore = typeof core;
