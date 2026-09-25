<!-- The members, a row each: flag and name, their coordinates on the reading
     (marked when the questionnaire gave them), and the nearest party — with
     the runner-up when the two are a toss-up. A row leads to the member. -->
<script>
	import { goto } from '$app/navigation';
	import { L } from '$lib/i18n/fr.js';
	import { signed } from '$lib/format.js';
	import { copyOf, nearestReference, fitPhrase, offReason } from '$lib/compass/model.js';
	import MemberFlag from '$lib/components/MemberFlag.svelte';

	let { computed, refs, limits, viewKey, selectedId = null } = $props();
	const W = $derived(copyOf(viewKey));

	const rows = $derived(
		computed.map(({ p, c }) => ({
			p,
			c,
			nearest: c.off ? null : nearestReference(c.x, c.y, refs, limits)
		}))
	);
	const href = (p) => '/boussole/' + encodeURIComponent(p.id);
</script>

<div class="table-scroll">
	<table id="profiles-table">
		<thead>
			<tr>
				<th>{L.colAlias}</th>
				<th style="text-align:right">{L.colX}</th>
				<th style="text-align:right" title={W.titleY}>{W.colY}</th>
				<th style="text-align:right">{L.colEcol}</th>
				<th>{L.colFamily}</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as { p, c, nearest } (p.id)}
				<tr class:sel={selectedId === p.id} onclick={() => goto(href(p))}>
					<td class="who-cell">
						<div><MemberFlag {p} /><a href={href(p)}>{p.alias}</a></div>
					</td>
					<td class="num" class:quiz={c.xSrc === 'quiz'} title={c.xSrc === 'quiz' ? (c.native ? L.fromQuizNative : L.fromQuiz(signed(c.psX))) : undefined}>
						{c.x === null ? '—' : signed(c.x)}
					</td>
					<td class="num" class:quiz={c.ySrc === 'quiz' && c.y !== null} title={c.ySrc === 'quiz' && c.y !== null ? (c.native ? L.fromQuizNativeY : L.fromQuizY(signed(c.psY))) : undefined}>
						{c.y === null ? '—' : signed(c.y)}
					</td>
					<td class="num">{c.ecol === null ? '—' : signed(c.ecol)}</td>
					<td class="fam">
						{#if nearest}
							{nearest.name}
							<span class="tag" class:far-note={nearest.d > limits.far}>{fitPhrase(nearest.d, limits)} ({nearest.d})</span>
							{#if nearest.margin <= limits.tie}
								<span class="tie" title={L.tieTitle(nearest.margin)}>{L.tieWith(nearest.second.name, nearest.margin)}</span>
							{/if}
						{:else}
							<span class="tag">{offReason(c, viewKey)}</span>
						{/if}
					</td>
				</tr>
			{:else}
				<tr><td colspan="5" class="empty">{L.emptyNoData}</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	tbody tr { cursor: pointer; }
	.who-cell a { color: inherit; text-decoration: none; }
</style>
