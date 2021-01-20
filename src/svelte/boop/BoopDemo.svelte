<script>
  import HelpButton from './HelpButton.svelte';
  import Boop from './Boop.svelte';
</script>

<Boop boopParams={{rotation: 20}}>
  <HelpButton />
</Boop>
<Boop boopParams={{scale: 1.2}}>
  <HelpButton />
</Boop>
<Boop boopParams={{y: 5}}>
  <HelpButton />
</Boop>
