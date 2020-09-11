---
title: Setup With Next
---

# NextJS Setup

NextJS is a web framework for React. [Learn more.](https://nextjs.org/)

## Installation

```
yarn add @pulsejs/core @pulsejs/react @pulsejs/next
```

## Initialization

```ts
import Pulse from '@pulsejs/next';

export const App = new Pulse();
```

NextJS is built on top of React, which means Pulse will work just the same as usual with just the [React]() setup. However if your application needs to make state changes server-side then this add-on for Pulse will help you out!

## What is SSR?

The basic concept of sever side rendering entails your server rendering the page first, so the client doesn't have to. NextJS achieves this with the function `getSeverSideProps`. This means the JS in your app will run once on the server, then once again on the client. Because of this there would be an identical instance of Pulse created on either end.

If any changes happen at runtime on the server, these changes must be sent with the HTML content back to the client. This integration for Pulse provides a function to make that extremely simple.

# `preserveServerState()`

This function will analyse your Pulse instance and extract all State and Collections, unpack the important data and sterilize it for injection into the rendered HTML.

```ts
import { preserveServerState } from '@pulsejs/next';

// NextJS getServerSideProps function
export async function getServerSideProps(context) {
  const data = { props: {} };

  // server side changes happen here...

  return preserveServerState(data);
}
```

There are some rules to remember for preserving State changes on the server...

- State **must** have a name, you can set this with `.key()` (Controllers do this for you!)
- State must have been changed from the initial value (`State.isSet` must be `true`)

This function will return the same `data` object passed in, but with `PULSE_DATA` injected into `data.props` containing the sterilized Pulse data.
