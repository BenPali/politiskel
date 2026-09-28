<!-- One's account, after the design: the profile and how far each theme
     has got; the display — palette, mode, motion; the data held and its
     export; the password; and deleting it all, asked again in place. -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { L } from '$lib/i18n/fr.js';
	import { passwordMissing } from '$lib/password.js';
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
	import { startTour } from '$lib/tour.svelte.js';
	import { board } from '$lib/compass/board.svelte.js';

	let current = $state('');
	let next = $state('');
	let delPassword = $state('');
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
	/* the PolitiScales import opens in place, under its row */
	let psOpen = $state(false);
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
	/* a consent of its own: the box shows what the server holds, and goes back if the call fails */
	async function setModelCheck(e) {
		/* held now: once the handler has awaited, the event no longer has it */
		const box = e.currentTarget;
		const on = box.checked;
		const r = await api('POST', '/api/me/model-check', { on });
		if (!r.ok) {
			box.checked = !on;
			return toast(apiError(r), { kind: 'error' });
		}
		session.me.model_check = on;
		toast(on ? L.modelCheck.on : L.modelCheck.off);
	}
	async function endOthers() {
		const r = await api('DELETE', '/api/me/sessions/others');
		r.ok ? toast(L.signedOutOthers) : toast(apiError(r), { kind: 'error' });
	}
	async function changePassword(e) {
		e.preventDefault();
		const r = await api('POST', '/api/me/password', { current, new: next });
		if (!r.ok) return toast(r.data?.error === 'bad_credentials' ? L.passwordWrong : apiError(r), { kind: 'error' });
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
		if (!r.ok) return toast(apiError(r), { kind: 'error' });
		await refresh();
		goto('/');
	}
</script>

<svelte:head><title>{L.tabAccount} · Politiskel</title></svelte:head>

