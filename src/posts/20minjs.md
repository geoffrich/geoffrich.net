---
title: Talking Svelte and open source on 20minJS
date: '2022-04-13'
tags:
  - svelte
  - speaking
socialImage: 'https://geoffrich.net/images/social/20minjs.png'
syndication:
  - https://twitter.com/geoffrich_/status/1514278257155198976
---

I recently had my first podcast appearance on [20minJS](https://podcast.20minjs.com), where I discussed Svelte and getting into open source with Fernando Doglio. I thought it was a great conversation and really appreciated the opportunity!

I pulled some of my favorite portions of the interview below, though definitely check out the [full episode](https://podcast.20minjs.com/1952066/10417700-episode-6-svelte-and-contributing-to-open-source-with-geoff-rich) for the rest of the conversation. It should be available on all major podcast platforms. For more on Svelte, check out an [earlier episode](https://podcast.20minjs.com/1952066/10252768-episode-2-svelte-and-sveltekit-with-mark-volkmann) with Mark Volkmann, where they focus more on SvelteKit.

---

_Describe Svelte in 2-3 sentences._

So Svelte is a component-based JavaScript framework like the ones you've probably heard of like React and Vue, but the major difference is instead of interpreting your component code with a runtime it ships to the browser, it instead compiles your components into vanilla JavaScript at build time. So on average, this makes for applications that are typically smaller and faster than applications built with the other big frameworks.

_Would you recommend a new developer, going directly to Svelte without jumping through React or Vue, or anything else that's out there already?_

If your only goal is to get a job as quickly as possible, React definitely has way more jobs. [React] is going to be way more marketable, but I don't think you're going to go wrong starting with Svelte. As I mentioned, it's very approachable, it has very minimal boilerplate, it has a very easy mental model to grasp what's going on, and it has a great tutorial... And I think with Svelte, you're going to be productive quicker than if you start with React. And if you start with Svelte, that that doesn't mean you can't go learn React later... But yeah, I would say that understandability, the fact that batteries are included, you're not going to have to research a bunch of external libraries off-the-bat makes it a great choice to start with. And it will grow with you if you want it to, but if you want to move on to React afterwards, that's definitely an option too. It all depends on what your goals are.

_If I have a JavaScript external library, that I want to include, because it already does what I want it to do, do I have to like migrate it or just include it and will it work out of the box?_

There's a concept called Svelte actions, which basically let you get that raw DOM access. And it's often a great way to integrate an external library. A common example is like a tool tip library like Tippy. You do have to write a Svelte wrapper, but it's like three lines of code. You have a function that says, hey, run this when this DOM node is added, and then you can import the library and just do whatever you need to with that DOM node... So I found it really easy to integrate external libraries like that... Because there's these external [vanilla JS] libraries that are usually very easy to integrate into Svelte, the ecosystem can actually be a lot larger than maybe something like React where a lot of external libraries you have to figure out&mdash;okay, how do I integrate this into React's lifecycle and components?

<div class="callout">

For more on integrating external libraries with Svelte actions, see my LogRocket post ["Introduction to Svelte Actions"](https://blog.logrocket.com/svelte-actions-introduction/).

</div>

_What is the process of contributing to an open-source project?_

The first thing you want to do is be familiar with the project. Really it's best if it's a project you've used before&mdash;you understand what it's trying to do, what it's goals are. Then I would just check out the GitHub repo and start seeing what kind of issues are open, see how maintainers respond to them, how they respond to PRs and just try to understand norms in the community. And then it's really figuring out how you want to contribute to it. And this doesn't have to be code, it can be writing up a good issue report. It can be trying to improve the docs. Maybe there's something that was unclear to you at first that you want to improve and make better. It could be opening a PR, or it could just being helpful in the community, answering people's questions on the Discord or on Stack Overflow.

If you do actually want to make a PR, there's usually contributing documentation in the repo saying what you need to do. And definitely read that. Definitely read any issue or PR templates as you make those, because it can be really frustrating as a maintainer to have someone open an issue where they didn't provide a good reproduction, so there's nothing you can do. So yeah, just refer to the repo's documentation and go from there.

_Would you recommend a beginner to get into open source already or would you tell them to wait a bit?_

The cool thing about open source is that it's a great way to explore and learn. If you're a beginner and you're just starting out, a lot of times, you're super familiar with how you do things or maybe how your company does things in their projects. But open source is just this whole other world. You can see other conventions and how other people write code that can really broaden your perspective. And it's really an opportunity to connect with people and projects that will probably outlive your current company. So I'd say, yeah, dive right in and just do what you can. You might not be implementing a huge new feature right off the bat, but you can definitely be helpful.
