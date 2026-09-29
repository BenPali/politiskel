<!-- A profile read from the address itself: everything after the "#" is
     decoded here, in the browser. A browser never sends that part to a
     server, so the site does not see it, log it, or keep it; nothing on this
     page may send it anywhere either (no request that carries the address,
     no third party). Read-only, and nothing decoded is written as text: the
     decoder only gives numbers and table entries, and the name shown is the
     page's own. -->
<script>
	import { onMount } from 'svelte';
	import { L } from '$lib/i18n/fr.js';
	import { decode } from '$lib/share/fragment.js';
	import { fromSnapshot } from '$lib/share/card.js';
	import { SHARE_LAYOUTS } from '$lib/share/layouts.js';
	import PublicProfile from '$lib/components/PublicProfile.svelte';

	const S = L.share;
	/* 'loading', a reason the address cannot be read ('empty', 'malformed',
	   'version'), or 'ready' */
	let state = $state('loading');
	let share = $state(null);
	let ART = $state(null);

	function read() {
		const r = decode(location.hash);
		let data = null;
		if (r.ok) {
			try {
				data = fromSnapshot({ v: 1, alias: S.bareAlias, flag: null, ...r.share });
			} catch {
				/* a result the site cannot draw is a link that shows nothing */
			}
		}
		if (!data) {
			share = null;
			/* an oversized address is as unreadable as a broken one */
			state = r.ok || r.reason === 'size' ? 'malformed' : r.reason;
			return;
		}
		share = { data, layout: SHARE_LAYOUTS.find((l) => l.key === r.share.layout) || SHARE_LAYOUTS[0], theme: r.share.theme };
		state = 'ready';
		import('$lib/badges/scenes/index.js').then((m) => (ART = m.ART));
	}

	/* a new link pasted into the address bar of an open page only changes the hash */
	onMount(read);
</script>

<svelte:window onhashchange={read} />

<svelte:head>
	<title>{S.bareTitle} · Politiskel</title>
	<meta name="robots" content="noindex" />
	<meta name="referrer" content="no-referrer" />
</svelte:head>

{#if state === 'loading'}
	<p class="status">{L.loadingPage}</p>
{:else if state !== 'ready'}
	<div class="card missing">
		<h1>{S.bareBad[state][0]}</h1>
		<p class="lead">{S.bareBad[state][1]}</p>
		<a class="button primary" href="/">{S.makeYours}</a>
	</div>
{:else}
	<PublicProfile data={share.data} layout={share.layout} theme={share.theme} {ART} title={S.bareTitle} lead={S.bareLead} />
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
