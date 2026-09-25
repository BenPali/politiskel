<!-- The guided tour's layer: the screen dimmed around a spotlight on the
     step's element, a ring pulsing on it, and a card beside it — where one
     is, what it does, and the way on. A step can ask for a click: the
     spotlit element stays usable, and the tour moves on once it is used.
     Keys: → next, ← back, Escape ends it. -->
<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { L } from '$lib/i18n/fr.js';
	import { session } from '$lib/session.svelte.js';
	import { tour, STEPS, nextStep, prevStep, endTour, startTour, tourPending } from '$lib/tour.svelte.js';

	const step = $derived(tour.active ? STEPS[tour.step] : null);
	/** the spotlight, in viewport pixels; null: a centred card, no target */
	let hole = $state(null);
	let ready = $state(false);
	let card = $state(null);
	let cardSize = $state({ w: 360, h: 200 });

	const PAD = 10;
	const still = () => document.documentElement.dataset.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches;
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const targetOf = (s) => (s?.target ? document.querySelector(`[data-tour="${s.target}"]`) : null);

	function measure() {
		const el = targetOf(step);
		if (!el) return (hole = null);
		const r = el.getBoundingClientRect();
		hole = { x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 };
	}

	/* each step: its page, then its element found, brought into view, measured */
	let run = 0;
	$effect(() => {
		const s = step;
		if (!s) return;
		const mine = ++run;
		ready = false;
		(async () => {
			if (page.url.pathname !== s.path) await goto(s.path);
			let el = null;
			for (let i = 0; i < 40 && s.target && !(el = targetOf(s)); i++) await wait(100);
			if (mine !== run) return;
			if (el) {
				el.scrollIntoView({ block: 'center', behavior: still() ? 'auto' : 'smooth' });
				await wait(still() ? 0 : 380);
			}
			if (mine !== run) return;
			measure();
			ready = true;
		})();
	});

	/* a step that asks for a click moves on once its element is used */
	function clicked(e) {
		if (!step?.click || !ready) return;
		if (e.target.closest?.(step.click)) setTimeout(() => tour.active && nextStep(), 700);
	}
	function keys(e) {
		if (!tour.active) return;
		if (e.key === 'Escape') endTour();
		else if (e.key === 'ArrowRight') nextStep();
		else if (e.key === 'ArrowLeft') prevStep();
	}

	/* a newcomer's first signed-in page starts it — not while joining a group */
	let offered = false;
	$effect(() => {
		if (offered || !session.me || tour.active) return;
		const p = page.url.pathname;
		if (p.startsWith('/rejoindre') || p === '/inscription' || p === '/connexion') return;
		offered = true;
		if (tourPending()) setTimeout(startTour, 800);
	});

	/* the card: below the spotlight when there is room, else above; always on screen */
	const place = $derived.by(() => {
		const vw = typeof window === 'undefined' ? 1280 : window.innerWidth;
		const vh = typeof window === 'undefined' ? 800 : window.innerHeight;
		const w = Math.min(380, vw - 24), h = cardSize.h;
		if (!hole) return { left: (vw - w) / 2, top: Math.max(24, (vh - h) / 2), w };
		const below = hole.y + hole.h + 14, above = hole.y - h - 14;
		const clampTop = (t) => Math.min(Math.max(12, t), vh - h - 12);
		if (below + h <= vh - 12 || above >= 12) {
			const top = below + h <= vh - 12 ? below : above;
			const left = Math.min(Math.max(12, hole.x + hole.w / 2 - w / 2), vw - w - 12);
			return { left, top, w };
		}
		/* too tall for either: beside it, on the side with room, else over its lower edge */
		const middle = clampTop(hole.y + hole.h / 2 - h / 2);
		if (hole.x + hole.w + 14 + w <= vw - 12) return { left: hole.x + hole.w + 14, top: middle, w };
		if (hole.x - 14 - w >= 12) return { left: hole.x - 14 - w, top: middle, w };
		return { left: Math.min(Math.max(12, hole.x + hole.w / 2 - w / 2), vw - w - 12), top: vh - h - 12, w };
	});
	$effect(() => {
		if (card) cardSize = { w: card.offsetWidth, h: card.offsetHeight };
	});
</script>

<svelte:window onresize={measure} onscroll={measure} onkeydown={keys} onclickcapture={clicked} />

