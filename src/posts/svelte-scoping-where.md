---
title: Can you scope styles without increasing specificity?
date: '2021-09-27'
tags:
  - svelte
  - css
socialImage: 'https://geoffrich.net/images/social/svelte-scoping-where.png'
syndication:
  - https://twitter.com/geoffrich_/status/1442877606164983809
  - https://www.reddit.com/r/sveltejs/comments/pxawqe/how_to_improve_sveltes_style_scoping/
---

_Or, alliteratively: Settling Svelte's style scoping specificity wars with :where_

In my previous post on [Svelte's style scoping](/posts/svelte-scoped-styles/), I lied to you. When talking about how Svelte's style scoping can unexpectedly increase CSS specificity, I said:

> Svelte needs to add _something_ to the CSS rules to make sure they only apply to a single component, and that will increase the specificity.

That's not entirely accurate. The first part is true&mdash;Svelte does need to add _something_ to the CSS. However, that doesn't need to increase specificity. In fact, there is a CSS pseudo-class that will _not_ increase specificity: [`:where`](https://developer.mozilla.org/en-US/docs/Web/CSS/:where). It can be used like so:

```css
/* :where takes a list of selectors */
:where(h1, h2, h3) p {
  color: red;
}

/* This targets the same elements as the following */
h1 p,
h2 p,
h3 p {
  color: red;
}
```

Because `:where` has 0 specificity, the first rule in the example above has a specificity of 0-0-1 (the same as a single `p` selector), while the second has a specificity of 0-0-2 (since there are two element selectors).

So, how can `:where` improve Svelte's style scoping? First, let's review Svelte's current scoping method.

## A brief recap

In case you missed (or forgot about) my [previous post](/posts/svelte-scoped-styles/), Svelte scopes component styles by adding a unique CSS class (such as `svelte-abcdef`) to the HTML elements inside the component and to the styles that target them. This ensures that styles you write inside a Svelte component only apply to elements inside that component. [Vue](https://vue-loader.vuejs.org/guide/scoped-css.html) and [styled-jsx](https://github.com/vercel/styled-jsx) use a similar technique.

```html
<!-- What you write in the Svelte component -->
<p>This is a paragraph with scoped styles.</p>

<style>
  /* I only affect elements in this component */
  p {
    color: green;
  }
</style>

<!-- The resulting HTML/CSS -->
<p class="svelte-dvinuz">This is a paragraph with scoped styles.</p>

<style>
  p.svelte-dvinuz {
    color: green;
  }
</style>
```

This method is very good at keeping styles scoped to a single component. However, you run into issues if you have global styles that you _also_ want to apply to Svelte components. By adding a scoping class, Svelte [increases the specificity](/posts/svelte-scoped-styles/#heading-specificity-and-scoping) of your component's styles, which may mean that global styles don't apply when you expect them to. In some cases, Svelte adds multiple scoping classes, increasing the specificity even more.

If you're interested in why and how Svelte does this, check out my article linked above, where I go into much more detail. But for now, I want to consider something: if the problem is that Svelte increases specificity unexpectedly, could we use `:where` to scope styles but _not_ increase specificity?

## A different approach

Instead of adding the scoping class directly, Svelte _could_ wrap it in `:where()` instead:

```html
<style>
  p:where(.svelte-dvinuz) {
    color: green;
  }
</style>
```

Because it is inside `:where`, `.svelte-dvinuz` does not increase the specificity of the original CSS rule. Instead of increasing the style's specificity to 0-1-1, it keeps the original specificity of 0-0-1. This means the rules you write in your Svelte component will more predictably interact with your global styles.

However, at the moment, I don't think this method is a drop-in replacement for Svelte's class-based style scoping:

- **Browser support could be better**: while `:where` is supported in all evergreen browsers, that's only [86% of web users](https://caniuse.com/mdn-css_selectors_where) globally at time of writing. This includes the basically-dead IE11, yes, but also a fairly-recent iOS version (13) and Samsung Internet (which has a similar market share to Firefox, according to Can I Use). In many cases, this would be sufficient support to try out new CSS features. However...
- **There's no graceful degradation**: because `:where` would be present in every CSS rule that came from a Svelte component, browsers that don't support it would ignore those styles entirely. Many apps would have no styles at all for users on older browsers. And unlike modern JS syntax, there's no way to polyfill `:where`, at least not without breaking the scoping behavior.
- **Breaking change**: because the specificity of styles in a Svelte component is reduced, some global styles would start applying where they wouldn't previously.
- **Possible size increase**: `:where(svelte-hash)` is more characters than `.svelte-hash`, though it is shorter than adding two scoping classes. In some cases, I would expect the CSS size to increase (though the impact on the generated CSS is likely minimal due to compression).

For these reasons, if Svelte were to implement this kind of scoping, it would need to either be in a major version bump (Svelte v4?) or in a new configuration option that devs could opt-in to.

However, it's definitely a compelling proposition. Perhaps when browser support improves, using `:where` to scope styles will be a viable option. Until then, we'll have to live with occasional specificity battles for the price of scoped component styles.

_Shout-out to [iainsimmons](https://www.reddit.com/r/sveltejs/comments/pjpaz6/how_svelte_scopes_component_styles/hc1dbpu/?context=3) on r/sveltejs and [Arkkimaagi](https://github.com/sveltejs/svelte/issues/4374#issuecomment-921976465) on GitHub for bringing up this idea and discussing it with me._
