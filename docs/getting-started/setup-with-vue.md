---
title: Setup With Vue
---

## Install

```
npm i pulse-framework --save
```

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
