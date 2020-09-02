import React from "react";
import { App } from "./core";
import { useEvent } from "pulse-framework";

// create event
const ALERT = App.Event<{ message: string }>();

// listen to event
ALERT.on(payload => {
	payload?.message; // typesafe payload
});

// emit event
ALERT.emit({ message: "pulse events best events" });

// create a cluster of events
const events = App.EventGroup(Event => ({
	// define an alert event with a payload of { message: string }
	ALERT: Event<{ message: string }>(),
	// an alert without a payload
	DO_SOMETHING_ELSE: Event(),
}));

export function MyComponent() {
	// useEvent to easily hook into React component
	useEvent(events.ALERT, payload => {
		payload?.message;
		// do anything
	});
	return <div></div>;
}
