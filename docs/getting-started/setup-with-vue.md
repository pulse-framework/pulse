---
title: Setup With Vue
---

### Install

```
npm i pulse-framework --save
```

Firstly create your [Pulse library](/guide/library.html), here we're going to make a file named `pulse.js`, but you can call it whatever you want. In this file we'll configure & initialize the Pulse library and export it so your components can use it.

```js
import Pulse from 'pulse-framework';

const pulse = new Pulse.Library({
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

Somewhere in your Vue project you're going to need to import this file and call `Vue.use(pulse)`, this will install Pulse into Vue.

```js
import Vue from 'vue';
import pulse from '../';

Vue.use(pulse);
```

Now you can use [mapData](./guide/using-data.html) to bring data into your Vue component. mapData is accessible under `this`, since we've installed it into Vue.

```js
export default {
  name: 'My Vue Component',
  data() {
    return {
      ...this.mapData({
        something: 'myCollection/thing'
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
