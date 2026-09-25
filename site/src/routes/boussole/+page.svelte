<!-- The compass of the group on show. A member leads to their page; a party
     is picked here, and the side then lists the members nearest to it. -->
<script>
	import { goto } from '$app/navigation';
	import { L } from '$lib/i18n/fr.js';
	import { board } from '$lib/compass/board.svelte.js';
	import { rankProfiles } from '$lib/compass/model.js';
	import SignedIn from '$lib/components/SignedIn.svelte';
	import Board from '$lib/components/Board.svelte';
	import ProfilesTable from '$lib/components/ProfilesTable.svelte';
	import Distances from '$lib/components/Distances.svelte';

	let party = $state(null);

	function onpick(kind, i) {
		if (kind === 'profile') return goto('/boussole/' + encodeURIComponent(board.members[i].id));
		party = party === i ? null : i;
	}
	/* a party index belongs to one reading's table: changing reading clears it */
	$effect(() => {
		board.view;
		board.country;
		party = null;
	});
</script>

<svelte:head><title>{L.tabCompass} · Politiskel</title></svelte:head>

<SignedIn>
	<Board selected={party === null ? null : { kind: 'party', i: party }} {onpick}>
		{#snippet aside({ computed, refs, limits })}
			<div class="card">
				<h2>{L.membersTitle}</h2>
				<ProfilesTable {computed} {refs} {limits} viewKey={board.view} />
			</div>
			{#if party !== null && refs[party]}
				<div class="card" id="detail-card">
					<h2>{L.profilesNear}<span>{refs[party].name}</span></h2>
					<Distances rows={rankProfiles(refs[party], computed)} {limits} colLabel={L.colProfile} empty={L.nothingToCompare} />
				</div>
			{/if}
		{/snippet}
	</Board>
</SignedIn>
