<!-- Every party by distance from a profile, after the design: rank, name and
     line, a bar that fills in, the distance, the proximity. The nearest
     line above says whether the runner-up is a toss-up. -->
<script>
	import { onMount } from 'svelte';
	import { L } from '$lib/i18n/fr.js';
	import { fitOf } from '$lib/compass/model.js';
	import { PolitiModel } from '$lib/model.js';

	/** rows: rankParties output, nearest first */
	let { rows, limits } = $props();

	let arrived = $state(false);
	onMount(() => requestAnimationFrame(() => (arrived = true)));

	const kind = (d) => PolitiModel.fitOf(d, limits);
	const nearest = $derived(rows[0] || null);
	const margin = $derived(rows[1] ? rows[1].d - rows[0].d : Infinity);
</script>

{#if nearest}
	<p class="line">
		{L.nearestLine(nearest.name, fitOf(nearest.d, limits), nearest.d)}{#if margin <= limits.tie}{L.nearestTie(rows[1].name, margin)}{:else}.{/if}
	</p>
	<ol>
		{#each rows as r, i (r.name)}
			<li>
				<span class="rank">{i + 1}</span>
				<span class="who"><span class="n">{r.name}</span>{#if r.note}<span class="note">{r.note}</span>{/if}</span>
				<span class="bar"><span class={kind(r.d)} style="width: {Math.min(100, r.d / 1.8)}%; transform: scaleX({arrived ? 1 : 0}); transition-delay: calc(var(--stagger) * {Math.min(i, 10)})"></span></span>
				<span class="d">{L.points(r.d)}</span>
				<span class="fit" class:on={kind(r.d) === 'near'}>{fitOf(r.d, limits)}</span>
			</li>
		{/each}
	</ol>
{/if}

<style>
	.line { margin: 0 0 16px; font-size: 15px; color: var(--text-2); }
	ol { margin: 0; padding: 0; list-style: none; }
	li { display: grid; grid-template-columns: 26px 210px minmax(0, 1fr) 58px 76px; align-items: center; gap: 14px; padding: 9px 0; border-top: 1px solid var(--border); }
	.rank { font-size: 13px; color: var(--text-3); text-align: right; font-variant-numeric: tabular-nums; }
	.who { line-height: 1.25; min-width: 0; }
	.n { display: block; font-weight: 650; font-size: 14.5px; }
	.note { display: block; font-size: 12.5px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.bar { position: relative; height: 10px; border-radius: 5px; background: var(--surface-sunk); overflow: hidden; }
	.bar span { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 5px; transform-origin: left center;
		transition: transform var(--dur-slow) var(--ease-out); }
	.bar .near { background: var(--accent); }
	.bar .moderate { background: var(--text-2); }
	.bar .far { background: var(--border-strong); }
	.d { text-align: right; font-variant-numeric: tabular-nums; font-size: 14px; font-weight: 600; }
	.fit { font-size: 12.5px; color: var(--text-3); }
	.fit.on { color: var(--accent-ink); font-weight: 650; }
	@media (max-width: 700px) {
		li { grid-template-columns: 22px minmax(0, 1fr) 58px; gap: 4px 10px; }
		.bar { grid-column: 2 / -1; grid-row: 2; }
		.fit { display: none; }
	}
</style>
