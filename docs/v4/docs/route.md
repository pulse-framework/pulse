---
title: Route
---
## Introduction
::: warning Sorry!
This page is not up to standards, improvements need to be made inline with the rest of the documentation.
:::
# Route

This is Pulse's integrated fetch API. It's a wrapper around Fetch, which is native to the browser environment.
```ts
const MyAPI = route()
```
## Setup
The API class accepts a config object.
```ts
const MyAPI = App.API({
  options: {
    headers: {
      'content-type': 'application/json, text/plain' // this is not necessary
    }
  },
  baseURL: 'https://api.mysite.co', // default: 'https://localhost'
  path: '/api', // default: '/'
  timeout: 20000, // default: infinite
  requestIntercept: request => {
    // do something
  },
  responseIntercept: response => {
    // do something
  }
});
```

### API Config Parameters

- [options (RequestOptions)](#request-options) _**optional**_ - This has all the same options as the js fetch function. Nothing is required, but it is recommended depending on your setup
- [baseURL (string)]() _**optional**_ - The base url for the endpoint which defaults to your local system.
- [path (string)]() _**optional**_ - The path for the endpoint which defaults to root
- [timeout (number)]() _**optional**_ - A timeout for the fetch. By default it does not have a timeout so if you are unsure if the request will complete, you should set this.
- [requestIntercept (Function)]() _**optional**_ - An intercept function on request sent
- [responseIntercept (Function)]() _**optional**_ - An intercept function on response received

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
For more information on the options available, please refer to the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) page, as this is what is used under the hood.
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

## Methods

# `.with()`

This function allows you to override the API config and request options. It returns a modified instance of the original API with the options in the config parameter overriding the original config options.

### Parameters

- [config (APIConfig)](#api-config-parameters)

### Returns

- [response (Response)](#response)

# `.get()`

Send a HTTP get request to a url

### Parameters

- [path (string)]() - The URL path to use
- [options (RequestOptions)]() _**optional**_ - has the same options as fetch

### Returns

- [response (Response)](#response)

# `.post()`

Send a HTTP post request to a URL

### Parameters

- [path (string)]() - The URL path to use
- [data (Object)]() - The data to send as the body of the post request
- [options (RequestOptions)]() _**optional**_ -

### Returns

- [response (Response)](#response)

# `.put()`

Send a HTTP put request to a URL

### Parameters

- [path (string)]() - The URL path to use
- [data (Object)]() - The data to send as the body of the put request
- [options (RequestOptions)]() _**optional**_ -

### Returns

- [response (Response)](#response)

# `.patch()`

Send a HTTP patch request to a URL

### Parameters

- [path (string)]() - The URL path to use
- [data (Object)]() - The data to send as the body of the patch request
- [options (RequestOptions)]() _**optional**_ -

### Returns

- [Response (response)](#response)

# `.delete()`

Send a HTTP delete request to a URL

### Parameters

- [path (string)]() - The URL path to use
- [data (Object)]() - The data to send as the body of the delete request
- [options (RequestOptions)]() _**optional**_ -

### Returns

- [response (Response)](#response)
