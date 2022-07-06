---
title: Some assorted Svelte demos
date: '2022-07-06'
tags:
  - svelte
socialImage: 'https://geoffrich.net/images/social/assorted-svelte-demos.png'
metaDesc: 'Conditional wrappers, native page transitions, an action to detect focus leaving, and a recursive action.'
---

Over the past couple months I’ve been posting some Svelte demos to Twitter. I’ve been meaning to turn some of them into full blog posts, but I’ve been quite busy so that hasn’t happened yet.

Since Twitter is ephemeral, I wanted to write a quick post capturing these demos for future reference. No in-depth explanations here&mdash;I’ll be keeping it pretty short. However, some of these might be given a full write-up in the future.

## Using svelte:element to create a reusable wrapper

[Original tweet](https://twitter.com/geoffrich_/status/1525167882396569601)

[svelte:element](https://svelte.dev/docs#template-syntax-svelte-element) was released in Svelte 3.47.0, which allows you to dynamically render a given HTML tag. See the [official tutorial section](https://svelte.dev/tutorial/svelte-element) for more details. I used it to create a custom `<Wrapper>` component that can conditionally wrap its children.

```svelte
<script>
  export let tag = 'div';
  export let wrap = false;
</script>

{#if wrap}
<svelte:element this="{tag}" {...$$restProps}>
  <slot></slot>
</svelte:element>
{:else}
<slot></slot>
{/if}
```

And it can be used like so:

```svelte
<Wrapper tag="details" {wrap}>
  <summary>Yar 🦜 🏴‍☠️</summary>
  <p>
    Prow scuttle parrel provost Sail ho shrouds spirits boom mizzenmast yardarm. Pinnace
    holystone mizzenmast quarter crow's nest nipperkin grog yardarm hempen halter furl.
    Swab barque interloper chantey doubloon starboard grog black jack gangway rutters.
  </p>
  <p>
    Deadlights jack lad schooner scallywag dance the hempen jig carouser broadside cable
    strike colors. Bring a spring upon her cable holystone blow the man down spanker
    Shiver me timbers to go on account lookout wherry doubloon chase. Belay yo-ho-ho
    keelhaul squiffy black spot yardarm spyglass sheet transom heave to.
  </p>
</Wrapper>
```

Without this component, you’d have to introduce some significant duplication.

```svelte
{#if wrap}
<details>
  <summary>Yar 🦜 🏴‍☠️</summary>
  <p>
    Prow scuttle parrel provost Sail ho shrouds spirits boom mizzenmast yardarm. Pinnace
    holystone mizzenmast quarter crow's nest nipperkin grog yardarm hempen halter furl.
    Swab barque interloper chantey doubloon starboard grog black jack gangway rutters.
  </p>
</details>
{:else}
<summary>Yar 🦜 🏴‍☠️</summary>
<p>
  Prow scuttle parrel provost Sail ho shrouds spirits boom mizzenmast yardarm. Pinnace
  holystone mizzenmast quarter crow's nest nipperkin grog yardarm hempen halter furl. Swab
  barque interloper chantey doubloon starboard grog black jack gangway rutters.
</p>
{/if}
```

(For the purposes of this demo, I rendered a summary element even when there’s no details. This is not actually valid HTML &mdash; you’d probably want to swap it out for an h2 or something when there’s no details.)

There's a [full demo](https://svelte.dev/repl/983851f4fb7044e8b5d66a53ca0b356b?version=3.48.0) in the REPL with some more examples.

## Native page transitions in SvelteKit

[Original tweet](https://twitter.com/geoffrich_/status/1534980702785003520)

I took the experimental page transition API (a.k.a. [shared element transitions](https://github.com/WICG/shared-element-transitions)) for a test drive with SvelteKit, and the result was pretty slick. You’ll need Chrome Canary with the `chrome://flags/#document-transition` flag enabled if you want to try this one out yourself &mdash; the original tweet has a video if you don’t want to jump through those hoops. There’s a [live demo](https://sveltekit-shared-element-transitions-codelab.vercel.app/fruits) and a [GitHub repo](https://github.com/geoffrich/sveltekit-shared-element-transitions) if you want to see how it was accomplished.

I was able to implement it using SvelteKit’s `beforeNavigate` and `afterNavigate` hooks in a top-level \_\_layout. It started out as a port of the [shared element transitions Codelab](https://codelabs.developers.google.com/create-an-instant-and-seamless-web-app#5) but I added some extra features:

- transitions to and from the list page (the original only transitioned to the details page, not from it)
- transitions when the browser back & forward buttons are clicked
- respects reduced motion by not playing the transitions when requested

I came back to this recently and [refactored it](https://github.com/geoffrich/sveltekit-shared-element-transitions/commit/7de6f37bd07f9dd69af2e0bb59e4285f879d2143) to use a custom navigation store that made the logic a lot easier to follow.

This one will likely get a full write-up sooner rather than later, since I’ll be presenting it at a meetup in a couple weeks.

## Action to detect when focus leaves an element

[Original tweet](https://twitter.com/geoffrich_/status/1537125628327038976)

I was working on accessibility improvements to the new [learn.svelte.dev](https://learn.svelte.dev) site and needed to automatically close a pop-up menu when a user tabbed out of it. Otherwise, the user’s focus would move behind the menu and they couldn’t see where they are on the page. I ended up implementing it as an action. Here’s what it looks like:

```js
function handleFocusLeave(node, cb) {
  function handleFocusIn() {
    if (!node.contains(document.activeElement)) {
      cb();
    }
  }
  document.addEventListener('focusin', handleFocusIn);

  return {
    destroy: () => {
      document.removeEventListener('focusin', handleFocusIn);
    }
  };
}
```

To see it in action, see [the demo in the Svelte REPL](https://svelte.dev/repl/77100d6479594811a833eff2315dd1f4?version=3.48.0) or interact with the tutorial menu on [learn.svelte.dev](https://learn.svelte.dev).

This was inspired by a similar approach from Andy Bell in a [tutorial on building a burger menu](https://piccalil.li/tutorial/build-a-fully-responsive-progressively-enhanced-burger-menu/#:~:text=The%20next%20part%20is%20an,force%20the%20menu%20closed%2C%20immediately.).

## Recursive Svelte action

[Original tweet](https://twitter.com/geoffrich_/status/1542176620303118336)

Normally, you apply Svelte actions to single HTML elements with `use:action`. But what if you want to apply the same action to a root node and all of its children? You could manually apply the action to each node, or you could write a higher-order action that recursively does this for you. I was able to implement this using a single action and a MutationObserver to track updates. Here’s what it looks like:

```js
function recurse(node, {action, params}) {
  const observed = new Map();
  const act = node => action(node, params);

  function filterForElements(arr) {
    return Array.from(arr).filter(x => x.nodeType === Node.ELEMENT_NODE);
  }

  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(mutation => {
      handleAdditions(mutation.addedNodes);
      handleRemovals(mutation.removedNodes);
    });
  });

  function handleAdditions(addedNodes) {
    for (const node of filterForElements(addedNodes)) {
      const cleanup = act(node);
      observed.set(node, cleanup);
    }
  }

  function handleRemovals(removedNodes) {
    for (const node of filterForElements(removedNodes)) {
      const cleanup = observed.get(node);
      cleanup?.destroy?.();
      observed.delete(node);
    }
  }

  observer.observe(node, {childList: true, subtree: true});

  const nodes = [node];
  while (nodes.length > 0) {
    const next = nodes.pop();
    const cleanup = act(next);
    observed.set(next, cleanup);
    nodes.push(...next.children);
  }

  return {
    update: ({params: newParams}) => {
      params = newParams;
      for (const [key, value] of observed) {
        value?.update(params);
      }
    }
  };
}
```

See the [Svelte REPL](https://svelte.dev/repl/b7c95fd6876d4d7382777fa6d1a31117?version=3.48.0) for an example of it in action. The demo is a little contrived &mdash; I’m still not entirely sure how this would be useful. I just thought it was a neat idea and had to get it out of my head.
