---
title: Style Guide
---

### Style Guide

You're free to design your application in whichever way suits your needs, but this is the Pulse way:

Index files `index.ts` should only be used for imports and exports of your modules

- File names should be formatted as [module]().[type]().[extention](). `(eg: auth.routes.ts)`
- Your Pulse code is the core of your application, so would sit in a directory or repository named "core".
- Your core file structure would consist of the following directories:
  ::: vue
  ├── **core**
  │ ├── .**index.ts** _Export core object_
  │ │ ├── `modules`
  │ │ │ ├── **accounts**
  │ │ │ │ ├── **index.ts** _Import actions, states, routes and export as a default object_
  │ │ │ │ ├── **account.actions.ts** _Methods_
  │ │ │ │ ├── **account.state.ts** _State, Computed State & Collections_
  │ │ │ │ ├── **account.types.ts** _for TypeScript users (Optional)_
  │ │ │ │ ├── **account.routes.ts** _for all your routes_
  │ │ │ └── **index.ts** _Export all the modules with the correct name (ex: `export { default as accounts } from './accounts`)_
  │ │ ├── `utils` _(Optional)_
  │ │ │ └── **index.ts**
  │ │ ├── `data` _(Optional)_
  │ │ │ ├── **lists.json**
  └── **package.json**
  :::

* Controller actions should never directly return route response
* Controller actions should recieve prameters instead of just one object to assemple request payloads
* Controller functions should use async / await when calling routes
