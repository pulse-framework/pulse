# Pulse Framework

Pulse is a global state and logic framework for reactive Javascript applications. Supporting frameworks like VueJS, React and React Native. Lightweight, modular and powerful, but most importantly friendly to beginners.

Pulse replaces global state management solutions such as Redux, VueX and MobX, including HTTP libraries such as Axios, Fetch or Request.js. It makes your application more modular, ensuring you follow the best practices while writing significantly less code. Your Pulse code can be used in many different applications, such as a webapp in Vue and a mobile app in React native; if it uses Javascript, it can use Pulse.

## Features

- :gear: Modular structure ([Modules](https://pulsejs.org/v2/docs/modules.html))
- :zap: Reactive data ([Reactivity](https://pulsejs.org/v2/docs/concepts.html#reactivity)) `pulse.something = somethingElse`
- :robot: Computed data with automatic dependency tracking ([Computed](https://pulsejs.org/v2/docs/computed.html))
- :first_quarter_moon: Lifecycle hooks [`watch()`]() / `onReady()` / `nextPulse()`
- :gem: SSOT architecture (single source of truth)
- :nerd_face: DB/ORM-like structure with [Collections](https://pulsejs.org/v2/docs/collections.html#collection-basics)
- :sparkles: Automatic data normalization using [Collect](https://pulsejs.org/v2/docs/collections.html#what-is-data-normalization) `collection.collect()`
- :lock: Model based [data validation](https://pulsejs.org/v2/docs/collections.html#models) with Collections
- :timer_clock: Mutation history tracking with [smart undo]() `collection.undo()`
- :crystal_ball: Dynamic relations between collections using [Populate]() `populate()`
- :wrench: Wrappers for utils and services
- :construction: Task queuing for race condition prevention
- :telephone_receiver: Promise based HTTP requests and websocket connections (web sockets coming soon)
- :hourglass_flowing_sand: Timed interval task handler using [Jobs]()
- :bus: Event bus `pulse.on() / pulse.emit()`
- :floppy_disk: Persisted data API for localStorage and async storage
- :closed_book: Error logging & snapshot bug reporting (WIP)
- :leaves: Lightweight (only 100KB) with 0 dependencies
- :fire: Supports Vue, React and React Native
- :yellow_heart: Well documented (I'm getting there...)

## Why Pulse?

After exploring the many options for Javascript state libraries, including the popular VueX and Redux, I felt like I needed a simpler solution. I wanted to get more out of a library than just state management― something that could provide solid structure for the **entire** application. It needed to be structured and simple, but also scalable. This framework provides everything needed to get a reactive javascript front-end application working fast, taking care to follow best practices and to employ simple terminology that makes sense even to beginners.

I built Pulse reflective of the architecture in which we use at Notify.me, and as a replacement for VueX at Notify also, making sure it is also compatible with React and vanilla environments. The team at Notify love it and I think you will too.

## Get involved

If you wish contribute, that is very much welcome! But please reach out first so we don't work on the same thing at the same time, twitter dm @jamiepine or Discord jam#0001
[Join Community Discord](https://discord.gg/RjG8ShB)

FULL DOCUMENTATION HERE: [pulsejs.org](https://pulsejs.org)

<p align="center">
  <a href="https://patreon.com/jamiepine"><img src="https://img.shields.io/badge/donate-patreon-F96854.svg" alt="Donate on patreon"></a>
  <a href="https://twitter.com/jamiepine"><img src="https://img.shields.io/twitter/follow/jamiepine.svg?label=Follow" alt="Follow on twitter"></a>
  <a href="https://twitter.com/pulseframework"><img src="https://img.shields.io/twitter/follow/pulseframework.svg?label=Pulse+Twitter" alt="Follow Pulse on twitter"></a> 
  <a href="https://discord.gg/RjG8ShB"><img src="https://discordapp.com/api/guilds/658189217746255881/embed.png" alt="Join Discord"></a>
  <a href="https://npmjs.com/pulse-framework"><img src="https://img.shields.io/npm/v/pulse-framework.svg" alt="NPM Package Version"></a>
  <a href="https://npmjs.com/pulse-framework"><img src="https://img.shields.io/npm/dm/pulse-framework.svg" alt="NPM Monthly Downloads"></a>
  <a href="https://npmjs.com/pulse-framework"><img src="https://img.shields.io/npm/dw/pulse-framework.svg" alt="NPM Weekly Downloads"></a>
  <a href="https://npmjs.com/pulse-framework"><img src="https://img.shields.io/npm/dt/pulse-framework.svg" alt="NPM Total Downloads"></a>
  <a href="https://npmjs.com/pulse-framework"><img src="https://img.shields.io/bundlephobia/min/pulse-framework.svg" alt="NPM Bundle MIN Size"></a>
  <a href="https://github.com/jamiepine/pulse"><img src="https://img.shields.io/github/license/jamiepine/pulse.svg" alt="GitHub License"></a>
  <a href="https://github.com/jamiepine/pulse"><img src="https://img.shields.io/github/languages/code-size/jamiepine/pulse.svg" alt="GitHub Code Size"></a>
  <a href="https://github.com/jamiepine/pulse"><img src="https://img.shields.io/github/repo-size/jamiepine/pulse.svg" alt="GitHub Repo Size"></a>
</p>
