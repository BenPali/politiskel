<!-- Every page's frame: the header, the navigation, the page, the footer.
     The session is asked for once, here; pages read it from the shared state. -->
<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { L } from '$lib/i18n/fr.js';
	import { session, refresh } from '$lib/session.svelte.js';
	import Masthead from '$lib/components/Masthead.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';

	let { children } = $props();

	onMount(refresh);

	const tabs = $derived(
		session.me
			? [
					{ href: '/boussole', label: L.tabCompass },
					{ href: '/questionnaire', label: L.tabQuiz },
					{ href: '/groupes', label: L.tabGroups },
					{ href: '/compte', label: L.tabAccount }
				]
			: [
					{ href: '/', label: L.navHome },
					{ href: '/essai', label: L.navTry },
					{ href: '/methode', label: L.navMethod },
					{ href: '/drapeaux', label: L.navFlags }
				]
	);
	const here = (href) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname === href || page.url.pathname.startsWith(href + '/');
</script>

<div class="wrap">
	<Masthead />
	<nav class="tabs" aria-label="Sections">
		{#each tabs as t (t.href)}
			<a href={t.href} class:on={here(t.href)} aria-current={here(t.href) ? 'page' : undefined}>{t.label}</a>
		{/each}
		<span class="me">
			{#if session.me}
				{session.me.username}
			{:else if session.ready}
				<a href="/connexion" class:on={here('/connexion')}>{L.navSignIn}</a>
				<a href="/inscription" class="button primary">{L.navSignUp}</a>
			{/if}
		</span>
	</nav>
	<main>
		{@render children()}
	</main>
	<SiteFooter />
</div>

<style>
	.tabs .me { display: inline-flex; align-items: center; gap: 10px; }
	.tabs .me a.button { padding: 6px 12px; border-bottom: 0; }
</style>
