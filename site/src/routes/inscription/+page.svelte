<!-- Sign up. On a closed site it takes an invitation waiting in this tab
     (left by /rejoindre/<code>), and explains otherwise. -->
<script>
	import { goto } from '$app/navigation';
	import { L } from '$lib/i18n/fr.js';
	import { api, apiError } from '$lib/api.js';
	import { session, refresh } from '$lib/session.svelte.js';
	import { pendingInvite } from '$lib/invite.js';
	import { readGuest, writeGuest } from '$lib/quiz/answers.svelte.js';

	let username = $state('');
	let password = $state('');
	let consent = $state(false);
	let error = $state('');
	let busy = $state(false);
	let invite = $state(null);

	$effect(() => {
		invite = pendingInvite();
	});
	$effect(() => {
		if (session.ready && session.me) goto('/boussole', { replaceState: true });
	});

	async function submit(e) {
		e.preventDefault();
		if (!consent) return (error = L.apiErrors.consent_required);
		busy = true;
		const r = await api('POST', '/api/register', { username, password, consent: true, invite: invite || undefined });
		busy = false;
		if (!r.ok) return (error = apiError(r));
		/* a trial profile in this browser becomes the new account's */
		const g = readGuest();
		if (g && (g.politiscales || Object.keys(g.answers).length)) {
			const put = await api('PUT', '/api/me/profile', { politiscales: g.politiscales, answers: g.answers, flag: g.flag });
			if (put.ok) writeGuest(null);
		}
		await refresh();
		/* an invitation brought them here: back to it, to decide on joining */
		goto(invite ? '/rejoindre/' + encodeURIComponent(invite) : '/boussole');
	}
</script>

<svelte:head><title>{L.registerTitle} · Politiskel</title></svelte:head>

<section class="auth">
	<h1>{L.registerTitle}</h1>
	{#if !session.ready}
		<p class="status">{L.loadingPage}</p>
	{:else if session.signup === 'invite' && !invite}
		<p class="card lead">{L.signupInviteOnly}</p>
	{:else}
		<form class="card" onsubmit={submit}>
			{#if invite}<p class="status">{L.joinPending}</p>{/if}
			<input type="text" placeholder={L.username} autocomplete="username" maxlength="24" required bind:value={username} />
			<input type="password" placeholder={L.passwordNew} autocomplete="new-password" required bind:value={password} />
			<label class="consent"><input type="checkbox" bind:checked={consent} /><span>{L.consent}</span></label>
			<button type="submit" class="primary" disabled={busy || !consent}>{L.register}</button>
			{#if error}<p class="error">{error}</p>{/if}
			<p class="note">{L.serverNote}</p>
		</form>
	{/if}
	<p class="alt"><a href="/connexion">{L.navSignIn}</a> · <a href="/essai">{L.guestTry}</a></p>
</section>
