<!-- The member's groups: a card each, its members' flags stacked, the way
     to its compass or its page; two actions above, a new group and an
     invitation link, each opening in place; and the directory of listed
     groups, searchable, where one asks to join. -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { L } from '$lib/i18n/fr.js';
	import { api, apiError } from '$lib/api.js';
	import { session, refresh } from '$lib/session.svelte.js';
	import { board, showGroup } from '$lib/compass/board.svelte.js';
	import { fromMember } from '$lib/compass/model.js';
	import { toast } from '$lib/toast.svelte.js';
	import SignedIn from '$lib/components/SignedIn.svelte';
	import MemberFlag from '$lib/components/MemberFlag.svelte';

	/** group id → its members, loaded for the flags */
	let members = $state({});
	let name = $state('');
	let code = $state('');
	/** which panel is open: 'create', 'join' or null */
	let panel = $state(null);
	let q = $state('');
	let busy = $state(false);
	let leaving = $state(null);
	let origin = $state('');
	onMount(() => (origin = location.origin));

	/* the directory: listed groups, and where one stands in each */
	let listed = $state(null);
	async function loadDirectory() {
		const r = await api('GET', '/api/directory');
		listed = r.ok ? r.data : [];
	}
	$effect(() => {
		if (session.me && listed === null) loadDirectory();
	});
	async function ask(g) {
		const r = await api(g.requested ? 'DELETE' : 'POST', '/api/groups/' + g.id + '/request');
		if (!r.ok) return toast(apiError(r), { kind: 'error' });
		toast(g.requested ? L.directoryWithdrawn(g.name) : L.directorySent(g.name));
		loadDirectory();
	}

	$effect(() => {
		if (!session.me) return;
		for (const g of session.me.groups)
			if (!members[g.id])
				api('GET', '/api/groups/' + g.id + '/profiles').then((r) => {
					if (r.ok) members[g.id] = r.data.map(fromMember);
				});
	});

	function compass(id) {
		showGroup(id);
		goto('/boussole');
	}
	async function create(e) {
		e.preventDefault();
		busy = true;
		const r = await api('POST', '/api/groups', { name: name.trim() });
		busy = false;
		if (!r.ok) return toast(apiError(r), { kind: 'error' });
		await refresh();
		toast(L.groupCreated(r.data.name));
		goto('/groupes/' + r.data.id);
	}
	/* a pasted link or a bare code: the code is the link's last segment */
	function follow(e) {
		e.preventDefault();
		const c = code.trim().replace(/\/+$/, '').split('/').pop();
		if (c) goto('/rejoindre/' + encodeURIComponent(c));
	}
	async function leave(g) {
		const r = await api('POST', '/api/groups/' + g.id + '/leave');
		leaving = null;
		if (!r.ok) return toast(apiError(r), { kind: 'error' });
		toast(L.leftGroup(g.name));
		board.loaded = false;
		await refresh();
	}
	const found = $derived(
		(listed || []).filter((g) => !q.trim() || g.name.toLocaleLowerCase('fr').includes(q.trim().toLocaleLowerCase('fr')))
	);
	/* a group's members, flags first, the viewer last: the stack reads "who is there" */
	const stackOf = (g) => (members[g.id] || []).slice().sort((a, b) => (a.me ? 1 : 0) - (b.me ? 1 : 0));
</script>

<svelte:head><title>{L.tabGroups} · Politiskel</title></svelte:head>

