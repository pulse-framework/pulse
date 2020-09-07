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
export const App = new Pulse();

const core = {
  accounts,
  authentication
};

export default App.Core(core);

export type ICore = typeof core;
```

Imports for `accounts` and `authentication` were ommited for this example.

The Pulse instance is created first as `App`, followed by an object that forms the root of the core object, in this case we're passing in two arbitrary Controllers.

Now we register the core with `App.Core()` which snapshots the core object. It can now be accessed anywhere with the very same function, without any parameters. (See [Usage]())

> _In practice the initilization of App should be in a seperate file (eg: `app.ts`) as it must occur before the imports that require the `App` instance and TSLint doesn't like code above imports._

See [Creating your core]() for the more detailed structure.

::: tip Why export the type?
We're unable to directly import the core into controllers, as it would create cyclic dependencies which can cause horrible compile issues, especially at scale. This is why we use `App.Core()` to get the core inside controllers, but it still wouldn't be type safe.

However, Typescript types are immune to this paradox and can time travel. :crystal_ball: Once you declare them, they are able to be refrenced in code before and after declaration. This means we can import just the type of the finalized core into our individual controllers.

Now when making changes to one Controller you'll see full intelisense in the other—regardless of the order the controllers are initialized.
:::

## Usage

The core can be accessed from both outside and within itself, which means the syntax is slightly different for each. To demonstrate, we'll import and access a Controller named `accounts`.

> From **within** the core (this could be any file within)

```ts
import { App } from './app'; // instance
import { ICore } from './core'; // type from the future

const core = App.Core<ICore>();
```

This method ensures this Controller can access other Controllers, even ones that might not be initialized yet. We import our time-traveling type `ICore` and assign it to the Core functions' generic.

> From **outside** the core

```js
import core from './core';

core.accounts;
```

It's safe to use the default import here as we know everything has been initialized, this would be the easiest way to access the core in your UI components.

### Caveats

#### 1) Destructuing imports

In an ideal world we'd be able to do this:

```ts
const { accounts } = App.Core<ICore>();
```

This would not work because at import-level accounts has not been defined yet, as assembly of the core happens last.

However if you import **without** destructuing, the constant you assign will be a direct reference to the core object within the App instance. So at runtime it will work.

```ts
const core = App.Core<ICore>();
```

#### 2) Using the core to supply initial state

A way to remember this rule, is to only use `core.` notation inside functions that are not **immediately called**. Such as Computed functions and actions.

```js
const core = App.Core<ICore>();

const state = {
  noworks: App.State(core.accounts.state.HELLO.value),  // compile error
  works: App.Computed(() => {
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

### New File: `app.ts`

This is where you create an instance of Pulse.

```ts
import React from 'react';
import Pulse from 'pulse-framework';

export const App = new Pulse({
  framework: React
});
```

By this point your core should look something like this:
::: vue
├── **core**
│ ├── **index.ts**
│ ├── `app.ts`
:::

> Leave index.ts empty for now.

### New Directory: `controllers`

Create a folder for your conrollers. Pulse advocates splitting up your core into modules using the [Controller]() class to containerize the module. However this step is optional, you're free to structure your core however you'd like.

> See [Controller]() documentation for more detail

```ts
import { App } from './app'; // instance
import { ICore } from './core'; // type from the future

const core = App.Core<ICore>(); // grab sister controller

export const accounts = App.Controller({
  state: {
    IS_NEW_ACCOUNT: App.State().type(Boolean)
  }
  actions: {
    logout() {
      App.reset(core.authentication.state)
    }
  }
});
```

### New File: `core.ts`

```ts
import { App } from './app';

import accounts from './controllers/accounts';
import authentication from './controllers/authentication';

export const core = App.Core({
  accounts,
  authentication
});

export type ICore = typeof core;
```

Everything comes together in `core.ts`, it handles importing the Pulse instance, followed by your controllers.

`App.Core()` declares the final core structure and saves it to the instance so that subsequent calls.

Finally the core is registered and exported and `ICore` is exported as a type declaration.

### Export everything `index.ts`

```ts
import { core } from './core';
export default core;
```

## Structure at scale

Pulse is flexible, so you are free to do you own thing, but you must ensure that at the very least instance creation comes first, core construction comes last.

::: vue
**core**
├── .**index.ts**
├── .**app.ts** _Create Pulse instance_
│ ├── `controllers`
│ │ └── **accounts**
│ │ │ ├── **index.ts** _Create and export controller_
│ │ │ ├── **state.ts** _Define all State, Computed State & a Collection_
│ │ │ ├── **actions.ts** _All account actions as exported function_
│ │ │ ├── **interfaces.ts** _Typescript interfaces for accounts_
│ │ │ ├── **routes.ts** _api/socket endpoints for accounts_
│ ├── `api`
│ │ └── **index.ts**
│ │ └── **rest.service.ts** _For rest api users_
│ │ └── **socket.service.ts** _For websocket users_
│ ├── `utils`
│ │ └── **index.ts**
│ ├── `data` _(Optional)_
│ │ ├── **lists.json**
└── .**core.ts** _Construct the core_
:::
