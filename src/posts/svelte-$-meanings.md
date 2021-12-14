---
title: The many meanings of $ in Svelte
date: '2021-12-12'
tags:
  - svelte
socialImage: 'https://geoffrich.net/images/social/svelte-$-meanings.png'
metaDesc: 'Svelte uses $ for a lot of different concepts. Here’s how to tell the difference.'
---

If you're writing Svelte code, you'll notice that `$` can have multiple different meanings, depending on the context. For example, look at this code snippet &mdash; `$` is used in three different ways! If you're new to Svelte, or to JavaScript in general, it can be confusing to keep them all straight.

```js
$: console.log(`Total: ${$count}`);
```

In this post, I'll show all the different meanings that `$` can have in Svelte.

First, let's start with the primary uses of `$` in Svelte: reactive statements and reactive stores.

## Reactive statements

In a Svelte component, prefixing a statement with `$:` marks the statement as _reactive_ &mdash; it will run whenever the variables referenced in that statement change. Here's a classic example. Whenever `num` changes, `doubled` is automatically set to the correct value.

```svelte
<script>
	let num = 0;
	$: doubled = num * 2;
</script>

<p>Num: {num}</p>
<p>Doubled: {doubled}</p>
<button on:click={() => num++}>
	Increment
</button>
```

It's also possible to have an entire reactive block that runs when the variables referenced inside it change.

```svelte
<script>
  let num = 0;
  let doubled = 0;
  $: {
    doubled = num * 2;
    console.log(num, doubled);
  }
</script>
```

This is a core concept of Svelte. If you're not familiar with it, go review the section of the Svelte tutorial on [reactivity](https://svelte.dev/tutorial/reactive-declarations).

This is valid JavaScript, since it uses the obscure [label](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label) syntax. However, its reactive properties are unique to Svelte, and specifically to Svelte components. Using this syntax inside a regular `.js` file will not make a statement reactive.

Since this is a valid label, you can exit a reactive block early the same way you'd [break out of a regular label](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label#using_a_labeled_break_statement). This example will keep track of the number of evens, but only until the counter reaches 10. At that point, `break $` will exit the block early.

```svelte
<script>
	let counter = 0;
	let evens = 0;

	$: {
		if (counter > 10) {
			break $;
		}
		if (counter % 2 === 0) {
			evens++;
		}
	}
</script>

<button on:click={() => (counter++)}>
	Increment
</button>
<p>
	Counter: {counter}, evens before 10: {evens}
</p>
```

You won't need to use this very often, but it's useful to know about.

## Accessing store values

The other primary use of `$` you'll see in a Svelte component is when referencing the current value of a store. In Svelte, a [store](https://svelte.dev/tutorial/writable-stores) is any object with a `subscribe` method that allows you to be notified when the value of the store changes. It's especially useful when you want a reactive value to be accessible from muliple components in your application, since the store can live outside of a Svelte component.

If you wanted to get the current value of a store in a Svelte component and have it automatically update when the store changes, you could do something like the following.

```svelte
<script>
  import count from './count';
  import {onDestroy} from 'svelte';

  let _count;

  const unsubscribe = count.subscribe(val => (_count = val));
  onDestroy(() => {
    unsubscribe();
  });
</script>
```

This code subscribes to the `count` store, updates the local `_count` variable when the store changes, and unsubscribe from the store when the component is destroyed. However, this is a lot of boilerplate.

Thankfully, Svelte has a special syntax to make this sort of thing easy. Inside a Svelte component, we can reference the current value of the `count` store with the variable `$count`. By using this syntax, Svelte will take care of subscribing and unsubscribing to the store for us.

As with reactive declarations, this syntax only works inside a Svelte component. In regular JS files, you'll need to subscribe to the store manually.

### Comparing reactive statements and reactive stores

Those are the two primary ways `$` is used inside Svelte. If the dollar sign has a colon after it (`$:`), then it indicates a [reactive statement](https://svelte.dev/docs#3_$_marks_a_statement_as_reactive). If it is at the start of a variable name inside a Svelte component, then it's [accessing a reactive store value](https://svelte.dev/docs#4_Prefix_stores_with_$_to_access_their_values). In general, when you see `$` in a Svelte component, you should think _reactivity_.

Note that there are often times where you'll want to combine the two. Referencing a store value in the `<script>` block with `$` does _not_ mean that value will automatically be updated when the store changes. In the following example, `doubledCount` will not be automatically updated unless you mark that assignment as reactive with `$:`.

```svelte
<script>
	// count is a store
	import count from './count';

	// doesn't keep value updated
	let doubledCount = $count * 2;

	// keeps value updated
	$: doubledCount = $count * 2;
</script>
```

This could seem unintuitive &mdash; didn't I just say that a store is reactive? Yes, but it's only reactive in that _we can be notified any time the value changes_. If we want to derive a value from it, we still need to mark that statement as reactive as well.

This is a little difficult to wrap your head around, so see this alternate explanation in [r/sveltejs](https://www.reddit.com/r/sveltejs/comments/r6j9r4/i_still_dont_get_this_and_need_an_eli5/hmy13ud/) if you're still having trouble.

However, those are not the only times you'll see `$` in a Svelte component. `$` is used in other ways, both in Svelte and in vanilla JavaScript in general. Let's go over a few more examples.

## Template literals

This is not Svelte-specific, but is worth mentioning, since it's a common technique in modern JavaScript. When writing [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) in JavaScript, you can use `${var}` to insert the value of a variable into the template string.

```js
let a = 'running';
let b = 'walking';
// both output "running and walking"
console.log(a + ' and ' + b); // without template literals
console.log(`${a} and ${b}`); // with template literals
```

Where this could get confusing is if you combine template literals with reactive statements and stores! Make sure you can pick out what each `$` means in the below example.

```svelte
<script>
  import {writable} from 'svelte/store';
	let num = 0;
	let count = writable(0);

	$: console.log(`num is ${num} and the store is ${$count}`);
</script>
```

## $$props, $$restProps, and \$\$slots

These are globally-available variables inside a Svelte component. `$$props` contains all the props passed to the component, `$$restProps` contains all the props that were not explicitly exported by the component (which useful for wrapping native HTML elements like `<input>`), and `$$slots` contains the slots passed to the component. Here, \$\$ doesn't indicate that this is a store value; it's just a naming convention.

In fact, their naming mirrors how Svelte names things internally. For example, if you look at the code Svelte generates, you'll see reference to similarly-named variables like `$$self` and `$$invalidate`.

```js
function instance($$self, $$props, $$invalidate) {
  let name = 'world';
  const click_handler = () => $$invalidate(0, (name += 'a'));
  return [name, click_handler];
}
```

The [client-side component API](https://svelte.dev/docs#Client-side_component_API) also prefixes its methods with `$` to avoid colliding with methods defined on the component instance.

## Creating a derived store

When creating a [derived store](https://svelte.dev/docs#derived), it is common to prefix the values of the store in the derived callback with `$`. You'll see this in the derived store examples in the Svelte docs.

```js
import {derived} from 'svelte/store';

const doubled = derived(a, $a => $a * 2);
```

This is not required and does not indicate anything special &mdash; it works the same in and out of Svelte components. It just provides an easy way to distinguish the variable in the callback (which has the updated value of the store) and the reference to the store itself.

## Wrapping up

While it might seem difficult to keep track of all these at first, given enough experience you'll get the hang of it. It's most important to understand the difference between the first three examples. You're less likely to encounter the others until you reach more advanced scenarios.
