import React from "react";
import Pulse from "pulse-framework";
import { preserveServerState } from "pulse-framework/next";

export const App = new Pulse({
	framework: React,
});
const MY_STATE = App.State(true).set(false).key("MY_STATE");

console.log(preserveServerState({ props: {} }, { state: { MY_STATE } }));

console.log(MY_STATE);

// debugging only
// @ts-ignore
globalThis.App = App;
