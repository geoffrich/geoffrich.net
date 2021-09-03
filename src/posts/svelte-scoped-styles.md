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

This is powerful because it means you don't have to worry about accidentally styling anything outside the component, and you can write a lot more generic selectors.

But how does this scoping actually work? In this post, I'll get into the nitty-gritty of how your styles are scoped to your component, and the implications that has on the rest of your app.

This blog post is accurate for the Svelte version at time of writing (v3.42.1). However, the implementation of Svelte's style scoping could change at a later date, so this post may not stay accurate.

## Classing up the joint

When working on a Svelte app, you may have inspected the rendered markup and see a bunch of CSS classes you didn't add. Why are those there? Svelte applies those classes to styled elements in your app to ensure that styles you write in that component only apply to elements in your component.

For example, the component above is transformed into the following.

```html
<p class="svelte-dvinuz">This is a paragraph with scoped styles.</p>

<style>
  p.svelte-dvinuz {
    color: green;
  }
</style>
```

This rule won't apply to `<p>` elements outside of the component, because they won't have that class applied. Only elements inside the component will have that component's special class applied, and thus match the selector in the generated styles.

### More complex selectors

Let's look at what happens when the selectors become more complicated. The following component uses child selectors. This is not strictly necessary in this example case (you could simply target `span`), but it's a useful illustration.

```svelte
<ul>
	<li>Apples <span>🍎</span></li>
	<li>Bananas <span>🍌</span></li>
	<li>Carrots <span>🥕</span></li>
</ul>

<style>
	ul li {
		font-size: 18px;
	}

	ul li span {
		font-size: 24px;
	}
</style>
```

In this case, the styles are transformed to the following.

```css
ul.svelte-gxa857 li.svelte-gxa857 {
  font-size: 18px;
}
ul.svelte-gxa857 li span.svelte-gxa857 {
  font-size: 24px;
}
```

Note that Svelte does not apply the class (in this case `svelte-gxa857`) to every part of the selector. Instead, it only applies it to the first and last part of the selector. This is to prevent descendant combinators from matching a child component (todo: example).

Now if you think you have a handle on things... what do you think Svelte will output if we add a style to the `ul`?

```css
ul {
  background-color: lightblue;
}

ul li {
  font-size: 18px;
}

ul li span {
  font-size: 24px;
}
```

In this case, Svelte outputs the following CSS:

```css
ul.svelte-1vfiehr.svelte-1vfiehr {
  background-color: lightblue;
}

ul.svelte-1vfiehr li.svelte-1vfiehr {
  font-size: 18px;
}

ul.svelte-1vfiehr li span.svelte-1vfiehr {
  font-size: 24px;
}
```

Woah! Svelte transformed the last two selectors the same way, but added the hash class twice to the first `ul` selector! Why would it do that?

This traces back to a concept called _CSS specificity_. Specificity is how the browser determines what CSS rules should take precedence over another. [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity) has a great page explaining all the different ins and outs, but in general, certain types of CSS selectors are more specific and thus have higher precedence over others. For instance, a class selector (like `.list`) is more specific than an element selector (like `ul`). Also, the more of a type of a selector in a given CSS rule, the more specific it is. So, a selector with two classes will be more specific than a selector with one class.

With this knowledge, let's understand why Svelte adds two class selectors to the first rule instead of one.

Multi-part selectors have two classes added to the rule, while single selectors have only one. This means some selectors will have their specificity increased by 2 class points while others will have their specificity only increased by 1. Theoretically this means that the applied style is not what you would expect from the raw CSS.

Svelte fixes this an interestingly way. It keeps track of what the max number of classes it added to a CSS rule is, and it makes sure all selectors have their specificity increased by that same amount.

If Svelte didn't do this, the following would cause issues. The first selector would have two classes added, so it would take precedence. You might only notice this if you were familiar with CSS specificity, or or were porting the component from a non-Svelte project.

```svelte
<ul>
	<li><span class="name">Apples</span> <span>🍎</span></li>
	<li><span class="name">Bananas</span> <span>🍌</span></li>
	<li><span class="name">Carrots</span> <span>🥕</span></li>
</ul>

<style>
	ul li span {
		font-size: 24px;
	}

	.name {
		font-size: 18px;
	}
</style>
```

So one issue is fixed, but another is introduced. What if you rely on an external stylesheet that you also want to apply to your component?

You can

- artificially increase specificity
- is there a way to prevent Svelte from doing this?
- example

Something about global here?

Something about increasing specificity here?

## Making a hash of things

The class names Svelte generates are not random, even though they might look that way.

### Customization and why you might want to

`cssHash` compiler option

## :global domination

How does scoping work with global styles?

### Scope creep

Even when you scope to a container, global styles can still "leak down" (which might be what you want!)

## Implications

Additional classes added

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
