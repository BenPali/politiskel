<!-- "Pour rire": which historical figure a profile resembles. Entertainment,
     on a page of its own and labelled as such; it draws nothing on the
     compass and feeds no badge, no passport and no group total. Every
     position of a figure is a hand estimate, and the page says so. -->
<script>
	import { session } from '$lib/session.svelte.js';
	import { page } from '$app/state';
	import { L } from '$lib/i18n/fr.js';
	import { board, ensureBoard } from '$lib/compass/board.svelte.js';
	import { coords } from '$lib/compass/model.js';
	import { FIGURES } from '$lib/fun/figures.js';
	import { matchProfile } from '$lib/fun/match.js';
	import SignedIn from '$lib/components/SignedIn.svelte';
	import FigureCard from '$lib/components/FigureCard.svelte';

	const F = L.figures;

	$effect(() => {
		if (session.ready) ensureBoard();
	});
	const id = $derived(page.params.membre);
	const p = $derived(board.members.find((m) => m.id === id) || null);
	const match = $derived(p ? matchProfile(coords(p)) : null);
	/* after the top of the ranking: the second when nothing is tied, otherwise the rest */
	const shown = $derived(match ? (match.tie ? match.tied.length : 2) : 0);
	const next = $derived(match ? match.ranked.slice(shown, shown + 5) : []);
</script>

<svelte:head><title>{F.pageTitle(id)} · Politiskel</title></svelte:head>

<SignedIn guest>
	<a class="back" href="/boussole/{encodeURIComponent(id)}">{F.back}</a>
	{#if !board.loaded}
		<p class="status">{L.loadingPage}</p>
	{:else if !p}
		<div class="card"><p class="lead">{L.memberUnknown(id)}</p></div>
	{:else}
		<div class="wrap-fun">
			<p class="stamp">{F.tag}</p>
			<h1>{F.title(p.me)}</h1>
			<div class="notice">
				<p>{F.disclaimer}</p>
				<p class="apart">{F.apart}</p>
			</div>

			{#if !match}
				<div class="card empty">
					<p class="lead">{F.noPlace(p.me)}</p>
					{#if p.me}<a class="button primary" href="/questionnaire">{F.toQuiz}</a>{/if}
				</div>
			{:else}
				{#if match.tie}
					<h2>{F.tieTitle}</h2>
					<p class="sub">{F.tieLead}</p>
					<div class="row">
						{#each match.tied as e (e.figure.id)}
							<FigureCard entry={e} extra={match.fit === 'far' ? [F.faraway(p.me)] : [F.closer(e.percentile, p.me), F.resemblance(L.fit[match.fit])]} />
						{/each}
					</div>
				{:else}
					<FigureCard entry={match.best} lead={F.closest} big
						extra={match.fit === 'far' ? [F.faraway(p.me)] : [F.resemblance(L.fit[match.fit]), F.closer(match.best.percentile, p.me)]} />
					{#if match.second}
						<div class="second">
							<FigureCard entry={match.second} lead={F.second} extra={match.fit === 'far' ? [] : [F.closer(match.second.percentile, p.me)]} />
						</div>
					{/if}
				{/if}

				{#if next.length}
					<section class="card next" aria-label={F.next}>
						<h2>{F.next}</h2>
						<ul>
							{#each next as e (e.figure.id)}
								<li>
									<b>{e.figure.name}</b>
									<span class="years">{e.figure.born} – {e.figure.died}</span>
									<span class="role">{F.roles[e.figure.id]}</span>
									<span class="pos">{F.estimate(e.figure.x, e.figure.y)} · {F.confidence[e.figure.confidence]}</span>
									<a href="https://en.wikipedia.org/wiki/{encodeURIComponent(e.figure.wiki.replaceAll(' ', '_'))}" rel="noopener noreferrer">{F.wiki(e.figure.wiki)}</a>
								</li>
							{/each}
						</ul>
					</section>
				{/if}

				<details class="how">
					<summary>{F.howTitle}</summary>
					<p>{F.how}</p>
					<p>{F.catalogue(FIGURES.length)}</p>
				</details>
			{/if}
		</div>
	{/if}
</SignedIn>

<style>
	.back { display: inline-flex; align-items: center; min-height: 44px; color: var(--text-2); font-size: 15px; text-decoration: none; margin-bottom: 8px; }
	.back:hover { color: var(--text); }
	.wrap-fun { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
	.stamp { align-self: flex-start; margin: 0; padding: 3px 12px; border: 2px solid var(--accent-ink); border-radius: var(--r-sm); color: var(--accent-ink); font-size: 13px; font-weight: 700;
		letter-spacing: .12em; text-transform: uppercase; transform: rotate(-2deg); }
	h1 { font-family: var(--font-display); font-size: clamp(28px, 4.4vw, 40px); font-weight: 700; margin: 0; letter-spacing: -0.02em; line-height: 1.12; text-wrap: balance; }
	h2 { font-family: var(--font-sans); font-size: 18px; font-weight: 650; margin: 0; }
	.notice { padding: 14px 18px; border-left: 4px solid var(--border-strong); background: var(--surface-2); border-radius: 0 var(--r-md) var(--r-md) 0; }
	.notice p { margin: 0; font-size: 14.5px; line-height: 1.5; color: var(--text); }
	.notice .apart { margin-top: 8px; color: var(--text-2); }
	.sub { margin: -14px 0 0; font-size: 14.5px; color: var(--text-2); }
	.row { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 16px; }
	.second { margin-top: -4px; }
	.card { padding: 20px 24px; }
	.empty { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; }
	.empty .lead { margin: 0; }
	.next ul { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; }
	.next li { display: flex; flex-wrap: wrap; gap: 2px 10px; align-items: baseline; padding: 12px 0; border-top: 1px solid var(--border); font-size: 14px; }
	.next li:first-child { border-top: 0; padding-top: 0; }
	.next b { font-size: 15px; }
	.next .years { color: var(--text-3); font-variant-numeric: tabular-nums; }
	.next .role { flex: 1 1 100%; color: var(--text-2); }
	.next .pos { color: var(--text-3); font-size: 13px; }
	.next a { font-size: 13px; overflow-wrap: anywhere; }
	.how { font-size: 14px; color: var(--text-2); }
	.how summary { cursor: pointer; min-height: 40px; display: flex; align-items: center; list-style: none; }
	.how summary::-webkit-details-marker { display: none; }
	.how summary::before { content: '▸'; display: inline-block; width: 16px; font-size: 12px; transition: transform var(--dur-instant); }
	.how[open] > summary::before { transform: rotate(90deg); }
	.how p { margin: 4px 0 10px; line-height: 1.55; }
	.status { color: var(--text-3); }
	@media (max-width: 700px) {
		.row { grid-template-columns: minmax(0, 1fr); }
		.card { padding: 18px 16px; }
	}
</style>
