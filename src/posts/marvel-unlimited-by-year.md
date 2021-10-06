---
title: Exploring Marvel Comics' history with SvelteKit
date: '2021-10-03'
tags:
  - svelte
  - side project
socialImage: 'https://geoffrich.net/images/social/marvel-unlimited-by-year.png'
---

_tl;dr I launched a [new site](https://marvel.geoffrich.net/) where you can see Marvel comics published in a [given year](https://marvel.geoffrich.net/year) and retrieve a [random comic](https://marvel.geoffrich.net/comic/random) available on the Marvel Unlimited app. The code is [open source](https://github.com/geoffrich/marvel-by-year) on GitHub._

On September 9, the Marvel Unlimited app (MU), which lets you read tens of thousands of Marvel's comics for a monthly fee, got a huge update. While it added some long awaited features such as unlimited downloads, it also wreaked havoc on users' reading history and libraries and removed some beloved features.

One of these features was the ability to sort by date&mdash;for example, being able to view every comic released in 1993. This was crucial for those trying to read every Marvel comic in chronological order, as well as those following a yearly comic book reading club like [My Marvelous Year](https://www.comicbookherald.com/my-marvelous-year/).

I was one of those users disappointed by the feature's removal. After I discovered that all the data needed to re-create the feature was available from [Marvel's API](https://developer.marvel.com/), I started coding. A few weeks later I launched [Marvel Unlimited by Year](https://marvel.geoffrich.net/).

## Features

<img src="/images/marvel-unlimited-by-year/1977-comics.png" alt="Screenshot of the 1977 comics page. The first three titles are shown: Champions #10, Thor #255, and Incredible Hulk #207" title="Comics available on MU published in 1977">

- View all comics available on Marvel Unlimited for a given year. For example, here's [1975](https://marvel.geoffrich.net/year/1975).
- Each comic's cover links directly to the issue in Marvel Unlimited or the web-based reader, depending on your device.
- Sort and filter the results by series, creator, or event.
- View a [random selection](https://marvel.geoffrich.net/comic/random) of available comics, or random comics released in a specific decade. The old app had a button that would give you a random comic, though it wouldn't allow you to specify the decade. The MU team have stated that they [don't have plans](https://www.reddit.com/r/MarvelUnlimited/comments/py12lt/hi_mu_subreddit_were_the_team_behind_marvel/herewi5/) to add the random button to the new app, so I'm glad I was able to make it available on my site.

<img src="/images/marvel-unlimited-by-year/random-comics.png" alt="Screenshot of the random comics page. 6 covers are shown: Dr. Strange Sorcerer Supreme, Star Wars Dark Empire II1, Marvel Digital Holiday Special, History of the Marvel Universe, New X-Men, and Luke Cage: Power Man." title="The random comic page">

## The tech stack

- [Svelte](https://svelte.dev/) and [SvelteKit](https://kit.svelte.dev/) for the app framework. This was my first major project in SvelteKit and I had a great experience. Svelte is my favorite front-end framework to work in, and SvelteKit builds a full-stack app framework on top of it with SSR, server endpoints, and routing, as well as a fast dev environment powered by [Vite](https://vitejs.dev/). Despite it still being pre-1.0, I had very few issues and I'm looking forward to moving some of my work projects over to SvelteKit as soon as possible.
- [TypeScript](https://www.typescriptlang.org/) on the server and client side. The complexity of the API response made auto-complete a must-have (and by extension, types). SvelteKit gave me the option to set this up automatically, so I didn't have to wrangle any configuration.
- [Redis](https://redis.io/) cache hosted on [Upstash](https://upstash.com/), a serverless option where you pay per-request instead of per-server. Since I had a limited number of API requests per-day, I needed to cache the responses for 24 hours. The [random comic](https://marvel.geoffrich.net/comic/random) functionality is also implemented using Redis queries.
- [Netlify](https://www.netlify.com/) hosted the deployed site. So far, the traffic hasn't exceeded the limits of their free plan (125k function invocations).
- [Marvel API](https://developer.marvel.com/) for the data. While the documentation doesn't seem like it's been updated recently (the last change announcement was 2014), it still works great and the data is current.

## Testimonials

I posted this project on the [Marvel Unlimited subreddit](https://www.reddit.com/r/MarvelUnlimited/comments/pxe7l9/i_made_a_site_that_lets_you_browse_mu_by_release/) last week, and received a glowing response.

> Uh, I think I can speak for everyone when I say, holy cow this is great! Super fast and the link to the iOS app works great! I guess it’s true what they say, not all heroes wear capes. I wish I could upvote this multiple times!

> Even better than the old app because it does exactly what I used to do, but it loads so much faster!

> This is the best thing I've ever seen on Reddit.

It was nice to develop something that others found useful! One of the best things about knowing how to code is being able to create something solving a niche problem that wouldn't otherwise get addressed. These comments also show that SvelteKit provides a speedy user experience as well as a great dev experience.

As a dev myself, I know as well as anyone that rewriting a product with an existing user base is hard. I'm not trying to disparage the development team as part of this effort&mdash;I just wanted to restore a feature that I (and many others) found essential, and try out some new dev tools in the process.

## Future plans

I'm not done developing this site and still have some features I want to add, such as filtering by release month and listing out available series.

If you're interested, the code is [open source](https://github.com/geoffrich/marvel-by-year) on GitHub. You can even run it yourself, though you'll need to provide your own Marvel API keys and Redis connection. Docs are sparse at the moment, though I hope to flesh them out eventually.

Stay tuned for a follow-up post with some of the things I learned on this project.
