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
{#if q.salience}
	<p class="q-src">{L.quizSalienceSrc}</p>
{:else if src}
	<p class="q-src">
		{L.quizSourceLabel}<a href={q.src.url} target="_blank" rel="noopener noreferrer">{src}</a>{#if q.translated}<br /><span class="tr">{L.quizTranslated[q.translated]}</span>{/if}
	</p>
{/if}
