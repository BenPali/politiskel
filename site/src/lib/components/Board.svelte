<!-- The compass board both compass pages share: the group header, the
     settings, the chart on the left, and whatever the page puts on the
     right. It loads the group's members once the session is known. -->
<script>
	import { onMount } from 'svelte';
	import { L } from '$lib/i18n/fr.js';
	import { session } from '$lib/session.svelte.js';
	import { board, readPrefs, chooseGroup, loadMembers } from '$lib/compass/board.svelte.js';
	import { COUNTRIES, referencesOf, limitsOf, project, viewNotes } from '$lib/compass/model.js';
	import GroupHeader from '$lib/components/GroupHeader.svelte';
	import BoardControls from '$lib/components/BoardControls.svelte';
	import Compass from '$lib/components/Compass.svelte';

	/** aside: the right column, given the board's computed state */
	let { selected = null, onpick, aside } = $props();

	onMount(async () => {
		readPrefs();
		if (!board.loaded) {
			chooseGroup();
			await loadMembers();
		}
	});

	const country = $derived(COUNTRIES.find((c) => c.code === board.country) || COUNTRIES[0]);
	const refs = $derived(referencesOf(country, board.view));
	const limits = $derived(limitsOf(refs));
	const computed = $derived(board.members.map((p) => ({ p, c: project(p, board.view) })));
	const notes = $derived(viewNotes(board.view, country, refs, computed));
</script>

<GroupHeader />
<BoardControls />

{#if !board.loaded}
	<p class="status">{L.loadingPage}</p>
{:else}
	<div class="layout">
		<div>
			<div class="card">
				<h2>{L.chartTitle}</h2>
				<Compass {computed} {refs} {limits} viewKey={board.view} show={board.show} {selected} {onpick} />
				{#if notes.length}<p class="hint view-note">{notes.join(' ')}</p>{/if}
				<div class="legend">
					<span><i class="dot"></i>{L.legendProfiles}</span>
					<span><i class="diamond"></i>{L.legendParties(country.name)}</span>
				</div>
				<p class="hint">{L.boardHint}</p>
			</div>
		</div>
		<div>
			{@render aside({ computed, refs, limits, country })}
		</div>
	</div>
{/if}

<style>
	.legend { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 10px; font-size: 0.85rem; color: var(--text-2); }
	.legend span { display: inline-flex; align-items: center; gap: 7px; }
	.legend .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--series-1); }
	.legend .diamond { width: 8px; height: 8px; border: 1.5px solid var(--ref-ink); transform: rotate(45deg); }
</style>
