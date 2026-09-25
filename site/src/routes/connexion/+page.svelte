<!-- Sign in. Afterwards, back to where the visitor was sent from (?suite=),
     else the compass. -->
<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { L } from '$lib/i18n/fr.js';
	import { toast } from '$lib/toast.svelte.js';
	import { api, apiError } from '$lib/api.js';
	import { session, refresh } from '$lib/session.svelte.js';

	let username = $state('');
	let password = $state('');
	let busy = $state(false);

	/* only a path on this site, never an address elsewhere */
	const next = () => {
		const s = page.url.searchParams.get('suite') || '';
		return s.startsWith('/') && !s.startsWith('//') ? s : '/boussole';
	};

	$effect(() => {
		if (session.ready && session.me) goto(next(), { replaceState: true });
	});

	async function submit(e) {
		e.preventDefault();
		busy = true;
		const r = await api('POST', '/api/login', { username, password });
		busy = false;
		if (!r.ok) return toast(apiError(r), { kind: 'error' });
		await refresh();
		goto(next());
	}
</script>

<svelte:head><title>{L.signInTitle} · Politiskel</title></svelte:head>

<section class="auth">
	<h1>{L.signInTitle}</h1>
	<form class="card" onsubmit={submit}>
		<input type="text" placeholder={L.username} autocomplete="username" maxlength="24" required bind:value={username} />
		<input type="password" placeholder={L.password} autocomplete="current-password" required bind:value={password} />
		<button type="submit" class="primary" disabled={busy}>{L.signIn}</button>
	</form>
	<p class="alt">
		<a href="/inscription">{L.navSignUp}</a> · <a href="/essai">{L.guestTry}</a>
	</p>
</section>
