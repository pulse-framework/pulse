---
title: Setup With React
---

# Install

```
npm i pulse-framework --save
```

Firstly create your Pulse library, here we're going to make a file named `pulse.js`, but you can call it whatever you want. In this file we'll configure & initialize the Pulse library and export it so your components can use it.

```js
import Pulse from 'pulse-framework';
import React from 'react';

export default new Pulse.Library({
  config: {
    framework: React
  }
});
```

For now we'll just leave that as the bare minimum, it is required that you tell Pulse what framework you're using, you can either pass in the React constructor itself, or just "react" as a string.

There are two ways to integrate Pulse into your components, the first is the easiest and cleanest using `pulse.wrapped`. It's a HOC (Higher Order Component) that handles integrating (subscribing / unsubscribing) your component to Pulse data.

::: warning NOTE
It's required that you pass in the React constructor to the config above if you plan on using `pulse.wrapped`
:::

## Method #1

### pulse.wrapped()

```js
import React from 'react';
import pulse from './pulse';

function myComponent(props) {
  const { something } = props.pulse;

  return <div />;
}

export default pulse.wrapped(myComponent, {
  something: 'collection/something'
});
```

This wrapper is only for React functional components at this time, we're working on building a wrapper for class components. If you already use class components you'll have to stick to the second method for now; manual integration.

`pulse.wrapped` takes two parameters, the first is your component as a function, the second is the data you want to subscribe to from within Pulse. [See mapData()](/guide/usage.html#using-data)

## Method #2

### Manual Integration

This method of integration requires you to subscribe and unsubscribe your component to Pulse manually. We've built methods directly into Pulse to make this easy.

```js
import React from 'react';
import pulse from './pulse';

export default class PulseComponent extends React.Component {
  constructor(props) {
    super(props);

    const mapData = {
      something: 'collection/something'
    };
    this.state = {
      ...core.mapData(mapData, this, {
        waitForMount: true
      }),
      anythingHere: 'This is your local state'
    };
  }

  componentDidMount() {
    pulse.mount(this);
  }
  componentWillUnmount() {
    pulse.unmount(this);
  }

  render() {
    const { something, anythingHere } = this.state;

    return <div />;
  }
}
```

This might seem complicated, and it is slightly. This is why its recommended to use higher order components, you don't want this logic on every page cluttering your components.

Lets go through what each part of this above code does.

This is the [mapData()](/guide/usage.html#using-data) function, it's available on the initialized Pulse library.

```js
// The object containing the data you want to subscribe to
const mapData = {};
// define the React state
this.state = {
  // deconstruct the result of the mapData function into react state
  ...core.mapData(mapData, this, {
    waitForMount: true
  })
};
```

### mapData

mapData takes in three params:

- 1. [Object] The data you wish to map.
- 2. [Instance] Typically "this", the component instance mapData is subscribing to.
- 3. [Object] Additional configuration, EG: `waitForMount: true`

We need mapData() to be in the constructor of the component to ensure that the component has access to the default Pulse data on the first render, however the constructor is too early for Pulse to be attempting to perform updates on a component, so we must use `waitForMount: true`.

### waitForMount

Wait for mount tells Pulse to wait until pulse.mount() is called before trying to update the component. We need this so that Pulse does not try to update an unmounted component, React will throw an error if this happens.

### Mounting & Unmounting

`pulse.mount()` and `pulse.unmount()` are two functions responsible for instructing Pulse when to mount and unmount a given component. They take only one param,`this`; the instance of the component they're called within.

### Mutating data

The result of `mapData` is _immutable_, that means you cannot change it locally within your component, you must call Pulse directly to make mutations. Since we've already imported the initialized instance of Pulse, we can use that to call actions and make mutations.

A basic mutation to a property called "something" in a given collection would look like this:

```js
pulse.collection.something = 'something else';
```

Calling an would look like this:

```js
pulse.collection.doSomething();
```

**Remember: `collection` stands for the name of your collection, this could be anything.**

Since we've used `mapData` to subscribe to changes to `something`, when it changes within Pulse, our component will re-render.
