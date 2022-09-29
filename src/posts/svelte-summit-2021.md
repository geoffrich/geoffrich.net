---
title: 'Svelte Summit 2021: Svelte Transitions and Accessibility'
date: '2021-11-20'
tags:
  - svelte
  - a11y
  - speaking
socialImage: 'https://geoffrich.net/images/social/svelte-summit-2021.png'
templateEngineOverride: njk,md
---

{% set videoTitle = "Geoff Rich - Svelte Transitions and Accessibility" %}
{% set videoId = "iceNAO8c4J4" %}
{% include 'partials/components/youtube.njk' %}

I spoke at the Fall 2021 [Svelte Summit](https://sveltesummit.com/) on Svelte Transitions and Accessibility. Svelte includes built-in animations that makes it easy to slide, scale, and fly elements in and out of the DOM. However, you need to be careful to not trigger motion sickness in your users. In my talk, I go over which Svelte transitions could cause accessibility issues and how to respect user motion preferences when using them.

We iteratively build a solution to change which transition we use when the user requests reduced motion -- first only using CSS, then detecting the user's motion preference in a Svelte component, to finally encapsulating the logic in a reusable Svelte store.

Following is a transcript of the talk. You can find my [slide deck](https://docs.google.com/presentation/d/1djta1tNkYdN7B287S3U9Stfo0L8q0lfgsVQGUKBu2N4/edit?usp=sharing) on Google Slides and the [example code](https://github.com/geoffrich/svelte-summit-accessible-transitions) on my GitHub. The entire event is available to stream on [YouTube](https://youtube.com/playlist?list=PL8bMgX1kyZTg2bI9IOMgfBc8lrU3v2itt).

Huge shout-out to the organizers for putting on such a great event and for featuring my talk! Special thanks to Kevin for being very quick to respond to my questions via email, and to Shawn (a.k.a. swyx) for hosting a speaker prep session with some very helpful tips.

---

Hi, I'm Geoff. I'm a software engineer at Alaska Airlines and today I want to talk about Svelte transitions.

Svelte transitions are amazing! I love that with only a few lines of code and no additional dependencies, you can add some animation that can really make your app stand out. However, you need to be careful. Some people are sensitive to motion. If you use these transitions irresponsibly, they can trigger headaches, dizziness, and even nausea&mdash;and this is not how people should feel when they visit your website!

Remember &mdash; to quote the [official Svelte transition tutorial](https://svelte.dev/tutorial/custom-css-transitions), "with great power comes great responsibility."

In this talk, I'll talk about the types of animation that can cause accessibility issues, how to detect if the user has requested reduced motion, and how to apply these concepts to Svelte transitions

## Motion and accessibility

First, let's talk about motion and accessibility.

So, who does this affect? Well, the largest group affected by animation on the web is people with vestibular disorders. The vestibular system controls your body's sense of balance. If it doesn't function properly, you could experience dizziness, loss of balance, and vertigo, among other symptoms. And animation can often be a trigger for these effects.

According to the National Institute on Deafness and Other Communication Disorders, 4% of American adults report a chronic problem with balance. That's millions of people, many of whom could be using your website or app.

So what kinds of animation can cause issues? Well, there are a few factors.

In general, you want to avoid large amounts of movement. So a button moving a few pixels when you hover it is okay, but something flying across the entire screen could cause an issue. You also want to be careful with multiple elements moving at the same time, especially if they're moving in different directions or at different speeds, such as parallax type movement. And tying any movement to the user's scroll position could be problematic, especially if the element is moving at a different speed or direction from how the user is scrolling.

I recommend the A List Apart article ["Designing Safer Web Animation for Motion Sensitivity"](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/) from Val Head if you want more detail on this.

So with that in mind, what Svelte transitions deserve extra caution? Well, of the 7 built-in Svelte transitions, 5 of them involve motion. Those would be fly, slide, scale, draw, and crossfade. Transitions like fade and blur that do _not_ involve motion are unlikely to cause issues. This doesn't mean that all uses of these transitions are problematic. What you should look out for is the amount and direction of the motion.

So does that mean if you care about accessibility, you're not allowed to use these transitions? Of course not! But you should provide an alternate experience for users who are sensitive to motion. And that's where prefers-reduced-motion comes in.

## Prefers reduced motion

So, Operating systems have started to add ways for users to request reduced motion. [slides show image of iOS and Mac accessibility settings] Here is where you can find it on iOS and Mac, where it's called "reduce motion". [slides show Windows settings and Chrome DevTools] And here's where it is on Windows, under "show animations in Windows". Chrome also lets you set it directly in DevTools, so you can emulate that experience without having to adjust your OS settings.

Here's a video of how iOS behaves when you have this setting enabled. Motion warning for the next few seconds. Normally, opening an app triggers a zooming animation where the app expands into view. However, if you turn on this setting [reduced motion], apps fade in and out instead.

Originally this setting was just for users to control their operating system, but it's also available as a media query in web browsers, and it has great browser support. So, we can detect if a user has requested reduced motion, and adjust our site accordingly.

So let's recap. We know that large amounts of motion can trigger dizziness and nausea in some of our users. We have a media query that can detect if they've requested reduced motion. But how do we apply that to transitions in our Svelte application? Well, there's a few different options. Enough slides. Let’s jump to some code.

## Live demo

First, let me show you where we're starting. We have a checkbox here that will hide and show this box. The box has a fly transition applied, so that it flies in and out. I set the y parameter very low to minimize any triggering motion.

{% raw %}

```svelte
<script>
	import { fly } from 'svelte/transition';

	let show = false;
</script>

<div class="input">
	<input type="checkbox" id="show" bind:checked={show} />
	<label for="show">Show box</label>
</div>
{#if show}
	<div class="box" transition:fly={{ y: 30 }}>
		<span class="emoji">📦</span>
	</div>
{/if}
```

{% endraw %}

Here's what the transition looks like with reduced motion disabled. [box flies in and out]

So, the first way to respect reduced motion is to disable all animation entirely. Svelte's built-in transitions are applied using native CSS animations, so this snippet will prevent those animations from playing if reduced motion is turned on. Because Svelte's transitions use inline styles, we need to use `!important` here so that this override applies.

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

So, this seems to work. If I enable prefers-reduced motion in Chrome, then the fly animation doesn't play. Is that all there is to it? Well, this approach has some drawbacks.

It's definitely better than not respecting motion preference at all. However, we use animation for a reason. Animation is often essential to make your interface understandable. So we don't want to turn it off entirely.

Remember: it's prefers _reduced_ motion, not prefers _no_ motion.

Instead, we could behave more like iOS does&mdash;if reduced motion is requested, change the animation we use to have less motion. On iOS, they change the zoom to a fade instead when an app opens. We could do the same &mdash; fade the element in instead of flying it in.

Of course, this approach requires more vigilance on the part of the developer. You need to be intentional when implementing animation and choose what the fallback should be for users with motion sensitivities. But, this approach will result in a richer experience for those users as well.

Even if you do choose to globally disable animation like this, remember that some Svelte animations are applied purely through JavaScript, not CSS. Custom JavaScript transitions and animation using the spring or tweened stores won't be affected by a CSS-only solution. So, it's worthwhile to consider other methods as well.

Now, let's look at how we can detect reduced motion in JavaScript, and change the transition we use accordingly.

This is the same component as before, except now the transition we use is stored in a variable. `transitionToUse` will reactively update based on the value of `reducedMotion`. If reduced motion is true, we'll use the fade transition. Otherwise, we'll use the fly transition. But for that to work, we need to set `reducedMotion` properly.

{% raw %}

```svelte
<script>
	import { fly } from 'svelte/transition';

	let show = false;
	let reducedMotion = false;
	$: transitionToUse = reducedMotion ? fade : fly;
</script>

<div class="input">
	<input type="checkbox" id="show" bind:checked={show} />
	<label for="show">Show box</label>
</div>
{#if show}
	<div class="box" transition:transitionToUse={{ y: 30 }}>
		<span class="emoji">🐱</span>
	</div>
{/if}
```

{% endraw %}

First, we'll call `window.matchMedia` to get a media query list that will tell us if the reduced motion media query applies. We can also add an event listener to this list, so that if the user changes their motion preference, we can immediately react to it instead of only checking on initial load. And just like any time when we add an event listener manually, we need to remove it when the component is destroyed. Finally, if you're doing this in a server-side rendering context like SvelteKit, you need to make sure we're in the browser so that we can use a function from the window.

{% raw %}

```svelte
<script>
	import { fly, fade } from 'svelte/transition';
	import { onDestroy } from 'svelte';
	import { browser } from '$app/env';

	let show = false;
	let reducedMotion = false;
	$: transitionToUse = reducedMotion ? fade : fly;

	const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

	if (browser) {
		let mediaQuery = window.matchMedia(reducedMotionQuery);
		reducedMotion = mediaQuery.matches;

		const setReducedMotion = (event) => {
			reducedMotion = event.matches;
		};

		mediaQuery.addEventListener('change', setReducedMotion);

		onDestroy(() => {
			mediaQuery.removeEventListener('change', setReducedMotion);
		});
	}
</script>

<div class="input">
	<input type="checkbox" id="show" bind:checked={show} />
	<label for="show">Show box</label>
</div>
{#if show}
	<div class="box" transition:transitionToUse={{ y: 30 }}>
		<span class="emoji">🐱</span>
	</div>
{/if}
```

{% endraw %}

And that's all there is to it! When we set prefers reduced motion, the box now fades in. After we unset it, the box flies in.

So this works great &mdash; now let's make it more reusable. Stores are a great way to extract reactive logic in Svelte. I've updated this example to use a store instead of a local variable, but we still need to implement it.

{% raw %}

```html
<script>
	import { fly, fade } from 'svelte/transition';
	import reducedMotion from '$lib/reducedMotionStore';

	let show = false;
	$: transitionToUse = $reducedMotion ? fade : fly;
</script>

<div class="input">
	<input type="checkbox" id="show" bind:checked={show} />
	<label for="show">Show box</label>
</div>
{#if show}
	<div class="box" transition:transitionToUse={{ y: 30 }}>
		<span class="emoji">🐶</span>
	</div>
{/if}
```

{% endraw %}

First, we'll get the initial value of the store using the query from before, defaulting to false if we're not in the browser. Then, we'll pass a function as the second argument to the store. This function will be called when the store gets its first subscriber, so it's a great place to set up event listeners. We'll add the listener from before to react to preference changes. We can return a cleanup function to remove the event listener when there are no more subscribers. And just like before, we only want to run this code in the browser.

```js
import {readable} from 'svelte/store';
import {browser} from '$app/env';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

const getInitialMotionPreference = () => {
  if (!browser) return false;
  return window.matchMedia(reducedMotionQuery).matches;
};

export default readable(getInitialMotionPreference(), set => {
  if (browser) {
    const setReducedMotion = event => {
      set(event.matches);
    };
    const mediaQueryList = window.matchMedia(reducedMotionQuery);
    mediaQueryList.addEventListener('change', setReducedMotion);

    return () => {
      mediaQueryList.removeEventListener('change', setReducedMotion);
    };
  }
});
```

And there you have it &mdash; a reactive, reusable store to detect the user's motion preference.

## Could Svelte make this easier?

So, writing all this code begs the question: could Svelte make any of this easier? And my answer is: maybe! At minimum, I think it would be good to document the need to respect motion preferences when using Svelte transitions.

However, I think it's tricky to figure out just how much of what I just showed could or should be integrated into Svelte itself. For instance, I wouldn't want to add that animation-disabling CSS snippet into the template and call it a day. As I talked about earlier, there's a lot more nuance involved there. At its core, this is a design question, and there isn't going to be an answer that's the same for every app. But maybe there's a way to make it easier to adjust animation based on motion preference, by adding similar code to what I showed you.

There is an open [GitHub issue](https://github.com/sveltejs/svelte/issues/5346) around this already. If you have thoughts or suggestions as to how to make this sort of thing easier, go comment over there. But at the end of the day, it’s our responsibility to make sure the code we write is accessible. Anything Svelte does won't change that.

Thanks for watching. If you want to learn more, here are some resources I found helpful while preparing for this talk, by designers and developers much more knowledgeable about this than I am. At the bottom are two articles I wrote on my personal blog about this topic earlier this year. They formed the foundation for this talk.

- Smashing Magazine, [“Respecting Users’ Motion Preferences”](https://www.smashingmagazine.com/2021/10/respecting-users-motion-preferences/) and [“Designing With Reduced Motion for Motion Sensitivities”](https://www.smashingmagazine.com/2020/09/design-reduced-motion-sensitivities/)
- CSS-Tricks, [“Revisiting prefers-reduced-motion, the reduced motion media query”](https://css-tricks.com/revisiting-prefers-reduced-motion-the-reduced-motion-media-query/)
- web.dev, [“prefers-reduced-motion: Sometimes less movement is more”](https://web.dev/prefers-reduced-motion/)
- geoffrich.net, [“A Svelte store for prefers-reduced-motion”](/posts/svelte-prefers-reduced-motion-store/)
  and [“Accessible Svelte Transitions”](/posts/accessible-svelte-transitions/)

You can find me on Twitter [@geoffrich\_](https://twitter.com/geoffrich_), or at my personal site, [geoffrich.net](/), where I regularly write about Svelte. If you have any questions, feel free to reach out on Twitter. Thanks again!
