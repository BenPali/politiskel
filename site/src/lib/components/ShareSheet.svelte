<!-- Sharing one's profile: a dialog over the page (a sheet from the bottom on
     a phone) with the cards side by side, one in view, sliding from one to
     the next; the theme as coloured dots below; then what the device can
     do with the image: share it, download it, copy it. The image is made
     here, in the browser. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { cardData, drawCard, LAYOUTS, THEMES } from '$lib/share/card.js';
	import { cardPng } from '$lib/share/png.js';
	import { toast } from '$lib/toast.svelte.js';

	/** p: one's own profile; country: the country of reference */
	let { p, country, open = $bindable(false) } = $props();

	const S = L.share;
	const THEME_KEY = 'politiskel.share.theme.v1';
	let dialog = $state(null);
	let ART = $state(null);
	let index = $state(0);
	let theme = $state('clair');
	let busy = $state(false);

	const data = $derived(open && p ? cardData(p, country) : null);
	const layout = $derived(LAYOUTS[index]);
	const canShareFiles = typeof navigator !== 'undefined' && !!navigator.canShare;
	const canCopy = typeof window !== 'undefined' && 'ClipboardItem' in window;

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			try {
				const t = localStorage.getItem(THEME_KEY);
				if (t && THEMES[t]) theme = t;
			} catch {
				/* private browsing */
			}
			dialog.showModal();
			if (!ART) import('$lib/badges/scenes/index.js').then((m) => (ART = m.ART));
		} else if (!open && dialog.open) dialog.close();
	});

	const go = (d) => (index = (index + d + LAYOUTS.length) % LAYOUTS.length);
	function pick(t) {
		theme = t;
		try {
			localStorage.setItem(THEME_KEY, t);
		} catch {
			/* private browsing */
		}
	}
	function onkey(e) {
		if (e.key === 'ArrowRight') go(1);
		else if (e.key === 'ArrowLeft') go(-1);
	}
	/* a swipe of 40 px or more turns the card */
	let startX = null;
	const down = (e) => (startX = e.clientX);
	function up(e) {
		if (startX === null) return;
		const dx = e.clientX - startX;
		startX = null;
		if (Math.abs(dx) >= 40) go(dx < 0 ? 1 : -1);
	}

	const fileName = () => 'politiskel-' + String(p.alias).replace(/[^\p{L}\p{N}_-]+/gu, '-') + '-' + layout.key + '.png';
	async function png() {
		return cardPng(drawCard(layout, data, ART, theme), layout.w, layout.h);
	}
	async function act(kind) {
		if (busy || !data) return;
		busy = true;
		try {
			const blob = await png();
			if (kind === 'share') {
				const file = new File([blob], fileName(), { type: 'image/png' });
				if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] });
				else kind = 'download';
			}
			if (kind === 'copy') {
				await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
				toast(S.copied);
			}
			if (kind === 'download') {
				const a = document.createElement('a');
				a.href = URL.createObjectURL(blob);
				a.download = fileName();
				a.click();
				setTimeout(() => URL.revokeObjectURL(a.href), 1000);
			}
		} catch (e) {
			/* a share the reader cancels is not a failure */
			if (e?.name !== 'AbortError') toast(S.failed, { kind: 'error' });
		} finally {
			busy = false;
		}
	}
</script>

