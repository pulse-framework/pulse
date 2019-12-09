---
title: Using with React
---

## Current Pulse implementation with React

```js
import React from 'react';
import core from 'logic/core';

function myComponent({ pulse }) {
    const { jeff } = pulse;

  return <div />;
}

export default core.wrapped(myComponent, (core) => {
    return {
        jeff: core.jeff;
    }
})
```

## New Pulse potential implementation with React

```js
import React from 'react';
import core from 'logic/core';

export default function myComponent() {
  // first line is always core.subscribe

  // useEffect is a react hook for function components. It fires when mounted and the return value fires when unmounted if it is a function and the second param is an empty array
  useEffect(() => {
    core.subscribe(this, () => [core.jeff]);
    return () => core.unsubscribe(this);
  }, []);

  // if core.unscubscribe returned the unsubscribe function we could do this:
  useEffect(() => core.subscribe(this, () => [core.jeff]), []);

  // ^^ EPIC

  // the rest is up to you
  const jeff = core.jeff;
  return <div />;
}
```

Problems:

- Assinging the data from Pulse to a local const will not give the subscribe() function any way to identify it. You would have to use `core.jeff`.
- Another issue: `[core.jeff]` will create an array with the value, leaving us with the same problem as above.
- useEffect wouldn't work since React is not tracking a prop named "pulse"
