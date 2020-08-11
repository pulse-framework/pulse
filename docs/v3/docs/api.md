---
title: API
---
## Introduction

# API

This is Pulse's integrated fetch api! No more need to import axios on every component, or deal with the clutter of the js fletch function. By combining actions and this API function, you can fetch and set data to a remote url using `post` and `get`.

## Setup

To create an api instance, you must pass a config object. This will define several things such as the options, baseurl, path, timeout and some functions to run before and after each http request.

```ts
const MyAPI = App.API({
    options: {
        headers: {
            'content-type': 'application/json, text/plain', // this is not necessary
        }
        // ...
    },
    baseURL: 'https://api.mysite.co', // default: 'https://localhost'
    path: '/api', // default: '/'
    timeout: 20000, // default: infinite 
    requestIntercept: (request) => {
        // do something
    },
    responseIntercept: (response) => {
        // do something
    }
});
```
### API Config Parameters
- `options` [RequestOptions]()  _optional_ - This has all the same options as the js fetch function. Nothing is required, but it is recommended depending on your setup
- `baseURL` [string]() _optional_ - The base url for the endpoint which defaults to your local system.
- `path` [string]() _optional_ - The path for the endpoint which defaults to root
- `timeout` [number]() _optional_ - A timeout for the fetch. By default it does not have a timeout so if you are unsure if the request will complete, you  should set this.
- `requestIntercept` [Function]() _optional_ - An intercept function on request sent
- `responseIntercept` [Function]() _optional_ - An intercept function on response received

### Response

Every API method returns a pulse response which allows for easy interpretation and manipulation of the incoming data.

```ts
interface PulseResponse<DataType = any>  {
	data: Object;
	timedout?: boolean;
	status: number;
	raw?: Response,
	type?: string;
}
```


**Available functions and Properties** 

## `API.with()` 

This function allows you to override the API config and request options. It returns a modified instance of the original API with the options in the config parameter overriding the original config options.

### Parameters
- `config` [APIConfig](#api-config-parameters)
### Returns
- `response` [Response](#response)

## `API.get()` 

Send a HTTP get request to a url

### Parameters
- `path` [string]() - The URL path to use
- `options` [RequestOptions]() _optional_ - 
### Returns
- `response` [Response](#response)

## `API.post()` 

Send a HTTP post request to a URL

### Parameters
- `path` [string]() - The URL path to use
- `data` [Object]() - The data to send as the body of the post request
- `options` [RequestOptions]() _optional_ -  
### Returns
- `response` [Response](#response)

## `API.put()` 

Send a HTTP put request to a URL

### Parameters
- `path` [string]() - The URL path to use
- `data` [Object]() - The data to send as the body of the put request
- `options` [RequestOptions]() _optional_ - 
### Returns
- `response` [Response](#response)

## `API.patch()` 

Send a HTTP patch request to a URL

### Parameters
- `path` [string]() - The URL path to use
- `data` [Object]() - The data to send as the body of the patch request
- `options` [RequestOptions]() _optional_ - 
### Returns
- `response` [Response](#response)

## `API.delete()` 

Send a HTTP delete request to a URL

### Parameters
- `path` [string]() - The URL path to use
- `data` [Object]() - The data to send as the body of the delete request
- `options` [RequestOptions]() _optional_ - 
### Returns
- `response` [Response](#response)
