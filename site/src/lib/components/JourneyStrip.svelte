<!-- The journey along one axis, against the reference parties: where
     PolitiScales had put the profile and where the questionnaire puts it.
     Only the two nearest parties are named; the rest keep their name in a
     tooltip. Drawn at its container's width, so its text keeps its size. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { signed } from '$lib/format.js';
	import { nearestBase } from '$lib/compass/model.js';

	let { c, axis, country } = $props();
	let width = $state(640);

	const W = $derived(Math.round(Math.max(300, Math.min(700, width))));
	const H = 128, pad = 28, axisY = 70;
	const sx = (v) => pad + ((v + 100) / 200) * (W - 2 * pad);
	const anchorAt = (x) => (x < pad + 60 ? 'start' : x > W - pad - 60 ? 'end' : 'middle');

	const g = $derived.by(() => {
		const start = c.from;
		const byAxis = (v) => country.parties.reduce((b, r) => (!b || Math.abs(r[axis] - v) < Math.abs(b[axis] - v) ? r : b), null);
		const both = c.x !== null && c.y !== null;
		const now = both ? nearestBase(c.x, c.y, country) : { ref: byAxis(c[axis]) };
		const was = start ? nearestBase(start.x, start.y, country) : now;
		const named = [was.ref, now.ref].filter((r, i, a) => r && a.indexOf(r) === i);
		const nameW = named.map((r) => r.name.length * 5.6);
		const names = named.map((r, i) => {
			const x = sx(r[axis]);
			const clash = i === 1 && Math.abs(x - sx(named[0][axis])) < (nameW[0] + nameW[1]) / 2 + 10;
			return { x, y: axisY + (clash ? 34 : 20), name: r.name, anchor: anchorAt(x) };
		});
		const tx = sx(c[axis]), fx = start ? sx(start[axis]) : tx;
		const dir = Math.sign(tx - fx);
		return {
			start, tx, fx, names,
			arrow: start && Math.abs(tx - fx) > 12
				? { d: `M ${fx} ${axisY - 10} Q ${(fx + tx) / 2} ${axisY - 40} ${tx - dir * 6} ${axisY - 12}`,
					head: `M ${tx} ${axisY - 8} l ${-dir * 9} -7 l ${dir * 1} 10 Z` }
				: null,
			nowY: start && Math.abs(tx - fx) < 150 ? axisY - 48 : axisY - 16
		};
	});
	const ends = $derived(L.resultEnds[axis]);
</script>

<div bind:clientWidth={width}>
	<svg class="journey-strip" viewBox="0 0 {W} {H}" role="img"
		aria-label={(g.start ? L.resultWas + ' ' + signed(g.start[axis]) + ' → ' : '') + L.resultNow + ' ' + signed(c[axis])}>
		<line class="axis" x1={pad} y1={axisY} x2={W - pad} y2={axisY} />
		<text class="end" x={sx(-100)} y={H - 4} text-anchor="start">{ends[0]}</text>
		<text class="end" x={sx(100)} y={H - 4} text-anchor="end">{ends[1]}</text>
		{#each country.parties as r}
			{@const x = sx(r[axis])}
			<g>
				<path class="ref" d="M {x} {axisY - 4} L {x + 4} {axisY} L {x} {axisY + 4} L {x - 4} {axisY} Z" />
				<title>{r.name} ({signed(r[axis])})</title>
			</g>
		{/each}
		{#each g.names as n}
			<text class="ref-name" x={n.x} y={n.y} text-anchor={n.anchor}>{n.name}</text>
		{/each}
		{#if g.arrow}
			<path class="arrow" d={g.arrow.d} />
			<path class="head" d={g.arrow.head} />
		{/if}
		{#if g.start}<circle class="trail-ghost" cx={g.fx} cy={axisY} r="6" />{/if}
		<circle class="dot" cx={g.tx} cy={axisY} r="7" />
		{#if g.start}
			<text class="cap was" x={g.fx} y={axisY - 16} text-anchor={anchorAt(g.fx)}>{L.resultWas} {signed(g.start[axis])}</text>
		{/if}
		<text class="cap" x={g.tx} y={g.nowY} text-anchor={anchorAt(g.tx)}>{L.resultNow} {signed(c[axis])}</text>
	</svg>
</div>

<style>
	/* the new position slides in from the old one */
	.dot { animation: land 0.4s ease-out both; }
	.arrow { stroke-dasharray: 400; animation: draw 0.5s ease-out both; }
	@keyframes land { from { opacity: 0; } to { opacity: 1; } }
	@keyframes draw { from { stroke-dashoffset: 400; } to { stroke-dashoffset: 0; } }
	@media (prefers-reduced-motion: reduce) { .dot, .arrow { animation: none; } }
</style>
