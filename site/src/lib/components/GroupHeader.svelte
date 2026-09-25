<!-- Which group is on show, who is in it, and where to go: a menu to switch,
     invite (copies the link), manage. Each member chip leads to their page. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { session } from '$lib/session.svelte.js';
	import { board, chooseGroup, currentGroup, loadMembers } from '$lib/compass/board.svelte.js';
	import MemberFlag from '$lib/components/MemberFlag.svelte';

	const g = $derived(currentGroup());
	const others = $derived(session.me.groups.filter((x) => !g || x.id !== g.id));
	let busy = $state(false);
	let copied = $state(false);

	async function switchTo(e) {
		const v = e.currentTarget.value;
		e.currentTarget.value = '';
		busy = true;
		chooseGroup(v === 'alone' ? null : Number(v));
		await loadMembers();
		busy = false;
	}
	async function invite() {
		const link = location.origin + '/rejoindre/' + g.invite;
		try {
			await navigator.clipboard.writeText(link);
			copied = true;
		} catch {
			prompt(L.invite, link);
		}
	}
</script>

<section class="account group-head">
	<div class="group-top">
		<div class="group-title">
			<span class="eyebrow">{L.groupShown}</span>
			<h2>{g ? g.name : L.groupNone}</h2>
			<span class="count">{g ? L.memberCount(g.members) : session.me.groups.length ? L.groupAloneShort : L.groupAloneLead}</span>
		</div>
		<div class="group-actions">
			{#if others.length || g}
				<select aria-label={L.groupSwitch} disabled={busy} onchange={switchTo}>
					<option value="" disabled selected hidden>{L.groupSwitch}</option>
					{#each others as x (x.id)}<option value={x.id}>{x.name} ({x.members})</option>{/each}
					{#if g}<option value="alone">{L.groupNone}</option>{/if}
				</select>
			{/if}
			{#if g}
				<button type="button" class="ghost" title={L.invite} onclick={invite}>{copied ? L.inviteCopiedShort : L.inviteShort}</button>
				<a class="button ghost" href="/groupes/{g.id}">{L.manageGroupsShort}</a>
			{:else}
				<a class="button ghost" href="/groupes">{L.manageGroupsShort}</a>
			{/if}
		</div>
	</div>
	{#if g}
		<div class="group-members">
			{#each board.members as p (p.id)}
				<a class="member" class:me={p.me} href="/boussole/{encodeURIComponent(p.id)}" title={L.memberShow(p.alias)}>
					<MemberFlag {p} />
					<span>{p.alias}{p.me ? ' (' + L.you + ')' : ''}</span>
				</a>
			{/each}
		</div>
	{/if}
</section>

<style>
	.group-members .member { text-decoration: none; }
</style>
