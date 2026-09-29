<!-- A member's signature against the parties: the reading where they stand
     apart, the one where they blend in, and, only when they have one, a
     tension (two readings that go together among the parties, combined
     the other way round). Nothing is drawn when there is nothing to say. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { signed } from '$lib/format.js';
	import { COUNTRIES } from '$lib/compass/model.js';
	import { PolitiQuiz } from '$lib/model.js';
	import { referenceOf, readingsOf, signatureOf, BAND } from '$lib/compass/signature.js';

	/** c: the profile's own coordinates (coords()), whatever reading is on show */
	let { c } = $props();

	/* the parties do not change: computed once for every member shown */
	const REF = referenceOf(COUNTRIES);
	const S = L.signature;
	const B = L.bands;

	const sig = $derived(c ? signatureOf(readingsOf(c, PolitiQuiz.MIN_PER_DIM), REF) : null);
	/* the pole a value leans to, and the one across; near zero it leans to neither */
	const MIDDLE = 10;
	const pole = (k, v) => (Math.abs(v) < MIDDLE ? S.middle : B.ends[k][v > 0 ? 1 : 0]);
	const across = (k, v) => B.ends[k][v > 0 ? 0 : 1];
	const rows = $derived(
		sig
			? [
					sig.standout && { key: 'standout', title: S.standout, s: sig.standout },
					sig.blend && { key: 'blend', title: S.blend, s: sig.blend }
				].filter(Boolean)
			: []
	);
</script>

{#if sig}
	<section class="card" aria-label={S.title}>
		<h2>{S.title}</h2>
		<p class="sub">{S.lead(REF.parties.length)}</p>
		<dl>
			{#each rows as r (r.key)}
				<div class="row">
					<dt>{r.title}</dt>
					<dd>
						<b>{B.label[r.s.key]}</b>
						<span class="side">{pole(r.s.key, r.s.value)} ({signed(Math.round(r.s.value))})</span>
						<span class="count">{S.near(r.s.n, r.s.m, BAND)}</span>
					</dd>
				</div>
			{/each}
			{#if sig.tension}
				{@const t = sig.tension}
				<div class="row tension">
					<dt>{S.tension}</dt>
					<dd>
						<span class="pair"><b>{pole(t.a, t.va)}</b> <span class="side">({signed(Math.round(t.va))})</span></span>
						<span class="side">{S.and}</span>
						<span class="pair"><b>{pole(t.b, t.vb)}</b> <span class="side">({signed(Math.round(t.vb))})</span></span>
						<span class="count">{S.pattern(pole(t.a, t.va), across(t.b, t.vb))}</span>
						<span class="count">{S.combine(t.n, t.m)}</span>
					</dd>
				</div>
			{/if}
		</dl>
	</section>
{/if}

<style>
	section.card { padding: 24px; }
	h2 { font-family: var(--font-sans); font-size: 18px; font-weight: 650; margin: 0 0 4px; }
	.sub { margin: 0 0 14px; font-size: 14px; color: var(--text-2); }
	dl { margin: 0; }
	.row { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 4px 20px; padding: 12px 0; border-top: 1px solid var(--border); }
	dt { font-size: 12.5px; color: var(--text-3); line-height: 1.4; padding-top: 2px; }
	dd { margin: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 8px; min-width: 0; }
	dd b { font-size: 15px; font-weight: 650; }
	.pair { display: inline-block; }
	.side { font-size: 14px; color: var(--text-2); font-variant-numeric: tabular-nums; }
	.count { flex: 1 1 100%; font-size: 13.5px; color: var(--text-3); }
	@media (max-width: 700px) {
		section.card { padding: 18px 16px; }
		.row { grid-template-columns: minmax(0, 1fr); }
	}
</style>
