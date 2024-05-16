---
title: You can’t preload SVG sprites (but I want to)
date: '2024-05-16'
tags:
  - svg
socialImage: 'https://geoffrich.net/images/social/preloading-svgs.png'
---

[SVG sprites](https://ryantrimble.com/blog/what-the-heck-is-an-svg-sprite-sheet/) are a great way to manage a lot of SVG icons. Create a sprite sheet with your different icons defined as symbols…

```svg
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <symbol id="arrow-path" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16 9h5v0M3 20v-5m0 0h5m-5 0 3 3a8 8 0 0 0 14-4M4 10a8 8 0 0 1 14-4l3 3m0-5v5"/>
    </symbol>
    <symbol id="clipboard" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16 4a2 2 0 0 0-2-2h-3C9 2 9 3 8 4m8 0s0 0 0 0v1a1 1 0 0 1-1 0H9a1 1 0 0 1-1 0v0-1m8 0h2l2 2v14a2 2 0 0 1-3 2H7a2 2 0 0 1-2-2V6l1-2a48 48 0 0 1 2 0"/>
    </symbol>
  </defs>
</svg>
```

And then you can reference those icons in your HTML with the `<use>` element.

```html
<svg height="24" width="24">
  <use href="#arrow-path" />
</svg>
```

This is great for performance, since instead of repeating the same SVG markup every time you use the icon, you define the markup one place instead and re-use it.

The SVG sprite sheet can either be in the same HTML document where you use it, or it can be an external asset.

```html
<!-- reference in the same document -->
<svg height="24" width="24">
  <use href="#arrow-path" />
</svg>

<!-- reference an external /sprite.svg file -->
<svg height="24" width="24">
  <use href="/sprite.svg#arrow-path" />
</svg>
```

The benefit of making it an external asset is that your SVG icons can be cached independently of the page itself, decreasing page size. Unfortunately, there’s a problem: using an external sprite sheet means there’s an extra request that has to happen before the icon can be displayed, and your users might see the icons "pop in" as the SVG sprite sheet finishes downloading.

But that’s what [preload links](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload), are for right?

```html
<link rel="preload" as="image/svg+xml" href="/sprite.svg" />
```

But that doesn’t work. In Chrome, you see a console warning:

> <link rel=preload> must have a valid `as` value

Hm. What if we preload it as an image?

```html
<link rel="preload" as="image" type="image/svg+xml" href="/sprite.svg" />
```

No console warning when the page loads… but a few seconds later:

> The resource http://127.0.0.1:8080/sprite.svg was preloaded using link preload but not used within a few seconds from the window's load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally.

And if you take a look at the network panel, "sprite.svg" is fetched _twice_. So the browser "preloaded" the SVG file but wasn’t able to actually use it for our sprite references. Ugh.

That preload would work if we were using an SVG as an image, but not as an `<svg>`.

```html
<!-- in the head -->
<link rel="preload" as="image" type="image/svg+xml" href="/clipboard.svg" />
<!-- then these will be successfully preloaded -->
<span class="clipboard-bg"></span>
<img src="/clipboard.svg" width="24" height="24" />

<style>
  .clipboard-bg {
    background: url('/clipboard.svg');
    width: 24px;
    height: 24px;
    display: inline-block;
  }
</style>
```

It turns out there’s [a Chrome](https://issues.chromium.org/issues/40681653) (and [fetch spec](https://github.com/whatwg/fetch/issues/1012)) issue for this behavior that has been open since 2020. For now, if you want to preload SVGs to use in `<svg>` elements, you’re out of luck. In fact, attempting to preload SVGs for this use case is actually harmful to performance due to the double request.

Workarounds for now:

- Accept the icons popping in.
- Inline the sprite sheet on each page. If you don’t have a ton of icons, the cacheability tradeoff may be okay.

Astro also has an interesting approach in their [icon component](https://www.astroicon.dev/guides/components/#automatically-optimized-sprites) where the first time you render an icon it includes the `<symbol>`, and subsequent usages refer back to that symbol. This way icons are inlined (so no preloading to worry about) and you only include the icons you actually use.

To test out SVG preloading yourself, see [my demo repo](https://github.com/geoffrich/svg-preload-demo).

## A takeaway

One takeaway I had from this investigation is that it’s important to verify that code changes you make actually do something. I read a tutorial that suggested preloading the SVG sprite sheet for performance, and I could’ve just assumed that it would speed up my page. However, attempting to preload was actually causing a double request and increasing the amount of resources my page loaded.

Similarly, you may assume that adding ARIA attributes to an element will "help accessibility," but if you can’t actually check that then you may be doing more harm than good. "role=button" is harmful if you’re not adding the necessary keyboard interactions (probably just use a `<button>`), and "aria-label" does nothing on a div.

You can’t just assume things will work — you need to verify.
