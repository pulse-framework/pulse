---
title: Setup With React
---

### Install

```
npm i pulse-framework
```

First we'll create a Pulse instance and export it from a file named `core.js`, but you can call it whatever you want.

::: tip
I typically use "core" to refer to my Pulse instance since it represents the "core" of my application.
:::

_core.js_

```js
import Pulse from 'pulse-framework';
import React from 'react';

export default new Pulse({
  data: {
    something: true
  }
});

Pulse.use(React);
```

We've created a reactive data property on the root of Pulse called "something" with the value true. It can be found at `pulse.something`. We also called `Pulse.use(React)` to tell Pulse we're working with React.

_Note: You can still use `framework: React` as a config option for backwards compatiblity._

### Using `Pulse.React()`

_App.js_

```js
import Pulse from 'pulse-framework';
import React, { useState } from 'react';
import core from './core';

export default Pulse.React(() => {
  return <h1>{core.something}</h1>;
});
```

This is the simplest form of intergration with React, calling `Pulse.React()` will create a React component that is tracked by Pulse's reactivity system. It will recieve props the same a regular React component.

Any Pulse data that is accessed within the component function will be tracked for changes, upon change Pulse will re-render the component.

If you prefer to be verbose about the data your component is subscribing to from Pulse, you can declare dependencies manually using the second parameter of `Pulse.React(component, dependencies)`.

```js
import Pulse from 'pulse-framework';
import React from 'react';
import core from './core';

export default Pulse.React(
  () => <h1>{core.something + core.somethingElse}</h1>,
  () => [core.something]
);
```

In the above example mutations to `core.something` will cause a re-render, but `core.somethingElse` will not since it was not included in the [dependency function]().

There are other ways to intergrate Pulse data into your component, for example as props you would make your dependencies function return an object that Pulse can map to React props.

```js
import Pulse from 'pulse-framework';
import React from 'react';
import core from './core';

Pulse.React(props => {
  return <h1>{ props.thisIsAProp }</h1>
}, () => {
  return {
    thisIsAProp: core.something;
  }
})
```

Each property of the returned object will be accessable as a prop of that component.
