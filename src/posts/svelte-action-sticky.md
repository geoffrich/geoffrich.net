---
title: Detecting sticky positioning with Svelte actions
date: '2020-11-24'
tags:
  - svelte
  - html
  - css
  - js
---

TODO:

- GIF a11y
- Check for inclusive language w/ 11ty plugin
- link to Twitter thread
- should I host my profile image on Twitter?
- @11tyrocks/eleventy-plugin-social-images
- SR testing
- favicon fallback
- sticky node in middle? should a sentinel be placed directly after a sticky node?
- update to use event listeners
- observer capitalization

`position: sticky` is a CSS property that lets you "stick" an element to the top of the screen when it would normally be scrolled away. However, there is no native way to change the element's styling when it becomes stuck. In this article, I will show you how to detect and style a "stuck" element using an underused feature of the Svelte API: actions.

If you want to see the end result and don't want to read the explanation, here's my [finished demo](https://svelte.dev/repl/4ad71e00c86c47d29806e17f09ff0869?version=3) in the Svelte REPL. You can also find the code on my [GitHub](https://github.com/geoffrich/svelte-sticky-demo).

## What is position: sticky?

In essence, sticky positioning lets you stick an element on screen once a certain point in the page is crossed. Per [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/position#Sticky_positioning):

> Sticky positioning can be thought of as a hybrid of relative and fixed positioning. A stickily positioned element is treated as relatively positioned until it crosses a specified threshold, at which point it is treated as fixed until it reaches the boundary of its parent.

A common use case is to keep some information in view that would normally be scrolled off screen. For instance, if someone is changing their flight online, you may want to stick their current flight information to the top of the screen as they scroll through other flight options. Here are some other examples of [position: sticky in practice](https://mastery.games/post/position-sticky/).

Sticky positioning is supported in the vast majority of browsers ([Can I Use](https://caniuse.com/?search=position%20sticky)). Even if a browser doesn't support it, it can be treated as a progressive enhancement and gracefully fallback to regular positioning.

## How do I change the appearance of an element when it becomes stuck?

You can't, at least not natively, and this is intentional. If you had a `:stuck` selector, you could easily write a rule that would result in an infinite loop. For instance, look at the following:

```css
:stuck {
  position: static;
}
```

With this rule, the element becoming stuck would trigger static positioning, which would make it unstuck, so the rule would no longer apply, and so on until the end of time.

You can find a more detailed discussion of the issue on the [CSS Working Group wiki](https://wiki.csswg.org/faq#selectors-that-depend-on-layout). If you want to change styling when an element becomes stuck, you're going to have to implement it yourself with JavaScript. You should still be careful, as you can run into similar infinite loop issues on your own. Getting this wrong could result in a jittering screen that is very unpleasant for the user.

I will show you how to detect a "stuck" element using Svelte actions, though it could easily be written without a framework as well. If you are using Svelte, writing it as an action will allow this functionality to be re-used in any component you want with minimal boilerplate.

## What is a Svelte action?

A Svelte action is a function that runs when a node is rendered into the DOM. They're commonly used for adding custom event handling logic or interfacing with external libraries, but the sky's the limit! You can do anything you want to the node inside that function. I recommend looking at the official [Svelte tutorial](https://svelte.dev/tutorial/actions) on them to learn more. I've linked some other resources at the end of the article.

Writing our sticky functionality as an action lets us put all the imperative DOM code in one place that can be reused by multiple components. Here's what an action looks like in practice. All you need is a function that takes two arguments: a node and an (optional object of parameters).

```js
// sticky.js
export default function sticky(node, {callback, stickToTop}) {
  // do stuff
}
```

For our use case, we want two parameters: a callback (executed when stickiness changes) and stickToTop (whether the node will be stuck to the top or bottom). We'll go into how we'll use these parameters later.

One you have your action, you can attach it to a node with `use`.

{% raw %}

```svelte
<script>
  import sticky from "./sticky";
</script>

<h2
  class="sticky"
  use:sticky={{ callback: stickyCallback, stickToTop: true }}>
  I use position: sticky!
</h2>
```

{% endraw %}

When the `h2` appears in the DOM, the `sticky` function will run and we'll be off to the races!

## Detecting stickiness

The way we'll detecting our node becoming stuck is with two "sentinel" divs: one at the top of the node's parent and one at the bottom. If the top sentinel exits the viewport, then a top position: sticky element is currently stuck. If the bottom sentinel exits the viewport, then a bottom position: sticky element is currently stuck.

TODO: VISUAL EXAMPLE HERE

First, let's create and insert our sentinel divs inside our `sticky` function.

```js
const stickySentinelTop = document.createElement('div');
stickySentinelTop.classList.add('stickySentinelTop');
node.parentNode.prepend(stickySentinelTop);

const stickySentinelBottom = document.createElement('div');
stickySentinelBottom.classList.add('stickySentinelBottom');
node.parentNode.append(stickySentinelBottom);
```

The classes aren't strictly necessary, but they make it clear why the divs are there if you saw them in the dev tools inspector.

We then initialize an Intersection Observer to observe either the top or bottom sentinel, depending on the `stickToTop` parameter passed to the action. The [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) allows us to execute a function when a certain node exits or enters the viewport. If the observer fires and the sentinel is outside of the viewport (i.e., not intersecting), then the element must be stuck (except for an edge case we'll cover later). If the sentinel is within the viewport, then the sticky element cannot be stuck.

Either way, we execute `callback` with an argument that indicates whether the element is sticking. `callback` is provided by the component using the action and will update the component's state when the node becomes stuck.

```js
const intersectionCallback = function(entries) {
  // only observing one item at a time
  const entry = entries[0];
  let isStuck = !entry.isIntersecting;
  callback(isStuck);
};

const intersectionObserver = new IntersectionObserver(intersectionCallback, {});

if (stickToTop) {
  intersectionObserver.observe(stickySentinelTop);
} else {
  intersectionObserver.observe(stickySentinelBottom);
}
```

A vanilla JS implementation might toggle a "stuck" class on the element instead of using a callback. Since Svelte automatically scopes styles, it would think rules using this class are unused since "stuck" would not be referenced in the component code itself. That's why we use a callback here instead.

This is our basic implementation. It has some bugs, but it works well enough to start using it. We'll circle back to some edge cases and enhancements later in the post, but let's see how we can use this action in a Svelte component.

## Using the action in a Svelte component

First, let's see how far we can get with just CSS and HTML.

{% raw %}

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

{% endraw %}

Presto! Render that HTML and you'll see a sticky header that stays visible when we scroll. My REPL has some extra styling, but this has the really essential stuff. No JavaScript is required for basic sticky positioning. It's only when you want to style it differently that you need a little something extra.

<div class="callout">

Note: `h2` is not the correct heading level to use if this is the only thing on your page. In my demo, this is being placed in a larger page that contains an `h1`. You should always [ensure that headings are in a logical order](https://dequeuniversity.com/rules/axe/4.0/heading-order?application=AxeChrome) to aid screen reader navigation.

</div>

If you want to change something about the element or component when it's sticking to the top of the screen, you need to write some JavaScript. Let's add a script tag and update our markup to `use` the action we created.

{% raw %}

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

{% endraw %}

There's a bit more going on here, so let's break it down.

Our script tag is pretty slim &mdash; we import our sticky action and define a state variable `isSticking` and a function `stickyCallback` to update that variable.

In our markup, we use the action we created earlier with `use:sticky` and pass in the action parameters. When the `h2` is added to the DOM, the action will automatically set up the observers with the callback we provided. Executing the callback will update the state variable and we can dynamically show whether the element is sticking or not. Pretty neat!

We can also update the styling of the element using that same state variable.

{% raw %}

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

{% endraw %}

Since we can't reference JavaScript variables in our styles directly, we need to update an attribute on the element so we have something to target in our CSS.
Here we set the `data-stuck` attribute to the value of `isSticking`. Using data attributes for state changes comes from [the CUBE CSS methodology](https://piccalil.li/cube-css/exception/). You could set a class using the `class:` directive here instead, depending on personal preference. Either way, you have something to target in your CSS. Now when the element is stuck, the color changes to mintcream 🍦.

Looks great! Unfortunately, we have a bug when we have multiple sticky elements on the page. Depending on your CSS, when scrolling down you may see a brief flash of the "stuck" styles on the heading coming into view. I changed the sticky colors to black and white and set a transition duration of 2 seconds to make it very clear. See the GIF below.

![Sticky styles briefly applied when scrolling down](/images/svelte-action-sticky/sticky-css-bug.gif)

So what's happening here? In our sticky action, we set `isStuck` based on the visibility of the top sentinel. When the page loads, the sentinel for the second heading is out of view, so the second heading applies the stuck styles. When we scroll down, the sentinel comes into view and the stuck styles are removed, resulting in a flash of the stuck styles.

To fix this, we need to check the Y position before executing the callback. If the sentinel is coming into view from the bottom of the screen but we are observing an element sticking to the top, `isStuck` should be false. Similarly, if the sentinel is coming into view from the top of the screen but we are observing an element sticking to the bottom, `isStuck` should also be false. Here's what that looks like in code.

```js
const intersectionCallback = function(entries) {
  const entry = entries[0];
  let isStuck = !entry.isIntersecting && isValidYPosition(entry);
  callback(isStuck);
};

const isValidYPosition = function({target, boundingClientRect}) {
  if (target === stickySentinelTop) {
    return boundingClientRect.y < 0;
  } else {
    return boundingClientRect.y > 0;
  }
};
```

With that change, sticky styling is applied correctly.

## Another edge case: mutations

I encountered another edge case while preparing the demo for this post &mdash; what happens if the content inside the component moves around? It's important that our sentinel nodes are at the top and bottom of the node's parent, but that is not guaranteed if Svelte is dynamically inserting elements after the action has run.

For instance, let's say you had some content controlled by a checkbox that toggles `flag`.

{% raw %}

```svelte
<section>
  <h2
      class="sticky"
      use:sticky={{ callback: stickyCallback, stickToTop: true }}>
      I use position: sticky!
  </h2>

  <slot />
  {#if flag}
    <p>Me too</p>
  {/if}
</section>
```

{% endraw %}

I found that toggling the value of `flag` would re-insert the node after the bottom sentinel, which could introduce bugs since we expect the bottom sentinel to be the last element in its container. See the below HTML for the result.

```html
<div class="stickySentinelTop"></div>
<h2 class="sticky svelte-1n1qj7a" data-stuck="false"></h2>
<div class="stickySentinelBottom"></div>
<p>Me too</p>
```

You might not encounter this edge case. In case you do, let's show how we can re-insert the sentinels on changes to the container using a [Mutation Observer](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver).

## Replacing sentinels on mutations

The Mutation Observer API is similar to the Intersection Observer API &mdash; you observe a node and execute a callback when something changes. Our mutation callback will check if the sentinels are still the first and last child and re-insert them if they're not.

```js
const mutationCallback = function(mutations) {
  mutations.forEach(function(mutation) {
    const {parentNode: topParent} = stickySentinelTop;
    const {parentNode: bottomParent} = stickySentinelBottom;

    if (stickySentinelTop !== topParent.firstChild) {
      topParent.prepend(stickySentinelTop);
    }
    if (stickySentinelBottom !== bottomParent.lastChild) {
      bottomParent.append(stickySentinelBottom);
    }
  });
};
```

We don't have to worry about removing the sentinels before re-inserting them, since `prepend` and `append` will move them to the new location instead of duplicating the node.

Now that we have our callback, we can initialize the Mutation Observer and observe our node's parent. We pass an options object to the `observe` call to indicate that we only care about updates to the list of children.

```js
const mutationObserver = new MutationObserver(mutationCallback);
mutationObserver.observe(node.parentNode, {childList: true});
```

Peachy 🍑. If we try our demo again, we'll see that the sentinels stay in position even when content is added and removed.

## Update and destroy

One last aspect of actions we haven't touched on is the `update` and `destroy` methods. An action can optionally return an object containing these methods. `update` will be called when any of the parameters passed to the action change, and `destroy` will be called when the node is removed from the DOM.

Since my demo allows for toggling between sticking to the top and sticking to the bottom, I had to implement `update` so that we could start observing the other sentinel when `stickToTop` changes. I also disconnected our observers in the `destroy` method, but this [might not be necessary](https://stackoverflow.com/questions/51106261/should-mutationobservers-be-removed-disconnected-when-the-attached-dom-node-is-r/51106262#51106262) if garbage collection handles it.

```js
return {
  update({stickToTop}) {
    // change which sentinel we are observing
    if (stickToTop) {
      intersectionObserver.unobserve(stickySentinelBottom);
      intersectionObserver.observe(stickySentinelTop);
    } else {
      intersectionObserver.unobserve(stickySentinelTop);
      intersectionObserver.observe(stickySentinelBottom);
    }
  },

  destroy() {
    intersectionObserver.disconnect();
    mutationObserver.disconnect();
  }
};
```

## Some caveats

There's a few caveats to this implementation. Adding raw DOM nodes like this could break certain CSS selectors like `:first-child`. There's an alternative approach using the `rootMargin` property of the observer, but this does not let you set any sort of offset position for the sticky element (e.g. `top: 1rem`). You can read more about it at [CSS Tricks](https://css-tricks.com/an-explanation-of-how-the-intersection-observer-watches/#creating-a-position-sticky-event). If you don't need to offset the sticky element, using `rootMargin` may be a better option.

We also didn't implement anything for horizontal stickiness. I'll leave that as an exercise for the reader. Our method also requires sticky elements to be the first or last child of their parent. I'm not sure of a good way around that one, and it hasn't come up often in my experience.

## Wrapping up

I hope you learned something about the power of Svelte actions and modern CSS! If you enjoyed the article, let me know on [Twitter](https://twitter.com/geoffrich_).

## Further reading

- [MDN docs on sticky positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/position#Sticky_positioning)
- [Documentation on Svelte actions](https://svelte.dev/docs#use_action)
- [Svelte School: Introduction to Actions](https://svelte.school/tutorials/introduction-to-actions)
- [Kirill Vasiltsov: Unlocking the power of Svelte actions](https://dev.to/virtualkirill/unlocking-the-power-of-svelte-actions-1k29)
- [Google Developers Blog: An event for CSS position:sticky](https://developers.google.com/web/updates/2017/09/sticky-headers) &mdash; this inspired a lot of my approach for this post.
- [CSS Tricks on an alternative approach](https://css-tricks.com/an-explanation-of-how-the-intersection-observer-watches/#finding-the-position)
