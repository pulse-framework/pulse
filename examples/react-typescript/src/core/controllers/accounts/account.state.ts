import { App } from "../../app";
import { AuthCreds, AccountBody } from "./account.interfaces";

import { ICore } from "../../core";
const core = App.Core<ICore>();

// Define a Pulse Collection to store theoretical authenticated accounts
export const collection = App.Collection<AccountBody>()(Collection => ({
	selectors: {
		CURRENT: Collection.Selector().persist(),
	},
}));

// Define an object of state instances with chained modifiers
export const state = {
	LAST_ACCOUNT_ID: App.State<number>(0).persist("LAST_ACCOUNT_ID"),
	CREDENTIALS: App.State<AuthCreds>({}).persist(),
	JEFF: App.State<AuthCreds>({}),
};

export const computed = {
	TEST: App.Computed((): boolean => {
		return core.test.state.HAHA.value;
	}),
};
