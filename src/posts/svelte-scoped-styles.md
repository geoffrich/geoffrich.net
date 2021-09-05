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

The `svelte-xxxxxx` class is not random&mdash;it is generated using a hash of the component's styles, so it should be unique for every component (unless two components styles are **exactly** the same).

## More complex selectors

Let's look at what happens when the selectors become more complicated. The following component uses descendant selectors. This is not strictly necessary in this example case (you could simply target `span`), but it's useful for illustration.

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

What are the different options for how Svelte could transform this component?

One option would be to only apply the scoping class to the first element in the selector, so the selectors become `ul.svelte li` and `ul.svelte li span`. However, this could cause unwanted style leakage&mdash;if there were child components, they could potentially match the selector (TODO: elaborate?).

Another option is to apply the scoping class to every element in the selector, so the rules would become `ul.svelte li.svelte` and `ul.svelte li.svelte span.svelte`. This _would_ prevent any styles from leaking to child components, but it does add the class more times than is necessary.

What Svelte actually does is somewhere in the middle: it applies the scoping class to the first and last part of the selector. The styles are transformed to the following:

```css
ul.svelte-gxa857 li.svelte-gxa857 {
  font-size: 18px;
}
ul.svelte-gxa857 li span.svelte-gxa857 {
  font-size: 24px;
}
```

This is the best of both worlds: styles don't leak out (because the selector must start and end inside the component), and we don't add more classes than necessary.

## Specificity and scoping

Now if you think you have a handle on things, let's tweak our markup and styles a bit. What styles do you think Svelte generates in this case?

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

In this case, Svelte outputs the following CSS:

```css
ul.svelte-1pr62yn li span.svelte-1pr62yn {
  font-size: 24px;
}
.name.svelte-1pr62yn.svelte-1pr62yn {
  font-size: 18px;
}
```

Woah! Svelte transformed the 3-part selector the same way, but added the hash class _twice_ to the `.name` selector! Why would it do that?

This traces back to a concept called _CSS specificity_. [Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity) is how the browser determines what CSS rules should take precedence over another. In general, certain types of CSS selectors are more specific and thus have higher priority than others. For instance, a class selector (like `.list`) is more specific than an element selector (like `ul`). Also, the amount of each type of selector matters. The more of a type of a selector in a given CSS rule, the more specific it is. So, a selector with two classes will be more specific than a selector with one class.

I'm drastically over-simplifying things (specificity can support an entire blog post in itself!), so check out [web.dev's CSS Course](https://web.dev/learn/css/specificity/) for more details.

So, the reason Svelte adds two class selectors instead of one is to keep the specificity order intact. Before the scoping classes were added, the selectors had the following specificity order (from highest to lowest):

1. `.name` (specificity 0-1-0)
1. `ul li span` (specificity 0-0-3)

But after the classes were added the specificity changed. Here's what the specificity would've been if Svelte **didn't** add the hash class twice:

1. `ul.svelte li span.svelte` (specificity 0-2-3)
1. `.name.svelte` (specificity 0-2-0)

Because multi-part selectors have two classes added in the generated styles and single selectors only have one, the specificity order of the selectors changed. This means that different styles are applied than what you'd get if you wrote this component outside of Svelte.

Svelte fixes this in an interesting way. It keeps track of what the maximum number of classes it added to a CSS rule is, and it makes sure all selectors have their specificity increased by that same amount. Since `.name` only had one scoping class applied, Svelte adds a second to make sure that the specificity order stays the same:

1. `.name.svelte.svelte` (specificity 0-3-0)
1. `ul.svelte li span.svelte` (specificity 0-2-3)

So one issue is fixed, but another is introduced. What if you rely on an external stylesheet that you also want to apply to your component? (e.g. `a[href]` or `a:hover` should beat `a`)

You can

- artificially increase specificity
- is there a way to prevent Svelte from doing this? Possibly detect if specificity order changed... but could get less predictable.
- example

Something about global here?

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

Related issues

- https://github.com/sveltejs/svelte/issues/4374 (duplicate classes added)
- https://github.com/sveltejs/svelte/issues/1277 (original specificity bug)
- https://github.com/vuejs/vue-loader/issues/1091 (related Vue issue)
