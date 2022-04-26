---
title: 'Quick tip: style prop defaults'
date: '2022-04-26'
tags:
  - svelte
socialImage: 'https://geoffrich.net/images/social/style-prop-defaults.png'
metaDesc: 'A few techniques for giving Svelte style props a default value.'
---

Svelte has a built-in solution for component theming using [style props](https://svelte.dev/docs#template-syntax-component-directives---style-props). So, you can use [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) in your component styles...

```svelte
<p>
	I have something important to say.
</p>

<style>
	p {
		border: 2px solid var(--line-color);

		/* Decorative styles */
		padding: 1rem;
		max-width: 60ch;
	}

</style>
```

...and easily set them from outside the component using style props.

```svelte
<TextBox --line-color="mediumspringgreen"></TextBox>
```

But what if you want your style to have a default value? The custom property `var` syntax takes a [second argument](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties#custom_property_fallback_values) that sets a fallback if the property is not defined. So, if you wanted the default border color to be `darkred`, you could do the following.

```css
p {
  border: 2px solid var(--line-color, darkred);
}
```

However, this can get verbose if you want to use `--line-color` in multiple places, with the same fallback. If you want to update the default value, you have to do it multiple places!

```css
p {
  border: 2px solid var(--line-color, darkred);
  text-decoration: underline wavy var(--line-color, darkred) 1px;
}
```

There’s two ways to refactor this to make it less verbose. First, you could introduce another custom property for the default value:

```css
p {
  --line-color-default: darkred;
  border: 2px solid var(--line-color, var(--line-color-default));
  text-decoration: underline wavy var(--line-color, var(--line-color-default)) 1px;
}
```

This makes it so there’s one place to _change_ the default value, but you still have to provide the second argument to `var` every time you reference `--line-color`.

Instead, my recommended approach would be to introduce another custom property that represents _either line-color or the fallback_.

```css
p {
  --_line-color: var(--line-color, darkred);

  border: 2px solid var(--_line-color);
  text-decoration: underline wavy var(--_line-color) 1px;
}
```

So now you have two variables:

- `--line-color` is the user-supplied theme value
- `--_line-color` is what we use in our styles, and will either be the user-supplied value (if defined) or the default color

You can see this in action in this [Svelte REPL](https://svelte.dev/repl/c14650e187bb48e9a3e168b9955268ea?version=3.47.0).

You only need to introduce a variable like `--_line-color` if you plan on using the theme variable multiple places. Otherwise, it’s perfectly fine to set the fallback where you use the property, as in the first example.

The technique on display here is not unique to Svelte, and can be applied anywhere you use custom properties. However, it's of particular interest with Svelte, since custom properties are the recommended way of theming a component.
