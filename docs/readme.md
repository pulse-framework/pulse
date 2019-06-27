---
home: true
actionText: Getting Started →
actionLink: /getting-started/setup
footer: MIT Licensed | Copyright © 2018 - Jamiepine
---

<p align="center">
  <a href="https://patreon.com/jamiepine"><img src="https://img.shields.io/badge/donate-patreon-F96854.svg" alt="Donate on patreon"></a>
  <a href="https://twitter.com/jamiepine"><img src="https://img.shields.io/twitter/follow/jamiepine.svg?label=Follow" alt="Follow on twitter"></a>
  <a href="https://discord.gg/mynamejeff"><img src="https://discordapp.com/api/guilds/234289824406831104/embed.png" alt="Join Discord"></a>
  <a href="https://npmjs.com/pulse-framework"><img src="https://img.shields.io/npm/v/pulse-framework.svg" alt="NPM Package Version"></a>
  <a href="https://npmjs.com/pulse-framework"><img src="https://img.shields.io/npm/dm/pulse-framework.svg" alt="NPM Monthly Downloads"></a>
  <a href="https://npmjs.com/pulse-framework"><img src="https://img.shields.io/npm/dw/pulse-framework.svg" alt="NPM Weekly Downloads"></a>
  <a href="https://npmjs.com/pulse-framework"><img src="https://img.shields.io/npm/dt/pulse-framework.svg" alt="NPM Total Downloads"></a>
  <a href="https://npmjs.com/pulse-framework"><img src="https://img.shields.io/bundlephobia/min/pulse-framework.svg" alt="NPM Bundle MIN Size"></a>
  <a href="https://github.com/jamiepine/pulse"><img src="https://img.shields.io/github/license/jamiepine/pulse.svg" alt="GitHub License"></a>
  <a href="https://github.com/jamiepine/pulse"><img src="https://img.shields.io/github/languages/code-size/jamiepine/pulse.svg" alt="GitHub Code Size"></a>
  <a href="https://github.com/jamiepine/pulse"><img src="https://img.shields.io/github/repo-size/jamiepine/pulse.svg" alt="GitHub Repo Size"></a>
</p>

::: warning NOTE
Pulse is still in development, some features are not working yet. In this document they're marked as "coming soon".
:::

## Install

```
npm i pulse-framework --save
```

# Pulse

Pulse is an application logic library for reactive Javascript frameworks with support for VueJS, React and React Native. Lightweight, modular and powerful, but most importantly easy to understand.

## Features

- ⚙️ Modular structure using "collections"
- ⚡ Cached data & filters with dependency based regeneration
- ✨ Automatic data normalization
- 🔒 Model based data validation
- 🕰️ History tracking with smart undo functions
- 🔮 Create data relations between collections
- 🤓 Database style functions
- 💎 SSOT architecture (single source of truth)
- 📕 Error logging & snapshot bug reporting
- 🔧 Wrappers for helpers, utilities and service workers
- 🚧 Task queuing for race condition prevention
- 📞 Promise based HTTP requests and websocket connections
- ⏳ Timed interval task handler
- 🚌 Event bus
- 💾 Persisted data API for localStorage, sessionStorage & more
- 🔑 Optional pre-built authentication layer
- 🍃 Lightweight (only 22KB) with 0 dependencies
- 🔥 Supports Vue, React and React Native
- ❤ Well documented (I'm getting there...)

**Note:** Pulse is still in development, some features are not working yet. In this document they're marked as "coming soon".

**React & React Native support coming soon!**

If you wish contribute, that is very much welcome! But please reach out first so we don't work on the same thing at the same time, twitter dm @jamiepine or Discord jam#0001

## Why Pulse?

After exploring the many options for Javascript state libraries, including the popular VueX and Redux, I felt like I needed a simpler solution. I wanted to get more out of a library than just state management― something that could provide solid structure for the **entire** application. It needed to be stuctured and simple, but also scalable. This library provides everything needed to get a reactive javascript front-end application working fast, taking care to follow best practices and to employ simple terminology that makes sense even to beginners.

I built this framework reflective of the architecture in which we use at Notify.me, and as a replacement for VueX at Notify also, making sure it is also compatible with React and vanilla environments. The team at Notify love it and I think you will too.