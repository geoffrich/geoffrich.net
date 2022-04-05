---
title: 4 tips for cleaner Svelte components
date: '2022-04-04'
tags:
  - svelte
socialImage: 'https://geoffrich.net/images/social/clean-component-tips.png'
---

I've helped a few devs at my company get started with Svelte, and I love seeing how easy it is for them to pick it up and start being productive. However, I've noticed a few areas where they write verbose code without realizing that Svelte has a cleaner way to do the same thing.

Drawing on that experience, I've collected four ways to write cleaner and Svelte-ier component code. I think these will be especially helpful if you're new to Svelte, though more experienced devs might learn something too.

## Work with the component template, not against it

When people are new to Svelte (or front-end frameworks in general), sometimes I see them use `querySelector` in their component code like this:

```svelte
<script>
  function handleSubmit() {
    const submitButton = document.querySelector('.submit-button');
    submitButton.disabled = true;
    submitButton.innerText = 'Submitting...';
  }
</script>

<button class="submit-button" on:click="{handleSubmit}">
  Submit
</button>
```

Does it work? Sure. Is it a good idea? **Absolutely not.**

I _think_ this happens because devs see the script tag and assume they should treat it like an inline script in a regular HTML document. But the script block in Svelte isn't just a script tag&mdash;it's a script tag with superpowers. You aren't limited to how you would interact with elements in vanilla JS.

The benefit of using Svelte (and other modern frameworks) is that your template can be driven by your component state. Instead of manually querying for elements, you can instead express that logic directly in your template. Here's how I would rewrite the first example to consolidate the logic inside the template:

```svelte
<script>
  let submitting = false;

  function handleSubmit() {
    submitting = true;
  }
</script>

<button on:click="{handleSubmit}" disabled="{submitting}">
  {submitting ? 'Submitting...' : 'Submit'}
</button>
```

This makes your components much easier to reason about. You can look at the template and understand all the different states a component can be in, instead of trying to track down all the places where you might be updating something in the template.

(In addition, by writing `document.querySelector` you could potentially retrieve an element in a completely different component than what you're working in. Sometimes that's what you want, but usually it's not.)

Because of this, it's a good rule of thumb to avoid using `querySelector`, `querySelectorAll`, or any imperative query methods in your Svelte component. This isn't to say that you should _never_ use them. However, using a feature built-in to Svelte would often be a better solution:

- If you're updating text or attributes of an element inside your component, you should express it in your component template instead of querying for the element.
- If you need a reference to a particular DOM element in your component (which is especially common when integrating vanilla JS libraries), you should first try using `bind:this` or an action.

Only once you've considered and ruled out these methods should you reach for `querySelector`.

## Two-way binding is awesome

If you come to Svelte from React, you might instinctively write your form inputs this way:

```svelte
<script>
  let value = '';

  function handleInput(e) {
    value = e.target.value;
  }
</script>

<label for="name">Name</label>
<input id="name" type="text" value="{value}" on:input="{handleInput}" />

<p>
  The value is {value}
</p>
```

This works, but is considered by many Svelte devs to be too much boilerplate. In Svelte, you can remove a lot of this code by using `bind:value`.

```svelte
<script>
  let value = '';
</script>

<label for="name">Name</label>
<input id="name" type="text" bind:value />

<p>
  The value is {value}
</p>
```

This can significantly reduce the amount of code you write, especially if you have a lot of form inputs. And [less code means fewer bugs.](https://svelte.dev/blog/write-less-code)

You can also use two-way binding [with component props](https://svelte.dev/docs#template-syntax-component-directives-bind-property). You need to be more careful with this kind of binding, since overusing it can make it hard to understand where state is being changed in your application. This is especially true if you use two-way binding across multiple layers of components, since any component in that tree could change the state for every component that's bound to it. But for form elements (and components that wrap form elements), two-way binding is the right choice.

For another perspective on this, see ["How Svelte Makes Two-Way Binding Safe”](https://imfeld.dev/writing/how_svelte_makes_two_way_binding_safe) by Daniel Imfeld.

## Scoped styles let you write slimmer styles

In Svelte, styles are [automatically scoped](https://svelte.dev/tutorial/styling). You can write styles in a component and be assured that they won't leak out and unexpectedly affect another part of the application.

If you're used to working in projects without component-scoped styles, you might be used to writing lengthy class names to ensure that they don't conflict with styles in another part of the application. But in Svelte, you don't need to worry about that!

It's perfectly okay to use shorter, more generic class names like “heading” or “wrapper” in your Svelte component, since you can be confident that those styles won't accidentally apply to an element somewhere else. You can even target HTML tag names like `p` and `button` safely, though whether you should do this depends on the component.

For example, in the following example, I don't need to add a class to the button and paragraph just to style them. Since I want to style all paragraphs and buttons _in this component_, I can just target `p` and `button` directly, and elements outside this component won't be affected.

```svelte
<p>
	Katamari Damacy (lit. 'Clump Spirit') is a
	third-person puzzle-action video game developed
	and	published by Namco for the PlayStation 2.
	It was released in Japan in March 2004 and in North
	America in September 2004.
</p>

<button>
	That's neat!
</button>

<style>
	p {
		border-bottom: 2px solid limegreen;
		padding: 10px;
	}

	button {
		color: hotpink;
		font-size: 20px;
		font-weight: bold;
		background-color: black;
	}
</style>
```

If you're interested in how this scoping works, I did a deep dive on [how Svelte scopes styles](https://geoffrich.net/posts/svelte-scoped-styles/) last year.

## Don't miss out on all of Svelte's syntax sugar

Svelte has a lot of built-in niceties to reduce boilerplate for common tasks. Here are some that you might have overlooked:

- Instead of doing manual string interpolation to add and remove classes or set inline styles, you can use [class:](https://svelte.dev/tutorial/classes) and [style:](https://geoffrich.net/posts/style-directives/).
- Instead of setting up an `input` listener and keeping local state in sync, you can use [bind:value](https://svelte.dev/tutorial/text-inputs). Similarly, instead of wiring up a `change` listener to a group of radio buttons, you can use [bind:group](https://svelte.dev/tutorial/group-inputs).
- Instead of writing the same expression multiple times inside an `#each` block, you can use [@const](https://geoffrich.net/posts/local-constants/)
- Instead of [bind:this and onMount](https://svelte.dev/tutorial/bind-this) when you need a reference to a particular DOM node, you can [use an action](https://blog.logrocket.com/svelte-actions-introduction/)

Either option will functionally produce the same result, but the second involves less code and more readable components (especially if you can get rid of tricky string interpolation).

I recommend giving the [Svelte docs](https://svelte.dev/docs) a full read-through, especially if it's been a while since you went through the tutorial. You might not know what you're missing!

## Wrapping up

It was fun to do a “quick hits” style of article for this. There's a few more tips I'm chewing over, so you might see a follow-up article at some point.

Thanks to everyone who responded to my “common Svelte antipatterns” [thread on Twitter](https://twitter.com/geoffrich_/status/1488955388808421380) (that also somehow devolved into a 🐫 case vs. 🐍 case debate). Go check that out for some other folks' ideas on what makes for cleaner Svelte components!