<dialog bind:this={dialog} class="sheet" aria-label={S.title} onclose={() => (open = false)} onkeydown={onkey}>
	{#if data}
		<div class="head">
			<h2>{S.title}</h2>
			<button type="button" class="close" aria-label={S.close} onclick={() => (open = false)}>×</button>
		</div>

		<div class="stage" onpointerdown={down} onpointerup={up} role="group" aria-roledescription="carousel" aria-label={S.layoutsLabel}>
			<div class="slides" style="transform: translateX({-index * 100}%)">
				{#each LAYOUTS as l, i (l.key)}
					<div class="slide" aria-hidden={i !== index} class:tall={l.h > l.w}>
						<div class="card-art">{@html drawCard(l, data, ART, theme)}</div>
					</div>
				{/each}
			</div>
			<button type="button" class="arrow prev" aria-label={S.prev} onclick={() => go(-1)}>‹</button>
			<button type="button" class="arrow next" aria-label={S.next} onclick={() => go(1)}>›</button>
		</div>

		<p class="which"><b>{S.layouts[layout.key][0]}</b> <span>{index + 1} / {LAYOUTS.length} · {S.layouts[layout.key][1]}</span></p>

		<div class="dots" role="radiogroup" aria-label={S.theme}>
			{#each Object.keys(THEMES) as t}
				<button type="button" role="radio" aria-checked={theme === t} aria-label={S.themes[t]} title={S.themes[t]}
					style="--bg: {THEMES[t].bg}; --ac: {THEMES[t].accent}" onclick={() => pick(t)}></button>
			{/each}
		</div>

		<div class="actions">
			{#if canShareFiles}<button type="button" class="primary" disabled={busy} onclick={() => act('share')}>{S.share}</button>{/if}
			<button type="button" class={canShareFiles ? 'ghost' : 'primary'} disabled={busy} onclick={() => act('download')}>{S.download}</button>
			{#if canCopy}<button type="button" class="ghost" disabled={busy} onclick={() => act('copy')}>{S.copy}</button>{/if}
		</div>
		<p class="note">{S.lead}</p>
	{/if}
</dialog>

<style>
	.sheet { width: min(760px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); padding: 20px 24px 22px; border: none; border-radius: 16px;
		background: var(--surface); color: var(--text); box-shadow: var(--shadow-3, 0 20px 60px rgba(0, 0, 0, 0.3)); overflow: auto; }
	.sheet::backdrop { background: rgba(10, 10, 12, 0.55); }
	.sheet[open] { animation: rise var(--dur-base) var(--ease-out) both; }
	@keyframes rise { from { opacity: 0; transform: translateY(18px) scale(0.98); } }
	.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
	h2 { margin: 0; font-size: 20px; }
	.close { width: 40px; height: 40px; border: none; border-radius: 50%; background: var(--surface-2); font-size: 24px; line-height: 1; color: var(--text-2); }
	.stage { position: relative; overflow: hidden; border-radius: 12px; background: var(--surface-2); touch-action: pan-y; user-select: none; }
	.slides { display: flex; transition: transform 420ms cubic-bezier(0.22, 0.8, 0.26, 1); }
	.slide { flex: 0 0 100%; display: flex; justify-content: center; align-items: center; height: min(52dvh, 460px); padding: 18px; box-sizing: border-box; }
	.card-art { height: 100%; display: flex; align-items: center; }
	.card-art :global(svg) { display: block; max-width: 100%; max-height: 100%; width: auto; height: auto; border-radius: 8px; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18); }
	.arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border-radius: 50%; border: none;
		background: var(--surface); box-shadow: var(--shadow-1); font-size: 26px; line-height: 1; color: var(--text); }
	.prev { left: 10px; }
	.next { right: 10px; }
	.which { margin: 12px 0 0; text-align: center; font-size: 15px; }
	.which span { color: var(--text-3); font-size: 13px; }
	.dots { display: flex; justify-content: center; gap: 12px; margin: 14px 0 18px; }
	.dots button { flex: none; width: 34px; height: 34px; min-width: 0; min-height: 0; padding: 0; border-radius: 50%; border: 2px solid var(--border);
		background: radial-gradient(circle, var(--ac) 0 32%, var(--bg) 34%); transition: transform var(--dur-fast, 120ms); }
	.dots button:hover { transform: scale(1.08); }
	.dots button[aria-checked='true'] { border-color: var(--text); box-shadow: 0 0 0 3px var(--surface), 0 0 0 5px var(--text); }
	.actions { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
	.note { margin: 14px auto 0; max-width: 56ch; text-align: center; font-size: 13px; color: var(--text-3); line-height: 1.45; }
	@media (prefers-reduced-motion: reduce) { .slides { transition: none; } .sheet[open] { animation: none; } }
	@media (max-width: 700px) {
		.sheet { width: 100vw; max-width: 100vw; margin: auto 0 0; border-radius: 16px 16px 0 0; padding: 16px 16px 20px; max-height: 94dvh; }
		.slide { height: 46dvh; padding: 12px; }
		.arrow { display: none; }
	}
</style>
