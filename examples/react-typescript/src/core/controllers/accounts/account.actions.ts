// Account Actions
import { ICore } from "../../core";
import { App } from "../../app";
import * as routes from "./account.routes";
import {
	AccountState as state,
	AccountCollection as collection,
} from "./account.controller";

// Grab refrence to all controllers via the Core() function
const core = App.Core<ICore>();

// Login function, all errors will be processed by the configurable Pulse error handler
export async function Login() {
	try {
		const creds = state.CREDENTIALS.value;
		// Make API request
		const account = (await routes.Login(creds)).account;
		// Collect latest version of account
		collection.collect(account);
	} catch (e) {
		App.Error(e);
	}
}

export function lol() {
	console.log("lololo");
}
