<!-- One historical figure of the "Pour rire" page: a typographic monogram in
     place of a portrait (no photo, nothing fetched), the name and years, the
     estimated position with its confidence, and the pointer to what the
     estimate rests on. Estimates, said as such on the page around it. -->
<script>
	import { L } from '$lib/i18n/fr.js';

	/** entry: a ranked item of match.js; lead: the small heading; big: the top card; extra: lines under the position */
	let { entry, lead = '', big = false, extra = [] } = $props();

	const F = L.figures;
	const f = $derived(entry.figure);
	/* first letter of the given name and of the last word of the name */
	const monogram = $derived.by(() => {
		const words = f.name.replace(/\s+Jr\.?$/, '').split(/\s+/);
		return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase();
	});
</script>

<article class="figure" class:big>
	{#if lead}<p class="lead-tag">{lead}</p>{/if}
	<div class="head">
		<span class="monogram" role="img" aria-label={F.monogram(f.name)}><span aria-hidden="true">{monogram}</span></span>
		<div class="who">
			<h3>{f.name}</h3>
			<p class="years">{f.born} – {f.died}</p>
			<p class="role">{F.roles[f.id]}</p>
		</div>
	</div>
	{#each extra as line}<p class="line">{line}</p>{/each}
	<p class="pos">
		{F.estimate(f.x, f.y)}
		<span class="conf {f.confidence}">{F.confidence[f.confidence]}</span>
	</p>
	{#if f.confidence === 'low'}<p class="line low">{F.lowNote}</p>{/if}
	<details>
		<summary>{F.basis}</summary>
		<p class="basis" lang="en">{f.basis}</p>
		<p class="wiki"><a href="https://en.wikipedia.org/wiki/{encodeURIComponent(f.wiki.replaceAll(' ', '_'))}" rel="noopener noreferrer">{F.wiki(f.wiki)}</a></p>
	</details>
</article>

<style>
	.figure { padding: 20px; border: 1.5px dashed var(--border-strong); border-radius: var(--r-lg); background: var(--surface); min-width: 0; }
	.figure.big { padding: 24px; border-style: solid; box-shadow: var(--shadow-2); }
	.lead-tag { margin: 0 0 12px; font-size: 13px; font-weight: 650; letter-spacing: .04em; text-transform: uppercase; color: var(--accent-ink); }
	.head { display: flex; align-items: center; gap: 16px; }
	.monogram { flex: none; display: grid; place-items: center; width: 72px; height: 72px; border-radius: 50%; background: var(--accent-soft); color: var(--accent-ink);
		box-shadow: inset 0 0 0 2px var(--surface), inset 0 0 0 3.5px var(--accent); font-family: Georgia, 'Times New Roman', serif; font-size: 27px; font-weight: 700; letter-spacing: .02em; }
	.big .monogram { width: 96px; height: 96px; font-size: 36px; }
	.who { min-width: 0; }
	h3 { margin: 0; font-family: var(--font-display); font-size: 20px; font-weight: 700; line-height: 1.2; overflow-wrap: anywhere; }
	.big h3 { font-size: 28px; letter-spacing: -0.015em; }
	.years { margin: 2px 0 0; font-size: 13.5px; color: var(--text-3); font-variant-numeric: tabular-nums; }
	.role { margin: 4px 0 0; font-size: 14.5px; color: var(--text-2); line-height: 1.35; }
	.line { margin: 14px 0 0; font-size: 14.5px; color: var(--text); line-height: 1.45; }
	.line.low { margin-top: 6px; color: var(--text-2); font-size: 13.5px; }
	.pos { margin: 14px 0 0; font-size: 13.5px; color: var(--text-2); display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; }
	.conf { padding: 2px 9px; border-radius: var(--r-pill); background: var(--surface-2); font-size: 12px; font-weight: 600; color: var(--text-2); }
	.conf.low { background: var(--danger-soft); color: var(--danger); }
	details { margin-top: 14px; font-size: 13.5px; color: var(--text-2); }
	summary { cursor: pointer; min-height: 32px; display: flex; align-items: center; color: var(--text-2); list-style: none; }
	summary::-webkit-details-marker { display: none; }
	summary::before { content: '▸'; display: inline-block; width: 16px; font-size: 12px; transition: transform var(--dur-instant); }
	details[open] > summary::before { transform: rotate(90deg); }
	.basis { margin: 6px 0 8px; line-height: 1.5; }
	.wiki { margin: 0; }
	.wiki a { overflow-wrap: anywhere; }
</style>
