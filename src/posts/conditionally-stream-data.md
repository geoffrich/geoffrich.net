---
title: Conditionally stream data in SvelteKit
date: '2023-09-12'
tags:
  - sveltekit
socialImage: 'https://geoffrich.net/images/social/conditionally-stream-data.png'
metaDesc: Preventing loading flickers and serving users without JavaScript
---

If you return a _nested_ promise from a SvelteKit load function, the result will be streamed to the browser as it resolves. This can be a great way to show the user the page as quickly as possible, and stream the slow data in as it’s available.

```js
// +page.server.js
export async function load() {
  const slowData = getSlowData();

  return {
    nested: {
      slow: slowData
    }
  };
}

async function getSlowData() {
  await delay(2000);
  return '😴';
}

// helper to simulate a delay for the given number of milliseconds
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}
```

We can then show a loading state using Svelte's [await block](https://svelte.dev/docs/logic-blocks#await):

```svelte
{#await data.nested.slow}
	<p>Loading...</p>
{:then result}
	<p>{result}</p>
{/await}
```

“Nested” here has nothing to do with the object property name, but whether the property is inside the top-level object returned from load or nested inside another object. For example, in the following object `panda` is nested but `tangerine` is not. This means that SvelteKit will wait for `promise2` to resolve before rendering the page, but will not wait for `promise1` and will stream the result in after it resolves.

```js
return {
  something: {
    panda: promise1
  },
  tangerine: promise2
};
```

