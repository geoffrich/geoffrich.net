---
title: '90 minute SvelteKit Crash Course with This Dot Labs'
date: '2023-08-24'
templateEngineOverride: njk,md
tags:
  - sveltekit
  - speaking
---

{% set videoTitle = "Mastering SvelteKit with Geoff Rich | JS Drops" %}
{% set videoId = "MaF8kRbHbi0" %}
{% include 'partials/components/youtube.njk' %}

I recorded a 90 minute SvelteKit crash course with This Dot Labs where we build a music library app (which I named "Sveltunes"). My goal was to give a overview of _everything_ that makes me excited about SvelteKit, so we cover a lot. Topics include:

- directory-based routing, layouts, parameterized routes, and nested routing
- loading data with the `load` function (and how this is more efficient than loading data with `onMount`)
- preloading the data for the next page for snappy navigations
- streaming slow data from `load` functions by returning nested promises
- how SvelteKit lets you mix-and-match different rendering options (SSR, CSR, prerendering)
- submitting and validating data with form actions
- using the `enhance` helper to progressively enhance forms
- implementing optimistic UI

There's a lot we didn't get to, but hopefully this provides a good overview! The code for [Sveltunes](https://github.com/geoffrich/sveltunes) can be found on GitHub.

If you enjoyed this video, I recommend checking out the slides for the talk I gave at [THAT Conference](/posts/thatconf-2023/), where I build on the data loading and progressive enhancement concepts to build a nested "Favorite Albums" UI.

In fact, both of my in-person talks last month (the other was at [SeattleJS](http://localhost:8081/posts/seattlejs-2023/)) used the Sveltunes demo, and that was intentional &mdash; better to build one demo you can reuse instead of three!
