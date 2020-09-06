---
title: Setup With Vue
---

# Vue Setup

::: danger NOT USABLE YET
Vue was a large part of previous versions, so we're eager to add Vue support for the many people in the Pulse community that use Vue. We're still testing the best way to implement this below is the current plan, though this syntax is subject to change.
:::

## Installation

```
npm i pulse-framework
```

## Initialization

```ts
import Pulse from 'pulse-framework';
import Vue from 'vue';

export const App = new Pulse().with(Vue);
```

## Example
```ts
import Pulse from 'pulse-framework';
import Vue from 'vue';

const App = new Pulse().with(Vue);

const core = {
    MY_STATE: App.State(true)
};

Vue.use(App.Core(core));

export default new Vue({
  el: '#vue',
  data: {
    ...this.usePulse({
        myState: this.core.MY_STATE
    })
  }
});
```