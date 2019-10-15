---
title: Using Data
---

### Using data with mapData()

Using data in VueJS and React is simple with `mapData()`. It will return an object containing Pulse data properties that you request. The string must contain a slash, first the name of the collection, then the data property.

```js
pulse.mapData({
  localName: 'collection/property'
});
// returns: { localName: value }
```

You can set `localName` to anything that suits your component.

You can now bind each returned property to the data in your component using object spreading. In VueJS the `mapData()` function is available on the Vue instance as `this.mapData()`, in React you must import it.

::: tip More Info
To see how mapData can be integrated with your components, see: Setup with [React](/getting-started/setup-with-react.html) / [Vue](/getting-started/setup-with-vue.html)
:::

`mapData()` has access to all public facing **data, filters, groups, indexes** and even **actions**. Using mapData enures this component is tracked as a dependency inside Pulse so that it can be reactive.

mapData should be injected into the component's state, so you can access your data inside your component using the `localName` that you define in the mapData object.

**Note: `mapData()` is read-only.** To mutate data or call actions, you must use the Pulse instance itself. A good way is to export the Pulse instance and import it into your component as shown earlier.

In Vue, mapped data can be used in computed methods and even trigger Vue watchers, just like regular Vue data.

In React, data should be mapped to state, and it is compatible with React hooks.
