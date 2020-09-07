import { App } from "../app";

import { ICore } from "../core";
const core = App.Core<ICore>();

export function Test() {
	core.accounts.lol();
}

export const test = App.Controller({
	state: {
		HAHA: App.State(true),
		works: App.Computed(() => {
			if (core.accounts.state.LAST_ACCOUNT_ID.value) {
				// return core
			}
		}),
	},
	actions: {
		Test,
	},
});
