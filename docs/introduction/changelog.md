# 2.0 - Internal rewrite

Pulse version two is a complete ground-up rewrite. For the most part it should not affect your code, it is indeed backwards compatible. However there are a few things that have changed externally that you should know about before updating to V2.

## Namespacing updates

Reactive properties on collections are no longer accessible under their type names, so a data property on a collection called `thing` is now only accessible via `collection.thing`. Before a reactive copy (or alias) of a data property could be found under `collection.data.thing`. With the new reactivity system

## Main Improvements

- Written in Typescript
- Added global events
- Improved internal structure
  - Internal architecture now follows a clear structure with an efficient job queuing system. Code broken up into classes to group logic and de-spaghettify code.
- Added component update squashing
  - Prevents repeat component updates by waiting until all jobs are complete before updating subscribed components (Vue, React), squashing updates together per component.
- Removed all Javascript proxies
  - **Why:** Proxies are new to javascript, they allow developers to do more with reactive objects but are not supported by many environments, including React Native's new JS engine "Hermes". Pulse now uses getters & setters which is the same system as Vue.
