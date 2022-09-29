---
title: Teaching Kelvin Svelte on TKYT
date: '2022-09-29'
tags:
  - svelte
  - speaking
socialImage: 'https://geoffrich.net/images/social/tkyt.png'
templateEngineOverride: njk,md
---

{% set videoTitle = "Learning Svelte from scratch with Geoff Rich: A Svelte tutorial" %}
{% set videoId = "QoR0AZ-Rov8" %}
{% include 'partials/components/youtube.njk' %}

I was on [Teach Kelvin Your Thing](https://dominuskelvin.dev/tkyt) to teach Kelvin Svelte! I had a great time &mdash; thanks again to Kelvin for having me on.

We created a Star Wars watch order app. You can check out the [live demo](https://sw-demo-svelte.vercel.app/) or view the source code [on GitHub](https://github.com/geoffrich/star-wars-demo-svelte). We covered:

- What Svelte is
- Svelte component basics — script, template, style
- Reactivity in Svelte
- Svelte’s accessibility warnings
- Using `bind:value` to get the value of an input
- Reactively sorting and filtering a list
- Toggling classes on an element with `class:`
- Using `<slot>`
- Adding polish with the built-in `fade` and `crossfade` transitions and `animate:flip`

If you're new to Svelte, I recommend checking out the [Svelte tutorial](https://svelte.dev/tutorial). Be sure to stop by the [Svelte Discord server](https://svelte.dev/chat) if you need help!
