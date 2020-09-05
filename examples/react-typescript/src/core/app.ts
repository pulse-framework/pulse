import React from "react";
import Pulse, { usePulse } from "pulse-framework";

export const App = new Pulse({
	framework: React,
});

// debugging only
// @ts-ignore
globalThis.App = App;
