---
title: 'Page Transitions in SvelteKit with the View Transitions API'
date: '2022-09-19'
tags:
  - svelte
  - sveltekit
  - view transitions
socialImage: 'https://geoffrich.net/images/social/page-transitions-1.png'
metaDesc: 'Using a new browser API to create slick, animated page transitions.'
templateEngineOverride: njk,md
syndication:
  - https://twitter.com/geoffrich_/status/1572225315065036800
  - https://www.reddit.com/r/sveltejs/comments/xj9fd6/native_page_transitions_in_sveltekit_part_1_geoff/
---

<div class="callout">

This post was updated in February 2023 to handle breaking changes in the view transitions API (previously called shared element transitions), and in September 2023 with a new [SvelteKit lifecycle method](https://svelte.dev/blog/view-transitions) that streamlines the setup process.

</div>

Chrome now supports a new web API that will let you easily animate between two different pages, which is a long-desired feature in browsers.

I’ve been experimenting with how to use this new browser API in [SvelteKit](https://kit.svelte.dev). Today I want to show you what I’ve been doing and how it works. I’ll only scratch the surface of this stuff, and I highly recommend reading [the official API explainer](https://developer.chrome.com/docs/web-platform/view-transitions/) if you want to learn more. Today we'll focus on page transitions, but this API can also be used to animate [_any_ change in DOM state](https://twitter.com/geoffrich_/status/1625897774859587585).

This post is an adaptation of (a section of) [my talk](/posts/svelte-london-2022/) at the Svelte London meetup last month, though keep in mind that the talk version covers the old API, which has since gone through breaking changes.

Be advised that this API is only available in Chrome or Chromium-based browsers (e.g. Edge) at time of writing, though other browser vendors have expressed interest. It’s still very early, so it might not be ready for your production sites today. However, it _is_ a great candidate for progressive enhancement, since browsers that don't support the API can fall back to a regular navigation.

For the TL;DR, here’s the [repo](https://github.com/geoffrich/sveltekit-view-transitions) and the [deployed demo](https://sveltekit-shared-element-transitions-codelab.vercel.app/). Make sure to read the note above about browser requirements.

So: this new API, how does it work?

## How the API works

At a high level, here is what using the API looks like in a generic single-page app context:

```js
function spaNavigate(data) {
  document.startViewTransition(() => updateTheDOMSomehow(data));
}
```

When a single-page app navigation is about to take place, we call `document.startViewTransition()`, passing a callback that updates the DOM. This could involve adding or removing elements, changing CSS classes or styles, or whatever you like. Once the callback finishes, the browser will transition to the new page state &mdash; by default, it does a crossfade between the old and the new states.

Behind the scenes, the browser does something really clever. When the transition starts, it captures the current state of the page and takes a screenshot. It then holds that screenshot in place while the DOM is updating. Once the DOM has finished updating, it captures the new state, and animates between the two states.

We’ll get into more detail about how to interact with this API later in the post, but see the excellent [official explainer](https://developer.chrome.com/docs/web-platform/view-transitions/) for much more detail.

So, how do we get this to work in SvelteKit?

## Implementing in SvelteKit

For SvelteKit, we’ll write a `preparePageTransition` function that will set everything up for our page transitions. We’ll import that function in our root `+layout.svelte` so it affects the whole app.

```svelte
<script>
  import {preparePageTransition} from '$lib/page-transition';

  preparePageTransition();
</script>

<slot />
```

Here's what `preparePageTransition` looks like:

```js
import {onNavigate} from '$app/navigation';
export const preparePageTransition = () => {
  // before completing the navigation, start a new transition
  onNavigate(navigation => {
    if (!document.startViewTransition) return;

    return new Promise(resolve => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
};
```

Implementing this function used to be somewhat complicated, since there wasn't a good place in SvelteKit's lifecycle to start the view transition. [beforeNavigate](https://kit.svelte.dev/docs/modules#$app-navigation-beforenavigate) existed, but it ran _before_ any data fetching started, so a slow API call could force the user to wait multiple seconds for the transition to complete. SvelteKit 1.24 introduced [onNavigate](https://kit.svelte.dev/docs/modules#$app-navigation-onnavigate), which runs just before the navigation completes and is a perfect place to start a view transition.

For those interested, let’s walk through it line by line. If you want to skip to writing some page transitions, jump to [the next section](#heading-in-a-sveltekit-app).

```js
onNavigate(() => {
  // ...
});
```

This queues some code to run on every navigation, immediately before the new page is rendered. Importantly, it will run after any data loading for the page has completed – since starting a view transition prevents any interaction with the page, we want to start it as late as possible. See the [SvelteKit docs](https://kit.svelte.dev/docs/modules#$app-navigation-onnavigate) for more.

```js
if (!document.startViewTransition) return;
```

If the browser doesn’t support view transitions, we don’t perform a page transition.

```js
return new Promise(resolve => {
  document.startViewTransition(async () => {
    resolve();
    await navigation.complete;
  });
});
```

By returning a promise from `onNavigate`, we suspend the navigation until that promise resolves. This lets us wait to complete the navigation until the view transition has started. We use a [promise constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise) so that we can control when the promise resolves.

Inside the promise constructor, we start the view transition. Inside the view transition callback we resolve the promise we just returned, which indicates to SvelteKit that it should finish the navigation. It’s important that the navigation waits to finish until after we start the view transition – the browser needs to snapshot the old state so it can transition to the new state.

Finally, inside the view transition callback we wait for SvelteKit to finish the navigation by awaiting the provided `navigation.complete` promise. Once `navigation.complete` resolves, the new page has been loaded into the DOM and the browser can animate between the two states.

This isn’t that much code, and you won’t have to interact with it directly. From this point on, you can assume the page transition will happen and set up the page accordingly.

## In a SvelteKit App

Okay, let’s write some page transitions! If you want to follow along, clone the `initial` branch of [this repo](https://github.com/geoffrich/sveltekit-view-transitions/tree/initial), which is the demo we’ll be working off of today. It’s based off a [codelab](https://codelabs.developers.google.com/create-an-instant-and-seamless-web-app#5) from the Chrome team, which I re-wrote using SvelteKit. You’ll also need Chrome or another Chromium-based browser. This demo also happens to use Tailwind since the codelab I forked included it, though I took it out of the code samples in this post for brevity's sake.

For a preview of what we’re building, check out the [deployed demo](https://sveltekit-shared-element-transitions-codelab.vercel.app/) (again, only works in Chromium browsers).

This is a pretty simple app &mdash; it displays a list of fruits, and each fruit has its own page with nutrition facts about the fruit.

The first thing to do is to run our `preparePageTransition` function in our top level `+layout.svelte`. This will set up the navigation lifecycle hooks so that every navigation will trigger an animated page transition.

```svelte
<script>
	import '../app.css';
	import Navbar from '$lib/Navbar.svelte';
	import Footer from '$lib/Footer.svelte';
	import { preparePageTransition } from '$lib/page-transition';

	preparePageTransition();
</script>

<Navbar />
<main>
	<slot />
</main>
<Footer />
```

And just like that we have a nice crossfade effect, with no other changes to the app.

{% set videoTitle = "SvelteKit Page Transitions - Example 1" %}
{% set videoId = "lJSgKtDK4Ks" %}
{% include 'partials/components/youtube.njk' %}

Note that it also works when using the browser’s back and forward buttons.

(No, I'm not sure why the screen jiggles on every navigation.)

Now, one cool thing about this API is that a lot of it is customizable with regular CSS animation. To see how that’s possible, open the [animations tab in Chrome Devtools](https://developer.chrome.com/docs/devtools/css/animations/#get_started). Click the “pause” icon to pause the next animation and trigger a navigation. This will allow you to inspect the `::view-transition` pseudo elements created by the browser during the transition. You’ll find it at the top of the Elements inspector, right below the `<html>` element. It looks something like this:

```bash
::view-transition
└─ ::view-transition-group(root)
   └─ ::view-transition-image-pair(root)
      ├─ ::view-transition-old(root)
      └─ ::view-transition-new(root)
```

Remember how I said the browser takes a screenshot of the current and incoming states? Those pseudo-elements represent those screenshots. You can also see how the default crossfade is applied by inspecting the `old` and `new` elements. You’ll see something like the following CSS:

```css
html::view-transition-old() {
  animation-name: -ua-view-transition-fade-out;
  animation-duration: inherit;
  animation-fill-mode: inherit;
}

html::view-transition-new() {
  animation-name: -ua-view-transition-fade-in;
  animation-duration: inherit;
  animation-fill-mode: inherit;
}
```

The default crossfade animation is just a regular CSS animation! This means we can adjust those animations using our _own_ CSS. For instance, you can modify the duration of the transition by setting `animation-duration`. This will create a really slow fade.

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 3s;
}
```

Having access to all of CSS animation gives you a lot of power. In the API explainer, they also show [how to implement a sliding page transition](https://developer.chrome.com/docs/web-platform/view-transitions/#simple-customization) using only CSS. You can also use native CSS features like media queries to change the animation depending on screen size or other device characteristics.

However, my favorite aspect of this API uses a new CSS property: `view-transition-name`. With this property, we can animate an element on the old page to its next position on the old page. Let’s look at that next.

## Animating an element from one page to the next

Okay, now let's implement something a little more app-like. The fruit images on the list and the details pages are conceptually the _same element_. They just happen to be represented by different HTML elements and appear on different pages. To make that relationship clear, we could animate the image on the list page to the position of the image on the details page the user is navigating to. This is a little hard to explain in text, so skip to the end to watch a video of the final result if you want.

This is something that would've been tricky to do with current browser APIs, but the view transition API makes this possible. To do this, we need to add a `view-transition-name` to each element. The browser will animate elements with the same `view-transition-name` from their position on the old page to their position on the new page.

First, go to `src/lib/Icon.svelte`. This is the component with the fruit image on the list page. Add a CSS rule targeting the image.

```svelte
<script>
  export let src;
  export let name;
</script>

<div>
  <div>
    <img
      {src}
      width="80"
      style:height="80px"
      alt="picture of {name}"
    />
  </div>
</div>

<style>
  img {
    view-transition-name: fruit;
  }
</style>
```

We then can give the image in the details page component the same `view-transition-name`. Go to `/src/routes/fruits/[name]/+page.svelte` and target that `img` as well.

```svelte
<script>
	export let data;

	$: ({ name, image, amountPer, nutrition } = data);

	import Nutrition from '$lib/Nutrition.svelte';
</script>

<svelte:head>
	<title>Fruits - {name}</title>
</svelte:head>

<div>
	<div>
		<img
			src={image}
			width="240"
			style:height="240px"
			alt="picture of {name}"
		/>
		<h1>{name}</h1>
	</div>

	<div>
		<Nutrition {amountPer} {nutrition} />
	</div>
</div>

<style>
	img {
		view-transition-name: fruit;
	}
</style>
```

And that should be all you need to transition between the two! Except… this doesn’t work 😬 If you navigate between the two pages, you’ll see an error in the console:

```bash
Unexpected duplicate view-transition-name: fruit
```

This is because view transition names _need to be unique_. Since we applied the tag to the Icon component, every item in the list of fruits has the same view transition name, and the browser doesn’t know which element should be transitioned to its spot on the new page.

(This means this will actually work if we only have one element in the list. You can see this for yourself by commenting out all but one of the fruits in `src/routes/fruits/+page.server.js`.)

To fix this, we can give each element a tag based on the name of the fruit. So the apple will have `view-transition-name: fruit-apple`, the banana will have the tag `fruit-banana`, and so on. However, the fruit’s name is in the component state, and we can’t directly access it using CSS. We need to pass it through a CSS custom property first. First, we set the custom property on the element using a [style directive](/posts/style-directives/):

```html
<img style:--tag="fruit-{name}" />
```

We can then access this variable in CSS:

```html
<style>
  img {
    view-transition-name: var(--tag);
  }
</style>
```

If you make this change in both of the components, the transition will work! You can add tags to the text in each component so that transitions too.

```svelte
<script>
  // src/lib/ListItem.svelte
  export let item;
  export let href;

  import Icon from '$lib/Icon.svelte';
</script>

<li>
  <a {href}>
    <Icon src="{item.image}" name="{item.name}" />
    <div style:--tag="h-{item.name}">{item.name}</div>
  </a>
</li>

<style>
  div {
    view-transition-name: var(--tag);
  }
</style>
```

```svelte
<script>
	// src/routes/fruits/[name]/+page.svelte
	export let data;

	$: ({ name, image, amountPer, nutrition } = data);

	import Nutrition from '$lib/Nutrition.svelte';
</script>

<svelte:head>
	<title>Fruits - {name}</title>
</svelte:head>

<div>
	<div>
		<img
			src={image}
			width="240"
			style:height="240px"
			alt="picture of {name}"
			style:--tag="fruit-{name}"
		/>
		<h1 style:--tag="h-{name}">{name}</h1>
	</div>

	<div>
		<Nutrition {amountPer} {nutrition} />
	</div>
</div>

<style>
	h1,
	img {
		view-transition-name: var(--tag);
	}
</style>
```

Here’s what the final product looks like.

{% set videoTitle = "SvelteKit Page Transitions - Example 2" %}
{% set videoId = "kYpPuJWsOKU" %}
{% include 'partials/components/youtube.njk' %}

Now we have this slick transition and we had to write very little code &mdash; the browser does the heavy lifting!

You can reduce some of the duplication by adding a rule to the global styles that targets elements with the `--tag` variable set. In your `app.css`, write the following:

```css
/* Whenever the style attribute includes "--tag" */
[style*='--tag'] {
  view-transition-name: var(--tag);
}
```

Now any HTML element that includes `--tag` in its inline style will automatically apply a `view-transition-name` and you can remove the styles setting `view-transition-name` in each component.

We should also wrap this code in a [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) media query, so that the animations with a lot of motion only play for users who haven't requested reduced motion. The default crossfade doesn't involve motion, so we don't need to disable all animation. For more on reduced motion and view transitions, see [the explainer](https://developer.chrome.com/docs/web-platform/view-transitions/#reacting-to-the-reduced-motion-preference).

```css
/* Only do the FLIP-style animations when no reduced-motion preference */
@media (prefers-reduced-motion: no-preference) {
  [style*='--tag'] {
    view-transition-name: var(--tag);
  }
}
```

Here’s the final [repo](https://github.com/geoffrich/sveltekit-view-transitions) and [deployed demo](https://sveltekit-shared-element-transitions-codelab.vercel.app/).

## Wrapping up

I’m excited for this API and the features it will unlock, even though it will be a while before it becomes a spec and is implemented cross-browser.

However, that shouldn’t stop you from implementing page transitions in your app today. It’s possible to use Svelte’s built-in transitions to achieve a similar effect. Simple transitions can be accomplished using a `#key` block and the built-in fade and fly transitions. For more details, see this guide from [Josh Collinsworth](https://joshcollinsworth.com/blog/build-static-sveltekit-markdown-blog#implement-page-transitions). And for some other impressive examples, see these demos from [pngwn](https://github.com/pngwn/svelte-travel-transitions/) and [Bob Fanger](https://github.com/bfanger/page-transitions-in-svelte).

For some more examples of Svelte and the View Transition API, see [this post](/posts/view-transition-experiments/).

## Further reading

Note: some of these resources deal with the old shared-element-transition flavor of the API and are out of date. See the [Chrome explainer](https://developer.chrome.com/docs/web-platform/view-transitions/) or the [draft of the spec](https://github.com/WICG/view-transitions) for the most up-to-date information.

- [Google I/O talk](https://youtu.be/JCJUPJ_zDQ4)
- [Miriam Suzanne](https://www.oddbird.net/2022/06/29/shared-elements/)
- [Astro and the Shared Element Transition API](https://www.maxiferreira.com/blog/astro-page-transitions/)
- [Unlocking view transitions in SvelteKit 1.24](https://svelte.dev/blog/view-transitions)
