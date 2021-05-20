---
title: Events
---

## Introduction

# Events

Events are handy for emitting UI updates and passing data with them. Both core functions and components can subscribe to events.

A prime example for when to use events would be showing an alert dropdown inside your app. Your core can emit the event and a top-level component can listen and render alert dropdown with a message.

```ts
const App = new Pulse();

const ALERT = App.Event();
```

::: tip Typescript: Payload Type
Events support an optional generic parameter for the payload type, providing typesafety and VScode intellisense when using your Event.
```ts
const ALERT = App.Event<{ message: string }>();
```
:::


## Configuration

Events can optionally receive a configuration object as the first and only parameter.

```ts
const ALERT = App.Event({ enabled: false });
```

**All config parameters** _(optional)_

| property            | type      | description                                                                                                     | default |
|---------------------|-----------|-----------------------------------------------------------------------------------------------------------------|---------|
| `name?`             | `string`  | The name of this Event, if Event is defined within an [EventGroup](#event-groups) it will inherit the key name. | N/A     |
| `maxSubs?`          | `number`  | Set a maximum amount of subscribers to listen to this event.                                                    | N/A     |
| `enabled?`          | `boolean` | Enable/disable Event, will block emitting if disabled.                                                          | `true`  |
| `disableAfterUses?` | `number`  | If set, Event will be set to `enabled: false` once amount of uses is met.                                       | N/A     |
| `throttle?`         | `number`  | Time in milliseconds to throttle  emitting this Event                                                           | N/A     |
| `queue?`            | `number`  | For use in conjunction with throttle, will add emit calls to a queue                                            | N/A     |

## Emitting
Events can be emitted from anywhere in your application, from your core to your components themselves, though usually the best usage is from the core.
```ts
ALERT.emit({ message: 'notify events best events!' });
```
The only parameter of the `Event.emit()` function is an optional payload.

## Listening
There are two ways to listen to events, firstly using `Event.on()` and secondly using the `useEvent()` hook for React which can be imported from Pulse. 

```ts
ALERT.on(payload => {
    // do something
});
```
The `Event.on()` function returns a cleanup function, which should be used inside components to cleanup when the component unmounts. Most frameworks will complain if you do not cleanup listeners inside your components when they unmount. 
```ts
const cleanup = ALERT.on(payload => {});

cleanup();
```
This syntax is bulky considering you must invoke the cleanup function on component unmount, so with React the `useEvent()` hook will cleanup for you!
```ts
import React from 'react';
import { useEvent } from '@pulse/react';

export function MyComponent() {
	useEvent(ALERT, payload => {
		// do anything
	});
	return <div></div>;
};
```
Eventually we will implement similar support for Vue components.

## Event Groups
In some cases you might want a cleaner way to define a group of Events at the same time. They are not related to each other in any way other than defining them with a cleaner syntax. Event Groups also assign the `name` property automatically.

```ts
const events = App.EventGroup(Event => ({
	JUST_AN_EVENT: Event(),
	ALERT: Event<{ message: string }>({ throttle: 100 })
}));
```

## useEvent()
This is a React hook for functional components that allows you to use an Event with automatic cleanup

```ts
import React from 'react';

export function MyComponent(props) {
	
	useEvent(events.ALERT, () => {
		// do something
	})

	return <div></div>
}
```
In this example `events` is referencing the EventGroup created above, however usually this would be located inside your [Core](/v3/docs/core.html).

This is a really handy syntax for using Events and we'd recommend all React users.

## Importing Events
It's best practice to export your Events in your [Core](/v3/docs/core.html) object, so they can easily be used within your components.

You might want to make your events global to your core, such as `core.events`, or maybe you'll put them in your [Controllers](/v3/docs/controllers.html) ``core.accounts.events.MY_EVENT``. It's up to you!

