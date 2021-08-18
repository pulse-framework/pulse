---
title: Ideas
---

# Ideas

This is a dump for things we could implement in the future

## Data Model

```js
App.Model((model, data) => {
  return {
    id: model.index(),
    thumbnail_hash: model.string().max(100).min(100).hidden().optional()
    thumbnail: model.compute(() => AppState.URL.value + data.thumbnail_hash).if(data.thumbnail_hash)
    connections: model.relate(Connections)
    settings: model.level('owner'),
  }
})
```



# Collection Relations
```ts
Users.relate(Posts, 'posts')
```
- posts property will be deleted and auto collected into posts
- group will be created automatically on Posts as the user id
- users output will contain posts