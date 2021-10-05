---
title: Notes on Rich Harris' PodRocket interview
date: '2021-10-05'
tags:
  - svelte
socialImage: 'https://geoffrich.net/images/social/rich-harris-podrocket.png'
---

LogRocket's podcast [PodRocket](https://podrocket.logrocket.com/) released a [new episode with Rich Harris](https://podrocket.logrocket.com/rich-harris), the creator of [Svelte](https://svelte.dev/), this morning. There were so many good insights in it that I wanted to pull out some choice quotes and take some notes to share this in a non-audio medium.

I highly recommend listening to the full episode, especially if you're new to Svelte. Even if you're already familiar with Svelte, there are still some great insights to Svelte's philosophy and its position in the current framework landscape.

All these quotes are from Rich Harris. I pulled them from the [transcript](https://assets.fireside.fm/file/fireside-images/podcasts/transcripts/3/3911462c-bca2-48c2-9103-610ba304c673/episodes/8/8a485d85-aea7-4811-86c6-de00f8399413/transcript.txt) of the episode and cleaned them up a bit, though the emphasis is mine.

## Svelte's advantages

Svelte's advantage is that it lets you write your components declaratively, and then translates it into the underlying DOM manipulation at compile time. This typically makes for smaller bundle size and faster state updates.

> Instead of imperatively manipulating the DOM with `document.createElement` and all of the things that are provided by the platform. It puts a declarative layer on top of that so that you can describe the output that you want, and then the framework's job is to translate that into the underlying DOM manipulations.
>
> It generates typically very small code, which means that your application is going to load very quickly, and the updates, when you have a state change within your application, also take place very quickly, because it doesn't need to regenerate your entire application. It's just surgically updating the part of the page that's affected.
>
> I should say at this point, because this is what I've been telling people about Svelte since it first came around in 2016, the landscape has actually shifted a little bit and other frameworks are, in many cases, becoming a little bit more Svelte-like. So when I talk about these unique advantages, they're not so unique anymore. **Svelte's selling point these days is really more about the developer experience it provides.** Vue, in particular, has adopted a lot of these techniques and also has some of those bundle size and performance characteristics.

## Just JavaScript vs a DSL

There are advantages to staying close to the platform and only using syntax that exists natively, but domain-specific languages (DSLs) have advantages too.

> One of the things I say from time to time is that DSLs are actually a good thing. People on the other side, on the just JavaScript side, will be like, "I don't want to learn a domain specific language," because they've been bitten by domain specific languages in the past. But, actually, **why wouldn't you want the language to be specific to the domain that you're solving.** As long as the DSL doesn't decrease the amount of flexibility that you have, then other things being equal, it's probably a good thing. If it enables you to express the ideas in your application more concisely and more consistently, then it's probably a good thing.

## Svelte's primary language is HTML

Svelte's component syntax uses HTML as a base&mdash;the fundamental language of the web.

> The thesis here is the HTML is the language of the web. JavaScript is not the language of the web. JavaScript is one of the three languages that are sort of contained within HTML, because HTML is designed to contain CSS and JavaScript, whereas a lot of frameworks go the other way. They're like, "JavaScript is the primary language and we're going to try and shoehorn HTML and, in some cases, CSS into JavaScript." **Svelte takes this opposite view that you begin with HTML, and then you add JavaScript as necessary.**

## On SvelteKit's flexibility

SvelteKit is a framework built for the serverless front-end landscape.

> It's a full stack application framework that lets you build fully server rendered applications with all of the modern best practices, but it's also very flexible both in how you build your app. You can build a completely single-page app or you can build a completely JavaScript-free multi-page app or something in between, and you can vary it by page; but you can also deploy it to a bunch of different places if it's suitable. Like [if] you're building a very static content site, then you can bake it out of static HTML and then you can just throw that on GitHub Pages or whatever it is.
>
> But if you're doing something that's highly dynamic, then you can have a server component or you can have serverless functions or you can put it inside a Cloudflare Worker, and you can pre-render the parts of your application that are static and dynamically render the parts that are not. And it's really a way of addressing all of the problems, or as many of the problems as possible, that you encounter while building a modern web application.

For more on this topic, see the [SvelteKit announcement post](https://svelte.dev/blog/whats-the-deal-with-sveltekit), though some things have changed since that was written. Most notably, SvelteKit is now using [Vite](https://vitejs.dev/) instead of Snowpack.

## What's on the Svelte roadmap?

I liked hearing about what could be next for Svelte, though note that nothing on this list is set in stone. It seems like we can expect more iteration on Svelte core once SvelteKit hits 1.0 and is stable.

> I'm almost reluctant to talk about some of these things, because **a lot of it is speculative and we're not really sure where some of these ideas are going to land.** But we have this long wish list of things that we want to do for Svelte 4.0 and beyond.
>
> Some of it is adopting some of the features that other frameworks have proven out, like **streaming SSR** and things like that. Some of it is around **speeding up our own compiler**, so that the feedback loop gets even tighter. Changing how the compiled output is generated such that if you have a very large application, you're **paying only a very tiny incremental cost per component**. We have some grand ideas about better ways to think about **motion inside user interfaces** and how that should be tied to the core of a framework as opposed to left to a userland solution.
>
> We have a great many ideas, and I don't want to give them all away. But there's a lot on our plate, and we're pretty excited to get stuck into it when we can.

## Does Svelte have more "magic" than something like React?

A common perception is that Svelte has more magic as opposed to a framework like React. However, React has magic too&mdash;the difference is that Svelte's magic happens at compile time, while React's magic happens at runtime.

> I don't know that that [magic vs explicit is] such a real dichotomy. The differences that Svelte is doing the stuff at build time. It's changing your expectations of how JavaScript works, because it's intercepting assignments and turning those into reactive state changes. React is doing something similar.
>
> If you look at a React function and you don't know what's happening with hooks, then you would look at that code and you'd be very confused about what's happening, because the functions behave in ways that JavaScript functions generally don't. The fact that the return value of a function depends on how many times you've called that function and whether you've called the return value in the past and things like that, that's deeply weird, it's not how JavaScript works at all. You can implement it with JavaScript, but it's not how JavaScript works. They are violating expectations on a fairly fundamental level.
>
> The difference is that they're doing it all at runtime instead of having all of that stuff happen behind the scenes at compile time. And I tend to think that focusing on whether the magic happens at build time or whether it happens at runtime is focusing on the wrong thing. **All frameworks involve magic. Svelte is just trying to do the expensive bits of magic before that code gets to the user. That's the only real difference.**

## On the "framework wars"

Treating web development as a war between one framework or another is not healthy. The people building these frameworks get along and are all trying to improve front-end development and the web as a whole. There is no One True Framework, and different frameworks fill different needs.

> I dislike the framework wars framing generally, because what might not be obvious to a lot of people who are users of these frameworks as opposed to actively involved in the development of them, is that... The people who are building these frameworks, we often talk to each other. We by and large know each other. We get along. There's no animosity There's no warring whatsoever.
>
> We hang out in the same spaces and we share ideas with each other, and really we're all, I think, just trying to collectively advance the state of front end development by focusing on the little bits of innovation that we can contribute, and then gradually, all of that stuff filters through the ecosystem and gets shared more widely. And Svelte occupies a part of the landscape that is attractive to a certain kind of developer. React occupies a different part of the landscape. **They're both completely fine solutions for the people who are choosing them, and they're not going to be right for everyone and that's fine.**

## Svelte is no longer an underdog

Svelte is now talked about as one of the "big 4" frameworks. At this point, we can't really consider it an underdog, since so many are aware of it. There are many frameworks with much less name recognition than Svelte.

> So are we the underdog? It depends on what you're looking at. There's three big frameworks, right? There's React, Angular and Vue. And if you had to pick a fourth framework, I think most people at this stage would probably say the fourth framework was Svelte. And so if underdog means that you're inside the top four instead of the top three, then absolutely are the underdog.
>
> At the same time, we have a pretty good mindshare at this point. A lot of people in the front end world have heard of Svelte. A lot of people talk about Svelte. There's a whole industry of people doing YouTube videos about Svelte. **And I think calling ourselves underdog would be a disservice to the people who are actually laboring on open source projects without getting a whole lot of recognition.** I think we have plenty of recognition. And so, I wouldn't claim the underdog label for ourselves by any stretch, but nor are we in any way mainstream.

## See the podcast for more, including

- How Svelte compares to the virtual DOM (see also: [Virtual DOM is pure overhead](https://svelte.dev/blog/virtual-dom-is-pure-overhead))
- The ideal use case for Svelte
- Svelte's two-pronged approach to managing state
- How templating works in svelte
- Whether a React-specific DSL could help reduce its boilerplate (see also Rich's [tweet](https://twitter.com/Rich_Harris/status/1438502561942810625?s=20) on the subject)
