<!-- A profile's readings as bands, after the design: each on its own track
     from −100 to +100, the dot sliding in to its value. X and Y are the
     reading on show; the others come from the economy and Europe
     questionnaires. -->
<script>
	import { onMount } from 'svelte';
	import { L } from '$lib/i18n/fr.js';
	import { signed } from '$lib/format.js';

	/** c: the profile projected on the reading on show; q, soc, eu: its economy, society and Europe scores, if any */
	let { c, q = null, soc = null, eu = null, inst = null } = $props();

	let arrived = $state(false);
	onMount(() => requestAnimationFrame(() => (arrived = true)));

	const B = L.bands;
	/* a reading that draws another y against X still has the profile's own Y to show */
	const xy = $derived(c.side ? c.base : c);
	/* an axis the questionnaire has begun but cannot yet replace says how far it is */
	const hintOf = (k, src, score) =>
		src === 'quiz' ? B.hintQuiz[k] : score && score[k] === null && score.provisional !== null ? B.hintPending(score.missing, xy[k] !== null) : B.hintPs;
	const bands = $derived(
		[
			{ k: 'x', v: xy.x, hint: hintOf('x', xy.xSrc, q) },
			{ k: 'y', v: xy.y, hint: hintOf('y', xy.ySrc, soc) },
			{ k: 'protectionism', v: q?.protectionism ?? null },
			{ k: 'class', v: q?.class ?? null },
			{ k: 'conflict', v: q?.conflict ?? null },
			{ k: 'labour', v: q?.labour ?? null },
			{ k: 'europe', v: eu?.europe ?? null },
			{ k: 'russia', v: eu?.russia ?? null },
			{ k: 'world', v: eu?.world ?? null },
			{ k: 'people', v: inst?.people ?? null },
			{ k: 'executive', v: inst?.executive ?? null }
		]
			.filter((b) => b.k === 'x' || b.k === 'y' || b.v !== null)
			.map((b) => ({ ...b, label: B.label[b.k], hint: b.hint || B.hint[b.k], ends: B.ends[b.k] }))
	);
	const pct = (v) => (arrived && v !== null ? (v + 100) / 2 : 50);
</script>

<div class="bands">
	{#each bands as b (b.k)}
		<div class="band">
			<div class="lab"><div class="l">{b.label}</div><div class="h">{b.hint}</div></div>
			<div>
				<div class="band-track" aria-hidden="true">
					<div class="rail"></div>
					<div class="zero"></div>
					{#if b.v !== null}
						<div class="mover" style="left: {pct(b.v)}%"><div class="dot"></div></div>
					{/if}
				</div>
				<div class="ends"><span>{b.ends[0]}</span><span>{b.ends[1]}</span></div>
			</div>
			<div class="val">{b.v === null ? '–' : signed(b.v)}</div>
		</div>
	{/each}
</div>

<style>
	.band { display: grid; grid-template-columns: 200px minmax(0, 1fr) 64px; align-items: center; gap: 20px; padding: 12px 0; border-top: 1px solid var(--border); }
	.lab { line-height: 1.3; }
	.l { font-size: 15px; font-weight: 650; }
	.h { font-size: 12.5px; color: var(--text-3); }
	.band-track { position: relative; height: 24px; }
	.rail { position: absolute; left: 0; right: 0; top: 11px; height: 2px; border-radius: 1px; background: var(--border); }
	.zero { position: absolute; left: 50%; top: 4px; width: 1.5px; height: 16px; background: var(--axis); }
	/* a zero-width anchor that slides: a full-width box moved by a transform ran past the screen's edge */
	.mover { position: absolute; top: 0; bottom: 0; width: 0; transition: left var(--dur-deliberate) var(--ease-move); }
	.dot { position: absolute; left: -8px; top: 4px; width: 16px; height: 16px; border-radius: 50%; background: var(--dot-me); box-shadow: 0 0 0 3px var(--surface); }
	.ends { display: flex; justify-content: space-between; font-size: 12.5px; color: var(--text-3); margin-top: 2px; }
	.val { text-align: right; font-size: 17px; font-weight: 650; font-variant-numeric: tabular-nums; }
	@media (max-width: 700px) {
		.band { grid-template-columns: minmax(0, 1fr) 52px; gap: 6px 14px; }
		.band > div:nth-child(2) { grid-column: 1 / -1; grid-row: 2; }
	}
</style>
