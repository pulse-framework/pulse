---
title: Models
---

### Models

Collections allow you to define models for the data that you collect. This is great for ensuring valid data is always passed to your components. It also allows you to define data relations between collections, as shown in the next section.

Here's an example of a model:

```js
collection: {
  model: {
    id: {
      // id is the default primary key, but you can set another
      // property to a primary key if your data is different.
      primaryKey: true;
      type: Number; // coming soon
      required: true; // coming soon
    }
  }
}
```

Data that does not fit the model requirements you define will not be collected, it will instead be saved in the Errors object as a "Data Rejection", so you can easily debug.
