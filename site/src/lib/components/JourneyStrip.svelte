<!-- The journey along one axis, after the design: a close-up of the axis
     around it, the parties within as diamonds, where PolitiScales had put
     the profile (a hollow ring) and the questionnaire's position sliding in
     from there; then a drop runs the way again, on a loop, unless motion is
     reduced. A profile without PolitiScales simply lands. -->
<script>
	import { onMount } from 'svelte';
	import { L } from '$lib/i18n/fr.js';
	import { signed } from '$lib/format.js';

	let { c, axis, country } = $props();

	const now = $derived(c[axis]);
	const was = $derived(c.from ? c.from[axis] : null);
	/* the close-up: 15 points of margin around both positions, on fives */
	const lo = $derived(Math.max(-100, Math.floor((Math.min(now, was ?? now) - 15) / 5) * 5));
	const hi = $derived(Math.min(100, Math.ceil((Math.max(now, was ?? now) + 15) / 5) * 5));
	const pct = (v) => ((v - lo) / (hi - lo)) * 100;

	/* parties inside the close-up, on two rows so their names do not collide */
	const parties = $derived.by(() => {
		const inside = country.parties.filter((r) => r[axis] > lo && r[axis] < hi).sort((a, b) => a[axis] - b[axis]);
		const lastLeft = [-Infinity, -Infinity];
		return inside.map((r) => {
			const left = pct(r[axis]);
			const row = left - lastLeft[0] >= 14 ? 0 : left - lastLeft[1] >= 14 ? 1 : null;
			if (row !== null) lastLeft[row] = left;
			return { name: r.name, left, top: row === 1 ? 74 : 56, named: row !== null };
		});
	});

	/* first the old place, then the move; the drop follows once it landed */
	let moved = $state(false);
	onMount(() => {
		const t = setTimeout(() => (moved = true), 380);
		return () => clearTimeout(t);
	});
	const pos = $derived(was === null || moved ? pct(now) : pct(was));
	const from = $derived(was === null ? null : pct(was));
	const rightward = $derived(was === null || now >= was);
	/* a caption sits away from the other point, unless that would push it off the track */
	const side = (p, away) => (p < 25 ? 'right' : p > 75 ? 'left' : away);
	const nowSide = $derived(side(pct(now), rightward ? 'right' : 'left'));
	const wasSide = $derived(was === null ? 'left' : side(pct(was), rightward ? 'left' : 'right'));
</script>

