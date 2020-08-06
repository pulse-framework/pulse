---
title: Pulse Concepts
---

## Structure

Pulse was designed to take all business logic out of components, meaning your React/Vue/Angular components are essencially puppets for Pulse to orchestrate. The benifit of keeping logic seperate to visual components is versitility, upgradablity and cleanliness. An example would be with Notify's codebase, the magority of the business logic is in a repository called `notify-core` and our components are purely React code with hooks into the core. This allows us the freedom to build different components for different platforms that all behave the same.

## Reactivity

Reactive data is state that will react to mutations in order to cause component re-renders. Components can subscribe to Pulse state and will be updated when the state changes.
