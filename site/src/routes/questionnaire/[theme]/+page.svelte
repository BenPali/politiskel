<!-- A flow, one screen per address (?q=1, 2 …): the intro at 0, then each
     question, then the result. Answering moves on after a beat; the
     keyboard answers (digits) and moves (arrows, Enter). -->
<script>
	import { onMount } from 'svelte';
	import { goto, beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { L } from '$lib/i18n/fr.js';
	import { session } from '$lib/session.svelte.js';
	import { PolitiQuiz } from '$lib/model.js';
	import { coords, hasPolitiscales, fromMember, COUNTRIES } from '$lib/compass/model.js';
	import { board, readPrefs } from '$lib/compass/board.svelte.js';
	import { ALL, isFlow, flowThemes, screensFor, screenKey, scoreOf, openThemes } from '$lib/quiz/flow.js';
	import { mine, startMine, setAnswer, eraseKeys, flush } from '$lib/quiz/answers.svelte.js';
	import SignedIn from '$lib/components/SignedIn.svelte';
	import Question from '$lib/components/Question.svelte';
	import JourneyStrip from '$lib/components/JourneyStrip.svelte';
	import Readings from '$lib/components/Readings.svelte';

	const theme = $derived(page.params.theme);
	const screens = $derived(isFlow(theme) ? screensFor(theme) : []);
	const n = $derived(screens.length);
	const step = $derived(Math.max(0, Math.min(n + 1, Number(page.url.searchParams.get('q')) || 0)));
	const sc = $derived(step >= 1 && step <= n ? screens[step - 1] : null);
	const themeName = (k) => (k === ALL ? L.allName : L.themes[k].name);

	let started = false;
	$effect(() => {
		if (session.me && !started) {
			startMine('server');
			started = true;
		}
	});
	onMount(readPrefs);
	/* an answer still waiting reaches the server before the page changes */
	beforeNavigate(() => {
		clearTimeout(advance);
		flush();
	});

	const me = $derived(
		session.me ? fromMember({ username: session.me.username, me: true, flag: session.me.profile.flag, politiscales: session.me.profile.politiscales, answers: mine.answers }) : null
	);
	const native = $derived(me ? !hasPolitiscales(me) : false);
	const c = $derived(me ? coords(me) : null);
	const country = $derived(COUNTRIES.find((x) => x.code === board.country) || COUNTRIES[0]);

	const question = $derived.by(() => {
		if (!sc) return null;
		if (sc.kind === 'salience') {
			const copy = L.themes[sc.theme];
			return { key: screenKey(sc), scale: PolitiQuiz.SCALES.salience, text: sc.after ? copy.salienceAfter : copy.salience, salience: true };
		}
		const item = sc.item;
		return { key: item.id, scale: PolitiQuiz.SCALES[item.scale], text: item.fr, stem: item.ask, left: item.left, right: item.right, note: item.note, src: item.src, translated: item.translated };
	});

	let advance = null;
	function goStep(s) {
		clearTimeout(advance);
		goto('?q=' + Math.max(0, Math.min(n + 1, s)));
	}
	function answer(v) {
		setAnswer(question.key, v);
		clearTimeout(advance);
		advance = setTimeout(() => goStep(step + 1), 260);
	}
	function onkey(e) {
		if (!n || e.altKey || e.ctrlKey || e.metaKey) return;
		if (e.key === 'ArrowRight' || (e.key === 'Enter' && !e.target.closest('button, a'))) {
			e.preventDefault();
			goStep(step + 1);
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			goStep(step - 1);
		} else if (/^[0-9]$/.test(e.key) && question) {
			const input = document.querySelector('.quiz-card .choice[data-key="' + e.key + '"] input');
			if (input) input.click();
		}
	}
	const anyStarted = $derived(screens.some((s) => mine.answers[screenKey(s)] !== undefined));
	function erase() {
		eraseKeys(screens.map(screenKey));
		goStep(0);
	}
</script>

<svelte:window onkeydown={onkey} />
<svelte:head><title>{isFlow(theme) ? themeName(theme) + ' · ' : ''}{L.tabQuiz} · Politiskel</title></svelte:head>

<SignedIn>
	<div class="quiz-view">
		{#if !isFlow(theme)}
			<section class="quiz-card"><p class="lead">{L.notFoundLead}</p><a class="button ghost" href="/questionnaire">{L.backToThemes}</a></section>
		{:else}
			<div class="quiz-top">
				<a href="/questionnaire">{L.backToThemes}</a>
				<span class="theme-name">{themeName(theme)}</span>
				{#if sc}
					<div class="progress"><div style="width: {Math.round((100 * step) / n)}%"></div></div>
					<span class="quiz-count">{L.quizCount(step, n)}</span>
				{/if}
							</div>

			{#key step}
				<section class="quiz-card screen">
					{#if step === 0}
						<p class="eyebrow">{L.hubEyebrow} · {themeName(theme)}</p>
						<h2>{native ? L.nativeTitle(session.me.username) : L.quizIntroTitle(session.me.username)}</h2>
						<p class="lead">
							{theme === ALL ? L.allLead(openThemes().length, PolitiQuiz.THEMES.length) : native ? L.themes[theme].leadNative : L.themes[theme].lead}
						</p>
						<p class="hint">{L.quizHint}</p>
						<p class="q-src">{L.quizIntroMeta(screens.filter((s) => s.kind === 'item').length, screens.filter((s) => s.kind === 'salience').length / 2)}</p>
					{:else if question}
						{#if theme === ALL && sc.kind === 'salience'}<p class="eyebrow">{L.themes[sc.theme].name}</p>{/if}
						<Question q={question} value={sc.kind === 'salience' && sc.after && mine.answers[question.key] === undefined ? undefined : mine.answers[question.key]} onanswer={answer} />
					{:else}
						<p class="eyebrow">{L.resultEyebrow(themeName(theme))}</p>
						<h2>{c.native ? L.resultTitleNative : L.resultTitle}</h2>
						{#each flowThemes(theme) as k}
							{@const axis = PolitiQuiz.THEMES.find((t) => t.key === k).axis}
							{@const score = scoreOf(c, k)}
							{#if flowThemes(theme).length > 1}<p class="eyebrow">{L.themes[k].name}</p>{/if}
							{#if !score || score[axis] === null}
								<p class="lead">{L.resultNoAxis(L.themes[k].name, c.native)}</p>
							{:else}
								<JourneyStrip {c} {axis} {country} />
							{/if}
						{/each}
						{#if c.quiz}<Readings {c} {country} keys={flowThemes(theme)} />{/if}
					{/if}
				</section>
			{/key}

			<div class="quiz-nav">
				{#if step === 0}
					<span></span>
					<button type="button" class="primary" onclick={() => goStep(1)}>{anyStarted ? L.quizResume : L.quizStart}</button>
				{:else if sc}
					<button type="button" class="ghost" onclick={() => goStep(step - 1)}>{L.quizPrev}</button>
					<button type="button" class="skip" onclick={() => goStep(step + 1)}>{L.quizSkip}</button>
					<button type="button" class="primary" onclick={() => goStep(step + 1)}>{step === n ? L.quizSeeResult : L.quizNext}</button>
				{:else}
					<button type="button" class="skip" onclick={erase}>{L.quizErase}</button>
					<span class="end-actions">
						<button type="button" class="ghost" onclick={() => goStep(1)}>{L.quizReview}</button>
						<a class="button ghost" href="/questionnaire">{L.otherThemes}</a>
						<a class="button primary" href="/boussole/{encodeURIComponent(session.me.username)}">{L.backToCompass}</a>
					</span>
				{/if}
			</div>
			{#if sc}<p class="quiz-keys">{L.quizKeys}</p>{/if}
			{#if mine.status}<p class="status">{mine.status}</p>{/if}
		{/if}
	</div>
</SignedIn>

<style>
	.end-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
	/* each screen arrives with a short rise; nothing moves when reduced motion is asked */
	.screen { animation: rise 0.22s ease-out both; }
	@keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
	@media (prefers-reduced-motion: reduce) { .screen { animation: none; } }
</style>
