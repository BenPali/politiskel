<!-- Sign up. On a closed site it takes an invitation waiting in this tab
     (left by /rejoindre/<code>), and explains otherwise. -->
<script>
	import { goto } from '$app/navigation';
	import { offerTourAfterSignup } from '$lib/tour.svelte.js';
	import { L } from '$lib/i18n/fr.js';
	import { toast, dismissErrors } from '$lib/toast.svelte.js';
	import { passwordMissing } from '$lib/password.js';
	import { api, apiError } from '$lib/api.js';
	import { session, refresh } from '$lib/session.svelte.js';
	import { pendingInvite } from '$lib/invite.js';
	import { readGuest, writeGuest } from '$lib/quiz/answers.svelte.js';

	let username = $state('');
	let password = $state('');
	let consent = $state(false);
	let busy = $state(false);
	let invite = $state(null);
	/* said while typing, not only once sent */
	const missing = $derived(passwordMissing(password));
	/* an error here is about what was just typed: it goes after a while */
	const ERROR_MS = 7000;

	$effect(() => {
		invite = pendingInvite();
	});
	$effect(() => {
		if (session.ready && session.me) goto('/boussole', { replaceState: true });
	});

	async function submit(e) {
		e.preventDefault();
		if (!consent) return toast(L.apiErrors.consent_required, { kind: 'error', ms: ERROR_MS });
		if (missing) return toast(L.apiErrors.password_short, { kind: 'error', ms: ERROR_MS });
		busy = true;
		const r = await api('POST', '/api/register', { username, password, consent: true, invite: invite || undefined });
		busy = false;
		if (!r.ok) return toast(apiError(r), { kind: 'error', ms: ERROR_MS });
		dismissErrors();
		/* a trial profile in this browser becomes the new account's */
		const g = readGuest();
		if (g && (g.politiscales || Object.keys(g.answers).length)) {
			const put = await api('PUT', '/api/me/profile', { politiscales: g.politiscales, answers: g.answers, flag: g.flag });
			if (put.ok) writeGuest(null);
		}
		await refresh();
		/* the tour, offered once to the account just made (as the server named it) */
		if (session.me) offerTourAfterSignup(session.me.username);
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
			<input type="password" placeholder={L.passwordNew} autocomplete="new-password" required bind:value={password}
				aria-invalid={password && missing ? 'true' : undefined} aria-describedby="password-hint" />
			<p id="password-hint" class="field-hint" class:ok={password && !missing} aria-live="polite">
				{!password ? L.passwordRule : missing ? L.passwordMissing(missing) : L.passwordLongEnough}
			</p>
			<label class="consent"><input type="checkbox" bind:checked={consent} /><span>{L.consent}</span></label>
			<button type="submit" class="primary" disabled={busy || !consent || missing > 0}>{L.register}</button>
			<p class="note">{L.serverNote}</p>
		</form>
	{/if}
	<p class="alt"><a href="/connexion">{L.navSignIn}</a> · <a href="/essai">{L.guestTry}</a></p>
</section>

<style>
	.field-hint { margin: -4px 0 4px; font-size: 13.5px; color: var(--text-3); }
	.field-hint.ok { color: var(--accent-ink); }
	input[aria-invalid='true'] { border-color: var(--danger); }
</style>
