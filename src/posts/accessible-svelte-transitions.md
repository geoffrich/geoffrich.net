---
title: Accessible Svelte transitions
date: '2021-03-08'
tags:
  - svelte
  - svelte:store
  - svelte:transition
  - a11y
  - js
---

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

## The nuclear option

### Wildcard selector from Modern CSS reset

- since Svelte's built in transitions are applied in CSS, we can turn them off in our Global CSS
- it looks like we need important if we override it globally, due to CSS specificity
- base level in App.svelte?
- What if we need to reverse this/re-enable?
- Safest option to avoid all potentially-triggering animation, but also removes all animation (see above)

### How does this affect Svelte's built-in transitions?

- Delay still applies (how is this applied -- CSS?)
- Check if it affects transitions applied in JS (probably not)
- SVG path example: https://svelte.dev/repl/svg-transitions?version=3.35.0

### Custom Svelte transition store that detects this in JS

- only has to be a store if you want to be reactive to user preference changes
- could also create file and re-export transitions based on the current value of prefers-reduced-motion
- useful to change properties not applied via CSS (e.g. delay)
- issue with transition: vs in: & out:
- bind to class to affect duration/transitions

## The mindful option

- replace potentially-triggering transitions with something more subtle
- e.g., instead of fly, replace with fade
- how to handle different parameters?

## TODO

- update prev/next styling
- swap out GH link for twitter
- newsletter?
- reading time seems high -- based on wordcount. Ignore code blocks?
