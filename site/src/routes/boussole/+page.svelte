<!-- The compass of the group on show. Picking a member follows them on the
     chart (their proximity rings, their nearest parties) and highlights
     their row; their page opens from the table. Picking a party lists the
     members nearest to it. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { board } from '$lib/compass/board.svelte.js';
	import { rankProfiles } from '$lib/compass/model.js';
	import SignedIn from '$lib/components/SignedIn.svelte';
	import Board from '$lib/components/Board.svelte';
	import ProfilesTable from '$lib/components/ProfilesTable.svelte';
	import Distances from '$lib/components/Distances.svelte';

	/** { kind: 'profile' | 'party', i } or null */
	let selected = $state(null);
	const same = (kind, i) => selected && selected.kind === kind && selected.i === i;

	/* onpick(null): a click on nothing, or Escape, lets go */
	function onpick(kind, i) {
		selected = kind === null || same(kind, i) ? null : { kind, i };
	}
	/* a party index belongs to one reading's table, a member index to one
	   group: either change clears the selection */
	$effect(() => {
		board.view;
		board.country;
		board.groupId;
		selected = null;
	});
	const selectedId = $derived(selected?.kind === 'profile' ? board.members[selected.i]?.id : null);
</script>

<svelte:head><title>{L.tabCompass} · Politiskel</title></svelte:head>

<SignedIn guest>
	<Board {selected} {onpick}>
		{#snippet aside({ computed, refs, limits })}
			<ProfilesTable {computed} {refs} {limits} viewKey={board.view} {selectedId} onpick={(i) => onpick('profile', i)} />
			{#if selected?.kind === 'party' && refs[selected.i]}
				<div class="card party-card" id="detail-card">
					<h2>{L.profilesNear}<span>{refs[selected.i].name}</span></h2>
					<Distances rows={rankProfiles(refs[selected.i], computed)} {limits} colLabel={L.colProfile} empty={L.nothingToCompare} />
				</div>
			{/if}
		{/snippet}
	</Board>
</SignedIn>

<style>
	.party-card { margin-top: var(--sp-5); }
	.party-card h2 { font-family: var(--font-sans); font-size: 17px; font-weight: 650; }
</style>
