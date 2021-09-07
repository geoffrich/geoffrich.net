---
title: How Svelte scopes component styles
date: '2021-09-06'
tags:
  - svelte
  - css
socialImage: 'https://geoffrich.net/images/social/svelte-scoped-styles.png'
---

By default, any styles you write in a Svelte component are scoped to that component. This means that the `p` selector in the following code will only apply to `<p>` elements inside this component.

```svelte
<p>This is a paragraph with scoped styles.</p>

<style>
  /* I only affect elements in this component */
  p {
    color: green;
  }
</style>
```

But how does this scoping actually work? In this post, I'll explain how Svelte scopes styles to your components and the implications for global styles in the rest of your app. I think this topic is interesting on its own, but understanding Svelte's scoping method will also help you better debug your component styles.

This post is accurate for the Svelte version at time of writing (v3.42.4). However, the implementation of Svelte's style scoping is subject to change&mdash;in Svelte's lifespan, it has changed [several](https://github.com/sveltejs/svelte/pull/607) [times](https://github.com/sveltejs/svelte/pull/1192) [already](https://github.com/sveltejs/svelte/pull/4146)&mdash;and I don't guarantee that this post will remain accurate.

## Classing up the joint

When working on a Svelte app, you may have seen some unexpected CSS classes beginning with "svelte-" in the DevTools inspector. Why are those there? Svelte applies those classes to styled elements in your app so that component styles don't "leak out" to elements outside the component.

For example, the component in the previous section is transformed into the following.

```html
<p class="svelte-dvinuz">This is a paragraph with scoped styles.</p>

<style>
  p.svelte-dvinuz {
    color: green;
  }
</style>
```

The transformed CSS rule won't apply to `<p>` elements outside of the component, because they won't have the `svelte-dvinuz` CSS class applied. Only elements inside the component will match the scoped CSS rule.

The class Svelte adds is not random. It is generated using a hash of the component's styles, making it unique for every component (unless two components styles are **exactly** the same).

## More complex rules

Let's look at what happens when the CSS rules become more complicated. The following component uses a [descendant combinator](https://developer.mozilla.org/en-US/docs/Web/CSS/Descendant_combinator). This is not strictly necessary in this example case (you could target `span` and `li` directly), but it's useful for illustration.

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

What are the different ways Svelte could transform this component?

One option is to only apply the scoping class to the first selector in the rule, so the rules become `ul.svelte li` and `ul.svelte li span`. However, this could cause unwanted style leakage. If this component contained child components, elements in those components could match the rule.

Another option is to apply the scoping class to every selector in the rule, so the rules would become `ul.svelte li.svelte` and `ul.svelte li.svelte span.svelte`. This _would_ prevent any styles from leaking to child components, but it does add the scoping class more times than is necessary. It would also unnecessarily increase specificity, which is a problem we'll return to later.

What Svelte actually does is somewhere in the middle: it applies the scoping class to the first and last selector of each rule. The styles are transformed to the following:

```css
ul.svelte-gxa857 li.svelte-gxa857 {
  font-size: 18px;
}
ul.svelte-gxa857 li span.svelte-gxa857 {
  font-size: 24px;
}
```

This is the best of both worlds: styles don't leak out (because the rule must start and end inside the component) and we don't add more classes than necessary.

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

This traces back to a concept called _CSS specificity_. [Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity) is how the browser determines what CSS rules should take precedence over others. In general, certain types of CSS selectors are more specific and thus have higher priority. For instance, a class selector (like `.list`) is more specific than an element selector (like `ul`). If both `.list` and `ul` define a value for font-size, the `.list` value will win since it's more specific.

Also, the amount of each type of selector matters. The more of a type of a selector in a given CSS rule, the more specific it is. So, a selector with two classes will be more specific than a selector with one class.

I'm drastically over-simplifying things (specificity can support an entire blog post in itself!), so check out [web.dev's Learn CSS module](https://web.dev/learn/css/specificity/) for more details.

So, the reason Svelte adds two class selectors instead of one is to keep the specificity order intact. Before the scoping classes were added, the rules had the following specificity order (from highest to lowest):

1. `.name` (specificity 0-1-0)
1. `ul li span` (specificity 0-0-3)

But after the classes were added the specificity changed. Here's what the specificity would've been if Svelte **didn't** add the hash class twice:

1. `ul.svelte li span.svelte` (specificity 0-2-3)
1. `.name.svelte` (specificity 0-2-0)

(For how those specificity values were calculated, see the resources linked above or the [CSS Specificity Calculator](https://specificity.keegan.st/)).

Because multi-selector rules have two classes added in the generated styles and single-selector rules only have one, the specificity order of the rules changed. This could mean that different styles take precedence than if Svelte _didn't_ scope the styles. In our example, the name's font size would be 24px (as defined by `ul li span`) instead of 18px (as defined by `.name`)&mdash;the opposite of what you'd expect looking at the raw CSS.

Svelte prevents the specificity order from changing in an interesting way. It keeps track of how many classes are added to each CSS rule, and makes sure each rule has its specificity increased by the same amount. Since `.name` only had one scoping class applied, Svelte adds a second class to preserve the specificity order:

1. `.name.svelte.svelte` (specificity 0-3-0)
1. `ul.svelte li span.svelte` (specificity 0-2-3)

By making sure the specificity order remains the same, the scoped CSS produces the same result as the raw CSS.

If you're interested in seeing how this is implemented in the Svelte compiler, see [Svelte PR #4146](https://github.com/sveltejs/svelte/pull/4146).

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
<a href="https://svelte.dev">Ordinary link</a>
<a class="special-link" href="https://svelte.dev">Exciting link</a>

<style>
  .special-link {
    color: red;
  }
</style>
```

What color would you expect the link to be _on hover_?

If you were writing these styles without Svelte's scoping, the link would be red by default (as specified in the component) but green on hover (as specified in the global styles). This is because `a:hover` is more specific (0-1-1) than `.special-link` (0-1-0). However, because Svelte added a scoping class, we should really be comparing `a:hover` to `.special-link.svelte`, which has a specificity of 0-2-0. Because of this, the `.special-link` styles also apply when the link is hovered, which may be unexpected.

This problem is exacerbated when Svelte adds multiple scoping classes. If Svelte adds two classes to `.special-link`, the component styles will be more specific and even more likely to unintentionally override global styles. Unfortunately, there isn't an easy way to work around this behavior. If you want your global styles to apply in this situation, you'll need to find a way to increase their specificity (e.g. by adding `!important` or [doubling up on classes](https://web.dev/learn/css/specificity/#pragmatically-increasing-specificity)).

There's currently an open [Svelte issue](https://github.com/sveltejs/svelte/issues/4374) objecting to Svelte adding more than one scoping class, though it's not clear how to solve it without re-introducing the original [issue around specificity order](https://github.com/sveltejs/svelte/issues/1277). There isn't an obvious improvement to be made in the Svelte compiler either&mdash;Svelte needs to add _something_ to the CSS rules to make sure they only apply to a single component, and that will increase the specificity. Perhaps [native CSS scoping](https://drafts.csswg.org/css-scoping-2/#scoped-styles) will help, though the spec is still being drafted. Until then, the cost of Svelte's style scoping is some occasional specificity clashes.

## Wrapping up

I hope this article helped you understand Svelte's CSS scoping behavior better. Understanding why the compiler makes the decisions it does can help you write better Svelte components and make debugging easier.

If you're interested in going deeper, consider reading the [Stylesheet implementation](https://github.com/sveltejs/svelte/blob/4f9a260ab17a9d2a013a72a4bca3bf96947062c0/src/compiler/compile/css/Stylesheet.ts) in the Svelte source code&mdash;it's surprisingly readable.
