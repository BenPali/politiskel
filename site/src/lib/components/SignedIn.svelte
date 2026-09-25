<!-- A page for members only: it waits for the session, sends a visitor to
     sign in (and back here afterwards), and renders its content otherwise.
     With `guest`, a visitor who has a trial profile in this browser sees
     the page too, on that profile. -->
<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { L } from '$lib/i18n/fr.js';
	import { session } from '$lib/session.svelte.js';
	import { readGuest } from '$lib/quiz/answers.svelte.js';

	let { children, guest = false } = $props();

	const asGuest = $derived(session.ready && !session.me && guest && readGuest() !== null);
	$effect(() => {
		if (session.ready && !session.me && !asGuest)
			goto('/connexion?suite=' + encodeURIComponent(page.url.pathname + page.url.search), { replaceState: true });
	});
</script>

{#if session.me || asGuest}
	{@render children()}
{:else}
	<p class="status">{L.loadingPage}</p>
{/if}
