<!-- A page still to be written in the rewrite: its title, and a line saying so. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	let { title } = $props();
</script>

<svelte:head><title>{title} · Politiskel</title></svelte:head>

<section class="auth">
	<h1>{title}</h1>
	<p class="lead">{L.soon}</p>
</section>
