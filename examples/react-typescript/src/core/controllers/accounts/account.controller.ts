import { App } from "../../pulse";
import { AccountBody } from "./account.interfaces";

import * as actions from "./account.actions";
import * as helpers from "./account.helpers";
import * as routes from "./account.routes";

// define state as an object of state instances
// state object can also contain computed values
const state = {
	LAST_ACCOUNT_ID: App.State<string>("").persist(),
	ENABLE_SOMETHING: App.State<boolean>(true).persist().type(Boolean),
};

// define collection
const collection = App.CollectionT<AccountBody>()(collection => ({
	indexAll: true,
	groups: {
		AUTHED: collection.Group(),
	},
	selectors: {
		CURRENT: collection.Selector(),
	},
}));

collection.selectors.CURRENT.output;

// define controller and pass in imports
export const accounts = App.Controller({
	state,
	collection,
	actions,
	helpers,
	routes,
});
