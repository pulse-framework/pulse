# Pulse Framework `3.0`

_Pulse is a global state and logic framework for reactive Typescript & Javascript applications. Supporting frameworks like VueJS, React and React Native._

Lightweight, modular and powerful. An alternative to `Redux`/`VueX`/`MobX` and request libraries such as `Axios`/`Request.js`. Use Pulse to create a **_core_** state & logic library for your application; plug and play directly into any UI Framework.

Created by [@jamiepine]() | Sponsored and maintained by the [Notify Team]()

### Official website: [pulsejs.org](https://pulsejs.org/v3/introduction/what-is-pulse.html)

<p align="left">
  <a href="https://discord.gg/RjG8ShB"><img src="https://discordapp.com/api/guilds/658189217746255881/embed.png" alt="Join Discord"></a>
  <a href="https://patreon.com/jamiepine"><img src="https://img.shields.io/badge/donate-patreon-F96854.svg" alt="Donate on patreon"></a>
  <a href="https://twitter.com/pulseframework"><img src="https://img.shields.io/twitter/follow/pulseframework.svg?label=Pulse+Twitter" alt="Follow Pulse on twitter"></a>
</p>

```ts
const App = new Pulse();

const Hello = App.State<string>('the sound of music');
```

## Why Pulse?

Pulse provides a clean-cut toolset to build a Javascript application quickly and efficiently. It encourges developers to construct a core library that can be dropped into any UI framework. Your `core` is the brain of your application, it will handle everything from state management, API requests to all logic and calculations. Pulse will supply pre-computed data to your UI components, in the framework of your choice with complete reactivity.

### TypeScript

Pulse is written in TypeScript and is designed to support it heavily. Everything is type safe **out of the box** and encourages you to write clean, fully-typed code.

Read the [documentation](https://pulsejs.org/v3/introduction/what-is-pulse.html) to learn more!
