<script>
    import site from '../data/site.json';
import Nav from '../components/Nav.svelte';
</script>

<footer role="contentinfo" class="[ site-foot ] [ pad-top-700 pad-bottom-900 ]">
  <div class="wrapper">
    <div class="[ site-foot__inner ] [ md:box-flex space-between align-start ]">
      <div>
        <article class="[ site-foot__details ] [ sf-flow measure-compact ]">
          <h2 class="font-base text-600">{site.name}</h2>
          {site.shortDesc}
        </article>
      </div>
      <div>
        <Nav ariaLabel="footer navigation" />
      </div>
    </div>
  </div>
</footer>
