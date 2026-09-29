<!-- Sharing one's profile: a dialog over the page (a sheet from the bottom on
     a phone) with the cards side by side, one in view, sliding from one to
     the next; the theme as coloured dots below; then what the device can
     do with the image: share it, download it, copy it. The image is made
     here, in the browser. -->
<script>
	import { tick } from 'svelte';
	import { L } from '$lib/i18n/fr.js';
	import { cardData, snapshotOf, THEMES } from '$lib/share/card.js';
	import { api, apiError } from '$lib/api.js';
	import { session } from '$lib/session.svelte.js';
	import { SHARE_LAYOUTS as LAYOUTS } from '$lib/share/layouts.js';
	import { cardPng } from '$lib/share/png.js';
	import { encode } from '$lib/share/fragment.js';

	/** p: one's own profile; country: the country of reference */
	let { p, country, open = $bindable(false) } = $props();

	const S = L.share;
	const THEME_KEY = 'politiskel.share.theme.v1';
	let dialog = $state(null);
	let ART = $state(null);
	let index = $state(0);
	let theme = $state('clair');
	let busy = $state(false);
	/* the public link: null, 'confirm', or the address once made */
	let link = $state(null);
	let linkBox = $state(null);
	/* the link with no account: the address that holds the result, or null */
	let bareLink = $state(null);
	/* a short green line under what was just copied; a red one for what
	   failed, inside the dialog, since the page's toasts sit below it */
	let copied = $state(null);
	let problem = $state(null);
	let copiedTimer = null;
	function flash(what) {
		copied = what;
		clearTimeout(copiedTimer);
		copiedTimer = setTimeout(() => (copied = null), 2500);
	}
	/* the warning and the link open at the foot of the dialog, which may be
	   below the fold of a short screen: they are brought into view */
	async function showLink(state) {
		link = state;
		bareLink = null;
		await tick();
		linkBox?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		linkBox?.querySelector('button.primary')?.focus({ preventScroll: true });
	}

	const data = $derived(open && p ? cardData(p, country) : null);
	const layout = $derived(LAYOUTS[index]);
	/* the link records the layout and the theme: a new one must be asked for */
	$effect(() => {
		layout.key;
		theme;
		bareLink = null;
	});
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
			link = null;
			bareLink = null;
			copied = null;
			problem = null;
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
		return cardPng(layout.draw(data, ART, theme), layout.w, layout.h);
	}
	const toBase64 = (blob) => new Promise((ok, ko) => {
		const r = new FileReader();
		r.onload = () => ok(String(r.result).split(',')[1]);
		r.onerror = ko;
		r.readAsDataURL(blob);
	});
	/* The preview a link shows in a chat is a 1200 × 630 image: the card
	   itself when it has that size, the plain card in its theme otherwise. */
	async function makeLink() {
		if (busy || !data) return;
		busy = true;
		problem = null;
		try {
			const og = layout.w === 1200 && layout.h === 630 ? layout : LAYOUTS[0];
			const image = await toBase64(await cardPng(og.draw(data, ART, theme), og.w, og.h));
			const r = await api('POST', '/api/me/shares', { layout: layout.key, theme, snapshot: snapshotOf(data), image });
			if (r.ok) await showLink(location.origin + r.data.url);
			/* an unexpected refusal keeps its code, so it can be traced */
			else problem = apiError(r) + (L.apiErrors[r.data?.error] ? '' : ' (' + (r.data?.error || r.status) + ')');
		} catch {
			problem = S.failed;
		} finally {
			busy = false;
		}
	}
	async function copyLink() {
		try {
			await navigator.clipboard.writeText(link);
			flash('link');
		} catch {
			/* the address stays selectable in its field */
		}
	}
	/* The result goes into the address itself, after a #, which no server
	   is ever sent: nothing is stored, and there is nothing to delete. */
	async function makeBareLink() {
		problem = null;
		try {
			const s = snapshotOf(data);
			bareLink = location.origin + '/v#' + encode({ ...s, layout: layout.key, theme });
			link = null;
			await tick();
			linkBox?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			linkBox?.querySelector('button.primary')?.focus({ preventScroll: true });
		} catch {
			problem = S.failed;
		}
	}
	async function copyBareLink() {
		try {
			await navigator.clipboard.writeText(bareLink);
			flash('bare');
		} catch {
			/* the address stays selectable in its field */
		}
	}

	async function act(kind) {
		if (busy || !data) return;
		busy = true;
		problem = null;
		try {
			/* Safari wants the clipboard written within the click itself: the
			   item is given the image as a promise, before anything awaits */
			if (kind === 'copy') {
				await navigator.clipboard.write([new ClipboardItem({ 'image/png': png() })]);
				flash('image');
				return;
			}
			const blob = await png();
			if (kind === 'share') {
				const file = new File([blob], fileName(), { type: 'image/png' });
				if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] });
				else kind = 'download';
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
			if (e?.name !== 'AbortError') problem = S.failed;
		} finally {
			busy = false;
		}
	}
</script>

