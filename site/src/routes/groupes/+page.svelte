<!-- The member's groups, after the design: each with its members' flags and
     the way to its compass or its page; beside them, creating a group and
     following an invitation, which always shows the group before joining. -->
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
	let error = $state('');
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
		error = '';
		const r = await api(g.requested ? 'DELETE' : 'POST', '/api/groups/' + g.id + '/request');
		if (!r.ok) return (error = apiError(r));
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
		error = '';
		const r = await api('POST', '/api/groups', { name: name.trim() });
		busy = false;
		if (!r.ok) return (error = apiError(r));
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
		if (!r.ok) return (error = apiError(r));
		board.loaded = false;
		await refresh();
	}
</script>

<svelte:head><title>{L.tabGroups} · Politiskel</title></svelte:head>

<SignedIn>
	<div class="groups">
		<h1>{L.groupsTitle}</h1>
		<p class="lead">{L.groupsLeadShort}</p>
		{#if error}<p class="error" role="alert">{error}</p>{/if}
		<div class="cols">
			<div class="list">
				{#each session.me.groups as g (g.id)}
					<section class="card group">
						<h2><a href="/groupes/{g.id}">{g.name}</a></h2>
						<p class="meta">
							{L.memberCount(g.members)}
							{#if g.owner}<span class="badge">{L.ownerYou}</span>{:else if g.owner_name} · {L.ownerIs(g.owner_name)}{/if}
							{#if g.owner && g.requests}<a class="badge ask" href="/groupes/{g.id}">{L.requestsBadge(g.requests)}</a>{/if}
						</p>
						{#if members[g.id]}
							<div class="flags">
								{#each members[g.id] as p (p.id)}<span title={p.alias}><MemberFlag {p} size="list" /></span>{/each}
							</div>
						{/if}
						<div class="actions">
							<button type="button" class="primary" onclick={() => compass(g.id)}>{L.seeOnCompass}</button>
							{#if g.owner}
								<a class="button ghost" href="/groupes/{g.id}">{L.ownerManage}</a>
							{:else}
								<a class="button ghost" href="/groupes/{g.id}">{L.membersTitle}</a>
								<button type="button" class="skip" onclick={() => (leaving = g.id)}>{L.leave}</button>
							{/if}
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
					</section>
				{:else}
					<p class="card lead">{L.noGroups}</p>
				{/each}
			</div>
			<div class="side">
				<form class="card" onsubmit={create}>
					<h2>{L.groupCreateTitle}</h2>
					<p class="note">{L.groupCreateNote}</p>
					<label>{L.groupName}<input type="text" bind:value={name} maxlength="60" required /></label>
					<button type="submit" class="primary" disabled={busy || !name.trim()}>{L.groupCreate}</button>
				</form>
				<section class="card directory">
					<h2>{L.directoryTitle}</h2>
					<p class="note">{L.directoryLead}</p>
					{#if listed === null}
						<p class="status">{L.loadingPage}</p>
					{:else if !listed.length}
						<p class="note">{L.directoryEmpty}</p>
					{:else}
						<ul>
							{#each listed as g (g.id)}
								<li>
									<span><b>{g.name}</b><small>{L.memberCount(g.members)}</small></span>
									{#if g.member}
										<a href="/groupes/{g.id}">{L.directoryMember}</a>
									{:else}
										<button type="button" class={g.requested ? 'skip' : 'ghost'} onclick={() => ask(g)}>
											{g.requested ? L.directoryWithdraw : L.directoryAsk}
										</button>
									{/if}
								</li>
							{/each}
						</ul>
						<p class="fine">{L.directoryAskNote}</p>
					{/if}
				</section>
				<form class="card" onsubmit={follow}>
					<h2>{L.joinTitle}</h2>
					<p class="note">{L.joinNote}</p>
					<label>{L.joinPlaceholder}<input type="text" bind:value={code} placeholder={origin + '/rejoindre/…'} /></label>
					<button type="submit" class="ghost" disabled={!code.trim()}>{L.joinGo}</button>
				</form>
			</div>
		</div>
	</div>
</SignedIn>

<style>
	.groups { max-width: 1080px; margin: 0 auto; padding: 16px 0 32px; }
	h1 { font-family: var(--font-display); font-size: clamp(30px, 4vw, 40px); font-weight: 600; letter-spacing: -0.02em; margin: 0 0 8px; }
	.lead { color: var(--text-2); margin: 0 0 24px; }
	.cols { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 24px; align-items: start; }
	.list, .side { display: flex; flex-direction: column; gap: 16px; }
	.card + .card { margin-top: 0; }
	.group h2 { font-family: var(--font-display); font-size: 22px; font-weight: 600; margin: 0 0 4px; letter-spacing: -0.01em; }
	.group h2 a { color: inherit; text-decoration: none; }
	.group h2 a:hover { color: var(--accent-ink); }
	.meta { margin: 0 0 14px; color: var(--text-2); font-size: 14.5px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
	.flags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
	.actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
	.confirm { margin-top: 14px; padding: 14px 16px; border-radius: var(--r-md); background: var(--danger-soft); }
	.confirm p { margin: 0 0 10px; color: var(--text); }
	form h2 { font-family: var(--font-sans); font-size: 18px; font-weight: 650; margin: 0 0 6px; }
	.note { margin: 0 0 14px; font-size: 14.5px; color: var(--text-2); }
	form label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 650; color: var(--text-2); margin-bottom: 12px; }
	form input { font-weight: 400; }
	.status, .error { margin-bottom: 16px; }
	.badge.ask { background: var(--pop-soft); color: var(--text); text-decoration: none; }
	.directory h2 { font-family: var(--font-sans); font-size: 18px; font-weight: 650; margin: 0 0 6px; }
	.directory ul { list-style: none; margin: 0; padding: 0; }
	.directory li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid var(--border); }
	.directory li b { display: block; }
	.directory li small { display: block; color: var(--text-3); font-size: 13px; }
	.directory li button { flex: none; min-height: 40px; }
	.fine { margin: 12px 0 0; font-size: 13px; color: var(--text-3); }
	@media (max-width: 860px) { .cols { grid-template-columns: 1fr; } }
</style>
