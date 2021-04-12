---
title: Solving the Tower of Hanoi with recursive Svelte templates
date: '2021-04-12'
tags:
  - svelte
socialImage: 'https://geoffrich.net/images/social/svelte-tower-of-hanoi.png'
---

The [Tower of Hanoi](https://en.wikipedia.org/wiki/Tower_of_Hanoi) is a classic mathematical puzzle that is often used as an introduction to recursion. We can express a solution to this problem only using Svelte's template syntax.

## What is the Tower of Hanoi?

The Tower of Hanoi asks you to move a stack of disks from one rod to another. The disks have different diameters and begin with the largest disk on the bottom and the smallest disk on top. There are three rules:

1. You can only move one disk at a time.
2. Only the top disk on a stack can be moved.
3. You can't place a larger disk on top of a smaller disk.

To make this possible, a third intermediate rod is available to place disks on.

You may have encountered this problem in computer science curriculum, where it is used to introduce [recursion](<https://en.wikipedia.org/wiki/Recursion_(computer_science)>), i.e. a function calling itself.

We can make our Svelte templates recursive using the `<svelte:self>` element.

## The `<svelte:self>` element

You can include a Svelte component recursively using the [`<svelte:self>` element](https://svelte.dev/docs#svelte_self). A common use for this element is a comment thread, e.g. on the [Svelte Hacker News clone](https://hn.svelte.dev/).

Since using the element by itself without any conditions causes an infinite loop, the Svelte compiler requires you to place `<svelte:self>` inside an if or each block, or inside a slot passed to a component.

For example, this would not compile because there is no point where the component will stop rendering itself.

```svelte
<script>
	export let count;
</script>

<p>Count: {count}</p>
<svelte:self count={count - 1}/>
```

Adding an if statement to the above example will stop the recursion once `count` gets to zero.

```svelte
<script>
	export let count;
</script>

{#if count > 0}
	<p>Count: {count}</p>
	<svelte:self count={count - 1}/>
{/if}
```

You can check out the [Svelte tutorial](https://svelte.dev/tutorial/svelte-self) for another example of svelte:self in action.

Even with the compiler safeguards, you still need to be careful with the svelte:self element. You can place it inside an if statement and still cause an infinite loop. For example, incrementing `count` in the above component will result in an infinite loop since count will never be less than zero. Svelte will compile this component without issue, but rendering it in the browser will result in a ["too much recursion" error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Too_much_recursion) logged to the console. Just because it compiles doesn't mean it's safe!

## Writing a solution

With the `<svelte:self>` element added to our toolbelt, let's use it to solve the Tower of Hanoi.

A traditional recursive JavaScript implementation of the Tower of Hanoi looks like this:

```js
function tower(disk, source, intermediate, destination) {
  if (disk === 1) {
    console.log(`move disk ${disk} from ${source} to ${destination}`);
  } else {
    tower(disk - 1, source, destination, intermediate);
    console.log(`move disk ${disk} from ${source} to ${destination}`);
    tower(disk - 1, intermediate, source, destination);
  }
}
```

To move 3 disks from Tower A to Tower C, with Tower B acting as an intermediate, you call it like so:

```js
tower(3, 'Tower A', 'Tower B', 'Tower C');

/*
logs the following:
move disk 1 from Tower A to Tower C
move disk 2 from Tower A to Tower B
move disk 1 from Tower C to Tower B
move disk 3 from Tower A to Tower C
move disk 1 from Tower B to Tower A
move disk 2 from Tower B to Tower C
move disk 1 from Tower A to Tower C
*/
```

A full explanation of the algorithm is outside of the scope of this post. Check out this post on [Free Code Camp](https://www.freecodecamp.org/news/analyzing-the-algorithm-to-solve-the-tower-of-hanoi-problem-686685f032e3/) for an in-depth explanation.

Instead of a function that recursively calls itself, we can write this as a Svelte component that recursively renders itself. Note that we are able to use svelte:self because it is inside an else block.

```svelte
<!-- Tower.svelte -->
<script>
	export let disk, source, intermediate, destination;
</script>

{#if disk === 1}
<li>Move disk {disk} from {source} to {destination}</li>
{:else}
<svelte:self disk={disk - 1} source={source} intermediate={destination} destination={intermediate} />
<li>Move disk {disk} from {source} to {destination}</li>
<svelte:self disk={disk - 1} source={intermediate} intermediate={source} destination={destination} />
{/if}
```

Each line of the function directly translates to Svelte template syntax. `if` and `else` translate to if/else blocks, `tower()` becomes `<svelte:self>`, and instead of `console.log`, we render a list item.

Our component can be used like so:

```svelte
<ol>
	<Tower disk=3 source="Tower A" intermediate="Tower B" destination="Tower C" />
</ol>

<!-- Renders
1. Move disk 1 from Tower A to Tower C
2. Move disk 2 from Tower A to Tower B
3. Move disk 1 from Tower C to Tower B
4. Move disk 3 from Tower A to Tower C
5. Move disk 1 from Tower B to Tower A
6. Move disk 2 from Tower B to Tower C
7. Move disk 1 from Tower A to Tower C
-->
```

You can see this component in action in the [Svelte REPL](https://svelte.dev/repl/5fd3847e93d94ee2b3aee8258889b3fb?version=3.37.0). The code is also available on [GitHub](https://github.com/geoffrich/svelte-hanoi).

While this is not the most efficient way to solve the puzzle, it shows the power of Svelte's template syntax.
