---
title: Detecting sticky positioning with Svelte actions
date: '2020-11-04'
tags:
  - svelte
  - html
  - css
  - js
templateEngineOverride: md
---

TODO:

- Link to REPL
- REPL height on mobile devices
- GIF a11y
- Check for inclusive language w/ 11ty plugin
- Only include REPL script on this page
- iframe not going into mobile mode
- link to Twitter thread (time to update username)
- should I host my profile image on Twitter?

<button 
  class="[ button ] [ font-base text-base weight-bold ]" 
  data-repl="https://svelte.dev/repl/4ad71e00c86c47d29806e17f09ff0869?version=3">
Load REPL
</button>

## What do we want to do?

- detect when a position: sticky element is currently stuck
- handle when the element is stuck to the top or to the bottom

## What is position: sticky?

- for the basic case, you don't need any fancy javascript

### Why is :stuck not built in already?

- infinite loops
- be careful with changing size of sticky element when stuck -- could result in screen jitters

## What is a Svelte action?

### Why use a Svelte action?

- reusability
- puts the imperative code in one place

## General approach

- Add top and bottom "sentinel" divs to detect when an element becomes stuck
- Observe using intersection observer
  - If the top sentinel exits the viewport, then a top position: sticky element is currently stuck
  - If the bottom sentinel exits the viewport, then a bottom position: sticky element is currently stuck
  - gif goes here
  - In vanilla JS you might toggle a class or attribute on the element when this happens. Since Svelte automically scopes styles, it would be hard to target this since Svelte would think the styles are "unused". Also, devs new to the code might not know where that attribute/class is set. Instead, we'll execute a callback passed to the Svelte action.

## Writing the action

### Set up action

```js
// sticky.js
export default function sticky(node, {callback, stickToTop}) {
  // do stuff
  return {
    update() {},
    destroy() {}
  };
}
```

- Basic action format
- Action takes a node (the node `use:` is on) and an (optional) object of parameters
- Two parameters: callback (executed when stickiness changes) and stickToTop (whether the node will be stuck to the top or bottom)

Used like so:

```svelte
<h2
  class="sticky"
  use:sticky={{ callback: stickyCallback, stickToTop: true }}>
  I use position: sticky!
</h2>
```

### Create and observe sentinel elements

Inside our `sticky` function, we add sentinel divs to the top and bottom of the parent

```js
const stickySentinelTop = document.createElement('div');
stickySentinelTop.classList.add('stickySentinelTop');
node.parentNode.prepend(stickySentinelTop);

const stickySentinelBottom = document.createElement('div');
stickySentinelBottom.classList.add('stickySentinelBottom');
node.parentNode.append(stickySentinelBottom);
```

I add classes to make it clear what they're used for in the dev tools inspector.

We then initialize an intersection observer to observe these sentinels.

```js
const intersectionCallback = function(entries) {
  // only observing one item at a time
  const entry = entries[0];

  let isStuck = false;
  if (!entry.isIntersecting) {
    isStuck = true;
  }

  callback(isStuck);
};

const intersectionObserver = new IntersectionObserver(intersectionCallback, {});

if (stickToTop) {
  intersectionObserver.observe(stickySentinelTop);
} else {
  intersectionObserver.observe(stickySentinelBottom);
}
```

If you are not familiar with IntersectionObserver, you can read the docs here. At a high level, an Intersection Observer observes one or more nodes and executes a function when the node's intersection with a root node (usually the viewport) changes. It is very powerful and can often be used as an alternative to a scroll event listener.

For our use case, we either observe the top or bottom sentinel, depending on if the sticky node is sticking to the top or bottom, respectively. The Intersection Observer callback will fire when the sentinel enters or leaves the viewport. If the sentinel is not intersecting (it is outside of the viewport), we can assume that the sticky element is currently "stuck" (except for one edge case, see section below). If the sentinel is intersecting, then the sticky element is not sticking. See explanation above.

Either way, we execute the provided callback and pass a flag indicating if the element is currently stuck or not.

This is a basic implementation. It has some bugs, but it works well enough to start using it. We'll circle back to some edge cases and enhancements later in the post, but let's see how we can use this action in a Svelte component.

## Using the action in a Svelte component

