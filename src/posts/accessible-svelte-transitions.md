---
title: Accessible Svelte transitions
date: '2021-03-15'
tags:
  - svelte
  - svelte:store
  - svelte:transition
  - a11y
  - js
---

1. What kinds of animations cause issues?
2. Option 1: Globally disable all animation using a media query
3. Option 2: Reactively replace transitions when prefers-reduced-motion is enabled.

## What kind of animations cause accessibility issues?

- [reduce != remove](https://css-tricks.com/revisiting-prefers-reduced-motion-the-reduced-motion-media-query/#reduce-isnt-necessarily-remove)
- This doesn't mean don't use animation -- it can make sites [easier to use and understand](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/#section7) and reduce cognitive load
- [A List Apart article](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/#section3)
  - Relative size of movement
  - Mismatched directions and speed, e.g. parallax motion
  - Covering a large perceived distance, e.g. iOS zoom transitions
  - "Animation that involves only non-moving properties, like opacity, color, and blurs, are unlikely to be problematic."
- How PRM behaves on iOS
  - instead of zooming, performs fades instead
- Of Svelte's built-in transition functions, fly, slide, scale, draw could all pose issues, depending on context
- Fade and blur are likely fine, since they don't involve motion
- Keep this in mind when writing custom transitions
  - see example in Svelte tutorial (https://svelte.dev/tutorial/custom-css-transitions)

## Option 1: Globally disable all animation

Since Svelte's built-in transitions are applied in CSS, we can use CSS to disable them. Using the following in your global stylesheet will disable all CSS animation.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    animation-delay: 0.01ms !important;
  }
}
```

Unfortunately, we need !important here to beat the transition animation's specificity. TODO: elaborate?

After applying this to your global styles, Svelte's built in transition functions will no longer run. Elements will immediately show up, which can be a little jarring.

Note that since this is a CSS solution, it does not affect any custom JS transitions (using `tick`).

TODO: can we reverse this?

This is the safest option to avoid all potentially-triggering animation, but it removes all animation -- even those that don't involve motion.

## Option 2: Reactively swap out transitions

We can have more fine-grained control by reactively replacing problematic transitions with a more subtle effect. For example, instead of having something fly in, we could use fade instead. This is less abrupt than removing animations altogether.

Let's use the prefersReducedMotion store from my [previous article](/posts/svelte-prefers-reduced-motion-store/) so that we know when the user's preference has changed.

We define the transition to use for the card in a reactive declaration. When the value of the store changes, the transition used for the card also changes.

```html
<script>
  import {reducedMotion, transitionReducedMotion} from './reducedMotion';
  import {fly, fade} from 'svelte/transition';

  let showCards = false;

  $: cardTransition = $reducedMotion ? fade : fly;
</script>
```

You can use `cardTransition` just like you'd use any other svelte transition function.

{% raw %}

```svelte
<div transition:cardTransition={{ y: 300 }}>
```

{% endraw %}

TODO: maybe use scale instead?

One potential gotcha is that the transitions will share the same set of parameters. It probably won't hurt anything, since fade will ignore parameters that it doesn't understand (e.g. x and y). However, if you wanted to make changes to the parameters when prefers-reduced-motion is enabled (e.g. removing delay), you can define a custom transition function with the parameters you want hardcoded.

```js
const customFade = (node, params) => fade(node, {duration: 300});
$: cardTransition = $reducedMotion ? customFade : fly;
```

Finally, if you often find yourself making the same replacement, we can move this logic into a reactive store that can be used in any component.

```js
const accessibleFly = derived(reducedMotion, ($reducedMotion, set) => {
  if ($reducedMotion) {
    set(fade);
  } else {
    set(fly);
  }
});
```

This store is derived from our reducedMotion store. When the value of reducedMotion changes, this store will automatically update with the replacement transition. We can use the value of this store in the transition directive on an element.

{% raw %}

```svelte
<div transition:$accessibleFly={{ y: 300 }}>
```

{% endraw %}

One caveat is that the Svelte language server doesn't detect the store being used when passed to a transition like this. I think this is a bug with the Svelte language server and have filed an issue (TODO: link to issue). It's only cosmetic in VS Code and doesn't affect the behavior of the actual component.

## Wrapping up

In summary, you have two options to respect the user's motion preference when using Svelte transitions. You can disable all animations globally in CSS, which is the safest option (you're less likely to forget) but can make your app appear less smooth. Alternatively, you can react to prefers-reduced-motion in JS and replace problematic transitions with a safer option when necessary.

## TODO

- update prev/next styling
- newsletter?
- reading time seems high -- based on wordcount. Ignore code blocks?
