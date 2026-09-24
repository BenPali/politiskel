<!-- Home: what Politiskel is, and the ways in. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { session } from '$lib/session.svelte.js';
</script>

<svelte:head><title>Politiskel</title></svelte:head>

<section class="home">
	<h1>{L.homeTitle}</h1>
	<p class="lead">{L.homeLead}</p>
	<div class="actions">
		{#if session.me}
			<p class="status">{L.homeSignedIn(session.me.username)}</p>
			<a class="button primary" href="/boussole">{L.seeOnCompass}</a>
			<a class="button ghost" href="/questionnaire">{L.tabQuiz}</a>
		{:else}
			<a class="button primary" href="/inscription">{L.navSignUp}</a>
			<a class="button ghost" href="/connexion">{L.navSignIn}</a>
			<a class="button ghost" href="/essai">{L.guestTry}</a>
		{/if}
	</div>
	<div class="points">
		{#each L.homePoints as [title, text]}
			<article class="card">
				<h2>{title}</h2>
				<p>{text}</p>
			</article>
		{/each}
	</div>
</section>

<style>
	.home { max-width: 880px; margin: 24px auto 0; }
	.home h1 { font-size: 2rem; letter-spacing: -0.02em; margin: 0 0 12px; }
	.lead { font-size: 1.02rem; color: var(--text-2); max-width: 68ch; }
	.actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin: 20px 0 32px; }
	.actions .status { margin: 0 8px 0 0; color: var(--text-2); }
	.points { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
	.points h2 { font-size: 0.98rem; margin: 0 0 6px; }
	.points p { margin: 0; color: var(--text-2); }
</style>
