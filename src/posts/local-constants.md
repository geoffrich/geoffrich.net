---
title: Local constants in Svelte with the @const tag
date: '2022-03-06'
tags:
  - svelte
socialImage: 'https://geoffrich.net/images/social/local-constants.png'
---

[Style directives](https://geoffrich.net/posts/style-directives/) weren't the only new feature introduced in Svelte 3.46! Let's take a look at the other recent addition to Svelte: [the @const tag](https://svelte.dev/docs#template-syntax-const).

## The problem

Let's say you're displaying a list of boxes and calculating their areas, and also want to apply some styling when the area is a certain amount. You might think of doing something like this:

```svelte
<script>
  let boxes = [
    {width: 1, height: 2},
    {width: 5, height: 2.5},
    {width: 2, height: 4}
  ];
</script>

{#each boxes as box}
  <p class:big={box.width * box.height > 10}>
    {box.width} * {box.height} = {box.width * box.height}
  </p>
{/each}

<style>
  .big {
    font-size: 2rem;
  }
</style>
```

Note that we compute `box.width * box.height` twice &mdash; once to display it, and once in the `class:big` directive. Even though the value hasn't changed, the browser still has to compute it twice. While this isn't an issue with a simple calculation like this, it could impact performance if the calculation was more intensive. It also introduces duplication into the code. If you needed to use the area more times (e.g. to apply different CSS classes), it would further compound these issues.

(As an aside, this is only a problem because we're inside an #each block. If there was only a single box, we could compute the area once in the script block and be done with it.)

Before the const tag was introduced, there were a few ways to work around this issue. You could create a helper function to compute the value...

```svelte
<script>
  let boxes = [
    {width: 1, height: 2},
    {width: 5, height: 2.5},
    {width: 2, height: 4}
  ];

  function area(box) {
    return box.width * box.height;
  }
</script>

{#each boxes as box}
  <p class:big={area(box) > 10}>
    {box.width} * {box.height} = {area(box)}
  </p>
{/each}
```

This reduces the duplication, but it will still perform the computation multiple times unless you implement some form of [memoization](https://kyleshevlin.com/memoization). Again, this is likely not a concern for a simple calculation like area, but it would be for more expensive calculations.

You could also create a new array that pre-computes the property you want...

```svelte
<script>
  let boxes = [
    {width: 1, height: 2},
    {width: 5, height: 2.5},
    {width: 2, height: 4}
  ];

  let mappedBoxes = boxes.map(b => {
    return {
      ...b,
      area: b.width * b.height
    };
  });
</script>

{#each mappedBoxes as box}
  <p class:big={box.area> 10 }>
    {box.width} * {box.height} = {box.area}
  </p>
{/each}
```

This works, but feels a little awkward, and now you have to loop over the array multiple times. In a large component, you'd also have to jump between the template where the variable is used and the script where it's defined when making changes.

One final option is to extract a new component...

```svelte
<script>
  import Box from './Box.svelte';
  let boxes = [
    {width: 1, height: 2},
    {width: 5, height: 2.5},
    {width: 2, height: 4}
  ];
</script>

{#each boxes as box}
  <Box {box}></Box>
{/each}

<!-- Box.svelte -->
<script>
  export let box;

  $: area = box.width * box.height;
</script>

<p class:big={area > 10}>
  {box.width} * {box.height} = {area}
</p>
```

... but this seems like overkill for such a simple use-case.

Before Svelte 3.46, you would need to choose one of these options. Now, there's an additional solution: [local constants](https://svelte.dev/docs#template-syntax-const).

## The solution: local constants

Instead of adding logic to the script block, you can declare a constant directly in the markup itself with `@const`.

```svelte
{#each boxes as box}
  {@const area = box.width * box.height}
  <p class:big={area > 10}>
    {box.width} * {box.height} = {area}
  </p>
{/each}
```

This is more readable, since the value is declared directly where it is used, and more efficient, since it only computes the value once.

The name “const” was chosen because it behaves like a constant: it is read-only and can't be assigned to. Also, like the native JavaScript `const`, it is scoped to the block it was declared in. The following template produces compiler errors:

```svelte
{#each boxes as box}
  {@const area = box.width * box.height}
	<!-- Error: 'area' is declared using {@const ...} and is read-only -->
	<p on:hover={() => area = 50}>
		{box.width} * {box.height} = {area}
	</p>
{/each}
<!-- 'area' is not defined -->
{area}
```

Despite the similarity to the JavaScript keyword, there is no corresponding `let` or `var` tag. Also, unlike `const` in JavaScript, variables declared with `@const` can be used before they are declared. The following example is valid, despite `area` being used before it's declared with `@const`.

```svelte
{#each boxes as box}
  <p>
    {box.width} * {box.height} = {area}
  </p>
  {@const area = box.width * box.height}
{/each}
```

## Destructuring inside #each

`@const` will also make it easier to [destructure](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) objects inside #each blocks. Currently, you can destructure a variable inside an #each block like this:

```svelte
{#each boxes as {width, height}}
  <p>{width} * {height} = {width * height}</p>
{/each}
```

However, once you do that, you don't have a reference to the original object any more. If you want to use the original object (e.g. to pass to another component), you need to recreate it.

{% raw %}

```svelte
{#each boxes as {width, height}}
  <p>{width} * {height} = {width * height}</p>
  <Box box={{width, height}} />
{/each}
```

{% endraw %}

If properties are added or removed from the original object, you need to keep this second object up-to-date as well. This can be easy to forget.

Now you can destructure the object with `@const`, while keeping a reference to the original object.

```svelte
{#each boxes as box}
  {@const { width, height } = box}
  <p>{width} * {height} = {width * height}</p>
  <Box box={box} />
{/each}
```

It takes an extra line, but it means that you don't need to introduce a duplicate object.

## Improving readability

Using `@const` can also improve the readability of your code by letting you name a variable for what would otherwise be an inline expression. For example:

```svelte
<!-- Option 1: long, complex inline expression -->
{#each boxes as box}
  {#if box.width < 30 && box.width > 10 && box.height % 3 === 0}
  <!-- Do some conditional rendering... -->
  {/if}
{/each}

<!-- Option 2: extract into a local constant -->
{#each boxes as box}
  {@const boxFitsTheRoom = box.width < 30 && box.width > 10 && box.height % 3 === 0}
  <!-- The expression is named, which can help
    others understand the purpose of this code -->
  {#if boxFitsTheRoom}
  <!-- Do some conditional rendering... -->
  {/if}
{/each}
```

While there's no need to do this for _every_ if statement, it can make your code much more understandable when you have lengthy inline expressions.

## Limitations

The new tag does have a few limitations.

**Only allowed in certain contexts**: `@const` is only allowed as a direct child of `{#each}`, `{:then}`, `{:catch}`, `<Component />` or `<svelte:fragment />`. These are all block types where a new scope is created. You can't use it by itself at the top level of a template or inside an `{#if}` / `{:else}` block, though the latter does have an [open feature request](https://github.com/sveltejs/svelte/issues/7241).

**Doesn't support non-standard JavaScript:** because JavaScript expressions inside the markup section of a Svelte component are [not preprocessed](https://github.com/sveltejs/svelte/issues/4701), you won't be able to write expressions in a const tag that use non-standard JavaScript (e.g. TypeScript or syntax that requires Babel plugins).

Also note that at time of writing there are **still some open bugs** around this feature:

- Fix rvalue error when using arrow functions in {@const} [#7206](https://github.com/sveltejs/svelte/issues/7206)
- @const declaration inside components ignored [#7189](https://github.com/sveltejs/svelte/issues/7189)
- Unclear error message comes if const is already declared in &#60;script&#62; section [#7221](https://github.com/sveltejs/svelte/issues/7221)
- Object property access in callbacks within @const statements are being treated as separate variables [#7326](https://github.com/sveltejs/svelte/issues/7326)

## Wrapping up

I've already found `@const` to be [very useful](https://github.com/geoffrich/generative-svg-grid/blob/0e3384cebfd42935f687ce8c69a0e495e19d6a1b/src/lib/Grid.svelte#L45-L57) to improve the readability of my code. Keep it in mind next time you're writing Svelte!

The [original RFC](https://github.com/sveltejs/rfcs/pull/33) is well worth a read for some different perspectives on whether introducing this tag is a good idea or not. It's also interesting in context of RFCs [#32](https://github.com/sveltejs/rfcs/pull/32) (local &#60;style scoped&#62;) and [#34](https://github.com/sveltejs/rfcs/pull/34) (inline components). Taken together, these RFCs would allow including multiple components inside a single file. However, at time of writing, only #33 (local constants) has been accepted.
