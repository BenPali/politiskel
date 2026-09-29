<!-- One's own profile as cards to share, in every layout: the page shows
     each at its real proportions, drawn by the same code that will make
     the PNG. -->
<script>
	import { onMount } from 'svelte';
	import { L } from '$lib/i18n/fr.js';
	import { session } from '$lib/session.svelte.js';
	import { board } from '$lib/compass/board.svelte.js';
	import { COUNTRIES, fromMember, hasPolitiscales } from '$lib/compass/model.js';
	import { guestMember } from '$lib/quiz/answers.svelte.js';
	import { cardData, LAYOUTS } from '$lib/share/card.js';
	import SignedIn from '$lib/components/SignedIn.svelte';

	const S = L.share;
	let ART = $state(null);
	onMount(async () => {
		ART = (await import('$lib/badges/scenes/index.js')).ART;
	});

	const me = $derived(
		session.me
			? fromMember({ username: session.me.username, me: true, flag: session.me.profile.flag, politiscales: session.me.profile.politiscales, answers: session.me.profile.answers })
			: session.ready ? (guestMember() ? fromMember(guestMember()) : null) : null
	);
	const country = $derived(COUNTRIES.find((c) => c.code === board.country) || COUNTRIES[0]);
	const has = $derived(!!me && (hasPolitiscales(me) || Object.keys(me.answers || {}).length > 0));
	const data = $derived(has ? cardData(me, country) : null);
</script>

<svelte:head><title>{S.title} · Politiskel</title></svelte:head>

<SignedIn guest>
	<h1>{S.title}</h1>
	<p class="lead">{S.lead}</p>
	{#if !data}
		<p class="lead">{S.none}</p>
	{:else}
		<div class="layouts">
			{#each LAYOUTS as l (l.key)}
				<figure class:tall={l.h > l.w}>
					<div class="card-art">{@html l.draw(data, ART)}</div>
					<figcaption><b>{S.layouts[l.key][0]}</b><span>{S.layouts[l.key][1]}</span></figcaption>
				</figure>
			{/each}
		</div>
	{/if}
</SignedIn>

<style>
	h1 { font-family: var(--font-display); font-size: 40px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em; }
	.lead { margin: 0 0 24px; max-width: 70ch; color: var(--text-2); line-height: 1.5; }
	.layouts { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 28px 24px; align-items: start; }
	figure { margin: 0; }
	.card-art :global(svg) { display: block; width: 100%; height: auto; border-radius: 10px; box-shadow: 0 0 0 1px var(--border), var(--shadow-2); }
	.tall .card-art { max-width: 300px; }
	figcaption { margin-top: 10px; display: flex; gap: 10px; align-items: baseline; }
	figcaption b { font-size: 15px; }
	figcaption span { font-size: 13px; color: var(--text-3); }
	@media (max-width: 700px) {
		h1 { font-size: 30px; }
		.layouts { grid-template-columns: minmax(0, 1fr); }
	}
</style>
