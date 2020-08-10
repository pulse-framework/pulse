import { App } from "../app";
import { ICore } from "../core";

const core = App.Core<ICore>(); // works

export function Test() {
	console.log(core.accounts);
	core.accounts.lol();
}

export const test = App.Controller({
	state: {
		// noworks: App.State(core.accounts), // compile error
		works: App.Computed(() => {
			// no complile error
			core.accounts;
		}),
	},
	actions: {
		Test,
	},
});
