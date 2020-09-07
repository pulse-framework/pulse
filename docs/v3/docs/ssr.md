---
title: NextJS SSR
---

## Introduction

# NextJS SSR

The basic concept of sever side rendering entails your server rendering the page first, so the client doesn't have to. This means the JS in your app will run once on the server, then once again on the client. Because of this there would be an identical instance of Pulse created on either end.

If any changes happen at runtime on the server, these changes must be sent with the HTML content back to the client. This sub-module of pulse provides two functions to make that extremely simple.

## Setup

```ts
import { preserveServerState, loadServerState } from 'pulse-framework/next';
```

This code is not bundled with the main Pulse module, so you must import it from `/next`.

# `preserveServerState()`

This function will analyse your core and extract all State and Collections, unpack the important data and sterilize it.

```ts
const App = new Pulse().with(React);

// very simple core example
const core = App.Core({
  myController: App.Controller({
    state: { MY_STATE: App.State(1) }
  })
});

// NextJS getServerSideProps function
export async function getServerSideProps(context) {
  const data = { props: {} };

  return preserveServerState(data, core);
}
```

There are some rules to remember for preserving State changes on the server...

- State **must** have a name, you can set this with `.key()` (Controllers do this for you!)
- State must have been changed from the initial value (`State.isSet` must be `true`)

This function will return the same `data` object passed in, but with `_PULSE_DATA_` injected into `data.props` containing the sterilized Pulse data.

# `loadServerState()`

Now you've preserved the changes to your core, you can run `loadServerState()` right before your app mounts to initialze your core with the correct values from the server.

```ts
loadServerState(core);
```

It's that simple!

This function will of course be called on the server too, but will not do anything as it knows if it's being called in a browser environment or not.
