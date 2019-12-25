---
title: Changelog
---

## 2.2.0 - Introducing Pulse.React()

::: warning SO IT DOESN'T BREAK YOUR OLD CODE...
Pulse 2.2 has some breaking changes, but I made sure to allow you to delay updating your code with these handy config options.
:::

Set the following config to enable all backwards compatibility features in the global config object:

```js
config: {
    mapDataUnderPropName: 'pulse',
    baseModuleAlias: true
}
```

Pulse.React() is now the simplest way to get started with Pulse, check out the new [Setup With React](/v2/getting-started/setup-with-react.html).

### Changes

- Added [Pulse.React()](/v2/getting-started/setup-with-react.html#using-pulse-react) as a replacement to Pulse.wrapped()
- Added [Pulse.use()]() for initilizing React/Vue or now even custom framework intergration.
- staticData is now mapped to data
- Services are now found under `pulse.services.service` instead of `pulse.service` potentially breaking
- Added [mapDataUnderPropName]() config option
- Added [computedDefault]() config option
- Added [bindInstanceTo]() config option
- Added [addStaticData]() as a module function
- Added [collectByKeys]() as a collection function
- Cleaned up lots of under-the-hood code

## 2.1.0 - Introducing Modules

Pulse 2.1 is everything that should have been part of 2.0. There have been a large amount of internal changes but a few forward facing changes that could very well break your code.

### The biggest change

TLDR: The base collection (or now "Module") has changed from `pulse.base.someData` to simply `pulse.someData` HOWEVER can still be baqckwards compatible with the `baseModuleAlias` config option.

### New features

- Added [Modules](###Modules)
- Added [baseModuleAlias](###Config) config option
- Added [Index Ghosting](###Ghosting)

### Modules

Modules are just like collections, but without the collection functions. I added this because I felt like most applications need reactive modules to represent areas of their application that do not rely on a data structure (for example: UI related logic, error handlers or debug logic). Calling these sections "collections" and instantiating the collection logic is wasteful, enter Modules.

Modules have the abilty to maintain state (as data), computed functions, actions, persisted state, watchers and routes.

Collections have everything a Module does, but with additional features such as the `collect()` function for internal data, groups (with internal indexes) and functions like `move()`, `put()`, `replaceIndex()` and so on. This is better explained in the documentation for Collections.

Interally the Collection class now extends the Module class. Collection logic is built on top of the Module logic.

### Config

A few new config options have been added:

- baseModuleAlias
  - by default the root instance of Pulse is a Module called "base", before it was always accessable as "base" like any other named collection, but now Pulse hides the "base" module instance and exposes the properties of base on the root of Pulse, so `pulse.base.someData` is now `pulse.someData`. `baseModuleAlias: true` will add `pulse.base` again as it was before, although base's properties will still be exposed directly on the pulse object.

### Ghosting

This is a handy feature built into the `move()` function for Collections. By using `{ ghost: true }` as the third parameter of `move()` the data will appear to remain in the group it was moved from, but will be removed from the groups' index. The data object will have the property `isGhost: true` injected. This is extremely useful if you have a list of users, clicking "follow" might move them from that group of users into another, but for UX purposes you want it to remain in case they want to undo the action. The `isGhost: true` property can be used to change the UI accordingly. All ghosts will be removed when `collection.cleanse()` is called.

### Internal Changes

Before collections were referred to internally using the name as a string, now since there are Modules,Collections and Services the instance is passed around Pulse as `moduleInstance` as a direct refrence instead.

## 2.0 - Major Internal Rewrite

Pulse version two is a complete ground-up rewrite. For the most part it should not affect your code, it is indeed backwards compatible. However there are a few things that have changed externally that you should know about before updating to V2.

### Breaking changes

- Namespacing changes (see below)
- Model relations "hasOne, hasMany" removed in place of populate() function (need to update docs....)
- Constructor changed from `Pulse.Library()` to just `Pulse()`
- "Filters" renamed to "Computed" although using "filters" as a property name on your collections still works.
- remove() renamed to removeFromGroup()

### New Features (docs soon)

- Global events
- Added more config options
- Better debugging helpers
- Added more defaults to Base class
- onReady()

### Namespacing updates

Reactive properties on collections are no longer accessible under their type names, so a data property on a collection called `thing` is now only accessible via `collection.thing`. Before a reactive copy (or alias) of a data property could be found under `collection.data.thing`. With the new reactivity system

### Main Improvements Under The Hood

- Written in Typescript
- Improved internal structure
  - Internal architecture now follows a clear structure with an efficient job queuing system. Code broken up into classes to group logic and de-spaghettify code.
- Added component update squashing
  - Prevents repeat component updates by waiting until all jobs are complete before updating subscribed components (Vue, React), squashing updates together per component.
- Removed all Javascript proxies
  - **Why:** Proxies are new to javascript, they allow developers to do more with reactive objects but are not supported by many environments, including React Native's new JS engine "Hermes". Pulse now uses getters & setters which is the same system as Vue.
