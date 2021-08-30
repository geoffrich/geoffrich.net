---
title: How Svelte scopes styles
date: '2021-08-24'
tags:
  - svelte
socialImage: 'TODO'
---

By default, any styles you write in a Svelte component are scoped to that component. This means that the `p` selector in the following code won't affect any `<p>` elements outside of this component.

```svelte
<p>This is a paragraph with scoped styles.</p>

<style>
  /* I only affect elements in this component */
  p {
    color: green;
  }
</style>
```

But how does this scoping actually work? In this post, I'll get into the nitty-gritty of how your styles are scoped to your component, and the implications that has on the rest of your app.

This blog post is accurate for the Svelte version at time of writing (v3.42.1). However, the implementation of Svelte's style scoping could change at a later date, so this post may not stay accurate.

## Making a hash of things

## Class up the joint

When working on a Svelte app, you may have inspected the rendered markup and see a bunch of classes you didn't add. Why are those there?

### Customization and why you might want to

## Addendum: a brief history of Svelte's scoped styles

## Misc notes

Hash added to class of elements in the component that are styled (implementation in Stylesheet.ts)

- hash of the CSS styles stringified, so same styles -> same hash

Class is added to first and last element in selector

- only scoping innermost selector could let selector match from parent component

Global styles can reach in, but component styles won't leak out.

When using global, you can still scope to the component (though I think this will still affect children)

- e.g. container :global(p)
- html directive
- dynamically added classnames

Special handling

- keyframes - also scoped, start with `-global-` to remove scoping. Because keyframes are global, the name and all occurrences of the name are changed to something like `svelte-xxxx-original-name`

Specificity implications

- Might be tricky to override w/ global styles
- Sometimes multiple classes are added to preserve specificity (https://github.com/sveltejs/svelte/issues/4374), see also related [Vue js issue](https://github.com/vuejs/vue-loader/issues/1091). This was implemented to fix bugs like [this](https://github.com/sveltejs/svelte/issues/1277)

> we have to add the class to every element that has a style, and to every selector. that bloats out the resulting CSS. but worse, adding the scoping class changes the specificity, which we have to work around awkwardly.
> -- [Rich_harris](https://twitter.com/Rich_Harris/status/1324548286368415746)

Trivia: used to be an [attribute](https://github.com/sveltejs/svelte/issues/570). See linked issue for discussion about whether component name should be used instead of an ugly hash.

Styles used to cascade to child components! https://github.com/sveltejs/svelte/issues/583 Only the top level components would get the hash, and they would be transformed to a rule like `p[svelte-3281250378], [svelte-3281250378] p`. This was changed to 1) make scoping work more like people thought it would (i.e. only affect current component) and 2) make the CSS easier to analyze, because you don't have to worry about a child component using the style. Now styles only apply to the component by default, but you can escape with `:global`.

Classname is customizable with cssHash compiler option, see [570](https://github.com/sveltejs/svelte/issues/570)

Are there implications for recursive components? From Vue scoped docs:

> Be careful with descendant selectors in recursive components! For a CSS rule with the selector .a .b, if the element that matches .a contains a recursive child component, then all .b in that child component will be matched by the rule.

Twitter/GitHub boon for researching stuff like this -- can see the thought process that led to the current state.

Does [style directive RFC](https://github.com/plmrry/rfcs/blob/style-directives/text/0000-style-directives.md) have implications?

[Native scoping](https://twitter.com/Rich_Harris/status/1324548286368415746) might help specificity awkwardness

[Benefits](https://twitter.com/Rich_Harris/status/1285957952298528769) of Svelte's approach vs CSS-in-JS

[Why doesn't Svelte scope under root element](https://stackoverflow.com/questions/60054062/why-doesnt-svelte-scope-the-tag-under-a-class-but-use-individual-tag-class-to-s)?

Misc:

- Why parent shouldn't affect child: https://twitter.com/Rich_Harris/status/1286747785656705024
- original issue that added it: https://github.com/sveltejs/svelte/issues/8
- introduced in Ractive: https://github.com/ractivejs/ractive/issues/452
- [zen of just writing CSS](https://svelte.dev/blog/the-zen-of-just-writing-css)
- global styles aren't removed when component is destroyed: https://github.com/sveltejs/svelte/issues/5530

Perf implications -- see Nolan Lawson post
