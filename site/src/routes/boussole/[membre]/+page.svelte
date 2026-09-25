<!-- A member's page, after the design: back to the group's compass and the
     other members as tabs; on the left their Politiskel flag, large, with a
     line per element drawn; on the right their readings as bands, then
     every party by distance on the reading on show. It has its own
     address, which the group can share. -->
<script>
	import { session } from '$lib/session.svelte.js';
	import { page } from '$app/state';
	import { L } from '$lib/i18n/fr.js';
	import { board, ensureBoard } from '$lib/compass/board.svelte.js';
	import { COUNTRIES, referencesOf, limitsOf, project, rankParties, hasPolitiscales, coords, offReason } from '$lib/compass/model.js';
	import { politiskelFlag } from '$lib/flag/flag.js';
	import { PolitiExtract } from '$lib/model.js';
	import SignedIn from '$lib/components/SignedIn.svelte';
	import MemberFlag from '$lib/components/MemberFlag.svelte';
	import ReadingBands from '$lib/components/ReadingBands.svelte';
	import PartyList from '$lib/components/PartyList.svelte';

	$effect(() => {
		if (session.ready) ensureBoard();
	});

	const id = $derived(page.params.membre);
	const p = $derived(board.members.find((m) => m.id === id) || null);
	const country = $derived(COUNTRIES.find((c) => c.code === board.country) || COUNTRIES[0]);
	const refs = $derived(referencesOf(country, board.view));
	const limits = $derived(limitsOf(refs));
	const c = $derived(p ? project(p, board.view) : null);
	const q = $derived(c ? (c.base || c).quiz : null);
	const flag = $derived(p ? politiskelFlag(coords(p), p) : null);
	/* the flag cropped from the PolitiScales capture, when there is one */
	const psFlag = $derived(!!p?.flag && /^data:image\/(png|jpeg|webp);base64,/.test(p.flag));
	let which = $state('politiskel');
	const concepts = $derived(p && hasPolitiscales(p) ? PolitiExtract.keyConcepts(p, 3) : []);
	const source = $derived(p ? L.profileSource(hasPolitiscales(p), !!(q || c?.soc || c?.quiz)) : '');
</script>

<svelte:head><title>{id} · {L.tabCompass} · Politiskel</title></svelte:head>

