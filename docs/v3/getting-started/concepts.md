---
title: Pulse Concepts
---

## Structure

Pulse was designed to take all business logic out of components, meaning your React/Vue/Angular components are essencially puppets for Pulse to orchestrate. The benifit of keeping logic seperate to visual components is versitility, upgradablity and cleanliness. An example would be with Notify's codebase, the majority of the business logic is in a repository called `notify-core` and our components are purely React code with hooks into the core. This allows us the freedom to build different components for different platforms that all behave the same way.

## Reactivity

Reactive data is state that will react to mutations in order to cause component re-renders. Components can subscribe to Pulse state and will be updated when the state changes.

## Thesaurus

:::tip How we refer to our own classes  
In these docs we will refer to our classes with a capital first letter. When you see "state" we're referring to the programming concept `state`, but when you see `State` we're referring to our [State]() class.
:::

- **Pulse Instance**: The result of initializing Pulse, a refrence to your Pulse application.
- **The Core**: You library of State, Collections and Controllers in a single object.
- **Reactivity**: The concept of state mutations causing component re-renders automatically.
- **Declaration**: Refers to logic as it is declared in the code, the opposite of this would be runtime.
- **Runtime**: When Pulse is fully initialized and the core is ready, runtime begins. Runtime handles queuing state changes. 

