<!-- Home, after the design: the promise, word by word; the ways in; beside
     them a small compass — the French parties where the experts put them,
     and a few invented profiles among them; then three reasons to trust it. -->
<script>
	import { onMount } from 'svelte';
	import { L } from '$lib/i18n/fr.js';
	import { session } from '$lib/session.svelte.js';
	import { COUNTRIES } from '$lib/compass/model.js';

	let shown = $state(false);
	onMount(() => requestAnimationFrame(() => (shown = true)));

	const words = L.homeTitle.split(' ');
	const pct = (v) => 50 + v / 2;
	const parties = COUNTRIES[0].parties.map((p) => ({ left: pct(p.x), top: pct(-p.y) }));
	const sample = L.homeSample.map(([name, x, y]) => ({ name, left: pct(x), top: pct(-y) }));
	const icons = [
		'<rect x="7" y="4" width="18" height="24" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><rect x="11" y="10" width="10" height="2.4" rx="1.2" fill="currentColor"/><rect x="11" y="15" width="10" height="2.4" rx="1.2" fill="currentColor"/><rect x="11" y="20" width="6" height="2.4" rx="1.2" fill="currentColor"/>',
		'<path d="M16 4 L28 16 L16 28 L4 16 Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle cx="16" cy="16" r="3.5" fill="currentColor"/>',
		'<circle cx="11" cy="16" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="21" cy="16" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/>'
	];
</script>

<svelte:head><title>Politiskel</title></svelte:head>

