<!-- An invitation is read, not followed: joining shows one's answers to every
     member, so the page names the group and asks first. Signed out, the code
     is kept for this tab and the visitor signs up or in. -->
<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { L } from '$lib/i18n/fr.js';
	import { api, apiError } from '$lib/api.js';
	import { session, refresh } from '$lib/session.svelte.js';
	import { keepInvite } from '$lib/invite.js';

	const code = $derived(page.params.code);
	let preview = $state(null);
	let error = $state('');

	$effect(() => {
		if (!session.ready) return;
		if (!session.me) {
			keepInvite(code);
			return;
		}
		api('GET', '/api/invites/' + encodeURIComponent(code)).then((r) => {
			if (!r.ok) return (error = apiError(r));
			if (r.data.member) {
				keepInvite(null);
				session.status = L.alreadyMember(r.data.name);
				return goto('/groupes/' + r.data.id, { replaceState: true });
			}
			preview = r.data;
		});
	});

	async function accept() {
		const r = await api('POST', '/api/groups/join', { code });
		if (!r.ok) return (error = apiError(r));
		keepInvite(null);
		await refresh();
		session.status = L.joined(r.data.name);
		goto('/groupes/' + r.data.id);
	}

	function decline() {
		keepInvite(null);
		goto('/groupes');
	}
</script>

<svelte:head><title>{L.inviteTitle} · Politiskel</title></svelte:head>

<section class="auth">
	<h1>{L.inviteTitle}</h1>
	{#if !session.ready}
		<p class="status">{L.loadingPage}</p>
	{:else if !session.me}
		<p class="card lead">{L.joinPending}</p>
		<div class="actions">
			<a class="button primary" href="/inscription">{L.navSignUp}</a>
			<a class="button ghost" href="/connexion?suite={encodeURIComponent('/rejoindre/' + code)}">{L.navSignIn}</a>
		</div>
	{:else if error}
		<p class="lead">{error}</p>
		<a class="button ghost" href="/groupes">{L.backToGroups}</a>
	{:else if preview}
		<article class="card">
			<p class="lead">{L.inviteAsk(preview.name, preview.members)}</p>
			<div class="actions">
				<button type="button" class="primary" onclick={accept}>{L.inviteAccept}</button>
				<button type="button" class="ghost" onclick={decline}>{L.inviteDecline}</button>
			</div>
		</article>
	{:else}
		<p class="status">{L.loadingPage}</p>
	{/if}
</section>
