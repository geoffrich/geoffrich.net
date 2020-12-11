---
title: How I ported a React hover animation to Svelte
date: '2020-12-09'
tags:
  - svelte
  - svelte:action
  - svelte:animation
  - css
  - css:animation
  - js
  - react
---

Relevant links

- My twitter thread: https://twitter.com/geoffrich_/status/1330907669239013381
- my REPL: https://svelte.dev/repl/bcccd7a1f43e41a4b824d6f50efe33a6?version=3.29.7
- lihautan's REPL: https://svelte.dev/repl/33d343911c534f3b973efe5690522feb?version=3.29.7
- My reddit post: https://www.reddit.com/r/sveltejs/comments/jzlkki/i_implemented_a_boop_hover_animation_using_svelte/

When Josh Comeau posted a [React tutorial](https://www.joshwcomeau.com/react/boop/) on achieving a springy 'boop' animation when an icon is hovered, I was instantly intrigued. _A whimsical twist on hover transitions?_ Sign me up! There was just one problem.

I don't use React 😨

My current framework of choice is Svelte, but this tutorial wasn't written for Svelte. Does that mean I can't learn anything from it?

Of course not! Despite the framework, it's just JavaScript at the end of the day. In this post, I'll describe how I ported this React animation to Svelte. I recommend checking out Josh's tutorial for a more in-depth explanation of the effect, as this post will be focused on translating one framework to another.

TODO: compile to web component and render?

![A mouse hovering over three icons. The first rotates from side to side, the second scales up and down, and the third bounces up and down.](/images/boop/boop.gif)

I translated the Josh's React hook to a Svelte action named `boop`. If you're not familiar with actions, you can read more about them in the official [Svelte tutorial](https://svelte.dev/tutorial/actions). Our new action can be used like so.

{% raw %}

```svelte
<script>
	import boop from './boop.js';
	let isBooped = false;

	function setIsBooped(val) {
		isBooped = val;
	}

	function triggerBoop() {
		isBooped = true;
	}
</script>

<span
  on:mouseenter={triggerBoop}
  use:boop={{isBooped, y: 5, timing: 200, setter: setIsBooped}}>
	<slot/>
</span>
```

The `boop` function will run when the node is mounted and set up everything needed to run the animation.

Josh's version needed to import `react-spring` to achieve the springiness of the animation. Lucky for us, Svelte has spring physics built in via `svelte/motion`, so there was no need to add an external dependency.

Here's what the Svelte implementation ends up looking like. We put the transition values (e.g. position, rotation, scale) into a `spring` store and subscribe to it to set a CSS transform on the node when the values change. This will result in a springy effect, as the store updates the values over time consistent with the spring parameters we set. When the boop effect triggers, we `set` the store to the new transform values and the springy animation occurs.

```js
import {spring} from 'svelte/motion';

export default function boop(node, params) {
  let {setter} = params;
  let springyRotation = spring(
    {x: 0, y: 0, rotation: 0, scale: 1},
    {
      stiffness: 0.1,
      damping: 0.15
    }
  );
  let prefersReducedMotion = getPrefersReducedMotion();

  node.style = `display: inline-block`;

  springyRotation.subscribe(({x, y, rotation, scale}) => {
    node.style.transform =
      !prefersReducedMotion &&
      `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
  });

  return {
    update({isBooped, x = 0, y = 0, rotation = 0, scale = 1, timing}) {
      springyRotation.set(
        isBooped ? {x, y, rotation, scale} : {x: 0, y: 0, rotation: 0, scale: 1}
      );

      if (isBooped) {
        window.setTimeout(() => setter(false), timing);
      }
    }
  };
}
```

{% endraw %}

The only part of my solution I didn't like was handling state. The action needs to automatically reset `isBooped` after 200ms, but `isBooped` is controlled at the component level. To allow resetting state, I had the component pass a function to the action that resets `isBooped`. I posted this on Twitter, and Tan Li Hau was nice enough to show me a more idiomatic solution. He also reminded me to clean up the subscription in the actions `destroy` function.