For more, see [the documentation](https://kit.svelte.dev/docs/load#streaming-with-promises).

However, streaming data comes with its downsides.

- It only works when JavaScript is enabled — if you stream data, the server-rendered HTML will not have the resolved value. Because of this, SvelteKit recommends you only stream _non-essential_ data so users can still get the information they need when JavaScript is not available.
- Even if you don’t care about supporting users without JavaScript, if you server-side render your app then streaming data will cause a “flicker” of loading state on the initial page load, no matter how quickly the promise resolves.

Let’s see how we can resolve those issues by _conditionally_ streaming data depending on the request.

## Conditional streaming with `await`

First, let’s see how to conditionally stream a promise with SvelteKit. We saw earlier how to stream slow data, but how do you do that conditionally?

In our case, we just have to change one line:

```js
export async function load() {
  const shouldStreamData = true;
  const slowData = getSlowData();

  return {
    nested: {
      // conditionally return here
      slow: shouldStreamData ? slowData : await slowData
    }
  };
}
```

Now, instead of always returning a promise, we return either a promise or the resolved value of that promise.

Importantly, we have to make sure to return the actual resolved value of the promise, _not_ the resolved promise itself. This won’t work:

```js
export async function load() {
  const shouldStreamData = true;
  const slowData = getSlowData();

  if (shouldStreamData) {
    // doesn't work!
    await slowData;
  }

  return {
    nested: {
      // this promise is resolved, but Svelte will first render the unresolved state
      slow: slowData
    }
  };
}
```

This is because we’re still returning a promise to the UI, so we’ll see a flash of loading state. At least for now, Svelte’s SSR renderer is _synchronous_. Promise values can only be retrieved _asynchronously_ (even if already resolved), so Svelte can’t get the resolved value immediately. For more, see [this Svelte issue](https://github.com/sveltejs/svelte/issues/958).

Instead, you should return either the promise, or the resolved value of that promise.

```js
const toReturn = shouldStreamData ? promise : await promise;
```

The great thing about this is you can still use the `{#await}` block you were using before. SvelteKit will also correctly [generate the types](https://svelte.dev/blog/zero-config-type-safety) so that `data.nested.slow` will either be a `string` or a `Promise<string>`.

So that’s how we can conditionally stream data and choose between showing a loading state quickly and rendering a complete page. When might we want to do this?

## Preventing a loading flicker with `Promise.race`

Sometimes you don’t know if an API call is going to complete quickly or not. Maybe on a warmed-up cache it would return in 50ms, but in the worst case it could take up to a second or two. Because it can be slow, you want to stream in the data instead of waiting on it to render the page. However, if it does come back quickly, you’d rather return a rendered page with all the data present and prevent the dreaded loading state flicker.

We can use `Promise.race` to give our promise a few hundred milliseconds to resolve. `Promise.race` takes an array of promises, and resolves when any one of those promises resolve. We can pass our delay call and our data fetching call, and conditionally await the result depending on which one resolves first.

```js
const TIME_TO_RESOLVE_MS = 200;
export async function load() {
  const slowData = getSlowData();

  const result = await Promise.race([delay(TIME_TO_RESOLVE_MS), slowData]);

  return {
    nested: {
      slow: result ? result : slowData
    }
  };
}

async function getSlowData() {
  // randomly delay either 50ms or 1s
  // this simulates variable API response times
  await delay(Math.random() < 0.5 ? 50 : 1000);
  return '😴';
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}
```

In this example, we race two promises: a 200ms delay and the actual data call we want to make. If the delay resolves first, then the data call is taking longer than 200ms and we should go ahead and render the page with partial data. If the data call resolves first, then we got the data under the time limit and we can render the page with complete data.

This flicker is mainly relevant on the initial, server-rendered page load. Subsequent client-side navigations will [preload the data](https://kit.svelte.dev/docs/link-options#data-sveltekit-preload-data) when the link is hovered and the user might not see a loading state if the data comes back quickly enough. However, this can be a nice technique to prevent the flicker when the app is starting up.

## Completely loading data on initial request

The [promise streaming announcement](https://kit.svelte.dev/docs/load#streaming-with-promises) blog post highlighted an important caveat:

> One caveat: this feature needs JavaScript. Because of this, we recommend that you only stream in non-essential data so that the core of the experience is available to all users.

Because JavaScript is needed to load the result of the streamed promises, users without JavaScript available ([more likely than you think](https://www.kryogenix.org/code/browser/everyonehasjs.html)) will not see the fully loaded data. Instead, they will only get whatever was present when the page first rendered. This might be okay for non-essential data, like comments on a blog post, but essential data, like the post itself, should be available for all users.

But what if you have slow data that is also essential? Ideally you can fix the data source so that it’s no longer slow, but that’s not always possible. Do you make all users wait on that data, even though JavaScript is likely available for most of them?

We can instead implement a hybrid approach. On the initial page load, we could wait for all data to resolve. That way, users without JavaScript will be able to see all the content on the page, even if it loads slightly slower. If you built your app [in a progressively-enhanced way](https://kit.svelte.dev/docs/form-actions#progressive-enhancement), they can even perform essential actions.

On subsequent page loads using [client-side navigation](https://kit.svelte.dev/docs/glossary#routing), we can allow the slow data to be streamed in. Client-side navigation will only occur if JavaScript is available, so there are no downsides to using promise streaming. If the user doesn’t have JavaScript, each navigation will trigger a full page load, and we will again wait for all data to resolve.

We can switch between these two behaviors using the `isDataRequest` property on the [RequestEvent](https://kit.svelte.dev/docs/types#public-types-requestevent) passed to the load function. When this property is false, the request is for the HTML for the initial page load, and we should wait for all data to resolve. If the property is true, then the request is from SvelteKit’s client-side router and we can stream the data in.

```js
export async function load({isDataRequest}) {
  const slowData = getSlowData();
  return {
    nested: {
      slow: isDataRequest ? slowData : await slowData
    }
  };
}
```

However, note that this will impact your [Time to First Byte](https://web.dev/ttfb/) for all users, since the browser will not receive any HTML until the data has fully loaded. You should carefully consider the tradeoffs between response time and serving users without JavaScript, which will depend on your app’s userbase:

1. If all your data is fast, don’t worry about promise streaming
2. If some of your data is slow, but it’s non-essential, use promise streaming for that data
3. If some of your data is slow and essential, and it’s important to serve users without JavaScript, either speed up the slow data at the source or use `isDataRequest` to conditionally await data
