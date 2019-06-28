---
title: Setup
---

## Install

```
npm i pulse-framework --save
```

## Vanilla Setup

Manually setting up pulse without a framework

``` js
import Pulse from 'pulse-framework';

new Pulse.Library({
  collections: {
    channels: {},
    posts: {}
  }
});
```

## Setup with VueJS

```js
import Pulse from 'pulse-framework';

const pulse = new Pulse.Library({
  collections: {
    channels: {},
    posts: {}
  }
});

Vue.use(pulse);

export default pulse; // so you can use it outside of Vue too!
```
