---
title: Pulse Instance
---

# Pulse Instance

Everything you write with Pulse will use the `App` instance. which is created with `new Pulse()`. With this you can create [State](), [Computed State](), [Collections](), [APIs]() and more.

The Pulse Instance is unique to your application, you only need one. It should be exported top-level and imported into core files.

```ts
const App = new Pulse();
```

The Pulse Instance provides helpful function to your application, and the way you write your [Core]().

- Queueing [State]() changes and preventing race conditions.
- Providing global awareness to [Computed State]() for automatic dependency tracking.
- Intergrating with persistent storage.
- Initializing the [Core]() structure.
- Issuing squashed updates to subscribed components via the [Pulse Runtime]().

## Configuration Options

Pulse takes an optional configuration object as the only parameter

```ts
const App = new Pulse({
  framework: React,
  storagePrefix: 'CoolApp'
});
```

> Here's a Typescript interface for quick refrence, however each property will be explained in more detail below.

```ts
interface PulseConfig {
  storagePrefix?: string;
  computedDefault?: any;
  waitForMount?: boolean;
  framework?: any;
  frameworkConstructor?: any;
  storage?: StorageMethods;
  logJobs?: boolean;
}

interface StorageMethods {
  type?: 'custom' | 'localStorage';
  async?: boolean;
  get?: any;
  set?: any;
  remove?: any;
}
```
