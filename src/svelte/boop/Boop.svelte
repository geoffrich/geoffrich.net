<script>
  import boop from './boop.js';
  export let boopParams;
</script>

<span use:boop={{...boopParams}}>
  <slot />
</span>
