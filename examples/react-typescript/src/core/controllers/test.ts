import { App } from "../pulse";
import { ICore } from "../core";

const core = App.Core<ICore>(); // works

export function Test() {
	console.log(core.accounts);
	core.accounts.lol();
}

export const test = App.Controller({
	state: {
		jeff: App.State("true"),
	},
	actions: {
		Test,
	},
});
