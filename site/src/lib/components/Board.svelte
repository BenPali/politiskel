<!-- The compass board, after the design: the group header, then the chart
     with what it draws beneath it, and whatever the page puts on the right.
     It loads the group's members once the session is known. -->
<script>
	import { session } from '$lib/session.svelte.js';
	import { L } from '$lib/i18n/fr.js';
	import { board, ensureBoard, savePrefs } from '$lib/compass/board.svelte.js';
	import { COUNTRIES, referencesOf, limitsOf, project, viewNotes } from '$lib/compass/model.js';
	import GroupHeader from '$lib/components/GroupHeader.svelte';
	import Compass from '$lib/components/Compass.svelte';

	/** aside: the right column, given the board's computed state */
	let { selected = null, onpick, aside } = $props();

	$effect(() => {
		if (session.ready) ensureBoard();
	});

	const country = $derived(COUNTRIES.find((c) => c.code === board.country) || COUNTRIES[0]);
	const refs = $derived(referencesOf(country, board.view));
	const limits = $derived(limitsOf(refs));
	const computed = $derived(board.members.map((p) => ({ p, c: project(p, board.view) })));
	const notes = $derived(viewNotes(board.view, country, refs, computed));
	const selectedId = $derived(selected?.kind === 'profile' ? board.members[selected.i]?.id : null);

	const toggles = [
		['refs', L.optRefs],
		['refLabels', L.optRefLabels],
		['labels', L.optLabels],
		['centroid', L.optMean],
		['trail', L.optTrail]
	];
	function setFlags(e) {
		board.flagMode = e.currentTarget.checked ? 'politiskel' : 'politiscales';
		savePrefs();
	}
</script>

<GroupHeader {selectedId} onpick={(i) => onpick('profile', i)} />

{#if !board.loaded}
	<p class="status">{L.loadingPage}</p>
{:else}
	<div class="layout">
		<section class="card chart" aria-label={L.chartTitle}>
			<div class="chart-head">
				<h2>{L.chartTitle}</h2>
				<span>{L.views[board.view].name}</span>
			</div>
			<Compass {computed} {refs} {limits} viewKey={board.view} show={board.show} {selected} {onpick} />
			<div class="legend">
				<span><svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="5.5" fill="var(--dot)" /></svg>{L.legendProfilesN(computed.filter((r) => !r.c.off).length)}</span>
				<span><svg width="14" height="14" aria-hidden="true"><path d="M7,1.5 L12.5,7 L7,12.5 L1.5,7 Z" fill="var(--surface)" stroke="var(--ref)" stroke-width="1.5" /></svg>{L.legendParties(country.name)}</span>
			</div>
			<div class="toggles">
				{#each toggles as [k, label] (k)}
					<label><input type="checkbox" bind:checked={board.show[k]} onchange={savePrefs} />{label}</label>
				{/each}
				<label><input type="checkbox" checked={board.flagMode === 'politiskel'} onchange={setFlags} />{L.optFlagsOurs}</label>
			</div>
			{#if notes.length}
				<div class="note" role="status">
					<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6" /><rect x="8.2" y="7.6" width="1.6" height="5.4" rx=".8" fill="currentColor" /><circle cx="9" cy="5.3" r="1" fill="currentColor" /></svg>
					<span>{notes.join(' ')}</span>
				</div>
			{/if}
		</section>
		<div>
			{@render aside({ computed, refs, limits, country })}
		</div>
	</div>
{/if}

<style>
	.layout { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
	.chart { padding: 20px; }
	.chart-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin: 0 4px 8px; }
	.chart-head h2 { font-family: var(--font-sans); font-size: 17px; font-weight: 650; margin: 0; }
	.chart-head span { font-size: 13px; color: var(--text-3); }
	.legend { display: flex; flex-wrap: wrap; gap: 4px 20px; margin: 14px 4px 0; font-size: 13px; color: var(--text-2); }
	.legend span { display: inline-flex; align-items: center; gap: 8px; }
	.toggles { display: flex; flex-wrap: wrap; gap: 0 20px; margin-top: 8px; padding-top: 6px; border-top: 1px solid var(--border); }
	.toggles label { display: flex; align-items: center; gap: 10px; min-height: 44px; cursor: pointer; font-size: 14px; color: var(--text-2); }
	.note { display: flex; gap: 10px; align-items: flex-start; margin-top: 10px; padding: 12px 14px; border-radius: var(--r-sm);
		background: var(--surface-2); color: var(--text-2); font-size: 13.5px; line-height: 1.45; }
	.note svg { flex: none; margin-top: 1px; }
	@media (max-width: 1000px) { .layout { grid-template-columns: 1fr; } }
</style>
