---
title: Reading assets on the server in SvelteKit
metaDesc: "How SvelteKit 2.4's new read function simplifies things"
date: '2024-01-21'
tags:
  - sveltekit
templateEngineOverride: njk,md
---

SvelteKit 2.4 brought a new [`read`](https://kit.svelte.dev/docs/modules#$app-server-read) helper function to read an asset from the filesystem. This is a quick post on how this function simplifies some very hacky code I wrote for an old demo.

Back in 2022 I wrote [an extensive post](/posts/svelte-social-image/) on using Vercel's [Satori library](https://github.com/vercel/satori) to create social sharing images using Svelte. I just went back and updated that post, so it should still be relevant for 2024. However, the most awkward part of that first demo was needing to write a [custom Vite plugin](https://github.com/geoffrich/sveltekit-satori/blob/5af7b2b96568a2c482e24aa843f14583d31e5370/vite.config.js#L14-L27) to let us import a font and transform it into the raw font data that Satori needs.

Part of the reason we needed to do this is because there wasn't a great way to read the file from the filesystem at runtime. Sure, at dev time we can use Node's `fs.readFileSync` to read the font data. However, once we deploy our app, we don't have the same guarantees about how the filesystem is structured, and accessing the asset [gets more complicated](https://github.com/sveltejs/kit/issues/10594).

SvelteKit's new `read` helper simplifies this. If you give it the URL of an [imported asset](https://vitejs.dev/guide/assets#importing-asset-as-url), it will return a Response with the contents of that asset. So instead of writing a custom plugin to get the raw font data, I can do this instead:

```js
import {read} from '$app/server';
import sourceSerifPro from '$lib/fonts/SourceSerifPro-Regular.ttf';
const fontData = read(sourceSerifPro).arrayBuffer();

// then later, when calling Satori:
satori(markup, {
  fonts: [
    {
      name: 'Source Serif Pro',
      data: await fontData,
      style: 'normal'
    }
  ]
});
```

Much cleaner! You can take a look at the [deployed demo](https://sveltekit-satori.vercel.app) to see it in action.

Other quick notes:

- this functionality needs to be implemented by the adapter you're using. The [initial PR](https://github.com/sveltejs/kit/pull/11649) included support for Vercel and Netlify (for serverless functions, not edge functions), as well as the regular Node adapter.
- because this uses Vite's asset handling, [glob imports](https://vitejs.dev/guide/features.html#glob-import) work too

For another look at this feature, see Rich Harris' demo video:

{% set videoTitle = "New SvelteKit feature: import { read } from '$app/server'" %}
{% set videoId = "m4G-6dyF1MU" %}
{% include 'partials/components/youtube.njk' %}
