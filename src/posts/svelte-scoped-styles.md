---
title: How Svelte scopes component styles
date: '2021-08-24'
tags:
  - svelte
  - css
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

This is powerful because it means you don't have to worry about accidentally styling anything outside the component, your selectors can be more generic.

But how does this scoping actually work? In this post, I'll get into the nitty-gritty of how your styles are scoped to your component, and the implications that has on the rest of your app.

This post is accurate for the Svelte version at time of writing (v3.42.4). However, the implementation of Svelte's style scoping could change at a later date, so this post may not stay accurate.

## Classing up the joint

When working on a Svelte app, you may have inspected the rendered markup and see some CSS classes you didn't add. Why are those there? Svelte applies those classes to styled elements in your app so that styles you write in that component don't "leak out" to elements outside the component.

For example, the component above is transformed into the following.

```html
<p class="svelte-dvinuz">This is a paragraph with scoped styles.</p>

<style>
  p.svelte-dvinuz {
    color: green;
  }
</style>
```

This rule won't apply to `<p>` elements outside of the component, because they won't have the CSS class `svelte-dvinuz`. Only elements inside the component will have that component's special class applied, and thus match the selector in the generated styles.

The `svelte-dvinuz` class is not random. It is generated using a hash of the component's styles so it is unique for every component (unless two components styles are **exactly** the same).

## More complex rules

Let's look at what happens when the CSS rules become more complicated. The following component uses a [descendant combinator](https://developer.mozilla.org/en-US/docs/Web/CSS/Descendant_combinator). This is not strictly necessary in this example case (you could simply target `span`), but it's useful for illustration.

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

One option is to only apply the scoping class to the first selector in the rule, so the rules become `ul.svelte li` and `ul.svelte li span`. However, this could cause unwanted style leakage. If this component contained child components, elements in those components could match the rule.

Another option is to apply the scoping class to every selector in the rule, so the rules would become `ul.svelte li.svelte` and `ul.svelte li.svelte span.svelte`. This _would_ prevent any styles from leaking to child components, but it does add the class more times than is necessary. It would also unnecessarily increase specificity, a problem we'll return to later.

What Svelte actually does is somewhere in the middle: it applies the scoping class to the first and last selector of each rule. The styles are transformed to the following:

```css
ul.svelte-gxa857 li.svelte-gxa857 {
  font-size: 18px;
}
ul.svelte-gxa857 li span.svelte-gxa857 {
  font-size: 24px;
}
```

This is the best of both worlds: styles don't leak out (because the rule must start and end inside the component), and we don't add more classes than necessary.

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

Woah! Svelte transformed the 3-selector rule the same way, but added the hash class _twice_ to the `.name` rule! Why would it do that?

This traces back to a concept called _CSS specificity_. [Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity) is how the browser determines what CSS rules should take precedence over others. In general, certain types of CSS selectors are more specific and thus have higher priority. For instance, a class selector (like `.list`) is more specific than an element selector (like `ul`). Also, the amount of each type of selector matters. The more of a type of a selector in a given CSS rule, the more specific it is. So, a selector with two classes will be more specific than a selector with one class.

I'm drastically over-simplifying things (specificity can support an entire blog post in itself!), so check out [web.dev's Learn CSS module](https://web.dev/learn/css/specificity/) for more details.

So, the reason Svelte adds two class selectors instead of one is to keep the specificity order intact. Before the scoping classes were added, the rules had the following specificity order (from highest to lowest):

1. `.name` (specificity 0-1-0)
1. `ul li span` (specificity 0-0-3)

But after the classes were added the specificity changed. Here's what the specificity would've been if Svelte **didn't** add the hash class twice:

1. `ul.svelte li span.svelte` (specificity 0-2-3)
1. `.name.svelte` (specificity 0-2-0)

(For how those specificity values were calculated, see the resources linked above or the [CSS Specificity Calculator](https://specificity.keegan.st/)).

Because multi-selector rules have two classes added in the generated styles and single-selector rules only have one, the specificity order of the rules changed. This would mean that different styles are applied than if you wrote this component outside of Svelte.

Svelte fixes this in an interesting way. It keeps track of what the maximum number of classes it added to a CSS rule is, and it makes sure all rules have their specificity increased by that same amount. Since `.name` only had one scoping class applied, Svelte adds a second to make sure that the specificity order stays the same:

1. `.name.svelte.svelte` (specificity 0-3-0)
1. `ul.svelte li span.svelte` (specificity 0-2-3)

If you're interested in seeing the actual implementation, see [Svelte PR #4146](https://github.com/sveltejs/svelte/pull/4146).

## Specificity wars

Because Svelte's scoping method increases the specificity of your CSS by adding classes, you may run into issues if you have global styles that you expect to be inherited. For instance, let's say you have the following **global** styles (e.g., in an external stylesheet):

```css
a {
  color: purple;
}

a:hover {
  color: green;
}
```

Then, in a Svelte component, you override the default link color:

```svelte
<a href="https://svelte.dev">Svelte homepage</a>

<style>
  a {
    color: red;
  }
</style>
```

What color would you expect the link to be _on hover_?

If you were writing these styles without Svelte's scoping, the link would still be green (as specified in the global styles), since `a:hover` is more specific (0-1-1) than `a` (0-0-1). However, because Svelte added a scoping class, we should really be comparing `a:hover` to `a.svelte`, which have the same specificity. Because the component styles were declared later, `a.svelte` wins and the link is red when hovered.

This problem is exacerbated when Svelte adds multiple scoping classes. If you have a descendant combinator in your component, your `a` selector will be transformed into `a.svelte.svelte` (as explained above), making it even more specific. There's currently an open [Svelte issue](https://github.com/sveltejs/svelte/issues/4374) objecting to this behavior, though it's not clear how to solve it without introducing the original [issue around specificity order](https://github.com/sveltejs/svelte/issues/1277).

Unfortunately, there isn't an easy way to work around scoped styles increasing specificity. If you want your global styles to apply, you'll need to find a way to increase their specificity (e.g. by adding `!important` or [doubling up on classes](https://web.dev/learn/css/specificity/#pragmatically-increasing-specificity)).

There isn't an obvious improvement to be made in the Svelte compiler either&mdash;Svelte needs to add _something_ to the CSS rules to make sure they only apply to a single component, and that will increase the specificity. Perhaps [native CSS scoping](https://drafts.csswg.org/css-scoping-2/#scoped-styles) will help, though the spec is still being drafted. Until then, the cost of Svelte's style scoping is some occasional specificity clashes.

## Wrapping up

I hope this article helped you understand Svelte's CSS scoping behavior better, and maybe even taught you something new. Understanding why the compiler makes the decisions it does can help you write better Svelte components and make debugging easier.

If you're interested in going deeper, consider reading the [Stylesheet implementation](https://github.com/sveltejs/svelte/blob/4f9a260ab17a9d2a013a72a4bca3bf96947062c0/src/compiler/compile/css/Stylesheet.ts) in the Svelte source code&mdash;it's surprisingly readable.
