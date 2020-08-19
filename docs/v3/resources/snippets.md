---
title: Snippets
---

### Snippets for VSCode

**Install:** bottom-right cog > user snippets > your_language.json

### API Route `Typescript`

```json
{
  "Pulse Route": {
    "prefix": "proute",
    "body": [
      "export const ${1:name} = async (payload: any): Promise<any> =>",
      "  (await API.post('${1:name}', payload)).data;"
    ],
    "description": "Pulse Route"
  }
}
```

This is a typesafe snippet for making an API call using the Pulse [API]() class.

Assuming you import your API instance as `API`.

```js
export const name = async (payload: Payload): Promise<ResponseData> =>
  (await API.post('name', payload)).data;
```

`Payload` and `ResponseData` should be interfaces defining what data you expect to send/recieve.
