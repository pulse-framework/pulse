import { App } from "../../app";
import { AuthCreds } from "./account.interfaces";
import * as actions from "./account.actions";
import * as routes from "./account.routes";
// import * as helpers from "./account.helpers";

export interface AccountBody {
	id: number;
	username: string;
	email: string;
}
// Define an object of state instances with chained modifiers
export const AccountState = {
	LAST_ACCOUNT_ID: App.State<number>(0).persist("LAST_ACCOUNT_ID"),
	CREDENTIALS: App.State<AuthCreds>({}).persist(),
	JEFF: App.State<AuthCreds>({}),
};
// Define a Pulse Collection to store theoretical authenticated accounts
// Pass in AccountBody type as generic "DataType"
// All data items, groups and selectors within this collection will be given the AccountBody type
export const AccountCollection = App.Collection<AccountBody>()(Collection => ({
	groups: {
		AUTHED: Collection.Group().persist(), // a group for all authenticated accounts
	},
	selectors: {
		// NEW: Introducing Selectors for Collections
		CURRENT: Collection.Selector().persist("CURRENT_CHANNEL"), // cached reference to the current account within this collection
	},
}));

const AccountComputed = {
	TEST: App.Computed(() => {
		return true;
	}),
};

// Define controller and pass in imports
export const accounts = App.Controller({
	state: { ...AccountState, ...AccountComputed },
	collection: AccountCollection,
	routes,
}).root(actions);