<div class="home" class:shown>
	<section class="hero">
		<div>
			<h1>
				{#each words as w, i}<span class="word" style="--i: {i}">{w}</span>{' '}{/each}
			</h1>
			<p class="lead rise" style="--i: 7">{L.homeLead}</p>
			<div class="actions rise" style="--i: 9">
				{#if session.me}
					<a class="button primary" href="/boussole">{L.seeOnCompass}</a>
					<a class="button ghost" href="/questionnaire">{L.tabQuiz}</a>
					<span class="hello">{L.homeSignedIn(session.me.username)}</span>
				{:else}
					<a class="button primary" href="/inscription">{L.navSignUp}</a>
					<a class="button ghost" href="/connexion">{L.navSignIn}</a>
					<a class="button skip" href="/essai">{L.homeTry}</a>
				{/if}
			</div>
			<p class="privacy rise" style="--i: 10">
				<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="7" width="11" height="7.5" rx="2" fill="currentColor" /><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>
				{L.homePrivacy}
			</p>
		</div>
		<div class="board rise" style="--i: 4" aria-hidden="true">
			<div class="plane">
				<i class="ax v"></i><i class="ax h"></i>
				<i class="gr v" style="left: 25%"></i><i class="gr v" style="left: 75%"></i>
				<i class="gr h" style="top: 25%"></i><i class="gr h" style="top: 75%"></i>
				{#each parties as r, i}<i class="ref" style="left: {r.left}%; top: {r.top}%; --i: {i}"></i>{/each}
				{#each sample as d, i (d.name)}
					<div class="dot" style="left: {d.left}%; top: {d.top}%; --i: {i}">
						<i class:me={i === 0}></i><span>{d.name}</span>
					</div>
				{/each}
				<span class="cap t">{L.homeAxes.top}</span>
				<span class="cap b">{L.homeAxes.bottom}</span>
				<span class="cap l">{L.homeAxes.left}</span>
				<span class="cap r">{L.homeAxes.right}</span>
			</div>
		</div>
	</section>

	<section class="points">
		{#each L.homePoints as [title, text], i}
			<article class="rise" style="--i: {12 + i * 2}">
				<span class="icon"><svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">{@html icons[i]}</svg></span>
				<h2>{title}</h2>
				<p>{text}</p>
			</article>
		{/each}
	</section>
</div>

<style>
	.hero { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 56px; align-items: center; padding: 40px 0 56px; }
	h1 { font-family: var(--font-display); font-size: clamp(36px, 5vw, 56px); line-height: 1.06; font-weight: 600; letter-spacing: -0.025em;
		margin: 0 0 18px; text-wrap: balance; }
	.lead { margin: 0; font-size: 19px; line-height: 1.55; color: var(--text-2); max-width: 34em; }
	.actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin: 28px 0 16px; }
	.actions .button { height: 48px; padding: 0 22px; font-size: 15.5px; }
	.actions .skip { background: transparent; border-color: transparent; color: var(--text-2); }
	.actions .skip:hover { background: var(--surface-2); color: var(--text); }
	.hello { color: var(--text-3); font-size: 14px; margin-left: 6px; }
	.privacy { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 14px; color: var(--text-3); }
	.privacy svg { flex: none; color: var(--accent); }

	/* the entrance: words rise one after the other, then the rest */
	.word, .rise { display: inline-block; opacity: 0; transform: translateY(14px);
		transition: opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out);
		transition-delay: calc(var(--i) * 70ms); }
	.rise { display: block; }
	.shown .word, .shown .rise { opacity: 1; transform: none; }

	.board { position: relative; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-xl); padding: 22px;
		box-shadow: 14px 14px 0 var(--pop), var(--shadow-2); }
	.plane { position: relative; aspect-ratio: 1; border-radius: var(--r-md); background: var(--quad); overflow: hidden; }
	.plane i { position: absolute; display: block; }
	.ax.v { left: 50%; top: 0; bottom: 0; width: 1.5px; background: var(--axis); }
	.ax.h { top: 50%; left: 0; right: 0; height: 1.5px; background: var(--axis); }
	.gr.v { top: 0; bottom: 0; width: 1px; background: var(--grid); }
	.gr.h { left: 0; right: 0; height: 1px; background: var(--grid); }
	.ref { width: 11px; height: 11px; margin: -5.5px 0 0 -5.5px; transform: rotate(45deg); border: 1.6px solid var(--ref); background: var(--surface);
		opacity: 0; transition: opacity var(--dur-base) var(--ease-out) calc(400ms + var(--i) * 30ms); }
	.shown .ref { opacity: 1; }
	.dot { position: absolute; opacity: 0; transform: scale(.4);
		transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-settle);
		transition-delay: calc(800ms + var(--i) * 120ms); }
	.shown .dot { opacity: 1; transform: none; }
	.dot i { left: -9px; top: -9px; width: 18px; height: 18px; border-radius: 50%; background: var(--dot); box-shadow: 0 0 0 3px var(--quad); }
	.dot i.me { background: var(--dot-me); }
	.dot span { position: absolute; left: 14px; top: -13px; padding: 3px 10px; border-radius: var(--r-pill); background: var(--surface);
		box-shadow: var(--shadow-1); font-size: 13px; font-weight: 650; white-space: nowrap; }
	.cap { position: absolute; font-size: 11.5px; font-weight: 650; letter-spacing: .05em; color: var(--text-3); }
	.cap.t { left: 10px; top: 8px; }
	.cap.b { left: 10px; bottom: 8px; }
	.cap.l { left: 10px; top: calc(50% + 8px); }
	.cap.r { right: 10px; top: calc(50% + 8px); }

	.points { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; padding-bottom: 24px; }
	.points article { padding: 24px; border-radius: var(--r-lg); background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-1); }
	.icon { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; background: var(--pop-soft); color: var(--accent); }
	.points h2 { font-family: var(--font-display); font-size: 22px; font-weight: 600; margin: 16px 0 8px; letter-spacing: -0.01em; }
	.points p { margin: 0; font-size: 15.5px; line-height: 1.55; color: var(--text-2); }

	@media (max-width: 900px) {
		.hero { grid-template-columns: 1fr; gap: 32px; padding-top: 16px; }
		.points { grid-template-columns: 1fr; }
	}
</style>
