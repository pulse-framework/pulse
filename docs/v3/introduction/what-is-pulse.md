---
title: What is Pulse?
---

<br />
<br />

# PulseJS

Pulse is a global state and logic framework for reactive Javascript applications. Supporting frameworks like VueJS, React and React Native. Lightweight, modular and powerful, but most importantly friendly to beginners.

Pulse replaces global state management solutions such as Redux, VueX and MobX, including HTTP libraries such as Axios, Fetch or Request.js. It makes your application more modular, ensuring you follow the best practices while writing significantly less code. Your Pulse code can be used in many different applications, such as a webapp in Vue and a mobile app in React native; if it uses Javascript, it can use Pulse.

## Why Pulse?

After exploring the many options for Javascript state libraries, including the popular VueX and Redux, I felt like I needed a simpler solution. I wanted to get more out of a library than just state management― something that could provide solid structure for the **entire** application. It needed to be structured and simple, but also scalable. This framework provides everything needed to get a reactive javascript front-end application working fast, taking care to follow best practices and to employ simple terminology that makes sense even to beginners.

I built Pulse reflective of the architecture in which we use at Notify.me, and as a replacement for VueX at Notify also, making sure it is also compatible with React and vanilla environments. The team at Notify love it and I think you will too.

## Features

- :zap: State, a modular class for handling state ([State]()) `Pulse.State()`
- :robot: Computed state with automatic dependency tracking ([Computed]())
- :telephone_receiver: Promise based HTTP request API
- :timer_clock: Turn back the clock with [smart undo]() `State.undo()`
- :sparkles: [Collections]() a DB/ORM-like class for groups of data `Collection.collect()`
- :floppy_disk: Persisted data API for localStorage and async storage
- :first_quarter_moon: Lifesycle hooks [`watch()`]() / `onReady()` / `nextPulse()`
- :crystal_ball: Dynamic relations between collections using [Populate]() `populate()`
- :construction: Task queuing for race condition prevention
- :bus: Event bus `pulse.on() / pulse.emit()`
- :hourglass_flowing_sand: Timed interval task handler using [Jobs]()
- :closed_book: Error logging & snapshot bug reporting (WIP)
- :leaves: Lightweight (only 100KB) with 0 dependencies
- :fire: Supports Vue, React and React Native `usePulse()`
- :yellow_heart: Well documented (I'm getting there...)
