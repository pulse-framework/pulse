---
title: Ideas
---

# Ideas

This is a dump for things we could implement in the future

## Status

A system to store temp status data, for example a form field error.

Can be subscribed to by a component for easy UI implementation

```js
App.status.set('username').invalid().message('Username is already taken');

App.status.remove('username');
App.status.clear();

App.status.state; // state instance containing all current errors / messages
// can be used in components with usePulse

App.status.get('username'); // returns StatusObject
```

The data would be stored and available as follows:

```ts
interface StatusData {
  [key: string]: {
    message: string | null;
    status: 'invalid' | 'success' | 'error';
  };
}
```
