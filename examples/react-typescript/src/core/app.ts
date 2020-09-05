import React from "react";
import Pulse, { usePulse } from "pulse-framework";

console.log(Pulse, usePulse);

export const App = new Pulse({
	framework: React,
});

// debugging only
// @ts-ignore
globalThis.App = App;
