<!-- A reading drawn small: its two ends, your position as a dot and, when
     asked, the stretch around it that the count beside it is about. The
     scale is the one of the readings card, from -100 to +100. -->
<script>
	/** ends: [left label, right label]; value: -100..100; around: half-width of the shaded stretch, if any */
	let { ends, value, around = 0 } = $props();
	const pct = (v) => (Math.max(-100, Math.min(100, v)) + 100) / 2;
	const from = $derived(pct(value - around));
	const to = $derived(pct(value + around));
</script>

<div class="strip" aria-hidden="true">
	<div class="track">
		<div class="rail"></div>
		{#if around}<div class="zone" style="left: {from}%; width: {to - from}%"></div>{/if}
		<div class="zero"></div>
		<div class="dot" style="left: {pct(value)}%"></div>
	</div>
	<div class="ends"><span>{ends[0]}</span><span>{ends[1]}</span></div>
</div>

<style>
	.strip { flex: 1 1 100%; max-width: 420px; margin-top: 6px; }
	.track { position: relative; height: 18px; }
	.rail { position: absolute; left: 0; right: 0; top: 8px; height: 2px; border-radius: 1px; background: var(--border); }
	.zone { position: absolute; top: 3px; height: 12px; border-radius: 6px; background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--border-strong); }
	.zero { position: absolute; left: 50%; top: 3px; width: 1.5px; height: 12px; background: var(--axis); }
	.dot { position: absolute; top: 3px; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: var(--dot-me); box-shadow: 0 0 0 2px var(--surface); }
	.ends { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-3); margin-top: 1px; }
</style>
