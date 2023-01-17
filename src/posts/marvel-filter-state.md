---
title: Progressively enhancing the Marvel By Year filter
date: '2023-01-16'
tags:
  - side project
  - svelte
  - sveltekit
socialImage: 'https://geoffrich.net/images/social/marvel-filter-state.png'
metaDesc: Using SvelteKit, form.requestSubmit, and Zod to build a robust Marvel Comics search experience.
---

Marvel Unlimited By Year (a.k.a. MUBY) is a [site I built](/posts/marvel-unlimited-by-year/) to browse Marvel comics by release year. For example, this is [all the comics released in 1982](https://marvel.geoffrich.net/year/1982) that you can read on Marvel Unlimited. Each page has a set of inputs that let you filter which comics are shown. You can filter issues by title, release month, series, creator, and event, and sort them in various orders.

<img src="/images/marvel-filter-state/filter.png" alt="Screenshot of the MUBY filter UI" title="What the filter currently looks like">

These filters only worked on the client-side &mdash; you couldn't use them if you didn't have JS enabled, and any filters you applied would be lost when you refreshed the page. There was also a particular gnarly setup to keep track of selected creators/events/series across page loads &mdash; see the [persistence](#heading-persistence) section further down for more details on that.

I recently did a lot of progressive enhancement experiments with [Advent of SvelteKit 2022](https://advent-of-sveltekit-2022.vercel.app/) and wanted to bring over some of those techniques to this site. My goals were:

1. Move filter state into the URL to make sharing and persisting filter state easier
1. Use web platform primitives like `<form>` so that the site still works when JS is unavailable

(Note that this particular site doesn't call an API to do any filtering &mdash; I just get the raw data from the Marvel API and then implement any filtering needed myself.)

Here's a quick overview of what I did. Some of these techniques may be expanded into full posts in the future.

You can find the [full PR](https://github.com/geoffrich/marvel-by-year/pull/13) on GitHub if you're really curious.

## Goodbye bind:value, hello &lt;input name&gt;

To meet my goals, instead of reading the values of the inputs with [Svelte input bindings](https://svelte.dev/docs#template-syntax-element-directives-bind-property) and updating the state of the page accordingly, I needed to put them in a `<form>` and give them [names](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#name) so that the values would be submitted with the form.

```svelte
<form>
    <label>Search <input type="text" name="search"/></label>
    <Select
        options={sortOptionText}
        values={sortingOptions}
        id="sorting"
        name="sortBy">Sort by</Select
    >
    <Select options={months} id="month" name="month">Release Month</Select>
    <label><input type="checkbox" name="ascending" />Ascending</label>
</form>
```

Since the form's method was GET, submitting the form would put the values of the inputs in the URL as query parameters (goal #1), and because it was a form, it would work without JS (goal #2).

I then needed to get the values out of the URL to use them to update the UI. In SvelteKit, this can be implemented as a reactive statement reading `$page.url.searchParams`, which holds the page's current query params. I'll show how I made this type-safe in a later section.

```js
$: search = $page.url.searchParams.get('search');
$: sortBy = $page.url.searchParams.get('sortBy');
// and so on
```

But with this initial implementation, we introduced a UX regression &mdash; the page no longer updates as you fill in the form and toggle checkboxes. Instead, you have to click "Submit".

## Automatically submitting the form with requestSubmit

To fix this, I reached for a method I used on quite a few Advent of SvelteKit challenges: [requestSubmit](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit). Unlike the normal `submit` function which only submits the form (and triggers a full-page refresh), `requestSubmit` will behave identically to the user clicking the submit button: it will run validation, custom submit handlers, and other goodies.

So, by calling `requestSubmit` on every form change, we'll automatically update the page and filter the displayed comics without the user needing to click "Submit". It ended up looking something like this:

```svelte
<script>
	let form;
	const requestSubmit = () => form.requestSubmit();
	const debouncedSubmit = debounce(requestSubmit, 250);
</script>

<form
	bind:this={form}
	on:input={debouncedSubmit}
	on:change={requestSubmit}
>
```

For input events, I called a debounced version of the submit (using the zero-dependency utility library [Just](https://github.com/angus-c/just#just-debounce-it)) that only fired every 250ms. This way we don't run the filter logic on every keypress; instead, we give the user a chance to finish typing. Since changing a select or checkbox are single actions, we'll immediately submit the form on change events.

But this introduced a new problem &mdash; SvelteKit will [automatically trigger a client-side navigation](https://kit.svelte.dev/docs/form-actions#get-vs-post) when you submit a `<form method="GET">`, but it will also reset the page focus and add a new entry to the browser history. In this case, I didn't want that:

1. We don't want to move the user's focus away from the text box when they're still typing
1. We also don't want a new browser history entry for partial search strings. If they're typing "Black Panther," we don't want history entries for "Bla", "Black P", and "Black Panther".

There is a [feature request](https://github.com/sveltejs/kit/issues/7895) to allow customizing this behavior on `<form method="GET">`, but for now, I implemented a custom submit handler that keeps focus and replaces the current history entry when submitting the form.

```ts
// add to form with on:submit={submitReplaceState}
export function submitReplaceState(e: SubmitEvent) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const url = new URL(form.action);
  // @ts-expect-error
  const params = new URLSearchParams(new FormData(form));
  url.search = params.toString();
  goto(url, {replaceState: true, keepFocus: true, noScroll: true});
}
```

It's worth noting that `requestSubmit` was only [recently supported in Safari](https://caniuse.com/?search=requestsubmit) (16.0 and above), so I ended up [polyfilling it](https://github.com/javan/form-request-submit-polyfill). You could also consider falling back to `submit`, though keep in mind that will trigger a full-page reload if they don't support `requestSubmit`.

## +page.ts or nah?

I briefly experimented with moving the query parameter parsing logic inside a `+page.ts` load function (a.k.a. [universal load function](https://kit.svelte.dev/docs/load#universal-vs-server)). I wanted to keep it out of `+page.svelte` to avoid making that file too messy. Instead, the `load` function would return a `filter` object (parsed from the list of query params) that represented the state of the form. However, I wanted to make sure that while doing this I was _not_ refetching the list of comics in the server load function on every form change, since that was a lot of data and would be wasteful.

Surprisingly, this worked &mdash; the universal load function re-ran when the query parameters changed, and it did not re-run the server load function in `+page.server.ts`. However, it did have an unintended side effect. Because the universal load function re-ran, it returned a new `data` object, and all the reactive statements that used that `data` object _also_ re-ran. In particular, the code to transform the giant list of comics into a list of unique creators/series/events on those comics was re-running on every form change, which seemed wasteful.

Because of this, I kept the query param parsing logic inside `+page.svelte`, which seemed to work fine and did not invalidate the entire page `data` object. (The query param parsing logic will become one line in a later section, so the impact on `+page.svelte` length is negligible.)

## Checkbox weirdness

Turning everything into a real form input did bring some weirdness with it. For instance, before these changes, I had a "Descending" checkbox that defaulted to "checked". However, I couldn't figure out a good way to default it to checked &mdash; if it was checked by default, but not in the URL, then how would we determine if we're in an actual "unchecked" state? It wasn't that big a deal, so I flipped it to be "Ascending" instead and default to unchecked.

Also, the creator/series/event filters had a massive number of checkboxes that used to be enabled by default. Now that they're in a form, submitting that form would make the URL absolutely ginormous, since each checkbox would appear as a query param (e.g. "&creator=1&creator=2&creator=3...").

To work around this, I updated the filter checkboxes to be unchecked by default, and for the UI to treat "no creators selected" the same as "all creators selected." This meant there wasn't an easy way to select all but one creator, but I don't think that's a common use case.

Now instead of "Check all" and "Uncheck all" buttons, there's just one "Select all" button that unchecks anything.

## Type-safe query param parsing with zod-form-data

So everything is a query param now, which is _cool_ for progressive enhancement, but everything being a query param means everything is also a string, which is _bad_ for type safety. Enter: [Zod](https://github.com/colinhacks/zod), which will parse our search params, validate that they adhere to a given schema, and return a fully typed object. I also used [zod-form-data](https://www.npmjs.com/package/zod-form-data) (which was written for Remix, but can be used here since SvelteKit also uses web Request/URL objects) to make parsing URLSearchParams easier.

Here's what my schema ended up looking like:

```ts
import {z} from 'zod';
import {zfd} from 'zod-form-data';

const SortOptionEnum = z.enum(['BestMatch', 'Title', 'PublishDate', 'UnlimitedDate']);

const MonthEnum = z.enum(['all', 'Jan', 'Feb', 'Mar' /* etc. */]);

export const SortOption = SortOptionEnum.enum;
export const Month = MonthEnum.enum;

const multiCheckbox = zfd.repeatable(z.array(zfd.numeric())).catch([]);

export const filterSchema = zfd.formData({
  search: zfd.text(z.string().default('')),
  ascending: zfd.checkbox(),
  // use catch in case no value or bad value passed
  sortBy: zfd.text(SortOptionEnum.catch('BestMatch')),
  month: zfd.text(MonthEnum.catch('all')),
  series: multiCheckbox,
  creator: multiCheckbox,
  event: multiCheckbox
});
```

Which I could then use like so on the page:

```js
$: filter = filterSchema.parse($page.url.searchParams);
```

Then `filter` would be something like this object, which I could use in my various filtering/sorting functions:

```js
{
    search: "spiderman",
    ascending: false,
    sortBy: 'BestMatch',
    month: 'all',
    series: [],
    creator: [1,2],
    event: [67]
}
```

I made liberal use of [catch](https://github.com/colinhacks/zod#catch) to provide default values when the data couldn't be parsed.

This was extremely helpful to catch bugs when I was refactoring existing logic, since the new search params had defined types instead of just being a string. Some of the zod-form-data constructs were a little wordy, but I'm not sure if that's because I was using it incorrectly. I did run into [a bug](https://github.com/airjp73/remix-validated-form/issues/230) using ZFD with Vite, which I was able to work around by putting it in [noExternal](https://vitejs.dev/config/ssr-options.html#ssr-noexternal).

I'm pretty new to Zod, but look forward to exploring it more in the future.

## Persistence

Now since everything is a query param, all I have to do to persist the filter state across different pages is append the query params to the next/prev links:

```svelte
<a href="/year/{year + 1}{$page.url.search || ''}">Next year</a>
```

This also simplified the code around persisting the series/creator/event checkbox state between pages. This has been a tricky part of the code historically, since the checkbox options for those filters are completely different between pages &mdash; 1982 will have different series released than 1983 (though with some overlap). But I didn't want to reset the selected filters between pages. Ideally if you have "Avengers" selected on 1982 and click on to 1983, "Avengers" should still be selected.

The previous iteration of this code had a complicated custom store factory setup that kept track of the previous selected state and updated it to 1) remove any selected options not present on the new page and 2) keep selected options around that are on the new page. I didn't really want to touch this code now that everything is a query parameter. Instead, I wanted to see what happened if I simply forwarded on the selected query parameters and derive the new filter state based on that (solving requirement #2). So if you have ?series=2&series=3 in the URL, going on to the next page would keep those in the URL. And... this pretty much worked!

I don't have to worry about selected options not present on the new page &mdash; when the user selects another option, it will only put the new option in FormData (since this is how forms work) and not keep the old one around.

I probably could have simplified the code in a similar way without forms, but "thinking in FormData" unlocked this simpler solution for me.

# Submitting when no JS available

Lastly, we automatically submit the form when JS is available, but what about when it's not? On the text input you can hit "Enter" to submit the form and reload the page, but this doesn't work well with the checkboxes &mdash; you would have to select a checkbox, focus the text input, and hit "Enter". This isn't a great experience. It would be much better if we had an actual submit button.

However, I didn't want a submit button when JS is available, because it wouldn't do anything since the form is automatically submitted.

One option would be to have a submit button on the page for the initial server render and then hide it using [onMount](https://svelte.dev/docs#run-time-svelte-onmount) or checking [browser](https://kit.svelte.dev/docs/modules#$app-environment-browser). Unfortunately, this could be jarring, since the submit button would render and then abruptly vanish when the page hydrates.

Instead, I added a short inline script to the top of the `<body>` in `app.html` that will run before anything renders. This toggles the `no-js` and `has-js` classes on the body.

```html
<body data-sveltekit-preload-data="hover" class="no-js">
  <script>
    document.body.classList.add('has-js');
    document.body.classList.remove('no-js');
  </script>
  <div id="svelte">%sveltekit.body%</div>
</body>
```

I added some global utility classes to hide or show elements based on JS availability:

```css
body.has-js .no-js-only {
  display: none;
}

body.no-js .js-only {
  display: none;
}
```

And then we can add a submit button like this, and it will only show when JS is disabled:

```html
<button type="submit" class="no-js-only">Submit</button>
```

Like anything progressive enhancement, this is about tradeoffs. This won't have a FOMB (flash of misplaced button), but it will also hide the button when JS is enabled but not available yet (i.e. the page is hydrating).

# Wrapping up

So that's how I spent my three-day-weekend &mdash; let me know if you have any feedback or suggestions!

Progressive form enhancement with SvelteKit is a topic I'm very interested in, so expect more content from me on that topic in the future.
