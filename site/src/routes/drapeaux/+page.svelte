<!-- The flags page, after the design: every symbol at full size and at the
     size of a group pill, the colours and what they stand for, each layout
     drawn by the same code as the profiles' flags, and what was left out. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { FLAG_ICONS, FLAG_ICON_CREDITS } from '$lib/flag/icons.js';
	import { FLAG_COLOURS, drawFlag } from '$lib/flag/flag.js';

	const F = L.flagsPage;
	const symbols = Object.keys(F.symbols)
		.filter((k) => FLAG_ICONS[k])
		.map((k) => ({
			k,
			name: F.symbols[k][0],
			meaning: F.symbols[k][1],
			credit: /drawn/.test(FLAG_ICON_CREDITS[k] || '') ? F.drawn : F.credit(FLAG_ICON_CREDITS[k]),
			paths: FLAG_ICONS[k].map((e) => (typeof e === 'string' ? { d: e } : e))
		}));
	const colours = Object.keys(F.colours).map((k) => ({ k, name: F.colours[k][0], meaning: F.colours[k][1], hex: FLAG_COLOURS[k] }));
	const S = (...ks) => ks.map((symbol) => ({ symbol }));
	const layouts = [
		['pale', { cols: ['red', 'white', 'green'], syms: S('scales') }],
		['triband', { cols: ['blue', 'white', 'blue'], syms: S('oak') }],
		['nordic', { cols: ['blue', 'white'], syms: S('shield', 'column') }],
		['royal', { cols: ['white'], syms: S('crown', 'column') }],
		['revolution', { cols: ['red', 'black'], syms: S('star') }],
		['diagonal', { cols: ['red'], syms: S('anarchy') }],
		['pall', { cols: ['red', 'purple', 'sky'], syms: S('rings', 'venus') }],
		['stripes', { cols: ['sky', 'gold'], syms: S('globe') }],
		['centred', { cols: ['red', 'navy', 'white'], syms: S('lorraine', 'wheat') }],
		['disc', { cols: ['red', 'gold'], syms: S('hammer') }]
	].map(([layout, spec]) => ({ name: F.layouts[layout][0], desc: F.layouts[layout][1], url: drawFlag({ layout, ...spec }).url }));
	const mods = [
		['rainbow', { layout: 'pale', cols: ['purple', 'green'], syms: S('torch'), rainbow: true }],
		['border', { layout: 'pale', cols: ['red', 'steel'], syms: S('tower'), border: true }]
	].map(([k, spec]) => ({ name: F.modifier(F.mods[k][0]), desc: F.mods[k][1], url: drawFlag(spec).url }));
</script>

<svelte:head><title>{L.navFlags} · Politiskel</title></svelte:head>

<div class="flags">
	<p class="eyebrow">{F.eyebrow}</p>
	<h1>{F.title}</h1>
	<p class="lead">{F.lead}</p>

	<h2>{F.symbolsTitle(symbols.length)}</h2>
	<p class="sub">{F.symbolsLead}</p>
	<div class="symbols">
		{#each symbols as s (s.k)}
			<figure>
				<div class="pair">
					<svg viewBox="0 0 512 512" width="64" height="64" role="img" aria-label={s.name}>
						{#each s.paths as p}<path d={p.d} fill-rule={p.rule || 'nonzero'} fill={p.knock ? 'var(--surface)' : 'currentColor'} />{/each}
					</svg>
					<svg class="small" viewBox="0 0 512 512" width="24" height="24" aria-hidden="true">
						{#each s.paths as p}<path d={p.d} fill-rule={p.rule || 'nonzero'} fill={p.knock ? 'var(--surface)' : 'currentColor'} />{/each}
					</svg>
				</div>
				<figcaption><b>{s.name}</b><span>{s.meaning}</span><small>{s.credit}</small></figcaption>
			</figure>
		{/each}
	</div>

	<h2>{F.coloursTitle}</h2>
	<p class="sub">{F.coloursLead}</p>
	<div class="colours">
		{#each colours as c (c.k)}
			<div class="colour"><span class="chip" style="background: {c.hex}"></span><span><b>{c.name}</b><span>{c.meaning}</span></span></div>
		{/each}
	</div>

	<h2>{F.layoutsTitle}</h2>
	<p class="sub">{F.layoutsLead}</p>
	<div class="layouts">
		{#each [...layouts, ...mods] as l (l.name)}
			<figure>
				<img src={l.url} alt={F.example(l.name)} width="150" height="100" />
				<figcaption><b>{l.name}</b><span>{l.desc}</span></figcaption>
			</figure>
		{/each}
	</div>

	<section class="aside">
		<h2>{F.asideTitle}</h2>
		<p>{F.aside}</p>
	</section>
</div>

<style>
	.flags { max-width: 1152px; margin: 0 auto; padding: 24px 0 32px; }
	.eyebrow { color: var(--accent-ink); }
	h1 { font-family: var(--font-display); font-size: clamp(32px, 4.4vw, 46px); line-height: 1.1; font-weight: 600; letter-spacing: -0.025em;
		margin: 10px 0 14px; max-width: 18em; text-wrap: balance; }
	.lead { margin: 0 0 36px; font-size: 18px; line-height: 1.55; color: var(--text-2); max-width: 42em; }
	h2 { font-family: var(--font-display); font-size: 26px; font-weight: 600; margin: 44px 0 6px; }
	h2:first-of-type { margin-top: 0; }
	.sub { margin: 0 0 18px; font-size: 15px; color: var(--text-2); }
	.symbols { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; }
	.symbols figure { margin: 0; padding: 16px 14px 14px; border-radius: var(--r-md); background: var(--surface); border: 1px solid var(--border);
		display: flex; flex-direction: column; gap: 10px; }
	.pair { display: flex; align-items: flex-end; justify-content: space-between; color: var(--text); }
	.pair .small { color: var(--text-2); }
	figcaption { line-height: 1.35; }
	figcaption b, figcaption span, figcaption small { display: block; }
	figcaption b { font-size: 15px; font-weight: 650; }
	figcaption span { font-size: 13.5px; color: var(--text-2); }
	figcaption small { font-size: 12px; color: var(--text-3); margin-top: 4px; }
	.colours { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
	.colour { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: var(--r-md); background: var(--surface);
		border: 1px solid var(--border); line-height: 1.3; }
	.colour b { display: block; font-size: 14.5px; font-weight: 650; }
	.colour span span { display: block; font-size: 13px; color: var(--text-2); }
	.chip { flex: none; width: 36px; height: 36px; border-radius: 8px; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .14); }
	.layouts { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
	.layouts figure { margin: 0; }
	.layouts img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 2; border-radius: 5px; box-shadow: 0 0 0 1px var(--border), var(--shadow-1); }
	.layouts figcaption { margin-top: 10px; line-height: 1.4; }
	.aside { margin-top: 44px; padding: 24px; border-radius: var(--r-lg); background: var(--surface-2); }
	.aside h2 { font-family: var(--font-sans); font-size: 18px; font-weight: 650; margin: 0 0 8px; }
	.aside p { margin: 0; font-size: 15px; line-height: 1.55; color: var(--text-2); max-width: 62em; }
	@media (max-width: 600px) {
		.symbols, .colours, .layouts { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
	}
</style>
