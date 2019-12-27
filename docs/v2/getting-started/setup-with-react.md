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

Pulse.use(React);

export default new Pulse({
  data: {
    something: true
  }
});
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

::: warning NOTE: Import components after!
Ensure to import any React components **after** calling `Pulse.use(React)` and `new Pulse()` otherwise Pulse will error because the `Pulse.React` function only exists after intergration with React.
:::

### Parameters

| Name                                        | Type              | Description                                                                 | Required  |
| ------------------------------------------- | ----------------- | --------------------------------------------------------------------------- | --------- |
| React Component                             | Function or Class | Your React component as a function or class                                 | [true]()  |
| [Dependency Function](#dependency-function) | Function          | A function that subscribes to Pulse data and optionally maps to React props | [false]() |

If the `mapData` data param is not supplied, any Pulse properties accessed within the component function will be tracked for changes, upon change Pulse will re-render the component.

### Dependency Function

It's always best to be verbose about what your component subscribes to; in some cases you might want to use data non-reactively so it's recomended to use the dependency function.

This function behaves differently depending on what you return from it:

- if you return an **Array**, the properties will be silently subscribed to.
- if you return an **Object** the properties will be mapped to React props.

_In the following examples, the actual component function and `Pulse.React()` have been seperated for the sake of readability, but it's a personal prefernce._

### Method #1 `Array`

```js
import Pulse from 'pulse-framework';
import React from 'react';
import core from './core';

function Component() {
  return <h1>{core.something + core.somethingElse}</h1>;
}

export default Pulse.React(Component, () => [core.something]);
```

In the above example mutations to `core.something` will cause a re-render, but `core.somethingElse` will not since it was not included in the dependency function.

Notice how we use `core.something` not just `something`; it's important to use the actual collection object when subscribing, this is because Pulse has custom getters and setters on the object itself, in order for reactivity to work.

### Method #2 `Object`

```js
import Pulse from 'pulse-framework';
import React from 'react';

function Component (props) {
  return <h1>{ props.thisIsAProp }</h1>
}

export default Pulse.React(Component, (core) => {
  return {
    thisIsAProp: core.something;
  }
})
```

Each property of the returned object will be accessable as a prop of that component.

In this case since we're mapping the data to props, we don't need to import the Pulse instance so (`import core from './core'`) was removed. The [Context Object](/v2/docs/context-object.html) is the first and only parameter of the Dependency Function, which gives you full access to Pulse.
