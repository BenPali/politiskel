<!-- One group, after the design: its members, each with their flag and
     where their profile comes from; its invitation link; and for its owner
     the tools — hand over, remove, change the link, delete — each asked
     again in place before it is done. A member who is not the owner can
     leave. -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { L } from '$lib/i18n/fr.js';
	import { api, apiError } from '$lib/api.js';
	import { session, refresh } from '$lib/session.svelte.js';
	import { board, showGroup } from '$lib/compass/board.svelte.js';
	import { fromMember, hasPolitiscales } from '$lib/compass/model.js';
	import { toast } from '$lib/toast.svelte.js';
	import { announce } from '$lib/notify.svelte.js';
	import SignedIn from '$lib/components/SignedIn.svelte';
	import MemberFlag from '$lib/components/MemberFlag.svelte';

	const id = $derived(Number(page.params.id));
	const g = $derived(session.me ? session.me.groups.find((x) => x.id === id) || null : null);

	let members = $state(null);
	/** the action waiting for a second yes: { kind, name? } */
	let asking = $state(null);
	let copied = $state(false);
	let origin = $state('');
	onMount(() => (origin = location.origin));

	async function load() {
		const r = await api('GET', '/api/groups/' + id + '/profiles');
		members = r.ok ? r.data.map((m) => ({ p: fromMember(m), answered: !!m.answers && Object.keys(m.answers).length > 0 })) : [];
		if (!r.ok) toast(apiError(r), { kind: 'error' });
	}
	$effect(() => {
		if (session.me && g) load();
	});

	/* the owner's side of the directory: listing, and the requests waiting */
	let waiting = $state([]);
	async function loadRequests() {
		const r = await api('GET', '/api/groups/' + id + '/requests');
		waiting = r.ok ? r.data : [];
		/* looked at: these requests are no longer news */
		announce();
	}
	$effect(() => {
		if (g?.owner) loadRequests();
	});
	const setListed = (e) => run('POST', '/api/groups/' + id + '/listed', { listed: e.currentTarget.checked }, loadRequests);
	const answer = (name, yes) =>
		run('POST', '/api/groups/' + id + '/requests/' + (yes ? 'accept' : 'decline'), { username: name }, () => {
			if (yes) toast(L.requestAccepted(name));
			loadRequests();
			load();
		});

	const link = $derived(g ? origin + '/rejoindre/' + g.invite : '');
	async function copy() {
		try {
			await navigator.clipboard.writeText(link);
			copied = true;
			setTimeout(() => (copied = false), 2400);
		} catch {
			prompt(L.invite, link);
		}
	}
	function compass() {
		showGroup(id);
		goto('/boussole');
	}

	/* every change: the call, then the session and the board afresh */
	async function run(method, path, body, after) {
		const r = await api(method, path, body);
		asking = null;
		if (!r.ok) return toast(apiError(r), { kind: 'error' });
		board.loaded = false;
		await refresh();
		after?.(r);
	}
	const removeMember = (name) => run('POST', '/api/groups/' + id + '/remove', { username: name }, load);
	const handOver = (name) => run('POST', '/api/groups/' + id + '/owner', { username: name }, load);
	const newLink = () => run('POST', '/api/groups/' + id + '/invite', null, () => toast(L.ownerNewLinkDone));
	const remove = () => run('DELETE', '/api/groups/' + id, null, () => goto('/groupes'));
	const leave = () => run('POST', '/api/groups/' + id + '/leave', null, () => goto('/groupes'));
	const ask = (kind, name = null) => (asking = { kind, name });
	const isAsking = (kind, name = null) => asking && asking.kind === kind && asking.name === name;
</script>

<svelte:head><title>{g ? g.name + ' · ' : ''}{L.tabGroups} · Politiskel</title></svelte:head>

