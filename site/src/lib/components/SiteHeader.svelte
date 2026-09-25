<!-- The site's header, after the design: the mark and name, which lead home;
     the sections; the display picker; the member's pill, or sign in and sign
     up. On a phone the sections fold into a menu. -->
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { L } from '$lib/i18n/fr.js';
	import { session } from '$lib/session.svelte.js';
	import { PALETTES, MODES, readDisplay, applyDisplay } from '$lib/theme.js';
	import { readGuest } from '$lib/quiz/answers.svelte.js';
	import { waitingRequests } from '$lib/notify.svelte.js';

	let display = $state({ palette: 'classique', mode: 'auto', motion: 'full' });
	let pickerOpen = $state(false);
	let menuOpen = $state(false);

	/* a visitor with a trial profile gets its pages among the sections */
	let trial = $state(false);

	onMount(() => (display = readDisplay()));
	afterNavigate(() => {
		trial = readGuest() !== null;
		menuOpen = false;
		pickerOpen = false;
	});
	/* the picker closes on a click outside it, or on Escape */
	let pickerEl = $state(null);
	function outside(e) {
		if (pickerOpen && pickerEl && !pickerEl.contains(e.target)) pickerOpen = false;
	}
	function escape(e) {
		if (e.key === 'Escape' && pickerOpen) {
			pickerOpen = false;
			pickerEl?.querySelector('button')?.focus();
		}
	}
	function set(k, v) {
		display = { ...display, [k]: v };
		applyDisplay(display);
	}

	const tabs = $derived(
		session.me
			? [
					{ href: '/boussole', label: L.tabCompass },
					{ href: '/questionnaire', label: L.tabQuiz },
					{ href: '/groupes', label: L.tabGroups, count: waitingRequests() },
					{ href: '/methode', label: L.navMethod }
				]
			: trial
				? [
						{ href: '/boussole', label: L.tabCompass },
						{ href: '/questionnaire', label: L.tabQuiz },
						{ href: '/essai', label: L.navTry },
						{ href: '/methode', label: L.navMethod }
					]
				: [
					{ href: '/essai', label: L.navTry },
					{ href: '/methode', label: L.navMethod },
					{ href: '/drapeaux', label: L.navFlags }
				]
	);
	const here = (href) => page.url.pathname === href || page.url.pathname.startsWith(href + '/');
</script>

<svelte:window onpointerdown={outside} onkeydown={escape} />

