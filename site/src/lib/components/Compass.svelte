<!-- The compass: a 600-unit square, the parties as diamonds, the members as
     dots, every label at a free spot, and around a selection the two
     proximity rings and lines to its three nearest neighbours. It computes
     its geometry in one pass and draws the result. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { signed } from '$lib/format.js';
	import { copyOf, toSvgX, toSvgY, noteOf, rankParties, rankProfiles, nearestReference } from '$lib/compass/model.js';
	import { CANDIDATES, placeLabel, ringCapSpot, textWidth } from '$lib/compass/labels.js';
	import { PolitiExtract } from '$lib/model.js';

	/** @type {{ computed: {p:any,c:any}[], refs: any[], limits: any, viewKey: string, show: any,
	 *           selected: null | {kind:'profile'|'party', i:number}, onpick: (kind:string, i:number) => void }} */
	let { computed, refs, limits, viewKey, show, selected = null, onpick } = $props();

	const W = $derived(copyOf(viewKey));
	const grid = [-75, -50, -25, 25, 50, 75, -100, 100];

	const geo = $derived.by(() => {
		const placed = computed.map((r, i) => ({ ...r, i })).filter((r) => !r.c.off);
		const qw = [W.quadTopLeft, W.quadTopRight, W.quadBottomLeft, W.quadBottomRight].map((t) => textWidth(t, 12.5));
		const taken = [
			{ x0: 46, x1: 90, y0: 306, y1: 318 }, { x0: 160, x1: 190, y0: 306, y1: 318 },
			{ x0: 410, x1: 440, y0: 306, y1: 318 }, { x0: 510, x1: 554, y0: 306, y1: 318 },
			{ x0: 56, x1: 64 + qw[0], y0: 56, y1: 74 }, { x0: 536 - qw[1], x1: 544, y0: 56, y1: 74 },
			{ x0: 56, x1: 64 + qw[2], y0: 526, y1: 544 }, { x0: 536 - qw[3], x1: 544, y0: 526, y1: 544 },
			{ x0: 50, x1: 64, y0: 293, y1: 307 }, { x0: 536, x1: 550, y0: 293, y1: 307 },
			{ x0: 293, x1: 307, y0: 50, y1: 64 }, { x0: 293, x1: 307, y0: 536, y1: 550 }
		];
		let centroid = null;
		if (show.centroid && placed.length >= 2) {
			const mx = placed.reduce((a, r) => a + r.c.x, 0) / placed.length;
			const my = placed.reduce((a, r) => a + r.c.y, 0) / placed.length;
			centroid = { x: toSvgX(mx), y: toSvgY(my), text: L.mean(signed(Math.round(mx)), signed(Math.round(my))) };
			taken.push({ x0: centroid.x - 13, x1: centroid.x + 125, y0: centroid.y - 13, y1: centroid.y + 13 });
		}
		/* markers claim space first, members before parties */
		for (const { c } of placed) {
			const x = toSvgX(c.x), y = toSvgY(c.y);
			taken.push({ x0: x - 10, x1: x + 10, y0: y - 10, y1: y + 10 });
		}
		if (show.refs)
			for (const r of refs) {
				const x = toSvgX(r.x), y = toSvgY(r.y);
				taken.push({ x0: x - 7, x1: x + 7, y0: y - 7, y1: y + 7 });
			}
		const pts = placed.map(({ p, c, i }) => {
			const x = toSvgX(c.x), y = toSvgY(c.y);
			const text = p.alias.slice(0, 16);
			/* a member always keeps a label: they are the chart's subject */
			const place = show.labels ? placeLabel({ x, y, w: textWidth(text, 14.5, 650), size: 14.5 }, taken) || CANDIDATES[0] : null;
			const trail = show.trail && c.from && (c.from.x !== c.x || c.from.y !== c.y) ? { x: toSvgX(c.from.x), y: toSvgY(c.from.y) } : null;
			return { i, x, y, text, place, trail, alias: p.alias, me: !!p.me };
		});
		const parties = show.refs
			? refs.map((r, ri) => {
					const x = toSvgX(r.x), y = toSvgY(r.y);
					/* no free spot: no label, rather than one over a member's */
					const place = show.refLabels ? placeLabel({ x, y, w: textWidth(r.name, 12.5), size: 12.5 }, taken) : null;
					return { ri, x, y, name: r.name, title: r.name + ' — ' + noteOf(r), place };
				})
			: [];
		let annot = null;
		const origin = selected
			? selected.kind === 'profile'
				? computed[selected.i] && !computed[selected.i].c.off ? computed[selected.i].c : null
				: refs[selected.i]
			: null;
		if (origin) {
			const ox = toSvgX(origin.x), oy = toSvgY(origin.y);
			const rings = [limits.near, limits.far].map((d) => {
				const r = d * 2.5;
				return { r, d, spot: ringCapSpot(ox, oy, r, String(d), taken) };
			});
			const near = (
				selected.kind === 'profile'
					? rankParties(origin, refs).map((o) => refs.find((r) => r.name === o.name))
					: rankProfiles(origin, computed).map((o) => computed[o.i].c)
			)
				.slice(0, 3)
				.filter(Boolean)
				.map((n) => ({ x: toSvgX(n.x), y: toSvgY(n.y) }));
			annot = { ox, oy, rings, near };
		}
		return { pts, parties, centroid, annot };
	});

	/* the hover card */
	let tip = $state(null);
	function showTip(i, ev) {
		const { p, c } = computed[i];
		const n = nearestReference(c.x, c.y, refs, limits);
		const box = ev.currentTarget.closest('.plot').getBoundingClientRect();
		tip = {
			left: Math.min(ev.clientX - box.left + 14, box.width - 230),
			top: ev.clientY - box.top + 14,
			alias: p.alias,
			rows: [
				[L.tipEcon, signed(c.x)],
				[W.tipSocial, signed(c.y) + (c.y > 0 ? W.suffixAuthor : c.y < 0 ? W.suffixLibert : '')],
				[L.tipEcol, c.ecol === null ? '—' : signed(c.ecol)],
				...(c.method ? [[L.tipMethod, c.method]] : [])
			],
			concepts: PolitiExtract.keyConcepts(p, 3).map((k) => L.pole[k.key]).join(' · ') || L.noMarkedAxis,
			near: !n
				? L.viewNoRefs
				: (n.d > limits.far ? L.nearestFar + n.name + ' (' + n.d + ')' : L.nearest + n.name + ' (' + L.proximity + n.fit + ')') +
					(n.margin <= limits.tie ? L.tieWith(n.second.name, n.margin) : '')
		};
	}
	const key = (fn) => (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			fn();
		}
	};
