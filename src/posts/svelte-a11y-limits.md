---
title: The limits of Svelte's accessibility warnings
date: '2021-04-26'
tags:
  - a11y
  - svelte
socialImage: ''
---

About me: I'm a software engineer at Alaska Airlines, where we use Svelte for one of our microsites in production. I've also started writing more frequently on my blog, mostly about Svelte and accessibility.

Accessibility checks are one of the features that makes Svelte stand out. Svelte's unique in that this is built into the framework.

- The Curse of React: when building complex UI components is easy, everyone makes their own instead of using a standard (probably more accessible) library
  - Svelte is cursed by this as well, especially since the ecosystem is still developing
  - Svelte's compiler has accessibility checks built-in -- will those stop you if you build an inaccessible component?
- What Svelte's compiler will catch
  - Most of the existing checks focus around attributes on single HTML elements
    - required attributes that are missing (no alt text)
    - misplaced attributes that shouldn't be there (aria-hidden on a heading)
    - invalid attributes (invalid aria role)
  - Also some structural checks
    - figcaption should be a child of figure
    - label should have a for or a child input
    - anchors and headings should have child text content
- What the Svelte compiler won't catch
  - Dynamic values
  - Anything cross component
  - Non-markup issues
  - Subjective issues -- a11y has shades of grey
- All together, these are a lot of issues that the compiler won't save you from. Even if you have zero compiler warnings, all these issues could be present in your app.
  - There are limits to what a compiler can do.
- Many Svelte devs think the compiler warnings are enough to detect all issues, which is worrying
- Ways for Svelte to improve
  - integrate with existing tooling
  - allow warnings to be configured
  - merge PRs
  - documentation