<header class="site-header">
	<a class="brand" href="/" aria-label={L.brandHome}>
		<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
			<circle cx="16" cy="16" r="13" fill="none" stroke="var(--text)" stroke-width="3" />
			<rect x="15" y="7" width="2" height="18" rx="1" fill="var(--text)" />
			<rect x="7" y="15" width="18" height="2" rx="1" fill="var(--text)" />
			<circle cx="21.5" cy="10.5" r="4.4" fill="var(--surface)" />
			<circle cx="21.5" cy="10.5" r="3.1" fill="var(--text)" />
			<circle cx="10.5" cy="20.5" r="4.4" fill="var(--surface)" />
			<circle cx="10.5" cy="20.5" r="3.1" fill="var(--accent)" />
		</svg>
		<span class="name">politiskel</span>
	</a>

	<nav class="sections" class:open={menuOpen} aria-label={L.navMain}>
		{#each tabs as t (t.href)}
			<a href={t.href} aria-current={here(t.href) ? 'page' : undefined}>{t.label}{#if t.count}<span class="count" title={L.requestsWaiting(t.count)} aria-label={L.requestsWaiting(t.count)}>{t.count}</span>{/if}<span class="bar"></span></a>
		{/each}
	</nav>

	<div class="end">
		<div class="picker" bind:this={pickerEl}>
			<button type="button" class="icon" aria-label={L.themeLabel} aria-expanded={pickerOpen} onclick={() => { display = readDisplay(); pickerOpen = !pickerOpen; }}>
				<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M10 2.5 A7.5 7.5 0 0 1 10 17.5 Z" fill="currentColor" /></svg>
			</button>
			{#if pickerOpen}
				<div class="pop" role="dialog" aria-label={L.themeLabel}>
					<p class="eyebrow">{L.displayPalette}</p>
					<div class="swatches">
						{#each PALETTES as p (p)}
							<button type="button" class="swatch-btn" data-theme={p} data-mode={display.mode} aria-pressed={display.palette === p} onclick={() => set('palette', p)}>
								<span class="chip"></span>{L.palettes[p]}
							</button>
						{/each}
					</div>
					<p class="eyebrow">{L.displayMode}</p>
					<div class="segmented" role="radiogroup">
						{#each MODES as m (m)}
							<button type="button" role="radio" aria-checked={display.mode === m} onclick={() => set('mode', m)}>{L.modes[m]}</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
		{#if session.me}
			<a class="me" href="/compte" aria-current={here('/compte') ? 'page' : undefined}>
				<span class="avatar">{session.me.username.slice(0, 1).toUpperCase()}</span><span class="who">{session.me.username}</span>
			</a>
		{:else if session.ready}
			<a class="plain" href="/connexion">{L.navSignIn}</a>
			<a class="button primary" href="/inscription">{L.navSignUp}</a>
		{/if}
		<button type="button" class="icon burger" aria-label={L.navMenu} aria-expanded={menuOpen} onclick={() => (menuOpen = !menuOpen)}>
			<svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true"><rect width="18" height="2" rx="1" fill="currentColor" /><rect y="6" width="18" height="2" rx="1" fill="currentColor" /><rect y="12" width="12" height="2" rx="1" fill="currentColor" /></svg>
		</button>
	</div>
</header>

<style>
	.site-header {
		position: sticky; top: 0; z-index: 20;
		display: flex; align-items: center; gap: var(--sp-5);
		height: 72px; padding: 0 40px; box-sizing: border-box;
		background: var(--surface); border-bottom: 1px solid var(--border); color: var(--text);
	}
	.brand { display: flex; align-items: center; gap: 10px; min-height: var(--tap); color: var(--text); text-decoration: none; }
	.name { font-family: var(--font-display); font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
	.sections { display: flex; align-items: center; gap: 4px; margin-right: auto; }
	.sections a {
		position: relative; display: flex; align-items: center; height: var(--tap); padding: 0 14px;
		border-radius: var(--r-sm); font-size: 15px; font-weight: 500; color: var(--text-2); text-decoration: none;
	}
	.sections a:hover { background: var(--surface-2); color: var(--text); }
	.sections a[aria-current='page'] { color: var(--text); font-weight: var(--fw-bold); }
	.sections .bar {
		position: absolute; left: 14px; right: 14px; bottom: 4px; height: 2px; border-radius: 2px;
		background: var(--accent); opacity: 0; transform: scaleX(0.3);
		transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out);
	}
	.sections a[aria-current='page'] .bar { opacity: 1; transform: scaleX(1); }
	.count { margin-left: 6px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; box-sizing: border-box;
		display: inline-grid; place-items: center; background: var(--accent-strong); color: var(--on-accent);
		font-size: 11.5px; font-weight: 700; font-variant-numeric: tabular-nums; animation: pop var(--dur-base) var(--ease-settle) both; }
	.end { display: flex; align-items: center; gap: var(--sp-2); }
	.icon { width: var(--tap); padding: 0; background: transparent; border-color: transparent; color: var(--text-2); }
	.icon:hover { background: var(--surface-2); }
	.me {
		display: flex; align-items: center; gap: var(--sp-2); height: 40px; padding: 0 14px 0 5px;
		border-radius: var(--r-pill); border: 1px solid var(--border); background: var(--bg);
		color: var(--text); text-decoration: none; font-size: var(--fs-sm); font-weight: 600;
	}
	.me:hover { border-color: var(--border-strong); color: var(--text); }
	.avatar { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center;
		background: var(--accent-soft); color: var(--accent-ink); font-size: 13px; }
	.plain { display: flex; align-items: center; height: var(--tap); padding: 0 16px; border-radius: var(--r-sm);
		color: var(--text); text-decoration: none; font-weight: 600; }
	.plain:hover { background: var(--surface-2); color: var(--text); }
	.picker { position: relative; }
	.pop {
		position: absolute; right: 0; top: calc(100% + 8px); width: 300px; z-index: 30;
		background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg);
		box-shadow: var(--shadow-3); padding: var(--sp-4);
		max-height: calc(100dvh - 96px); overflow-y: auto; overscroll-behavior: contain;
		animation: pop var(--dur-base) var(--ease-out) both;
	}
	@keyframes pop { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
	.pop .eyebrow { margin: 0 0 var(--sp-2); }
	.swatches { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: var(--sp-4); }
	.swatch-btn { justify-content: flex-start; min-height: 40px; padding: 0 10px; font-size: var(--fs-sm);
		background: var(--surface); color: var(--text); border: 1px solid var(--border); }
	.swatch-btn[aria-pressed='true'] { border-color: var(--accent-strong); box-shadow: inset 0 0 0 1px var(--accent-strong); }
	/* each chip shows its own palette: data-theme on the button scopes the tokens */
	.chip { width: 18px; height: 18px; border-radius: 50%; flex: none;
		background: linear-gradient(135deg, var(--bg) 50%, var(--accent) 50%); box-shadow: 0 0 0 1px var(--border-strong); }
	.segmented { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--r-sm); background: var(--surface-2); }
	.segmented button { min-height: 36px; padding: 0 12px; border: none; background: transparent; font-weight: 500; font-size: var(--fs-sm); }
	.segmented button[aria-checked='true'] { background: var(--surface); box-shadow: var(--shadow-1); font-weight: var(--fw-bold); }
	.burger { display: none; border-color: var(--border); background: var(--bg); color: var(--text); }
	@media (max-width: 860px) {
		/* on a phone the button is not at the edge: the panel spans the screen
		   under the header instead, and scrolls when it is taller than it */
		.pop { position: fixed; top: 68px; left: 12px; right: 12px; width: auto;
			max-height: calc(100dvh - 80px - env(safe-area-inset-bottom)); }
		.site-header { height: 60px; padding: 0 var(--sp-4); gap: var(--sp-3); }
		.name { font-size: 19px; }
		.sections { display: none; position: absolute; left: 0; right: 0; top: 60px; flex-direction: column; align-items: stretch;
			background: var(--surface); border-bottom: 1px solid var(--border); padding: var(--sp-2) var(--sp-4); box-shadow: var(--shadow-2); }
		.sections.open { display: flex; }
		.end { margin-left: auto; }
		.burger { display: inline-flex; }
		.plain { display: none; }
		.me { padding: 0 4px; }
		.me .who { display: none; }
	}
</style>
