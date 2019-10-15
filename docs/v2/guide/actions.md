---
title: Actions
---

### Actions

Actions are simply functions within your pulse collections that can be called externally.

Actions receive a context object (see [Context Object](#context-object)) as the first parameter, this includes every registered collection by name, the routes object and all default collection functions.

```js
actionName({ collectionOne, collectionTwo }, customParam, ...etc) {
  // do something
  collectionOne.collect
  collectionTwo.anotherAction()
  collectionTwo.someOtherData = true
};
```
