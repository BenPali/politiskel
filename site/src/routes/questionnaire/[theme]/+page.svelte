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
	import { ALL, isFlow, flowThemes, screensFor, screenKey, scoreOf, openThemes, progressOf } from '$lib/quiz/flow.js';
	import { mine, startMine, setAnswer, eraseKeys, flush, guestMember } from '$lib/quiz/answers.svelte.js';
	import SignedIn from '$lib/components/SignedIn.svelte';
	import Question from '$lib/components/Question.svelte';
	import JourneyStrip from '$lib/components/JourneyStrip.svelte';
	import { signed } from '$lib/format.js';

	const theme = $derived(page.params.theme);
	const screens = $derived(isFlow(theme) ? screensFor(theme) : []);
	const n = $derived(screens.length);
	const step = $derived(Math.max(0, Math.min(n + 1, Number(page.url.searchParams.get('q')) || 0)));
	const sc = $derived(step >= 1 && step <= n ? screens[step - 1] : null);
	const themeName = (k) => (k === ALL ? L.allName : L.themes[k].name);

	let started = false;
	$effect(() => {
		if (session.ready && !started) {
			startMine(session.me ? 'server' : 'guest');
			started = true;
		}
	});
	onMount(readPrefs);
	/* an answer still waiting reaches the server before the page changes */
	beforeNavigate(({ to }) => {
		clearTimeout(advance);
		/* moving between the questions of this flow is not leaving it: the
		   half-second batch stays one request */
		if (to?.url.pathname === page.url.pathname) return;
		flush();
	});

	const me = $derived(
		session.me
			? fromMember({ username: session.me.username, me: true, flag: session.me.profile.flag, politiscales: session.me.profile.politiscales, answers: mine.answers })
			: session.ready
				? fromMember({ ...(guestMember() || { username: L.guestName, me: true }), answers: mine.answers })
				: null
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
	/* the direction of the last move, for the card to slide the right way */
	let dir = $state(1);
	let last = 0;
	$effect.pre(() => {
		dir = step >= last ? 1 : -1;
		last = step;
	});

	const progress = $derived(progressOf(theme, mine.answers));
	const salienceLevels = PolitiQuiz.SCALES.salience.fr;
	const val = (v) => (v === null || v === undefined ? '—' : signed(v));
	/* one block per theme of the flow: its axis journey, then its readings as cards */
	const results = $derived.by(() => {
		if (!c) return [];
		return flowThemes(theme).map((k) => {
			const t = PolitiQuiz.THEMES.find((x) => x.key === k);
			const q = scoreOf(c, k);
			const name = L.themes[k].name;
			if (!q || q[t.axis] === null) return { key: k, name, none: true };
			const axisNote = c.native || !c.from ? L.resultNativeNote : L.resultWasPs(signed(c.from[t.axis]));
			const cards = [{ label: L.readingAxis[t.axis], value: val(q[t.axis]), note: axisNote }];
			if (k === 'economy')
				for (const r of ['protectionism', 'class', 'conflict', 'labour'])
					cards.push({
						label: L.bands.label[r],
						value: r === 'class' && q.class === null && q.n.class ? '—' : val(q[r]),
						note: r === 'class' && q.class === null && q.n.class ? L.readingClassIncomplete(q.n.class) : L.bands.hint[r]
					});
			else for (const d of t.dims) cards.push({ label: L.dims[d], value: val(q.dims[d]), note: L.dimNote });
			const salience =
				q.salience !== null && q.salienceAfter !== null
					? L.salienceMoved(salienceLevels[q.salience], salienceLevels[q.salienceAfter], q.salienceAfter - q.salience)
					: q.salience !== null || q.salienceAfter !== null
						? L.salienceOf(salienceLevels[q.salience ?? q.salienceAfter])
						: null;
			return { key: k, name, axis: t.axis, cards, salience };
		});
	});
	/* the next open theme not yet answered, to go on with */
	const nextTheme = $derived(
		theme === ALL ? null : openThemes().find((t) => t.key !== theme && screensFor(t.key).some((s) => s.kind === 'item' && mine.answers[screenKey(s)] === undefined)) || null
	);

	const anyStarted = $derived(screens.some((s) => mine.answers[screenKey(s)] !== undefined));
	function erase() {
		eraseKeys(screens.map(screenKey));
		goStep(0);
	}
</script>

<svelte:window onkeydown={onkey} />
<svelte:head><title>{isFlow(theme) ? themeName(theme) + ' · ' : ''}{L.tabQuiz} · Politiskel</title></svelte:head>

<SignedIn guest>
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
				{#if step <= n}
					<section class="quiz-card screen" style="--dx: {dir * 20}px">
						{#if step === 0}
							<p class="eyebrow">{L.hubEyebrow} · {themeName(theme)}</p>
							<h2>{native ? L.nativeTitle(me.alias) : L.quizIntroTitle(me.alias)}</h2>
							<p class="lead">
								{theme === ALL ? L.allLead(openThemes().length, PolitiQuiz.THEMES.length) : native ? L.themes[theme].leadNative : L.themes[theme].lead}
							</p>
							<p class="hint">{L.quizHint}</p>
							<p class="q-src">{L.quizIntroMeta(screens.filter((s) => s.kind === 'item').length, screens.filter((s) => s.kind === 'salience').length / 2)}</p>
						{:else if question}
							{#if theme === ALL && sc.kind === 'salience'}<p class="eyebrow">{L.themes[sc.theme].name}</p>{/if}
							<Question q={question} value={sc.kind === 'salience' && sc.after && mine.answers[question.key] === undefined ? undefined : mine.answers[question.key]} onanswer={answer} />
						{/if}
					</section>
				{:else}
					<div class="result">
						<div class="result-head">
							<p class="eyebrow">{L.resultCount(themeName(theme), progress.done, progress.total)}</p>
							<h1>{c.native ? L.resultTitleNative : L.resultTitle}</h1>
							{#if flowThemes(theme).length === 1}
								{@const axis = PolitiQuiz.THEMES.find((t) => t.key === theme).axis}
								<p class="lead">{c.native ? L.resultLeadNative : L.resultLead[axis]}</p>
							{/if}
						</div>
						{#each results as r (r.key)}
							{#if flowThemes(theme).length > 1}<h2 class="theme-h">{r.name}</h2>{/if}
							{#if r.none}
								<p class="lead">{L.resultNoAxis(r.name, c.native)}</p>
							{:else}
								<JourneyStrip {c} axis={r.axis} {country} />
								<div class="result-cards">
									{#each r.cards as card, i (card.label)}
										<div class="reading" style="--i: {i + 1}">
											<div class="l">{card.label}</div>
											<div class="v">{card.value}</div>
											<div class="n">{card.note}</div>
										</div>
									{/each}
								</div>
								{#if r.salience}<p class="hint">{r.salience}</p>{/if}
							{/if}
						{/each}
					</div>
				{/if}
			{/key}

			<div class="quiz-nav">
				{#if step === 0}
					{#if anyStarted}
						<button type="button" class="ghost" onclick={() => goStep(n + 1)}>{L.seeResult}</button>
					{:else}
						<span></span>
					{/if}
					<button type="button" class="primary" onclick={() => goStep(1)}>{anyStarted ? L.quizResume : L.quizStart}</button>
				{:else if sc}
					<button type="button" class="ghost" onclick={() => goStep(step - 1)}>{L.quizPrev}</button>
					<button type="button" class="skip" onclick={() => goStep(step + 1)}>{L.quizSkip}</button>
					<button type="button" class="primary" onclick={() => goStep(step + 1)}>{step === n ? L.quizSeeResult : L.quizNext}</button>
				{:else}
					<span class="end-actions">
						<a class="button primary" href="/boussole/{encodeURIComponent(me.alias)}">{L.backToCompass}</a>
						{#if nextTheme}
							<a class="button ghost" href="/questionnaire/{nextTheme.key}">{L.nextTheme(L.themes[nextTheme.key].name)}</a>
						{:else}
							<a class="button ghost" href="/questionnaire">{L.otherThemes}</a>
						{/if}
						<button type="button" class="skip" onclick={() => goStep(1)}>{L.quizReview}</button>
					</span>
					<button type="button" class="skip" onclick={erase}>{L.quizErase}</button>
				{/if}
			</div>
			{#if sc}<p class="quiz-keys">{L.quizKeys}</p>{/if}
			{#if mine.status}<p class="status">{mine.status}</p>{/if}
		{/if}
	</div>
</SignedIn>

<style>
	.end-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
	/* each screen slides in from the side it comes from; the tokens still it under reduced motion */
	.screen { animation: slide-in var(--dur-base) var(--ease-out) both; }
	@keyframes slide-in { from { opacity: 0; transform: translateX(var(--dx)); } }
	.result { display: flex; flex-direction: column; gap: 18px; }
	.result-head { animation: fade var(--dur-base) var(--ease-out) both; }
	@keyframes fade { from { opacity: 0; } }
	.result h1 { font-family: var(--font-display); font-size: clamp(28px, 4.4vw, 42px); line-height: 1.12; font-weight: 600; letter-spacing: -0.02em;
		margin: 8px 0 10px; text-wrap: balance; }
	.result .lead { margin: 0; font-size: var(--fs-lg); color: var(--text-2); max-width: 58ch; }
	.theme-h { font-family: var(--font-display); font-size: 22px; font-weight: 600; margin: 12px 0 0; }
	.result-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
	.reading { padding: 14px 16px; border-radius: var(--r-md); background: var(--surface); border: 1px solid var(--border);
		animation: card-in var(--dur-base) var(--ease-out) both; animation-delay: calc(var(--stagger) * var(--i) + 120ms); }
	@keyframes card-in { from { opacity: 0; transform: translateY(8px); } }
	.reading .l { font-size: 13px; color: var(--text-2); font-weight: 600; }
	.reading .v { font-size: 24px; font-weight: 650; font-variant-numeric: tabular-nums; margin: 2px 0; }
	.reading .n { font-size: 12.5px; color: var(--text-3); line-height: 1.35; }
</style>
