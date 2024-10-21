---
title: 'CascadiaJS 2024: Optimize for vibes'
description: 'Svelte 5 and the new age of Svelte'
date: '2024-06-21'
tags:
  - svelte
  - speaking
socialImage: 'https://geoffrich.net/images/social/cascadiajs-2024.jpeg'
---

{% set videoTitle = "Optimize for Vibes: Svelte 5 and the New Age of Svelte" %}
{% set videoId = "PQluuawldDE" %}
{% include 'partials/components/youtube.njk' %}

I gave a talk at [CascadiaJS 2024](https://cascadiajs.com/2024) on what's new in Svelte 5. What follows is a full transcript of the talk. You can also grab [the slides](https://drive.google.com/drive/folders/14EgoTzgKL_PCmtp8pRQEv2e-99RenKbw) (Keynote and PDF available).

I gave this talk before Svelte 5 [was officially released](https://github.com/sveltejs/svelte/releases/tag/svelte%405.0.0), but it should still be largely applicable.

> Let's look at what's new in Svelte 5 and how it makes Svelte apps more performant, more scalable, and easier to reason about. We'll also unpack why the changes were made and how they were rolled out.

---

My name is Geoff. Svelte is a JavaScript framework that I contribute to, and today I’m going to talk about what’s changing in the next major version of Svelte and why.

But first — there’s a good chance that some of you have never heard of Svelte. So what is Svelte?

In one sentence, Svelte is **a compiled, batteries-included, HTML-first JavaScript framework that prioritizes vibes**.

Let's break that down.

If you know anything about Svelte, it’s probably that it’s a **compiler**. A compiler is a program that takes code written in one programming language and transforms it into another language. In Svelte’s case, it takes Svelte component code — which looks similar to HTML — and transforms it into tightly-optimized vanilla JavaScript.

This was a super novel approach to front-end frameworks when Svelte first came out in 2016; now having a compiler in your framework is less unique. SolidJS uses a compiler in ways similar to Svelte but uses JSX as the template language of choice. Vue has had compiler-driven optimizations for a while and is working on an experimental “vapor mode” that drops the virtual DOM completely in favor of a compiler. And last month React open sourced their experimental compiler “React forget” so you can stop hand-optimizing your React component rendering.

Something that I think makes Svelte special is that we are compiler-first and compiler-only. Compilation is not a separate mode for us; it is a fundamental of the framework. Svelte components don’t need to run in the browser as-is. So we can start with what we want the authoring experience to be, and use the compiler to make that possible. This results in component code with very minimal boilerplate, and also lets us make a ton of performance optimizations that result in small, fast web apps.

Svelte also aims to to be **batteries-included**. Instead of only being a component framework, we also provide solutions to common web-app concerns, like scoped styling, input bindings, intro and outro animations, accessibility warnings, and even spring physics.

Svelte is also **HTML first**. We think HTML is a pretty good language for describing UI, and want Svelte to feel like a reactive extension on top of HTML, not JavaScript. Whereas React starts with JavaScript and adds HTML to it with JSX, Svelte takes HTML and enhances it with JavaScript reactivity.

We also prioritize Svelte’s unique **vibes**. Being small and fast is great, and those are priorities for us — but what we optimize for is how it feels to write Svelte and the aesthetics of it. And vibes is something we’re going to come back to as we talk about the next major version of Svelte and what’s changing, because I think optimizing for vibes is a key part of successfully making a breaking change.

Part of making a change like this — and I’ll get to exactly what that change is in a second — is making sure that the project after the change still feels like the same project. People get attached to the vibes of the framework they use. If you’re changing your framework, you want the vibes to be the same, or at least similar.

Because if you make a breaking change and it feels like a completely different framework — well, maybe you should have just made a new framework? Despite the significant changes coming in Svelte 5, we still think it feels like Svelte, and we hope our users do too.

In case you haven’t used Svelte before, here’s what a component currently looks like in Svelte 4. A lot of this will be changing in Svelte 5, but the shape of a Svelte component will remain — and less may change than you might think. So, Svelte components look like HTML. Here we have a simple counter component

```svelte
<script>
    export let text = 'Click me!';

    let count = 0;
    $: doubled = count * 2;
    $: if (count > 10) {
        console.log('more than 10')
    }

    function increment() {
        count++;
    }
</script>

<button on:click={increment}>{text}</button>

<p>Count: {count}</p>
<p>Doubled: {doubled}</p>
```

Down below you have the template for your component, and the logic lives in the script tag. You can also have a style tag containing scoped styles for the component, but we’re going to focus on the script section today.

On the first line we use `export let` to define a component **prop**, in this case a “text” prop to set the counter button’s text.

We can also define a state variable with let, just like you would declare a regular JavaScript variable. In this case, we’re defining a piece of state called count that we use in the template by wrapping it in curly braces.

Importantly, and what a lot of people like about Svelte, is that you can update that state variable directly, without needing to use a setCount function or other framework abstraction. When we call count++ in the `increment` function, the DOM will update with the new value of count.

You can also define **derived values** using the `$:` label syntax. In this case, we’re creating a variable called doubled, and saying that it should always be two times the value of count. Whenever we update count, Svelte will automatically update the value of doubled as well.

Finally, `$:` also defines a **reactive block**, where you can run some code after any of the state variables referenced in the block change. In this case, whenever `count` is updated, this block will run and log a message if count is greater than 10

So, Svelte works great today, and a lot of people love Svelte.

However, the core of Svelte hasn’t really changed in 5 years, since [Svelte 3’s release](https://svelte.dev/blog/svelte-3-rethinking-reactivity) in 2019. And so as the current API got more and more usage, we noticed some areas of improvement.

5 years is also a long time in the web dev world. 5 years ago:

- React had just released hooks
- If you were writing React, you were probably using create-react-app. That app might _still_ be using create-react-app
- Vercel was called ZEIT
- Vue was still on version 2, and only just proposing what would become the composition API
- SolidJS wasn’t well-known yet
- Microsoft Edge was still its own browser engine instead of being Chromium in a trenchcoat
- If you were unlucky, you still had to support IE 11

Think of how much frontend frameworks and the frontend in general has changed since then. With Svelte 5, we’re taking advantage of all the learnings and innovations that other frameworks have made in the last 5 years, and using them to make Svelte even better than it already is.

So what does it mean to make Svelte better?

Summarized, Svelte 5’s main goal is **universal, runtime reactivity.** With this change, we hope to make Svelte more **scalable** and able to tackle projects of any size, and also make Svelte’s mental model more **consistent** and easier to learn.

## universal reactivity

Let’s start with universal reactivity. Today, Svelte has two reactivity models. There’s the easy-to-use reactivity model inside Svelte components, but that reactivity model doesn’t work if we try to move it to a separate file. Let’s take another look at the example I showed.

```svelte
<script>
    let count = 0;
    $: doubled = count * 2;
    $: if (count > 10) {
        console.log('more than 10')
    }

    function increment() {
        count++;
    }
</script>
```

Let’s say you wanted to wrap up the “counter” reactivity code into a utility that could be used anywhere. You can’t just copy paste the code into a JS file or even move it into a function inside the component — Svelte’s reactivity model only works at the top level of Svelte components. Instead, to move it we need to rewrite to a completely different reactivity API — stores.

Here’s what that might look like. Don’t worry about understanding this code — the details are beside the point.

<pre><code class="language-js">
<mark>import { writable, derived, readonly } from 'svelte/store';
import { onDestroy } from 'svelte';</mark>

export <mark>function</mark> createCounter() {
    let count = <mark>writable(0);</mark>
    <mark>let</mark> doubled = <mark>derived(count, $count => $</mark>count * 2<mark>)</mark>;

    <mark>let unsub = count.subscribe($count => {</mark>
        if ($count > 10) {
            console.log('more than 10');
        }
    <mark>})</mark>

    <mark>onDestroy(unsub);</mark>

    function increment() {
        count<mark>.update(n => n + 1);</mark>
    }

    return { count: readonly(count), doubled, increment };
}
</code></pre>

Just notice what I’ve highlighted — this is what you had to change in order to extract the code from the component. That’s a lot to change just so you could share this reactivity between multiple components. And because that makes refactoring difficult, Svelte components often grow larger than necessary.

But what if you could just copy-paste your reactivity code into a different file and it would work? What if we could use Svelte’s component reactivity model everywhere? Well — that’s universal reactivity in Svelte 5. But before showing what that looks like, let’s discuss the other big change.

## runtime reactivity

Svelte 5 also moves from **compiler-based** reactivity to **runtime** reactivity.

Svelte 4’s reactivity uses compile-time static analysis. The compiler analyzes your code to determine which variables you’re updating where, and then adds code to invalidate data at the right time. This works well most of the time, but there are some extremely tricky edge cases that are hard to solve with a compiler based model. It makes other kinds of refactoring tricky as well.

For instance, looking at the component code from earlier, let’s say that doubling a number was a verbose operation that we wanted to move into its own function. In Svelte 4, if you do this, you’ll actually break Svelte’s reactivity and doubled will no longer respond to changes in count. Doubled’s dependency on count is now invisible to the compiler.

```js
// this doesn't work!
$: doubled = timesTwo();
function timesTwo() {
  return count * 2;
}
```

Instead, in Svelte 4, you need to pass count as an argument so that the compiler understands that this function should re-run when count changes. But it’s unintuitive and easy to miss a variable when refactoring large reactive blocks.

```js
// instead, do this
$: doubled = timesTwo(count);
function timesTwo(num) {
  return num * 2;
}
```

So in Svelte 5, the compiler is no longer responsible for determining reactive dependencies. Instead, those are determined when the code runs in the browser. This doesn’t mean Svelte is dropping the compiler — far from it. It’s just not using it for reactive dependency tracking anymore. We’ll talk more about the implications of this later. So, this is what Svelte 5 delivers — universal, runtime reactivity. Now let’s see what that looks like in practice. It’s time to talk runes.

## runes

Runes are the new way to express reactivity in Svelte 5. That same Svelte 4 component we looked at, would look like this in the new reactivity system:

```svelte
<script>
    let { text = 'Click me!' } = $props();

    let count = $state(0);
    let doubled = $derived(count * 2);
    $effect(() => {
        if (count > 10) {
            console.log('more than 10')
        }
    });

    function increment() {
        count++;
    }
</script>
```

Let's break this down.

In Svelte 5, those function-like symbols starting with a dollar sign are called runes. But they’re not actually functions and you don’t import them to use them. Think of them as instructions to Svelte’s compiler. These runes replace Svelte’s existing reactivity syntax.

- instead of export let, props are now destructured from a \$props rune
- state variables are now declared with the $state rune. Under the hood, the $state rune will use something called a signal so Svelte can perform targeted updates when that value changes. However, as far as the component author is concerned, “count” is just a regular number, and you can access and update it just like you would any number in JavaScript. Count is not a special reactive object, or a function that needs to be called — it’s just a number. This is important for vibes reasons, and we’ll talk more about it later.
- instead of $:, derived values now use the $derived rune.
- and our reactive block turns into an \$effect rune, which will re-run whenever any of the reactive variables inside it change.

On the surface, this may look like mostly a syntactical change. Let’s talk about how this solves some of the issues from earlier. First, unlike the $ label, $derived and \$effect use runtime reactivity.

This means we can now safely refactor into functions without breaking anything. If you’re learning Svelte today, you don’t need to learn the gotcha about passing in reactive dependencies as arguments.

```svelte
<script>
    let count = $state(0);
    // this works now!
    let doubled = $derived(timesTwo());
    function timesTwo() {
        return count * 2;
    }
</script>
```

With these runes, we now also have universal reactivity, which means it’s much easier to refactor this reactive counter into a separate file if we wanted to share between components. Earlier we showed how to do this in Svelte 4, and it involved rewriting to a completely different, more verbose reactivity API called “stores”. In Svelte 5, not only is the reactive logic more concise than the store version, it can be copied in a function verbatim.

```js
function createCounter() {
  let count = $state(0);
  let doubled = $derived(count * 2);
  $effect(() => {
    if (count > 10) {
      console.log('more than 10');
    }
  });

  function increment() {
    count++;
  }

  return {
    get count() {
      return count;
    },
    get doubled() {
      return doubled;
    },
    increment
  };
}
```

There’s no need to convert the code to the store API. The only change is that the function needs to return data for the component to use.

Let’s take a closer look at what we’re returning here, because that may look unfamiliar to some of you.

Those function-looking values for “count” and “doubled” are called getters. In case you haven’t seen that syntax before — it’s not Svelte-specific, it’s Just JavaScript.

A getter is a special object function that maps to a property. When we access the `count` property on the returned object, it runs the count function to get that property’s value.

And this is important because we want to return a live reference to the `count` state. Remember that when you interact with `count`, it’s just a number. And if we just returned a number, then there would be no way to update that number after we returned it.

Instead, we want to always get the live value that the `increment` function is updating. And that’s what the getters give us — they let us return the same underlying value that the increment function is operating on.

When wrapping up reactive state like this, you can return regular objects, or you can also use classes.

This is also a valid way to write that same counter, with “count” and “doubled” as reactive class properties.

```js
class Counter {
  count = $state(0);
  doubled = $derived(this.count * 2);
  constructor() {
    $effect(() => {
      if (this.count > 10) {
        console.log('greater than 10');
      }
    });
  }

  increment = () => {
    this.count++;
  };
}
```

Either way, you can use these similarly: import a function or class constructor and call them, and then use the values in your script tag.

## are the vibes off?

I talked earlier about how when planning this change, we wanted to make sure to preserve Svelte’s vibes. So now the question is — did we succeed?

I think only the community can really decide that. For the most part, feedback has been positive and people are excited about Svelte 5.

But if anything looks less Svelte-like to you, it’s probably that you now have to type “\$state” out instead of it being inferred. Why do we have to do that?

We could have switched to runtime reactivity without changing the syntax. But we also wanted to unlock universal reactivity.

And if we want to declare state outside of components, we need a way to declare it explicitly. We were able to get away with implicit state in Svelte 3 and 4 because it only applied to variables at the top level of a component.

So in this Svelte 4 example, name and numbers are reactive state variables, but sum and value are not, because they’re not at the top level.

```svelte
<script>
    let name = 'world';
    let numbers = [1,2,3,4];

    function calculateSum() {
        let sum = 0;
        for (let value of numbers) {
            sum += x;
        }
    }
</script>
```

But now in Svelte 5, state can be anywhere — at the top level of a component, inside other functions, inside other files, or inside other functions inside other files. If we assumed every let was a state declaration like Svelte 4, it would get very confusing to figure out if a variable was truly reactive or not.

And it would also have a performance impact — making a value reactive isn’t expensive, but it would add up if we applied it to every variable in .svelte files.

It also brings a readability benefit. Code is read more often than it’s written, and now you have a clear visual signifier as to what is state and what isn’t.

And if you’re concerned about saving your fingers — well, that’s what editor autocomplete is for

Now, if the word “state” makes people nervous, there’s one other word that might frighten people… EFFECT.

I don’t think effect needs to be a scary word. Svelte had effects before now in the form of reactive blocks, we just didn’t call them that.

Side-effects are a natural concept in reactive UIs. They’re often overused — our docs encourage using derived state instead, if possible — but they’re necessary.

And one thing to note about Svelte’s “effect” — unlike useEffect, there’s no dependency array! If you’re familiar with Vue’s “watchEffect” or Solid’s "createEffect”, it works similarly — the effect determines when to re-run based on what reactive values you access inside it.

```js
let color = $state('red');
let size = $state(0);
$effect(() => {
  const context = canvas.getContext('2d');
  // this will re-run whenever `color` or `size` change
  context.fillStyle = color;
  context.fillRect(0, 0, size, size);
});
```

As you can see in this example — by accessing the values of size and color inside the effect, Svelte will automatically re-run the effect when those values change. And if you just want to read the value in an effect without subscribing to updates, Svelte provides an “untrack” function.

Beyond the potentially visceral reaction to seeing words like “state” and “effect” in Svelte, the rest of what makes Svelte special is still intact.

For instance — you interact with the raw state values, instead of going through a setState function or an object with a value property. And to understand why that’s possible, we need to talk a little about signals…

## Svelte 5 and signals

Svelte is finally on the “signals” train. Today it feels like every framework is either using signals or about to adopt signals, aside from React.

But what does “signals” actually mean? A deep dive is outside the scope of this talk. And our goal is that you should be able to use and learn Svelte 5 without even learning what a “signal” actually is.

But for the curious — a signal is an object that holds a value, and that can also track when the value is read. This means that when you update a signal, the signal knows all the other places that value is used, and can trigger updates in those places automatically. This lets you make very targeted, precise updates to your UI without a lot of wasted work.

But while signals are great for performance, interacting with them doesn’t feel very Svelte-like.

Part of what makes Svelte “Svelte” is this.

```js
count += 1;
```

It’s the fact that you can take a reactive variable, and when you want to make changes to it you don’t have to use a “set” function or set a “value” property. You can just update the value like it was a normal JavaScript variable.

But then how do we get signals to work? Remember, signals need to be able to track when its value is read and written to, and there’s no way to do that with a regular number in JavaScript. And this is why other frameworks have set functions and value properties that we’re trying to avoid.

In Vue, when you declare a state variable with a number in it, you actually get an object back, not the number. Behind the scenes Vue uses a Proxy object that intercepts reads on the value property and wires up the signal properly.

```js
const count = ref(0);
count.value++;
```

And this is why in Solid, you get back two functions that you call to read and write the value.

```js
const [count, setCount] = createSignal(0);
setCount(count() + 1);
```

And there is nothing wrong with doing things this way — this is just a limitation of how JavaScript works — but it didn’t feel right for Svelte.

Luckily, Svelte doesn’t need to be limited by what is possible at runtime in vanilla JS — because, [to quote Rich Harris](https://twitter.com/Rich_Harris/status/1057290365395451905) when he discovered the core of Svelte 3 — "WE'RE A COMPILER, MOFOS."

In Svelte, we start with what we want the authoring experience to be, and use the compiler to make that possible at runtime. So in your Svelte component you write this…

```js
let count = $state(0);
count += 1;
```

And Svelte compiles it to use signal methods under the hood.

```js
let count = $.source(0);
$.set(count, $.get(count) + 1);
```

So we get the best of both worlds — an efficient, readable authoring experience that’s easy for humans to write, that is then transformed into valid, optimized JavaScript for the browser to execute.

Signals, but as an implementation detail. You can interact with state values like you’re writing vanilla JS and let Svelte’s compiler handle the rest. And with Svelte 5’s universal reactivity, that’s true inside Svelte components as well as regular JS files.

## Svelte 5 and perf

Svelte 4 was already fast, but Svelte 5 has made even more significant gains in performance. A lot of that is thanks to Dominic Gannaway, creator of Inferno.js and former React team member, who joined the Svelte team last year and has been instrumental in eking out as much performance as possible.

If you look at the [JS Framework Benchmark](https://krausest.github.io/js-framework-benchmark/2024/table_chrome_126.0.6478.55.html), which tracks how long it takes various frameworks to perform different DOM updates, Svelte 5 is doing very well, way better than Svelte 4 and neck and neck with Solid. And not only is Svelte 5 fast, but it also uses less memory and hydrates more quickly.

There are lots of reasons why Svelte is even faster now, many outside my expertise, I'll just mention a couple.

The compiler has been re-written from the ground up with performance optimization in mind, including making sure that the compiled JS code is easy for the browser engines to optimize. A lot of these may be microimprovements, but microimprovements add up.

And reactivity being signal-based means that updates can be more targeted and efficient than with Svelte 4’s compiled reactivity.

Svelte is not the absolute fastest framework out there, but it is definitely — almost blazingly? —fast. If you want to build a performant web app, Svelte is not going to require a lot of extra work from you.

## does Svelte scale?

We’ve also made some tradeoffs in regards to bundle size.

In Svelte 4, a “hello world” app was only a few kilobytes, since Svelte had almost no runtime. However, because reactivity was compiled into the component, as you added more components the bundle size increased at a steeper rate than frameworks with larger runtimes. With code splitting, most apps would not hit this inflection point, but it was still something we wanted to address.

But now with Svelte 5, reactivity is now in the runtime, which means a slightly larger runtime, but smaller components. So a “hello world” app is slightly larger; but as you build bigger apps you’ll start to see the savings. Let’s look at an example.

An implementation of TodoMVC, the famous Todo app project used to demo different frameworks, is 7.2kb in Svelte 5 and 4.9kb in Svelte 4. So Svelte 4 is obviously smaller

But lets say you have an app that’s just three times the size of TodoMVC. At that point, the Svelte 5 app is actually smaller than Svelte 4 — 9.8KB instead of 10.1KB — because the larger runtime means that not as much needs to be compiled into each component.

And these savings only increase the larger your app is.

(For the methodology and benchmark code, see [this repo](https://github.com/geoffrich/component-size-benchmark)).

## but wait, there's more!

I’ve tried to talk about as much of Svelte 5 as I can, but there’s still more stuff and I only have 25 minutes! So — I’m going to fall back to a listicle.

These are more new features coming to Svelte 5 that I don’t have time to go into detail on. Check out [the Svelte 5 docs](https://svelte-5-preview.vercel.app/docs), or come find me after for more on these.

- Snippets
- Event attributes
- \$derived.by
- TypeScript in markup
- Reactive Sets/Dates/Maps/URLs
- \$bindable
- Deeply reactive objects and arrays
- Fine grained reactivity
- \$inspect

## but wait, there's less!

But to me what’s exciting is not just all the APIs we’re adding, but the APIs we’re deprecating.

These are all APIs that existed in Svelte 4 that no longer need to exist in Svelte 5, either because they’ve been replaced by something simpler or because the problem they solved is no longer a problem with the new design

- createEventDispatcher → event attributes / callback properties
- `<slot>` and slot props → snippets
- `<svelte:fragment>` → snippets
- $$props, $$restProps, \$$slots → $props
- beforeUpdate and afterUpdate → $effect.pre / $effect

This is the benefit of rethinking some of these APIs. Any design accumulates awkward bits over time as you discover use cases that weren’t considered originally or rethink priorities. Designing from first principles means you can create something that feels cohesive instead of tacked on.

## incremental migration

One last piece I want to touch on before closing is the migration story. I talked about a lot of changes today for how you write Svelte components.

Importantly, while Svelte 5 is introducing new reactivity syntax with runes, you don’t have to convert everything to runes to start using Svelte 5.

Instead, you can use your Svelte 4 components in Svelte 5 today, and they should work the same. Runes take effect on a per-component level — so you can have some components written using the old reactivity, and some written using the new reactivity, and they should work together.

Being able to incrementally migrate to the new reactivity system is important to us, since requiring massive, big-bang rewrites would make Svelte 5 very difficult for a lot of projects to adopt.

In addition to supporting Svelte 4-style components in Svelte 5, we’ll also be supplying automated migration tooling to convert your components to runes. Because even though the old reactivity model is supported in Svelte 5, it will eventually be removed in Svelte 6 or 7 in favor of Runes.

While it’s great for adoption to support both syntaxes simultaneously, it’s not great for learning and understanding. We would essentially split the ecosystem, where some components would be written in the old syntax and some in the new, and newcomers to Svelte would have to decide which one they want to learn. In our mind, the benefits of runes are clear, and you should be using them eventually — but you don’t need to adopt them all at once, and you don’t need to do it all by hand.

## where to next?

So that’s a very brief overview of Svelte 5 - the changes, the problems they solve, and the exciting improvements coming to Svelte. We talked a lot about how Svelte 5 compares to its predecessor, but its simpler mental model means this is also a great place to start trying Svelte.

If you’re interested in learning more or giving it a go yourself, there are a few places you can go.

For now, Svelte 5 is still in preview, so the main docs on [svelte.dev](https://svelte.dev) are still for Svelte 4. You can find the docs for Svelte 5 as well as an interactive playground at [svelte-5-preview.vercel.app](http://svelte-5-preview.vercel.app). Once Svelte 5 is released, it will come with an interactive tutorial that will be the best way to learn Svelte 5.

If you prefer to work locally, run `npm create svelte` to start a new Svelte app, which will give you the option to install the Svelte 5 preview.

If you want to find me, head over to my website at geoffrich.net [note: you're here], where I have my blog and links to my various socials. That’s where you can also find my slides and notes from this talk.

Thanks so much for having me, and enjoy the rest of the conference.
