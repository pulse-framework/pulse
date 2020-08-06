import { App } from "../../pulse";
import { Controller } from "pulse-framework";
import { AuthCreds } from "./account.interfaces";
import * as actions from "./account.actions";
import * as helpers from "./account.helpers";
import * as routes from "./account.routes";

export interface AccountBody {
	id: number;
	username: string;
	email: string;
}
// Define an object of state instances with chained modifiers
const AccountState = {
	LAST_ACCOUNT_ID: App.State<number>(0).persist(),
	CREDENTIALS: App.State<AuthCreds>({}).persist(),
};
// Define a Pulse Collection to store theoretical authenticated accounts
// Pass in AccountBody type as generic "DataType"
// All data items, groups and selectors within this collection will be given the AccountBody type
const AccountCollection = App.Collection<AccountBody>()(Collection => ({
	groups: {
		AUTHED: Collection.Group().persist(), // a group for all authenticated accounts
	},
	selectors: {
		// NEW: Introducing Selectors for Collections
		CURRENT: Collection.Selector(), // cached refrence to the current account within this collection
	},
}));
// Type Saftey Improvements: Collections now use a double parentheses syntax to allow the explicit generic "DataType" while also preserving the inferred types for groups and selectors.
AccountCollection.selectors.CURRENT.value.username; // AccountBody
// Update Selector like this
AccountCollection.selectors.CURRENT.select(2); // select account with id "2" from collection
// Define controller and pass in imports
export const accounts = new Controller({
	state: AccountState,
	collection: AccountCollection,
	actions,
	helpers,
	routes,
});
