---
title: Transitional Apps Transcription (Rich Harris @ Jamstack Conf 2021)
date: '2021-10-07'
tags:
  - svelte
socialImage: 'https://geoffrich.net/images/social/rich-harris-jamstack-conf-2021.png'
---

This is a transcription of Rich Harris' talk at [Jamstack Conf 2021](https://jamstackconf.com/). I've also added links to related content or topics as appropriate. You can watch the recording on [YouTube](https://www.youtube.com/watch?v=860d8usGC0o), and I highly recommend you do so&mdash;Rich is an engaging speaker, and there's some visual elements I couldn't capture in the text.

I made this transcription to make the content easier to reference by myself and others. If Rich Harris or the conference organizers would like me to take this down for any reason, please DM me on [Twitter](https://twitter.com/geoffrich_).

---

There's an active debate happening in front-end circles about the right way to build websites, and like most front-end debates, both sides are really attacking a caricature of the other. On the one hand, we've got advocates for what is often referred to as "modern web development." On the other hand, we have people who look at the state of modern mode development and argue that it's time for a bit of a "come to Jesus" moment about the path that we're on.

For brevity I'm going to call these camps the modernists and the traditionalists, but I don't want you to read any judgment into those terms. My goal in this talk is to try and tease out some of the claims and counter-claims and present what I think is going to become an increasingly popular approach to web development over the next few years. The debate is often reduced to MPA, or multi-page app, versus SPA, or single-page app. That framing really doesn't do either side justice, but nevertheless it's a good place to start.

A multi-page app is really just a website. When you go to that site, after all the DNS stuff happens, you connect to a server or a CDN in front of the origin server and it sends you some HTML. That HTML might have been dynamically generated for that specific request, it might be a cached version of a response that was generated earlier that day, or it might come from a static file server that was updated the last time the app was. Somewhere in that HTML perhaps there's a link. If you click it, the same thing happens again. The browser connects to a server, gets some more HTML, and when it gets enough of a response the existing page is removed and the browser starts rendering the new page.

This is a pretty simple model that has worked well for a long time. But as you all know, things have changed a bit over the last couple of decades. Browsers have got a lot more capable, user expectations have risen, and we find that a lot of sites need client-side interactivity, which means JavaScript. The more complex the application, the more JavaScript you're going to need. And so if you're building a multi-page app, you might find yourself in a bit of an opposition, because the minute you have any client-side updates you're actually building two apps: one for the initial render, that might be PHP or Rails or even handoff.html, and another app for subsequent updates that happen in JavaScript. Two apps, written in two languages, possibly by two different teams, that are nevertheless very tightly coupled to each other.

I could be wrong, but I'm pretty sure the web is the only place where that's considered remotely normal. And so a few years ago, people started building single-page apps. Instead of the content coming down the wire as HTML, you'd get a blank page with a script tag that loaded the code that would render the app. Now if that rendered content included a link, clicking on it wouldn't necessarily result in a round trip back to the server. In some cases you might need to get a little bit more JavaScript or a little bit more data, but either way, it's going to update the page in place rather than nuking everything, which means that navigation is going to feel instantaneous (or dare I say, app-like).

## SPAs are terrible

There's just one problem with single-page apps: they're terrible. Here's a non-exhaustive list of things people will tell you are terrible about SPAs: you will need to load a bloated JavaScript framework (it's always bloated, of course); the performance is worse than a multi-page app; it will probably be buggy; accessibility will suffer; your code base will sit atop a teetering pile of duct-tape tooling (Webpack, Babel, all that other stuff); and it's less resilient&mdash;it won't work without JavaScript.

Unfortunately, these criticisms are largely valid. [Showing Instagram] This is one of the most popular single-page apps in the world. If JavaScript fails or is disabled, this is all you get [a blank page with the Instagram logo]. If it works, then after you've downloaded a literal megabyte of JavaScript (that's gzip, by the way&mdash;the amount of code the browser has to actually parse and evaluate is closer to five megabytes), you can look at a profile page containing... text and images. If you click on one of those images, it'll create a new history entry, but if you then click the back button, the app doesn't navigate. Now, I don't want to overstep the mark here. I'm not privy to the technical constraints and business requirements that led to these choices, but at the same time&mdash;come on, people. If the best front end engineers in the world can't make text and images work without five megabytes of JavaScript, then maybe we should just give up on the web platform.

