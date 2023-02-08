---
title: 4 takeaways from axe-con 2021
date: '2021-03-29'
tags:
  - a11y
  - conference
socialImage: 'https://geoffrich.net/images/social/axecon-2021.png'
syndication:
  - https://twitter.com/geoffrich_/status/1376569632014790666
---

I recently had the pleasure of attending Deque's [axe-con](https://www.deque.com/axe-con/) digital accessibility conference. Over the course of two days, I attended multiple sessions about many different facets of accessibility. I mainly focused on the developer track at the conference, though I sampled a few talks from other tracks. Here are some of the highlights and what I took away from the sessions I attended.

I link the associated talk in each section, though you may need to [register](https://www.deque.com/axe-con/register/) for the conference to view the recording. Registration is still open at time of publishing.

## Assistive tech is more than just screenreaders

> This is indeed a very good solution for a screen reader user navigating using form controls. But you do not want to do this, because even though it improves the experience for some screen reader users, it excludes users of other assistive technologies and makes these buttons inaccessible to them, and a pain to use. More specifically, inserting visually hidden text in the middle of a visible string of text, or a visible label on a button prevents the users browsing and navigating using voice commands from interacting with the button.
>
> &mdash;Sara Soueidan, "Applied Accessibility: Practical Tips for Building More Accessible Front-Ends"

When I think of types of assistive technology, I immediately think of screen readers. However, there are many other [tools](https://www.w3.org/WAI/people-use-web/tools-techniques/) that people with disabilities use to access websites. One of those tools is speech input software such as Dragon Naturally Speaking, which allows people to control their web browser using their voice.

Sara Soueidan's talk [Applied Accessibility](https://www.axe-con.com/event/applied-accessibility-practical-tips-for-building-more-accessible-front-ends/) gave an example of where improving the experience for screen reader users creates a worse experience for speech input users. When you have multiple "Add to cart" buttons on a page, you may consider adding visually hidden text to each button indicating the associated product (e.g. Add [book] to cart). This makes it clear to screen reader software which product will be added to the cart.

However, putting the hidden text in the middle of the label creates an issue for speech input users. When they instruct the software to click the "Add to cart" button, the software is unable to find it since the actual button name is "Add book to cart." If we instead add the hidden text at the end of the label (e.g. Add to cart[, book]), the speech input software will be able to find the button. For a more in-depth explanation, read [Accessible Text Labels For All](https://www.sarasoueidan.com/blog/accessible-text-labels/) on Sara's blog.

Accessibility is complex and it is not enough to consider one type of person or device. When making improvements, you need to be careful that you're not improving the experience for one but making it worse for another. In the future, I will make sure to consider speech input users in my work.

## Accessibility testing requires multiple levels

Mark Steadman's talk [Automated Accessibility Testing in JavaScript Frameworks](https://www.axe-con.com/event/automated-accessibility-testing-in-javascript-frameworks/) showed how to automate accessibility testing using [axe-core](https://github.com/dequelabs/axe-core). He emphasized the importance of testing accessibility at multiple levels of test, instead of relying solely on unit, integration, or manual tests.

There are many accessibility issues that can be caught at the component level, such as missing alt text and invalid ARIA attributes. However, some issues are only detectable when components interact with each other on an actual page. This includes issues like [duplicate IDs](https://dequeuniversity.com/rules/axe/3.5/duplicate-id), [links with the same name](https://dequeuniversity.com/rules/axe/4.1/identical-links-same-purpose) but different purposes, and [missing heading levels](https://dequeuniversity.com/rules/axe/3.5/heading-order).

We need both kinds of tests (as well as manual testing) to maximize the value of our automated tests.

## Reduced motion does not mean no motion

Val Head's talk [Making Motion Inclusive](https://www.axe-con.com/event/making-motion-inclusive/) showed how to design and use interface animation responsibly. Being respectful towards those with motion sensitivities does not mean disabling animation entirely&mdash;animation has UX benefits and can reduce cognitive load. Instead, we should identify potentially triggering animation and see if we can replace it with something else, like an opacity transition. If your site heavily relies on motion, consider a dedicated toggle like the [Animal Crossing](https://animal-crossing.com/) site has.

Some motion animation can be more triggering than others. In particular, we need to be careful with spinning and parallax effects. You can find an in-depth look at what animation could be potentially triggering in the speaker's article on [A List Apart](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/).

## Read the ARIA docs

> Normally visiting the official standard or spec for any kind of web technology is reserved for the extremely academic types. Most of you have probably never read the official ECMAScript standard, but I want you to treat the official ARIA standard as an API guide to get the most up-to-date information on available properties and options. If you wanna know what something means I urge you to come here first before searching online or reading on some blog.
>
> &mdash;Gerard Cohen, "ARIA Spec for the Uninitiated"

Gerard Cohen's talk [ARIA Spec for the Uninitiated](https://www.axe-con.com/event/aria-spec-for-the-uninitiated/) gave an overview of the ARIA spec and how to apply it to the components you build. Unlike other web specs like the ECMAScript Language Specification, the ARIA spec is surprisingly approachable. It's written like an API guide and should be referenced when you want to know how to use an ARIA role or attribute.

With that said, he made sure to emphasize the [first rule of ARIA](https://www.w3.org/TR/using-aria/#firstrule)&mdash;ARIA should only be used as a last resort, and you should use HTML if possible. Since support for ARIA varies across different browsers and assistive technology, you have to know what you're doing and be willing to manually test.

The most valuable part of his presentation for me was the context he gave around the ARIA authoring practices. When I first encountered these, I treated them as the standard way to implement complex UI patterns accessibly. However, they are only suggestions and following them to the letter does not mean your component is automatically accessible. They don't account for varying ARIA support between browsers, don't take mobile or touch into consideration, and may overuse ARIA, since they're intended as a tool to test ARIA implementations. You need to test the patterns yourself to make sure they work as expected.

The [ARIA practices GitHub](https://github.com/w3c/aria-practices/issues) is a good resource to see where certain patterns fall short.

## Wrapping up

I really enjoyed the talks I attended, and there's still plenty I want to catch up on! If you want to see what others thought, check out the [#axecon](https://twitter.com/search?q=%23axecon) tag on Twitter or [Ben Myers' write-up](https://benmyers.dev/blog/axecon-2021/) on the talks he attended.
