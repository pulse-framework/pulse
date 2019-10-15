---
title: Degugging
---

### Degugging

::: tip Coming soon...
We're planning to work on a dev tools for Pulse soon, if you want to contribute please join the [Discord](https://discord.gg/Huhe48c)
:::

For now to debug Pulse you'll need to use the console. Pulse is accessible directly in the console by typing `_pulse`, this is because a refrence to Pulse is bound to the `window` object.

## Logging

When you log out the instance of Pulse you'll notice there are properties prefixed with an underscore, these are internal properties and should only be modified by Pulse itself. When debugging, unless you know what you're doing, stick to the collections without the `_`.

## What is a Proxy?

You'll see certain objects inside Pulse are marked "Proxy", and it might look weird in the console. Proxies are awesome for reactivity, but they look ugly in the console which is a shame (another reason for Pulse dev tools!).

If you want to see the _actual_ properties of the object, they exist in the `[[handler]]` section, so tab that down and you'll see what you're looking for.

They work **exactly** the same as normal objects- you can directly modify their properties,stringify them, use Object.keys() etc... and the proxy will not get in the way.