Svelte's accessibility warnings are pitched as one of the framework's killer features. Per [Rich Harris](https://twitter.com/rich_harris/status/1008856270084898816), Svelte is an "a11y-first framework" that "will _let_ you write non-accessible markup, but it won't respect you for it." Accessibility warnings in the compiler have been a part of the framework [since version 1.38](https://github.com/sveltejs/svelte/issues/374), and are highlighted in the [first section](https://svelte.dev/tutorial/dynamic-attributes) of the tutorial.

When I first saw this, I was intrigued. However, I couldn't find much discussion on what this actually means. Most mentions of this feature give image alt text as example&mdash;certainly important, but only a small facet of making an accessible web page. Accessibility is only mentioned once in the Svelte docs (how to ignore them).

In this post, I hope to shed light on what kinds of accessibility checks the compiler performs and what other validations you should perform to make sure your Svelte project is accessible.

## The curse of React

I want to start by talking about React.

> [React] has greatly simplified the building of complex interactions so everybody rolls their own--but they don't realize they've messed up the accessibility of their apps.
> &mdash;[Ryan Florence](https://twitter.com/ryanflorence/status/1095853086478761984?s=20)

To paraphrase Ryan Florence, in the jQuery days no one built their own custom complex UI components because it was too hard. So everyone used these battle-tested jQuery UI dropdowns and modals and autocompletes that happened to be accessible. But React (and now Svelte) made building custom components easy, so everyone rolls their own without being aware of what they need to do to make these components accessible.

Svelte makes building complex components easy, some would say even easier than React. So everyone rolls their own modal, autocomplete, dropdown, etc. But unless you really know what you're doing, you probably made an inaccessible component.

[Inaccessible Svelte autocomplete](https://svelte.dev/repl/884cb7a7cbf54b86b3f0f1f919a0e24b?version=3.37.0)

In addition, since Svelte is a developing ecosystem, it suffers even more from the Curse of React. There aren't a lot of options for Svelte component libraries, let alone accessible ones. And because React is still the biggest framework, the best thinkers with accessibility are focusing on that ecosystem (React Aria, Reach UI, Chakra UI, etc).

> I hesitated to mention this last point because it technically has to do with adoption, but I cannot separate it from React's merits: it seems to have the best thinkers on accessibility and interaction design right now. No other ecosystem has projects like Adobe and Devon Govett's React Aria that has extensively thought through and tested for WAI-ARIA so you don't have to. Ditto Segun Adebayo's Chakra UI.
> &mdash;Swyx, [Svelte for Sites, React for Apps](https://dev.to/swyx/svelte-for-sites-react-for-apps-2o8h)

So, just like React, it's easy to build an inaccessible component with Svelte. But Svelte's compiler checks for a11y, right? Won't that catch it? Well, let's talk about what the compiler does catch.

## What accessibility issues does the Svelte compiler catch?

Most of Svelte's accessibility warnings focus around attributes on single HTML elements:

- required attributes that are missing (no alt text)
- misplaced attributes that shouldn't be there (aria-hidden on a heading)
- invalid attributes (invalid aria role)

There's also some checks around the structure of the markup.

- figcaption should be a child of figure
- label should have a for or a child input
- anchors and headings should have child text content

Most of Svelte's checks are copied from [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y#supported-rules). There is also [an open GitHub issue](https://github.com/sveltejs/svelte/issues/820) detailing additional checks the Svelte team would like to add.

This isn't currently documented anywhere, though you can check out the [documentation PR](https://github.com/sveltejs/svelte/pull/5316) or the [Element.ts](https://github.com/sveltejs/svelte/blob/master/src/compiler/compile/nodes/Element.ts) source code.

## What issues will the compiler overlook?

With that in mind, what kinds of issues will the compiler overlook? I want to mainly talk about issues that won't be detected because of how the current checks are set up, not just because no one has implemented them yet. There is something about these issues that makes them unlikely to be detected by the compiler in the future.

### Dynamic values

The compiler doesn't know what is placed in props at runtime.

For example, if you make an Image component, the compiler will complain if you don't put an alt on the inner img. But it won't complain if you pass null to the component alt prop further down the line.

The compiler will complain if you pass "#" as the href value, but not if that href value is dynamically set and one of the options is "#".

Or what if href is set from an API response? There's literally infinite options here and the compiler can't figure out all of them.

### Anything cross-component

With a few exceptions, Svelte's accessibility warnings check individual elements and direct children. It can't analyze your app as a whole.

TODO: refine examples here

- Checking hierarchy, e.g. li should be in ul
  - There is an existing check that figcaption is inside figure, but that only looks in one component
  - In general, can't check relationship between elements in separate components. So if you have an li component and a ul in a parent component, it can't do any validation there (or there aren't any checks similar to that).
  - There's a [PR](https://github.com/sveltejs/svelte/pull/5323/files) to improve the label check so it looks cross component.
- Incorrect heading order or multiple h1s
- Unlabeled form inputs (currently checks that the label has a for, but not that it's valid)
  - Your label could be in a completely separate component from your input.
  - anything wired up with aria-describedby, etc
- Duplicate IDs
- Missing elements -- e.g. main, h1.
  - Svelte can't disprove a negative

These are way easier to do at runtime, once your app is rendered.

There is potential for similar checks to be added to the compiler at some point, but there's a lot of complexity here.

### Anything that isn't markup-based

If the accessibility issue is in CSS, Svelte won't detect it. As above, this is way easier to check as the browser renders the component.

- color contrast
- tap target size
- focus visibility (super important)

### Anything that's subjective

If it can't be a straightforward true/false answer, the compiler is not going to warn you about it. Svelte's current accessibility checks are essentially lint rules -- they're going to help you get the little things right, but they're not going to guarantee that you've written good code.

Only [25%-35% of accessibility errors](https://webaim.org/projects/million/#method) are detectable using automated tooling.

TODO: do I need this link?

[World's least accessible web page](https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/)

- Zoom level
- Usability of custom components
  - Is this usable by a screen reader? By voice controls? Only using the keyboard? You're basically asking, "is this well-written code?"
  - There are best practices out there, but custom controls need to be validated through testing with actual users if you want to make sure they're accessible.
- Respecting prefers-reduced-motion
- Should I use a list here? / Is there a better semantic HTML element?
- Is the state of this UI only conveyed by color?
- Is your alt text meaningful? Is an image decorative or not?
- Focus management, especially during client-side routing (I think SvelteKit is handling this)
- Should I use Aria here?

Accessibility is a spectrum, not a binary yes/no.

The compiler has to optimize for false negatives because the warnings aren't globally configurable. So there's no way for someone to turn on stricter a11y warnings if they want to (that could surface more false positives or be annoying), because they'd have to be on for everyone.

Svelte will tell you if you used an attribute wrong, but not necessarily that you should have used an attribute in the first place.

I don't expect Svelte to be able to catch all these things -- it doesn't promise that it will catch all accessibility errors. There are limitations to being a compiler, and there's no reason to jump through hoops to figure out all the values for a given prop when it's much simpler to run an accessibility check in browser. However, it's important to understand the limitations.

## False confidence

I put a poll on Twitter the other day prepping for this. I wanted to know how people think of Svelte's accessibility warnings. I asked whether people expected Svelte's a11y warnings to catch some (below 20%), many (20-50%), most (more than 50%), or all accessibility issues in their site.

Percentage doesn't totally work for a11y -- if you say your app is 80% accessible, what do you mean by that? You can't precisely quantify that. But I wanted to understand people's confidence. If I'm building my app in Svelte and I know it has accessibility warnings, what do I think seeing no accessibility warnings means? And the results were surprising.

**Add actual results here once [poll](https://twitter.com/geoffrich_/status/1381999698643275777?s=20) finishes**

Over half the respondents thought Svelte would catch most or all a11y issues. Almost a quarter thought Svelte would catch all of them. And that's incredibly worrying to me. That the perception is Svelte is going to handle the a11y stuff, so if you don't see warnings you're golden. Because as I think I've shown, there's so much more to a11y that Svelte is not going to catch. If only up to 35% of a11y errors are detectable by any automated tooling, the Svelte compiler is a small subset of that.

From what I've read, Svelte hasn't promised that you're going to be warned about everything. But there also isn't a lot of detail on it, so I see how people could assume that it's something the compiler takes care of, just like the compiler takes care of optimizing your code. There needs to b

So that's the motivation for me doing this. I want people to understand what the compiler is going to catch and what you're going to need to go out and check yourself through other methods. Like, at least run a runtime checker. You should pass Axe or the Google accessibility audit. They're going to catch things that Svelte won't, and they're pretty painless to run. There's other simple manual checks you can do, like make sure you can navigate your site without using the mouse.

Accessibility is complicated. I don't want to scare people away, but you need to understand that there's a lot of depth here and "no Svelte compiler warnings" is not any sort of guarantee that you made an accessible website. As web developers, we have a responsibility to learn and apply accessibility when making websites.

## How could Svelte be better?

There is always going to be something you're going to have to do to validate the accessibility of what you build. The Svelte compiler will not absolve you of that responsibility. However, there are some ways Svelte could improve.

### Integrate with existing tooling

A lot of the existing a11y checks have been slow going because we have to re-implement work already done in the eslint plugin. It would be great if we could somehow integrate this? I know we already do some JSX conversion for typescript support.

We could also integrate runtime checks into the starter Svelte template or SvelteKit when run in dev mode, e.g. [agnostic-axe](https://github.com/dequelabs/agnostic-axe). This will catch things the compiler will never be able to.

Building a compiler is hard enough, let alone keeping up to date with accessibility guidance. There are already some Svelte a11y warnings that were implemented from eslint and are now deprecated.

### a11y warning configuration

We should also look at allowing the existing warnings to be configured at an app level. This would allow for more granularity around how strict the warnings should get. This also means people could turn the warnings off. I don't think they should, but we're adults here -- we can provide sensible defaults but allow people to escape if they want to.

I know this is controversial -- just something to consider. The gray areas around accessibility mean only the most black and white checks can be merged.

> We don't want to include an a11y rule with an implementation that is way overzealous, as that's only going to irritate people.
> &mdash;[Conduitry](https://github.com/sveltejs/svelte/pull/5073#pullrequestreview-466295338)

### Merge existing PRs

There are quite a few a11y warning PRs open.

- [role-has-required-aria-props](https://github.com/sveltejs/svelte/pull/5852)
- [mouse-events-have-key-events](https://github.com/sveltejs/svelte/pull/5938)
- [noninteractive-roles-on-interactive-elements](https://github.com/sveltejs/svelte/pull/5955)
- [click-events-have-key-events](https://github.com/sveltejs/svelte/pull/5073)
- [no-redundant-roles](https://github.com/sveltejs/svelte/pull/5361)

### Documentation

[React](https://reactjs.org/docs/accessibility.html), [Vue](https://v3.vuejs.org/guide/a11y-basics.html), and [Angular](https://angular.io/guide/accessibility) all have dedicated accessibility sections in their docs. Svelte should do the same, especially if it wants to be considered an "a11y-first framework".

Ideas on what to include:

- What accessibility warnings exist?
- What won't Svelte warn you about?
- Links to further resources

Is there an opportunity to hire someone? I don't know if any of the Svelte maintainers is an a11y expert. If Svelte wants to stand out for accessibility, it would be good to do the work.

[GitHub issue](https://github.com/sveltejs/svelte/issues/4119)

## Wrapping up

It's good to see Svelte place value on accessibility. However, I think more needs to be done to educate developers about where the Svelte compiler's responsibility stops and theirs begins.

> We can help educate developers about a11y and make a strong statement about the kind of web we want to be a part of — I think we should.
> &mdash;[Rich Harris](https://github.com/sveltejs/svelte/issues/374)

As a developer, you should take ownership of the accessibility of what you build. Releasing an inaccessible app or site does harm to your users. You don't have to be an expert, but you do have to care. Run other checkers on your webpage. Read some guides to accessibility. Just like anything on the web, you aren't expected to know 100% of everything, but it's good to know what to watch out for and where to look. Know to be careful and do your research when you're building a custom UI component. Learn how to use a screen reader.

## References

a11y resources:

- [MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Smashing Magazine](https://www.smashingmagazine.com/2021/03/complete-guide-accessible-front-end-components/)
- [Accessibility Developer Guide](https://www.accessibility-developer-guide.com/)
- [A11ycasts with Rob Dodson](https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g)

Rich Harris mentioning a11y:

- "We can help educate developers about a11y and make a strong statement about the kind of web we want to be a part of — I think we should." [https://github.com/sveltejs/svelte/issues/374](https://github.com/sveltejs/svelte/issues/374)
- Svelte is an "a11y-first framework" [https://twitter.com/Rich_Harris/status/1008856270084898816](https://twitter.com/Rich_Harris/status/1008856270084898816)
- "Svelte does what it can to enforce a11y" [https://twitter.com/Rich_Harris/status/1109556528707760129?s=20](https://twitter.com/Rich_Harris/status/1109556528707760129?s=20)
- "a11y as a first class consideration" [https://twitter.com/Rich_Harris/status/849727725598146560?s=20](https://twitter.com/Rich_Harris/status/849727725598146560?s=20)
- "But Svelte is about a lot more than perf — it has a ton of other features, e.g. a11y guidance. I've found I've got a lot better at a11y just by having my tooling keep it in my attention. Tools have a responsibility and an opportunity to help us get it right." [https://twitter.com/Rich_Harris/status/1120738299071598593?s=20](https://twitter.com/Rich_Harris/status/1120738299071598593?s=20)
- "Svelte puts it front and center, along with UX." [https://twitter.com/Rich_Harris/status/1142262450273882113?s=20](https://twitter.com/Rich_Harris/status/1142262450273882113?s=20)

People mentioning Svelte's a11y focus:

- "Accessibility (shortened to a11y) isn't always easy to get right, but Svelte will help by warning you if you write inaccessible markup." [https://svelte.dev/tutorial/dynamic-attributes](https://svelte.dev/tutorial/dynamic-attributes)
- "And we now have an accessible JS Camp 2020 website" [https://youtu.be/BzX4aTRPzno?t=1123](https://youtu.be/BzX4aTRPzno?t=1123)
- "Svelte is a good choice for building WCAG-compliant apps." "The fact that Svelte helps developers write more accessible code by default is a feature that sets Svelte apart from most other frontend frameworks I've used" [https://github.com/sveltejs/svelte/issues/4119](https://github.com/sveltejs/svelte/issues/4119)
- "special focus on accessibility" [https://dev.to/mauro_codes/5-things-i-love-about-svelte-39h9](https://dev.to/mauro_codes/5-things-i-love-about-svelte-39h9)
- "accessibility is a first class citizen" [https://dev.to/daveturissini/my-first-impressions-of-svelte-3edl](https://dev.to/daveturissini/my-first-impressions-of-svelte-3edl)
- "Built-in accessibility" [https://dev.to/mhatvan/10-reasons-why-i-recommend-svelte-to-every-new-web-developer-nh3](https://dev.to/mhatvan/10-reasons-why-i-recommend-svelte-to-every-new-web-developer-nh3)
- "built in checks which warn you of any accessibility issues" [https://www.willtaylor.blog/svelte-next-project/](https://www.willtaylor.blog/svelte-next-project/)
- "putting accessibility front and center" [https://twitter.com/karlhorky/status/1120754038524530688?s=20](https://twitter.com/karlhorky/status/1120754038524530688?s=20)
- “Consider a11y as important as we do” [https://twitter.com/antony/status/1362911039956869123?s=21](https://twitter.com/antony/status/1362911039956869123?s=21)

> Accessibility is a big claim though. There is no way a framework can guarantee that. It seems to fall in line with the current trend of stamping ‘accessibility’ on anything at the moment to make it sound polished. I have yet to identify any aspect of Svelte that makes it especially accessible.

[https://levelup.gitconnected.com/has-svelte-come-of-age-86ff5c76da9](https://levelup.gitconnected.com/has-svelte-come-of-age-86ff5c76da9)
