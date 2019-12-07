## Structure

This document should help explain the architecture of Pulse and allow developers to gain a better understanding of how it functions.

## _global Object

## Proxies

Pulse uses Javascript proxies to handle the majority of reactivity.
The `initProxy()` method on the Collection class is where that logic is located.
This proxy is applied to the `_public` property of each collection. This property is exposed to the components and the `context` object for filters and actions to use. The proxy is also added to properties `_public.data`, `_public.groups` and `_public.filters`.

On the proxy's `set` trap, we report access to certain values when required, it is used to determine which components access certain properties from Pulse ( `_global.componentDependencyGraph` ), and which internal properties are dependent on one another ( `_global.dependencyGraph` ).

For example, when a filter is run we set `_global.record` to true, and then immediately back to false once execution is complete. The proxy's set trap will only record properties accessed if `record` is true. Now `_global.dependenciesFound` will contain the properties that filter is dependent on. We use a similar method for discovering component dependencies.

## Reactive Flow

### `deliverUpdate()`

- **Purpose**: Sets data to the `_public` object, persists to local storage and updates the subscribed components
- **Called By**: `executeFilter()`, `buildDataFromIndex()`
- **Calls**: `updateSubscribers()`

That takes care of groups and filters, but what about when data properties are changed? This is caught by the Proxy.

The Proxy's set trap calls `updateSubscribers()` directly.