{#if tour.active && step}
	<div class="tour" class:ready>
		{#if hole}
			<!-- four panes around the spotlight take the clicks; the spotlit element stays usable -->
			<div class="pane" style="left: 0; top: 0; right: 0; height: {Math.max(0, hole.y)}px"></div>
			<div class="pane" style="left: 0; top: {hole.y + hole.h}px; right: 0; bottom: 0"></div>
			<div class="pane" style="left: 0; top: {hole.y}px; width: {Math.max(0, hole.x)}px; height: {hole.h}px"></div>
			<div class="pane" style="left: {hole.x + hole.w}px; top: {hole.y}px; right: 0; height: {hole.h}px"></div>
			<div class="spot" style="left: {hole.x}px; top: {hole.y}px; width: {hole.w}px; height: {hole.h}px">
				<span class="ring"></span>
			</div>
		{:else}
			<div class="pane dim" style="inset: 0"></div>
		{/if}

		{#key tour.step}
			<div class="card-tour" role="dialog" aria-modal="true" aria-labelledby="tour-title" bind:this={card}
				style="left: {place.left}px; top: {place.top}px; width: {place.w}px">
				<div class="count">
					<span>{L.tour.count(tour.step + 1, STEPS.length)}</span>
					<span class="dots" aria-hidden="true">{#each STEPS as _, i}<i class:on={i === tour.step} class:past={i < tour.step}></i>{/each}</span>
				</div>
				<h2 id="tour-title">{step.title}</h2>
				<p>{step.text}</p>
				{#if step.click}<p class="hint"><span class="tap" aria-hidden="true"></span>{step.hint}</p>{/if}
				<div class="nav">
					<button type="button" class="skip" onclick={endTour}>{tour.step === STEPS.length - 1 ? L.tour.close : L.tour.skip}</button>
					<span class="grow"></span>
					{#if tour.step > 0}<button type="button" class="ghost" onclick={prevStep}>{L.tour.prev}</button>{/if}
					<button type="button" class="primary" onclick={nextStep}>{tour.step === STEPS.length - 1 ? L.tour.done : L.tour.next}</button>
				</div>
			</div>
		{/key}
	</div>
{/if}

<style>
	.tour { position: fixed; inset: 0; z-index: 80; pointer-events: none; }
	.pane { position: fixed; pointer-events: auto; }
	.pane.dim { background: rgba(10, 12, 18, .58); animation: fade var(--dur-base) var(--ease-out) both; }
	/* the spotlight: a rounded hole, the dimming as its shadow; it glides from one element to the next */
	.spot { position: fixed; border-radius: 16px; box-shadow: 0 0 0 200vmax rgba(10, 12, 18, .58); pointer-events: none;
		transition: left var(--dur-deliberate) var(--ease-move), top var(--dur-deliberate) var(--ease-move),
			width var(--dur-deliberate) var(--ease-move), height var(--dur-deliberate) var(--ease-move);
		animation: fade var(--dur-base) var(--ease-out) both; }
	.ring { position: absolute; inset: -2px; border-radius: 18px; border: 2px solid var(--accent); opacity: 0;
		animation: ring 1.8s var(--ease-out) infinite; }
	.ready .ring { opacity: 1; }
	@keyframes ring { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 55%, transparent); } 70%, 100% { box-shadow: 0 0 0 14px transparent; } }
	@keyframes fade { from { opacity: 0; } }

	.card-tour { position: fixed; pointer-events: auto; box-sizing: border-box; padding: 18px 18px 14px; border-radius: var(--r-lg);
		background: var(--surface); color: var(--text); border: 1px solid var(--border); box-shadow: var(--shadow-3);
		opacity: 0; transform: translateY(6px); transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out); }
	.ready .card-tour { opacity: 1; transform: none; }
	.count { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-3); font-weight: 650;
		letter-spacing: var(--tracking-caps); text-transform: uppercase; margin-bottom: 8px; }
	.dots { display: flex; gap: 4px; }
	.dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--border-strong); opacity: .5; transition: all var(--dur-base) var(--ease-out); }
	.dots i.past { opacity: 1; }
	.dots i.on { width: 16px; border-radius: 3px; background: var(--accent); opacity: 1; }
	h2 { font-family: var(--font-display); font-size: 20px; font-weight: 600; margin: 0 0 6px; letter-spacing: -0.01em; }
	p { margin: 0 0 12px; font-size: 14.5px; line-height: 1.5; color: var(--text-2); }
	.hint { display: flex; align-items: center; gap: 10px; font-weight: 650; color: var(--accent-ink); }
	.tap { flex: none; width: 12px; height: 12px; border-radius: 50%; background: var(--accent); animation: tap 1.2s var(--ease-out) infinite; }
	@keyframes tap { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 60%, transparent); } 100% { box-shadow: 0 0 0 10px transparent; } }
	.nav { display: flex; align-items: center; gap: 8px; }
	.nav button { min-height: 38px; padding: 0 14px; font-size: 14px; }
	.grow { flex: 1; }
</style>
