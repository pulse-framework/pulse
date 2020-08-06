// Account Actions
import { Core } from "../../core";
import { App } from "../../pulse";
// Functions exported from here will be accessible in the accounts conroller

// Grab refrence to all controllers via the Core() function
const { accounts } = App.Core<Core>();

// Login function, all errors will be processed by the configurable Pulse error handler
export async function Login() {
	try {
		const creds = accounts.state.CREDENTIALS.value;
		// Make API request
		const account = (await accounts.routes.Login(creds)).account;
		// Collect latest version of account
		accounts.collection.collect(account);
	} catch (e) {
		App.Error(e);
	}
}
