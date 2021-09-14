---
title: Core
---

# Core

The `core` is a single object that contains all Controllers, State, Collections, actions, routes, and helpers as you define them under a Pulse instance.

Think of the core as your custom library of state and methods in a portable container that can be deployed in any JS environment or framework.

It's the final product of a Pulse powered application.

```ts
core.accounts.login();

core.posts.collection.findById(21);

core.authentication.state.TOKEN.value;
```

> _Arbitary examples of how the core can be used._

## Definition

```ts
import { setCore } from '@pulsejs/core'

const core = {
  accounts,
  authentication
};

setCore(core); // register your core and initialize computed states  

export default core;
```

Imports for `accounts` and `authentication` were ommited for this example.

An object forms the root of the core object, in this case we're passing in two arbitrary Controllers.

Now we register the core with `setCore()` which snapshots the core object.

### Caveats

#### 1) Using the core to supply initial state

A way to remember this rule, is to only use `core.` notation inside functions that are not **immediately called**. Such as Computed functions and actions.

```ts
import core from './../core'

const state = {
  noworks: state(core.accounts.state.HELLO.value),  // compile error
  works: state(() => {
    return core.accounts.state.HELLO.value              // no compile error
  }),
},
```

This isn't all bad, you shouldn't need to use other controller data for default state values, most of the time you'll be using that in [Actions]() or [Computed State]().

## Creating your core

Refer to the [examples/react-typescript/src/core]() directory on the Pulse repo for a finalized example.

Create a folder in your application named **_core_**.

::: tip Tip: Using an external core
In some cases you might want to create your core in a seperate repo or monorepo if you wish to use the same core in multiple projects.
:::


At this point, your core should look something like this:
::: vue
├── **/core**
│ ├── **index.ts**
:::

> Leave index.ts empty for now.

### New Directory: `controllers`

Create a folder for your conrollers. Pulse advocates splitting up your core into modules using the [Controller]() class to containerize the module. However this step is optional, you're free to structure your core however you'd like.

> See [Controller]() documentation for more detail

```ts
import core from './core'; // type from the future

export const accounts = {
  IS_NEW_ACCOUNT: state().type(Boolean),
  actions: {
    logout() {
      App.reset(core.authentication.state)
    }
  }
});
```

### New File: `core.ts`

```ts
import accounts from './controllers/accounts';
import authentication from './controllers/authentication';

export const core = setCore({
  accounts,
  authentication
});

export default core;
```

Everything comes together in `core.ts`, it handles importing the Pulse instance, followed by your controllers.

`setCore()` declares the final core structure and saves it to the instance so that subsequent calls.

### Export everything `index.ts`

```ts
import { core } from './core';
export default core;
```

## Structure at scale

Pulse is flexible, so you are free to do you own thing, but you must ensure that at the very least instance creation comes first, core construction comes last.

::: vue
**/core**
├── .**index.ts**
│ ├── `/controllers`
│ │ └── **accounts**
│ │ │ ├── **index.ts** _Create and export controller_
│ │ │ ├── **state.ts** _Define all State, Computed State & a Collection_
│ │ │ ├── **actions.ts** _All account actions as exported function_
│ │ │ ├── **interfaces.ts** _Typescript interfaces for accounts_
│ │ │ ├── **routes.ts** _api/socket endpoints for accounts_
│ ├── `/api`
│ │ └── **index.ts**
│ │ └── **rest.service.ts** _For rest api users_
│ │ └── **socket.service.ts** _For websocket users_
│ ├── `/utils`
│ │ └── **index.ts**
│ ├── `/data` _(Optional)_
│ │ ├── **lists.json**
└── **core.ts** _Construct the core_
:::
