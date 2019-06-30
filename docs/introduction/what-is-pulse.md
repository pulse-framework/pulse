---
title: What is Pulse?
---

::: warning NOTE
Pulse is still in development, some features are not working yet. In this document they're marked as "coming soon".
:::

Pulse is an application logic library for reactive Javascript frameworks with support for VueJS, React and React Native. It is lightweight, modular and powerful, but most importantly easy to understand.

Pulse replaces global state management solutions such as Redux, VueX and MobX, including HTTP libraries such as Axios, Fetch or Request.js. It makes your application more modular, ensuring you follow the best practices while writing significantly less code.

## Why Pulse?

After exploring the many options for Javascript state libraries, including the popular VueX and Redux, I felt like I needed a simpler solution. I wanted to get more out of a library than just state management― something that could provide solid structure for the **entire** application. It needed to be structured and simple, but also scalable. This library provides everything needed to get a reactive javascript front-end application working fast, taking care to follow best practices and to employ simple terminology that makes sense even to beginners.

I built this framework reflective of the architecture in which we use at Notify.me, and as a replacement for VueX at Notify also, making sure it is also compatible with React and vanilla environments. The team at Notify love it and I think you will too.

## Features

- :gear: Modular structure using "collections"
- :zap: Cached data & filters with dependency based regeneration
- :sparkles: Automatic data normalization
- :lock: Model based data validation
- :timer_clock: History tracking with smart undo functions
- :crystal_ball: Create data relations between collections
- :nerd_face: Database style functions
- :gem: SSOT architecture (single source of truth)
- :closed_book: Error logging & snapshot bug reporting
- :wrench: Wrappers for helpers, utilities and service workers
- :construction: Task queuing for race condition prevention
- :telephone_receiver: Promise based HTTP requests and websocket connections (web sockets coming soon)
- :hourglass_flowing_sand: Timed interval task handler (coming soon)
- :bus: Event bus (coming soon)
- :floppy_disk: Persisted data API for localStorage, sessionStorage & more
- :key: Optional pre-built authentication layer
- :leaves: Lightweight (only 22KB) with 0 dependencies
- :fire: Supports Vue, React and React Native
- :yellow_heart: Well documented (I'm getting there...)

## Is Pulse for you?

The most attractive part of Pulse for me personally is how easy it is to work with, which makes it good for a variety of different projects. Though it does scale well for applications that have many different types of data.
