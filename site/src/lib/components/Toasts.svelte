<!-- The passing messages: small rounded cards at the bottom centre, each
     with a bar that runs down until it goes, and a cross to close it now.
     A pointer over one holds it; a screen reader hears it once. -->
<script>
	import { onDestroy } from 'svelte';
	import { L } from '$lib/i18n/fr.js';
	import { toasts, dismiss } from '$lib/toast.svelte.js';

	/* each message's own clock, held while the pointer is over it */
	const clocks = new Map();
	function start(t) {
		if (!t.ms || clocks.has(t.id)) return;
		clocks.set(t.id, { left: t.ms, since: Date.now(), timer: setTimeout(() => dismiss(t.id), t.ms) });
	}
	function hold(t) {
		const c = clocks.get(t.id);
		if (!c || c.held) return;
		clearTimeout(c.timer);
		c.left -= Date.now() - c.since;
		c.held = true;
	}
	function release(t) {
		const c = clocks.get(t.id);
		if (!c || !c.held) return;
		c.held = false;
		c.since = Date.now();
		c.timer = setTimeout(() => dismiss(t.id), Math.max(400, c.left));
	}
	$effect(() => {
		for (const t of toasts.list) start(t);
		for (const id of clocks.keys()) if (!toasts.list.some((t) => t.id === id)) clocks.delete(id);
	});
	onDestroy(() => clocks.forEach((c) => clearTimeout(c.timer)));
</script>

<div class="toasts" aria-live="polite">
	{#each toasts.list as t (t.id)}
		<div class="toast" class:error={t.kind === 'error'} role={t.kind === 'error' ? 'alert' : 'status'}
			onpointerenter={() => hold(t)} onpointerleave={() => release(t)}>
			<span class="text">{t.text}</span>
			{#if t.action}<a class="act" href={t.action.href} onclick={() => dismiss(t.id)}>{t.action.label}</a>{/if}
			<button type="button" class="close" aria-label={L.toastClose} onclick={() => dismiss(t.id)}>
				<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
			</button>
			{#if t.ms}<span class="bar" style="animation-duration: {t.ms}ms"></span>{/if}
		</div>
	{/each}
</div>

<style>
	.toasts { position: fixed; left: 50%; bottom: calc(20px + env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 60;
		display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none; width: max-content; max-width: calc(100vw - 32px); }
	.toast { position: relative; overflow: hidden; pointer-events: auto; display: flex; align-items: center; gap: 10px;
		padding: 9px 8px 11px 14px; border-radius: var(--r-md); background: var(--text); color: var(--bg);
		box-shadow: var(--shadow-3); font-size: 14px; line-height: 1.35; max-width: 460px;
		animation: toast-in var(--dur-base) var(--ease-out) both; }
	.toast.error { background: var(--danger); color: var(--on-danger); }
	.text { min-width: 0; }
	.act { flex: none; color: inherit; font-weight: 650; text-decoration: underline; text-underline-offset: 3px; }
	.close { flex: none; width: 26px; height: 26px; min-height: 26px; padding: 0; border: 0; border-radius: 50%;
		background: transparent; color: inherit; opacity: .7; display: grid; place-items: center; }
	.close:hover { opacity: 1; background: color-mix(in srgb, currentColor 14%, transparent); }
	.bar { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: currentColor; opacity: .35;
		transform-origin: left; animation: run linear both; }
	.toast:hover .bar { animation-play-state: paused; }
	@keyframes toast-in { from { opacity: 0; transform: translateY(8px) scale(.98); } }
	@keyframes run { from { transform: scaleX(1); } to { transform: scaleX(0); } }
</style>
