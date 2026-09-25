<!-- Every distance, not only the shortest: from a member to each party, or
     from a party to each member (then a row leads to that member). -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { signed } from '$lib/format.js';
	import { fitPhrase } from '$lib/compass/model.js';

	/** rows: { name, id?, note, d, dx, dy }[], nearest first */
	let { rows, limits, colLabel, empty } = $props();
	const max = $derived(Math.max(...rows.map((r) => r.d), 1));
</script>

{#if rows.length}
	<div class="table-scroll">
		<table id="detail-table">
			<thead>
				<tr>
					<th></th>
					<th>{colLabel}</th>
					<th class="bar-cell"></th>
					<th style="text-align:right">{L.colDistance}</th>
					<th style="text-align:right" title={L.titleDeltaEcon}>{L.colDeltaEcon}</th>
					<th style="text-align:right" title={L.titleDeltaSocial}>{L.colDeltaSocial}</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as r, n (r.name)}
					<tr>
						<td class="rank">{n + 1}</td>
						<td title={r.note || undefined}>
							{#if r.id !== undefined}<a href="/boussole/{encodeURIComponent(r.id)}">{r.name}</a>{:else}{r.name}{/if}
							{#if n === 0}<span class="fit-pill" class:far-note={r.d > limits.far}> · {fitPhrase(r.d, limits)}</span>{/if}
						</td>
						<td class="bar-cell">
							<div class="bar" class:far={r.d > limits.far} style="--w: {Math.max(2, Math.round((r.d / max) * 100))}%"></div>
						</td>
						<td class="num">{r.d}</td>
						<td class="num">{signed(Math.round(r.dx))}</td>
						<td class="num">{signed(Math.round(r.dy))}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<p class="hint">{empty}</p>
{/if}

<style>
	/* the bars fill in on arrival; without motion they are simply there */
	.bar { width: var(--w); transform-origin: left; animation: grow 0.35s ease-out both; }
	@keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
	@media (prefers-reduced-motion: reduce) { .bar { animation: none; } }
	a { color: inherit; }
</style>