People sometimes look at you askew if you suggest that most websites should be functional without JavaScript, but JavaScript failing is a fact of life. I often send people to [Everyone has JavaScript, right?](https://kryogenix.org/code/browser/everyonehasjs.html) by [Stuart Langridge](https://www.kryogenix.org/) to illustrate why, and JS-less users are systematically underrepresented in analytics because analytics tools use JavaScript. Also, many single-page apps violate your expectations of the browser's behavior in a way that's at best disorienting, and at worst exclusionary to people with accessibility requirements.

Normally on the web, if you middle click or command click a link it will open in a new tab. On this [food delivery website](https://www.seamless.com/) that's ignored. It will navigate in the current page instead. If you then click the back button the layout will jump around for a bit before a nausea-inducing scroll back to where you were. There's lots of these little accessibility details that SPAs often get wrong&mdash;focus management, scroll management, navigation announcements, page titles, command click behavior&mdash;that collectively make the entire web a less predictable and less accessible medium. We shouldn't accept that. I pick real world examples, albeit more or less at random, because we need to reckon with the fact that single-page apps have kind of ruined the web.

## The problems SPAs solve

So the backlash to modern web development is understandable, but it's important to remember that SPAs do in fact solve some real problems with the traditional approach. They also give you new capabilities. [Showing music library app] Here's something you can't do in a traditional app&mdash;you can't navigate from one page to another while continuing to play media. In an SPA, that's extremely straightforward.

Here's another: you can't use client-side state management that persists across navigations. [Showing email app] In this app, the first load contains a subset of my data. If I scroll, I load more. If I then click into one of these items then click back, I should be at the same place in the list, even though a fresh page load would exclude everything except the first tranche of results. This sort of thing is a little tricky to pull off in a single-page app, but it's essentially impossible in a multi-page app.

[Showing calendar app] Or consider transitions. Native app designers understand the importance of motion and object constancy in user interfaces, but on the web we tend to teleport instantly from one place to another&mdash;not because it's better, but because that's all browsers are capable of. In a single-page app, we can change that. I should note that there's a proposal in the works to add navigation transitions to the platform and it often gets brought up in these conversations, but look. I'm glad that it's happening, but don't imagine for a moment that it'll be as powerful as single-page app transitions can be.

Finally, something that very often gets overlooked whenever we talk about performance and JavaScript load is that the main culprit isn't front end frameworks: it's shitty ad tech and other third-party JavaScript. In a single-page app, you only have to load those lousy scripts once. In a multi-page app you have to load them for every single navigation. Even though the scripts are hopefully cached, you still have to evaluate them on every page load, which gives them plenty of opportunity to block the main thread and degrade the user experience.

## Comparing MPAs and SPAs

So let's look at some of the pros and cons of these two approaches side-by-side. In particular, let's look at the MPA advantages.

[The following was not spoken, but appeared on a slide]

MPA advantages:

- Server-rendered (or static file, etc) - fast initial load
- Resilient - works without JavaScript by default
- Consistent experience with accessibility features built in
- Use whatever technology you like

SPA advantages:

- Single codebase
- Fast navigation
- Persistent elements
- Client-side state management

MPA disadvantages:

- Two apps instead of one
- Navigation can be sluggish
- JS (including shitty third party JS) must be evaluated on every page load

SPA disadvantages:

- Lack of resilience
- Too much JavaScript
- Typically poor initial page load performance

[Okay, back to the talk]

You probably already know that most modern frameworks support server-side rendering. If you're building everything by hand, then you might have a bit of a hard time setting everything up, but if you're using a so-called "meta-framework" like [Next](https://nextjs.org/) or [Nuxt](https://nuxtjs.org/) or [SvelteKit](https://kit.svelte.dev/), then you get that behavior out of the box, so you don't need to sacrifice that fast initial load.

Similarly, if an app uses server-side rendering instead of delivering an empty shell, it will have the same resilience as a traditional app. Your content will be universally available, and as long as you're using links and forms correctly, you can even have JavaScript-free interactivity just the same as if you're using links and forms in hand-authored HTML.

What about accessibility? If you're manually implementing navigation logic and so on then you'll probably end up making mistakes here, but again, modern meta-frameworks take this stuff pretty seriously.

The one big remaining thing is language choice. If you're already part of the anti-JavaScript resistance then nothing I say in the rest of this talk is going to matter that much, but I'm going to get into this later: that ship might have sailed. I do need to take a moment to shout out to projects like [Phoenix LiveView](https://hex.pm/packages/phoenix_live_view), [StimulusReflex](https://docs.stimulusreflex.com/), and so on, which are solving the two code bases problem from the other end by letting you write code that pushes DOM updates from a server over WebSockets. I'm a little skeptical about just how far you can push that model, but it's a pretty cool field of experimentation.

## What's better than a spa?

So we can build apps that combine the best aspects of traditionalism and modernism: a fast initial load, accessibility, resilience, instant navigation, a cohesive code base, and capabilities that used to be out of reach. What should we call them? Well, we already have a sea of acronyms that we use to describe all these various techniques, so at the risk of being all [xkcd 927](https://xkcd.com/927/), maybe there's a new acronym that we could invent. What's better than a spa?

HTML Optimized Through Techniques Users Believe in.

Super Awesome Usable Neato Apps.

Better Applications Through HTML Hyper-Optimized Using Scripts... Etc.

JavaScript Application Centered on Usability, Zippiness, and Zen-Inducement.

Okay, these are all terrible. I'm sorry: I really thought that inspiration would strike and I would be able to come up with something in time for the conference, but that didn't happen, so I started googling to see if there's a word for the synthesis of traditionalism and modernism, and it turns out that the interior design community has thought about this. They call it "transitional design."

I'm going to read a paragraph from [ApartmentTherapy.com](https://www.apartmenttherapy.com/transitional-design-36765367):

> Whereas traditional design can sometimes feel prim and stuffy, and modern design can lean too heavily on the sleek and streamlined look, transitional design samples elements from each aesthetic to form an equally classic and fresh feel. Think of transitional design as having the best of both worlds.

They could be talking about web development. I actually really love this, and not just because I'm a sucker for interior design porn. There's an obvious linguistic connection to the kinds of transitions I was talking about earlier. For too long, we've modeled web apps as discrete pages that you jump to, rather than cohesive spaces that you move around. And it's not because one mode is universally more appropriate than the other; it's because our thinking has been constrained by the medium. I often recommend this website, [HUDS+GUIS](https://www.hudsandguis.com/), where motion designers for TV and film imagine what user interfaces could look like if we were freed of our technological constraints. I want a web with more design freedom, and transitions are a big part of that.

But leaving all that aside, this word "transitional" resonates with me. It's a humble word that recognizes that we're in a constant state of evolution. It doesn't pretend to have all the answers, but it promises that we're going to keep seeking them. It looks towards the future, but it's respectful of the past. In short, it's everything we should aspire to be.

So, Jamstack Conf, let's coin a new term: [#transitionalapps](https://twitter.com/search?q=%23transitionalapps). Let's see if we can get this hashtag trending. In fact, you know what? I think I just figured out the title for this talk.

## On HTML Over The Wire and GitHub

I want to talk a little bit about what transitional apps look like in practice, particularly as it relates to [SvelteKit](https://kit.svelte.dev/), which is a meta-framework we're currently building. But first I need to talk to the eye rollers in the audience, because I guarantee there's a few of you.

Some people claim that you can get the benefits of single-page apps without writing JavaScript. The thing in Rails circles at the moment is HTML Over The Wire, or [Hotwire](https://hotwired.dev/), which is a truly fantastic name. The idea is that the state and the rendering logic live on the server, but you make the app more like an SPA by sending partial chunks of HTML instead of complete pages whenever there's an update. The marketing page says this makes you more productive without sacrificing any of the speed or responsiveness associated with the traditional single-page application: citation needed.

Look, I think this is a really cool idea, but I'm not totally convinced it works in practice. It turns out it's really hard to have things like optimistic updates when the rendering logic lives on the server, so the responsiveness of your app is effectively dictated by network latency. I don't want to be too critical of this idea because it's a good fit for a certain class of application, but I do think we need to be honest about its limitations.

It's not Hotwire but a Rails app that often gets mentioned in these conversations and uses a similar technique is [GitHub](https://github.com/). I love GitHub. I rely on GitHub, and back in the day it was one of the first big applications that used the History API to do client-side navigation and it was a real wow moment, but the front end is super buggy.

Let's say you go to your issues list and click on one of the unreads. You decide you don't want to deal with it right now, so you back out. Hang on a minute, it's still got the blue unread marker. Refresh the page and it's fixed, fine. Actually let's close that issue. Hang on, we still have an open issue&mdash;or do we?

It turns out that when you send partial HTML updates instead of having the rendering logic and the state live in the same place, you get inconsistencies everywhere. I've seen PRs that have both the green open lozenge and the purple merged lozenge on the same page. It's incredibly disorienting to the extent that I obsessively refresh every GitHub page after navigation almost as a nervous tic.

Another example: if you try and interact with the page while actions are running, there's a good chance that it will go haywire. Why? Because we're sending partial HTML updates instead of data. This kind of fragility is essentially baked into this development model. You can fix it, but you'll always be fighting an uphill battle.

## Documents versus apps

Another common objection is that documents and apps are fundamentally different and it's senseless to use app development tools to build document sites. I definitely agree with the sentiment that you should use the right tool for the job, but I want to question the underlying premise here. Look at this product page from an e-commerce site: is it a document or an app? Clearly it's a little bit of both. It's mostly text and images, but it also has buttons that do stuff like "add to cart." My day job involves building [interactive widgets](https://www.nytimes.com/interactive/2021/us/covid-cases.html) that live on New York Times article pages. News sites are classic examples of the document-based web, but this pretty clearly has app-like characteristics.

We talk about documents versus apps as though there is a dichotomy, but it's not: it's a spectrum. When we erase the stuff in the middle we do the web a great disservice. It's a medium that by its very nature resists definitional boundaries.

Now of course you can point to the extremes on the spectrum and say they don't count. But there's no reason your personal blog shouldn't have instant navigation, for example, and if you wanted to add a video player containing your conference talks that people could watch as they continue to navigate around your site, then you shouldn't have to throw away your old stack and begin afresh with a new foundation.

## Edge computing

A lot of people won't be persuaded by all this because the real reasons for the anti-modern web development backlash aren't technological, they're cultural. Some folks just really don't want to use JavaScript or JS-adjacent technologies. It's like, I get it. I don't agree with it&mdash;I think JavaScript is actually pretty great&mdash;but I do understand it. But like it or not, the trends are in JavaScript's favor and there's one in particular that I think is going to become especially relevant over the coming years: that's edge computing.

We've already got things like [Cloudflare Workers](https://workers.cloudflare.com/), Netlifly (sic) edge handlers... Netlifly. Netlify.

We've already got things like Cloudflare Workers, [Netlify Edge Handlers](https://www.netlify.com/products/edge/edge-handlers/), [Deno Deploy](https://deno.com/deploy/), and we're going to see more entrants in this space. What these platforms let you do is run code cheaply, close to where the user is, with none of the cold start headaches that you associate with lambda, and none of the maintenance or scaling concerns that come with running servers.

What they all have in common is that they're all built on [V8](https://v8.dev/). Because of WASM you can theoretically run just about anything at the edge, but realistically I think we can expect JavaScript to have a significant home team advantage. Transitional apps&mdash;remember to use the hashtag&mdash;are really well placed to take advantage of this trend because they have another really interesting characteristic: they can transition between different environments depending on what's most appropriate. Whether that's on your server or in the cloud or at the edge or on the user's device, be that on the main thread or in a service worker or web worker.

## Too much JavaScript

You might think this all sounds like too much JavaScript and that brings us to the final big objection, which is that modern websites serve too much JS to the browser. As we talked about earlier, the biggest culprit when it comes to JavaScript bloat is usually all the third-party script, and modern web apps actually have a very significant advantage here because they can amortize the cost over the duration of the session rather than paying in full on every navigation.

But there is some real truth here. If you have a server-rendered page and you're hydrating it with an interactive client-side app then you will end up serving data and component code that isn't strictly necessary. This is probably the least compelling part of the modern web story right now, but it's a very active area of research and development.

The React team is working on [server components](https://reactjs.org/blog/2020/12/21/data-fetching-with-react-server-components.html), which is sort of like HTML over the wire except vastly more sophisticated. [Marko](https://markojs.com/) is doing something called partial hydration, which means skipping the code and data for non-interactive subtrees. [Qwik](https://github.com/BuilderIO/qwik) is aggressively lazy-loading everything, so you don't load code until you need it for a specific interaction. [Astro](https://astro.build/) is tackling this problem with so-called ["islands architecture"](https://docs.astro.build/core-concepts/component-hydration), which is less granular than Marko but gets you most of the way there. [Svelte](https://svelte.dev/), the framework I help maintain, uses a compiler to make the cost of the framework as low as possible, and though we don't yet do any kind of partial hydration you can easily [turn off hydration](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate) at the page level.

## SvelteKit demo

And I guess that's as good a segue as any into a little demo of what we on the Svelte team have been working on recently. SvelteKit, our meta-framework, is essentially a toolkit for building transitional apps (hashtag). If you want to follow along at home, please do.

First we do `npm init svelte@next`. Once we hit a stable release soon, it'll just be `npm init svelte`. Follow the prompts and your project gets scaffolded to the current directory or whichever directory you specify. Install dependencies, then run `npm run dev -- --open` to start the development server and open the app in a new tab.

This is a simple [demo app](https://netlify.demo.svelte.dev/). This page has a little dash of client-side interactivity, just so you can check that the server-rendered HTML hydrated as expected. If we follow this instruction and edit `src/routes/index.svelte`, we can see what happens if we edit the source code: it updates the page immediately using [Vite's](https://vitejs.dev/) hot module reloading. In fact, if we turn on VS Code auto saving and turn the delay right down, we can see that hot module reloading keeps up with our keystrokes, though I don't necessarily recommend it.

If you're editing styles, then component state will even be preserved, which makes it super easy to tweak the design of your site. If we do `npm run build` followed by `npm run preview` we can look at a production build of the site. Let's navigate to the [about page](https://netlify.demo.svelte.dev/about). Unlike the home page, there's no client-side interactivity needed here so we're able to render this page without any JavaScript at all. We can check that by viewing the page source: all markup, no script, just as it should be. And because this page is marked as pre-renderable in the source code, when we actually deploy this app, whether we deploy it as a Node server or with Netlify or Vercel or AWS or Cloudflare Workers or Deno or whatever else, requesting this page won't involve any server-side rendering. It'll just serve a static file in most cases via CDN without you even needing to configure anything. Same is true for the home page in fact.

Finally, if we go over to our [todos page](https://netlify.demo.svelte.dev/todos), we can start adding some reminders: do this, do that, do more stuff. If we hit this page directly, it's dynamically server rendering with our data, so we can't pre-render it. Importantly, if we disable JavaScript, this page still works because we're using progressively enhanced form submissions to send data back to the server.

This is the briefest possible overview of a SvelteKit app, but let's recap. We have a mix of static pre-rendering with client-side interactivity, a pre-rendered page with zero JavaScript, a dynamically server-rendered page with interactivity that works without JavaScript but upgrades the user experience with JavaScript, an API endpoint that powers that page, and we can deploy all of this using a combination of edge functions and CDN-served static files without having to administer any of it, all from a single code base with an unbelievable development experience powered by Vite. This is what transitional apps are all about and whether or not that name catches on (hashtag), the ideas are here to stay.

So the next time you hear people saying that multi-page apps are best or single-page apps are best remember: the truth is way more nuanced and it's way more exciting. Thank you for watching.
