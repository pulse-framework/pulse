import { App } from "../../app";
import { state, computed, collection } from "./account.state";
import * as actions from "./account.actions";
import * as routes from "./account.routes";

export const accounts = App.Controller({
	state: { ...state, ...computed },
	collection,
	routes,
}).root(actions);
