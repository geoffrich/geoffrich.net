---
title: Svelte London August 2022
date: '2022-08-23'
tags:
  - svelte
  - speaking
templateEngineOverride: njk,md
metaDesc: 'My meetup talk on native page transitions in SvelteKit.'
---

{% set videoTitle = "Svelte London - August Meetup" %}
{% set videoId = "ua6gE2zPulw" %}
{% include 'partials/components/youtube.njk' %}

I'm presenting remotely at the Svelte London meetup today. I'll talk about using the new shared element transition API to enable page transitions in a SvelteKit app. Below are some relevant repos and resources for the talk.

Demos:

- [Fruit List](https://github.com/geoffrich/sveltekit-shared-element-transitions)
- [Svelte Summit Videos](https://github.com/geoffrich/http-203-svelte)

Further reading:

- [Chrome explainer](https://developer.chrome.com/blog/shared-element-transitions-for-spas/)
- [Google I/O Talk](https://youtu.be/JCJUPJ_zDQ4)
- [WICG Proposal](https://github.com/WICG/shared-element-transitions)
- [Original HTTP 203 demo](https://http203-playlist.netlify.app/)
- [Open SvelteKit issue](https://github.com/sveltejs/kit/issues/5689)
- [Transitions and accessibility](/posts/svelte-summit-2021/)

Page Transitions in Svelte today

- [Josh Collinsworth](https://joshcollinsworth.com/blog/build-static-sveltekit-markdown-blog#implement-page-transitions)
- [Dana Woodman](https://twitter.com/DanaWoodman/status/1559610048334049280)
- [Simple Page Transitions with SvelteKit](https://dev.to/evanwinter/page-transitions-with-svelte-kit-35o6)
- [Another recreation of the HTTP 203 site](https://twitter.com/bfanger/status/1528310176918519809) ([source](https://github.com/bfanger/page-transitions-in-svelte))
- [Svelte Travel Transitions](https://github.com/pngwn/svelte-travel-transitions/)
