---
title: Changelog
---

## :star2: 3.0 - Third time's a charm

### **Welcome to Pulse v3** :grin:

This entry is more detailed than usual as to give you quick examples of the new design.

This is a new syntax, so if you're migrating from older versions your code will break. However most of the core concepts remain the same; Collections, Groups, Computed, etc. You you should be able to migrate easily, but if you still need need help we can answer your questions via [Discord](https://discord.gg/2ranK7j).

```js
const App = new Pulse();

const CEREAL = App.State('with milk');
```

### :gem: New Features

- Fully **typesafe**, written in Typescript. (Intelisense for TS users!!!)
- **Modular syntax** for better control and efficiency.
- **70%** reduction on code bundle size.
- **usePulse** React Hook.
- Better **API** module with typed request and response body.
- SSR compatible.

### :sparkles: Syntax Changes

- **Namespace** no longer controlled by Pulse, everything is completely modular:

```js
const App = new Pulse();

export const core = {
    myState:  App.State();
    myComputed: App.Computed();
    myCollection:  App.Collection();
    myAPI: App.API();
}
```

- **State** is now a class with methods to **set**, **read**, **undo**, etc... Previously in Pulse this was referred to as _data_ and was part of a _collection_ or _module_, but now it is free.

```js
const STATE = App.state(true).type(Boolean);

STATE.set();
STATE.value; // static value
STATE.undo();
STATE.persist();
STATE.bind; // reactive value
```

Methods are chainable too!

```js
STATE
  .type() // define type of state
  .set() // mutate state
  .persist() // save to local storage
  .undo() // revert state
  .interval() // callback setter on interval
  .watch() // callback on change
  .toggle(); // toggle if boolean
```

- The **Context Object** is no longer required, use module imports/exports instead :tada:

```js
export const BASE_URL = App.State('https://pulsejs.org');
```

- **Actions & Routes** have been removed and replaced with normal functions. :open_mouth:

```js
// action
export function getCool(): void {
  mybag.COOL_JUICE.set('drink');
}

// route
export async function moreJuice(): Juice {
  return (await API.get('fountain/juice')).data.juice;
}
```

### In conclusion

**The mechanics are simpler, yet the function is stronger.**

- Employing Typescript from the start has lead to stabler, testable code.
- Architectual changes have allowed for a huge code reduction.
- The State class is the foundation for everthing and the only class the Pulse Runtime will handle.
- Groups, Computed and Collection Data all extend the State class.
- Code written with Pulse now looks clean at scale, and works better at scale.
- **Finally, SSR!**
