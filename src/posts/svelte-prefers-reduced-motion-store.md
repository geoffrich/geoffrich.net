---
title: A Svelte store that detects prefers-reduced-motion
date: '2021-03-01'
tags:
  - svelte
  - svelte:store
  - a11y
---

The prefers-reduced-motion media query is used to detect if the user has requested that animation and motion be minimized. Users may prefer to disable non-essential animations on websites due to dramatic movement triggering motion sickness and other symptoms. prefers-reduced-motion is often used in a CSS stylesheet to disable certain animations, though it can also be used to modify animations applied in JavaScript.

In this post, I will show you how to make a custom Svelte store that will store whether the user has requested reduced motion and update if the user preference changes. In an upcoming post, I will show how you can apply this store to Svelte's transition and motion packages.

Here's how you will often see prefers-reduced-motion used in CSS.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

When reduced motion is enabled, animations and transitions will be almost instantaneous while not interfering with code dependent on those animations completing.

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

If you paste the above code into your browser console and update your motion preferences, you'll see a message logged to the console informing you of the new preference. [ TODO: where to find? ]

We can wrap this code in a reusable Svelte store so that we access motion preference anywhere in our app using Svelte's reactive `$store` syntax. The store's value will be true if the user has requested reduced motion, and false if not, and will update in real time if the user changes their motion preference. Here's how we'll use the final product in a Svelte component.

```svelte
<script>
	import { reducedMotion } from './reducedMotion';
</script>

<p>reduced motion: {$reducedMotion}</p>
```

First, we initialize a readable store from Svelte's built-in store library. We detect whether reduced motion is enabled using `window.matchMedia` and pass it to `readable` to set the store's initial value.

```js
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

const getInitialMotionPreference = () => window.matchMedia(reducedMotionQuery).matches;

export const reducedMotion = readable(getInitialMotionPreference());
```

`readable` also takes a second argument -- a callback that will run the first time someone subscribes to the store. This is a good place to set up event listeners. A set function is passed to the callback so we can update the store when events are triggered.

We'll add a change event listener to the media query list and update the store if the user's preference changes. Anyone subscribing to this store will be notified of the new value. The store callback returns a function that will be run when the last consumer unsubscribes from the store. This is where we'll remove the event listener we added to the media query list.

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

That's all there is to it! Check out this Svelte REPL [TODO: add link] to see our new store in action.

Come back next week to see how we can apply this store to Svelte's built-in transition and motion packages.

TODO:

- proofread
- add links to docs
- add REPL link

## Resources

- https://css-tricks.com/introduction-reduced-motion-media-query/
- https://css-tricks.com/revisiting-prefers-reduced-motion-the-reduced-motion-media-query/
- https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
- https://web.dev/prefers-reduced-motion/
- https://www.joshwcomeau.com/react/prefers-reduced-motion/
- https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion#user_preferences
- https://github.com/sveltejs/svelte/issues/5346
