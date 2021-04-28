---
title: What accessibility issues does Svelte detect?
date: '2021-04-19'
tags:
  - a11y
  - svelte
socialImage: ''
---

There is no documentation on what checks Svelte performs when it looks for accessibility issues (though there is an [open PR](https://github.com/sveltejs/svelte/pull/5316) to add this). You can identify these checks by looking at the [Svelte source code](https://github.com/sveltejs/svelte/blob/master/src/compiler/compile/nodes/Element.ts) and searching for "a11y". In this post, I will review and categorize the existing accessibility checks.

Most of Svelte's checks are copied from [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y#supported-rules). Unlike an eslint plugin, there is no way to enable or disable certain checks. Instead, you can turn off warnings for specific lines with an HTML comment.

```html
<!-- svelte-ignore a11y-autofocus -->
<input type="text" autofocus />
```

There is [an open GitHub issue](https://github.com/sveltejs/svelte/issues/820) detailing additional checks the Svelte team would like to add.

Svelte's accessibility warnings fall into three categories:

- HTML validation: use of attributes on the wrong element or missing required attributes.
- ARIA use: warnings regarding improper use of ARIA attributes and roles
- Best practices: markup that is technically valid, but is not recommended due to its accessibility impact.

I will explain the warnings in each category and give an example of code that triggers the warning.

## HTML validation

### a11y-misplaced-scope

Scope should only be used on `<th>`.

```html
<!-- A11y: The scope attribute should only be used with <th> elements -->
<div scope="row"></div>
```

### a11y-missing-attribute

This requires certain attributes for various tags:

- `<a>` should have an href (unless it's a [fragment-defining tag](https://github.com/sveltejs/svelte/issues/4697))
- `<area>` should have alt, aria-label, or aria-labelledby
- `<html>` should have lang
- `<iframe>` should have title
- `<img>` should have alt
- `<object>` should have title, aria-label, or aria-labelledby
- `<input type="image">` should have alt, aria-label, or aria-labelledby

* a11y-label-has-associated-control -- labels should have a child inputs (e.g. button, input, etc) or a for attribute (likely broken if child is a component, need to test)
* a11y-structure -- figcaption must be an immediate child of figure and either the first or last child
* a11y-required-content -- anchors and heading must have content

## ARIA use

- a11y-aria-attributes -- meta/html/script/style should not have aria- attributes
- a11y-misplaced-role -- meta/html/script/style should not have role
- a11y-unknown-aria-attribute -- aria attributes should be valid
- a11y-hidden -- headings should not have aria-hidden
- a11y-unknown-role -- aria roles should be valid

## Best practices

- a11y-positive-tabindex
- a11y-invalid-attribute -- href should not be empty, '#', or 'javascript:'
- a11y-img-redundant-alt -- alt value should not contain "image", "picture", or "photo" (duplicate SR announcement)
- a11y-no-onchange -- don't use on:change on selects (controversial)
- a11y-distracting-elements -- avoid blink and marquee tags
- a11y-accesskey -- don't use accesskey
- a11y-autofocus -- don't use autofocus
- a11y-media-has-caption -- media elements must have a captions track (controversial, especially with audio elements)
