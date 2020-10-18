---
title: Changelog
---
## 3.5 - The one with VueJS support
::: warning Work in progress
This update is currently being worked on, but will be released soon!
:::
- Added onNext to Events

## 3.4 - The one with useWatcher()

- Added State.record() to optionally track mutation history
- Added `useWatcher()` for React integration
- Watchers can now accept callbacks as the first parameter, returning a unique key for cleanup (non breaking)
- Collect method now preserves the correct order when collecting more than one item in unshift mode
- Collection `forEachItem` function now allows you to return a modified object
- Computed now throws and error if no function is provided

## 3.3 - The one with [@pulsejs]() imports

::: tip Current NPM version
This is the current release build available on NPM

```
yarn add @pulsejs/core
```

See updated integration with [React](../getting-started/setup-with-react.html) and [Next](../getting-started/setup-with-next.html)
:::

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
