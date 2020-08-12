import { App } from "../app";

import { ICore } from "../core";
const core = App.Core<ICore>();

export function Test() {
	core.accounts.lol();
}

export const test = App.Controller({
	state: {
		works: App.Computed(() => {
			// return core.accounts.state.LAST_ACCOUNT_ID.value;
		}),
	},
	actions: {
		Test,
	},
});
