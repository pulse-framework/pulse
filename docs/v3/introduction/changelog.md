---
title: Changelog
---

## 3.1 - The one with Events
Bug fixes and some cool new features. 
- Added [Events](): A clean and simple event system.
- Added [useEvent()]() React hook.
- Added typesafety for [usePulse()]() React hook.
- Added [Status]() tracker class.
- Fixed Controller key assignment for persisted State.
- Fixed cyclic imports with `internal.ts`
- Refactored `storage.ts`.
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