<SignedIn>
	<div class="group">
		<a class="back" href="/groupes">{L.backToGroupsShort}</a>
		{#if !g}
			<p class="card lead">{L.groupNotFound}</p>
		{:else}
			<div class="head">
				<div>
					<h1>{g.name}</h1>
					<p class="meta">
						{L.memberCount(g.members)}
						{#if g.owner}<span class="badge">{L.ownerYou}</span>{:else if g.owner_name} · {L.ownerIs(g.owner_name)}{/if}
					</p>
				</div>
				<button type="button" class="primary" onclick={compass}>{L.seeOnCompass}</button>
			</div>

			<div class="cols">
				<section class="card">
					<h2>{L.membersTitle}</h2>
					{#if !members}
						<p class="status">{L.loadingPage}</p>
					{:else}
						<ul class="members">
							{#each members as { p, answered } (p.id)}
								<li>
									<div class="row">
										<MemberFlag {p} size="list" />
										<span class="who">
											<span class="n">{p.alias}{#if p.me}<span class="tag">{p.owner ? L.youOwner : L.youTag}</span>{:else if p.owner}<span class="tag">{L.ownerTag}</span>{/if}</span>
											<span class="src">{L.memberSource(hasPolitiscales(p), answered)}</span>
										</span>
										{#if g.owner && !p.me}
											<span class="tools">
												<button type="button" class="skip" onclick={() => ask('owner', p.alias)}>{L.ownerHandOver}</button>
												<button type="button" class="skip warn" onclick={() => ask('remove', p.alias)}>{L.ownerRemove}</button>
											</span>
										{/if}
									</div>
									{#if isAsking('remove', p.alias) || isAsking('owner', p.alias)}
										{@const rm = asking.kind === 'remove'}
										<div class="confirm" role="alertdialog" aria-label={rm ? L.ownerRemove : L.ownerHandOver}>
											<p>{rm ? L.ownerRemoveConfirm(p.alias, g.name) : L.ownerHandOverConfirm(p.alias, g.name)}</p>
											<div class="actions">
												<button type="button" class="danger" onclick={() => (rm ? removeMember(p.alias) : handOver(p.alias))}>{rm ? L.ownerRemove : L.ownerHandOver}</button>
												<button type="button" class="ghost" onclick={() => (asking = null)}>{L.confirmCancel}</button>
											</div>
										</div>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</section>

				<div class="side">
					<section class="card">
						<h2>{L.inviteLinkTitle}</h2>
						<p class="note">{L.inviteLinkLead}</p>
						<div class="link">
							<span>{link}</span>
							<button type="button" class="ghost" onclick={copy} aria-live="polite">{copied ? L.copied : L.copyLink}</button>
						</div>
					</section>

					{#if g.owner}
						<section class="card">
							<h2>{L.listedTitle}</h2>
							<label class="toggle"><input type="checkbox" checked={g.listed} onchange={setListed} />{L.listedToggle}</label>
							<p class="note">{L.listedLead}</p>
							{#if g.listed}
								<h3>{L.requestsTitle}</h3>
								{#if !waiting.length}
									<p class="note">{L.requestsNone}</p>
								{:else}
									<ul class="requests">
										{#each waiting as w (w.username)}
											<li>
												<b>{w.username}</b>
												<span class="actions">
													<button type="button" class="primary" onclick={() => answer(w.username, true)}>{L.requestAccept}</button>
													<button type="button" class="ghost" onclick={() => answer(w.username, false)}>{L.requestDecline}</button>
												</span>
											</li>
										{/each}
									</ul>
								{/if}
							{/if}
						</section>

						<section class="card">
							<h2>{L.ownerToolsTitle}</h2>
							<p class="note">{L.ownerNote}</p>
							<button type="button" class="ghost" onclick={() => ask('link')}>{L.ownerNewLink}</button>
							{#if isAsking('link')}
								<div class="confirm soft" role="alertdialog" aria-label={L.ownerNewLink}>
									<p>{L.ownerNewLinkConfirm}</p>
									<div class="actions">
										<button type="button" class="primary" onclick={newLink}>{L.ownerNewLink}</button>
										<button type="button" class="ghost" onclick={() => (asking = null)}>{L.confirmCancel}</button>
									</div>
								</div>
							{/if}
							<div class="danger-zone">
								<p>{L.ownerDeleteLead}</p>
								<button type="button" class="ghost warn-outline" onclick={() => ask('delete')}>{L.ownerDelete}</button>
								{#if isAsking('delete')}
									<div class="confirm" role="alertdialog" aria-label={L.ownerDelete}>
										<p>{L.ownerDeleteConfirm(g.name)}</p>
										<div class="actions">
											<button type="button" class="danger" onclick={remove}>{L.ownerDelete}</button>
											<button type="button" class="ghost" onclick={() => (asking = null)}>{L.confirmCancel}</button>
										</div>
									</div>
								{/if}
							</div>
						</section>
					{:else}
						<section class="card">
							<p class="note">{L.memberToolsLead}</p>
							<button type="button" class="ghost warn-outline" onclick={() => ask('leave')}>{L.leave}</button>
							{#if isAsking('leave')}
								<div class="confirm" role="alertdialog" aria-label={L.leave}>
									<p>{L.leaveConfirm(g.name)}</p>
									<div class="actions">
										<button type="button" class="danger" onclick={leave}>{L.leave}</button>
										<button type="button" class="ghost" onclick={() => (asking = null)}>{L.confirmCancel}</button>
									</div>
								</div>
							{/if}
						</section>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</SignedIn>

<style>
	.group { max-width: 1080px; margin: 0 auto; padding: 8px 0 32px; }
	.back { display: inline-flex; align-items: center; min-height: 44px; color: var(--text-2); font-size: 15px; text-decoration: none; margin-bottom: 8px; }
	.back:hover { color: var(--text); }
	.head { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; margin-bottom: 24px; }
	h1 { font-family: var(--font-display); font-size: clamp(28px, 4vw, 38px); font-weight: 600; letter-spacing: -0.02em; margin: 0 0 6px; line-height: 1.1; }
	.meta { margin: 0; color: var(--text-2); font-size: 14.5px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
	.cols { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 24px; align-items: start; }
	.side { display: flex; flex-direction: column; gap: 16px; }
	.card + .card { margin-top: 0; }
	h2 { font-family: var(--font-sans); font-size: 18px; font-weight: 650; margin: 0 0 6px; }
	.note { margin: 0 0 14px; font-size: 14.5px; color: var(--text-2); }
	.members { list-style: none; margin: 8px 0 0; padding: 0; }
	.members li { padding: 12px 0; border-top: 1px solid var(--border); }
	.row { display: flex; align-items: center; gap: 12px; }
	.who { flex: 1 1 auto; min-width: 0; line-height: 1.3; }
	.n { display: block; font-weight: 650; }
	.tag { margin-left: 8px; font-size: 12px; font-weight: 650; color: var(--accent-ink); background: var(--accent-soft); padding: 2px 8px; border-radius: var(--r-pill); }
	.src { display: block; font-size: 13px; color: var(--text-3); }
	.tools { display: flex; gap: 4px; flex: none; }
	.tools button { min-height: 36px; padding: 0 10px; font-size: 14px; }
	.warn { color: var(--danger); }
	.warn:hover { background: var(--danger-soft); }
	.warn-outline { color: var(--danger); border-color: var(--danger); }
	.confirm { margin-top: 12px; padding: 14px 16px; border-radius: var(--r-md); background: var(--danger-soft); }
	.confirm.soft { background: var(--surface-2); }
	.confirm p { margin: 0 0 10px; color: var(--text); font-size: 14.5px; }
	.actions { display: flex; flex-wrap: wrap; gap: 10px; }
	.link { display: flex; align-items: center; gap: 10px; padding: 8px 8px 8px 14px; border-radius: var(--r-sm); background: var(--surface-2);
		border: 1px solid var(--border); }
	.link span { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px;
		font-variant-numeric: tabular-nums; color: var(--text-2); }
	.link button { flex: none; min-height: 40px; }
	.toggle { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 600; cursor: pointer; }
	h3 { font-family: var(--font-sans); font-size: 15px; font-weight: 650; margin: 16px 0 6px; }
	.requests { list-style: none; margin: 0; padding: 0; }
	.requests li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 0; border-top: 1px solid var(--border); }
	.requests button { min-height: 38px; }
	.danger-zone { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
	.danger-zone p { margin: 0 0 12px; font-size: 14px; color: var(--text-2); }
	.status { margin-bottom: 16px; }
	@media (max-width: 860px) { .cols { grid-template-columns: 1fr; } }
</style>
