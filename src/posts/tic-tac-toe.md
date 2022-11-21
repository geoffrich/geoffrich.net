---
title: Building tic-tac-toe with Svelte
date: '2022-11-20'
tags:
  - svelte
socialImage: 'https://geoffrich.net/images/social/tic-tac-toe.png'
---

I recently came across [Advent of Vue](https://adventofvue.com/), which looks like they'll have some fun front-end challenges for December. While they're Vue-focused, I assume any front-end tech should work. I'll be attempting them with Svelte & SvelteKit.

They sent out an early challenge to recreate the game tic-tac-toe. [Here's the solution](https://advent-of-sveltekit-2022.vercel.app/day/0) I came up with. The [code is on GitHub](https://github.com/geoffrich/advent-of-sveltekit-2022/tree/main/src/routes/day/0), and I'll briefly explain it below. While building tic-tac-toe may seem simple, there are some interesting wrinkles, especially with regards to accessibility.

## Rendering the board

I represented the board as a 3x3 array.

```ts
let board = [
  [Move.Empty, Move.Empty, Move.Empty],
  [Move.Empty, Move.Empty, Move.Empty],
  [Move.Empty, Move.Empty, Move.Empty]
];
```

Each item in the array is a TypeScript enum - either `Empty` if the space is empty, or `X` or `O` if the space is occupied.

```ts
enum Move {
  X = 'X',
  O = 'O',
  Empty = ''
}
```

In the template, we iterate over this array using `#each` loops.

```svelte
{#each board as row, r}
    {#each row as col, c}
        <div class="cell">
            {#if col !== Move.Empty}
                <Icon move={col} />
            {:else}
                <EmptyCell on:click={() => place(r, c)} disabled={state !== State.Playing}>
                    <span class="visually-hidden">Place row {r + 1} column {c + 1}</span>
                </EmptyCell>
            {/if}
        </div>
    {/each}
{/each}
```

The `<EmptyCell>` is its own component for easier colocation of styles, but it's essentially a `<button>`. It represents an empty space on the board that the player can place their token on.

It's important that we use a `<button>` here. This helps ensure that people can interact with it even if they're using a keyboard or other assistive technology - a `<div on:click>` would [not be the same](https://benmyers.dev/blog/clickable-divs/).

```svelte
<script>
	export let disabled = false;
</script>

<button on:click {disabled}>
	<slot />
</button>

<style>
	button {
		width: 100%;
		height: 100%;
		appearance: none;
		border: none;
		background: none;
		border-radius: var(--border-size-3);
	}

	button:hover,
	button:focus-visible {
		background-color: var(--gray-2);
		box-shadow: var(--shadow-3);
		cursor: pointer;
	}

	button:focus-visible {
		outline: solid var(--svelte);
	}

	button:disabled {
		cursor: not-allowed;
	}
</style>
```

Note the `on:click` - this instructs Svelte to [forward the event](https://svelte.dev/tutorial/event-forwarding) so we can listen to the click event on the parent `<EmptyCell>` component.

Also, since we use a `<slot>`, the content inside `<EmptyCell>` will be placed inside the component's `<button>` element.

```svelte
<EmptyCell on:click={() => place(r, c)} disabled={state !== State.Playing}>
    <span class="visually-hidden">Place row {r + 1} column {c + 1}</span>
</EmptyCell>
```

The `<span class="visually-hidden">` gives our `<button>` a label. Even though we don't want any text to show visually, we still need to give the button a unique name so that assistive technology understands its purpose. If you haven't seen this technique before, this is a good article on [visually-hidden and buttons](https://www.sarasoueidan.com/blog/accessible-icon-buttons/#technique-%231%3A-accessible-visually-hidden-text).

In our case, we are uniquely identifying each button with the row and column it's at. For example, the middle space will have the name "Place row 2 column 2".

## Playing the game

The click handler on the `<EmptyCell>` above calls `place` with the cell's row and column index. `place` updates the board at that position and swaps whose turn it is. It also manages focus, but we'll take a closer look at that in a bit.

```ts
function place(row: number, col: number) {
  board[row][col] = turn;
  turn = turn === Move.O ? Move.X : Move.O;
  tick().then(focusNextAvailableTile);
}
```

Because we update `board`, the reactive statements to update the `winner` and `state` also run.

```js
$: winner = checkWinner(board);
$: state = getGameState(winner, board);
```

It's very nice to be able to declaratively write reactive logic like this. Instead of having to remember to check if there's a winner in every function we update the board, we _instead_ say "hey, whenever `board` changes, update `winner` again." This means when we clear the board in `reset`, `winner` and `state` will automatically update too.

```js
function reset() {
  board = getEmptyBoard();
  // no need to set winner and state here
  tick().then(focusNextAvailableTile);
}
```

Here's how we determine the winner of the tic tac toe game. We check all possible winning states and return the winner if there is one. (There's probably a more elegant way to do it, but this gets the job done.)

```ts
export function checkWinner(board: Move[][]) {
  for (const row of board) {
    if (row.every(v => v === Move.X) || row.every(v => v === Move.O)) {
      return row[0];
    }
  }

  for (let i = 0; i < board[0].length; i++) {
    if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
      return board[0][i];
    }
  }

  if (board[1][1] === Move.Empty) {
    return;
  }

  if (board[0][0] === board[1][1] && board[1][1] == board[2][2]) {
    return board[0][0];
  }

  if (board[0][2] && board[0][2] === board[1][1] && board[1][1] == board[2][0]) {
    return board[0][2];
  }
}
```

We also update the "game state". The tic-tac-toe game is either in the `Won`, `Draw`, or `Playing` state. This helps keep logic about the state of the game consistent - instead of checking `winner` and `board` in multiple places, we only need to check the `state` variable.

```ts
function getGameState(winner: Move | undefined, board: Move[][]) {
  if (winner) {
    return State.Won;
  } else if (board.every(row => row.every(col => col !== Move.Empty))) {
    return State.Draw;
  } else {
    return State.Playing;
  }
}
```

The state is mainly used to display a message below the game board.

```svelte
<div class="status" bind:this={statusEl} tabindex="-1">
    {#if state === State.Won}
        {winner} won.
    {:else if state === State.Draw}
        It's a draw!
    {:else}
        It's {turn}'s turn
    {/if}
</div>

{#if state !== State.Playing}
    <button on:click={reset}>Play again?</button>
{/if}
```

## Focus management

When a move is made, we replace the `<button>` with an icon showing which player moved there.

```svelte
{#if col !== Move.Empty}
    <Icon move={col} />
{:else}
    <EmptyCell />
{/if}
```

This causes problems for keyboard and other assistive tech users because their focus will be lost abruptly. Instead, we should intentionally move focus somewhere after each player's move. For this project, I chose to move focus to the next available spot, or to the status element if there are no spaces left (i.e. the game has ended).

```ts
function place(row: number, col: number) {
  board[row][col] = turn;
  turn = turn === Move.O ? Move.X : Move.O;
  tick().then(focusNextAvailableTile);
}

function focusNextAvailableTile() {
  const nextTile = boardEl.querySelector('button:not(:disabled)');
  if (nextTile) {
    (nextTile as HTMLElement).focus();
  } else {
    statusEl.focus();
  }
}
```

A few things to note:

1. We use Svelte's `tick` function. This returns a Promise that resolves after all state updates have been applied. If we _didn't_ use `tick`, then we would move focus too early. `board` would be updated, but the DOM would not reflect those updates yet, so we might move focus to a space that will be removed on the next tick.
1. We're using `querySelector` to get the first available `button` that isn't disabled. Using `querySelector` in Svelte is [usually an antipattern](/posts/clean-component-tips/#heading-work-with-the-component-template-not-against-it), but in this case it makes a lot of sense. First, we are scoping it to the `boardEl` so that it only applies to elements inside the board. This is much safer than `document.querySelector`, which could return nodes anywhere in the document. Second, this is a much more efficient way to get the node. We could try to determine with JS which space is the first available one, and then call `focus` on a bound `EmptyCell` component corresponding to that space, which would call a `focus` method we expose inside that component. But that's a lot to wire up. That's not to say using `querySelector` is not without risk - if this was a production application, someone else refactoring the `EmptyCell` could unexpectedly break this logic. But for this demo, I think it's the best choice.
1. If no spaces are available, we focus the status element instead. This is a sensible place to move focus since if no spaces are available, it will announce who won or lost. The status element is a div, which can't normally receive focus, so we set `tabindex="-1"` on it. This makes it so the element can be programatically focused (like we're doing now), but it won't be focused by someone tabbing through the document normally.

```svelte
<div class="status" bind:this={statusEl} tabindex="-1"></div>
```

## Wrapping up

I hope that was a useful look at how I built something like this. I'm planning to work through the rest of the Advent challenges as they're released throughout December (though no guarantees). I'll be sharing them out as I go on [Mastodon](https://front-end.social/@geoffrich) and/or [Twitter](https://twitter.com/geoffrich_).
