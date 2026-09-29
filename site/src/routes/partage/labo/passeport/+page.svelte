<!-- A prototype: one's own profile as a political passport. -->
<script>
	import { session } from '$lib/session.svelte.js';
	import { board } from '$lib/compass/board.svelte.js';
	import { COUNTRIES, fromMember, hasPolitiscales } from '$lib/compass/model.js';
	import { guestMember } from '$lib/quiz/answers.svelte.js';
	import { cardData } from '$lib/share/card.js';
	import { COPY } from '$lib/share/passport.js';
	import SignedIn from '$lib/components/SignedIn.svelte';
	import PassportBook from '$lib/components/PassportBook.svelte';

	const me = $derived(
		session.me
			? fromMember({ username: session.me.username, me: true, flag: session.me.profile.flag, politiscales: session.me.profile.politiscales, answers: session.me.profile.answers })
			: session.ready ? (guestMember() ? fromMember(guestMember()) : null) : null
	);
	const country = $derived(COUNTRIES.find((c) => c.code === board.country) || COUNTRIES[0]);
	const has = $derived(!!me && (hasPolitiscales(me) || Object.keys(me.answers || {}).length > 0));
	const data = $derived(has ? cardData(me, country) : null);
</script>

<svelte:head><title>{COPY.title} · Politiskel</title></svelte:head>

<SignedIn guest>
	<p class="lab">Prototype · <a href="/partage">retour au partage</a></p>
	{#if data}
		<PassportBook {data} />
	{:else}
		<p class="lead">Pas encore de profil : réponds à un questionnaire.</p>
	{/if}
</SignedIn>

<style>
	.lab { margin: 0 0 16px; font-size: 14px; color: var(--text-3); }
	.lead { color: var(--text-2); }
</style>
