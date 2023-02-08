---
title: 'Advent of SvelteKit 2022: my favorite demos'
date: '2023-01-29'
tags:
  - svelte
  - sveltekit
socialImage: 'https://geoffrich.net/images/social/advent-of-sveltekit-2022.png'
metaDesc: 'Applying forms and progressive enhancement to daily holiday UI challenges.'
syndication:
  - https://twitter.com/geoffrich_/status/1620087348456464384
  - https://www.reddit.com/r/sveltejs/comments/10p5c5g/advent_of_sveltekit_2022_my_favorite_demos_geoff/
  - https://front-end.social/@geoffrich/109778941383700334
---

Throughout December (and part of January) I did [Advent of SvelteKit 2022](https://advent-of-sveltekit-2022.vercel.app/), where I took the [Advent of Vue](https://github.com/Advent-Of-Vue) challenges and did them in SvelteKit. Not satisfied with simply recreating the challenge in vanilla Svelte, I had a few extra goals for my solutions:

- **progressive enhancement:** where possible, solutions should use native functionality (`<a>` and `<form>`) so they work without JavaScript and enhance when JavaScript is available.
- **SSR-able:** because you can't progressively enhance without starting with HTML, all solutions should be server-rendered (either at build or request time). SvelteKit enables this by default.

Originally I thought I thought I'd write a post exhaustively recounting each demo. However...

1. that's a lot of writing
1. very few people would read the whole post
1. and honestly, not _every_ solution needs a detailed breakdown

So instead, I'm going to highlight my favorite 5 demos and link to the others at the end. In this post we'll show a few interesting techniques, including:

- progressively enhancing a search form that requests search results as the user types
- animating a details element open and closed with a Svelte action
- how to safely use random numbers in server-rendered Svelte components
- using recursion in Svelte components
- building a media player that works without JavaScript

One other minor change I made &mdash; the original solutions used Tailwind; I opted for [Open Props](https://open-props.style/) and Svelte's scoped styles instead.

(Caveat: while I put a lot of time (too much?) into these, at the end of the day they are one-off demos that may not be ready for production. While I did my best, I haven't fully vetted the performance or accessibility of these solutions.)

## Day 1: Product search bar

**The challenge:** build a [debounced search bar](https://advent-of-sveltekit-2022.vercel.app/day/1) for products using a dummy API.

<img src="/images/advent-of-sveltekit-2022/day-1.png" alt="Screenshot of the product search demo. It shows a text input labelled 'Query' with the text 'phone' inside. Four results are displayed in a bulleted list." title="The product search demo. Not a lot to look at, I know." style="width: 100%; max-width: 600px">

I used a `<form>` so that I could progressively enhance the experience. With JS unavailable, it will submit your search via query params and reload the page. With JS available, it will still set query params, but update the results client-side without a full page refresh.

Note that there's no `bind:value` in this solution, which would only work with JS. Instead, I used an `<input name="q">` inside a `<form>`. Submitting the form updates the URL and re-runs the load function, which passes the query param along to the external API. SvelteKit will [automatically enhance](https://kit.svelte.dev/docs/form-actions#get-vs-post) `<form method="get">` so that the page is updated client-side, though I implemented a custom submit handler myself to 1) replace URL state (so each new query doesn't add a new history entry) and 2) keep focus on the search box. There is an [open feature request](https://github.com/sveltejs/kit/issues/7895) to make customizing this easier.

But using a form, how do we automatically load results as the user types? I used a debounced [`requestSubmit`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit) (_not_ `submit`) call, which will behave the same as if the user clicked a submit button themselves. This is in contrast to the `submit` method, which will only submit the form &mdash; it won't run validation or custom submit handlers and will force a full-page reload. Make sure to check browser support before using this method. At time of writing, it was only [recently supported in Safari](https://caniuse.com/?search=requestsubmit) (16.0 and above), but a [polyfill](https://github.com/javan/form-request-submit-polyfill) exists.

```js
const debouncedSubmit = debounce(() => {
  // not supported in all browsers
  if (typeof HTMLFormElement.prototype.requestSubmit == 'function') {
    form.requestSubmit();
  }
}, 300);
```

This is also a perfect case for using `+page.js` over `+page.server.js`, since we are calling a public external API. By putting it in the [universal load function](https://kit.svelte.dev/docs/load#universal-vs-server) instead of the server load function, we can request the search results directly in the browser instead of passing the request through our app's server. Combined with SvelteKit [preloading the data](https://kit.svelte.dev/docs/link-options#data-sveltekit-preload-data) for the next page of results on hover, navigating feels instant!

I also implemented a declarative loading state: instead of toggling a boolean, I used a reactive statement checking the value of SvelteKit's `navigating` store.

```js
$: isLoading = $navigating?.to?.url.pathname === $page.url.pathname;
```

## Day 2: Christmas joke generator

**The challenge:** build a [Christmas joke generator](https://advent-of-sveltekit-2022.vercel.app/day/2) using the [JokeAPI](https://v2.jokeapi.dev/)

<img src="/images/advent-of-sveltekit-2022/day-2.png" alt="Screenshot of the joke generator demo. It shows the following joke: Why does Santa have three gardens? So he can 'ho ho ho'!" title="The joke generator demo. I'm using the term 'joke' loosely." style="width: 100%; max-width: 600px">

I was super happy with the progressive enhancement on the joke reveal here. I used a [details element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) for the "tell me!" button so that the joke was revealable without JS. To show the next joke, I used a form with only a submit button. This worked for the JS-less case, but I needed to call `goto` directly with `invalidateAll` when JS was available. Otherwise SvelteKit wouldn't do anything because you're navigating to a page you're already on (this could be a bug, I'm not certain.)

One problem with using the details element is there isn't a smooth transition when it expands. I couldn't use Svelte or CSS transitions either, since everything was already in the DOM and you can't animate height easily with just CSS. Instead, I adapted the approach from [this CSS-Tricks article](https://css-tricks.com/how-to-animate-the-details-element-using-waapi/) with [a Svelte action](https://github.com/geoffrich/advent-of-sveltekit-2022/tree/main/src/routes/day/2/animate.ts). This is another example of progressive enhancement: when we have JS, the details animates. Otherwise, the content make sense without it.

Similar to the last one, we use `+page.ts` to load data so we can request it without passing through our server.

<div class="callout">

Brief aside: while it's great that details/summary works without JS, it's not an accessible replacement [for all use cases](https://cloudfour.com/thinks/a-details-element-as-a-burger-menu-is-not-accessible/) where you need to hide/show content &mdash; sometimes you _need_ JS to make a control accessible.

</div>

Here's the full `+page.svelte` (minus styles):

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/stores';
	import type { PageData } from './$types';
	import Spinner from '$lib/Spinner.svelte';
	import animate from './animate';

	export let data: PageData;

	$: joke = data.joke;

	let open = false;

	async function handleSubmit(e: SubmitEvent) {
		const form = e.target as HTMLFormElement;
		await goto(form.action, { invalidateAll: true, replaceState: true });
		open = false; // close the summary
	}

	$: isLoading = $navigating?.to?.url.pathname === $page.url.pathname;
</script>

<h1>Christmas Joke Generator</h1>
<p class="setup">{joke.setup}</p>
<div class="wrapper">
	<details bind:open use:animate>
		<summary>Tell me!</summary>
		<div class="flex content">
			<p class="delivery">{joke.delivery}</p>
			<form on:submit|preventDefault={handleSubmit}>
				<button disabled={isLoading}
					>Another! 🎅
					{#if isLoading}<Spinner />{/if}</button
				>
			</form>
		</div>
	</details>
</div>
```

## Day 11: Recursive Christmas lights

**The challenge:** create a [lit Christmas tree](https://advent-of-sveltekit-2022.vercel.app/day/11) using recursive components

<img src="/images/advent-of-sveltekit-2022/day-3.png" alt="Screenshot of the Christmas lights demo. It shows a 7-layer Christmas tree made out of overlapping circles. Small yellow circles are also on the tree, representing Christmas lights." title="The Christmas lights demo. It just about convinces you that you're looking at a real tree." style="width: 100%; max-width: 600px">

This was an interesting way to use [`svelte:self`](https://svelte.dev/docs#svelte_self), which otherwise doesn't come up very often. The `<ChristmasTree>` component recursively renders itself, similar to how a recursive function calls itself.

{% raw %}

```svelte
<!-- +page.svelte -->
<ChristmasTree size={7}>
  <ChristmasLights random={data.rng} />
  <ChristmasLights random={data.rng} />
</ChristmasTree>

<!-- ChristmasTree.svelte -->
<script lang="ts">
	import { fade } from 'svelte/transition';
	export let size = 1;
</script>

{#if size > 1}
	<svelte:self size={size - 1}>
		<slot />
	</svelte:self>
{/if}
<div class="tree" in:fade={{ delay: size * 100 }}>
	{#each { length: size } as _}
		<div class="leaf">
			<slot />
		</div>
	{/each}
</div>
```

{% endraw %}

Each of the `<ChristmasLights>` components randomly place a single light. I was surprised to see that not only could you use a Svelte `<slot>` multiple times in the same component, each occurrence of the slot has a unique instance of the slotted component. Even though I passed two Christmas light components into the tree's slot, there are more than two Christmas lights being rendered, and all have their own state. If this weren't true, each light would be in the same spot on each leaf, which is clearly not the case.

Another interesting challenge was getting random numbers to work with SSR. In purely-client-side Svelte, you can use `Math.random` without any consequences. However, with server-rendered Svelte, your component code runs twice: once on the server, and once during hydration. The second time your component code runs, the random number will be different and your UI will appear to "jump" to the new position. I ran into this issue with the lights, which used `Math.random` to place themselves randomly.

The way to fix this is to use a [seeded random number generator](https://github.com/davidbau/seedrandom), which given the same seed value, will generate the same list of random numbers. But then we run into a different problem: how do we generate a random seed? We could hard-code one, but then there would be no randomness &mdash; the lights would be placed in the same random position on every page load.

The solution I landed on could be a blog post by itself, but in short:

- generate a seed based on the current date in the root `+layout.server.ts`. By doing this in the root layout, it will only run once, so we don't unnecessarily hit the server to get a new RNG seed on each navigation. We need to do this in the server layout since `+layout.ts` will run again during hydration.
- then, `+layout.ts` uses that seed to create a random number generator (RNG). Any page can access this RNG via the `data` prop

```js
import type {LayoutLoad} from './$types';
import seedrandom from 'seedrandom';

export const load: LayoutLoad = ({data}) => {
  return {
    // expose random number generator to be used in Day 11
    // we generate the seed on the server because the universal load runs twice
    rng: seedrandom(data.seed.toString())
  };
};
```

Now that we have a seeded RNG, we can pass that function to the `<ChristmasLights>` component to use instead of `Math.random`. You can tell that it's working by refreshing the demo page and seeing that the christmas lights stay where they are without jumping. Because the server- and client-render use the same seed, the component code generates the same random values.

This challenge was part 2 of a series of Christmas-tree-focused challenges that built on one another. The first was [just the tree](https://advent-of-sveltekit-2022.vercel.app/day/4) (no lights), and [the third part](https://advent-of-sveltekit-2022.vercel.app/day/13) added ornaments.

<div class="callout">

For more on svelte:self, see [this blog post](/posts/svelte-tower-of-hanoi/) from a couple years back where I solved the classic "Tower of Hanoi" problem only using Svelte's template syntax.

</div>

## Day 14: Secret santa list generator

**The challenge:** build an app that will let you add names to a list and pair everyone up for [Secret Santa](https://advent-of-sveltekit-2022.vercel.app/day/14).

<img src="/images/advent-of-sveltekit-2022/day-14a.png" alt="Screenshot of the Secret Santa demo. It shows a form where you can enter Name and Email. Two names are displayed under the form: Kevin McCallister and John McClane. Each name has a delete button next to it." title="The Secret Santa entry form. I think purple's a very Christmassy color, don't you?" style="width: 100%; max-width: 600px">

<img src="/images/advent-of-sveltekit-2022/day-14b.png" alt="Screenshot of the Secret Santa demo. It shows a list of 5 Secret Santa matches, e.g. Kevin McCallister is the Secret Santa of John McClane. There are two buttons below the matches: Shuffle and Go back." title="The Secret Santa matches. I wouldn't want the Grinch to be my Secret Santa, but maybe that's just me." style="width: 100%; max-width: 600px">

This was a perfect challenge to take SvelteKit [form actions](https://kit.svelte.dev/docs/form-actions) for a spin! Pretty much every button on here triggers a progressively-enhanced form submission. The [server code](https://github.com/geoffrich/advent-of-sveltekit-2022/blob/main/src/routes/day/14/%2Bpage.server.ts) doesn't show on the demo page, so head over to GitHub if you're curious about the implementation.

The list of names is stringified and stored in a cookie so the server can access it. This was good enough for a POC where I didn't want to figure out a data layer, but it did cause some issues with concurrent updates. This is because the list of names is sent in a cookie with each request, so it doesn't get updated as other requests complete and it's possible to return stale data.

Typing in names again and again when testing got old quickly, so I added a "pre-fill" button powered by [Faker](https://fakerjs.dev/).

This was also my first time taking [Zod](https://github.com/colinhacks/zod) for a spin, which was very nice for parsing and validating the data in the cookie. Any Zod validation errors were caught and returned for the UI to render.

I also added some extra animation polish as elements were added and removed with Svelte's built-in FLIP animation and transitions. It's nice that this is only an extra line or two in Svelte instead of needing to reach for a separate library.

## Day 15: Christmas radio

**The challenge:** build a [media player](https://advent-of-sveltekit-2022.vercel.app/day/15) with a list of Christmas-themed tracks

<img src="/images/advent-of-sveltekit-2022/day-15.png" alt="Screenshot of the Christmas radio demo. Five tracks are shown: Snow Mountain, In a Snow-Bound Land, Snowman, Snowpoint City, and Snowhead Temple. Below the list of tracks are audio player controls." title="The Christmas radio demo. Of these, Snow Mountain is probably the most holiday-like song. Snowhead Temple shouldn't be on anyone's Christmas playlist." style="width: 100%; max-width: 600px">

Instead of the stock audio tracks in the original challenge, I used snow-themed video game music songs.

This was slightly more challenging than the Vue version, since I didn't have [useMediaControls](https://vueuse.org/core/usemediacontrols/) and had to implement a lot from scratch (though Svelte's [media bindings](https://svelte.dev/docs#template-syntax-element-directives-bind-property-media-element-bindings) got me pretty far.) There were a lot of weird issues I ran into when running this demo on different browsers. For example:

- the audio element's `paused` binding got out-of-sync when the `src` changed
- you can't set [media volume](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volume) on iOS. Per MDN: "volume returns a value and is writable; however, the value is always 1, and setting a value has no effect on the volume of the media object."
- duration was not being set correctly when the audio element was rendered on the server

For all my hacky workarounds, see [Controls.svelte](https://github.com/geoffrich/advent-of-sveltekit-2022/blob/main/src/routes/day/15/Controls.svelte). I'm pretty happy with where it ended up though.

Initially, I didn't make this work without JS (partly because of all the trouble I had working with audio elements). But the people on Twitter (well, one person) requested it and I couldn't stop thinking about it, so I got something working:

- the next/previous controls are form submit buttons that set the `current` query parameter. This is used to set the current track when the page loads.
- each selectable song is a link that also sets the current track (though in hindsight, I think using a button here may have been more accessible)
- buttons that only work when JS is enabled (e.g. fast-forward/rewind) are hidden when JS is disabled (detected via an inline script at the top of the body)
- and if JS is disabled, I rendered an `<audio controls autoplay>` element so that the audio element can be interacted with using the browser controls

The experience is much better with JS enabled, but it works.

## And the rest

Here's a list of the other demos &mdash; click on whatever you find interesting and let me know if you have questions! Each page has a link to my solution's source code and original challenge. All the solutions are in the [advent-of-sveltekit-2022 repo](https://github.com/geoffrich/advent-of-sveltekit-2022) on my GitHub.

- a [tic-tac-toe game](https://advent-of-sveltekit-2022.vercel.app/day/0), which I covered in a [previous post](/posts/tic-tac-toe/). I was tempted to make this one work without JS like the SvelteKit Sverdle demo but didn't make time for it.
- a [countdown to Christmas](https://advent-of-sveltekit-2022.vercel.app/day/3). The tricky bit of this one was getting the remaining time to server-side-render properly. I also really like the "rolling" animation as each digit counts down (made possible with CSS grid and a [key block](https://svelte.dev/docs#template-syntax-key))
- a [gift label generator](https://advent-of-sveltekit-2022.vercel.app/day/5) and a [gift price comparer](https://advent-of-sveltekit-2022.vercel.app/day/6)
- [drag 'n' drop the presents](https://advent-of-sveltekit-2022.vercel.app/day/7) under the Christmas tree using the [HTML drag and drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- an internationalized [happy holidays message](https://advent-of-sveltekit-2022.vercel.app/day/8) using Ivan Hofer's [typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n) library as an alternative to vue-i18n. Ivan was kind enough to open [a PR](https://github.com/geoffrich/advent-of-sveltekit-2022/pull/1) against my repo with suggested improvements. Of special interest is the [WrapTranslation](https://github.com/geoffrich/advent-of-sveltekit-2022/tree/main/src/routes/day/8/WrapTranslation.svelte) component I came up with, which lets you replace a certain portion of a translation with HTML (similar to vue-i18n's [i18n-t](https://vue-i18n.intlify.dev/guide/advanced/component.html) element).
- [sorting presents](https://advent-of-sveltekit-2022.vercel.app/day/9) with some extra polish via `animate:flip`
- a [Secret santa challenge](https://advent-of-sveltekit-2022.vercel.app/day/10), where I give three clues and you have to guess who I am. I used [a SvelteKit form action](https://github.com/geoffrich/advent-of-sveltekit-2022/blob/main/src/routes/day/10/%2Bpage.server.ts) for the final submission and Zod for validating the input.
- a [gift puzzle visualization](https://advent-of-sveltekit-2022.vercel.app/day/12). This ended up being a visualization of the [Josephus problem](https://en.wikipedia.org/wiki/Josephus_problem) and my solution was wrong... oh well. One interesting thing about this solution is that I moved all the component logic into the `+page.ts` load function, so `+page.svelte` is a pure view layer that submits forms.
- a [renderless component](https://advent-of-sveltekit-2022.vercel.app/day/17) for calculating distance from the North Pole. The distance component doesn't render UI &mdash; it runs some logic and passes props to a slot. The consumer of the component can read those props and decide how to use them. This is another one that needs JS to run. While I could approximate location from IP address on the server, it seemed best to ask the user's permission for location data on the client first.

## The site itself

I also had a fun time adding features to the site that hosted my solutions. For instance, I added `animate:flip` to the navigation above each challenge for that extra bit of polish.

I also implemented a custom layout load function that loads the raw source code for Svelte components in the current route (using Vite's [`import.meta.glob`](https://vitejs.dev/guide/features.html#glob-import)), so that I can display the code behind the solution on each page. I wasn't able to load the `+page.server.ts` code (since SvelteKit blocks you from importing server code on the client), but all of the other code is formatted using Prism and prism-svelte and shown under each solution.

```ts
// src/routes/day/+layout.ts
import type { LayoutLoad } from './$types';

const globs = import.meta.glob([`./**/*.{svelte,js,ts}`, '!**/*.server.{js,ts}'], { as: 'raw' });

export const load: LayoutLoad = async ({ url, route }) => {
	const segments = route.id?.split('/');
	const day = segments?.[2];

	let code: { filename: string; source: string }[] = [];
	const modules = Object.entries(globs)
		.filter(([k, v]) => k.startsWith(`./${day}/`) && !k.includes('.server'))
		.map(([k, v]) =>
			v().then((result) => {
				const segments = k.split('/');
				return { filename: segments.slice(2).join('/'), source: result };
			})
		);
	code = await Promise.all(modules);

	return {
		day: +day,
		code
	};
};

// this is then accessible via data.code in the +layout.svelte
```

## Wrapping up

I had a ton of fun with these challenges and I'll definitely continue to use forms and progressive enhancement techniques in my other work. In fact, my [previous post](/posts/marvel-filter-state/) details how I applied some of the lessons I learned here to a search form in one of my side projects.

Also, I'm not the only one who tackled the Advent of Vue challenges in Svelte &mdash; check out [Paolo Ricciuti](https://twitter.com/search?q=from%3Apaoloricciuti%20adventofvue&src=typed_query) and [Antonio Sarcevic](https://twitter.com/search?q=from%3ASarcevicAntonio%20advent%20of%20vue&src=typed_query&f=top) for alternate implementations. And if you also did them, let me know and I'll link you too!
