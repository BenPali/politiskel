<!-- The questionnaire's front page, after the design: every theme with how
     far one has got in it, then what is coming — so the economy reads as a
     first theme rather than the whole test. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { session } from '$lib/session.svelte.js';
	import { PolitiQuiz } from '$lib/model.js';
	import { ALL, openThemes, screensFor } from '$lib/quiz/flow.js';
	import { mine, startMine } from '$lib/quiz/answers.svelte.js';
	import SignedIn from '$lib/components/SignedIn.svelte';

	$effect(() => {
		if (session.ready) startMine(session.me ? 'server' : 'guest');
	});

	const cards = $derived(
		[{ key: ALL }, ...PolitiQuiz.THEMES.filter((t) => !t.planned)].map((t) => {
			const copy = t.key === ALL ? { name: L.allName, desc: L.allDesc(openThemes().map((o) => L.themes[o.key].name)) } : L.themes[t.key];
			const items = screensFor(t.key).filter((sc) => sc.kind === 'item');
			const done = items.filter((sc) => mine.answers[sc.item.id] !== undefined).length;
			return { key: t.key, copy, done, total: items.length };
		})
	);
	const planned = $derived(PolitiQuiz.THEMES.filter((t) => t.planned).map((t) => ({ key: t.key, copy: L.themes[t.key] })));
</script>

<svelte:head><title>{L.tabQuiz} · Politiskel</title></svelte:head>

<SignedIn guest>
	<div class="hub">
		<p class="eyebrow">{L.hubEyebrow}</p>
		<h1>{L.hubTitle}</h1>
		<p class="lead">{L.hubLeadShort}</p>
		<div class="sources">
			<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="2.5" width="14" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8" /><rect x="6" y="6.5" width="8" height="1.8" rx=".9" fill="currentColor" /><rect x="6" y="10" width="8" height="1.8" rx=".9" fill="currentColor" /><rect x="6" y="13.5" width="5" height="1.8" rx=".9" fill="currentColor" /></svg>
			<span>{L.hubSources} <a href="/methode">{L.hubMethod}</a></span>
		</div>
		<div class="themes">
			{#each cards as t (t.key)}
				<article class="theme">
					<div class="text">
						<h2>{t.copy.name}</h2>
						<p>{t.copy.desc}</p>
						<div class="meter">
							<span class="bar" class:none={!t.done}><span style="transform: scaleX({t.total ? t.done / t.total : 0})"></span></span>
							<span>{L.hubProgress(t.done, t.total)}</span>
						</div>
					</div>
					<a class="button {t.done === t.total ? 'ghost' : 'primary'}" href="/questionnaire/{t.key}">
						{!t.done ? L.quizStart : t.done < t.total ? L.quizResume : L.quizReview}
					</a>
				</article>
			{/each}
		</div>
		{#if planned.length}
			<h2 class="soon">{L.hubPlanned}</h2>
			<div class="planned">
				{#each planned as t (t.key)}
					<article><h3>{t.copy.name}</h3><p>{t.copy.desc}</p></article>
				{/each}
			</div>
		{/if}
	</div>
</SignedIn>

<style>
	.hub { max-width: 800px; margin: 0 auto; padding: 16px 0 24px; }
	h1 { font-family: var(--font-display); font-size: clamp(28px, 5vw, 44px); line-height: 1.12; font-weight: 600; letter-spacing: -0.02em;
		margin: 8px 0 14px; text-wrap: balance; }
	.lead { margin: 0 0 20px; font-size: var(--fs-lg); line-height: var(--lh-body); color: var(--text-2); max-width: 60ch; }
	.sources { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: var(--r-md); background: var(--pop-soft);
		color: var(--text-2); font-size: 14.5px; line-height: 1.5; margin-bottom: 28px; }
	.sources svg { flex: none; margin-top: 1px; color: var(--accent); }
	.sources a { color: var(--accent-ink); font-weight: 650; }
	.themes { display: flex; flex-direction: column; gap: 14px; }
	.theme { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 28px; padding: 22px 24px; border-radius: var(--r-lg);
		background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-1);
		transition: transform var(--dur-instant) var(--ease-out), box-shadow var(--dur-instant); }
	.theme:hover { transform: translateY(-2px); box-shadow: var(--shadow-2); }
	.text { flex: 1 1 300px; min-width: 0; }
	.theme h2 { font-family: var(--font-display); font-size: 24px; font-weight: 600; margin: 0 0 6px; letter-spacing: -0.01em; }
	.theme p { margin: 0 0 12px; font-size: 15px; line-height: 1.5; color: var(--text-2); }
	.meter { display: flex; align-items: center; gap: 12px; font-size: 13.5px; color: var(--text-3); }
	.bar { width: 120px; height: 6px; border-radius: 3px; background: var(--surface-sunk); overflow: hidden; }
	.bar.none { opacity: .6; }
	.bar span { display: block; height: 100%; width: 100%; background: var(--accent); transform-origin: left; }
	.theme .button { height: 48px; padding: 0 22px; font-size: 15.5px; }
	.soon { font-family: var(--font-sans); font-size: 13px; letter-spacing: var(--tracking-caps); text-transform: uppercase; color: var(--text-3);
		font-weight: 650; margin: 32px 0 12px; }
	.planned { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
	.planned article { padding: 16px 18px; border-radius: var(--r-lg); border: 1.5px dashed var(--border-strong); }
	.planned h3 { font-family: var(--font-sans); font-size: 16px; font-weight: 650; margin: 0 0 4px; color: var(--text-2); text-transform: none; letter-spacing: 0; }
	.planned p { margin: 0; font-size: 14px; line-height: 1.45; color: var(--text-3); }
</style>
