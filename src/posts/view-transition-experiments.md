---
title: 'View Transition Experiments with Svelte'
date: '2023-02-23'
tags:
  - svelte
  - sveltekit
  - view transitions
metaDesc: 'Adding animation to Svelte apps using an experimental browser API.'
templateEngineOverride: md
---

The [View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions/) (f.k.a. Shared Element Transitions) landed unflagged in [Chrome 111 Beta](https://developer.chrome.com/blog/chrome-111-beta/#view-transitions-api), so I figured it was time to return to some of my demos using the API in Svelte and SvelteKit!

If you’re not familiar with the API, the explainer linked above is well worth the read. tl;dr, it’s a browser API that “makes it easy to change the DOM in a single step, while creating an animated transition between the two states.”

## Replacing Svelte’s FLIP and crossfade transitions

Last year I created this [Star Wars demo](https://sw-demo-svelte.vercel.app/) to show off Svelte’s animation and transition capabilities. As an experiment, I ripped out all the Svelte animation code and replaced it with the View Transition API, and it worked quite well.

{% set videoTitle = "Star Wars View Transition Demo" %}
{% set videoId = "OKluqWvJIP0" %}
{% include 'partials/components/youtube.njk' %}

Here’s [the experimental branch](https://sw-demo-svelte-git-shared-element-transitions-geoffrich.vercel.app/) deployed to Vercel — it will only work if you use Chrome Canary or the latest Beta.

The implementation is slightly more complicated than the previous version using [animate:flip](https://svelte.dev/docs#run-time-svelte-animate-flip) and a [crossfade transition](https://svelte.dev/docs#run-time-svelte-transition-crossfade). Essentially, every state update is wrapped in a helper function that starts a view transition and waits for the state update to complete using [tick](https://svelte.dev/docs#run-time-svelte-tick).

For example, the “select movie” button looks something like this (note the wrapping `pageTransition` call):

```svelte
<IconButton
  on:click={() => pageTransition(() => select(movie.id))}
  label="select">{@html plus}</IconButton
>
```

Because multiple state updates can happen when a single piece of state is updated thanks to the power of reactive statements, the helper `pageTransition` function will only start one transition, but run all the different queued state updates before completing the transition.

The helper function uses [a bit of code](https://developer.chrome.com/docs/web-platform/view-transitions/#not-a-polyfill) from Jake Archibald to gracefully handle the API not being available (in which case, no animation will play).

The full `pageTransition` function looks like this:

```js
import {tick} from 'svelte';

let cbs = [];
let inProgress = false;

function clearCallbacks() {
  while (cbs.length > 0) {
    const cb = cbs.pop();
    cb();
  }
}

export function pageTransition(fn, shouldTransition = true) {
  // allows for easily toggling off the transition for certain state changes
  if (!shouldTransition) {
    fn();
    return;
  }
  cbs.push(fn);
  if (inProgress) {
    return;
  }
  inProgress = true;
  const t = transitionHelper({
    updateDOM: async () => {
      clearCallbacks();
      await tick();
      clearCallbacks(); // some callbacks may be queued in the middle of the transition, resolve those too
    }
  });

  t.finished.finally(() => {
    clearCallbacks();
    inProgress = false;
  });
}

// copied from Jake Archibald's explainer
function transitionHelper({skipTransition = false, classNames = [], updateDOM}) {
  if (skipTransition || !document.startViewTransition) {
    const updateCallbackDone = Promise.resolve(updateDOM()).then(() => {});

    return {
      ready: Promise.reject(Error('View transitions unsupported')),
      updateCallbackDone,
      finished: updateCallbackDone,
      skipTransition: () => {}
    };
  }

  document.documentElement.classList.add(...classNames);

  const transition = document.startViewTransition(updateDOM);

  transition.finished.finally(() =>
    document.documentElement.classList.remove(...classNames)
  );

  return transition;
}
```

If you want to take a closer look at the implementation, see the [experimental branch](https://github.com/geoffrich/star-wars-demo-svelte/tree/shared-element-transitions) on the repo.

## SvelteKit page transitions

When I was experimenting with this API last year, I put together two SvelteKit page transition demos that I presented at the [Svelte London](/posts/svelte-london-2022/) meetup. I only blogged one of them, a simple fruit list demo (which I over-confidently titled “Part 1”). The other, a SvelteKit site displaying various Svelte Summit talks that I based on [Jake Archibald’s demo](https://http203-playlist.netlify.app/), was mostly ready but never fully written up.

With the View Transitions API landing in Chrome Beta, I took the time to update these demos to the latest API, since there had been several breaking changes while the API was in an experimental state.

I’m pretty happy with how they both turned out — take a look (again, Chrome Canary or Beta only).

[Fruit demo](https://sveltekit-shared-element-transitions-codelab.vercel.app/fruits) [(source)](https://github.com/geoffrich/sveltekit-view-transitions)

{% set videoTitle = "Fruit List View Transition Demo" %}
{% set videoId = "kYpPuJWsOKU" %}
{% include 'partials/components/youtube.njk' %}

[Svelte Summit demo](https://http-203-svelte.vercel.app/) [(source)](https://github.com/geoffrich/http-203-svelte)

{% set videoTitle = "Svelte Summit View Transition Demo" %}
{% set videoId = "-GIO554D-6E" %}
{% include 'partials/components/youtube.njk' %}

For the full details of how the fruit list demo works, check out my [updated post](/posts/page-transitions-1/). The high level overview is that we set up some code in a [beforeNavigate](https://kit.svelte.dev/docs/modules#$app-navigation-beforenavigate) callback that starts the transition and resolves it once the navigation completes. We tell the browser which elements should transition together when changing pages by giving them the same [view transition name](https://developer.chrome.com/docs/web-platform/view-transitions/#transitioning-multiple-elements).

The Svelte Summit demo used a similar approach, but had more complex transitions and was a bit trickier (which is why I put off doing a full write-up!) I ran into a few issues where the transitions weren’t happening due to race conditions — the new state was being shown before the transition had a chance to start, so it couldn’t capture the original state.

For instance, I tried to show a back arrow in the header based on which page we were on. This was originally a `#if` block in the component looking at the current value of `$page.url`. However, this caused a race condition where the \$page store updated before the transition started, causing the back icon to disappear too soon.

Similarly, I had to change how I set view transition names on the video embed and thumbnail elements. Trying to do so via style directives was unpredictable, and sometimes the styles would be applied too late. Instead, I [set the style](https://github.com/geoffrich/http-203-svelte/blob/faf008d0b1c1914c8fcb6e5936c1f549a5647e21/src/lib/VideoList.svelte#L21-L62) on the transitioning DOM elements manually.

It’s unfortunate that we have to write our components in a less-idiomatic way, but the timing is tricky to get right.

But the worst race condition of the bunch was when I enabled SvelteKit’s [preloading](https://kit.svelte.dev/docs/link-options#data-sveltekit-preload-data). When I did that, the transitions would consistently break — SvelteKit was just changing the page too fast! And there’s no way to tell it to wait to navigate, since `beforeNavigate` is synchronous.

The only way I could fix it was manually cancelling the navigation and restarting it with `goto` so the transition had a chance to start. This has some unintended side effects if another listener is checking the navigation type, and also doesn’t work for history traversals (e.g. hitting the back button). It doesn’t work all the time, but it’s much more consistent than before.

```jsx
if (navigationType === 'link') {
  cancel();
  new Promise(res => setTimeout(res, 0)).then(() => goto(to?.url ?? ''));
}
```

Here’s [the code snippet](https://github.com/geoffrich/http-203-svelte/blob/faf008d0b1c1914c8fcb6e5936c1f549a5647e21/src/lib/page-transition.js#L133-L142) in context. I’m not happy with the workaround I found for this and want to find a better solution — maybe there’s a better API for SvelteKit to expose here?

Anyway, it was super fun to get back to these demos! I definitely spent a bit more time on them than expected. I love the effect and look forward to this API being implemented by other browsers (still TBD).
