---
title: Partial hydration in SvelteKit with @11ty/is-land
date: '2022-10-09'
tags:
  - sveltekit
  - side project
socialImage: 'https://geoffrich.net/images/social/sveltekit-is-land.png'
syndication:
  - https://twitter.com/geoffrich_/status/1579483417473081345
---

My webdev project last weekend: I got partial hydration working in a SvelteKit site using the `<is-land>` custom element from [Eleventy](https://www.11ty.dev/docs/plugins/partial-hydration/)! This means it's possible to only download JS for specific components instead of the whole page. Here's what the integration currently looks like:

{% raw %}

```svelte
<script>
	import Count from '$lib/islands/Count.svelte';
	import Island from '$lib/Island.svelte';
</script>

<h2>Without props</h2>

<Island component={Count} name="Count" />

<h2>With props</h2>

<Island component={Count} name="Count" props={{ title: 'island' }} />

<h2>Customizing island options</h2>

<Island component={Count} name="Count" islandProps={{ 'on:interaction': true }} />
```

{% endraw %}

To see it in action, check out the [demo site](https://sveltekit-is-land.vercel.app/) and scroll - the gray buttons are server-side rendered but not interactive. Once they turn blue, they're hydrated. The page shows off the different hydration modes from is-land, e.g. on load, on visible, and on interaction.

Also, take a look at the network tab to see when the individual component JS is actually loaded. The page only loads 2.49KB of JavaScript (compressed) on initial load, for a total of 9.45KB once all components have been loaded.

Heavy disclaimer: this does **not** mean that partial hydration is coming to Svelte or SvelteKit itself. It's just a userland POC for now, though ideally one that I could package up and make plug-n-play for folks who want to use it.

Honestly, most of the magic here is the existing 11ty/is-land implementation. I just had to figure out how to pass it a component import URL it could use, and then it took over the actual hydration process and timing. It’s a great package, and I love that it’s framework-independent!

There are some [limitations](https://github.com/geoffrich/sveltekit-is-land#current-limitations) for island components that I detail in the README:

- they can't use SvelteKit lib/app/env aliases
- only devalue-serializable props and no slots
- no client-side routing - once you navigate to a page with CSR enabled, full pages will be hydrated

It's also awkward right now that you have to pass both the component and the filename to the Island component at the moment. I want to figure out how to make that more ergonomic.

For a full rundown of how everything works, take a look at the [project README](https://github.com/geoffrich/sveltekit-is-land) on GitHub.