First, let's see how far we can get with just CSS and HTML.

```svelte
<style>
  .sticky {
    position: sticky;
    top: 1rem;
    background: mistyrose;
  }
</style>

<section>
  <h2 class="sticky">
    I use position: sticky!
  </h2>

  <!-- Lorem ipsum text truncated for readability -->
  <p>Lorem ipsum dolor sit amet...</p>
  <p>Phasellus lobortis molestie turpis...</p>
</section>
```

Presto! Render that HTML and you'll see a sticky header that stays visible when we scroll, no additional JavaScript required. My REPL has some extra styling, but this has the really essential stuff. This goes to show how far you can get with modern CSS these days. It's also a progressive enhancement for older browsers -- if they don't support position: sticky, the header will scroll with the rest of the page.

Note -- `h2` is not the correct heading level to use if this is the only thing on your page. In my demo, this is being placed in a larger page that contains an `h1`.

However, if you want to change something about the element or component when it's sticking to the top of the screen, you need to bring in some JavaScript. Let's add a script tag and update our markup a bit.

```svelte
<script>
  import sticky from './sticky.js';

  let isSticking = false;
  function stickyCallback(isStuck) {
    isSticking = isStuck;
  }
</script>

<style>
  /* No change */
</style>

<section>
  <h2
    class="sticky"
    use:sticky={{ callback: stickyCallback, stickToTop: true }}>
    I use position: sticky! (currently
    {isSticking ? 'sticking' : 'not sticking'})
  </h2>

  <!-- Lorem ipsum text truncated for readability -->
</section>
```

There's a bit more going on here, so let's break it down.

Our script tag is pretty slim -- we import our sticky action and define a state variable `isSticking` and a function `stickyCallback` to update that variable.

In our markup, we use the action we created earlier with `use:sticky` and pass in the action parameters. When the `h2` is added to the DOM, the action will automatically set up the intersection observers with the callback we provided. Executing the callback will update the state variable and we can dynamically show whether the element is sticking or not. Pretty neat!

We can go one step further and update the styling of the element when the stickiness changes.

```svelte
<script>
  // No change
</script>

<style>
  .sticky { /* No change */ }

  .sticky[data-stuck="true"] {
    background: mintcream;
  }
</style>

<section>
  <h2
    class="sticky"
    use:sticky={{ callback: stickyCallback, stickToTop: true }}
    data-stuck={isSticking}>
    I use position: sticky! (currently
    {isSticking ? 'sticking' : 'not sticking'})
  </h2>

  <!-- Lorem ipsum text truncated for readability -->
</section>

```

Now we are setting the `data-stuck` attribute to the value of `isSticking`. This lets us target it in our CSS. You could also use the `class:` directive here instead, depending on personal preference. Using data attributes for state changes comes from [the CUBE CSS methodology](https://piccalil.li/cube-css/exception/).

Looks great! Unfortunately, we have a bug when we have multiple sticky elements on the page. Depending on your CSS, when scrolling down you may see a brief flash of the "stuck" styles on the heading coming into view. I changed the sticky colors to black and white and set a transition duration of 2 seconds to make it very clear. See the GIF below.

![Sticky styles briefly applied when scrolling down](/images/svelte-action-sticky/sticky-css-bug.gif)

Aside goes here linking to tweet thread on accessible gifs.

So what's happening here? In our sticky action, we set isStuck based on the visibility of the top sentinel. When the page loads, the sentinel for the second heading is out of view, so the second heading applies the stuck styles. When we scroll down, the sentinel comes into view and the stuck styles are removed. In our case, since the transition happens over 2 seconds, it is very clear what is going on.

## Covering edge cases

- Checking Y position
- Mutation observer
- update and destroy

## What this doesn't handle

- Adding sentinels could break CSS selectors (alternative: rootMargin)
- Does not support horizontal stickiness (but this wouldn't be too hard to add)
- Sticky elements in middle of parent?

## References

- https://developer.mozilla.org/en-US/docs/Web/CSS/position#Sticky_positioning
- https://svelte.dev/docs#use_action
- https://css-tricks.com/an-explanation-of-how-the-intersection-observer-watches/#finding-the-position
- https://developers.google.com/web/updates/2017/09/sticky-headers
