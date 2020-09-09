---
title: Style Guide
---

### Style Guide

You're free to design your application in whichever way suits your needs, but this is the Pulse way:

<!-- - Index files`index.ts`should only handle imports/exports.
- File names should be formatted as [module]().[type]().[extention](). `(eg: auth.routes.ts)`
- Your Pulse code is the core of your application, so would sit in a directory or repository named "core".
- Your core file structure would consist of the following directories:
  ::: vue
  ├── **core**
  │ ├── .**index.ts** _Export core object_
  │ ├── .**pulse.ts** _new Pulse()_
  │ │ ├── `api`
  │ │ │ └── **index.ts**
  │ │ │ └── **api.service.ts** _For rest api users_
  │ │ │ └── **socket.service.ts** _For websocket users_
  │ │ │ └── **routes**
  │ │ │ │ ├── **account.routes.ts** _api/socket endpoints for accounts_
  │ │ ├── `controllers`
  │ │ │ └── **accounts**
  │ │ │ │ ├── **index.ts**
  │ │ │ │ ├── **account.state.ts** _State, Computed State & Collections_
  │ │ │ │ ├── **account.actions.ts**
  │ │ ├── `interfaces` _Typescript users_
  │ │ │ └── **account.interfaces.ts**
  │ │ │ └── **global.interfaces.ts**
  │ │ ├── `utils`
  │ │ │ └── **index.ts**
  │ │ ├── `data` _(Optional)_
  │ │ │ ├── **lists.json**
  └── **package.json**
  :::

* Controller actions should never directly return route response
* Controller actions should recieve prameters instead of just one object to assemple request payloads
* Controller functions should use async / await when calling routes -->
