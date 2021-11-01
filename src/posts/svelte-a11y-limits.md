---
title: What Svelte's accessibility warnings won't tell you
date: '2021-10-18'
tags:
  - a11y
  - svelte
socialImage: 'https://geoffrich.net/images/social/svelte-a11y-limits.png'
---

Svelte's accessibility (often shortened to "a11y") warnings are one of the framework's standout features. Per [Rich Harris](https://twitter.com/rich_harris/status/1008856270084898816), Svelte is an "a11y-first framework" that "will _let_ you write non-accessible markup, but it won't respect you for it." Accessibility warnings in the compiler have been a part of the framework [since version 1.38](https://github.com/sveltejs/svelte/issues/374), and are highlighted in the [first section](https://svelte.dev/tutorial/dynamic-attributes) of the tutorial.

When I was first learning about Svelte, I was intrigued by this feature. However, I couldn't find much discussion on what these warnings include. Most mentions of this feature only give image alt text as example&mdash;certainly important, but only a small part of making an accessible web page. Also, until recently, there wasn't much mention of accessibility in the Svelte docs, though now there's a list of the [compiler a11y warnings](https://svelte.dev/docs#Accessibility_warnings).

In this post I will answer a few questions:

- Do frameworks make for less accessible sites?
- Just how effective are Svelte's a11y warnings?
- What won't they warn you about?
- How could Svelte improve?

## The curse of React

Yes, in an article about Svelte I'm starting off by talking about React. Bear with me.

> [React] has greatly simplified the building of complex interactions so everybody rolls their own--but they don't realize they've messed up the accessibility of their apps.
>
> &mdash; [Ryan Florence](https://twitter.com/ryanflorence/status/1095853086478761984?s=20)

The [Curse of React](https://www.youtube.com/watch?v=orq9XnHGTgQ) is that the average React app is _less_ accessible than the average jQuery app. This is because React simplified building UI to the point that developers write their own complex UI components instead of using a standard library like jQuery UI. However, the average developer doesn't know everything that's needed to make something like an autocomplete accessible, resulting in less accessible components.

This curse isn't unique to React&mdash;at this point, the Curse of React is really the curse of UI frameworks in general, including Svelte. Since Svelte is still a developing ecosystem, it suffers even more from the Curse of React. There aren't a lot of options for Svelte component libraries, let alone accessible ones. And because React is still the biggest framework, the best thinkers in accessibility are focusing on that ecosystem (e.g. [React ARIA](https://react-spectrum.adobe.com/react-aria/), [Downshift](https://www.downshift-js.com/), and others).

> I hesitated to mention this last point because it technically has to do with adoption, but I cannot separate it from React's merits: it seems to have the best thinkers on accessibility and interaction design right now. No other ecosystem has projects like Adobe and Devon Govett's React Aria that has extensively thought through and tested for WAI-ARIA so you don't have to. Ditto Segun Adebayo's Chakra UI.
>
> &mdash;Swyx, [Svelte for Sites, React for Apps](https://dev.to/swyx/svelte-for-sites-react-for-apps-2o8h)

So, just like React, it's easy to build an inaccessible component with Svelte. But because Svelte is relatively small, there aren't any battle-tested, widely used component libraries that are more likely to be accessible and there's less for Svelte devs to reuse.

But Svelte's compiler has accessibility warnings, right? So won't that make my Svelte app accessible?

Well, it's complicated. But in summary&mdash;no.

## What accessibility issues does the Svelte compiler catch?

First, I want to review which accessibility issues the compiler will warn you about. You can find all the warnings listed in the [Svelte docs](https://svelte.dev/docs#Accessibility_warnings). In addition, the code behind these warnings is very readable. If you're interested, look at the [Element.ts](https://github.com/sveltejs/svelte/blob/master/src/compiler/compile/nodes/Element.ts) file in the Svelte compiler and search for "a11y".

Reviewing each warning individually could get pretty dry, so I'll provide a high-level overview of the types of issues that will trigger a compiler warning.

Most of Svelte's accessibility warnings focus around attributes on single HTML elements:

- required attributes that are missing (e.g. no `alt` attribute)
- misplaced attributes that shouldn't be there (e.g. `aria-hidden` on a heading)
- invalid attributes (e.g. writing `role="potato"`)

There are also some checks around the structure of the markup in a single component, e.g.:

- `<figcaption>` should be a child of `<figure>`
- label should have a `for` attribute or a child `<input>`
- anchors and headings should have child text content

The rest of the warnings are a grab bag of accessibility best practices&mdash;markup that is technically valid, but is not recommended due to its accessibility impact, e.g.:

- Don't use `<marquee />`
- Don't use `autofocus`
- Don't use positive `tabindex` values

Most of Svelte's checks are copied from [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y#supported-rules). There is also [an open GitHub issue](https://github.com/sveltejs/svelte/issues/820) detailing additional checks the Svelte team would like to add.

## What issues will the compiler overlook?

However, even if all the suggested rules in the above GitHub issue were added, there are still large categories of issues that the Svelte compiler will overlook. If you take one thing away from this post, let it be this:

**Just because you don't see any Svelte compiler warnings doesn't mean you made an accessible website.**

I will focus on issues that aren't detected because they're difficult or impossible to detect with a compiler, not just because no one has implemented them yet.

### Dynamic values

If the value of an attribute is dynamic, the compiler can't be sure what will be placed in that attribute at runtime and will not validate that value.

For example, the compiler warns you if you write `<a href="#">`. But if you make a variable that stores `"#"` and set href to that variable, the compiler won't warn you. This also applies if the value of that attribute is a component prop.

```svelte
<script>
	let href = "#";
</script>

<a href={href}>I'm under the radar</a>
```

This isn't a warning because it's hard for the compiler to determine all the possible values for that variable at compilation time, especially if that variable is populated by an external API response. It can't know if the value of that attribute is an accessibility issue or not.

This limitation is true for any attribute that the compiler would normally warn you about.

### Anything that requires a larger view of the app

Not everything can be detected at the component level. Some issues depend on how the component is used in an application, or on an element present in another component. Many of these checks are easier to do at runtime with a tool like [Axe](https://www.deque.com/axe/devtools/), which has a full view of the rendered application. Svelte's compiler only looks at one component at a time, and has a limited view of the app as a whole.

For example, you shouldn't [skip heading levels](https://www.w3.org/WAI/tutorials/page-structure/headings/) and go from an `<h2>` to an `<h4>`. However, if each heading is in a different component, Svelte won't know that you're skipping a heading level. It's not possible to determine that using static analysis.

```svelte
<!-- Heading2.svelte -->
<h2>
	<slot></slot>
</h2>

<!-- Heading4.svelte -->
<h4>
	<slot></slot>
</h4>

<!-- App.svelte -->
<script>
	import Heading2 from './Heading2.svelte';
	import Heading4 from './Heading4.svelte';
</script>

<Heading2>
	I'm an h2
</Heading2>

<Heading4>
	I'm an h4
</Heading4>
```

Similarly, [duplicate IDs](https://dequeuniversity.com/rules/axe/3.5/duplicate-id) can be an accessibility issue. If two inputs have the same ID, the browser won't know which label goes with which input. However, if you use the same ID in two different Svelte components, the compiler won't be able to determine if that's an issue. Even if it was looking for duplicate IDs, it doesn't know if those two components are ever rendered at the same time.

Even warnings the Svelte compiler does have, like [labels must be linked to an input](https://svelte.dev/docs#a11y-label-has-associated-control), aren't perfect and have blind spots. With the way this warning is currently implemented, Svelte only requires the label to have a `for` attribute or to wrap an input. It doesn't require an input with the matching `id` to exist or for the input to be associated with a label.

```svelte
<!-- This passes, even if there is no input with id="test" -->
<label for="test"></label>

<!-- This passes, even though there is no associated label -->
<input type="text">
```

This is because it's very hard for the compiler to be certain that there is an accessibility issue here. In the first case, there could be an input with `id="test"` _somewhere_, be that another component or even outside the Svelte app entirely. The second case with the standalone input could be easier to detect, but any implementation would likely introduce false positives, where the compiler reports an accessibility issue that is not there.

This is one of the central conundrums of the Svelte compiler's accessibility checks: finding the balance between false positives and false negatives. The compiler optimizes for _false negatives_, or not reporting accessibility issues that are present, so that the number of _false positives_ is minimized. If there are too many false positives, people stop trusting the accessibility warnings. However, this means there are many potential accessibility issues that the compiler will not detect.

### Styling issues

If the accessibility issue is in CSS, Svelte won't detect it. Two examples of these issues are making sure your text has appropriate [color contrast](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG/Perceivable/Color_contrast) and that [keyboard focus](https://www.deque.com/blog/accessible-focus-indicators/) is visible when navigating the page.

These issues are unlikely to become a compiler warning. As above, this is way easier to check in the browser.

### Anything that's subjective

If it can't be a straightforward yes/no answer, the compiler is not going to warn you about it. Svelte's current accessibility checks are just lint rules: they're going to help you get the little things right, but they're not going to guarantee that you've written good code. For example:

- Is animation on the page going to [trigger motion sickness](https://web.dev/prefers-reduced-motion/)?
- Is there a better [semantic HTML](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/HTML) element you could use?
- Is your [alt text](https://webaim.org/techniques/alttext/) meaningful? Is that image really decorative?
- Is the page usable when used with [screen magnification](https://webaim.org/articles/visual/lowvision#magnifiers) software?
- Is your custom dropdown/modal/autocomplete usable by a screen reader? By voice controls? By someone only using the keyboard?

Accessibility can't be reduced to a series of compiler warnings. So much about accessibility is a spectrum, not a binary yes/no. These just aren't things that a automated checker can be certain about.

### Summing up

Those are some of the issues the compiler is unlikely to warn you about anytime soon. And I don't think we should expect it to. There are limitations to being a compiler, and many of these issues are much easier to check in the browser using another automated tool or though manual testing.

And honestly, there are limits to automated accessibility checks. In general, passing some sort of automated accessibility check is **not** a guarantee that your page is accessible, the Svelte compiler included. For more on this, I recommend ["What we found when we tested tools on the world’s least-accessible webpage"](https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/) and ["Building the most inaccessible site possible with a perfect Lighthouse score."](https://www.matuzo.at/blog/building-the-most-inaccessible-site-possible-with-a-perfect-lighthouse-score/) As developers, we can't pass the responsibility of making our sites accessible to an automated tool.

The question is: do Svelte developers understand these limitations exist?

## False confidence

I put a [poll on Twitter](https://twitter.com/geoffrich_/status/1381999698643275777) a few months ago:

> I expect Svelte's accessibility warnings to catch \_\_\_\_ a11y issues.
>
> Where a11y issue is anything that impacts the accessibility of a page (misused attributes, keyboard focus, color contrast, etc)
>
> - Some (<20% of issues)
> - Many (20-50%)
> - Most (>50%)
> - All a11y issues
>
> &mdash; [@geoffrich\_](https://twitter.com/geoffrich_/status/1381999698643275777) on April 13, 2021

You can't really quantify a11y compliance with percentages&mdash;calling your app "80% accessible" is nonsensical. But I wanted to understand people's confidence. If you're building your app in Svelte and you know Svelte has accessibility warnings, what do you think seeing no accessibility warnings means? Does it mean your app is fully accessible? And the results were surprising:

1. Most a11y issues (28.5% of respondents)
2. Some a11y issues (26.3%)
3. All a11y issues (24%)
4. Many a11y issues (21.2%)

Out of 300 respondents, over half (52%) thought Svelte would catch most or all a11y issues. Almost a quarter thought Svelte would catch all of them. And I don't think that's a correct perception. With my examples above, it's clear that there's so much more to accessibility that Svelte won't warn you about.

Even beyond Svelte, automated accessibility checkers don't catch every issue. According to WebAIM, only [25%-35% of accessibility errors](https://webaim.org/projects/million/#method) are detectable using any automated tooling, and the Svelte compiler is a subset of that. You're mistaken if you think using Svelte will mean you're warned about any accessibility issue.

I want to emphasize that _Svelte hasn't promised that_&mdash;there's no false advertising happening here. But there also isn't a lot of documentation on Svelte's accessibility warnings. Accessibility is mentioned in the [tutorial](https://svelte.dev/tutorial/dynamic-attributes) once. If you're unfamiliar with accessibility, I see how you could assume that it's something the compiler takes care of, just like the compiler takes care of optimizing your code.

## How could Svelte be better?

Developers will always have to do something to make sure what they build is accessible. However, I have a few suggestions for Svelte to improve its accessibility tooling and documentation.

### Integrate with existing tooling

A lot of the existing a11y warnings have been slow to implement because Svelte has to re-implement work already done in the [JSX eslint](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y) plugin or in [axe-core](https://github.com/dequelabs/axe-core). Is there a way to use existing packages in the Svelte compiler to detect a11y issues? Building a compiler is hard enough, let alone keeping up to date with accessibility guidance.

Also, with [SvelteKit](https://kit.svelte.dev/), we now know how someone will be building their Svelte app. There could be a way to integrate runtime accessibility checks into the default template. Adding these checks would massively increase the kinds of issues Svelte could detect. I put in a [SvelteKit issue](https://github.com/sveltejs/kit/issues/1265) suggesting that.

### Merge existing PRs

There are quite a few a11y warning PRs open. Merging these PRs would improve Svelte's existing accessibility tooling.

- [role-has-required-aria-props](https://github.com/sveltejs/svelte/pull/5852)
- [noninteractive-roles-on-interactive-elements](https://github.com/sveltejs/svelte/pull/5955)
- [click-events-have-key-events](https://github.com/sveltejs/svelte/pull/5073)
- [no-redundant-roles](https://github.com/sveltejs/svelte/pull/5361)
- [no-nointeractive-tabindex](https://github.com/sveltejs/svelte/pull/6693)
- [click-events-have-key-events](https://github.com/sveltejs/svelte/pull/6652)
- [valid-aria-proptypes](https://github.com/sveltejs/svelte/pull/6316)

### Documentation

I also think Svelte could improve its documentation around accessibility. Currently, it only lists the available [accessibility warnings](https://svelte.dev/docs#a11y-label-has-associated-control). [React,](https://reactjs.org/docs/accessibility.html) [Vue,](https://v3.vuejs.org/guide/a11y-basics.html) and [Angular](https://angular.io/guide/accessibility) all have dedicated accessibility sections in their docs. These sections detail various considerations, practices, and testing around accessibility. Svelte could do the same, or at least link out to further resources. This would help developers better understand what they're responsible for.

### Foster a culture of accessibility

This isn't necessarily on Svelte itself, but on the community. As Svelte developers and content creators, we should take care to make sure what we put out there is accessible, whether that's a blog post, a video, sharing a REPL, or creating a package. Sharing inaccessible demos (for example, a demo that uses `<div on:click>` instead of `<button>`) results in people copying that code for their projects and excluding some of their users. We can do better.

## Wrapping up

As a developer, you should take ownership of the accessibility of what you build. Releasing an inaccessible app or site does harm to your users. The Svelte compiler will help you write accessible markup, but it won't catch everything&mdash;you still need to test your sites for accessibility in other ways. You don't have to be an expert, but you do have to care.

Here's some things you can do that will make a difference:

- Run other checkers like [Axe,](https://www.deque.com/axe/devtools/) [WAVE,](https://wave.webaim.org/) or [Lighthouse](https://web.dev/lighthouse-accessibility/) on your webpage.
- Make sure you can navigate your site only using your keyboard.
- Continue learning about accessibility.
- Learn how to use a screen reader.

I'll link some introductory a11y resources down below, and feel free to reach out to me on Twitter or in the Svelte Discord if you have any questions.

> We can help educate developers about a11y and make a strong statement about the kind of web we want to be a part of — I think we should.
>
> &mdash; [Rich Harris](https://github.com/sveltejs/svelte/issues/374)

## Further a11y resources

- [MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [The A11y Project](https://www.a11yproject.com/)
- [Smashing Magazine](https://www.smashingmagazine.com/2021/03/complete-guide-accessible-front-end-components/)
- [Accessibility Developer Guide](https://www.accessibility-developer-guide.com/)
- [A11ycasts with Rob Dodson](https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g)

_Thanks to [swyx](https://www.swyx.io/) for discussing these ideas with me back when this was a rejected Svelte Summit talk._
