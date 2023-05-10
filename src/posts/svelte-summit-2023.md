---
title: 'Svelte Summit 2023: Svelte and View Transitions'
date: '2023-05-06'
tags:
  - svelte
  - speaking
  - view transitions
templateEngineOverride: njk,md
---

{% set videoTitle = "Svelte Summit 2023" %}
{% set videoId = "K95TQ-Yh7Cw" %}
{% include 'partials/components/youtube.njk' %}

I spoke at the Spring 2023 [Svelte Summit](https://www.sveltesummit.com/) on Svelte and view transitions. The View Transitions API is an exciting new browser API that streamlines the process of animating between two page states. While the headline use case is page transitions, it can also be used for all sorts of animation in your Svelte app. In this talk, I show how you can replace Svelte’s built-in flip and crossfade animations with view transitions, as well as the pros of cons of each approach.

Following is a transcript of the talk, and the entire event is available to stream on [YouTube](https://www.youtube.com/live/0bog8-Ay7CU). My demo code is available [on GitHub](https://github.com/geoffrich/svelte-summit-view-transitions), or you can visit the [demo site](https://svelte-summit-view-transitions.vercel.app/) to see it in action. Note that the view transitions part of the demo will only work in Chrome at time of writing.

If you’re coming here after watching the talk, you can find a list of resources and further reading at the end of the page.

---

Hello, I’m Geoff, a Svelte maintainer and Senior Software Engineer at Ordergroove.

Svelte transitions and animations — everybody loves them. In fact, they’re usually one of the top three reasons people fall in love with Svelte, right next to “simple state management” and “feeling superior about not having a virtual DOM.”

There are [7 built-in Svelte transitions](https://svelte.dev/docs#run-time-svelte-transition) and [1 built-in animation function](https://svelte.dev/docs#run-time-svelte-animate), but today, we’re going to focus on two: `flip` and `crossfade`. We’ll talk about why we need them in the first place and how new browser capabilities might provide an alternative. Maybe.

## flip and crossfade

Let’s start with `animate:flip`. This is a directive that you can use inside an `#each` block to make reordering the elements in that block smoother.

For example, look at this row of playing cards. Clicking the “Shuffle” button reorders them, but they abruptly jump to their new positions — it’s hard to understand what playing card moved where.

{% raw %}

```svelte
<button class="shuffle" on:click={shuffle}>Shuffle</button>

{#each cards as card (card)}
	<div
		class="card"
		style:background-image="url({getSpriteUrl(card)})"
		data-card={card}
	></div>
{/each}
```

{% endraw %}

But! If I add `animate:flip` to the individual DOM elements, they instead animate to their new position. Much nicer! It’s worth noting you do need to provide a `key` in your each loop — otherwise Svelte can’t tell which card moved where. See the Svelte tutorial on [keyed each blocks](https://learn.svelte.dev/tutorial/keyed-each-blocks) for more.

{% raw %}

```svelte
{#each selected as card (card)}
	<div
		animate:flip={{
			duration: 400
		}}
		class="card"
		style:background-image="url({getSpriteUrl(card)})"
		data-card={card}
	>
		<button class="select" on:click={() => deselect(card)}>Swap</button>
	</div>
{/each}
```

{% endraw %}

This is something you could implement in JavaScript, but you have to grab the DOM elements yourself and it gets a bit math-y, so it’s nice that Svelte makes it as simple as adding a single attribute.

But Svelte’s flip only works in individual each blocks. In this demo, you can also click a card to select it and move it to a separate row. If I want that transition to be animated, I need to reach for a different tool: the `crossfade` transition.

First we call `crossfade` to get the pair of transitions and then apply them to the elements in each row. We pass a unique key so Svelte knows that when we remove an element from the first block, it’s the same as the element we’re adding to the second block, and should be animated to its new position. In this case, the key is the card’s suit and rank, for example “10 hearts”.

{% raw %}

```svelte
<script lang="ts">
	import { flip } from 'svelte/animate';
	import { crossfade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	const [send, receive] = crossfade({
		duration: 500,
		easing: quintOut
	});

	// truncated for readability
	let cards, selected;
	function select(card) { }
	function deselect(card) { }
</script>

<div class="cards">
	{#each cards as card (card)}
		<div
			animate:flip={{
				duration: 400
			}}
			in:send={{ key: card }}
			out:receive={{ key: card }}
		>
			<button class="select" on:click={() => select(card)}>Swap</button>
		</div>
	{/each}
</div>

<div class="cards">
	{#each selected as card (card)}
		<div
			animate:flip={{
				duration: 400
			}}
			in:send={{ key: card }}
			out:receive={{ key: card }}
		>
			<button class="select" on:click={() => deselect(card)}>Swap</button>
		</div>
	{/each}
</div>
```

{% endraw %}

Once we apply the transition, swapping the card will animate it to its new position.

If you haven’t seen these before, go take a look at the [official Svelte tutorial](https://learn.svelte.dev/tutorial/animate) — they’re pretty fundamental bits of Svelte API, so I’m not going to dwell on the particulars much longer.

So Svelte’s FLIP and crossfade directives were [introduced in 2019](https://github.com/sveltejs/svelte/pull/2247). Are there more options for animating UI states on the web in 2023?

Well, yes. Let’s talk about the View Transitions API.

## The View Transitions API

The View Transitions API has been developed in Chrome [for a while now](https://developer.chrome.com/blog/spa-view-transitions-land/). You may have heard about it under its previous name, “Shared Element Transitions”. According to the [API explainer](https://developer.chrome.com/docs/web-platform/view-transitions/), it “makes it easy to change the DOM in a single step, while creating an animated transition between the two states.”

Up to this point in browser history, we had the tools to animate individual elements, but smoothly transitioning elements between two UI states was still a hard problem, and people often reached for libraries to solve it.

So, this API introduces a new document method: `startViewTransition`. When you call it, it will start a view transition and capture the current state of the page. Inside a callback passed to the function, you update the DOM somehow. Once you’re finished, it will capture the new state of the page, and then smoothly transition between the old and new states.

```js
function performTransition() {
  document.startViewTransition(async () => {
    await updateTheDomSomehow();
  });
}
```

By default, it will fade the old state out while fading the new state in, but you can customize the transition in CSS just like you would any CSS animation. In addition, this API also introduces a new `view-transition-name` CSS property — you’ll see how we use this in a bit.

I’m barely scratching the surface here, so check out the [official explainer](https://developer.chrome.com/docs/web-platform/view-transitions/) for a much more detailed rundown.

## Refactoring our code to use view transitions

Let’s look back at the demo we were working on before. How can we refactor this code to use `startViewTransition` instead of Svelte’s `animate:flip` and `crossfade` ? I’ve reverted back to before we added those functions, so we have a blank slate.

Let’s look at the shuffle functionality. To have shuffling trigger a view transition, we can wrap the actual state updates _inside of_ `startViewTransition`. The browser then needs to know when the DOM has finished updating. In Svelte, we can do that by awaiting the `tick` function.

```js
function shuffle() {
  document.startViewTransition(async () => {
    [cards, selected] = shuffleDecks(cards, selected);
    await tick();
  });
}
```

So with that, every time we shuffle, we have a transition happening - a fade. But that’s not quite what we want, is it?

This is because the browser only sees the old and new states — it doesn’t know whether a card moved somewhere or was replaced. Just like Svelte needed a key, so does the browser, which we can do by setting a `view-transition-name`.

```css
.card {
  view-transition-name: var(--name);
}
```

Since this tag needs to be unique, I like to use a CSS custom property to inject the dynamic part of the transition tag. We can set the prop in a style directive, and then use it in our CSS. Like before, I can use the name of the card, which is unique for this demo.

{% raw %}

```svelte
{#each selected as card (card)}
	<div
		class="card"
		style:--name="card-{card}"
	>
	</div>
{/each}
```

{% endraw %}

And with that, the cards animate during shuffle.

I want to pause for a moment to call out just how cool this is. We have elements dynamically moving to their new positions, and there’s no JavaScript code doing calculations to make this happen. We didn’t have to write it and neither did Svelte. The browser is figuring it out for us.

So, should you go out and yank all the `animate:flip` and `transition:crossfade` from your codebase in favor of this new browser API? Well, not necessarily. Each version has their pros and cons — let’s compare them.

## Comparing the two approaches

Let’s start with the pros of the view transition version:

- First, as I mentioned, the browser does all the heavy lifting
- You’re also able to use CSS to customize the animation, which is especially useful if you want to use media queries to target different device sizes or reduced motion preferences
- And because it’s CSS animation, you can easily debug the animations [using Chrome’s animation devtools](https://developer.chrome.com/docs/web-platform/view-transitions/#debugging-transitions)
- Also, there are no Svelte templating constraints — with animate:flip, you had to be in an each block. But the View Transitions API doesn’t care about that.
- This one probably isn’t significant enough to matter, but we do ship slightly less client-side JavaScript since we don’t need to include Svelte’s flip or crossfade code
- And because it’s a browser API, the knowledge is portable — you can’t use Svelte animations and transitions in other frameworks, but you can use view transitions.

On the other hand, it also comes with some cons.

It only works in Chrome, at least for now. While animation is a good progressive enhancement case — if this is broken, then your app should still work — losing this animation completely in non-Chrome browsers may be a dealbreaker. Hopefully, this won’t always be a con as the API is implemented by more browsers. Until then, make sure to check the API is supported before using it.

```js
function shuffle() {
  if (!document.startViewTransition) {
    [cards, selected] = shuffleDecks(cards, selected);
    return;
  }

  document.startViewTransition(async () => {
    [cards, selected] = shuffleDecks(cards, selected);
    await tick();
  });
}
```

And while we can use CSS to customize the animation, targeting the animation for multiple elements can get wordy. If we wanted to change the animation duration for all of the cards, we would need to write a selector for every transition tag we use.

```css
:root::view-transition-group(card-A♠),
:root::view-transition-group(card-2♠),
:root::view-transition-group(card-3♠),
:root::view-transition-group(card-4♠),
:root::view-transition-group(card-5♠)
/* and so on */ {
  animation-duration: 1s;
}
```

There’s [a proposal to solve this problem](https://github.com/w3c/csswg-drafts/issues/8319) by creating “classes” of transition groups, but that isn’t implemented right now.

Finally, we have to wrap every function that triggers a view transition in `document.startViewTransition`. So, If we want “swapping” a card to transition too, we also need to wrap it.

```js
function select(card: Card) {
  document.startViewTransition(async () => {
    [cards, selected] = moveCard(card, cards, selected);
    await tick();
  });
}
```

Svelte transitions are more declarative in that you can add them to the element directly, and any state affecting that element will trigger the animation.

So while view transitions are great, they’re not a drop-in replacement for the Svelte transitions you’re already familiar with. And they’re not meant to be! They solve similar problems in different ways, with different tradeoffs.

We didn’t even talk about animated page transitions — arguably _the_ headline feature of the View Transitions API, and something that is tricky to do with Svelte’s transitions today. Some of the cons I mentioned become much less relevant with the page transition use case — for example, for SvelteKit page transitions, you don’t have to wrap every link that should trigger a transition — you only have to wrap a single navigation lifecycle hook.

(Note: at time of recording, there is an [open SvelteKit PR](https://github.com/sveltejs/kit/pull/9605) that will make the view transitions integration much smoother by adding an `onNavigate` lifecycle hook.)

## Wrapping up

As much as we all love Svelte, it’s important to also know about the web platform’s APIs. There may come a point where Svelte is dead and gone, but the web platform is extremely backwards-compatible, and browser APIs and fundamentals are here to stay. There’s a good chance that view transitions will become an essential tool in your toolbelt for years to come, especially as they gain wider cross-browser adoption.

If you want to read more about Svelte and view transitions, head to my blog (Ed: you’re already here!), where I’ll have a written version of this talk as well as links to some further reading. I also recommend checking out [my post](/posts/page-transitions-1/) on creating animated page transitions in SvelteKit using the View Transitions API.

Thanks for your time, and enjoy the rest of the talks.

## Further reading

I barely scratched the surface with what's possible with view transitions, so check out these links to learn more:

- the official [view transitions explainer](https://developer.chrome.com/docs/web-platform/view-transitions/). I frequently come back to this, it is very in-depth and covers a lot of edge cases.
- my blog: [SvelteKit page transitions](/posts/page-transitions-1/) with the view transitions API
- my demos (viewable in Chrome only): [fruit list](https://sveltekit-shared-element-transitions-codelab.vercel.app/fruits), [Svelte Summit](https://http-203-svelte.vercel.app/), and [Star Wars](https://sw-demo-svelte-git-shared-element-transitions-geoffrich.vercel.app/). See my [view transition experiments](/posts/view-transition-experiments/) write-up for some explanation and links to the source
- and while it's not up-to-date with the breaking changes in the latest version of the API, I really enjoyed Maxi Ferreira's experiments with [view transitions and Astro](https://www.maxiferreira.com/blog/astro-page-transitions/)
