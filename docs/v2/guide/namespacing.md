---
title: Namespacing
---

### Namespacing

Pulse has the following namespaces for each collection

- Groups (cached data based on arrays of primary keys)
- Data (custom data, good for stuff related to a collection, but not part the main body of data like booleans and strings)
- Filters (like VueX getters, these are cached data based on filter functions you define)
- Actions (functions to do stuff)

By default, you can access everything under the collection namespace, like this:

```js
collection.groupName;
collection.someDataName;
collection.filterName;
collection.doSomething();
```

But if you prefer to separate everything by type, you can access areas of your collection like so:

```js
collection.groups.groupName;
collection.data.someDataName;
collection.filters.filterName;
collection.actions.doSomething();
```

For groups, if you'd like to access the raw array of primary keys, instead of the constructed data you can under `indexes`.

```js
collection.indexes.groupName; // EG: [ 123, 1435, 34634 ]
```