<section class="journey" aria-label={L.journeyAria(L.readingAxis[axis])}>
	<h2>{L.readingAxis[axis]} <span>· {L.journeyZoom(signed(lo), signed(hi))}</span></h2>
	<div class="track">
		<div class="rail"></div>
		{#if lo < 0 && hi > 0}<div class="zero" style="left: {pct(0)}%"></div>{/if}
		{#each parties as p (p.name)}
			<div class="ref" style="left: {p.left}%" title={p.name}></div>
			{#if p.named}<div class="ref-name" style="left: {p.left}%; top: {p.top}px">{p.name}</div>{/if}
		{/each}
		{#if from !== null}
			<div class="trail" class:on={moved} style="left: {Math.min(from, pct(now))}%; width: {Math.abs(pct(now) - from)}%; transform-origin: {rightward ? 'left' : 'right'} center">
				<div class="line"></div>
				{#if moved}
					<div class="flow" style:transform={rightward ? null : 'scaleX(-1)'}><div class="drop-move"><div class="drop"></div></div></div>
				{/if}
			</div>
			<div class="ghost" style="left: {from}%"></div>
			<div class="ghost-cap" style="left: {from}%" class:right={wasSide === 'right'}>{L.journeyWas(signed(was))}</div>
		{/if}
		<div class="mover" style="transform: translateX({pos}%)">
			{#if moved && from !== null}<div class="merge"></div>{/if}
			<div class="dot"></div>
			<div class="cap" class:left={nowSide === 'left'}>{L.journeyNow(signed(now))}</div>
		</div>
		<div class="end l">◄ {signed(lo)}</div>
		<div class="end r">{signed(hi)} ►</div>
	</div>
</section>

<style>
	.journey { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 20px 22px 16px; box-shadow: var(--shadow-1); }
	h2 { font-family: var(--font-sans); font-size: 15px; font-weight: 650; margin: 0; }
	h2 span { font-weight: 400; color: var(--text-3); }
	.track { position: relative; height: 118px; margin: 6px 8px 0; }
	.rail { position: absolute; left: 0; right: 0; top: 44px; height: 2px; border-radius: 1px; background: var(--axis); }
	.zero { position: absolute; top: 36px; width: 2px; height: 18px; margin-left: -1px; background: var(--axis); }
	.ref { position: absolute; top: 40px; width: 10px; height: 10px; margin-left: -5px; transform: rotate(45deg); background: var(--surface); border: 1.6px solid var(--ref); }
	.ref-name { position: absolute; transform: translateX(-50%); font-size: 12px; color: var(--text-3); white-space: nowrap; }
	.trail { position: absolute; top: 43px; height: 4px; transform: scaleX(0); opacity: 0;
		transition: transform var(--dur-deliberate) var(--ease-move), opacity var(--dur-instant) var(--ease-out); }
	.trail.on { transform: scaleX(1); opacity: 1; }
	.line { position: absolute; inset: 0; border-radius: 2px; background: var(--accent); opacity: .45; }
	.flow, .drop-move { position: absolute; inset: 0; }
	.drop-move { animation: drop-move 1800ms cubic-bezier(.45, .05, .3, 1) var(--dur-deliberate) infinite both; }
	.drop { position: absolute; left: -7px; top: -5px; width: 14px; height: 14px; border-radius: 50%; background: var(--dot-me);
		animation: drop-shape 1800ms linear var(--dur-deliberate) infinite both; }
	.ghost { position: absolute; top: 36px; width: 18px; height: 18px; margin-left: -9px; border-radius: 50%; border: 2px solid var(--text-3);
		background: var(--surface); box-sizing: border-box; }
	.ghost-cap { position: absolute; top: 6px; transform: translateX(-100%); margin-left: -4px; font-size: 12.5px; color: var(--text-2); white-space: nowrap; }
	.ghost-cap.right { transform: none; margin-left: 6px; }
	.mover { position: absolute; inset: 0; transition: transform var(--dur-deliberate) var(--ease-move); pointer-events: none; }
	.dot { position: absolute; left: 0; top: 35px; width: 20px; height: 20px; margin-left: -10px; border-radius: 50%; background: var(--dot-me);
		animation: land var(--dur-base) var(--ease-settle) both; }
	.merge { position: absolute; left: -10px; top: 35px; width: 20px; height: 20px; border-radius: 50%; background: var(--dot-me);
		animation: merge 1800ms var(--ease-out) var(--dur-deliberate) infinite both; }
	.cap { position: absolute; left: 0; top: 4px; margin-left: 6px; font-size: 13.5px; font-weight: 650; color: var(--text); white-space: nowrap; }
	.cap.left { margin-left: 0; transform: translateX(calc(-100% - 6px)); }
	.end { position: absolute; bottom: 0; font-size: 12px; color: var(--text-3); }
	.end.l { left: 0; }
	.end.r { right: 0; }
	@keyframes land { from { opacity: 0; transform: scale(.4); } }
	@keyframes drop-move { 0% { transform: translateX(0); } 72%, 100% { transform: translateX(100%); } }
	@keyframes drop-shape {
		0% { opacity: 0; transform: scale(.3); } 10% { opacity: 1; transform: scale(1); } 40% { opacity: 1; transform: scale(1.7, .75); }
		64% { opacity: 1; transform: scale(1.1); } 72%, 100% { opacity: 0; transform: scale(.35); }
	}
	@keyframes merge { 0%, 68% { opacity: 0; transform: scale(1); } 74% { opacity: .55; transform: scale(1.05); } 100% { opacity: 0; transform: scale(1.9); } }
	/* the loop is decoration: gone when motion is reduced, here or by the system */
	@media (prefers-reduced-motion: reduce) { .flow, .merge { display: none; } }
	:global([data-motion='reduce']) .flow, :global([data-motion='reduce']) .merge { display: none; }
</style>
