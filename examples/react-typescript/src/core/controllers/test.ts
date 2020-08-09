import { App } from "../pulse";
import { ICore } from "../core";
const { accounts } = App.Core<ICore>();

export const test = App.Controller({
	state: {
		jeff: App.State("true"),
	},
});
