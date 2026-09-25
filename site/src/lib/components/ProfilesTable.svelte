<!-- The group's profiles, a row each, after the design: flag and name, the
     coordinates on the reading (marked when the questionnaire gave them),
     and the nearest party with its proximity — and the runner-up when the
     two are a toss-up. A row follows that member on the compass; the button
     beneath opens the followed member's page, or one's own. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { signed } from '$lib/format.js';
	import { copyOf, nearestReference, fitPhrase, offReason } from '$lib/compass/model.js';
	import MemberFlag from '$lib/components/MemberFlag.svelte';

	let { computed, refs, limits, viewKey, selectedId = null, onpick } = $props();
	const W = $derived(copyOf(viewKey));

	const rows = $derived(
		computed.map(({ p, c }, i) => ({
			p,
			c,
			i,
			nearest: c.off ? null : nearestReference(c.x, c.y, refs, limits)
		}))
	);
	const target = $derived(computed.find(({ p }) => p.id === selectedId)?.p || computed.find(({ p }) => p.me)?.p || null);
</script>

<section class="card profiles" aria-label={L.profilesTitle}>
	<h2>{L.profilesTitle}</h2>
	<p class="lead">{L.profilesHint}</p>
	<div class="table-scroll">
		<table id="profiles-table">
			<thead>
				<tr>
					<th scope="col">{L.colProfile}</th>
					<th scope="col" class="r">{L.colX}</th>
					<th scope="col" class="r" title={W.titleY}>{W.colY}</th>
					<th scope="col" class="near-h">{L.colFamily}</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as { p, c, i, nearest } (p.id)}
					<tr class:sel={selectedId === p.id} class:faded={selectedId && selectedId !== p.id}
						aria-selected={selectedId === p.id} onclick={() => onpick(i)}>
						<td>
							<span class="who">
								<MemberFlag {p} size="row" />
								<button type="button" class="name" onclick={(e) => { e.stopPropagation(); onpick(i); }}>{p.alias}</button>
								{#if p.me}<span class="you">{L.you}</span>{/if}
							</span>
						</td>
						<td class="num" class:quiz={c.xSrc === 'quiz'} title={c.xSrc === 'quiz' ? (c.native ? L.fromQuizNative : L.fromQuiz(signed(c.psX))) : undefined}>
							{c.x === null ? '—' : signed(c.x)}
						</td>
						<td class="num" class:quiz={c.ySrc === 'quiz' && c.y !== null} title={c.ySrc === 'quiz' && c.y !== null ? (c.native ? L.fromQuizNativeY : L.fromQuizY(signed(c.psY))) : undefined}>
							{c.y === null ? '—' : signed(c.y)}
						</td>
						<td class="near">
							{#if nearest}
								<div class="n">{nearest.name}</div>
								<div class="fit">
									{fitPhrase(nearest.d, limits)} · {L.points(nearest.d)}{#if nearest.margin <= limits.tie}{L.tieShort(nearest.second.name, nearest.margin)}{/if}
								</div>
							{:else}
								<div class="fit">{offReason(c, viewKey)}</div>
							{/if}
						</td>
					</tr>
				{:else}
					<tr><td colspan="4" class="empty">{L.emptyNoData}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
	<div class="foot">
		<span>{L.profilesFoot}</span>
		{#if target}
			<a class="button primary" href="/boussole/{encodeURIComponent(target.id)}">{L.openCard(target.alias)}</a>
		{/if}
	</div>
</section>

<style>
	.profiles { padding: 20px 20px 8px; }
	h2 { font-family: var(--font-sans); font-size: 17px; font-weight: 650; margin: 0 4px 4px; }
	.lead { margin: 0 4px 14px; font-size: 14px; color: var(--text-2); }
	table { width: 100%; border-collapse: collapse; font-size: 14px; }
	th { text-align: left; padding: 10px 8px; font-size: 12px; letter-spacing: var(--tracking-caps); text-transform: uppercase;
		color: var(--text-3); font-weight: 650; border-bottom: 1px solid var(--border); white-space: nowrap; }
	th.r { text-align: right; }
	th.near-h, td.near { padding-left: 16px; }
	td { padding: 10px 8px; border-bottom: 1px solid var(--border); vertical-align: middle; }
	tbody tr { cursor: pointer; transition: opacity var(--dur-instant), background-color var(--dur-instant); }
	tbody tr:hover td { background: var(--surface-2); }
	tbody tr.sel td { background: var(--accent-soft); }
	tbody tr.faded { opacity: .6; }
	.who { display: flex; align-items: center; gap: 10px; font-weight: 650; }
	.name { all: unset; cursor: pointer; font-weight: 650; }
	.name:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 2px; }
	.you { font-size: 11.5px; font-weight: 650; color: var(--accent-ink); background: var(--accent-soft); padding: 2px 8px; border-radius: var(--r-pill); }
	.num { text-align: right; font-variant-numeric: tabular-nums; }
	.near { line-height: 1.3; white-space: normal; min-width: 180px; }
	.near .n { font-weight: 600; }
	.near .fit { font-size: 12.5px; color: var(--text-3); }
	.foot { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 4px 12px; flex-wrap: wrap; }
	.foot span { font-size: 13px; color: var(--text-3); }
</style>
