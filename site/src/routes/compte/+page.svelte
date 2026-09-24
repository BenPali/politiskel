<!-- One's account: who, the groups, the data held, the password, deletion. -->
<script>
	import { goto } from '$app/navigation';
	import { L } from '$lib/i18n/fr.js';
	import { api, apiError } from '$lib/api.js';
	import { session, refresh, signOut } from '$lib/session.svelte.js';
	import SignedIn from '$lib/components/SignedIn.svelte';

	let status = $state('');
	let current = $state('');
	let next = $state('');
	let pwError = $state('');
	let delPassword = $state('');
	let delError = $state('');

	const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();

	async function exportAll() {
		const r = await api('GET', '/api/me/export');
		if (!r.ok) return (status = apiError(r));
		const blob = new Blob([JSON.stringify(r.data, null, 1) + '\n'], { type: 'application/json' });
		const a = Object.assign(document.createElement('a'), {
			href: URL.createObjectURL(blob),
			download: slug(session.me.username) + '-compte.json'
		});
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(a.href), 1000);
	}

	async function endOthers() {
		const r = await api('DELETE', '/api/me/sessions/others');
		status = r.ok ? L.signedOutOthers : apiError(r);
	}

	async function changePassword(e) {
		e.preventDefault();
		const r = await api('POST', '/api/me/password', { current, new: next });
		if (!r.ok) return (pwError = r.data?.error === 'bad_credentials' ? L.passwordWrong : apiError(r));
		pwError = '';
		current = next = '';
		status = L.passwordChanged;
	}

	async function leave() {
		await signOut();
		goto('/');
	}

	async function deleteAccount(e) {
		e.preventDefault();
		if (!confirm(L.deleteConfirm)) return;
		const r = await api('DELETE', '/api/me', { password: delPassword });
		if (!r.ok) return (delError = apiError(r));
		await refresh();
		goto('/');
	}
</script>

<svelte:head><title>{L.tabAccount} · Politiskel</title></svelte:head>

<SignedIn>
	<section class="account-page">
		<h1>{L.tabAccount}</h1>
		{#if status}<p class="status">{status}</p>{/if}

		<article class="card">
			<h2>{L.myProfile}</h2>
			<dl class="profile-summary">
				<dt>{L.username}</dt><dd>{session.me.username}</dd>
				<dt>{L.tabGroups}</dt><dd>{session.me.groups.map((g) => g.name).join(', ') || '—'}</dd>
			</dl>
			<div class="actions">
				<a href="/questionnaire" class="button primary">{L.quizOpen}</a>
				<a href="/boussole" class="button ghost">{L.seeOnCompass}</a>
			</div>
		</article>

		<article class="card">
			<h2>{L.myData}</h2>
			<p class="note">{L.serverNoteIn}</p>
			<div class="actions">
				<button type="button" class="ghost" onclick={exportAll}>{L.exportAccount}</button>
				<button type="button" class="ghost" onclick={endOthers}>{L.signOutOthers}</button>
				<button type="button" class="ghost" onclick={leave}>{L.signOut}</button>
			</div>
		</article>

		<article class="card">
			<h2>{L.passwordTitle}</h2>
			<form class="row" onsubmit={changePassword}>
				<input type="password" placeholder={L.passwordCurrent} autocomplete="current-password" required bind:value={current} />
				<input type="password" placeholder={L.passwordNew} autocomplete="new-password" required bind:value={next} />
				<button type="submit" class="ghost">{L.passwordChange}</button>
			</form>
			{#if pwError}<p class="error">{pwError}</p>{/if}
			<p class="note">{L.passwordNote}</p>
		</article>

		<article class="card">
			<h2>{L.deleteTitle}</h2>
			<p>{L.deleteWarn}</p>
			<form class="row" onsubmit={deleteAccount}>
				<input type="password" placeholder={L.password} autocomplete="current-password" required bind:value={delPassword} />
				<button type="submit" class="ghost danger">{L.deleteAccount}</button>
			</form>
			{#if delError}<p class="error">{delError}</p>{/if}
		</article>
	</section>
</SignedIn>
