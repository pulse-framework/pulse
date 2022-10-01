# Pulse Framework
______________________________________________________________

### NO LONGER MAINTAINED
There's a sea of brilliant state libraries out there to use instead.
Pulse taught me Typescript and had a good run, but I use TanStack Query + Valtio in newer projects.
-Jamie
______________________________________________________________
**Global state and logic for reactive JavaScript applications.** Supports frameworks like React, Vue, and React Native.

**Lightweight, modular and powerful.** Provides a **core** state & logic framework for your entire application; plug-and-play directly into any UI framework.

Replaces Redux, Vuex, and MobX for state; and for API requests, replaces Axios and `fetch`.

**Created by [@jamiepine](https://twitter.com/jamiepine)**

### Read the docs at [pulsejs.org](https://pulsejs.org).

[![Join Discord](https://discordapp.com/api/guilds/658189217746255881/embed.png)](https://discord.gg/RjG8ShB)
[![Follow Pulse on Twitter](https://img.shields.io/twitter/follow/pulseframework.svg?label=Pulse+on+Twitter)](https://twitter.com/pulseframework)
[![Follow Jamie Pine on Twitter](https://img.shields.io/twitter/follow/jamiepine.svg?label=Jamie+on+Twitter)](https://twitter.com/jamiepine)

```ts
const App = new Pulse();

const hello = App.State<string>('the sound of music');
```

## Why Pulse?

Pulse Framework provides a complete toolset to build front-end applications quickly and efficiently. It encourages you to construct a single core library that can be used in any UI framework. The core handles everything at the center of your application — state management, API requests, and all miscellaneous logic and calculations. Pulse supplies computed data to your UI components with full reactivity, in the framework of your choice.

### TypeScript

Pulse is fully written in TypeScript and supports it heavily. Everything is type-safe out of the box and encourages you to write clean, typed code.

**Read the [documentation](https://pulsejs.org/v3/introduction/what-is-pulse.html) to learn more!**