<SignedIn>
	<div class="account-page">
		<header class="head">
			<div>
				<h1>{L.tabAccount}</h1>
				<p class="who">{L.accountSignedIn(session.me.username, session.me.groups.length)}</p>
			</div>
			<button type="button" class="ghost" onclick={leave}>{L.signOut}</button>
		</header>

		<!-- One column of settings, row by row: what it is on the left, the control on the right. -->
		<section>
			<h2>{L.accountSections.profile}</h2>
			<div class="row">
				<div class="lab"><h3>{L.profilePs}</h3><p>{me && hasPolitiscales(me) ? L.profilePsYes : L.profilePsNo}</p></div>
				<div class="ctl"><button type="button" class="ghost" aria-expanded={psOpen} onclick={() => (psOpen = !psOpen)}>{psOpen ? L.confirmCancel : me && hasPolitiscales(me) ? L.psUpdate : L.psImport}</button></div>
			</div>
			{#if psOpen}
				<div class="inset">
					<p class="note">{L.guestFromPsLead}</p>
					<CaptureImport initial={session.me.profile.politiscales} onsave={savePs} />
				</div>
			{/if}
			<div class="row">
				<div class="lab">
					<h3>{L.accountQuiz}</h3>
					<ul class="progress-list">
						{#each themes as t (t.key)}
							<li><span class="t">{t.name}</span><span class="bar" aria-hidden="true"><span style="transform: scaleX({t.total ? t.done / t.total : 0})"></span></span><span class="n">{t.done} / {t.total}</span></li>
						{/each}
					</ul>
				</div>
				<div class="ctl"><a href="/questionnaire" class="button ghost">{L.quizEdit}</a></div>
			</div>
			<div class="row">
				<div class="lab"><h3>{L.accountCard}</h3><p>{L.accountCardLead}</p></div>
				<div class="ctl"><a href="/boussole/{encodeURIComponent(session.me.username)}" class="button ghost">{L.openCard(session.me.username)}</a></div>
			</div>
		</section>

		<section>
			<h2>{L.accountSections.display}</h2>
			<div class="row stack">
				<div class="lab"><h3>{L.displayPalette}</h3><p>{L.paletteHints[display.palette]}</p></div>
				<div class="palettes" role="radiogroup" aria-label={L.displayPalette}>
					{#each PALETTES as p (p)}
						<button type="button" role="radio" aria-checked={display.palette === p} data-theme={p} data-mode={display.mode} title={L.paletteHints[p]} onclick={() => set('palette', p)}>
							<span class="swatch" aria-hidden="true"><span></span></span>{L.palettes[p]}
						</button>
					{/each}
				</div>
			</div>
			<div class="row">
				<div class="lab"><h3>{L.displayMode}</h3></div>
				<div class="ctl segmented" role="radiogroup" aria-label={L.displayMode}>
					{#each MODES as m (m)}<button type="button" role="radio" aria-checked={display.mode === m} onclick={() => set('mode', m)}>{L.modes[m]}</button>{/each}
				</div>
			</div>
			<div class="row">
				<div class="lab"><h3>{L.displayMotion}</h3></div>
				<div class="ctl segmented" role="radiogroup" aria-label={L.displayMotion}>
					{#each MOTIONS as m (m)}<button type="button" role="radio" aria-checked={display.motion === m} onclick={() => set('motion', m)}>{L.motions[m]}</button>{/each}
				</div>
			</div>
			<div class="row">
				<div class="lab"><h3>{L.tour.restart}</h3><p>{L.tour.restartLead}</p></div>
				<div class="ctl"><button type="button" class="ghost" onclick={startTour}>{L.accountRestart}</button></div>
			</div>
		</section>

		<section>
			<h2>{L.accountSections.data}</h2>
			<div class="row">
				<div class="lab"><h3>{L.accountExport}</h3><p>{L.exportLead}</p></div>
				<div class="ctl"><button type="button" class="ghost" onclick={exportAll}>{L.accountExportDo}</button></div>
			</div>
			<div class="row">
				<label class="lab" for="model-check"><h3>{L.modelCheck.title}</h3><p>{L.modelCheck.consent}</p>
					{#if session.me.admin}<p><a href="/admin/modele">{L.modelCheck.adminLink}</a></p>{/if}</label>
				<div class="ctl"><span class="switch"><input id="model-check" type="checkbox" role="switch" checked={session.me.model_check} onchange={setModelCheck} /><span class="sw-track" aria-hidden="true"></span></span></div>
			</div>
		</section>

		<section>
			<h2>{L.accountSections.security}</h2>
			<form class="row stack" onsubmit={changePassword}>
				<div class="lab"><h3>{L.passwordTitle}</h3><p>{L.passwordHint}</p></div>
				<div class="fields">
					<label>{L.passwordCurrent}<input type="password" autocomplete="current-password" required bind:value={current} /></label>
					<label>{L.passwordNewLabel}<input type="password" autocomplete="new-password" minlength="10" required bind:value={next}
						aria-invalid={next && passwordMissing(next) ? 'true' : undefined} />{#if next && passwordMissing(next)}<small aria-live="polite">{L.passwordMissing(passwordMissing(next))}</small>{/if}</label>
					<button type="submit" class="primary" disabled={!current || passwordMissing(next) > 0}>{L.passwordChange}</button>
				</div>
			</form>
			<div class="row">
				<div class="lab"><h3>{L.accountSessions}</h3><p>{L.accountSessionsLead}</p></div>
				<div class="ctl"><button type="button" class="ghost" onclick={endOthers}>{L.signOutOthers}</button></div>
			</div>
		</section>

		<section class="danger-zone">
			<h2>{L.accountSections.danger}</h2>
			{#if hasAnswers}
				<div class="row">
					<div class="lab"><h3>{L.eraseAllTitle}</h3><p>{L.eraseAllLead}</p></div>
					<div class="ctl"><button type="button" class="ghost warn" onclick={() => (erasing = true)}>{L.accountErase}</button></div>
				</div>
				{#if erasing}
					<div class="confirm" role="alertdialog" aria-label={L.eraseAllTitle}>
						<p>{L.eraseAllConfirm}</p>
						<div class="actions">
							<button type="button" class="danger" onclick={eraseAnswers}>{L.eraseAllTitle}</button>
							<button type="button" class="ghost" onclick={() => (erasing = false)}>{L.confirmCancel}</button>
						</div>
					</div>
				{/if}
			{/if}
			<form class="row stack" onsubmit={askDelete}>
				<div class="lab"><h3>{L.deleteTitle}</h3><p>{L.deleteWarn}</p></div>
				<div class="fields">
					<label>{L.password}<input type="password" autocomplete="current-password" required bind:value={delPassword} /></label>
					<button type="submit" class="ghost warn">{L.deleteForever}</button>
				</div>
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
</SignedIn>

<style>
	.account-page { max-width: 820px; margin: 0 auto; padding: 16px 0 48px; }
	.head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
	h1 { font-family: var(--font-display); font-size: clamp(30px, 4vw, 40px); font-weight: 700; letter-spacing: -0.02em; margin: 0 0 6px; }
	.who { margin: 0; color: var(--text-2); }
	section { margin-top: 36px; }
	h2 { font-family: var(--font-sans); font-size: 13px; font-weight: 700; letter-spacing: var(--tracking-caps, .06em); text-transform: uppercase;
		color: var(--text-3); margin: 0; padding-bottom: 10px; border-bottom: 1px solid var(--border-strong); }
	/* a setting: what it is, then its control; a hairline between settings */
	.row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 32px; align-items: center; padding: 18px 0; border-bottom: 1px solid var(--border); }
	.row.stack { grid-template-columns: minmax(0, 1fr); align-items: start; }
	.lab { min-width: 0; display: block; }
	.lab h3 { font-family: var(--font-sans); font-size: 15.5px; font-weight: 650; margin: 0; text-transform: none; letter-spacing: 0; color: var(--text); }
	.lab p { margin: 3px 0 0; font-size: 14px; line-height: 1.45; color: var(--text-2); max-width: 60ch; }
	.ctl { justify-self: end; }
	.inset { padding: 4px 0 18px; border-bottom: 1px solid var(--border); }
	.note { margin: 0 0 12px; font-size: 14px; color: var(--text-2); }
	.progress-list { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 6px; }
	.progress-list li { display: grid; grid-template-columns: minmax(0, 11em) minmax(60px, 160px) auto; gap: 12px; align-items: center; font-size: 14px; }
	.progress-list .t { color: var(--text-2); }
	.progress-list .n { font-variant-numeric: tabular-nums; color: var(--text-3); }
	.bar { height: 5px; border-radius: 3px; background: var(--surface-sunk); overflow: hidden; }
	.bar span { display: block; height: 100%; background: var(--accent); transform-origin: left; }
	/* palettes as a line of chips, each showing its own colours */
	.palettes { display: flex; flex-wrap: wrap; gap: 8px; }
	.palettes button { gap: 8px; min-height: 38px; padding: 0 12px 0 8px; font-size: 14px; font-weight: 550;
		background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: var(--r-pill); }
	.palettes button[aria-checked='true'] { border-color: var(--accent-strong); box-shadow: inset 0 0 0 1px var(--accent-strong); font-weight: 700; }
	.swatch { flex: none; width: 22px; height: 22px; border-radius: 50%; background: var(--bg); box-shadow: 0 0 0 1px var(--border-strong); display: grid; place-items: center; }
	.swatch span { width: 9px; height: 9px; border-radius: 50%; background: var(--accent); }
	.segmented { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--r-sm); background: var(--surface-2); }
	.segmented button { min-height: 34px; padding: 0 14px; border: none; background: transparent; font-weight: 500; font-size: 14px; }
	.segmented button[aria-checked='true'] { background: var(--surface); box-shadow: var(--shadow-1); font-weight: 700; }
	/* a switch: the real checkbox, invisible over a drawn track and knob */
	.switch { position: relative; display: inline-block; width: 46px; height: 26px; }
	.switch input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }
	.sw-track { position: absolute; inset: 0; border-radius: 13px; background: var(--border-strong); transition: background-color var(--dur-instant) var(--ease-out); }
	.sw-track::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: var(--surface);
		box-shadow: 0 1px 2px rgba(0,0,0,.25); transition: transform var(--dur-instant) var(--ease-out); }
	.switch input:checked + .sw-track { background: var(--accent-strong); }
	.switch input:checked + .sw-track::after { transform: translateX(20px); }
	.switch input:focus-visible + .sw-track { box-shadow: var(--focus-ring); }
	.fields { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
	.fields label { display: flex; flex-direction: column; gap: 6px; font-size: 13.5px; font-weight: 650; color: var(--text-2); flex: 1 1 220px; min-width: 0; }
	.fields label small { font-weight: 400; color: var(--danger); font-size: 13px; }
	.fields input { font-weight: 400; width: 100%; box-sizing: border-box; }
	.danger-zone h2 { color: var(--danger); border-color: var(--danger); }
	.warn { color: var(--danger); border-color: var(--danger); }
	.actions { display: flex; flex-wrap: wrap; gap: 10px; }
	.confirm { margin: 12px 0 0; padding: 14px 16px; border-radius: var(--r-md); background: var(--danger-soft); }
	.confirm p { margin: 0 0 10px; }
	@media (max-width: 640px) {
		.row { grid-template-columns: minmax(0, 1fr); align-items: start; }
		.ctl { justify-self: start; }
		.progress-list li { grid-template-columns: minmax(0, 1fr) 80px auto; }
	}
</style>
