<!-- The compass, after the design: a 600-unit square whose plane runs from
     44 to 556, the parties as diamonds, the members as dots, every label at
     a free spot. Around a selection, the two proximity rings, "proche" and
     "modérée"; the rest recedes. Marks are groups moved by a transform, so
     a change of reading glides them to their new place one after the other;
     on arrival they grow in, and the labels come once they have landed. -->
<script>
	import { onMount } from 'svelte';
	import { L } from '$lib/i18n/fr.js';
	import { signed } from '$lib/format.js';
	import { copyOf, noteOf, rankParties, rankProfiles, nearestReference } from '$lib/compass/model.js';
	import { textWidth } from '$lib/compass/labels.js';
	import { PolitiExtract } from '$lib/model.js';

	/** @type {{ computed: {p:any,c:any}[], refs: any[], limits: any, viewKey: string, show: any,
	 *           selected: null | {kind:'profile'|'party', i:number}, onpick: (kind:string, i:number) => void }} */
	let { computed, refs, limits, viewKey, show, selected = null, onpick } = $props();

	const W = $derived(copyOf(viewKey));
	/* one point of the −100…+100 scale is 2.56 units: the plane is 512 wide */
	const S = 2.56;
	const clamp = (v) => Math.max(50, Math.min(550, v));
	const X = (v) => clamp(300 + v * S);
	const Y = (v) => clamp(300 - v * S);
	/* text sizes in units, for the design's pixel sizes at the chart's usual width */
	const K = 600 / 548;
	const F = { cap: 12 * K, quad: 12.5 * K, tick: 11.5 * K, member: 14 * K, ref: 12 * K };
	const grid = [-75, -50, -25, 25, 50, 75];

	/* The design's placement: eight spots around a mark, the first free one
	   wins; a mark's own box and every label placed so far are taken. */
	function place(taken, cx, cy, text, size, weight, gap, always = false) {
		const w = textWidth(text, size, weight) + 2, h = size;
		const spots = [[gap, 0, 'start'], [-gap, 0, 'end'], [0, -gap - h / 2, 'middle'], [0, gap + h / 2, 'middle'],
			[gap * 0.75, -gap * 0.75 - h / 3, 'start'], [-gap * 0.75, -gap * 0.75 - h / 3, 'end'],
			[gap * 0.75, gap * 0.75 + h / 3, 'start'], [-gap * 0.75, gap * 0.75 + h / 3, 'end']];
		for (const [dx, dy, anchor] of spots) {
			const x1 = anchor === 'start' ? cx + dx : anchor === 'end' ? cx + dx - w : cx + dx - w / 2;
			const r = { x1, x2: x1 + w, y1: cy + dy - h / 2, y2: cy + dy + h / 2 };
			if (r.x1 < 46 || r.x2 > 554 || r.y1 < 46 || r.y2 > 554) continue;
			if (taken.some((o) => r.x1 < o.x2 && r.x2 > o.x1 && r.y1 < o.y2 && r.y2 > o.y1)) continue;
			taken.push(r);
			/* the text's baseline sits a third of its size below the box's middle */
			return { dx, dy: dy + h * 0.34, anchor };
		}
		if (!always) return null;
		/* a member keeps a label even with no free spot: above its dot, or
		   below when it sits at the top, and inward from a side */
		const up = cy > 90;
		const anchor = cx < 120 ? 'start' : cx > 480 ? 'end' : 'middle';
		const dx = anchor === 'start' ? -6 : anchor === 'end' ? 6 : 0;
		return { dx, dy: (up ? -gap - h / 2 : gap + h / 2) + h * 0.34, anchor };
	}

	const geo = $derived.by(() => {
		const taken = [];
		const box = (x, y, w, h) => taken.push({ x1: x, x2: x + w, y1: y, y2: y + h });
		/* the side captions at the ends of the horizontal axis, and the quadrant names */
		box(50, 300 - 18 * K, textWidth(W.axisLeft, F.cap, 650), 16 * K);
		box(550 - textWidth(W.axisRight, F.cap, 650), 300 - 18 * K, textWidth(W.axisRight, F.cap, 650), 16 * K);
		const quads = [[56, 64, 'start', W.quadTopLeft], [544, 64, 'end', W.quadTopRight], [56, 538, 'start', W.quadBottomLeft], [544, 538, 'end', W.quadBottomRight]]
			.map(([x, y, anchor, text]) => {
				const w = textWidth(text, F.quad);
				box(anchor === 'start' ? x : x - w, y - F.quad * 0.6, w, F.quad * 1.2);
				return { x, y, anchor, text };
			});

		const placed = computed.map((r, i) => ({ ...r, i })).filter((r) => !r.c.off);
		const sel = selected?.kind === 'profile' ? placed.find((r) => r.i === selected.i) : null;
		const selRef = selected?.kind === 'party' ? refs[selected.i] : null;
		/* what the selection comes close to: its two nearest parties, or a party's two nearest members */
		const nearParties = sel ? rankParties(sel.c, refs).slice(0, 2).map((o) => o.name) : selRef ? [selRef.name] : [];
		const nearMembers = selRef ? rankProfiles(selRef, computed).slice(0, 2).map((o) => o.i) : [];

		for (const { c } of placed) box(X(c.x) - 10, Y(c.y) - 10, 20, 20);
		let centroid = null;
		if (show.centroid && placed.length >= 2) {
			const mx = placed.reduce((a, r) => a + r.c.x, 0) / placed.length;
			const my = placed.reduce((a, r) => a + r.c.y, 0) / placed.length;
			centroid = { x: X(mx), y: Y(my), title: L.mean(signed(Math.round(mx)), signed(Math.round(my))) };
			box(centroid.x - 12, centroid.y - 26, 152, 38);
		}
		/* members claim their label spot first: they are the chart's subject */
		const pts = placed.map(({ p, c, i }) => {
			const x = X(c.x), y = Y(c.y);
			const text = p.alias.slice(0, 16);
			const isSel = sel && sel.i === i;
			return {
				i, x, y, text, alias: p.alias, me: !!p.me, isSel,
				dim: (sel && !isSel) || (selRef && !nearMembers.includes(i)),
				place: place(taken, x, y, text, F.member, 650, 14, true),
				trail: show.trail && c.from && (c.from.x !== c.x || c.from.y !== c.y) ? { x: X(c.from.x), y: Y(c.from.y) } : null,
				aria: p.alias + ' : X ' + signed(c.x) + ', Y ' + signed(c.y)
			};
		});
		for (const r of refs) box(X(r.x) - 8, Y(r.y) - 8, 16, 16);
		/* near parties first, so a crowded chart names the ones that matter */
		const order = refs.map((r, ri) => ri).sort((a, b) => nearParties.includes(refs[b].name) - nearParties.includes(refs[a].name));
		const parties = [];
		for (const ri of order) {
			const r = refs[ri];
			const x = X(r.x), y = Y(r.y);
			const near = nearParties.includes(r.name);
			parties[ri] = {
				ri, x, y, name: r.name, title: r.name + ' — ' + noteOf(r), near,
				dim: (sel || selRef) && !near,
				place: show.refLabels || near ? place(taken, x, y, r.name, F.ref, near ? 650 : 500, 11) : null
			};
		}
		const origin = sel ? { x: X(sel.c.x), y: Y(sel.c.y) } : selRef ? { x: X(selRef.x), y: Y(selRef.y) } : null;
		return { quads, pts, parties, centroid, origin };
	});

	/* The entrance, then the labels; on a change of reading the labels go,
	   the marks glide, the labels come back placed for the new layout. */
	const still = () =>
		typeof window === 'undefined' ||
		document.documentElement.dataset.motion === 'reduce' ||
		matchMedia('(prefers-reduced-motion: reduce)').matches;
	let appeared = $state(false);
	let labelsOn = $state(false);
	let labelTimer = null;
	function labelsAfter(ms) {
		clearTimeout(labelTimer);
		if (still()) return (labelsOn = true);
		labelsOn = false;
		labelTimer = setTimeout(() => (labelsOn = true), ms);
	}
	onMount(() => {
		requestAnimationFrame(() => (appeared = true));
		labelsAfter(640);
		return () => clearTimeout(labelTimer);
	});
	let lastView = viewKey;
	$effect(() => {
		if (viewKey !== lastView) {
			lastView = viewKey;
			labelsAfter(560);
		}
	});

	/* the hover card */
	let tip = $state(null);
	function showTip(i, ev) {
		const { p, c } = computed[i];
		const n = nearestReference(c.x, c.y, refs, limits);
		const b = ev.currentTarget.closest('.plot').getBoundingClientRect();
		tip = {
			left: Math.min(ev.clientX - b.left + 14, b.width - 230),
			top: ev.clientY - b.top + 14,
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
	<svg id="compass" class:appeared viewBox="0 0 600 600" role="img" aria-label={L.compassAria}>
		<rect class="plane" x="44" y="44" width="512" height="512" rx="12" />
		{#each grid as v}
			<line class="grid-line" x1={300 + v * S} y1="44" x2={300 + v * S} y2="556" />
			<line class="grid-line" x1="44" y1={300 - v * S} x2="556" y2={300 - v * S} />
		{/each}
		<line class="axis-line" x1="44" y1="300" x2="556" y2="300" />
		<line class="axis-line" x1="300" y1="44" x2="300" y2="556" />

		<text class="cap" x="300" y="26" text-anchor="middle" font-size={F.cap}>{W.axisTop}</text>
		<text class="cap" x="300" y="582" text-anchor="middle" font-size={F.cap}>{W.axisBottom}</text>
		<text class="cap" x="52" y={300 - 8 * K} font-size={F.cap}>{W.axisLeft}</text>
		<text class="cap" x="548" y={300 - 8 * K} text-anchor="end" font-size={F.cap}>{W.axisRight}</text>
		{#each geo.quads as q}
			<text class="quad" x={q.x} y={q.y + F.quad * 0.34} text-anchor={q.anchor} font-size={F.quad}>{q.text}</text>
		{/each}
		{#each [-50, 50] as v}
			<text class="tick" x={300 + v * S} y={314 + F.tick * 0.34} text-anchor="middle" font-size={F.tick}>{signed(v)}</text>
			<text class="tick" x="307" y={300 - v * S + F.tick * 0.34} font-size={F.tick}>{signed(v)}</text>
		{/each}

		<!-- trails: from where PolitiScales had put a member to where the questionnaire does -->
		{#each geo.pts as pt (pt.i)}
			{#if pt.trail}
				<g class="trail" class:on={appeared} class:faint={geo.origin && !pt.isSel}>
					<line x1={pt.trail.x} y1={pt.trail.y} x2={pt.x} y2={pt.y} />
					<circle cx={pt.trail.x} cy={pt.trail.y} r="6" />
				</g>
			{/if}
		{/each}

		<g id="refs-layer">
			{#each geo.parties as r (r.ri)}
				<g class="mark" style="transform: translate({r.x}px, {r.y}px); --i: {r.ri}" onclick={() => onpick('party', r.ri)} role="presentation">
					<g class="ref-in" class:dim={r.dim}>
						<circle class="hit" r="13" tabindex="0" role="button" aria-label={L.partyAria(r.name)} onkeydown={key(() => onpick('party', r.ri))} />
						<path class="ref-mark" class:near={r.near} d="M0,-7 L7,0 L0,7 L-7,0 Z" />
						<title>{r.title}</title>
					</g>
				</g>
			{/each}
		</g>

		{#if geo.centroid}
			{@const m = geo.centroid}
			<g class="mark" style="transform: translate({m.x}px, {m.y}px)">
				<g class="mean" class:on={appeared}>
					<title>{m.title}</title>
					<path d="M-8,0 H8 M0,-8 V8" />
					<circle r="11" />
					<text x="14" y="-12" font-size="13">{L.optMean}</text>
				</g>
			</g>
		{/if}

		<g id="points-layer">
			{#each geo.pts as pt (pt.i)}
				<g class="mark" style="transform: translate({pt.x}px, {pt.y}px); --i: {pt.i}"
					onmouseenter={(e) => showTip(pt.i, e)} onmousemove={(e) => showTip(pt.i, e)} onmouseleave={() => (tip = null)}
					onclick={() => onpick('profile', pt.i)} role="presentation">
					<g class="pt-in" class:dim={pt.dim}>
						<g class="rings" class:on={pt.isSel}>
							<circle class="ring far" r={limits.far * S} />
							<circle class="ring near" r={limits.near * S} />
							<text class="ring-cap" y={-limits.near * S - 5} text-anchor="middle">{L.fit.near}</text>
							<text class="ring-cap" y={-limits.far * S - 5} text-anchor="middle">{L.fit.moderate}</text>
						</g>
						<circle class="hit" r="16" tabindex="0" role="button" aria-label={pt.aria} aria-pressed={pt.isSel}
							onkeydown={key(() => onpick('profile', pt.i))} />
						<circle class="focus" r="15" class:on={pt.isSel} />
						<circle class="dot" class:me={pt.me} r={pt.isSel ? 9.5 : 8} />
					</g>
				</g>
			{/each}
		</g>

		{#if geo.origin && selected?.kind === 'party'}
			<g class="mark" style="transform: translate({geo.origin.x}px, {geo.origin.y}px)">
				{#key selected.i}
					<g class="rings on">
						<circle class="ring far" r={limits.far * S} />
						<circle class="ring near" r={limits.near * S} />
						<text class="ring-cap" y={-limits.near * S - 5} text-anchor="middle">{L.fit.near}</text>
						<text class="ring-cap" y={-limits.far * S - 5} text-anchor="middle">{L.fit.moderate}</text>
					</g>
				{/key}
			</g>
		{/if}

		<!-- labels last, over every mark; they move with their mark -->
		<g class="labels" class:on={labelsOn} aria-hidden="true">
			{#each geo.parties as r (r.ri)}
				{#if r.place}
					<text class="ref-label mark" class:near={r.near} class:dim={r.dim} style="transform: translate({r.x}px, {r.y}px); --i: {r.ri}"
						x={r.place.dx} y={r.place.dy} text-anchor={r.place.anchor} font-size={F.ref}>{r.name}</text>
				{/if}
			{/each}
			{#each geo.pts as pt (pt.i)}
				{#if pt.place}
					<text class="pt-label mark" class:dim={pt.dim} style="transform: translate({pt.x}px, {pt.y}px); --i: {pt.i}"
						x={pt.place.dx} y={pt.place.dy} text-anchor={pt.place.anchor} font-size={F.member}>{pt.text}</text>
				{/if}
			{/each}
		</g>
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
	svg { width: 100%; height: auto; display: block; font-family: var(--font-sans); overflow: visible; }
	.plane { fill: var(--quad); }
	.grid-line { stroke: var(--grid); stroke-width: 1; }
	.axis-line { stroke: var(--axis); stroke-width: 1.6; }
	.cap { fill: var(--text-2); font-weight: 650; letter-spacing: .05em; }
	.quad { fill: var(--text-3); font-style: italic; }
	.tick { fill: var(--text-3); font-variant-numeric: tabular-nums; }

	/* marks glide to a new place, one after the other */
	.mark { transition: transform var(--dur-deliberate) var(--ease-move) calc(var(--stagger) * var(--i, 0)); }
	.hit { fill: transparent; cursor: pointer; outline: none; }
	.pt-in { opacity: 0; transform: scale(.4); cursor: pointer;
		transition: opacity var(--dur-base) var(--ease-out) calc(var(--stagger) * var(--i, 0) + 180ms),
			transform var(--dur-base) var(--ease-settle) calc(var(--stagger) * var(--i, 0) + 180ms); }
	.ref-in { opacity: 0; transition: opacity var(--dur-base) var(--ease-out); }
	.appeared .pt-in { opacity: 1; transform: none; }
	.appeared .ref-in { opacity: 1; }
	.appeared .pt-in.dim { opacity: .3; }
	.appeared .ref-in.dim { opacity: .35; }

	.ref-mark { fill: var(--surface); stroke: var(--ref); stroke-width: 1.6; transition: stroke var(--dur-instant); }
	.ref-mark.near { stroke: var(--text); stroke-width: 2.4; }
	.ref-in:hover .ref-mark, .hit:focus-visible + .ref-mark { stroke: var(--text); }

	.dot { fill: var(--dot); stroke: var(--surface); stroke-width: 3; transition: r var(--dur-instant) var(--ease-out); }
	.dot.me { fill: var(--dot-me); }
	.focus { fill: none; stroke: var(--focus); stroke-width: 2.2; opacity: 0; transition: opacity var(--dur-instant); }
	.focus.on, .hit:focus-visible + .focus { opacity: 1; }

	.rings { opacity: 0; transform: scale(.85); pointer-events: none;
		transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out); }
	.rings.on { opacity: 1; transform: none; }
	.ring.far { fill: var(--accent); fill-opacity: .05; stroke: var(--accent); stroke-opacity: .45; stroke-dasharray: 3 5; }
	.ring.near { fill: var(--accent); fill-opacity: .07; stroke: var(--accent); stroke-opacity: .6; }
	.ring-cap { font-size: 12.5px; fill: var(--accent-ink); stroke: var(--quad); stroke-width: 3; paint-order: stroke; }

	.trail { opacity: 0; transition: opacity var(--dur-base) var(--ease-out); }
	.trail.on { opacity: 1; }
	.trail.faint { opacity: .25; }
	.trail line { stroke: var(--text-3); stroke-width: 1.4; stroke-dasharray: 4 4; }
	.trail circle { fill: var(--surface); stroke: var(--text-3); stroke-width: 1.4; }

	.mean { opacity: 0; transition: opacity var(--dur-base) var(--ease-out); }
	.mean.on { opacity: 1; }
	.mean path { stroke: var(--text-2); stroke-width: 2.2; stroke-linecap: round; }
	.mean circle { fill: none; stroke: var(--text-2); stroke-width: 1.4; }
	.mean text { fill: var(--text-2); font-weight: 650; stroke: var(--quad); stroke-width: 3.5; paint-order: stroke; }

	/* labels fade in once the marks have landed */
	.labels { opacity: 0; transition: opacity var(--dur-base) var(--ease-out); pointer-events: none; }
	.labels.on { opacity: 1; }
	.pt-label { fill: var(--text); font-weight: 650; stroke: var(--quad); stroke-width: 4; paint-order: stroke; stroke-linejoin: round; }
	.ref-label { fill: var(--text-2); font-weight: 500; stroke: var(--quad); stroke-width: 4; paint-order: stroke; stroke-linejoin: round; }
	.ref-label.near { fill: var(--text); font-weight: 650; }
	.pt-label.dim { opacity: .3; }
	.ref-label.dim { opacity: .35; }
</style>
