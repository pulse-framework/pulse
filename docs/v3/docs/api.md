---
title: API
---

# `App.API()`

This is Pulse's integrated fetch api! No more need to import axios on every component! By combining actions and this API function, you can fetch and set data to a remote url using `post` and `get`.

## Setup


**Available functions and Properties**

## `API.post()` 

send a HTTP post request to a URL

### Parameters
- `path` [string]() - The URL path to take
- `data` [Object]() - The data to send as the body of the post request
- `options` [Object]() _optional_ - 
### Returns
- `response` [Object]()

## `API.get()` 

send a HTTP get request to a url

### Parameters
- `path` [string]() - The URL path to take
- `options` [Object]() _optional_ - 
### Returns
- `response` [Object]()