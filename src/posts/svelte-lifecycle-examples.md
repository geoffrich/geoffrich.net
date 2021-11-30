---
title: Svelte's lifecycle methods can be used anywhere
date: '2021-11-30'
tags:
  - svelte
socialImage: 'https://geoffrich.net/images/social/svelte-lifecycle-examples.png'
metaDesc: "Well, not exactly anywhere. But it's more than just inside components!"
---

I don't think it's widely known that you can call the Svelte lifecycle methods (onMount, onDestroy, beforeUpdate, afterUpdate) _outside_ of a component. It is mentioned in the [Svelte docs](https://svelte.dev/docs#onMount) and tutorial, though it's easy to gloss over.

> The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM. It must be called during the component's initialisation (but doesn't need to live _inside_ the component; it can be called from an external module).

`onMount` and friends are [just functions](https://github.com/sveltejs/svelte/blob/6ff1aed8d5051ef79063e8d6442d8b6d6def63a2/src/runtime/internal/lifecycle.ts#L14-L28) that schedule another function to run during a point in the current component's lifecycle. As long as you call these functions during a component's initialization, you can call them from anywhere. This means you can share lifecycle-dependent functionality between multiple components by putting it in a separate file, making it more reusable and reducing boilerplate.

Let's look at a few examples.

## Running a callback after a given interval

You can write the following Svelte code to start a timer that tracks how long the page has been open. We wrap the `setInterval` call inside `onMount` so that it only runs in the browser, and not when the component is being server-rendered.

By returning a cleanup function from `onMount`, we tell Svelte to run that function when the component is being destroyed. This prevents a memory leak.

```svelte
<script>
  import {onMount} from 'svelte';

  let count = 0;

  onMount(() => {
    const interval = setInterval(() => {
      count += 1;
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  });
</script>

<p>
  This page has been open {count} seconds.
</p>
```

But what if you want to use this code in multiple components? You may have thought that because this code uses a component lifecycle method that it has to stay with the component. However, that's not the case. We can move this code to a separate module, as long as the function calling `onMount` is called when the component is initializing.

```js
// interval.js
import {onMount} from 'svelte';

export function useInterval(fn) {
  onMount(() => {
    const interval = setInterval(fn, 1000);
    return () => clearInterval(interval);
  });
}
```

```svelte
<script>
  import {useInterval} from './interval.js';

  let count = 0;
  useInterval(() => (count += 1));
</script>

<p>
  This page has been open {count} seconds.
</p>
```

Now we have the same behavior, but now it can be reused across multiple components! You can find a similar example using `onDestroy` instead in the [Svelte tutorial](https://svelte.dev/tutorial/ondestroy).

## A store that tells you if a component has been mounted

We can also use `onMount` to make a store that tells you whether a component has finished mounting or not. This code is from the [svelte-mount](https://github.com/ghostdevv/svelte-mount) package:

```js
// mounted.js
import {onMount} from 'svelte';

export const mounted = {
  subscribe(fn) {
    fn(false);
    onMount(() => fn(true));
    return () => {};
  }
};
```

I found this a little hard to parse at first, but what we have here is a **custom store**. Per the [Svelte docs](https://svelte.dev/docs#Store_contract), a store is any object with a subscribe method that takes a subscription function. When a component subscribes to this store, the subscription function is first called with `false` . We then wrap a call to the subscription function in `onMount` so that it is set to true once the component is mounted.

Because this code is in the `subscribe` function, it will run for each component that subscribes to the store, meaning that `onMount` will refer to a different component's lifecycle each time it's called.

Here's an example of where this store would be useful. Normally, transitions don't play on initial render, so by adding the element after `onMount` has completed we allow the transition to play. By using the `mounted` store, we remove some boilerplate &mdash; we don't have to make a state variable to track if the component has mounted and update it in `onMount`. Nifty!

```svelte
<script>
  import {mounted} from './mounted';
  import {fade} from 'svelte/transition';
</script>
<h1>
  Hello world
</h1>
{#if $mounted}
<p in:fade>
  Component has been mounted.
</p>
{/if}
```

You can also set the `intro` property when [creating the component](https://svelte.dev/docs#Creating_a_component) to force transitions to play on initial render, though that won't work in a server-rendered context like SvelteKit.

## Track the number of times a component is rendered

This example is a bit contrived, but still interesting. Someone asked a question on [r/sveltejs](https://www.reddit.com/r/sveltejs/comments/q8hj8k/how_to_extract_crosscutting_concerns_in_svelte/) about how to track how many times a component has re-rendered in a way that can be shared across multiple components. They gave the following React hook as an example.

```js
function useRenderCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(count + 1);
  });

  return count;
}

// used in a component like so
function MyComponent() {
  const count = useRenderCount();

  return <p>{count}</p>;
}
```

Many folks suggested using the [afterUpdate](https://svelte.dev/docs#afterUpdate) Svelte lifecycle method inside the component, but didn't realize that it could be moved outside the component as well. We can re-create this behavior completely independent from the component by combining `afterUpdate` with a writable Svelte store.

```js
import {writable} from 'svelte/store';
import {afterUpdate} from 'svelte';

export default function trackUpdateCount() {
  const count = writable(0);

  afterUpdate(() => {
    count.update(c => c + 1);
  });

  return count;
}
```

And it can be used like so, without needing to add any lifecycle boilerplate to the component intself:

```svelte
<!-- Input.svelte -->
<script>
  export let name = 'test';

  import trackUpdateCountfrom './trackUpdateCount';
  const count = trackUpdateCount();
</script>

<p>Hello {name}! Updated {$count} times</p>
<input bind:value="{name}" />
```

Here's a [REPL](https://svelte.dev/repl/7a88abc02a444e44b80682ca8c32ef63?version=3.43.2) if you want to try it out.

I haven't quite wrapped my mind around it, but you can even use `afterUpdate` in Svelte to replicate React's useEffect hook. See this [example from Rich Harris](https://svelte.dev/repl/0c9cd8c29c5043eea89bd9c6eb4f279a?version=3.42.6), which I found in an interesting [GitHub issue](https://github.com/sveltejs/svelte/issues/6730) discussing the edges of Svelte's reactivity.

## Cleaning up subscriptions

Another common use of lifecycle methods is to clean up store subscriptions. When you use Svelte's special `$store` syntax inside a component, Svelte automatically subscribes to the store and unsubscribes when the component is destroyed. However, if you subscribe to a store in a regular JavaScript file, you need to unsubscribe manually. This is a great opportunity to use `onDestroy` &mdash; that way, a single file can handle the cleanup instead of requiring the importing components to do it.

At a high level, it could look something like this. Note that this is in an external file, _not_ a Svelte component.

```js
// store.js
import {writable} from 'svelte/store';
import {onDestroy} from 'svelte';

export function createStore() {
  const items = writable([]);

  const unsubscribeItems = items.subscribe($items => {
    // do something when items changes
  });

  // we clean up the subscription ourselves,
  // instead of making the component do it
  onDestroy(() => {
    unsubscribeItems();
  });

  return items;
}
```

We can then call this function to initialize the store in a component, and the subscription from this file will be automatically cleaned up when the component is destroyed.

For a more concrete example, take a look at this function. We return two stores, `items` and `selected`. The `selected` store is used to track which items are selected, and is generally controlled by the consuming component. However, when items changes, we want to do one of two things:

1. If all items were selected, all items should still be selected (regardless of any overlap)
2. If a subset of items were selected, we should keep any common items selected. So if `selected` was `[2,3]` and the new items are `[2,4,6]`, then we should update selected to be `[2]` .

Here's what the function looks like, and a [REPL](https://svelte.dev/repl/ca0cc9c7ae284101a2676d830bc511ad?version=3.44.2) to demo how it's used.

```js
import {writable, get} from 'svelte/store';
import {onDestroy} from 'svelte';

export function createSelectedStore(initialItems) {
  const items = writable(initialItems);
  const selected = writable(new Set());

  let oldItems = initialItems;

  const unsubscribeItems = items.subscribe($items => {
    const _selected = get(selected);
    if (oldItems.length === _selected.size) {
      // if all items were selected, select all of the new items
      selected.set(new Set([...$items]));
    } else {
      // otherwise, only select items that are shared between the old and new set
      const commonItems = [...$items].filter(item => _selected.has(item));
      selected.set(new Set(commonItems));
    }
    oldItems = $items;
  });

  onDestroy(() => {
    unsubscribeItems();
  });

  return {
    items,
    selected
  };
}
```

Because we subscribe to the items store so that we can update the selected store, we need to unsubscribe from it in `onDestroy`.

In practice, I used a store like this in [my site to filter Marvel comics](https://marvel.geoffrich.net/year/1984) released in a given year. For each year, users can filter the list of comics for different creators (e.g. only view comics by Chris Claremont). When changing from one year to the next, I want to preserve the filter state as outlined above &mdash; if the creators for the next year contain creators that were selected from the previous year, those creators should stay selected.

I simplified my implementation of this for the above example, but you can find the original code [on GitHub.](https://github.com/geoffrich/marvel-by-year/blob/9bf6c252a68dec46d49f37fff215806823c5617e/src/lib/stores/selected.ts)

## Wrapping up

You won't run into this use case commonly, and not every example I showed needs to be done this way. For some of these examples, you can get a similar outcome using a store. However, it's good to keep this technique in mind for when it becomes necessary.
