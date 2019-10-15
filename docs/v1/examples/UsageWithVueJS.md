---
title: Using with VueJS
---
# Using with VueJS
```js
// VueJS data property
data() {
  return {
    ...this.mapData({
      settings: 'accounts/settings'
    })
  },
},
// VueJS computed methods are like Pulse filters, they're cached until one of their dependencies change. Here we're just writing a shortcut to return a boolean if `DARK_THEME` exists based on the Pulse data for `accounts/settings`.
computed: {
  darkTheme() {
    return this.settings.DARK_THEME || false
  }
  // as `settings` is defined in mapData(), it will trigger this computed function to re-render when it changes.
},
watch: {
  settings() {
    this.$accounts.updateTheme()
  }
}
```

You may notice in that watcher I used `this.$accounts`. This is possible as every Pulse collection can be accessed on the Vue instance with the prefix `$`. You can use this to set data, read data in methods, and call actions.

**Do not use \$ collection references in your template or computed properties, Vue does not see them as reactive, and will not trigger a re-render when Pulse data updates. This is why we have mapData()**

The \$ references are there to make it easy to interact with Pulse data from the component, like calling actions and setting new values.

```JS
// VueJS mounted hook
mounted() {
  this.$collection.doSomething()
  this.$accounts.someValue = true
},
methods: {
  doSomething() {
    this.$collection.someAction()
  }
}
```
