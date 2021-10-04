---
title: Exploring the history of Marvel comics with SvelteKit
date: '2021-10-03'
tags:
  - svelte
  - side project
socialImage: 'TODO (MU + SK logo?)'
---

On September 9, the Marvel Unlimited app got a huge update. While it added some long awaited features such as unlimited downloads, it also wrecked havoc on people's libraries and removed some beloved features.

One of these features was the ability to sort by date -- for example, being able to view every comic released in 1993. This was crucial for those trying to read every Marvel comic in chronological order, as well as those following a yearly comic book reading club like [My Marvelous Year](https://www.comicbookherald.com/my-marvelous-year/).

I was one of those users disappointed by the feature's removal. After I discovered that all the data needed to re-create the feature was available on Marvel's API, I started coding. A few weeks later I launched [Marvel Unlimited by Year](https://marvel.geoffrich.net/).

## Features

- View all comics available on Marvel Unlimited for a given year. For example, here's [1975](https://marvel.geoffrich.net/year/1975).
- Tap the comic's cover to be taken directly to the issue in Marvel Unlimited or the web-based reader, depending on your device.
- Sort and filter the results by series, creator, or event.
- View a [random selection](https://marvel.geoffrich.net/comic/random) of available comics, or random comics released in a specific decade.

Below are some images from the site.

![Comics available from 1977](/images/marvel-unlimited-by-year/1977-comics.png)
![Random selection of comics](/images/marvel-unlimited-by-year/random-comics.png)

## The tech stack

- [Svelte](https://svelte.dev/) and [SvelteKit](https://kit.svelte.dev/) for the app framework. This was my first major project in SvelteKit and I had a great time. Svelte is my favorite front-end framework to work in, and SvelteKit builds a full-stack app framework on top of it with SSR, server endpoints, and routing, as well as a fast dev environment powered by [Vite](https://vitejs.dev/). Despite it being pre-1.0, I had very few issues and I'm looking forward to moving some of my work projects over to SvelteKit as soon as possible.
- [Redis](https://redis.io/) cache hosted on [Upstash](https://upstash.com/), a serverless option where you pay per-request instead of per-server. Since I had a limited number of requests per-day, I needed to cache the responses for 24 hours. The [random comic](https://marvel.geoffrich.net/comic/random) functionality is also implemented using Redis queries.
- [Netlify](https://www.netlify.com/) hosted the deployed site. So far, the traffic hasn't exceeded the limits of their free plan (125k function invocations).
- [Marvel API](https://developer.marvel.com/) for the data. While the documentation doesn't seem like it's been updated recently (last change announcement was 2014), it still works great and the data is current.

As a dev myself, I know as well as anyone that rewrites are hard. I'm not trying to disparage the development team as part of this effort -- I just wanted to restore a feature that I (and many others) found essential, and try out some new dev tools in the process.

## Testimonials

I posted this project on the [Marvel Unlimited subreddit](https://www.reddit.com/r/MarvelUnlimited/comments/pxe7l9/i_made_a_site_that_lets_you_browse_mu_by_release/) last week, and received a glowing response.

> Uh, I think I can speak for everyone when I say, holy cow this is great! Super fast and the link to the iOS app works great! I guess it’s true what they say, not all heroes wear capes. I wish I could upvote this multiple times!

> Even better than the old app because it does exactly what I used to do, but it loads so much faster!

> This is the best thing I've ever seen on Reddit.

## Future plans

I still have some features I want to add to this site. In addition, I want to use the site as my SvelteKit playground.

The code is [open source](https://github.com/geoffrich/marvel-by-year) on GitHub. You can even run it yourself, though you'll need to provide your own Marvel API keys and Redis connection.

Stay tuned for a follow-up post with some of the things I learned on this project.

TODO:

- Make repo public
- Update meta tags on site
