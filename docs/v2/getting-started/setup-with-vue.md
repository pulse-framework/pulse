---
title: Setup With Vue
---

### Install

```
npm i pulse-framework --save
```

First we'll create a Pulse instance and export it from a file named `core.js`, but you can call it whatever you want.

_core.js_

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

_Note: If you want to use `Pulse.use(Vue)` instead of `framework: Vue` in the config make sure to call it before `new Pulse()`_

### Usage in a Vue component using `mapData()`

After install `mapData()` can now be found on the Vue instance.

```js
export default {
  name: 'My Vue Component',
  data() {
    return {
      ...this.mapData({
        thing: 'module/something'
      })
    };
  }
};
```

Within your template you can use Pulse data the same way you'd use normal Vue data.

```js
this.thing;
```

But remember, this is **immutable**, so in order to mutate data you must access the pulse modules using the `this.$` prefix.

### Mutating data:

From anywhere within your Vue component you can do as follows:

```js
this.$myModule.something = true;
```

You can even do this in the template without `this.`

Here's all the properties availible using the `$` prefix:

```js
this.$base; // the root Pulse module
this.$myModule; // a Pulse module
this.$myCollection; // a Pulse collection
this.$services.myService; // a Pulse service
this.$utils.myUtil; // a Pulse util
```

::: tip Summary
The main thing to learn is that mapData() is reactive, `$` is not- though we need to use the `$` to make mutations and call actions.
:::
