<!-- A page for members only: it waits for the session, sends a visitor to
     sign in (and back here afterwards), and renders its content otherwise. -->
<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { L } from '$lib/i18n/fr.js';
	import { session } from '$lib/session.svelte.js';

	let { children } = $props();

	$effect(() => {
		if (session.ready && !session.me)
			goto('/connexion?suite=' + encodeURIComponent(page.url.pathname + page.url.search), { replaceState: true });
	});
</script>

{#if session.me}
	{@render children()}
{:else}
	<p class="status">{L.loadingPage}</p>
{/if}
