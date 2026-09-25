<!-- The questionnaire's front page: every theme, what is coming, and how far
     one has got in each — so the economy reads as a first theme rather than
     the whole test. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { session } from '$lib/session.svelte.js';
	import { PolitiQuiz } from '$lib/model.js';
	import { hasPolitiscales, fromMember } from '$lib/compass/model.js';
	import { ALL, openThemes, screensFor } from '$lib/quiz/flow.js';
	import { mine, startMine } from '$lib/quiz/answers.svelte.js';
	import SignedIn from '$lib/components/SignedIn.svelte';

	$effect(() => {
		if (session.me) startMine('server');
	});

	const me = $derived(session.me ? fromMember({ username: session.me.username, me: true, politiscales: session.me.profile.politiscales }) : null);
	const cards = $derived(
		[{ key: ALL }, ...PolitiQuiz.THEMES].map((t) => {
			const copy = t.key === ALL ? { name: L.allName, desc: L.allDesc(openThemes().map((o) => L.themes[o.key].name)) } : L.themes[t.key];
			if (t.planned) return { ...t, copy };
			const items = screensFor(t.key).filter((sc) => sc.kind === 'item');
			const done = items.filter((sc) => mine.answers[sc.item.id] !== undefined).length;
			return { ...t, copy, done, total: items.length };
		})
	);
</script>

<svelte:head><title>{L.tabQuiz} · Politiskel</title></svelte:head>

<SignedIn>
	<div class="quiz-view">
		<section class="quiz-card">
			<p class="eyebrow">{L.hubEyebrow}</p>
			<h2>{me && hasPolitiscales(me) ? L.quizIntroTitle(session.me.username) : L.nativeTitle(session.me.username)}</h2>
			<p class="lead">{L.hubLead}</p>
			<div class="theme-list">
				{#each cards as t (t.key)}
					<div class="theme-card" class:planned={t.planned} class:all={t.key === ALL}>
						<h3>{t.copy.name}</h3>
						<p>{t.copy.desc}</p>
						{#if t.planned}
							<span class="status">{L.hubPlanned}</span>
						{:else}
							<span class="status">{L.hubProgress(t.done, t.total)}</span>
							<a class="button go {t.done === t.total ? 'ghost' : 'primary'}" href="/questionnaire/{t.key}">
								{!t.done ? L.quizStart : t.done < t.total ? L.quizResume : L.quizReview}
							</a>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	</div>
</SignedIn>
