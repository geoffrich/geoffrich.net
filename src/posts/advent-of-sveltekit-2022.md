---
title: 'Advent of SvelteKit 2022: My favorite demos'
date: '2023-01-18'
tags:
  - svelte
socialImage: 'TODO'
metaDesc: 'TODO'
---

- gift search bar
- christmas joke generator -- nice PE story
- christmas radio -- fun with audio, interesting PE story
- secret santa list -- forms forms forms + state in cookie
- recursive christmas tree -- slot stuff, random number generation

Themes to keep in mind

- **progressive enhancement:** where possible, solutions should use native functionality (`<a>` and `<form>`) and enhance when JavaScript is available
- **accessibility:** solutions should be accessible to as many as possible, no matter how they're navigating the web (no mouse, with a screen reader, etc.)
- **SSR-able:** because you can't progressively enhance without HTML to start with, all solutions should be server-rendered (either at build or request time). SvelteKit will give us this for (mostly) free.

major takeaways?

- you can get really far with forms and links. Clicking a button to toggle state? Why not make that a query param?
- "works w/o JS" fun challenge to myself

open props instead of tailwind

TODO should put images for each day

caveat: not production ready. throwaway demos (that I put a lot of time into)

## Day 1: Product search bar

**The challenge:** build a [debounced search bar](https://github.com/Advent-Of-Vue/2022-gift-search-bar) for products using a dummy API.

- we use a `<form>` so we get progressive enhancement. With JS unavailable, it will submit search via query params and reload the page. With JS available, it will update the results client-side without a full page refresh.
- something how by doing this it also forces us to separate data fetching logic from rendering logic.
- no `bind:value` - instead, we use an `<input name="q">` inside a form `<form>`. Submitting the form updates the URL and re-runs our load function, which passes the query param along to the external API. SK will automatically enhance `<form method="get">` like this, though I implemented a custom submit handler myself to 1) replace URL state (so each new query doesn't add a new history entry) and 2) keep focus on the search box. TODO: link feature request to make this easier. TODO: what does this mean for progressive enhancement?
- but with a form, how do we automatically load results? We can use `requestSubmit` (_not_ `submit`), which will behave the same as if the user clicked a submit button themselves. TODO: elaborate on differences with submit?
- this is also a perfect case for using `+page.js` over `+page.server.js` - we are calling a public external API. By putting it in the non-server `load` function, we can request it directly in the browser after initial hydration.
- declarative loading state: instead of toggling a boolean, use a reactive statement combined with SvelteKit's `navigating` store. We are loading results iff we are navigating to this same path (but maybe with different query parameters)

```js
$: isLoading = $navigating?.to?.url.pathname === $page.url.pathname;
```

- I also implemented pagination on the list. Combined with SK [preloading the data](https://kit.svelte.dev/docs/link-options#data-sveltekit-preload-data) for the next page on hover, navigating feel instant!

## Day 2: Christmas joke generator

**The challenge:** build a Christmas joke generator using [JokeAPI](https://v2.jokeapi.dev/)

- I was super happy with the progressive enhancement on the joke reveal here. I used a [details element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) for the "tell me!" button so that the joke was revealable without JS. To show the next joke, I used a form with only a submit button. This worked for the JS-less case, but I needed to call `goto` directly with `invalidateAll`, because otherwise SvelteKit won't do anything because you've already navigated to that page, same as clicking on a link to the same page (maybe a bug?).
- One problem with using the details element is there isn't a smooth transition when it expands. And I couldn't use Svelte transitions because everything was already in the DOM, and you can't animate height easily with just CSS. Instead, I adapted the approach from [this CSS-Tricks article](https://css-tricks.com/how-to-animate-the-details-element-using-waapi/) with [a Svelte action](https://github.com/geoffrich/advent-of-sveltekit-2022/tree/main/src/routes/day/2/animate.ts). So this is another enhancement: when we have JS, the details animates
- similar to the last one, we use `+page.ts` to load data so we can request it without passing through our server

## Day 11: Recursive Christmas lights

I didn't realize you could use a Svelte `<slot>` multiple times in the same component (and nested in `<svelte:self>`!), so this was a fun one.

It was also interesting getting random numbers to work with SSR...

The ChristmasLights component used `Math.random` to place the lights. But when server rendered, this will appear to "jump" since hydration will get a different value from `Math.random`.

The way to fix this is to use a seeded random number generator. But then a different problem:

how do we get a random seed? The solution I ended on:

- return `seed: new Date().getTime()` in the root +layout.server.ts
- then +layout.ts uses that seed to create a random number generator
- which is then accessible by all pages via `data.rng`

By doing this in the root layout, it will only run once, so we don't unnecessarily hit the server to get a new RNG seed on each navigation.

Then we just pass that function to the component to use instead of `Math.random`

Will probably expand this method into a blog post!

Anyway, here's the demo where you can see it in action. Note that you can refresh the page and the lights don't jump, because hydration uses the same random values.

Day 13 (ornaments) makes clever use of named slots and svelte:self to display alternating red and green ornaments, or just red ornaments by default.

Also related: [this blog post](/posts/svelte-tower-of-hanoi/) from last year where I solved the classic "Tower of Hanoi" problem only using Svelte's template syntax (and rely on svelte:self).

## Day 14: Secret santa list generator

**The challenge:** build an app that will let you add names to a list and pair everyone up for Secret Santa.

This was a perfect challenge to take SvelteKit [form actions](https://kit.svelte.dev/docs/form-actions) for a spin!

I went super hard on progressively-enhanced forms for this one.

The list of names is stringified and stored in a cookie so the server can access it.

Fun challenge!

⁃ schema validation and type safety via Zod with errors exposed to the UI via the form prop
⁃ prefilled fake data via @faker_js

⁃ extra animation polish with Svelte’s built-in FLIP and transitions
⁃ optimistic UI

Concurrent updates don’t work super well because the current state is sent with a cookie for every request, but still a fun POC.

## Day 15: Christmas radio

I used classic video game music for the audio.

This was the trickiest for me so far - since I didn't have a useMediaControls composable, I had to implement a lot from scratch (though Svelte's media bindings got me pretty far)

I just ran into a lot of strange issues, especially cross-browser:

- paused state not updating when tracks change
- not being able to adjust volume on iOS
- duration not being set correctly w/o "if browser"

Pretty happy with where it ended up though.

Works without JS

- next/prev buttons are form submit buttons
- each selectable song is a link
- fallback to `<audio controls autoplay>`

## And the rest

I'm not going to expand on every solution, since it's a lot of work and most folks wouldn't read it all anyway. So here's a list of the other demos &mdash; click on whatever you find interesting and let me know if you have questions! Each page has a link to my solution's source code and original challenge. All the solutions are in the advent-of-sveltekit-2022 repo [on my GitHub](https://github.com/geoffrich/advent-of-sveltekit-2022).

- a [tic-tac-toe game](https://advent-of-sveltekit-2022.vercel.app/day/0) (covered in a [previous post](/posts/tic-tac-toe/)). I was tempted to make this one work without JS like the SvelteKit Sverdle demo but didn't make time for it.
- a [countdown to Christmas](https://advent-of-sveltekit-2022.vercel.app/day/3). The tricky bit of this one was getting the remaining time to server-side-render properly. I also really like the "rolling" animation as each digit counts down (made possible with CSS grid and a [key block](https://svelte.dev/docs#template-syntax-key))
- a [gift label generator](https://advent-of-sveltekit-2022.vercel.app/day/5) and a [gift price comparer](https://advent-of-sveltekit-2022.vercel.app/day/6)
- [drag 'n' drop the presents](https://advent-of-sveltekit-2022.vercel.app/day/7) under the Christmas tree using the [HTML drag and drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- an internationalized [happy holidays message](https://advent-of-sveltekit-2022.vercel.app/day/8) using Ivan Hofer's [typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n) library. Ivan was kind enough to open [a PR](https://github.com/geoffrich/advent-of-sveltekit-2022/pull/1) against my repo with suggested improvements. Of special interest is the [WrapTranslation](https://github.com/geoffrich/advent-of-sveltekit-2022/tree/main/src/routes/day/8/WrapTranslation.svelte) component, which lets you replace a certain portion of a translation with HTML (similar to vue-i18n's [i18n-t](https://vue-i18n.intlify.dev/guide/advanced/component.html) element).
- [sorting presents](https://advent-of-sveltekit-2022.vercel.app/day/9) with some extra polish via `animate:flip`
- a [Secret santa challenge](https://advent-of-sveltekit-2022.vercel.app/day/10), where I give three clues and you have to guess who I am. I used [a SvelteKit form action](https://github.com/geoffrich/advent-of-sveltekit-2022/blob/main/src/routes/day/10/%2Bpage.server.ts) for the final submission and Zod for validating the input.
- a [gift puzzle visualization](https://advent-of-sveltekit-2022.vercel.app/day/12). This ended up being a visualization of the [Josephus problem](https://en.wikipedia.org/wiki/Josephus_problem) and my solution was wrong... oh well. One interesting thing about this solution is that I moved all the component logic into the `+page.ts` load function, so `+page.svelte` is a pure view layer that submits forms.
- a [renderless component](https://advent-of-sveltekit-2022.vercel.app/day/17) for calculating distance from the North Pole. The distance component doesn't render UI &mdash; it runs some logic and passes props to a slot. The consumer of the component can read those props and decide how to use them. This is another one that needs JS to run. While I could approximate location from IP address on the server, it seemed best to ask the user's permission for location data on the client first.

## Until next time?

## The site itself

Added a +layout.ts that loads the raw source code for Svelte components in the current route, so that I can display the code behind the solution on each page.

Thanks to Vite's import.meta.glob!

The source code itself is formatted using Prism + prism-svelte, and displayed in a nested layout that applies to `/day` (so it shows for each day's solution)

code samples on site don't have +page.server.ts code

animate:flip - maybe gif of the animation