<dialog bind:this={dialog} class="sheet" aria-label={S.title} onclose={() => (open = false)} onkeydown={onkey}>
	{#if data}
		<div class="head">
			<h2>{S.title}</h2>
			<button type="button" class="close" aria-label={S.close} onclick={() => (open = false)}>
				<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
			</button>
		</div>

		<div class="stage" onpointerdown={down} onpointerup={up} role="group" aria-roledescription="carousel" aria-label={S.layoutsLabel}>
			<div class="slides" style="transform: translateX({-index * 100}%)">
				{#each LAYOUTS as l, i (l.key)}
					<div class="slide" aria-hidden={i !== index} class:tall={l.h > l.w}>
						<div class="card-art">{@html l.draw(data, ART, theme)}</div>
					</div>
				{/each}
			</div>
			<button type="button" class="arrow prev" aria-label={S.prev} onclick={() => go(-1)}>‹</button>
			<button type="button" class="arrow next" aria-label={S.next} onclick={() => go(1)}>›</button>
		</div>

		<p class="which"><b>{S.layouts[layout.key][0]}</b> <span>{index + 1} / {LAYOUTS.length} · {S.layouts[layout.key][1]}</span></p>

		<div class="dots" class:off={!layout.themed} role="radiogroup" aria-label={S.theme} aria-disabled={!layout.themed}>
			{#each Object.keys(THEMES) as t}
				<button type="button" role="radio" aria-checked={theme === t} aria-label={S.themes[t]} title={S.themes[t]}
					style="--bg: {THEMES[t].bg}; --ac: {THEMES[t].accent}" disabled={!layout.themed} onclick={() => pick(t)}></button>
			{/each}
		</div>
		{#if !layout.themed}<p class="fixed">{S.fixedTheme}</p>{/if}

		<div class="actions">
			{#if canShareFiles}<button type="button" class="primary" disabled={busy} onclick={() => act('share')}>{S.share}</button>{/if}
			<button type="button" class={canShareFiles ? 'ghost' : 'primary'} disabled={busy} onclick={() => act('download')}>{S.download}</button>
			{#if canCopy}<button type="button" class="ghost" disabled={busy} onclick={() => act('copy')}>{S.copy}</button>{/if}
			{#if session.me && link === null}<button type="button" class="ghost" disabled={busy} onclick={() => showLink('confirm')}>{S.link}</button>{/if}
			{#if !bareLink}<button type="button" class="ghost" disabled={busy} onclick={makeBareLink}>{S.bareLink}</button>{/if}
		</div>
		{#if copied === 'image'}<p class="ok" role="status">{S.copied}</p>{/if}
		{#if link === 'confirm'}
			<div class="link warn" role="alert" bind:this={linkBox}>
				<p>{S.linkWarn}</p>
				<div class="link-actions">
					<button type="button" class="ghost" onclick={() => (link = null)}>{S.linkCancel}</button>
					<button type="button" class="primary" disabled={busy} onclick={makeLink}>{S.linkConfirm}</button>
				</div>
				{#if problem}<p class="bad" role="alert">{problem}</p>{/if}
			</div>
		{:else if link}
			<div class="link" bind:this={linkBox}>
				<label for="share-link">{S.linkReady}</label>
				<div class="link-row">
					<input id="share-link" type="text" readonly value={link} onfocus={(e) => e.currentTarget.select()} />
					<button type="button" class="primary" onclick={copyLink}>{S.linkCopy}</button>
				</div>
				{#if copied === 'link'}<p class="ok" role="status">{S.linkCopied}</p>{/if}
			</div>
		{/if}
		{#if bareLink}
			<div class="link" bind:this={linkBox}>
				<label for="share-bare-link">{S.bareLinkReady}</label>
				<div class="link-row">
					<input id="share-bare-link" type="text" readonly value={bareLink} onfocus={(e) => e.currentTarget.select()} />
					<button type="button" class="primary" onclick={copyBareLink}>{S.linkCopy}</button>
				</div>
				<p class="note">{S.bareLinkNote}</p>
				{#if copied === 'bare'}<p class="ok" role="status">{S.linkCopied}</p>{/if}
			</div>
		{/if}
		{#if problem && link !== 'confirm'}<p class="bad" role="alert">{problem}</p>{/if}
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
	.close { flex: none; display: grid; place-items: center; width: 40px; height: 40px; min-width: 0; min-height: 0; padding: 0;
		border: none; border-radius: 50%; background: var(--surface-2); color: var(--text-2); }
	.close:hover { color: var(--text); }
	.ok { margin: 10px 0 0; text-align: center; font-size: 14px; font-weight: 600; color: #1d7a3e; }
	.link .ok, .link .bad { text-align: left; }
	.bad { margin: 10px 0 0; text-align: center; font-size: 14px; font-weight: 600; color: var(--danger, #b3321a); }
	:global([data-mode='sombre']) .ok { color: #7ad69a; }
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
	.dots.off { opacity: 0.35; margin-bottom: 4px; }
	.fixed { margin: 0 0 14px; text-align: center; font-size: 13px; color: var(--text-3); }
	.actions { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
	.link { margin: 16px 0 0; padding: 14px 16px; border-radius: 12px; background: var(--surface-2); }
	.link.warn p { margin: 0 0 12px; font-size: 14px; line-height: 1.5; color: var(--text-2); }
	.link-actions { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
	.link label { display: block; font-size: 14px; font-weight: 650; margin-bottom: 8px; }
	.link .note { margin: 10px 0 0; font-size: 14px; line-height: 1.5; color: var(--text-2); }
	.link-row { display: flex; gap: 10px; }
	.link-row input { flex: 1; min-width: 0; }
	@media (prefers-reduced-motion: reduce) { .slides { transition: none; } .sheet[open] { animation: none; } }
	@media (max-width: 700px) {
		.sheet { width: 100vw; max-width: 100vw; margin: auto 0 0; border-radius: 16px 16px 0 0; padding: 16px 16px 20px; max-height: 94dvh; }
		.slide { height: 46dvh; padding: 12px; }
		.arrow { display: none; }
	}
</style>
