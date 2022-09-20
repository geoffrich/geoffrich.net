---
title: 'Native Page Transitions in SvelteKit: Part 1'
date: '2022-09-19'
tags:
  - svelte
  - sveltekit
socialImage: 'https://geoffrich.net/images/social/page-transitions-1.png'
metaDesc: 'Taking the experimental shared element transition API for a spin.'
templateEngineOverride: njk,md
---

Chrome is currently experimenting with a new API that will let you easily animate between two different pages, which is a long-desired feature in browsers.

I’ve been experimenting with how to use this new browser API in [SvelteKit](https://kit.svelte.dev). Today I want to show you what I’ve been doing and how it works. I’ll only scratch the surface of this stuff, and I highly recommend reading [the official API explainer](https://developer.chrome.com/blog/shared-element-transitions-for-spas/) if you want to learn more. Today we'll focus on page transitions, but this API can also be used to animate [_any_ change in DOM state](https://twitter.com/geoffrich_/status/1571213474860236800).

This post is an adaptation of (a section of) [my talk](/posts/svelte-london-2022/) at the Svelte London meetup last month, so you can give that watch if you prefer video to text.

Be advised that this API is still very experimental and is only available behind the `chrome://flags/#document-transition` flag in the **latest version of Chrome**. It’s still very early in the process of becoming a web standard, so you shouldn’t rush out and use it on your production sites today. Everything I use in this post could change in the next year or even the next month. However, it’s still fun to play around with and figure out interesting ways to use it.

For the TL;DR, here’s the [repo](https://github.com/geoffrich/sveltekit-shared-element-transitions) and the [deployed demo](https://sveltekit-shared-element-transitions-codelab.vercel.app/). Make sure to read the note above about browser requirements. Also, the demo could break at any time if the API changes.

So: this new API, how does it work?

## How the API works

At a high level, here is what using the API looks like in a generic single-page app context:

```js
function spaNavigate(data) {
  const transition = document.createDocumentTransition();
  transition.start(() => updateTheDOMSomehow(data));
}
```

When a single-page app navigation is about to take place, we call `document.createDocumentTransition()` to create the page transition. We then start the transition with `transition.start`, passing a callback that updates the DOM. This could involve adding or removing elements, changing CSS classes or styles, or whatever you like. Once the callback finishes, the browser will transition to the new page state &mdash; by default, it does a crossfade between the old and the new states.

Behind the scenes, the browser does something really clever. When the transition starts, it captures the current state of the page and takes a screenshot. It then holds that screenshot in place while the DOM is updating. Once the DOM has finished updating, it captures the new state, and animates between the two states.

We’ll get into more detail about how to interact with this API later in the post, but see the excellent [official explainer](https://developer.chrome.com/blog/shared-element-transitions-for-spas/) for much more detail.

So, how do we translate this to code that will work in SvelteKit?

## Implementing in SvelteKit

For SvelteKit, we’ll write a `preparePageTransition` function that will set everything up for our page transitions. We’ll import that function in our root `+layout.svelte` so it affects the whole app.

```svelte
<script>
  import {preparePageTransition} from '$lib/page-transition';

  preparePageTransition();
</script>

<slot />
```

Here’s what `preparePageTransition` looks like:

```js
export const preparePageTransition = () => {
  const navigation = getNavigationStore();

  // before navigating, start a new transition
  beforeNavigate(() => {
    // Feature detection
    if (!document.createDocumentTransition) {
      return;
    }

    try {
      const transition = document.createDocumentTransition();
      // init before transition.start so the promise doesn't resolve early
      const navigationComplete = navigation.complete();
      transition.start(async () => {
        await navigationComplete;
      });
    } catch (e) {
      // without the catch, we could throw in beforeNavigate and prevent navigation
      console.error(e);
    }
  });
};
```

For those interested, let’s walk through it line by line. If you want to skip to writing some page transitions, jump to [the next section](#heading-in-a-sveltekit-app).

```js
const navigation = getNavigationStore();
```

Here we get the navigation store, which is a custom store that extends the built in `navigating` store from SvelteKit. This store adds a `complete` method that will allow us to know when navigation has finished. If you’re curious, [here’s the implementation](https://github.com/geoffrich/sveltekit-shared-element-transitions/blob/21f894b8e4339fb5e00801cc8e0feabe6ecdbaa5/src/lib/page-transition.js#L5-L33).

```js
beforeNavigate(() => {
  // ...
});
```

This queues some code to run before every navigation. See the [SvelteKit docs](https://kit.svelte.dev/docs/modules#$app-navigation-beforenavigate) for more.

```js
if (!document.createDocumentTransition) {
  return;
}
```

If the browser doesn’t support shared element transitions, we don’t perform a page transition.

(Previous iterations of this code also checked if the user had requested [reduced motion](/posts/svelte-prefers-reduced-motion-store/), though it appears that playing transitions when reduced motion is enabled will now be [opt-in](https://twitter.com/jaffathecake/status/1563087798680588290).)

```js
try {
  const transition = document.createDocumentTransition();
  // init before transition.start so the promise doesn't resolve early
  const navigationComplete = navigation.complete();
  transition.start(async () => {
    await navigationComplete;
  });
} catch (e) {
  // without the catch, we could throw in beforeNavigate and prevent navigation
  console.error(e);
}
```

This is the most important section, and parallels the pseudocode I showed earlier. We create and start the transition using the shared element transition APIs. Inside the callback passed to `start`, we wait for the navigation to complete using the custom navigation store. Once navigation has finished, the browser transitions between the two states.

We wrap the whole thing in a try/catch, since if the transition throws an error, we don’t want to prevent navigation and crash the app. The most frequent error I saw was trying to start a transition when one was already in progress. This would happen when navigating too quickly (e.g. spamming the back and forward buttons). By wrapping in a try/catch, we’ll still navigate to the new page, just without the animated transition.

This isn’t that much code, and you won’t have to interact with it directly. From this point on, you can assume the page transition will happen and set up the page accordingly.

## In a SvelteKit App

Okay, let’s write some page transitions! If you want to follow along, clone the `initial` branch of [this repo](https://github.com/geoffrich/sveltekit-shared-element-transitions/tree/initial), which is the demo we’ll be working off of today. It’s based off a [codelab](https://codelabs.developers.google.com/create-an-instant-and-seamless-web-app#5) from the Chrome team, which I re-wrote using SvelteKit. You’ll also need the latest Chrome with the `chrome://flags/#document-transition` flag enabled. This demo also happens to use Tailwind, since the codelab I forked included it, though I took it out of the code samples for brevity's sake.

For a preview of what we’re building, check out the [deployed demo](https://sveltekit-shared-element-transitions-codelab.vercel.app/) (again, only works in latest Chrome with a flag).

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

Now, one cool thing about this API is that a lot of it is customizable with regular CSS animation. To see how that’s possible, open the [animations tab in Chrome Devtools](https://developer.chrome.com/docs/devtools/css/animations/#get_started). Click the “pause” icon to pause the next animation and trigger a navigation. This will allow you to inspect the `::page-transition` pseudo elements created by the browser during the transition. You’ll find it at the top of the Elements inspector, right below the `<html>` element. It looks something like this:

```
::page-transition
└─ ::page-transition-container(root)
   └─ ::page-transition-image-wrapper(root)
      ├─ ::page-transition-outgoing-image(root)
      └─ ::page-transition-incoming-image(root)
```

Remember how I said the browser takes a screenshot of the current and incoming states? Those pseudo-elements represent those screenshots. You can also see how the default crossfade is applied by inspecting the `outgoing-image` and `incoming-image` elements. You’ll see the following CSS:

```
html::page-transition-outgoing-image() {
    animation: 0.25s ease 0s 1 normal both running blink-page-transition-fade-out;
}

html::page-transition-incoming-image() {
    animation: 0.25s ease 0s 1 normal both running blink-page-transition-fade-in;
}
```

The default crossfade animation is just a regular CSS animation! This means we can adjust those animations using our _own_ CSS. For instance, you can modify the duration of the transition by setting `animation-duration`. This will create a really slow fade.

```css
::page-transition-outgoing-image(root),
::page-transition-incoming-image(root) {
  animation-duration: 3s;
}
```

Having access to all of CSS animation gives you a lot of power. In the API explainer, they also show [how to implement a sliding page transition](https://developer.chrome.com/blog/shared-element-transitions-for-spas/#simple-customization) using only CSS. You can also use native CSS features like media queries to change the animation depending on screen size or other device characteristics.

However, my favorite aspect of this API uses a new CSS property: `page-transition-tag`. With this property, we can animate an element on the old page to its next position on the old page. Let’s look at that next.

## Animating an element from one page to the next

Okay, now let's implement something a little more app-like. The fruit images on the list and the details pages are conceptually the _same element_. They just happen to be represented by different HTML elements and appear on different pages. To make that relationship clear, we could animate the image on the list page to the position of the image on the details page the user is navigating to. This is a little hard to explain in text, so skip to the end to watch a video of the final interaction if you're more visual.

This is something that would've been tricky to do with current browser APIs. However, the shared element transition API makes this possible even though they’re different elements. To do this, we need to add a `page-transition-tag` to each element. The browser will animate elements with the same `page-transition-tag` from its position on the old page to its position on the new page.

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
    page-transition-tag: fruit;
    contain: paint;
  }
</style>
```

(Note that we also apply `contain: paint` to the element. The API requires the element with a page-transition-tag to have [paint containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Containment#paint_containment)).

We then can give the image in the details page component the same `page-transition-tag`. Go to `/src/routes/fruits/[name]/+page.svelte` and target that `img` as well.

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
		page-transition-tag: fruit;
		contain: paint;
	}
</style>
```

And that should be all you need to transition between the two! Except… this doesn’t work 😬 If you navigate between the two pages, you’ll see an error in the console:

```
Unexpected duplicate page transition tag: fruit
Uncaught (in promise) DOMException: Failed to execute 'start' on 'DocumentTransition': Capture failed: invalid element configuration.
```

This is because page transition tags _need to be unique_. Since we applied the tag to the Icon component, every item in the list of fruits has the same page transition tag, and the browser doesn’t know which element should be transitioned to its spot on the new page.

(This means this will actually work if we only have one element in the list. You can see this for yourself by commenting out all but one of the fruits in `src/routes/fruits/+page.server.js`.)

To fix this, we can give each element a tag based on the name of the fruit. So the apple will have `page-transition-tag: fruit-apple`, the banana will have the tag `fruit-banana`, and so on. However, the fruit’s name is in the component state, and we can’t directly access it using CSS. We need to pass it through a CSS custom property first. First, we set the custom property on the element using a [style directive](/posts/style-directives/):

```html
<img style:--tag="fruit-{name}" />
```

We can then access this variable in CSS:

```html
<style>
  img {
    page-transition-tag: var(--tag);
    contain: paint;
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
    contain: paint;
    page-transition-tag: var(--tag);
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
		page-transition-tag: var(--tag);
		contain: paint;
	}
</style>
```

Here’s what the final product looks like.

{% set videoTitle = "SvelteKit Page Transitions - Example 2" %}
{% set videoId = "kYpPuJWsOKU" %}
{% include 'partials/components/youtube.njk' %}

Now we have this slick transition and we had to write very little code &mdash; the browser does the heavy lifting!

You can reduce some of the duplication by adding a rule to the global styles targetting elements that set the `--tag` variable. In your `app.css`, write the following:

```css
/* Whenever the style attribute includes "--tag" */
[style*='--tag'] {
  contain: paint;
  page-transition-tag: var(--tag);
}
```

Now any HTML element that includes `--tag` in its inline style will automatically apply a `page-transition-tag` and you can remove the styles setting `page-transition-tag` in each component.

Here’s the final [repo](https://github.com/geoffrich/sveltekit-shared-element-transitions) and [deployed demo](https://sveltekit-shared-element-transitions-codelab.vercel.app/).

## One caveat

There is one caveat with this current integration with SvelteKit. Because starting a page transition makes the page non-interactive, you want it to resolve as quickly as possible. However, we currently start the transition in `beforeNavigate`, which runs _before_ any data fetching starts. If you have a slow API, the user could be waiting for multiple seconds with a frozen page, which is definitely non-ideal. This wasn’t an issue in this demo since all the data is local, but would become an issue in any application with dynamic data.

There is a [SvelteKit feature request](https://github.com/sveltejs/kit/issues/5689) to improve this by adding a lifecycle method that occurs after data loading has completed, so this could be a non-issue in the future.

## Wrapping up

I’m excited for this API and the features it will unlock, even though it will be a while before it becomes a spec and is implemented cross-browser.

However, that shouldn’t stop you from implementing page transitions in your app today. It’s possible to use Svelte’s built-in transitions to achieve a similar effect. Simple transitions can be accomplished using a `#key` block and the built-in fade and fly transitions. For more details, see this guide from [Josh Collinsworth](https://joshcollinsworth.com/blog/build-static-sveltekit-markdown-blog#implement-page-transitions). And for some other impressive examples, see these demos from [pngwn](https://github.com/pngwn/svelte-travel-transitions/) and [Bob Fanger](https://github.com/bfanger/page-transitions-in-svelte).

I’ll be following up this post with a write-up of another SvelteKit site I did with shared element transitions that will show off more advanced use-cases &mdash; stay tuned for that.

## Further reading

- [Chrome explainer](https://developer.chrome.com/blog/shared-element-transitions-for-spas/)
- [Google I/O talk](https://youtu.be/JCJUPJ_zDQ4)
- [WICG proposal](https://github.com/WICG/shared-element-transitions)
- [Miriam Suzanne](https://www.oddbird.net/2022/06/29/shared-elements/)
- [Astro and the Shared Element Transition API](https://www.maxiferreira.com/blog/astro-page-transitions/)
