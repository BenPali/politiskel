<!-- A test bed for fun share cards, to judge them on one's own profile
     before any of them becomes a layout. Not linked from anywhere. -->
<script>
	import { onMount } from 'svelte';
	import { session } from '$lib/session.svelte.js';
	import { board } from '$lib/compass/board.svelte.js';
	import { COUNTRIES, fromMember, hasPolitiscales } from '$lib/compass/model.js';
	import { guestMember } from '$lib/quiz/answers.svelte.js';
	import { cardData, THEMES } from '$lib/share/card.js';
	import { FUN, COPY, titleOf, rarityOf } from '$lib/share/fun.js';
	import SignedIn from '$lib/components/SignedIn.svelte';

	let ART = $state(null);
	let theme = $state('clair');
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

<svelte:head><title>Labo des cartes · Politiskel</title></svelte:head>

<SignedIn guest>
	<h1>Labo des cartes</h1>
	{#if !data}
		<p class="lead">Pas encore de profil.</p>
	{:else}
		<p class="lead">Prototypes, sur ton profil : classe « {titleOf(data)} », rareté {COPY.rarity[rarityOf(data)].toLowerCase()}.</p>
		<div class="dots" role="radiogroup" aria-label="Thème de la carte d'embarquement">
			{#each Object.keys(THEMES) as t}
				<button type="button" role="radio" aria-checked={theme === t} aria-label={t} title={t} onclick={() => (theme = t)}
					style="background: {THEMES[t].bg}; border-color: {THEMES[t].accent}"></button>
			{/each}
		</div>
		<div class="grid">
			{#each FUN as l (l.key)}
				<figure class:tall={l.h > l.w * 1.1} class:wide={l.w > l.h * 1.5}>
					<div class="art">{@html l.draw(data, ART, THEMES[theme])}</div>
					<figcaption><b>{COPY.cards[l.key][0]}</b><span>{COPY.cards[l.key][1]}</span></figcaption>
				</figure>
			{/each}
		</div>
	{/if}
</SignedIn>

<style>
	h1 { font-family: var(--font-display); font-size: 40px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em; }
	.lead { margin: 0 0 20px; color: var(--text-2); }
	.dots { display: flex; gap: 10px; margin: 0 0 24px; }
	.dots button { width: 30px; height: 30px; border-radius: 50%; border: 5px solid; padding: 0; cursor: pointer; }
	.dots button[aria-checked='true'] { outline: 2px solid var(--text); outline-offset: 3px; }
	.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 32px 24px; align-items: start; }
	figure { margin: 0; }
	.wide { grid-column: span 2; }
	.art :global(svg) { display: block; width: 100%; height: auto; border-radius: 8px; box-shadow: var(--shadow-2); }
	figcaption { margin-top: 10px; display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
	figcaption b { font-size: 15px; }
	figcaption span { font-size: 13px; color: var(--text-3); }
	@media (max-width: 800px) { .grid { grid-template-columns: minmax(0, 1fr); } .wide { grid-column: auto; } }
</style>
