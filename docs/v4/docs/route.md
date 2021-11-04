---
title: Route
---
## Introduction

# Route

This is Pulse's integrated fetch API. It's a wrapper around Fetch, which is native to the browser environment.
## Setup
The route function returns a __Route__ which can be configured and used to make HTTP requests. The basic config is just the baseurl and any fetch config options. There is also a value for timeout, which will set a timeout for the request. This function will return another function to use to make requests in your actions or anywhere else in your app!
```ts
const MyAPI = route({
  baseURL: 'http://localhost:3000', // default: 'https://localhost'
  options: {
    headers: {
      'Content-Type': 'application/json'
    }
  },
  timeout: 20000, // default: infinite
})
```
## Use
The returned function accepts a path, and another opportunity to modify the fetch config.
```ts
const data = await MyAPI('get-data', {
  method: 'POST', // default: 'GET'
  body: {
    data: 'Hello World!'
  },
  params: {}, // url params
  query: {}, // url query
  options: {
    headers: {
      'Content-Type': 'application/json, text/plain' // this is not necessary
    }
  },
});
```

### Route Config Parameters

- [options (RequestOptions)](#request-options) _**optional**_ - This has all the same options as the js fetch function. Nothing is required, but it is recommended depending on your setup
- [baseURL (string)]() _**optional**_ - The base url for the endpoint which defaults to your local system.
- [timeout (number)]() _**optional**_ - A timeout for the fetch. By default it does not have a timeout so if you are unsure if the request will complete, you should set this.

### Request Options

- [headers (string)]() _**optional**_ - Any headers you want to add to your request
- [mode (string)]() _**optional**_ - The mode you want to use for the request, e.g., `cors`, `no-cors`, or `same-origin`.
- [credentials (string)]() _**optional**_ - The request credentials you want to use for the request: `omit`, `same-origin`, or `include`.
- [cache (string)]() _**optional**_ - The [cache mode](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache) you want to use for the request.
- [redirect (string)]() _**optional**_ - The redirect mode to use: `follow` (automatically follow redirects), `error` (abort with an error if a redirect occurs), or `manual` (handle redirects manually).
- [referrerPolicy (string)]() _**optional**_ - A string specifying the referrer of the request. This can be a same-origin URL, about:client, or an empty string.
- [integrity (string)]() _**optional**_ - Contains the [subresource integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) value of the request
- [keepalive (string)]() _**optional**_ - The keepalive option can be used to allow the request to outlive the page.
- [signal (AbortSignal)]() _**optional**_ - An [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) object instance; allows you to communicate with a fetch request and abort it if desired via an [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

::: tip Note: Refer to Fetch Documentation for More Info.
For more information on the options available, please refer to the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) page, as we use this under the hood.
:::

### Response

Every API method returns a pulse response which allows for easy interpretation and manipulation of the incoming data.

```ts
interface PulseResponse<DataType = any> {
  data: Object;
  timedout?: boolean;
  status: number;
  raw?: Response;
  type?: string;
}
```


