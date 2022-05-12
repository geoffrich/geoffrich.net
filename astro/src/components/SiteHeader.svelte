<script>
  import Nav from './Nav.svelte';
  import tokens from '../data/tokens.json';
  import site from '../data/site.json';
  const siteName = site.name;
</script>

<a class="skip-link" href="#main-content">Skip to content</a>
<header class="[ site-head ] [ pad-top-700 pad-bottom-700 ">
  <div class="wrapper">
    <div class="[ site-head__inner ] [ md:box-flex space-between align-center ]">
      <a href="/" class="[ site-head__site-name ] [ leading-tight ]">
        <span class="visually-hidden">{siteName} - Home</span>
        <span class="[ site-head__site-name ] [ text-600 ]" aria-hidden="true"
          >{siteName}</span
        >
      </a>
      <div class="[ box-flex align-center ]">
        <Nav />
        <!-- TODO: make theme selector a component -->
        <button
          class="[ button theme-selector-toggle ] [ text-600 bg-primary ] "
          aria-expanded="false"
        >
          <span class="visually-hidden">Toggle theme selector</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="icon icon-tabler icon-tabler-brush"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            focusable="false"
            aria-hidden="true"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M3 21v-4a4 4 0 1 1 4 4h-4" />
            <path d="M21 3a16 16 0 0 0 -12.8 10.2" />
            <path d="M21 3a16 16 0 0 1 -10.2 12.8" />
            <path d="M10.6 9a9 9 0 0 1 4.4 4.4" />
          </svg>
        </button>
      </div>
    </div>

    <div class="theme-selector" data-state="closed">
      <fieldset>
        <legend>Theme color</legend>
        {#each Object.entries(tokens.themes) as [themeName, color]}
          <label for="theme-{themeName}">
            <input
              class="theme-selector__option"
              type="radio"
              checked={themeName === 'default'}
              name="theme"
              value={themeName}
              id="theme-{themeName}"
            />
            <span class="theme-selector__text" data-theme={themeName}>
              {themeName}
            </span>
          </label>
        {/each}
      </fieldset>
      <theme-toggle />
    </div>
  </div>
</header>
