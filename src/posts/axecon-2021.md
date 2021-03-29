---
title: 4 takeaways from axe-con 2021
date: '2021-03-15'
tags:
  - a11y
---

I recently had the pleasure of attending Deque's [axe-con](https://www.deque.com/axe-con/) digital accessibility conference. Over the course of two days, I attended multiple sessions about many different facets of accessibility. As a developer, I mainly focused on the developer track at the conference, thought I sampled a few talks from other tracks. Here are some of the highlights and what I took away from the sessions I attended. I link the associated talk in each section, though you may need to [register](https://www.deque.com/axe-con/register/) for the conference to view the recording. At time of publishing, registration is still open.

## Assistive tech is more than just screenreaders (Sara Soueidan)

> This is indeed a very good solution for a screen reader user navigating using form controls. But you do not want to do this, because even though it improves the experience for some screen reader users, it excludes users of other assistive technologies and makes these buttons inaccessible to them, and a pain to use. More specifically, inserting visually hidden text in the middle of a visible string of text, or a visible label on a button prevents the users browsing and navigating using voice commands from interacting with the button.

Often when thinking about assistive technology used to browse the web, we only think of screen readers. However, there are many other [tools](https://www.w3.org/WAI/people-use-web/tools-techniques/) that people with disabilities use to access websites. One of those tools is speech input software such as Dragon Naturally Speaking, which allows people to control their web browser using their voice.

Sara Soueidan's talk [Applied Accessibility](https://www.axe-con.com/event/applied-accessibility-practical-tips-for-building-more-accessible-front-ends/) included several practical examples of building accessible front-ends. She showed a case study where having many "Add to cart" buttons on a page corresponding to different products can be confusing when browsing a list of all form controls on the page in a screen reader software like VoiceOver. One way to improve this experience is to add visually hidden text to each button indicating which product it relates to (e.g. Add [book] to cart). However, putting the hidden text in the middle of the label creates an issue for speech input users, since they expect to find a button starting with "Add to cart". Instead, we should add the product name at the end of the label (e.g. Add to cart[, book]), so that speech input software can still recognize the button.

Accessibility is complex and it is not enough to consider one type of person or device. When making improvements, you need to be careful that you're not improving the experience for one but making it worse for another. In the future, I will make sure to consider speech input users in my work.

Sara's talk also had some great tips around icon buttons and custom radio buttons and checkboxes. After the conference, Sara published [Accessible Text Labels For All](https://www.sarasoueidan.com/blog/accessible-text-labels/) on her blog, which reviews the same material that I summarized above.

## Accessibility testing requires multiple levels (Mark Steadman)

Mark Steadman's talk [Automated Accessibility Testing in JavaScript Frameworks](https://www.axe-con.com/event/automated-accessibility-testing-in-javascript-frameworks/) showed how to test accessibility using [axe-core](https://github.com/dequelabs/axe-core). He emphasized the importance of testing accessibility at multiple levels of test, instead of only unit tests or only integration tests.

There are many accessibility issues that can be caught at the component level. Like missing alt text and invalid ARIA attributes. However, some issues will only be detectable when components interact with each other on an actual page. This includes issues like duplicate IDs, links with the same name but different purposes, and missing heading levels

We need both kinds of tests (as well as manual testing) to maximize the value of our automated tests.

## Reduced motion does not mean no motion (Val Head)

Val Head's talk [Making Motion Inclusive](https://www.axe-con.com/event/making-motion-inclusive/) showed how to design and use interface animation responsibly. Being respectful towards those with motion sensitivities does not mean disabling animation entirely&mdash;animation has UX benefits and can reduce cognitive load. Instead, we should identify potentially triggering animation and see if we can replace it with something else, like an opacity transition. If your site heavily relies on motion, consider a dedicated toggle like the [Animal Crossing](https://animal-crossing.com/) site has.

In particular, we need to be careful with spinning and parallax effects, among others. You can find an in-depth look at what animation could be potentially triggering in the speaker's article on [A List Apart](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/).

## Read the ARIA docs (Gerard Cohen)

> Normally visiting the official standard or spec for any kind of web technology is reserved for the extremely academic types. Most of you have probably never read the official ECMAScript standard, but I want you to treat the official ARIA standard as an API guide to get the most up-to-date information on available properties and options. If you wanna know what something means I urge you to come here first before searching online or reading on some blog.

Gerard Cohen's talk [ARIA Spec for the Uninitiated](https://www.axe-con.com/event/aria-spec-for-the-uninitiated/) walked through the ARIA spec and how to apply it to the components you build. Unlike other web specs like the ECMAScript standard, the ARIA spec is surprisingly approachable. It's written like an API guide and should be used when you want to know how to use an ARIA role or attribute.

With that said, he made sure to emphasize the [first rule of ARIA](https://www.w3.org/TR/using-aria/#firstrule) and that ARIA should be used as a last resort. It requires a lot of cross-browser and assistive tech testing since support for ARIA varies. There's no way to test for support like in JavaScript or CSS, so you have to know what you're doing and be willing to put in the work.

The most valuable part of his presentation for me was the context he gave around the ARIA authoring practices. When I first encountered these, I treated them as the standard way to implement complex UI patterns. However, they are only a guide, and implementing them does not mean your componet as accessible. They don't account for varying ARIA support between browsers, so you need to test the patterns yourself to make sure they work as expected. They also don't take mobile or touch into consideration and may overuse ARIA, since they're intended as a tool to test ARIA implementations.

You can find a healthy discussion around the ARIA AP patterns on the [ARIA practices GitHub](https://github.com/w3c/aria-practices/issues).

## Wrapping up

I really enjoyed the talks I attended, and there's still plenty I want to catch up on! If you want to see what others thought, check out the [#axecon](https://twitter.com/search?q=%23axecon) tag on Twitter or [Ben Myers' write-up](https://benmyers.dev/blog/axecon-2021/) on the talks he attended.
