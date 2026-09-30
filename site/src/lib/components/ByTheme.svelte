<!-- The nearest party on each theme where it is not the overall one. A row
     stands only for a party clearly nearest or a few tied for it: the logic
     (compass/bytheme.js) has already left out every theme that would repeat
     the overall party or overstate a difference. -->
<script>
	import { L } from '$lib/i18n/fr.js';

	/** rows: the themes of byTheme() worth showing */
	let { rows } = $props();
	const T = L.byTheme;

	const namesOf = (r) => [r.best.name, ...(r.tied || []).map((o) => o.name)];
	const fitOf = (fit) => (fit === 'far' ? L.noCloseParty : L.proximity + L.fit[fit]);
	/* the sentence-case line under the names */
	const noteOf = (r) => {
		const s = [r.status === 'ex-aequo' && T.tie, fitOf(r.best.fit), r.overall && T.overallAt(r.overall.name, r.overall.d), r.measured.n < r.measured.of && T.measured(r.measured.n, r.measured.of)].filter(Boolean).join(' · ');
		return s.charAt(0).toUpperCase() + s.slice(1);
	};
</script>

<ul>
	{#each rows as r (r.key)}
		<li>
			<span class="theme">{T.label[r.key]}</span>
			<span class="who">
				<span class="n" title={r.status === 'ex-aequo' ? undefined : r.best.ref.full || undefined}>{T.names(namesOf(r))}</span>
				<span class="note">{noteOf(r)}</span>
			</span>
			<span class="d">{L.points(r.best.d)}</span>
		</li>
	{/each}
</ul>
<p class="read">{T.read}</p>

<style>
	ul { margin: 0; padding: 0; list-style: none; }
	li { display: grid; grid-template-columns: 116px minmax(0, 1fr) 58px; align-items: baseline; gap: 14px; padding: 10px 0; border-top: 1px solid var(--border); }
	.theme { font-size: 13px; font-weight: 650; color: var(--text-2); }
	.who { line-height: 1.25; min-width: 0; }
	.n { font-weight: 650; font-size: 14.5px; overflow-wrap: anywhere; }
	.note { display: block; font-size: 12.5px; line-height: 1.35; margin-top: 2px; color: var(--text-3); }
	.read { margin: 0; padding-top: 12px; border-top: 1px solid var(--border); font-size: 12.5px; line-height: 1.45; color: var(--text-3); }
	.d { text-align: right; font-variant-numeric: tabular-nums; font-size: 14px; font-weight: 600; }
	@media (max-width: 700px) {
		li { grid-template-columns: minmax(0, 1fr) 58px; gap: 2px 10px; }
		.theme { grid-column: 1 / -1; }
	}
</style>
