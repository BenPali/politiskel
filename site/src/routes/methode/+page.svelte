<!-- The method, after the design: read as an article, with a contents list
     that follows the reading. What depends on the data — which parties are
     estimated, the proximity thresholds of each country, the tie band — is
     computed from the tables, never written by hand. -->
<script>
	import { onMount } from 'svelte';
	import { L } from '$lib/i18n/fr.js';
	import { PolitiModel } from '$lib/model.js';
	import { COUNTRIES } from '$lib/compass/model.js';

	const M = L.methodPage;

	/* the parties sentence and the widest gap, for each section that needs them */
	const fr = COUNTRIES[0];
	const ches = fr.parties.filter((r) => r.src === 'ches');
	const est = fr.parties.filter((r) => r.src !== 'ches');
	const refsLine = !ches.length
		? L.methodRefsEstimated(fr.name, fr.parties.length, fr.why || '')
		: !est.length
			? L.methodRefsAll(fr.name, ches.length)
			: L.methodRefsMixed(fr.name, ches.length, est.length, est.map((r) => r.name).join(', '));
	const gap = PolitiModel.widestEconGap(fr.parties);
	const limits = COUNTRIES.map((c) => ({ name: c.name, ...PolitiModel.limitsFor(c.parties) }));
	const extra = {
		partis: [refsLine],
		distance: [gap ? L.methodGap(gap.lo.name, gap.hi.name, gap.d) : null, L.methodTie(limits[0].tie)].filter(Boolean)
	};

	/* the contents list marks the section being read */
	let current = $state(M.sections[0].id);
	onMount(() => {
		const seen = new IntersectionObserver(
			(entries) => {
				for (const e of entries) if (e.isIntersecting) current = e.target.id;
			},
			{ rootMargin: '-20% 0px -70% 0px' }
		);
		for (const s of M.sections) {
			const el = document.getElementById(s.id);
			if (el) seen.observe(el);
		}
		return () => seen.disconnect();
	});
</script>

<svelte:head><title>{L.navMethod} · Politiskel</title></svelte:head>

<div class="method">
	<nav aria-label={M.toc}>
		<p class="eyebrow">{M.toc}</p>
		<ol>
			{#each M.sections as s (s.id)}
				<li><a href="#{s.id}" aria-current={current === s.id ? 'true' : undefined}>{s.title}</a></li>
			{/each}
		</ol>
	</nav>
	<article>
		<p class="eyebrow kicker">{M.eyebrow}</p>
		<h1>{M.title}</h1>
		<p class="standfirst">{M.standfirst}</p>
		{#each M.sections as s (s.id)}
			<section id={s.id}>
				<h2>{s.title}</h2>
				{#each s.paras as p}<p>{@html p}</p>{/each}
				{#each extra[s.id] || [] as p}<p>{p}</p>{/each}
				{#if s.quote}
					<blockquote>{s.quote[0]}<footer>{@html s.quote[1]}</footer></blockquote>
				{/if}
				{#if s.id === 'distance'}
					<figure>
						<table>
							<caption>{M.limitsCaption}</caption>
							<thead><tr><th scope="col">{M.colCountry}</th><th scope="col">{M.colNear}</th><th scope="col">{M.colFar}</th><th scope="col">{M.colTie}</th></tr></thead>
							<tbody>
								{#each limits as l (l.name)}
									<tr><td>{l.name}</td><td>{M.upTo(l.near)}</td><td>{M.upTo(l.far)}</td><td>{M.under(l.tie)}</td></tr>
								{/each}
							</tbody>
						</table>
					</figure>
				{/if}
			</section>
		{/each}
		<aside>{M.aside} <a href="https://github.com/BenPali/politiskel">{M.source}</a></aside>
	</article>
</div>

<style>
	.method { max-width: 1040px; margin: 0 auto; padding: 24px 0 40px; display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 56px; }
	nav { position: sticky; top: 96px; align-self: start; font-size: 14.5px; }
	nav .eyebrow { margin: 0 0 12px; }
	nav ol { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; border-left: 2px solid var(--border); }
	nav a { display: block; padding: 8px 0 8px 14px; margin-left: -2px; border-left: 2px solid transparent; color: var(--text-2);
		font-weight: 500; text-decoration: none; line-height: 1.35; transition: border-color var(--dur-instant), color var(--dur-instant); }
	nav a:hover { color: var(--text); }
	nav a[aria-current] { border-left-color: var(--accent); color: var(--text); font-weight: 650; }
	article { max-width: 40rem; font-family: var(--font-text); font-size: 18.5px; line-height: var(--lh-article, 1.68); color: var(--text); }
	.kicker { color: var(--accent-ink); }
	h1 { font-family: var(--font-display); font-size: clamp(34px, 4.4vw, 48px); line-height: 1.08; font-weight: 600; letter-spacing: -0.025em;
		margin: 10px 0 18px; text-wrap: balance; }
	.standfirst { font-size: 21px; line-height: 1.5; color: var(--text-2); margin: 0 0 36px; font-style: italic; }
	section { scroll-margin-top: 96px; }
	h2 { font-family: var(--font-display); font-size: 28px; line-height: 1.2; font-weight: 600; letter-spacing: -0.015em; margin: 44px 0 14px; }
	section:first-of-type h2 { margin-top: 0; }
	p { margin: 0 0 18px; text-wrap: pretty; hyphens: auto; }
	article :global(code) { font-size: .86em; padding: 1px 5px; border-radius: 4px; background: var(--surface-2); }
	blockquote { margin: 26px 0; padding: 4px 0 4px 22px; border-left: 3px solid var(--accent); font-size: 21px; line-height: 1.45; font-style: italic; }
	blockquote footer { font-family: var(--font-sans); font-style: normal; font-size: 13.5px; color: var(--text-3); margin-top: 8px; }
	figure { margin: 24px 0 8px; font-family: var(--font-sans); }
	table { width: 100%; border-collapse: collapse; font-size: 15px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-md); overflow: hidden; }
	caption { text-align: left; font-size: 13.5px; color: var(--text-3); padding: 0 0 8px; }
	th { text-align: left; padding: 10px 14px; font-size: 12px; letter-spacing: var(--tracking-caps); text-transform: uppercase; color: var(--text-3);
		border-bottom: 1px solid var(--border); white-space: normal; }
	td { padding: 10px 14px; border-top: 1px solid var(--border); font-variant-numeric: tabular-nums; white-space: normal; }
	td:first-child { font-weight: 650; }
	aside { margin-top: 40px; padding: 18px 20px; border-radius: var(--r-md); background: var(--pop-soft); font-family: var(--font-sans);
		font-size: 15px; line-height: 1.55; color: var(--text-2); }
	aside a { color: var(--accent-ink); font-weight: 650; }
	@media (max-width: 860px) {
		.method { grid-template-columns: minmax(0, 1fr); gap: 0; }
		nav { display: none; }
		article { font-size: 17px; }
		h2 { font-size: 24px; }
		.standfirst { font-size: 19px; }
	}
</style>
