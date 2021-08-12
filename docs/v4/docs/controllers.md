---
title: Controllers
---

## Introduction

# Controller

The Controller function creates a typesafe container for sections of your [core]().

These sections give structure to your application. For example, you would want to seperate `accounts` logic, from `posts` logic. Controllers are the perfect tool for this.

> In this example, the Controller we are accessing is called `accounts`

```ts
core.accounts.collection.findById(1).value;
core.accounts.state.MY_STATE.value;
core.accounts.myAction();
```

## Creating a Controller

The first parameter of the Controller function is `ControllerConfig`

```js
const App = new Pulse();

const config = {
  collection: App.Collection()(),
  state: {
    MY_STATE: App.State(),
    MY_COMPUTED_STATE: App.Computed(() => true)
  }
};
export const accounts = App.Controller(config);
```

## Config Structure

Each of the below properties passed into the config will be made available on the root. Think of these as pre-defined containers within your controller.

| parameter      | type                     | description                                                                           |
| -------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `state?`       | `Object` of `State`      | A container for State objects.                                                        |
| `collection?`  | `Collection`             | The primary Collection also exposes `.groups` and `.selectors` to root of controller. |
| `collections?` | `Object` of `Collection` | Other Collection instances this controller may need.                                  |
| `actions?`     | `Object` of `Function`   |                                                                                       |
| `routes?`      | `Object` of `Function`   |                                                                                       |
| `helpers?`     | `Object` of `Function`   |                                                                                       |

These are the only available properties for the `ControllerConfig`, any additional will be ignored. However it is possible to add custom root properties ([See .root()](#methods)).

::: tip Type Safety
For TypeScript users, the inferred types of the object you pass in will be preserved, but only for the properties shown on the above object.
:::

## Methods

# `.root()`

In some cases you will prefer to use more than the default Controller categories, you might want to spread actions to the root of the controller instance so they can be access like the following.

```js
accounts.myAction();
```

The `Controller.root()` method will return the Controller instance with the properties of the object supplied infused into the Controller at root level.

```ts
const state = { MY_STATE: App.State() };
const actions = { myAction: App.Action() };

const controller = App.Controller({ state }).root(actions);

controller.state.MY_STATE;
controller.myAction();
```

## Structure

This is how a controller folder should be organized.

### `index.ts`

```ts
// import instance
import App from '../../app';
// import state
import { state, computed, collection } from './state';
// import actions, helpers and routes
import * as actions from './actions';

// init controller, merge state and computed state
const controller = App.Controller({ state: { ...state, ...computed }, collection }).root(actions);
```

The order of imports above is important, state/collections must be imported first to also allow them to be imported into `actions.ts` without creating a cyclic import. Sometimes this can cause `import * as ...` to return an empty object at runtime, following this structure will avoid that.

### `state.ts`

```ts
import App from '../../app';

export const collection = App.Collection()(Collection => ({
  groups: {
    MY_GROUP: Collection.Group()
  }
}));

export const state = {
  MY_STATE: App.State('hello')
  // etc...
};

export const computed = {
  MY_COMPUTED: App.Computed(() => {
    return 1 + 2;
  })
  // etc...
};
```

### `actions.ts`

```ts
import App from '../../app';
// import state
import { state, computed, collection } from './state';

export async function MyAction(newVal: string) {
  state.MY_STATE.set(newVal);
}
```

Actions get exported individually for convenience. The same applies for helpers and routes
