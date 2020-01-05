---
title: What is Pulse?
---

Pulse is a global state and logic framework for reactive Javascript applications. Supporting frameworks like VueJS, React and React Native. Lightweight, modular and powerful, but most importantly friendly to beginners.

Pulse replaces global state management solutions such as Redux, VueX and MobX, including HTTP libraries such as Axios, Fetch or Request.js. It makes your application more modular, ensuring you follow the best practices while writing significantly less code. Your Pulse code can be used in many different applications, such as a webapp in Vue and a mobile app in React native; if it uses Javascript, it can use Pulse.

## Why Pulse?

After exploring the many options for Javascript state libraries, including the popular VueX and Redux, I felt like I needed a simpler solution. I wanted to get more out of a library than just state management― something that could provide solid structure for the **entire** application. It needed to be structured and simple, but also scalable. This framework provides everything needed to get a reactive javascript front-end application working fast, taking care to follow best practices and to employ simple terminology that makes sense even to beginners.

I built Pulse reflective of the architecture in which we use at Notify.me, and as a replacement for VueX at Notify also, making sure it is also compatible with React and vanilla environments. The team at Notify love it and I think you will too.

## Features

- :gear: Modular structure ([Modules](/v2/docs/modules.html))
- :zap: Reactive data ([Reactivity](/v2/docs/concepts.html#reactivity)) `pulse.something = somethingElse`
- :robot: Computed data with automatic dependency tracking ([Computed](/v2/docs/computed.html))
- :first_quarter_moon: Lifesycle hooks [`watch()`]() / `onReady()` / `nextPulse()`
- :gem: SSOT architecture (single source of truth)
- :nerd_face: DB/ORM-like structure with [Collections](/v2/docs/collections.html#collection-basics)
- :sparkles: Automatic data normalization using [Collect](/v2/docs/collections.html#what-is-data-normalization) `collection.collect()`
- :lock: Model based [data validation](/v2/docs/collections.html#models) with Collections
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

<!-- ## Is Pulse for you?

The most attractive part of Pulse for me personally is how easy it is to work with, which makes it good for a variety of different projects. Though it does scale well for applications that have many different types of data. -->
