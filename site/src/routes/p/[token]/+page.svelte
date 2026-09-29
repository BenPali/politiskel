<!-- A profile someone chose to make public: the card they shared, their
     passport, and a way to make one's own. The snapshot is read back
     through fromSnapshot, which checks every field. -->
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { L } from '$lib/i18n/fr.js';
	import { api } from '$lib/api.js';
	import { fromSnapshot } from '$lib/share/card.js';
	import { SHARE_LAYOUTS } from '$lib/share/layouts.js';
	import PublicProfile from '$lib/components/PublicProfile.svelte';

	const S = L.share;
	let state = $state('loading');
	let share = $state(null);
	let ART = $state(null);

	onMount(async () => {
		const token = page.params.token;
		if (!/^[A-Za-z0-9_-]{22}$/.test(token)) return (state = 'missing');
		const r = await api('GET', '/api/shares/' + token);
		let data = null;
		try {
			data = r.ok ? fromSnapshot(r.data.snapshot) : null;
		} catch {
			/* a snapshot the site cannot draw is a link that shows nothing */
		}
		if (!data) return (state = 'missing');
		share = { data, layout: SHARE_LAYOUTS.find((l) => l.key === r.data.layout) || SHARE_LAYOUTS[0], theme: r.data.theme, created: r.data.created_at };
		state = 'ready';
		ART = (await import('$lib/badges/scenes/index.js')).ART;
	});
</script>

<svelte:head>
	<title>{share ? S.publicTitle(share.data.alias) : S.publicTitleBare} · Politiskel</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if state === 'loading'}
	<p class="status">{L.loadingPage}</p>
{:else if state === 'missing'}
	<div class="card missing">
		<h1>{S.missingTitle}</h1>
		<p class="lead">{S.missingLead}</p>
		<a class="button primary" href="/">{S.makeYours}</a>
	</div>
{:else}
	<PublicProfile data={share.data} layout={share.layout} theme={share.theme} {ART}
		title={S.publicTitle(share.data.alias)} lead={S.publicLead(new Date(share.created * 1000))} />
{/if}

<style>
	.status { color: var(--text-3); }
	h1 { font-family: var(--font-display); font-size: clamp(30px, 5vw, 44px); font-weight: 700; margin: 0 0 6px; letter-spacing: -0.02em; overflow-wrap: anywhere; }
	.lead { margin: 0; color: var(--text-2); }
	.card { padding: 24px; }
	.missing { max-width: 560px; }
	.missing .lead { margin: 8px 0 18px; }
	@media (max-width: 700px) { .card { padding: 18px 16px; } }
</style>
