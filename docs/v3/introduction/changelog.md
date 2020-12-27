---
title: Changelog
---
## 3.5 - The one with Actions

::: tip Current NPM version
This is the current release build available on NPM

```
yarn add @pulsejs/core
```

See updated integration with [React](../getting-started/setup-with-react.html) and [Next](../getting-started/setup-with-next.html)
:::

**NEW FEATURES**
- Added [App.Action()]() - A better way to write actions. [still WIP]
- Added [App.Error()]() - A global error handler. [still WIP]
- Added [App.track()]() - Track multiple mutations and revert using returned [`undo()`]() method.
- Added [App.batch()]() - Increase performance by batching multiple mutations.*
- Added [Collection.onCollect()]() - Mutate data on collect.
> onCollect is a persistent alternative to [`Collection.compute()`]() which runs the mutate function only on Group output, not affecting original data. onCollect will mutate each data item collected as it is collected.
- Added [Event.onNext()]() - Run a callback once after next event.

**BIG PERFORMANCE GAINS**: 
- Groups can now _**soft rebuild**_ when generating output, avoiding rebuilding from scratch every time data was changed. Group will memorize the change key & index, applying a custom splice action to the cached output data.
- *`App.batch()` Can be used to instruct runtime to batch State mutations together, this will result in the side effects being squashed and offset to the end of the batch.
- Removed a `Collection.getGroup()` memory leak when used inside a Computed function, where no group is found. It would return an empty group that is dependent on the Computed function, which would add a useless dependent every recompute. Now `getGroup()` memorizes the requested key by creating a provisional group registered in the Collection.

**MISC FIXES**:
- [Computed]() will now generate immediately if created _after_ core has initialized (App.Core())
- [Group.index]() now returns the index accurate to the output.
    > Useful if missing data was encountered during Group build. Previously it was an alias for `Group.value` directly, which could contain primary keys for data that does not exist in the collection. `Group.index` is now always true to `Group.output`, while `Group.value` contains the primary keys desired to be in a group, even if they don't exist in the Collection.
- [Group.add()]() now accepts multiple primary keys.
- [Collection.put()]() will now create groups if they do not already exist.
- Fixed bug with API class that was causing one-time header overrides to persist to all future route calls.
- API class will allow you to set content-type, previously it forced auto detection.
- [State.interval()]() now returns _this_, saves interval id locally and provides [`State.clearInterval()`]().
- Collection's default group will not be auto created unless specified in config OR no groups are provided at initialization.
- **Typescript:** [usePulse()]() when used with Groups has working types.


Big improvements to documentation!

## 3.4 - The one with useWatcher()

- Added State.record() to optionally track mutation history
- Added `useWatcher()` for React integration
- Watchers can now accept callbacks as the first parameter, returning a unique key for cleanup (non breaking)
- Collect method now preserves the correct order when collecting more than one item in unshift mode
- Collection `forEachItem` function now allows you to return a modified object
- Computed now throws and error if no function is provided

## 3.3 - The one with [@pulsejs]() imports

- Deprecated NPM package `pulse-framework`
- Converted Pulse to monorepo with new NPM org ([@pulsejs](https://www.npmjs.com/org/pulsejs))
- Removed `framework` and `frameworkConstructor` from Pulse config
- Added packages `@pulsejs/react`, `@pulsejs/next`
- Fixed major bug with NextJS support

## 3.2 - The one with NextJS support

This release features NextJS support, however is not as stable as 3.3, so we recommend using that instead.

- Added [NextJS support]() for server-side rendering
- Added default Group for Collections [More]()
- Removed Herobrine.

## 3.1 - The one with Events

Bug fixes and some cool new features.

- Added [Events](), a clean and simple event system.
- Added [useEvent()]() React hook.
- Added typesafety for [usePulse()]() React hook.
- Added [Status]() tracker class.
- Added [Pulse.with()]() as an alternate way to init the chosen framework.
- Added [Controller.root()]() to bind root properties to Controller with typesafety. _BREAKING CHANGE_ (removed second param)
- Added Controller alias for primary Collection groups and selectors.
- Fixed Controller key assignment for persisted State.
- Fixed cyclic imports with `internal.ts`
- Refactored `storage.ts`.
- Added webpack to output single file for dist.
- More unit tests.
- More docs!
- Removed Herobrine.

## 3.0

### **Welcome to Pulse `3.0`** :grin:

**This is a new syntax** so if you're migrating from older versions your code will break. However most of the core concepts remain the same; Collections, Groups, Computed, etc. You you should be able to migrate easily, but if you still need need help we can answer your questions via [Discord](https://discord.gg/2ranK7j).

```ts
const App = new Pulse();

const Hello = App.State<string>('the sound of music');
```

### :gem: New Features

See full [documentation]() for everything new!

- Complete rewrite
- Fully **typesafe**, written in Typescript. (Intellisense for TS users!)
- **Modular syntax** for better control and efficiency.
- **70%** reduction on code bundle size.
- **usePulse** React Hook.
- Better **API** module with typed request and response body.
- SSR compatible with NextJS.
- Added Collection.Selector()
- Added Controllers
- **Namespace** no longer controlled by Pulse, everything is completely modular.

### Conclusion

> The mechanics are simpler, yet the function is stronger.

- Employing Typescript from the start has lead to stabler, testable code.
- Architectural changes have allowed for a huge code reduction.
- The State class is the foundation for everything and the only class the Pulse Runtime will handle.
- Groups, Computed, Selectors and Collection Data all extend the State class.
- Code written with Pulse now looks clean at scale, and works better at scale.
- **Finally, SSR!**
