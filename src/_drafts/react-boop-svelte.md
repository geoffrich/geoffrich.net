---
title: How I ported a React hover animation to Svelte
date: '3000-12-09'
tags:
  - svelte
  - svelte:action
  - svelte:animation
  - css
  - css:animation
  - js
  - react
draft: true
---

# THIS IS STILL A DRAFT

Relevant links

- My twitter thread: https://twitter.com/geoffrich_/status/1330907669239013381
- my REPL: https://svelte.dev/repl/bcccd7a1f43e41a4b824d6f50efe33a6?version=3.29.7
- lihautan's REPL: https://svelte.dev/repl/33d343911c534f3b973efe5690522feb?version=3.29.7
- My reddit post: https://www.reddit.com/r/sveltejs/comments/jzlkki/i_implemented_a_boop_hover_animation_using_svelte/
- Chris Coyier pure CSS pen https://codepen.io/chriscoyier/pen/PoGbvmV

When Josh Comeau posted a [React tutorial](https://www.joshwcomeau.com/react/boop/) on achieving a springy 'boop' animation when an icon is hovered, I was instantly intrigued. _A whimsical twist on hover transitions?_ Sign me up! There was just one problem.

I don't use React 😨

My current framework of choice is Svelte, but this tutorial wasn't written for Svelte. Does that mean I can't learn anything from it?

Of course not! Despite the framework, it's just JavaScript and CSS at the end of the day. In this post, I'll describe how I ported this React animation to Svelte. I recommend checking out Josh's tutorial for a more in-depth explanation of the effect, as this post will be focused on translating one framework to another.

If you're viewing this on [my personal site](https://geoffrich.net), you can see an example of the Svelte component in action below. The animation triggers on both hover and click, to make the demo accessible for keyboard and mobile users. Shout out to [eleventy-plugin-embed-svelte](https://github.com/shalomscott/eleventy-plugin-embed-svelte) for making this super painless.

{% embedSvelte 'boop/BoopDemo.svelte' %}

Here's what Josh's React hook looks like.

```js
import React from 'react';
import {useSpring} from 'react-spring';
import usePrefersReducedMotion from '@hooks/use-prefers-reduced-motion.hook';
function useBoop({
  x = 0,
  y = 0,
  rotation = 0,
  scale = 1,
  timing = 150,
  springConfig = {
    tension: 300,
    friction: 10
  }
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isBooped, setIsBooped] = React.useState(false);
  const style = useSpring({
    transform: isBooped
      ? `translate(${x}px, ${y}px)
         rotate(${rotation}deg)
         scale(${scale})`
      : `translate(0px, 0px)
         rotate(0deg)
         scale(1)`,
    config: springConfig
  });
  React.useEffect(() => {
    if (!isBooped) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setIsBooped(false);
    }, timing);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isBooped]);
  const trigger = React.useCallback(() => {
    setIsBooped(true);
  }, []);
  let appliedStyle = prefersReducedMotion ? {} : style;
  return [appliedStyle, trigger];
}
export default useBoop;
```

I translated Josh's React hook to a Svelte action named `boop`. If you're not familiar with actions, you can read more about them in the official [Svelte tutorial](https://svelte.dev/tutorial/actions). Our new action can be used like so.

{% raw %}

```svelte
<script>
  import boop from "./boop.js";
  export let boopParams = { y: 5 };
</script>

<span use:boop={{ ...boopParams }}>
  <slot />
</span>
```

{% endraw %}

The `boop` function will run when the node is mounted and set up everything needed to run the animation.

Josh's version needed to import `react-spring` to achieve the springiness of the animation. Lucky for us, Svelte has spring physics built in via `svelte/motion`, so there was no need to add an external dependency.

Here's what the Svelte implementation ends up looking like. We put the transition values (e.g. position, rotation, scale) into a `spring` store and subscribe to it to set a CSS transform on the node when the values change. This will result in a springy effect, as the store updates the values over time consistent with the spring parameters we set. When the boop effect triggers, we `set` the store to the new transform values and the springy animation occurs.

```js
import {spring} from 'svelte/motion';
import {getPrefersReducedMotion} from './util';

export default function boop(
  node,
  {x = 0, y = 0, rotation = 0, scale = 1, timing = 150, boopElement}
) {
  if (getPrefersReducedMotion()) return;

  node.addEventListener('mouseenter', handleMouseEnter);
  // only for demo purposes on mobile
  node.addEventListener('click', handleMouseEnter);

  let timeoutId;
  const springyRotation = spring(
    {x: 0, y: 0, rotation: 0, scale: 1},
    {
      stiffness: 0.1,
      damping: 0.15
    }
  );

  const unsubscribe = springyRotation.subscribe(transformElement);

  function handleMouseEnter() {
    clearTimeout(timeoutId);
    springyRotation.set({x, y, rotation, scale});

    timeoutId = setTimeout(() => {
      springyRotation.set({x: 0, y: 0, rotation: 0, scale: 1});
    }, timing);
  }

  function transformElement({x, y, rotation, scale}) {
    const element = boopElement || node;
    element.style.display = 'inline-block';
    element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
  }

  return {
    update(params) {
      ({x = 0, y = 0, rotation = 0, scale = 1, timing = 150, boopElement} = params);
    },
    destroy() {
      clearTimeout(timeoutId);
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('click', handleMouseEnter);
      unsubscribe();
    }
  };
}
```

## React hooks can return things, Svelte actions can't

- This meant we had to handle state and apply styles within the action itself (separation of concerns?)
- Handling boop state -- React version composes 3 hooks (set up state with useState, react to state change with useEffect, and trigger a state change with useCallback).
- Svelte cuts out the middleman, but there's less flexibility
- React version lets you call trigger however you want. Svelte version only boops on mouse enter
- You could pass array of DOM event listeners, but what about non-DOM events?

## Spring physics are an external library in React, but internal in Svelte

- react-spring vs svelte/motion
- you can't spring a string in Svelte, so you have to convert numbers to transform strings

## A Svelte action operates on Raw DOM nodes, React hooks can be more abstract

- Not bad, just different
- More imperative
- We have to handle cleanup/updates in Svelte version

## Why can't we just use CSS animations/Svelte's built-in transitions/animations?

- You can approximate spring physics with CSS animations, but not replicate them
- See Chris Coyier's pen
  https://github.com/IanLunn/Hover/blob/master/css/hover.css
