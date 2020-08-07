// Account Actions
import { ICore } from "../../core";
import { App } from "../../pulse";
// Functions exported from here will be accessible in the accounts conroller

// Grab refrence to all controllers via the Core() function
const { accounts, test } = App.Core<ICore>();

// Login function, all errors will be processed by the configurable Pulse error handler
export async function Login() {
	try {
		console.log(test.state.jeff.value);
		const creds = accounts.state.CREDENTIALS.value;
		// Make API request
		const account = (await accounts.routes.Login(creds)).account;
		// Collect latest version of account
		accounts.collection.collect(account);
	} catch (e) {
		App.Error(e);
	}
}
