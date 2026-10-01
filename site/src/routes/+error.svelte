<!-- An address that leads nowhere. -->
<script>
	import { page } from '$app/state';
	import { L } from '$lib/i18n/fr.js';
</script>

<svelte:head><title>{L.notFoundTitle} · Politiskel</title></svelte:head>

<section class="auth">
	<h1>{page.status === 404 ? L.notFoundTitle : page.status}</h1>
	<p class="lead">{page.status === 404 ? L.notFoundLead : page.error?.message}</p>
	<p><a class="button ghost" href="/">{L.navHome}</a></p>
</section>