<SignedIn guest>
	<div class="top">
		<a class="back" href="/boussole">{L.memberBack}</a>
		{#if board.members.length > 1}
			<nav class="tabs" aria-label={L.memberSwitch}>
				{#each board.members as m (m.id)}
					<a href="/boussole/{encodeURIComponent(m.id)}" aria-current={m.id === id ? 'page' : undefined}>
						<MemberFlag p={m} size="tab" />{m.alias}
					</a>
				{/each}
			</nav>
		{/if}
	</div>

	{#if !board.loaded}
		<p class="status">{L.loadingPage}</p>
	{:else if !p}
		<div class="card"><p class="lead">{L.memberUnknown(id)}</p></div>
	{:else}
		{#key p.id}
			<div class="sheet">
				<section class="card flag-card" aria-label={L.flagFigureShort}>
					<div class="name">
						<h1>{p.alias}</h1>
						{#if p.me}<span class="you">{L.you}</span>{/if}
					</div>
					<p class="source">{source}</p>
					{#if concepts.length}
						<ul class="concepts">
							{#each concepts as k}<li><b>{L.pole[k.key]}</b> {k.intensity}</li>{/each}
						</ul>
					{/if}
					{#if psFlag}
						<div class="segmented flag-pick" role="radiogroup" aria-label={L.flagWhich}>
							<button type="button" role="radio" aria-checked={which === 'politiskel'} onclick={() => (which = 'politiskel')}>{L.flagPolitiskel}</button>
							<button type="button" role="radio" aria-checked={which === 'politiscales'} onclick={() => (which = 'politiscales')}>{L.flagPolitiscales}</button>
						</div>
					{/if}
					{#if psFlag && which === 'politiscales'}
						{#key which}<img class="hero ps" src={p.flag} alt={L.flagAlt(p.alias)} />{/key}
						<p class="legend-head">{L.flagPsCaption}</p>
					{:else if flag}
						{#key which}<img class="hero" src={flag.url} alt={L.flagGeneratedAlt(p.alias)} width="432" height="288" />{/key}
						<p class="legend-head">{L.flagFigureTitle}</p>
						<ol class="legend">
							{#each flag.legend as line, i}<li><span>{i + 1}</span><span>{line}</span></li>{/each}
						</ol>
						<p class="credit">{L.flagCredit} <a href="/drapeaux">{L.navFlags}</a></p>
					{/if}
					{#if p.me}
						<a class="button {c.quiz ? 'ghost' : 'primary'} quiz" href="/questionnaire">{c.quiz ? L.quizEdit : L.quizOpen}</a>
					{/if}
				</section>

				<div class="side">
					<section class="card" aria-label={L.bands.title}>
						<h2>{L.bands.title}</h2>
						<p class="sub">{L.bands.lead}</p>
						<ReadingBands {c} {q} />
					</section>
					<section class="card" aria-label={L.partiesTitle}>
						<div class="head">
							<h2>{L.partiesTitle}</h2>
							<span>{L.partiesScope(country.name, L.views[board.view].name)}</span>
						</div>
						{#if c.off}
							<p class="sub">{offReason(c, board.view)}</p>
						{:else}
							<PartyList rows={rankParties(c, refs)} {limits} />
						{/if}
					</section>
				</div>
			</div>
		{/key}
	{/if}
</SignedIn>

<style>
	.top { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
	.back { display: inline-flex; align-items: center; min-height: 44px; color: var(--text-2); font-size: 15px; text-decoration: none; }
	.back:hover { color: var(--text); }
	.tabs { display: flex; gap: 6px; flex-wrap: wrap; }
	.tabs a { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 12px 0 5px; border-radius: var(--r-pill);
		border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13.5px; font-weight: 500; text-decoration: none; }
	.tabs a:hover { border-color: var(--border-strong); }
	.tabs a[aria-current='page'] { border-color: var(--accent); background: var(--accent-soft); font-weight: 650; }
	.sheet { display: grid; grid-template-columns: 480px minmax(0, 1fr); gap: 32px; align-items: start; }
	.side { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
	.card { padding: 24px; }
	.card + .card { margin-top: 0; }
	.name { display: flex; align-items: baseline; gap: 12px; margin-bottom: 4px; }
	h1 { font-family: var(--font-display); font-size: 40px; font-weight: 600; margin: 0; letter-spacing: -0.02em; line-height: 1.1; overflow-wrap: anywhere; }
	.you { font-size: 13px; font-weight: 650; color: var(--accent-ink); background: var(--accent-soft); padding: 3px 10px; border-radius: var(--r-pill); }
	.source { margin: 0 0 14px; font-size: 14px; color: var(--text-3); }
	.concepts { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; margin: 0 0 18px; padding: 0; }
	.concepts li { font-size: 12.5px; padding: 3px 10px; border-radius: var(--r-pill); background: var(--surface-2); color: var(--text-2); }
	.concepts b { color: var(--text); }
	.hero { display: block; width: 100%; max-width: 432px; height: auto; aspect-ratio: 3 / 2; border-radius: 6px;
		box-shadow: 0 0 0 1px var(--border), var(--shadow-2); animation: flag-in var(--dur-base) var(--ease-out) both; }
	@keyframes flag-in { from { opacity: 0; transform: scale(.97); } }
	.flag-pick { margin-bottom: 14px; }
	.segmented { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--r-sm); background: var(--surface-2); }
	.segmented button { min-height: 36px; padding: 0 14px; border: none; background: transparent; font-weight: 500; font-size: var(--fs-sm); }
	.segmented button[aria-checked='true'] { background: var(--surface); box-shadow: var(--shadow-1); font-weight: var(--fw-bold); }
	.hero.ps { aspect-ratio: auto; object-fit: contain; background: var(--surface-2); }
	.legend-head { margin: 20px 0 10px; font-size: 14px; color: var(--text-2); font-weight: 650; }
	.legend { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
	.legend li { display: grid; grid-template-columns: 22px 1fr; gap: 10px; font-size: 14px; line-height: 1.45; color: var(--text-2); }
	.legend li span:first-child { font-size: 12px; font-weight: 650; color: var(--text-3); font-variant-numeric: tabular-nums; padding-top: 1px; }
	.credit { margin: 16px 0 0; padding-top: 12px; border-top: 1px solid var(--border); font-size: 12px; color: var(--text-3); }
	.quiz { margin-top: 18px; }
	h2 { font-family: var(--font-sans); font-size: 18px; font-weight: 650; margin: 0 0 4px; }
	.sub { margin: 0 0 18px; font-size: 14px; color: var(--text-2); }
	.head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin: 0 0 4px; flex-wrap: wrap; }
	.head span { font-size: 13px; color: var(--text-3); }
	@media (max-width: 1000px) { .sheet { grid-template-columns: 1fr; } }
	@media (max-width: 700px) {
		.card { padding: 18px 16px; }
		h1 { font-size: 30px; }
		.tabs { flex-wrap: nowrap; overflow-x: auto; flex: 1 1 100%; min-width: 0; padding-bottom: 4px; }
		.sheet { grid-template-columns: minmax(0, 1fr); gap: 20px; }
		.tabs a { flex: none; }
	}
</style>
