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

The first parameter of the of the Controller function is `ControllerConfig`

```js
const App = new Pulse();

const config = {
    collection: App.Collection()();
    state: {
        MY_STATE: App.State(boolean)
        MY_COMPUTED_STATE: App.Computed<boolean>(() => true)
    }
}
export const accounts = App.Controller(controller);
```

### Controller Config Structure

> The following example is demonstrating the structure of the `ControllerConfig` with a Typescript interface, in practice this of course would be a real object.

```js
interface ControllerConfig {
    name?: string;
    collection?: Collection | { [name: string]: Collection }; // A single Collection, or an object of Collections
    groups?: { [name: string]: Group } // an object of Groups
    selectors?: { [name: string]: Selector } // an object of Selectors
    actions?: { [name: string]: Function } // an object of functions
    helpers?: { [name: string]: Function }  // an object of functions
    routes?: { [name: string]: Function }  // an object of functions
}
```

These are the only available properties for the `ControllerConfig`, any aditional will be ignored. However it is possible to add custom root properties ([See Below]()).

::: tip Type Safety
For Typescript users, the inferred types of the object you pass in will be preserved, but only for the properties shown on the above object.
:::

## Custom Root Properties

In some cases you will prefer to use more than the default Controller categories, you might want to spread actions to the root of the controller instance so they can be access like the following.

```js
accounts.myAction();
```

We can do this with the second parameter of the `App.Controller` function. The properties of the supplied object will be spread to the root of the Controller instance.

In order to maintain type safety we can export the account and cast a custom type that combines the `controller` with `actions` in this case.

```js
const controller = App.Controller({
    state: AccountState,
    collection: AccountCollection,
    routes,
}, actions);

export const accounts = controller as typeof controller & typeof actions;
```