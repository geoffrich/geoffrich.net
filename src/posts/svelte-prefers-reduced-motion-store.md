---
title: A Svelte store for prefers-reduced-motion
date: '2021-03-01'
tags:
  - svelte
  - svelte:store
  - a11y
---

The [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) media query is used to detect if the user has requested that animation and motion be minimized. Website animation may trigger motion sickness for those with vestibular disorders, and it is important to disable non-essential animations for these users. prefers-reduced-motion is often used in a CSS stylesheet to disable certain animations, though it can also be used to modify animations applied with JavaScript.

In this post, I will show you how to make a custom Svelte store whose value will indicate whether the user has requested reduced motion. The store's value will automatically update if the user's preference changes. In an upcoming post, I will show how you can apply this store to Svelte's transition and motion packages. This article will focus on the Svelte side of things &mdash; check out [CSS Tricks](https://css-tricks.com/introduction-reduced-motion-media-query/) and [web.dev](https://web.dev/prefers-reduced-motion/) for more on prefers-reduced-motion itself.

## Detecting prefers-reduced-motion

Here's how you will often see prefers-reduced-motion used in CSS.

```css
@media (prefers-reduced-motion: reduce) {
  /* 
    Anything inside this block will apply when the user has 
    requested reduced motion 
  */
}
```

In JavaScript, you can detect the same preference using `window.matchMedia`.

```js
function prefersReducedMotion() {
  const mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQueryList.matches;
}
```

If you want to react when the user changes their preference, you can attach an event listener to the media query list.

```js
const mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
mediaQueryList.addEventListener('change', handlePreferenceChange);

function handlePreferenceChange(event) {
  console.log(
    `prefers-reduced-motion: reduce is ${event.matches ? 'enabled' : 'disabled'}`
  );
}
```

If you run the above code into your browser console and update your motion preferences, you'll see a message logged to the console informing you of the new preference. Here's how to simulate the setting in [Chrome DevTools](https://developers.google.com/web/updates/2019/10/devtools#userpreferences) and where to enable the setting in [various OSes and Firefox](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion#user_preferences).

## Using a Svelte store

We can wrap this code in a reusable Svelte store so that we access motion preference anywhere in our app using Svelte's reactive `$store` syntax. The store's value will be true if the user has requested reduced motion and will update in real time if the user changes their motion preference. If you are unfamiliar with Svelte's stores, I recommend checking out the [official tutorial](https://svelte.dev/tutorial/writable-stores).

Here's how we'll use the final product in a Svelte component.

```svelte
<script>
	import { reducedMotion } from './reducedMotion';
</script>

<p>reduced motion: {$reducedMotion}</p>
```

First, we initialize a [readable store](https://svelte.dev/tutorial/readable-stores) from Svelte's built-in store library. We detect whether reduced motion is enabled using `window.matchMedia` and pass it to `readable` to set the store's initial value.

```js
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

const getInitialMotionPreference = () => window.matchMedia(reducedMotionQuery).matches;

export const reducedMotion = readable(getInitialMotionPreference());
```

`readable` also takes an optional second argument &mdash; a callback that will run the first time someone subscribes to the store. This is a good place to set up event listeners. A set function is passed to the callback so we can update the store when events are triggered.

We'll add a change event listener to the media query list so that we can update the store if the user's preference changes. When the store is updated, anyone subscribing to this store will be notified of the new value.

Since we're adding an event listener, we need to remove it when it's no longer needed. We can return a function from the store callback that will be run when the last consumer unsubscribes from the store and remove the event listener there.

```js
export const reducedMotion = readable(getInitialMotionPreference(), set => {
  const updateMotionPreference = event => {
    set(event.matches);
  };

  const mediaQueryList = window.matchMedia(reducedMotionQuery);
  mediaQueryList.addEventListener('change', updateMotionPreference);

  return () => {
    mediaQueryList.removeEventListener('change', updateMotionPreference);
  };
});
```

That's all there is to it! We can import this store anywhere in our application and get a reactive value based on the user's motion preferences. Check out this [Svelte REPL](https://svelte.dev/repl/e9b0322383bd4922bed92056c106c643?version=3.34.0) to see our new store in action.

Come back next week to see how we can apply this store to Svelte's built-in transition and motion packages. Follow me on [Twitter](https://twitter.com/geoffrich_) or [DEV](https://dev.to/geoffrich/) to be notified when I publish the next article.
