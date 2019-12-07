---
title: Setup With React
---

### Install

```
npm i pulse-framework --save
```

Firstly we'll create a Pulse instance and export it from a file named `core.js`, but you can call it whatever you want.

::: info
I typically use "core" to refer to my Pulse instance since it represents the core of my application.
:::

_core.js_

```js
import Pulse from 'pulse-framework';
import React from 'react';

export default new Pulse({
  config: { framework: React },
  data: {
    something: true
  }
});
```

We've created a reactive data property on the root of Pulse called "something" with the value true. It can be found at `pulse.something`

_App.js_

```js
import Pulse from 'pulse-framework';
import React from 'react';
import core from './core';

export default Pulse.React(() => {
  return <h1>{core.something}</h1>;
});
```

This is the simplest form of intergration with React, calling `Pulse.React()` will create a React component that is monitored by Pulse's reactivity system. It will recieve props the same a regular React component.

Any Pulse data that is accessed within the component function will be tracked for changes, upon change Pulse will re-render the component.

If you prefer to be verbose about the data your component is subscribing to from Pulse, you can use `Pulse.depend()`, make sure to call it at the top of your component as follows:

```js
import Pulse from 'pulse-framework';
import React from 'react';
import core from './core';

export default Pulse.React(() => {
  Pulse.depend([core.something]);

  return <h1>{core.something + core.somethingElse}</h1>;
});
```

In the above example changes to `core.something` will cause a re-render, but `core.somethingElse` will not since it was not included in the `Pulse.depend()` function.
