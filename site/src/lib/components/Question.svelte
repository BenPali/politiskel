<!-- One question. A categorical scale is a column of full-width choices,
     numbered for the keyboard; a bipolar one shows its two statements side
     by side over a numbered ladder, as the survey's card was (1-10, or
     0-10). Choosing an answer calls onanswer, which moves on. -->
<script>
	import { L } from '$lib/i18n/fr.js';

	/** q: { key, scale, text, stem?, left?, right?, note?, src?, translated?, salience? } */
	let { q, value, onanswer } = $props();

	const bipolar = $derived(!!q.scale.bipolar);
	const first = $derived(q.scale.values.length === 11 ? 0 : 1);
	/* the glossary's terms found on this screen, in order, three at most */
	const defs = $derived.by(() => {
		const text = [q.stem, q.text, q.left, q.right].filter(Boolean).join(' ');
		return L.glossary
			.map((g) => ({ g, at: text.search(g.match) }))
			.filter((x) => x.at >= 0)
			.sort((a, b) => a.at - b.at)
			.slice(0, 3)
			.map((x) => x.g);
	});
	const src = $derived(q.src ? [q.src.survey, q.src.wave, q.src.variable].filter(Boolean).join(' · ') : null);
	/* the key each choice answers to: 1-9 in order; on a ladder its own
	   number, 0 standing for 10 on a 1-10 card */
	const keyOf = (k) => {
		if (!bipolar) return String(k + 1);
		const n = first + k;
		return n === 10 ? (first === 0 ? '' : '0') : String(n);
	};
</script>

{#if q.stem}<p class="stem">{q.stem}</p>{/if}
{#if q.text}<h2>{q.text}</h2>{/if}

<div role="radiogroup" aria-label={q.text || q.left + ' / ' + q.right}>
	{#if bipolar}
		<div class="poles">
			<div class="pole"><small>{L.quizPoleFull(first)}</small>{q.left}</div>
			<div class="pole r"><small>{L.quizPoleFull(first + q.scale.values.length - 1)}</small>{q.right}</div>
		</div>
		<div class="ladder">
			{#each q.scale.values as _, k}
				<label class="choice" data-key={keyOf(k)}>
					<input type="radio" name="q" checked={value === k} onchange={() => onanswer(k)} />
					{first + k}
				</label>
			{/each}
		</div>
	{:else}
		<div class="choices">
			{#each q.scale.fr as label, k}
				<label class="choice" data-key={keyOf(k)}>
					<input type="radio" name="q" checked={value === k} onchange={() => onanswer(k)} />
					<span class="key">{k + 1}</span>{label}
				</label>
			{/each}
		</div>
	{/if}
	{#if q.scale.dk}
		<div class="choices">
			<label class="choice dk">
				<input type="radio" name="q" checked={value === 'dk'} onchange={() => onanswer('dk')} />
				{q.scale.dk}
			</label>
		</div>
	{/if}
</div>

{#if q.note}<p class="q-note">{q.note}</p>{/if}
{#if defs.length && !q.salience}
	<!-- folded: the question stays as the survey asked it; context only when asked for -->
	<details class="defs">
		<summary>{L.quizDefsLabel(defs.length)}</summary>
		<dl>
			{#each defs as d (d.term)}<dt>{d.term}</dt><dd>{d.def}</dd>{/each}
		</dl>
		<p class="defs-note">{L.quizDefsNote}</p>
	</details>
{/if}
{#if q.salience}
	<p class="q-src">{L.quizSalienceSrc}</p>
{:else if src}
	<p class="q-src">
		{L.quizSourceLabel}<a href={q.src.url} target="_blank" rel="noopener noreferrer">{src}</a>{#if q.translated}<br /><span class="tr">{L.quizTranslated[q.translated]}</span>{/if}
	</p>
{/if}

<style>
	.defs { margin: 18px 0 0; font-size: 14.5px; }
	.defs summary { cursor: pointer; color: var(--accent-ink); font-weight: 600; min-height: 32px; display: inline-flex; align-items: center; gap: 8px; list-style: none; }
	.defs summary::-webkit-details-marker { display: none; }
	/* a plus that turns to a minus: it says the line unfolds */
	.defs summary::before { content: '+'; display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 50%;
		border: 1.5px solid currentColor; font-size: 15px; line-height: 1; font-weight: 700; }
	.defs[open] summary::before { content: '\2212'; }
	.defs dl { margin: 8px 0 0; display: grid; gap: 10px; }
	.defs dt { font-weight: 650; color: var(--text); }
	.defs dd { margin: 2px 0 0; color: var(--text-2); line-height: 1.5; }
	.defs-note { margin: 10px 0 0; font-size: 13px; color: var(--text-3); }
</style>
