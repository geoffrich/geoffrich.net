<script>
    let items = [
    {
      "text": "Twitter",
      "url": "https://twitter.com/geoffrich_",
      "external": true
    },
    {
      "text": "GitHub",
      "url": "https://github.com/geoffrich",
      "external": true
    },
    {
      "text": "Contact Me",
      "url": "/contact",
      "external": false
    }
  ];
    export let ariaLabel = 'navigation';
    export let currentUrl = ''; // TODO: get current URL
</script>

{#if items}
  <nav class="nav" aria-label={ariaLabel}>
    <ul class="[ nav__list ] [ box-flex align-center md:space-before ]">
      {#each items as item}
        <li class="nav__item">
          <a
            href={item.url}
            rel={item.rel}
            aria-current={currentUrl === item.url ? 'page' : null}
          >
            {item.text}</a
          >
        </li>
      {/each}
    </ul>
  </nav>
{/if}
