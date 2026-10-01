<!-- A member's passport on a page of its own, where the booklet has room
     to open as a double page. -->
<script>
	import { session } from '$lib/session.svelte.js';
	import { page } from '$app/state';
	import { L } from '$lib/i18n/fr.js';
	import { board, ensureBoard } from '$lib/compass/board.svelte.js';
	import { COUNTRIES } from '$lib/compass/model.js';
	import { cardData } from '$lib/share/card.js';
	import SignedIn from '$lib/components/SignedIn.svelte';
	import PassportBook from '$lib/components/PassportBook.svelte';

	$effect(() => {
		if (session.ready) ensureBoard();
	});
	const id = $derived(page.params.membre);
	const p = $derived(board.members.find((m) => m.id === id) || null);
	const country = $derived(COUNTRIES.find((c) => c.code === board.country) || COUNTRIES[0]);
	const data = $derived(p ? cardData(p, country) : null);
</script>

<svelte:head><title>{L.passport.pageTitle(id)} · Politiskel</title></svelte:head>

<SignedIn guest>
	<a class="back" href="/boussole/{encodeURIComponent(id)}">{L.passport.back}</a>
	{#if !board.loaded}
		<p class="status">{L.loadingPage}</p>
	{:else if !p}
		<div class="card"><p class="lead">{L.memberUnknown(id)}</p></div>
	{:else}
		<h1>{L.passport.pageTitle(p.alias)}</h1>
		<div class="book"><PassportBook {data} /></div>
	{/if}
</SignedIn>

<style>
	.back { display: inline-flex; align-items: center; min-height: 44px; color: var(--text-2); font-size: 15px; text-decoration: none; margin-bottom: 8px; }
	.back:hover { color: var(--text); }
	h1 { font-family: var(--font-display); font-size: clamp(28px, 4.4vw, 40px); font-weight: 700; margin: 0 0 24px; letter-spacing: -0.02em; overflow-wrap: anywhere; }
	.book { max-width: 1000px; margin: 0 auto; }
	.status { color: var(--text-3); }
</style>
