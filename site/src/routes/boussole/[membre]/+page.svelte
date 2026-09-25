<!-- A member's page: the compass with them selected (the proximity rings,
     lines to their nearest parties), and beside it their card — flag, motto
     and key concepts, every party by distance, the questionnaire's readings,
     the Politiskel flag and its legend. It has its own address, which the
     group can share. -->
<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { L } from '$lib/i18n/fr.js';
	import { board } from '$lib/compass/board.svelte.js';
	import { rankParties, hasPolitiscales, offReason } from '$lib/compass/model.js';
	import { PolitiExtract } from '$lib/model.js';
	import SignedIn from '$lib/components/SignedIn.svelte';
	import Board from '$lib/components/Board.svelte';
	import Distances from '$lib/components/Distances.svelte';
	import Readings from '$lib/components/Readings.svelte';
	import FlagFigure from '$lib/components/FlagFigure.svelte';
	import MemberFlag from '$lib/components/MemberFlag.svelte';

	const id = $derived(page.params.membre);
	const index = $derived(board.members.findIndex((p) => p.id === id));

	function onpick(kind, i) {
		if (kind === 'profile') {
			const next = board.members[i];
			return goto(next.id === id ? '/boussole' : '/boussole/' + encodeURIComponent(next.id));
		}
		goto('/boussole');
	}
</script>

<svelte:head><title>{id} · {L.tabCompass} · Politiskel</title></svelte:head>

<SignedIn>
	<Board selected={index >= 0 ? { kind: 'profile', i: index } : null} {onpick}>
		{#snippet aside({ computed, refs, limits, country })}
			<p><a href="/boussole">{L.memberBack}</a></p>
			{#if index < 0}
				<div class="card"><p class="lead">{L.memberUnknown(id)}</p></div>
			{:else}
				{@const { p, c } = computed[index]}
				{@const concepts = hasPolitiscales(p) ? PolitiExtract.keyConcepts(p, 3) : []}
				<div class="card" id="detail-card">
					<h2>{L.distancesOf}<span>{p.alias}</span></h2>
					<div class="id-card">
						{#if p.flag}<MemberFlag {p} size="lg" captureOnly />{/if}
						<div class="meta">
							<p class="d" class:muted={!p.slogan}>
								{p.slogan ? p.slogan.join(' · ') : hasPolitiscales(p) ? L.noMotto : L.nativeMotto}
							</p>
							{#if hasPolitiscales(p)}
								<ul class="concepts">
									{#each concepts as k}
										<li><b>{L.pole[k.key]}</b><i> {k.intensity} · {L.band[k.band]}</i></li>
									{:else}
										<li>{L.balancedProfile}</li>
									{/each}
								</ul>
							{/if}
						</div>
					</div>
					<Distances
						rows={c.off ? [] : rankParties(c, refs)}
						{limits}
						colLabel={L.colParty}
						empty={c.off ? (c.native && board.view === 'politiskel' ? L.nativeOffDetail([c.x === null && 'X', c.y === null && 'Y'].filter(Boolean)) : L.viewOffDetail) : L.nothingToCompare}
					/>
					{#if c.base?.quiz || c.quiz}
						<Readings c={c.base || c} {country} />
					{/if}
					<FlagFigure {p} />
					{#if p.me}
						<div class="actions">
							<a class="button {c.quiz ? 'ghost' : 'primary'}" href="/questionnaire">{c.quiz ? L.quizEdit : L.quizOpen}</a>
						</div>
					{/if}
				</div>
			{/if}
		{/snippet}
	</Board>
</SignedIn>

<style>
	.muted { color: var(--text-3); }
</style>
