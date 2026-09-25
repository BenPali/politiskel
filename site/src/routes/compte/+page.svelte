<!-- One's account, after the design: the profile and how far each theme
     has got; the display — palette, mode, motion; the data held and its
     export; the password; and deleting it all, asked again in place. -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { L } from '$lib/i18n/fr.js';
	import { api, apiError } from '$lib/api.js';
	import { session, refresh, signOut } from '$lib/session.svelte.js';
	import { PALETTES, MODES, MOTIONS, readDisplay, applyDisplay } from '$lib/theme.js';
	import { PolitiQuiz } from '$lib/model.js';
	import { hasPolitiscales, fromMember } from '$lib/compass/model.js';
	import { progressOf } from '$lib/quiz/flow.js';
	import SignedIn from '$lib/components/SignedIn.svelte';
	import CaptureImport from '$lib/components/CaptureImport.svelte';
	import { startMine, eraseAll } from '$lib/quiz/answers.svelte.js';
	import { toast } from '$lib/toast.svelte.js';
	import { board } from '$lib/compass/board.svelte.js';

	let current = $state('');
	let next = $state('');
	let pwError = $state('');
	let delPassword = $state('');
	let delError = $state('');
	let deleting = $state(false);
	let display = $state({ palette: 'classique', mode: 'auto', motion: 'full' });
	onMount(() => (display = readDisplay()));
	function set(k, v) {
		display = { ...display, [k]: v };
		applyDisplay(display);
	}

	const me = $derived(session.me ? fromMember({ username: session.me.username, me: true, politiscales: session.me.profile.politiscales }) : null);
	const themes = $derived(
		session.me
			? PolitiQuiz.THEMES.filter((t) => !t.planned).map((t) => {
					return { key: t.key, name: L.themes[t.key].name, ...progressOf(t.key, session.me.profile.answers || {}) };
				})
			: []
	);

	const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
	async function exportAll() {
		const r = await api('GET', '/api/me/export');
		if (!r.ok) return toast(apiError(r), { kind: 'error' });
		const blob = new Blob([JSON.stringify(r.data, null, 1) + '\n'], { type: 'application/json' });
		const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: slug(session.me.username) + '-compte.json' });
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(a.href), 1000);
	}
	let erasing = $state(false);
	const hasAnswers = $derived(!!session.me && Object.keys(session.me.profile.answers || {}).length > 0);
	async function eraseAnswers() {
		erasing = false;
		startMine('server');
		await eraseAll();
		toast(L.eraseAllDone);
	}
	async function savePs({ politiscales, flag }) {
		const r = await api('PUT', '/api/me/profile', flag ? { politiscales, flag } : { politiscales });
		if (!r.ok) return apiError(r);
		session.me.profile = r.data;
		board.loaded = false;
		return null;
	}
	async function endOthers() {
		const r = await api('DELETE', '/api/me/sessions/others');
		r.ok ? toast(L.signedOutOthers) : toast(apiError(r), { kind: 'error' });
	}
	async function changePassword(e) {
		e.preventDefault();
		const r = await api('POST', '/api/me/password', { current, new: next });
		if (!r.ok) return (pwError = r.data?.error === 'bad_credentials' ? L.passwordWrong : apiError(r));
		pwError = '';
		current = next = '';
		toast(L.passwordChanged);
	}
	async function leave() {
		await signOut();
		goto('/');
	}
	function askDelete(e) {
		e.preventDefault();
		deleting = true;
	}
	async function deleteAccount() {
		const r = await api('DELETE', '/api/me', { password: delPassword });
		deleting = false;
		if (!r.ok) return (delError = apiError(r));
		await refresh();
		goto('/');
	}
</script>

<svelte:head><title>{L.tabAccount} · Politiskel</title></svelte:head>

