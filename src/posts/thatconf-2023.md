---
title: 'THAT Conference WI 2023: Building Efficient, Resilient Web Apps With SvelteKit'
date: '2023-07-26'
tags:
  - sveltekit
  - speaking
---

In just a few hours I'm giving a [talk on SvelteKit](https://that.us/activities/QDRKq2sPE4yXlecx182V) at [THAT Conference WI](https://that.us/events/wi/2023/). Here's the talk title and abstract:

> **Building Efficient, Resilient Web Apps With SvelteKit**
>
> Building web apps with all the modern best practices can be complicated. Not only do you want your app to be _efficient_ and load data quickly and intelligently, you also want it to be _resilient_ and stay upright > regardless of your users’ device or network.
>
> Enter SvelteKit, a modern web framework built on top of the best-in-class Svelte JS component framework. Not only does it help you move fast with a minimal-boilerplate and _fun_ developer experience, it also gives you the tools to provide an efficient, resilient user experience.
>
> This talk will move beyond the basics and show how to use SvelteKit’s powerful toolkit to handle more advanced scenarios:
>
> - preloading and streaming data for lightning-fast navigations
> - crafting a minimum viable experience so your app still functions when your JavaScript fails
> - sharing data between multiple routes by loading data in the layout
> - avoiding “data waterfalls” that make your users wait for no good reason
> - progressively enhanced forms
> - customizing SvelteKit’s enhanced forms to implement optimistic UI
> - using advanced Svelte store patterns to efficiently update data instead of over-fetching
>
> We’ll use a music collection demo app to showcase these ideas, so that they’re tied to concrete examples instead of being purely theoretical.

The talk will not be recorded, but I've linked my slides and other resources below. I might transcribe a written version of this talk at a later date.

My slides were created using [Slidev](https://sli.dev/). You can find the source on [my GitHub](https://github.com/geoffrich/thatconf-slides-2023) and the [live version](https://thatconf-slides-2023.vercel.app) deployed to Vercel.

As part of the talk, I briefly showed a music library demo app (a.k.a. "Sveltunes"). The code for that app is [also on GitHub](https://github.com/geoffrich/sveltunes), though it's not currently deployed anywhere because auth is mocked out and the "DB" is just an in-memory object.

If you want to learn more about Svelte and SvelteKit, I recommend the following resources:

- [the interactive tutorial](https://learn.svelte.dev) (start here!)
- the [Svelte](https://svelte.dev/) and [SvelteKit](https://kit.svelte.dev/) doc sites
