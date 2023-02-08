---
title: How to use Svelte's style directive
date: '2022-01-30'
tags:
  - svelte
socialImage: 'https://geoffrich.net/images/social/style-directives.png'
metaDesc: 'Writing more maintainable and optimized dynamic styles with the style directive.'
syndication:
  - https://twitter.com/geoffrich_/status/1488172725105352706
  - https://www.reddit.com/r/sveltejs/comments/sh2qnc/how_to_use_sveltes_style_directive/
---

Svelte 3.46 released a new feature: [style directives](https://svelte.dev/docs#template-syntax-element-directives-style-property)! In this post I'll show you how to use them and the advantages they have over setting the `style` attribute directly.

## The style attribute

A common strategy for writing dynamic styles in Svelte is to apply the styles directly as an attribute. For example, here's how you can make a [box move around](https://svelte.dev/repl/4c7b90f3872b417f9bbf78cfd4570e8e?version=3.46.3) the screen with a couple of range sliders.

```svelte
<script>
  let xPos = 50;
  let yPos = 50;
</script>

<label for="positionX">X </label>
<input id="positionX" type="range" bind:value="{xPos}" />

<label for="positionY">Y </label>
<input id="positionY" type="range" bind:value="{yPos}" />

<div class="box" style="left: {xPos}%; top: {yPos}%">
  ({xPos}, {yPos})
</div>

<style>
  .box {
    height: 80px;
    width: 80px;
    background: pink;
    position: absolute;
  }
</style>
```

The key part here is `style="left: {xPos}%; top: {yPos}%"` on the div, which takes the `xPos` and `yPos` state variables and sets the element's styles accordingly.

This works well, but can get awkward as you add more properties, especially if those properties are conditionally applied. For instance, look at the following example from the [style directive RFC](https://github.com/sveltejs/rfcs/blob/master/text/0008-style-directives.md#motivation):

```svelte
<div
  style="
    position: {position};
    {position === 'absolute' ? 'top: 20px;' : ''}
    {pointerEvents === false ? 'pointer-events: none;' : ''}
  "
></div>
```

It would be easy to forget a semicolon or mishandle a ternary statement and break your dynamic styles. Enter: style directives! 🕺

## Style directives

In Svelte, a _style directive_ is an attribute applied to an element in the format `style:property={value}`, where _property_ is a CSS property name and _value_ is the value of that property. By using style directives, you don't need to worry about properly formatting the CSS string, since you set individual properties instead. If you're using Svelte 3.46 or later, the above example can be rewritten like so to use style directives:

```svelte
<div
  style:position="absolute"
  style:top={position === 'absolute' ? '20px' : null}
  style:pointer-events={pointerEvents ? null : 'none'}
></div>
```

And the sliding box example can be written like this:

```svelte
<div class="box" style:left="{xPos}%" style:top="{yPos}%">
  ({xPos}, {yPos})
</div>
```

This is about the same amount of code, but is easier to understand and less prone to errors from writing an invalid CSS string.

You can use style directives with _any_ CSS property, including CSS custom property definitions.

```svelte
<div style:--super-cool-custom-property="orange"></div>
```

There's also a shorter syntax available if your variable has the same name as the CSS property you're setting. The below two are equivalent:

```svelte
<div style:color={color}></div>
<div style:color></div>
```

In the case when the `style` attribute and style directive set the same properties, the style directive will take precedence.

```svelte
<div style="margin-top: 1rem; color: red" style:color="blue">
  I will have 1rem top margin and my color is blue.
</div>
```

## Style optimizations

By using style directives, you also make sure that Svelte will update the element's styles in an optimal way. This was also possible with the `style` attribute, but it was easy to accidentally opt-out of the optimization.

Let's look again at the sliding box example.

```svelte
<div class="box" style="left: {xPos}%; top: {yPos}%">
  ({xPos}, {yPos})
</div>
```

When you compile this component, it turns into two calls to [setProperty](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/setProperty):

```js
div.style.setProperty('left', xPos + '%');
div.style.setProperty('top', yPos + '%');
```

(If you're ever curious what your Svelte component code turns into, the "JS output" tab of the [REPL](https://svelte.dev/repl) is a great place to start.)

Svelte performs some clever optimization here and will _only_ set the property that changes. So, if only `xPos` changes, Svelte will only call `setProperty('left', xPos + '%')`, and not update `top`. This makes the style updates more efficient.

However, when using the `style` attribute, it is easy to accidentally opt-out of this optimization. If you construct the style attribute outside of the template, Svelte can't easily determine how to optimize it and won't try. Instead, it will set the _entire style attribute_ when either variable is updated. So given this code...

```svelte
<script>
	let xPos = 50;
	let yPos = 50;

	$: boxStyle = `left: ${xPos}%; top: ${yPos}%`;
</script>

<div class="box" style={boxStyle}>
	({xPos}, {yPos})
</div>
```

...Svelte won't set `left` and `top` individually, and instead sets the entire style attribute every time `xPos` or `yPos` changes:

```js
div.setAttribute(style, boxStyle);
```

Per [the original PR](https://github.com/sveltejs/svelte/pull/810) that added this optimization, this will almost always be slower than setting the individual properties. So, it's better to construct the style attribute directly in the template so that Svelte can optimize it.

However, with style directives, you don't need to think about any of this! Since each style directive corresponds to a single CSS property, it's easy for Svelte to make those same optimizations, even if the value comes from the `<script>` block.

```svelte
<script>
	let xPos = 50;
	let yPos = 50;

	$: left = `${xPos}%`;
	$: top = `${yPos}%`;
</script>

<!-- This is optimized the same way as the original example -->
<div class="box" style:left style:top>
	({xPos}, {yPos})
</div>
```

By using style directives, you make sure that your dynamic styles are applied in an optimized way without needing to think about it.

## Limitations

Style directives are great, but they have a few limitations.

**Exclusive to elements:** Like most Svelte directives (with the exception of `on:`), this does not work on components. There is [an open RFC](https://github.com/sveltejs/rfcs/pull/60) to allow forwarding directives to components, which would include style directives. However, this RFC has not been accepted at time of writing.

**Shorthand only works with dash-less properties:** Since the property used in the style directive uses the same name as the equivalent CSS property, you can't use the shorthand with properties that contain a dash. This is because you can't use `-` in a JavaScript variable (e.g., you can't declare a variable with the name `border-color`).

```jsx
<!-- This is valid -->
<div style:border-color={borderColor></div>
<!-- This is not valid -->
<div style:border-color></div>
```

**No camel case:** Some comments on the original RFC suggested allowing the camel-cased property as well (e.g. `style:borderColor`), but that suggestion was not accepted. The [reasoning was](https://github.com/sveltejs/rfcs/pull/42#issuecomment-742110296) that it's more consistent with the rest of Svelte. For example, you need to do the same with class directives:

```jsx
<div class:is-active={isActive}>
```

**No style object:** [Unlike React](https://reactjs.org/docs/dom-elements.html#style), you can't pass an object of styles to the style attribute: it needs to be a string. If you do want to do this, it would be fairly simple to [solve in userland](https://github.com/sveltejs/rfcs/pull/42#issuecomment-744560265).

## Should you use the style directive for everything?

You shouldn't use style directives for all of your component styles. I would avoid using it if your styles are purely static. For example, there is no need to use style directives on the following component:

```svelte
<div class="box" style:background-color="red" style:height="100px"></div>
```

It would be better to put these styles in the style block of the component instead:

```svelte
<div class="box"></div>

<style>
	.box {
		background-color: red;
		height: 100px;
	}
</style>
```

This is better for performance, since everything in `<style>` is compiled to pure CSS without using any JavaScript to apply the styles. I would only use the style attribute and style directives for styles where the values are changing or are supplied from outside the component.

## Wrapping up

This feature doesn't enable anything you couldn't do before, but it's a nice bit of syntactic sugar that helps ensure your inline styles are optimized. Go forth and style!
