<!-- The group on show, after the design: who owns it and how many, its name,
     then the three choices that frame the compass — which group, which
     country, which reading — and the invitation. Each member's pill follows
     that member on the compass. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { session } from '$lib/session.svelte.js';
	import { board, chooseGroup, currentGroup, loadMembers, savePrefs } from '$lib/compass/board.svelte.js';
	import { COUNTRIES, VIEWS } from '$lib/compass/model.js';
	import MemberFlag from '$lib/components/MemberFlag.svelte';

	/** selectedId: the member followed; onpick(i): a pill was pressed */
	let { selectedId = null, onpick } = $props();

	const g = $derived(currentGroup());
	let busy = $state(false);
	let copied = $state(false);

	async function switchTo(e) {
		const v = e.currentTarget.value;
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
			setTimeout(() => (copied = false), 2400);
		} catch {
			prompt(L.invite, link);
		}
	}
</script>

<section class="group-board card" aria-label={L.groupLabel}>
	<div class="top">
		<div class="title">
			<p class="eyebrow">
				{#if g}{L.groupEyebrow(g.members, g.owner)}{:else}{L.groupNone}{/if}
				<a href={g ? '/groupes/' + g.id : '/groupes'}>{L.manageGroupsShort}</a>
			</p>
			<h1>{g ? g.name : session.me.groups.length ? L.groupAloneShort : L.groupAloneLead}</h1>
		</div>
		<div class="frame">
			{#if session.me.groups.length}
				<label>{L.groupLabel}
					<select disabled={busy} value={g ? String(g.id) : 'alone'} onchange={switchTo}>
						{#each session.me.groups as x (x.id)}<option value={String(x.id)}>{x.name} ({x.members})</option>{/each}
						<option value="alone">{L.groupNone}</option>
					</select>
				</label>
			{/if}
			<label>{L.optCountry}
				<select bind:value={board.country} onchange={savePrefs}>
					{#each COUNTRIES as c (c.code)}<option value={c.code}>{c.name}</option>{/each}
				</select>
			</label>
			<label class="wide">{L.optView}
				<select bind:value={board.view} onchange={savePrefs}>
					{#each VIEWS as v (v.key)}<option value={v.key} disabled={v.planned}>{L.views[v.key].name}</option>{/each}
				</select>
			</label>
			{#if g}
				<button type="button" class="ghost" onclick={invite}>{copied ? L.inviteCopiedShort : L.inviteShort}</button>
			{/if}
		</div>
	</div>
	{#if g && board.members.length}
		<div class="pills" role="group" aria-label={L.membersTitle}>
			{#each board.members as p, i (p.id)}
				<button type="button" class="member-pill" aria-pressed={selectedId === p.id} onclick={() => onpick(i)}>
					<MemberFlag {p} size="pill" />{p.alias}
					{#if p.me}<span class="you">{L.you}</span>{/if}
				</button>
			{/each}
		</div>
	{/if}
</section>

<style>
	.group-board { display: flex; flex-direction: column; gap: 18px; padding: 22px 24px; margin-bottom: var(--sp-5); }
	.top { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--sp-5); }
	.title { flex: 1 1 auto; min-width: 0; }
	.eyebrow { margin: 0; display: flex; gap: 12px; align-items: baseline; }
	.eyebrow a { text-transform: none; letter-spacing: 0; font-weight: 600; font-size: 13px; color: var(--accent-ink); }
	h1 { font-family: var(--font-display); font-size: 30px; font-weight: 600; letter-spacing: -0.015em; margin: 4px 0 0; line-height: 1.15; }
	.frame { display: flex; flex: none; align-items: flex-end; gap: 12px; }
	.frame label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 650; color: var(--text-2); }
	.frame select { min-width: 140px; max-width: 220px; height: 44px; font-size: 15px; font-weight: 400; }
	.frame .wide select { min-width: 250px; max-width: 300px; }
	.pills { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 16px; border-top: 1px solid var(--border); }
	.member-pill { height: 40px; min-height: 40px; padding: 0 14px 0 6px; gap: 8px; border-radius: var(--r-pill);
		border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 14px; font-weight: 500;
		transition: transform var(--dur-instant) var(--ease-out), border-color var(--dur-instant); }
	.member-pill:hover { border-color: var(--border-strong); background: var(--bg); }
	.member-pill:active { transform: scale(.97); }
	.member-pill[aria-pressed='true'] { border-color: var(--accent); background: var(--accent-soft); font-weight: 650; }
	.you { font-size: 12px; color: var(--accent-ink); font-weight: 650; }
	@media (max-width: 1100px) {
		.top { flex-wrap: wrap; }
		.frame { flex-wrap: wrap; }
	}
	@media (max-width: 860px) {
		.group-board { padding: 18px 16px; }
		h1 { font-size: 24px; }
		.frame, .frame label, .frame select, .frame .wide select { width: 100%; min-width: 0; max-width: none; }
	}
</style>
