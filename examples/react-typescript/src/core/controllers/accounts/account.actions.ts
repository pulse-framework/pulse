// Account Actions
import { App } from "../../app";
import * as routes from "./account.routes";
import { state, collection } from "./account.state";

// Grab reference to all controllers via the Core() function
import { ICore } from "../../core";
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
