---
title: The limits of Svelte's accessibility warnings
date: '2021-04-26'
tags:
  - a11y
  - svelte
socialImage: ''
---

**ignore this intro -- start below for talk**

Svelte's accessibility warnings are pitched as one of the framework's killer features. Per [Rich Harris](https://twitter.com/rich_harris/status/1008856270084898816), Svelte is an "a11y-first framework" that "will _let_ you write non-accessible markup, but it won't respect you for it." Accessibility warnings in the compiler have been a part of the framework [since version 1.38](https://github.com/sveltejs/svelte/issues/374), and are highlighted in the [first section](https://svelte.dev/tutorial/dynamic-attributes) of the tutorial.

When I first saw this, I was intrigued. However, I couldn't find much discussion on what this actually means. Most mentions of this feature give image alt text as example&mdash;certainly important, but only a small facet of making an accessible web page. Accessibility is only mentioned once in the Svelte docs (how to ignore them).

In this post, I hope to shed light on what kinds of accessibility checks the compiler performs and what other validations you should perform to make sure your Svelte project is accessible.

## Start here

About me: I'm a software engineer at Alaska Airlines, where we use Svelte for one of our microsites in production. I also write about Svelte and accessibility on my blog.

Today, I want to talk about the limits of Svelte's accessibility warnings. But to do that, I need to start by talking about React.

## The curse of React

> [React] has greatly simplified the building of complex interactions so everybody rolls their own--but they don't realize they've messed up the accessibility of their apps.
> &mdash;[Ryan Florence](https://twitter.com/ryanflorence/status/1095853086478761984?s=20)

The Curse of React is a term coined by Ryan Florence. Because React made building complex interactive UI easy, the average React app is less accessible than the average jQuery app.

In the jQuery days no one built their own custom complex UI components because it was too hard. So everyone used these battle-tested jQuery UI dropdowns and modals and autocompletes that happened to be accessible they were so widely used. But React made building custom components easy, so many people roll their own without being aware of what they need to do to make these components accessible.

Svelte makes building complex components easy, some would say even easier than React. So again, everyone rolls their own modal, autocomplete, dropdown, etc. But unless you know what you're doing, you probably made an inaccessible component.

[Inaccessible Svelte autocomplete](https://svelte.dev/repl/884cb7a7cbf54b86b3f0f1f919a0e24b?version=3.37.0)

Since Svelte is a developing ecosystem, it suffers even more from the Curse of React. There aren't a lot of options for Svelte component libraries, let alone accessible ones. And because React is still the biggest framework, the best thinkers in accessibility are focusing on that ecosystem (React Aria, Reach UI, etc).

> I hesitated to mention this last point because it technically has to do with adoption, but I cannot separate it from React's merits: it seems to have the best thinkers on accessibility and interaction design right now. No other ecosystem has projects like Adobe and Devon Govett's React Aria that has extensively thought through and tested for WAI-ARIA so you don't have to. Ditto Segun Adebayo's Chakra UI.
> &mdash;Swyx, [Svelte for Sites, React for Apps](https://dev.to/swyx/svelte-for-sites-react-for-apps-2o8h)

So, just like React, it's easy to build an inaccessible component with Svelte, but because Svelte is relatively small, there aren't any battle-tested, widely used component libraries that are more likely to be accessible.

However, Svelte has an important difference from React -- it's a compiler. And because it's a compiler, it can do things that runtime frameworks can't -- like add accessibility warnings as part of the compilation process. This is often brought up as a unique feature of Svelte.

However, most mentions of this feature don't go in-depth. They usually give the example that Svelte will warn you if you forget image alt text, and stop there. Alt text is certainly important, but only a small part of making an accessible web page.

TRANSITION: So that's what I want to talk about today. What accessibility issues the Svelte compiler will catch, what it won't, and the implications of that.

## What accessibility issues does the Svelte compiler catch?

Most of Svelte's accessibility warnings focus around attributes on single HTML elements:

- required attributes that are missing (no alt text)
- OPTIONAL: misplaced attributes that shouldn't be there (aria-hidden on a heading)
- invalid attributes (invalid aria role)

There's also some checks around the structure of the markup in a single component.

- figcaption should be a child of figure
- label should have a for or a child input
- anchors and headings should have child text content

Most of Svelte's checks are copied from [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y#supported-rules).

OPTIONAL: There is also [an open GitHub issue](https://github.com/sveltejs/svelte/issues/820) detailing additional checks the Svelte team would like to add.

The full list of warnings isn't currently documented anywhere, though you can search for a11y (an abbreviation for accessibility) in the [Element.ts](https://github.com/sveltejs/svelte/blob/master/src/compiler/compile/nodes/Element.ts) source code to see what the compiler is doing.

I don't want to exhaustively review each check, because that would take a while. But what you need to know is that most of them either check individual attributes or do some limited markup validation within a single component.

TRANSITION: However, there are large swathes of accessibility issues that don't fit in those categories.

[documentation PR](https://github.com/sveltejs/svelte/pull/5316)

## What issues will the compiler overlook?

With that in mind, what kinds of issues will the compiler overlook? I want to mainly focus on issues that won't be detected because of how the current checks are set up, not just because no one has implemented them yet. There is something about these issues that makes them unlikely to be detected by the compiler in the future.

### Dynamic values

The the value of an attribute is dynamic (coming from a variable in the script tag), the compiler can't be sure what will be placed in that attribute runtime. So it can't validate that value.

For example, the compiler warns you if you set an href to "#" for an anchor tag. But if you make a variable that stores "#" and set href to that, the compiler won't warn you.

This includes attributes that are set from a component prop.

The reason this isn't implemented is because it's hard for the compiler to determine all the possible values for that variable at compilation time, especially if that variable is populated by an external API response. So I wouldn't expect this to be supported by the compiler warnings anytime soon.

### Anything that requires a larger view of the app

Not everything can be detected at the component level. Some issues depend on the component's use in an application, or an element present in another component.

- Incorrect heading order
  - from h2 to h4
  - no h1
- Unlabeled form inputs
  - This check is tricky to get right, because the label doesn't have to be in the same component. It depends on how the components are used together
  - Currently checks that a label has an associated input (and it's [buggy](https://github.com/sveltejs/svelte/issues/5528)), but not the other way around
- Duplicate IDs
  - Could even be caused by rendering the same component twice with a static ID
- OPTIONAL: Using the correct landmark roles like main and footer

These checks are easy to perform at runtime, with a tool like Axe. Some would be possible to implement in the compiler, but have a lot of tricky edge cases that could result in false positives. These warnings could irritate users of Svelte.

OPTIONAL: The compiler currently has to minimize false positives. This comes at the cost of increasing the number of false negatives, or a11y issues that are missed by the compiler.

OPTIONAL: False positives and false negatives and inversely proportional.

TO EXPAND: Svelte can't disprove a negative (e.g. it can tell you you're using an attribute incorrectly, but not that you should be using it in the first place).

### Styling issues

If the accessibility issue is in CSS, Svelte won't detect it.

- text color contrast
- OPTIONAL: tap target size
- visible focus indicators (hard to demo)

These issues are unlikely to become a compiler warning. As above, this is way easier to check in the browser.

### Anything that's subjective

If it can't be a straightforward yes/no answer, the compiler is not going to warn you about it. Svelte's current accessibility checks are essentially lint rules -- they're going to help you get the little things right, but they're not going to guarantee that you've written good code.

- Is animation on the page going to trigger motion sickness?
- Is there a better semantic HTML element to use here?
- Is your alt text meaningful? Is an image decorative or not?
- Is the page usable when used with screen magnification software?
- Usability of custom components
  - Is this usable by a screen reader? By voice controls? Only using the keyboard? Svelte can't be certain about that.
  - There are best practices out there, but custom controls need to be validated through testing with actual users if you want to make sure they're accessible.
- OPTIONAL: Is the state of this UI only conveyed by color?

OPTIONAL: So much about accessibility is a spectrum, not a binary yes/no. There is almost always something you can improve in your application to make it more accessible.

### Summing up

So, those are some of the issues the compiler is unlikely to warn you about anytime soon. And I don't think we should expect it to. There are limitations to being a compiler, and many of these issues are much easier to check in the browser using another automated tool like Axe or manually checking yourself. So that's the understanding I've come to.

TRANSITION: The question is -- do Svelte developers understand that this gap exists?

## False confidence

I put a poll on Twitter the other day preparing for this. I wanted to know how people think of Svelte's accessibility warnings. I asked whether people expected Svelte's a11y warnings to catch some accessibility issues (below 20%), many (20-50%), most (more than 50%), or all accessibility issues in their site.

Percentage doesn't totally work for a11y -- if you say your app is 80% accessible, what do you mean by that? You can't precisely quantify that. But I wanted to understand people's confidence. If I'm building my app in Svelte and I know Svelte has accessibility warnings, what do I think seeing no accessibility warnings means? And the results were surprising.

- Some: 26.3%
- Many: 21.2%
- Most: 28.5%
- All: 24%

Out of 300 respondents, over half (52%) thought Svelte would catch most or all a11y issues. Almost a quarter thought Svelte would catch all of them. And that's incredibly worrying to me. That the perception is Svelte is going to handle the a11y stuff, so if you don't see warnings your app must be accessible. Because as I think I've shown with examples of issues the compiler won't catch, there's so much more to a11y that Svelte is not going to warn you about.

OPTIONAL: Even in general, automated accessibility checkers don't catch every accessibility issue. According to a11y experts WebAIM, only [25%-35% of accessibility errors](https://webaim.org/projects/million/#method) are detectable using any automated tooling, and the Svelte compiler is a subset of that.

So you're mistaken if you think using Svelte will mean you're warned about any accessibility issue.

From what I've read, Svelte hasn't promised that. But there also isn't a lot of documentation on Svelte's accessibility warnings -- accessibility is mentioned in the docs once (how to ignore the checks) and in the tutorial once. If you're unfamiliar with accessibility, I see how you could assume that it's something the compiler takes care of, just like the compiler takes care of optimizing your code.

So that's the motivation for me having this discussion. I want people to understand what the compiler is going to catch and what you're going to need to go out and check yourself through other methods. Just because you don't see any Svelte compiler warnings does not guarantee that you made an accessible website. As web developers, we have a responsibility to do our best to make what we build accessible.

## How could Svelte be better?

NOTE: depending on time, only mention documentation

You're always going to have to do something to make sure what you build is accessible. However, I have a few ideas for what Svelte could do to improve its accessibility tooling and documentation.

- documentation
- integrate with existing a11y tooling
- allow for more configuration

### Integrate with existing tooling

A lot of the existing a11y checks have been slow going because we have to re-implement work already done in the JSX eslint plugin. In addition, there are already some Svelte a11y warnings that were implemented that eslint has now deprecated. Maybe there's a way to integrate the plugin into Svelte. I know we already do some JSX conversion for typescript support. Building a compiler is hard enough, let alone keeping up to date with accessibility guidance -- let's reuse what we can.

Some issues will never be detectable at compile time and need to be done in a browser. There are packages that automatically run accessibility checks in the browser during development, for example, [agnostic-axe](https://github.com/dequelabs/agnostic-axe). This package could be integrated into the starter Svelte template or SvelteKit so that it's easy to run those extra checks.

### a11y warning configuration

In its current state, the compiler has to suppress false positives at the risk of false negatives. The a11y checks could take more risks if they were configurable at an app level.

This would allow for more granularity around how strict the warnings should get. Maybe I know my labels will always be in the same component as their inputs, so you should warn me if my input is missing a label.

I realize that this also means people could turn the warnings off easily, but I think as long as we provide sensible defaults, people won't want to.

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

[React](https://reactjs.org/docs/accessibility.html), [Vue](https://v3.vuejs.org/guide/a11y-basics.html), and [Angular](https://angular.io/guide/accessibility) all have dedicated accessibility sections in their docs. Svelte should do the same, especially if it wants to be considered an "a11y-first framework", as Rich Harris has said.

Ideas on what to include:

- What accessibility warnings exist?
- What won't Svelte warn you about?
- Links to further resources

OPTIONAL: Is there an opportunity to hire someone? I don't know if any of the Svelte maintainers is an a11y expert. If Svelte wants to stand out for accessibility, it would be good to do the work.

[GitHub issue](https://github.com/sveltejs/svelte/issues/4119)

## Wrapping up

It's good to see Svelte place value on accessibility. However, I think more needs to be done to educate developers about where the Svelte compiler's responsibility stops and their responsibility begins.

As a developer, you should take ownership of the accessibility of what you build. Releasing an inaccessible app or site does harm to your users. You don't have to be an expert, but you do have to care.

OPTIONAL: Run other checkers like Axe or WAVE on your webpage. Make sure you can navigate your site without using the mouse. Read some guides to accessibility. Know to be careful and do your research when you're building a custom UI component. Learn how to use a screen reader.

OPTIONAL: Just like anything on the web, you aren't expected to know 100% of everything, but it's good to know what to watch out for and where to look when you encounter a problem.

To sum up:

- The Svelte compiler will help you write accessible markup, but it won't catch everything
- You still need to test your sites for accessibility in other ways
- That's part of your responsibility as a web developer

I'll link some introductory a11y resources down below, and feel free to reach out to me on Twitter or in the Svelte discord if you have any questions.

You can read more of my writing at my personal site, geoffrich.net, or on Twitter @geoffrich\_

> We can help educate developers about a11y and make a strong statement about the kind of web we want to be a part of — I think we should.
> &mdash;[Rich Harris](https://github.com/sveltejs/svelte/issues/374)

Copied from suggestions. Might use in blog post, but not in conversation.

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

## swyx's notes

- OWASP Top 10 for a11y -- accessibility experts don't make a11y accessible
- Sounds not very framework specific
- Maybe make it more general and don't scope it to Svelte specifically
- Not the way it's marketed
- What linting does for you
- Try not to make it a brain dump -- focus on a compelling narrative
- The Curse of React is the curse of every other framework
- Fragmentation, no standard library
- Reach UI et al more immature
- Downshift good -- only trying to do one thing
- Title Idea: The Curse of Frameworks
- Hook in the pro-framework crowd

Should pitch to CSS Tricks.

The Curse of Frameworks: The Curse of React applies to all frameworks
Accessibility is more than linting

Also video for Svelte Society YT channel:

- stripped down version of this?
