---
title: Actions
---

## Introduction

# Actions

```js
export async function MyAction() {
  try {
    // perform action
  } catch (e) {
    App.Error(e);
  }
}
```

```js
export const MyAction = App.Action(() => {
  // do something
});
```