<SignedIn>
	<div class="account-page">
		<div class="head">
			<div>
				<h1>{L.tabAccount}</h1>
				<p class="who">{L.accountSignedIn(session.me.username, session.me.groups.length)}</p>
			</div>
			<button type="button" class="ghost" onclick={leave}>{L.signOut}</button>
		</div>

		<div class="cols">
			<div class="col">
				<section class="card">
					<h2>{L.myProfile}</h2>
					<dl>
						<dt>{L.profilePs}</dt>
						<dd>{me && hasPolitiscales(me) ? L.profilePsYes : L.profilePsNo}</dd>
						{#each themes as t (t.key)}
							<dt>{t.name}</dt>
							<dd><span class="bar"><span style="transform: scaleX({t.total ? t.done / t.total : 0})"></span></span>{t.done} / {t.total}</dd>
						{/each}
					</dl>
					<div class="actions">
						<a href="/questionnaire" class="button primary">{L.quizEdit}</a>
						{#if hasAnswers}<button type="button" class="skip warn" onclick={() => (erasing = true)}>{L.eraseAllTitle}</button>{/if}
						<a href="/boussole/{encodeURIComponent(session.me.username)}" class="button ghost">{L.openCard(session.me.username)}</a>
					</div>
				</section>

				{#if erasing}
					<div class="confirm" role="alertdialog" aria-label={L.eraseAllTitle}>
						<p>{L.eraseAllConfirm}</p>
						<div class="actions">
							<button type="button" class="danger" onclick={eraseAnswers}>{L.eraseAllTitle}</button>
							<button type="button" class="ghost" onclick={() => (erasing = false)}>{L.confirmCancel}</button>
						</div>
					</div>
				{/if}

				<section class="card">
					<h2>{L.psTitle}</h2>
					<p class="note">{L.guestFromPsLead}</p>
					<CaptureImport initial={session.me.profile.politiscales} onsave={savePs} />
				</section>

				<section class="card">
					<h2>{L.themeLabel}</h2>
					<p class="note">{L.displayLead}</p>
					<div class="palettes" role="radiogroup" aria-label={L.displayPalette}>
						{#each PALETTES as p (p)}
							<button type="button" role="radio" aria-checked={display.palette === p} data-theme={p} data-mode={display.mode} onclick={() => set('palette', p)}>
								<span class="swatch" aria-hidden="true"><span></span></span>
								<span class="txt"><b>{L.palettes[p]}</b><small>{L.paletteHints[p]}</small></span>
							</button>
						{/each}
					</div>
					<p class="eyebrow">{L.displayMode}</p>
					<div class="segmented" role="radiogroup" aria-label={L.displayMode}>
						{#each MODES as m (m)}<button type="button" role="radio" aria-checked={display.mode === m} onclick={() => set('mode', m)}>{L.modes[m]}</button>{/each}
					</div>
					<p class="eyebrow">{L.displayMotion}</p>
					<div class="segmented" role="radiogroup" aria-label={L.displayMotion}>
						{#each MOTIONS as m (m)}<button type="button" role="radio" aria-checked={display.motion === m} onclick={() => set('motion', m)}>{L.motions[m]}</button>{/each}
					</div>
				</section>
			</div>

			<div class="col">
				<section class="card">
					<h2>{L.myData}</h2>
					<p class="note">{L.exportLead}</p>
					<button type="button" class="ghost" onclick={exportAll}>{L.exportAccount}</button>
				</section>

				<section class="card">
					<h2>{L.passwordTitle}</h2>
					<form onsubmit={changePassword}>
						<label>{L.passwordCurrent}<input type="password" autocomplete="current-password" required bind:value={current} /></label>
						<label>{L.passwordNewLabel}<input type="password" autocomplete="new-password" minlength="10" required bind:value={next} /><small>{L.passwordHint}</small></label>
						{#if pwError}<p class="error">{pwError}</p>{/if}
						<div class="actions">
							<button type="submit" class="primary">{L.passwordChange}</button>
							<button type="button" class="ghost" onclick={endOthers}>{L.signOutOthers}</button>
						</div>
					</form>
				</section>

				<section class="card">
					<h2>{L.deleteTitle}</h2>
					<p class="note">{L.deleteWarn}</p>
					<form onsubmit={askDelete}>
						<label>{L.password}<input type="password" autocomplete="current-password" required bind:value={delPassword} /></label>
						{#if delError}<p class="error">{delError}</p>{/if}
						<button type="submit" class="ghost warn">{L.deleteForever}</button>
					</form>
					{#if deleting}
						<div class="confirm" role="alertdialog" aria-label={L.deleteTitle}>
							<p>{L.deleteConfirm}</p>
							<div class="actions">
								<button type="button" class="danger" onclick={deleteAccount}>{L.deleteForever}</button>
								<button type="button" class="ghost" onclick={() => (deleting = false)}>{L.confirmCancel}</button>
							</div>
						</div>
					{/if}
				</section>
			</div>
		</div>
	</div>
</SignedIn>

<style>
	.account-page { max-width: 1080px; margin: 0 auto; padding: 16px 0 32px; }
	.head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
	h1 { font-family: var(--font-display); font-size: clamp(30px, 4vw, 40px); font-weight: 600; letter-spacing: -0.02em; margin: 0 0 6px; }
	.who { margin: 0; color: var(--text-2); }
	.cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; align-items: start; }
	.col { display: flex; flex-direction: column; gap: 16px; }
	.card + .card { margin-top: 0; }
	h2 { font-family: var(--font-sans); font-size: 18px; font-weight: 650; margin: 0 0 10px; }
	.note { margin: 0 0 14px; font-size: 14.5px; color: var(--text-2); }
	dl { display: grid; grid-template-columns: max-content 1fr; gap: 10px 20px; margin: 0 0 18px; font-size: 15px; }
	dt { color: var(--text-2); }
	dd { margin: 0; display: flex; align-items: center; gap: 10px; font-variant-numeric: tabular-nums; }
	.bar { width: 120px; height: 6px; border-radius: 3px; background: var(--surface-sunk); overflow: hidden; }
	.bar span { display: block; height: 100%; background: var(--accent); transform-origin: left; }
	.actions { display: flex; flex-wrap: wrap; gap: 10px; }
	.palettes { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; margin-bottom: 18px; }
	.palettes button { justify-content: flex-start; gap: 12px; min-height: 56px; padding: 8px 12px; text-align: left; white-space: normal; min-width: 0;
		background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: var(--r-md); }
	.palettes button[aria-checked='true'] { border-color: var(--accent-strong); box-shadow: inset 0 0 0 1px var(--accent-strong); }
	/* each swatch shows its own palette: data-theme on the button scopes the tokens */
	.swatch { flex: none; width: 34px; height: 34px; border-radius: 50%; background: var(--bg); box-shadow: 0 0 0 1px var(--border-strong);
		display: grid; place-items: center; }
	.swatch span { width: 14px; height: 14px; border-radius: 50%; background: var(--accent); }
	.txt { min-width: 0; }
	.txt b { display: block; font-size: 14.5px; }
	.txt small { display: block; font-size: 12.5px; color: var(--text-3); font-weight: 400; }
	.eyebrow { margin: 0 0 8px; }
	.segmented { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--r-sm); background: var(--surface-2); margin-bottom: 16px; }
	.segmented button { min-height: 36px; padding: 0 14px; border: none; background: transparent; font-weight: 500; font-size: var(--fs-sm); }
	.segmented button[aria-checked='true'] { background: var(--surface); box-shadow: var(--shadow-1); font-weight: var(--fw-bold); }
	form label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 650; color: var(--text-2); margin-bottom: 12px; }
	form label small { font-weight: 400; color: var(--text-3); font-size: 13px; }
	form input { font-weight: 400; width: 100%; box-sizing: border-box; }
	.warn { color: var(--danger); border-color: var(--danger); }
	.confirm { margin-top: 14px; padding: 14px 16px; border-radius: var(--r-md); background: var(--danger-soft); }
	.confirm p { margin: 0 0 10px; }
	.status { margin-bottom: 16px; }
	@media (max-width: 860px) { .cols { grid-template-columns: 1fr; } }
</style>
