<!-- Trying without an account, after the design: a PolitiScales result or
     the questionnaire, both kept in this browser only. The compass, the
     profile sheet and the flag then work on that trial profile, alone. -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { L } from '$lib/i18n/fr.js';
	import { session } from '$lib/session.svelte.js';
	import { board } from '$lib/compass/board.svelte.js';
	import { PolitiQuiz } from '$lib/model.js';
	import { screensFor } from '$lib/quiz/flow.js';
	import { readGuest, updateGuest, writeGuest } from '$lib/quiz/answers.svelte.js';
	import CaptureImport from '$lib/components/CaptureImport.svelte';

	let guest = $state(null);
	let notice = $state('');
	onMount(() => (guest = readGuest()));

	/* a member has no use for the trial: their own questionnaire is there */
	$effect(() => {
		if (session.me) goto('/questionnaire', { replaceState: true });
	});

	const themes = PolitiQuiz.THEMES.filter((t) => !t.planned).map((t) => ({
		key: t.key,
		name: L.themes[t.key].name,
		count: screensFor(t.key).length
	}));

	function start(key) {
		updateGuest({});
		goto('/questionnaire/' + key);
	}
	async function saveCapture({ politiscales, flag }) {
		updateGuest({ politiscales, flag });
		guest = readGuest();
		board.loaded = false;
		return null;
	}
	function forget() {
		writeGuest(null);
		guest = null;
		board.loaded = false;
		notice = L.guestForgotten;
	}
	const hasAny = $derived(!!guest && (!!guest.politiscales || Object.keys(guest.answers).length > 0));
</script>

<svelte:head><title>{L.navTry} · Politiskel</title></svelte:head>

<div class="trial">
	<div class="banner" role="status">
		<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="7" width="11" height="7.5" rx="2" fill="currentColor" /><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>
		<span>{L.guestBanner}</span>
		<a href="/inscription">{L.navSignUp}</a>
	</div>
	<h1>{L.guestTitle}</h1>
	<p class="lead">{L.guestLead}</p>
	{#if notice}<p class="status" role="status">{notice}</p>{/if}
	{#if hasAny}
		<div class="ready">
			<a class="button primary" href="/boussole">{L.guestSeeCompass}</a>
			<button type="button" class="skip" onclick={forget}>{L.guestForget}</button>
		</div>
	{/if}
	<div class="ways">
		<section class="card">
			<h2>{L.guestFromPs}</h2>
			<p class="note">{L.guestFromPsLead}</p>
			{#key guest === null}
				<CaptureImport initial={guest?.politiscales} onsave={saveCapture} />
			{/key}
		</section>
		<section class="card">
			<h2>{L.guestFromQuiz}</h2>
			<p class="note">{L.guestFromQuizLead}</p>
			{#each themes as t (t.key)}
				<button type="button" class="theme" onclick={() => start(t.key)}>
					<span><b>{t.name}</b><small>{L.guestThemeMeta(t.count)}</small></span>
					<span aria-hidden="true">→</span>
				</button>
			{/each}
		</section>
	</div>
	<p class="later">{L.guestLater}</p>
</div>

<style>
	.trial { max-width: 1040px; margin: 0 auto; padding: 8px 0 32px; }
	.banner { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px 16px; border-radius: var(--r-md); background: var(--pop-soft);
		color: var(--text-2); font-size: 14.5px; margin-bottom: 28px; }
	.banner svg { color: var(--accent); flex: none; }
	.banner a { margin-left: auto; color: var(--accent-ink); font-weight: 650; }
	h1 { font-family: var(--font-display); font-size: clamp(30px, 4vw, 42px); font-weight: 600; letter-spacing: -0.02em; margin: 0 0 10px; }
	.lead { margin: 0 0 24px; font-size: 17px; color: var(--text-2); max-width: 60ch; }
	.ready { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 24px; }
	.ways { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; align-items: start; }
	.card + .card { margin-top: 0; }
	h2 { font-family: var(--font-display); font-size: 22px; font-weight: 600; margin: 0 0 6px; }
	.note { margin: 0 0 16px; font-size: 15px; color: var(--text-2); }
	.theme { width: 100%; justify-content: space-between; text-align: left; min-height: 64px; padding: 12px 16px; margin-bottom: 10px;
		background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); border-radius: var(--r-md); }
	.theme:hover { border-color: var(--accent); background: var(--accent-soft); }
	.theme b { display: block; font-size: 16px; }
	.theme small { display: block; font-size: 13px; color: var(--text-3); font-weight: 400; }
	.later { margin-top: 20px; color: var(--text-3); font-size: 14px; }
	.status { margin-bottom: 16px; }
	@media (max-width: 860px) { .ways { grid-template-columns: 1fr; } }
</style>
