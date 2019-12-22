---
title: Setup With Vue
---

### Install

```
npm i pulse-framework --save
```

Firstly create your [Pulse library](/guide/library.html), here we're going to make a file named `pulse.js`, but you can call it whatever you want. In this file we'll configure & initialize the Pulse library and export it so your components can use it.

```js
import Vue from 'vue';
import Pulse from 'pulse-framework';

const pulse = new Pulse({
  framework: Vue,
  collections: {
    myCollection: {
      data: {
        thing: false
      }
    }
  }
});

export default pulse;
```

In earlier versions of Pulse you had to call `Vue.use(Pulse)` but now that is not needed, as long as you call `Pulse.use(Vue)` or pass a `framework` config option Pulse will install itself into Vue automatically.

If you want to use `Pulse.use(Vue)` instead of `framework: Vue` in the config make sure to call it before `new Pulse()`

### Usage in a Vue component

Now you can use [mapData](./guide/using-data.html) to bring data into your Vue component. mapData is accessible under `this`, since we've installed it into Vue.

```js
export default {
  name: 'My Vue Component',
  data() {
    return {
      ...this.mapData({
        thing: 'collection/something'
      })
    };
  }
};
```

Since mapped data is immutable within the component, to mutate data you'll need to call the collection directly. In Vue, this is as easy as calling the collection using `$`.

```js
this.$myCollection.thing = true;
```

Remember, we've mapped `thing` to `something` locally in our Vue component, so for it to be reactive we must use `this.something` inside the template or computed methods.

::: tip Summary
The main thing to learn is that mapData() is reactive, `$` is not- though we need to use the `$` to make mutations and call actions.
:::