</script>

<div class="plot">
	<svg id="compass" viewBox="0 0 600 600" role="img" aria-label={L.compassAria}>
		<rect class="plot-frame" x="50" y="50" width="500" height="500" rx="4" />
		<g>
			{#each grid as v}
				<line class="grid-line" x1={toSvgX(v)} y1="50" x2={toSvgX(v)} y2="550" />
				<line class="grid-line" x1="50" y1={toSvgY(v)} x2="550" y2={toSvgY(v)} />
			{/each}
			<line class="axis-line" x1="50" y1="300" x2="550" y2="300" />
			<line class="axis-line" x1="300" y1="50" x2="300" y2="550" />
		</g>
		<g>
			<text class="axis-cap" x="300" y="38" text-anchor="middle">{W.axisTop}</text>
			<text class="axis-cap" x="300" y="574" text-anchor="middle">{W.axisBottom}</text>
			<text class="quad-cap" x="60" y="68">{W.quadTopLeft}</text>
			<text class="quad-cap" x="540" y="68" text-anchor="end">{W.quadTopRight}</text>
			<text class="quad-cap" x="60" y="538">{W.quadBottomLeft}</text>
			<text class="quad-cap" x="540" y="538" text-anchor="end">{W.quadBottomRight}</text>
			<text class="tick-cap" x="52" y="315">−100</text>
			<text class="tick-cap" x="175" y="315" text-anchor="middle">−50</text>
			<text class="tick-cap" x="425" y="315" text-anchor="middle">+50</text>
			<text class="tick-cap" x="548" y="315" text-anchor="end">+100</text>
			<text class="axis-cap" x="22" y="300" text-anchor="middle" transform="rotate(-90 22 300)">{W.axisLeft}</text>
			<text class="axis-cap" x="578" y="300" text-anchor="middle" transform="rotate(90 578 300)">{W.axisRight}</text>
			<path class="axis-head" d="M 52 300 L 62 295 L 62 305 Z" />
			<path class="axis-head" d="M 548 300 L 538 295 L 538 305 Z" />
			<path class="axis-head" d="M 300 52 L 295 62 L 305 62 Z" />
			<path class="axis-head" d="M 300 548 L 295 538 L 305 538 Z" />
		</g>

		{#if geo.annot}
			{@const a = geo.annot}
			<g class="annot">
				<circle class="sel-disc" cx={a.ox} cy={a.oy} r="50" />
				{#each a.rings as ring}
					<circle class="sel-ring" cx={a.ox} cy={a.oy} r={ring.r} />
					<text class="sel-ring-cap" x={ring.spot.x} y={ring.spot.y} text-anchor="middle">{ring.d}</text>
				{/each}
				{#each a.near as n}
					<line class="link-line" x1={a.ox} y1={a.oy} x2={n.x} y2={n.y} />
				{/each}
			</g>
		{/if}

		<g id="refs-layer" class:dim={!!selected}>
			{#each geo.parties as r (r.ri)}
				<g class:sel={selected?.kind === 'party' && selected.i === r.ri}
					onclick={() => onpick('party', r.ri)} role="presentation">
					<circle class="ref-hit" cx={r.x} cy={r.y} r="13" tabindex="0" role="button" aria-label={L.partyAria(r.name)}
						onkeydown={key(() => onpick('party', r.ri))} />
					<path class="ref-mark" d="M {r.x} {r.y - 5.5} L {r.x + 5.5} {r.y} L {r.x} {r.y + 5.5} L {r.x - 5.5} {r.y} Z" />
					<title>{r.title}</title>
					{#if r.place}
						<text class="ref-label" x={r.x + r.place.dx} y={r.y + r.place.dy} text-anchor={r.place.anchor}>{r.name}</text>
					{/if}
				</g>
			{/each}
		</g>

		<g id="points-layer" class:dim={!!selected}>
			{#each geo.pts as pt (pt.i)}
				<g class:sel={selected?.kind === 'profile' && selected.i === pt.i} class:me={pt.me}
					onclick={() => onpick('profile', pt.i)} role="presentation"
					onmouseenter={(e) => showTip(pt.i, e)} onmousemove={(e) => showTip(pt.i, e)} onmouseleave={() => (tip = null)}>
					<circle class="hit" cx={pt.x} cy={pt.y} r="14" tabindex="0" role="button" aria-label={pt.alias}
						onkeydown={key(() => onpick('profile', pt.i))} />
					{#if pt.trail}
						<line class="trail" x1={pt.trail.x} y1={pt.trail.y} x2={pt.x} y2={pt.y} />
						<circle class="trail-ghost" cx={pt.trail.x} cy={pt.trail.y} r="4" />
					{/if}
					<circle class="pt-ring" cx={pt.x} cy={pt.y} r="7" />
					<circle class="pt-dot" cx={pt.x} cy={pt.y} r="7" />
					{#if pt.place}
						<text class="pt-label" x={pt.x + pt.place.dx} y={pt.y + pt.place.dy} text-anchor={pt.place.anchor}>{pt.text}</text>
					{/if}
				</g>
			{/each}
		</g>

		{#if geo.centroid}
			{@const m = geo.centroid}
			<g>
				<circle class="centroid" cx={m.x} cy={m.y} r="8" />
				<line class="centroid" x1={m.x - 12} y1={m.y} x2={m.x + 12} y2={m.y} />
				<line class="centroid" x1={m.x} y1={m.y - 12} x2={m.x} y2={m.y + 12} />
				<text class="centroid-cap" x={m.x + 15} y={m.y + 3.5}>{m.text}</text>
			</g>
		{/if}
	</svg>

	{#if tip}
		<div class="tip" style="left: {tip.left}px; top: {tip.top}px">
			<b>{tip.alias}</b>
			<dl>
				{#each tip.rows as [k, v]}<dt>{k}</dt><dd>{v}</dd>{/each}
			</dl>
			<p class="near">{tip.concepts}</p>
			<p class="near">{tip.near}</p>
		</div>
	{/if}
</div>

<style>
	.plot { position: relative; }
	.tip { position: absolute; pointer-events: none; z-index: 5; }
</style>
