---
title: Accessible Svelte transitions
date: '2021-03-15'
tags:
  - svelte
  - a11y
  - js
socialImage: 'https://geoffrich.net/images/social/accessible-svelte-transitions.png'
---

**Update 11/2021:** this post was adapted into a lightning talk I recorded for the [Fall 2021 Svelte Summit.](/posts/svelte-summit-2021/)

Svelte's built-in [transition](https://svelte.dev/tutorial/transition) functionality makes it easy to animate elements as they are added to and removed from the DOM. It's as simple as adding a `transition:` directive to an element and passing one of the built-in transition functions.

However, we need to be mindful of accessibility issues around animation. Some transitions could trigger motion sickness for those with motion sensitivities. I will go over which Svelte transitions could cause accessibility issues and how to remove or replace them based on the user's preference.

## What kind of animations cause motion sickness?

Making our sites accessible does not mean removing animation entirely. When used tastefully, animation can make web sites more intuitive to use. We mainly need to be careful with animation that involves a large amount of movement. Animation that does not involve movement (e.g. color or opacity animation) is less likely to pose a problem to those sensitive to motion. Val Head has a great article on [A List Apart](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/) that covers this subject in depth.

Of Svelte's seven built-in transition functions, five of them involve motion and could pose a problem: fly, slide, scale, draw, and crossfade. The other two, fade and blur, do not involve motion and shouldn't cause any issues.

There are two options to apply the user's motion preference to Svelte's transitions: one in CSS, and one in JS. In both cases, we will use the [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) media query to detect if the user has requested reduced motion.

## Option 1: Globally disable all animation

Since Svelte's built-in transitions are applied in CSS, we can disable them in CSS. The prefers-reduced-motion media query will detect if the user has requested reduced motion in their device settings. You can add the following to your global styles to disable all CSS animation.

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

Because Svelte's transitions are applied using inline styles, we need **!important** here to win the [specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity) battle.

After applying this to your global styles, Svelte's built in transition functions will no longer have any effect when reduced motion is enabled. This is the safest option, since you can be sure that Svelte's built-in transitions won't trigger motion sickness if the user has enabled the setting. However, it has some downsides.

1. It has no effect on any [custom JS transitions](https://svelte.dev/tutorial/custom-js-transitions) (written using `tick`)
2. It also disables safe animations that do not involve motion, like fade.
3. Because it's global and uses !important, it's hard to undo if you want to add animation back for some elements.

## Option 2: Reactively swap out transitions

We can have more fine-grained control by replacing problematic transitions with something else when reduced motion is requested. For example, instead of having something fly in, we could fade it in instead. This is how iOS implements reduced motion transitions. When reduced motion is turned on, apps fade into view instead of the traditional zoom. This preserves the polish that animations add to a UI while also avoiding animations that could trigger motion sickness.

We'll use the `reducedMotion` store from my [previous article](/posts/svelte-prefers-reduced-motion-store/) to detect if the user has requested reduced motion. Using a Svelte store will make it easy to react to user preference changes.

We can define the transition to use for an element in a [reactive declaration](https://svelte.dev/tutorial/reactive-declarations). When the value of the store changes, `rmTransition` automatically updates.

```html
<script>
  import {reducedMotion} from './reducedMotion';
  import {fly, fade} from 'svelte/transition';

  let showCards = false;

  $: rmTransition = $reducedMotion ? fade : fly;
</script>
```

You can use `rmTransition` just like any other Svelte transition function.

{% raw %}

```svelte
<div transition:rmTransition={{ y: 300 }}>
```

{% endraw %}

When reduced motion is enabled, the element will fade in. When reduced motion is not enabled, it will fly in. See it in action in this [REPL](https://svelte.dev/repl/470f23fcce014693be8333016059c223?version=3.35.0).

Note that the transitions will share the same set of parameters. It probably won't hurt anything, since fade will ignore parameters that it doesn't understand (e.g. x and y). However, if you wanted to make changes to the parameters when prefers-reduced-motion is enabled, you can define a custom transition with the desired parameters hard-coded.

```js
const customFade = (node, params) => fade(node, {duration: 300});
$: cardTransition = $reducedMotion ? customFade : fly;
```

If you often find yourself making the same replacement, we can move this logic into a reactive store that can be used in any component.

```js
import {derived} from 'svelte/store';
import {fly, fade} from 'svelte/transition';

const accessibleFly = derived(reducedMotion, ($reducedMotion, set) => {
  if ($reducedMotion) {
    set(fade);
  } else {
    set(fly);
  }
});
```

This store is derived from our `reducedMotion` store. When the value of `reducedMotion` changes, this store will automatically replace fly with fade. We can use the value of this store as a replacement for Svelte's built-in fly transition.

{% raw %}

```svelte
<div transition:$accessibleFly={{ y: 300 }}>
```

{% endraw %}

## Wrapping up

You have two options to respect the user's motion preference when using Svelte transitions. You can disable all animations globally in CSS, which is the safest option but also disables animations that do not trigger motion sickness. Alternatively, you can swap out problematic transitions with a safer option when the user requests it, but this requires vigilance whenever implementing a new transition.

We all should do our part to make the web a more accessible place. If you want to learn more about motion sensitivities and the web, I've linked some articles below that I found helpful while working on this piece.

- "Designing With Reduced Motion For Motion Sensitivities" by Val Head, [Smashing Magazine](https://www.smashingmagazine.com/2020/09/design-reduced-motion-sensitivities/)
- "Designing Safer Web Animation For Motion Sensitivity" by Val Head, [A List Apart](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/)
- "Accessibility for Vestibular Disorders: How My Temporary Disability Changed My Perspective" by Facundo Corradini, [A List Apart](https://alistapart.com/article/accessibility-for-vestibular/)
- "Revisiting prefers-reduced-motion, the reduced motion media query" by Eric Bailey, [CSS Tricks](https://css-tricks.com/revisiting-prefers-reduced-motion-the-reduced-motion-media-query/)
