---
title: Building a progress stepper
date: '2020-10-17'
tags:
  - front-end challenges club
  - html
  - css
  - js
---

I had a great time solving [the latest challenge](https://piccalil.li/blog/challenge-008-progress-stepper/) from Andy Bell's Front-End Challenges Club! I'm looking forward to see how he solved it, but [here's my solution ](/demos/front-end-cc-008/) and some notes on my approach.

## Using an ordered list

This brief seemed like a great use case for an ordered list.

```html
<ol class="progress">
  <li>Your basket</li>
  <li>
    Your details and also some other stuff you probably skipped over
  </li>
  <li aria-current="step">Payment</li>
  <li>Order complete (no turning back now)</li>
  <li>Crushing regret</li>
</ol>
```

I tweaked the copy a bit so I had both long and short text to work with. I also chose to use the [aria-current](https://www.w3.org/TR/wai-aria-1.1/#aria-current) attribute to indicate the current step. The checkmark styling will indicate this visually, but this attribute is needed so that all users understand what the current step is.

I had previously only seen this attribute used to indicate the current page in a list of navigation links, but this seemed like a great use-case as well. Adding this attribute has NVDA announce "current step Payment" while navigating through the list items.

At this point, without any styling or scripting, we have a solid HTML foundation that works great with screen readers. There's no visual indication as to what the current step is, but we'll get to that next.

## Augmenting the HTML with JavaScript

With the foundation complete, I wanted to use JavaScript to augment the HTML with the step number text and state of the checkmark (e.g. checked, partially checked, unchecked). This way, the user of this component only needs to write an ordered list with the class "progress" and mark the current step with the `aria-current` attribute to initialize the stepper. After the JavaScript runs, the initialized list item looks something like this:

```html
<li data-state="previous">
  <div class="checkmark">
    <svg aria-hidden="true">
      [Truncated]
    </svg>
  </div>
  <span class="eyebrow">
    <span class="counter" aria-hidden="true">01</span>
    Step one
  </span>
  <span class="title">Your basket</span>
</li>
```

### What to hide from screen readers?

I set `aria-hidden` on both the checkmark SVG and the counter text to hide them from screen readers. I believed the checkmark SVG was redundant because I am already indicating the current step with `aria-current`, and the counter text is redundant because "Step one" will also be read out.

### Using data attributes for styling

I also set a `data-state` attribute on the `<li>` to indicate whether it is a previous, current, or upcoming step. [This is taken from the CUBE CSS methodology](https://piccalil.li/cube-css/exception/), also by Andy Bell. This gives us a hook that can be used by CSS and JavaScript. This attribute is set based on the presence of the `aria-current` attribute, which ensures the stepper is accessible by default.

The JavaScript sets it...

```js
const listItems = document.querySelectorAll('.progress li');

let hasCurrentBeenReached = false;
listItems.forEach((item, idx) => {
  const current = item.getAttribute('aria-current');
  if (current === 'step') {
    hasCurrentBeenReached = true;
    item.dataset.state = 'current';
  } else if (!hasCurrentBeenReached) {
    item.dataset.state = 'previous';
  } else {
    item.dataset.state = 'upcoming';
  }

  item.innerHTML = getListItemContents(item.innerHTML, idx);
});
```

And the CSS uses it!

```css
.progress li[data-state='previous'] svg {
  opacity: 1;
}

.progress li[data-state='current'] .checkmark {
  background: var(--color-primary-glare);
}

.progress li[data-state='upcoming'] .checkmark {
  border-color: var(--color-secondary);
  background: var(--color-secondary-glare);
}
```

I really like using data attributes like this instead of toggling CSS classes. See the CUBE CSS link up above for more on this.

### Generating number words

There were [all sort of solutions on Stack Overflow](https://stackoverflow.com/questions/14766951/convert-digits-into-words-with-javascript) for getting the word for a number, i.e. "Step One", "Step Two", etc. I didn't think it was worth the trouble, since the progress stepper will likely only have a few items in it. I ended up using a hard-coded array instead, with a fallback to the number itself if it was missing.

```js
const numberWords = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen'
];

function getEyebrow(index) {
  const counter = (index + 1).toString().padStart(2, '0');
  return `
      <span class="eyebrow">
        <span class="counter" aria-hidden="true">${counter}</span>
        ${numberWords[index] ? `Step ${numberWords[index]}` : `Step ${index + 1}`}
      </span>
    `;
}
```

## Being careful with JavaScript

Because JavaScript is setting the number text, I use CSS to remove the default list numbers.

```css
.progress[data-init] {
  list-style: none;
}
```

However, note that I look for the presence of a data attribute. This way, we do not preemptively remove the list styling without something to replace it. Once the attribute is set the number text has been generated, so we can safely remove the list styling.

```js
progressList.dataset.init = true;
```

How does Safari behave?

## Styling

The actual styling of the progress stepper was pretty straightforward. Most of it was a lot of absolute or relative positioning of various elements. I styled everything from scratch, so there is probably some redundant styling that would be solved with a better base stylesheet.

### Generated counters?

I did look into using CSS to generate the counter ("01", "02", etc.) using a pseudo-element so that I didn't need to manually add a `<span class="counter">01</span>` element. However, since I also wanted to prevent it from being read by screen readers, this didn't appear to be possible. Pseudo-elements are read out if their parent element is read out, so I didn't have a way to just hide the pseudo element.

I also ran across [@counter-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@counter-style) in my research which seemed like it might be a way to generate the "Step One" text using CSS. I didn't experiment with it much, though, since it's only supported in Firefox.

I'm interested to see if Andy's solution uses any CSS-generated counters or if he took a similar approach to mine.

## An interactive demo

Lastly, I wanted to make it easy to add items to the list and move around the current step to see how the demo behaves in different states. You'll notice a small form at the top of the page that adds items to the list and moves around the current step. I added some small CSS transitions on the progress line that are _very_ satisfying to play around with.

The form is accessible in the sense that everything is labeled properly, but it could probably do more with announcing what changed when buttons are clicked. I didn't have time to test this thoroughly and it wasn't technically part of the challenge, so I skipped it for now.

## Wrapping up

Thanks for taking the time to read my post! I had a blast with this challenge and can't wait to try the next one.