<SignedIn>
	<div class="groups">
		<header class="top">
			<div>
				<h1>{L.groupsTitle}</h1>
				<p class="lead">{L.groupsLeadShort}</p>
			</div>
			<div class="top-actions" data-tour="groups">
				<button type="button" class={panel === 'create' ? 'primary' : 'ghost'} aria-expanded={panel === 'create'}
					onclick={() => (panel = panel === 'create' ? null : 'create')}>
					<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
					{L.groupNew}
				</button>
				<button type="button" class={panel === 'join' ? 'primary' : 'ghost'} aria-expanded={panel === 'join'}
					onclick={() => (panel = panel === 'join' ? null : 'join')}>
					<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 9.5l3-3M5 11a2.5 2.5 0 0 1 0-3.5L6.5 6M11 5a2.5 2.5 0 0 1 0 3.5L9.5 10" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" /></svg>
					{L.groupJoinLink}
				</button>
			</div>
		</header>

		{#if panel === 'create'}
			<form class="card panel" onsubmit={create}>
				<div>
					<h2>{L.groupCreateTitle}</h2>
					<p class="note">{L.groupCreateNote}</p>
				</div>
				<div class="inline">
					<label class="sr" for="g-name">{L.groupName}</label>
					<input id="g-name" type="text" bind:value={name} maxlength="60" required placeholder={L.groupName} />
					<button type="submit" class="primary" disabled={busy || !name.trim()}>{L.groupCreate}</button>
				</div>
			</form>
		{:else if panel === 'join'}
			<form class="card panel" onsubmit={follow}>
				<div>
					<h2>{L.joinTitle}</h2>
					<p class="note">{L.joinNote}</p>
				</div>
				<div class="inline">
					<label class="sr" for="g-code">{L.joinPlaceholder}</label>
					<input id="g-code" type="text" bind:value={code} placeholder={origin + '/rejoindre/…'} />
					<button type="submit" class="primary" disabled={!code.trim()}>{L.joinGo}</button>
				</div>
			</form>
		{/if}

		<section class="mine" aria-label={L.groupsTitle}>
			{#each session.me.groups as g, i (g.id)}
				<article class="card group" style="--i: {i}">
					<div class="stack" aria-hidden="true">
						{#each stackOf(g).slice(0, 7) as p, j (p.id)}<span style="--j: {j}"><MemberFlag {p} size="pill" /></span>{/each}
						{#if g.members > 7}<span class="more">+{g.members - 7}</span>{/if}
					</div>
					<h2><a href="/groupes/{g.id}">{g.name}</a></h2>
					<p class="meta">
						<span>{L.memberCount(g.members)}</span>
						{#if g.owner}<span class="badge">{L.ownerYou}</span>{:else if g.owner_name}<span>{L.ownerIs(g.owner_name)}</span>{/if}
						{#if g.listed}<span class="badge soft">{L.listedBadge}</span>{/if}
						{#if g.owner && g.requests}<a class="badge ask" href="/groupes/{g.id}">{L.requestsBadge(g.requests)}</a>{/if}
					</p>
					<div class="actions">
						<button type="button" class="primary" onclick={() => compass(g.id)}>{L.seeOnCompass}</button>
						<a class="button ghost" href="/groupes/{g.id}">{g.owner ? L.ownerManage : L.membersTitle}</a>
						{#if !g.owner}<button type="button" class="skip" onclick={() => (leaving = g.id)}>{L.leave}</button>{/if}
					</div>
					{#if leaving === g.id}
						<div class="confirm" role="alertdialog" aria-label={L.leave}>
							<p>{L.leaveConfirm(g.name)}</p>
							<div class="actions">
								<button type="button" class="danger" onclick={() => leave(g)}>{L.leave}</button>
								<button type="button" class="ghost" onclick={() => (leaving = null)}>{L.confirmCancel}</button>
							</div>
						</div>
					{/if}
				</article>
			{:else}
				<div class="card empty">
					<svg width="56" height="56" viewBox="0 0 32 32" aria-hidden="true"><circle cx="11" cy="16" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2" /><circle cx="21" cy="16" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2" /></svg>
					<p>{L.noGroups}</p>
					<div class="actions">
						<button type="button" class="primary" onclick={() => (panel = 'create')}>{L.groupNew}</button>
						<button type="button" class="ghost" onclick={() => (panel = 'join')}>{L.groupJoinLink}</button>
					</div>
				</div>
			{/each}
		</section>

		<section class="directory" aria-label={L.directoryTitle}>
			<div class="dir-head">
				<div>
					<h2>{L.directoryTitle}</h2>
					<p class="note">{L.directoryLead}</p>
				</div>
				{#if listed && listed.length > 4}
					<input class="search" type="search" bind:value={q} placeholder={L.directorySearch} aria-label={L.directorySearch} />
				{/if}
			</div>
			{#if listed === null}
				<p class="status">{L.loadingPage}</p>
			{:else if !listed.length}
				<p class="card dir-empty">{L.directoryEmpty}</p>
			{:else}
				<ul class="dir-list">
					{#each found as g (g.id)}
						<li class="card">
							<span class="dir-name"><b>{g.name}</b><small>{L.memberCount(g.members)}</small></span>
							{#if g.member}
								<a class="dir-member" href="/groupes/{g.id}">{L.directoryMember}</a>
							{:else}
								<button type="button" class={g.requested ? 'skip' : 'ghost'} onclick={() => ask(g)}>
									{g.requested ? L.directoryWithdraw : L.directoryAsk}
								</button>
							{/if}
						</li>
					{:else}
						<li class="card dir-empty">{L.directoryNoMatch}</li>
					{/each}
				</ul>
				<p class="fine">{L.directoryAskNote}</p>
			{/if}
		</section>
	</div>
</SignedIn>

<style>
	.groups { max-width: 1080px; margin: 0 auto; padding: 16px 0 40px; }
	.top { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; margin-bottom: 24px; }
	h1 { font-family: var(--font-display); font-size: clamp(30px, 4vw, 42px); font-weight: 600; letter-spacing: -0.02em; margin: 0 0 8px; }
	.lead { color: var(--text-2); margin: 0; max-width: 56ch; }
	.top-actions { display: flex; gap: 10px; flex-wrap: wrap; }
	.top-actions button { gap: 8px; }
	.panel { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 20px; align-items: center; margin-bottom: 24px;
		animation: open var(--dur-base) var(--ease-out) both; }
	@keyframes open { from { opacity: 0; transform: translateY(-6px); } }
	.panel h2 { font-family: var(--font-sans); font-size: 17px; font-weight: 650; margin: 0 0 4px; }
	.inline { display: flex; gap: 10px; }
	.inline input { flex: 1 1 auto; min-width: 0; }
	.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
	.note { margin: 0; font-size: 14.5px; color: var(--text-2); }

	.mine { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
	.card + .card { margin-top: 0; }
	.group { display: flex; flex-direction: column; gap: 10px; animation: rise var(--dur-base) var(--ease-out) both;
		animation-delay: calc(var(--stagger) * var(--i)); transition: box-shadow var(--dur-instant), transform var(--dur-instant); }
	.group:hover { box-shadow: var(--shadow-2); transform: translateY(-2px); }
	@keyframes rise { from { opacity: 0; transform: translateY(8px); } }
	.stack { display: flex; align-items: center; height: 30px; }
	.stack span { margin-left: -8px; border-radius: var(--r-pill); box-shadow: 0 0 0 2px var(--surface); display: block; line-height: 0; }
	.stack span:first-child { margin-left: 0; }
	.stack .more { margin-left: 6px; box-shadow: none; font-size: 13px; line-height: 1; color: var(--text-3); font-weight: 650; }
	.group h2 { font-family: var(--font-display); font-size: 22px; font-weight: 600; margin: 4px 0 0; letter-spacing: -0.01em; }
	.group h2 a { color: inherit; text-decoration: none; }
	.group h2 a:hover { color: var(--accent-ink); }
	.meta { margin: 0; color: var(--text-2); font-size: 14px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
	.badge.soft { background: var(--surface-2); color: var(--text-2); }
	.badge.ask { background: var(--pop); color: var(--text); text-decoration: none; }
	.actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: auto; padding-top: 6px; }
	.confirm { padding: 12px 14px; border-radius: var(--r-md); background: var(--danger-soft); }
	.confirm p { margin: 0 0 10px; }
	.empty { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 36px 24px; }
	.empty svg { color: var(--accent); }
	.empty p { margin: 0; max-width: 46ch; color: var(--text-2); }

	.directory { margin-top: 40px; }
	.dir-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
	.directory h2 { font-family: var(--font-display); font-size: 24px; font-weight: 600; margin: 0 0 6px; }
	.search { width: 260px; max-width: 100%; }
	.dir-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; }
	.dir-list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; }
	.dir-name b { display: block; font-size: 15.5px; }
	.dir-name small { display: block; color: var(--text-3); font-size: 13px; }
	.dir-list button { flex: none; min-height: 40px; }
	.dir-member { font-size: 14px; color: var(--accent-ink); font-weight: 600; }
	.dir-empty { color: var(--text-2); }
	.fine { margin: 12px 0 0; font-size: 13px; color: var(--text-3); }
	@media (max-width: 700px) {
		.panel { grid-template-columns: 1fr; }
		.inline { flex-direction: column; }
		.top-actions, .top-actions button { width: 100%; }
	}
</style>
