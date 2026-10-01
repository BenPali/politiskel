<!-- The model check, for the site's admins: aggregates the server computes
     from the members who agreed to it. Nothing here is per person; the
     server leaves out any figure resting on too few profiles. -->
<script>
	import { onMount } from 'svelte';
	import { L } from '$lib/i18n/fr.js';
	import { api, apiError } from '$lib/api.js';
	import { session } from '$lib/session.svelte.js';
	import { PolitiQuiz } from '$lib/model.js';
	import { signed } from '$lib/format.js';
	import SignedIn from '$lib/components/SignedIn.svelte';

	const A = L.adminCheck;
	let data = $state(null);
	let error = $state(null);
	let asked = false;
	$effect(() => {
		if (!session.me || asked) return;
		asked = true;
		api('GET', '/api/admin/model-check').then((r) => (r.ok ? (data = r.data) : (error = apiError(r))));
	});
	const num = (v) => (v === null || v === undefined ? A.none : String(v).replace('.', ','));
	const sig = (v) => (v === null || v === undefined ? A.none : signed(v));
	const textOf = (id) => {
		const i = PolitiQuiz.itemById(id);
		return i ? i.fr || i.left + ' / ' + i.right : id;
	};
	/* a correlation this low says the item does not go with its axis */
	const weak = (r) => r !== null && r !== undefined && r < 0.2;
</script>

<svelte:head><title>{A.title} · Politiskel</title><meta name="robots" content="noindex" /></svelte:head>

<SignedIn>
	<div class="admin">
		<h1>{A.title}</h1>
		{#if !error}<p class="lead">{A.lead}</p>{/if}
		{#if error}
			<p class="error">{error}</p>
		{:else if data}
			<p>{A.counts(data.consenting, data.profiles)}</p>
			{#if !data.ready}
				<p class="hint">{A.notReady(data.profiles, data.min_profiles)}</p>
			{:else}
				{#each ['x', 'y'] as ax (ax)}
					{@const a = data.axes[ax]}
					<section class="card">
						<h2>{A.axis[ax]}</h2>
						<h3>{A.shiftTitle}</h3>
						<p class="note">{A.shiftLead}</p>
						{#if a.shift.profiles}
							<table>
								<tbody>
									{#each ['profiles', 'mean', 'median', 'median_abs', 'p90_abs', 'slope', 'r'] as k (k)}
										<tr><th>{A.rows[k]}</th><td>{k === 'mean' || k === 'median' ? sig(a.shift[k]) : num(a.shift[k])}</td></tr>
									{/each}
								</tbody>
							</table>
							<table>
								<thead><tr><th>{A.bandCol}</th><th>{A.rows.profiles}</th><th>{A.bandShift}</th></tr></thead>
								<tbody>
									{#each ['neg', 'mid', 'pos'] as b (b)}
										<tr><th>{A.bands[b]}</th><td>{num(a.shift.bands[b].profiles)}</td><td>{sig(a.shift.bands[b].median)}</td></tr>
									{/each}
								</tbody>
							</table>
						{:else}
							<p class="hint">{A.shiftNone(a.placed)}</p>
						{/if}

						<h3>{A.itemsTitle}</h3>
						<p class="note">{A.itemsLead}</p>
						<div class="scroll">
							<table class="items">
								<thead><tr><th>{A.itemCols.item}</th><th>{A.itemCols.dim}</th><th>{A.itemCols.profiles}</th><th>{A.itemCols.mean}</th><th>{A.itemCols.r}</th></tr></thead>
								<tbody>
									{#each a.items as it (it.id)}
										<tr class:weak={weak(it.r_rest)}>
											<td><span class="q">{textOf(it.id)}</span><code>{it.id}</code></td>
											<td>{L.dims[it.dim] || it.dim}</td><td>{it.profiles}</td><td>{sig(it.mean)}</td><td>{num(it.r_rest)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<h3>{A.dimsTitle}</h3>
						<table>
							<thead><tr><th>{A.itemCols.dim}</th><th>{A.itemCols.profiles}</th><th>{A.itemCols.r}</th></tr></thead>
							<tbody>
								{#each a.dims as d (d.dim)}
									<tr class:weak={weak(d.r_rest)}><th>{L.dims[d.dim] || d.dim}</th><td>{d.profiles}</td><td>{num(d.r_rest)}</td></tr>
								{/each}
							</tbody>
						</table>
					</section>
				{/each}

				<section class="card">
					<h2>{A.agreeTitle}</h2>
					<p class="note">{A.agreeLead}</p>
					<table>
						<tbody>
							{#each ['profiles', 'mean', 'median', 'sd', 'r_shift_x', 'r_shift_y'] as k (k)}
								<tr><th>{A.agreeRows[k]}</th><td>{k === 'mean' || k === 'median' ? sig(data.agree[k]) : num(data.agree[k])}</td></tr>
							{/each}
						</tbody>
					</table>
				</section>
			{/if}
		{/if}
	</div>
</SignedIn>

<style>
	.admin { max-width: 960px; margin: 0 auto; padding: 32px 16px 64px; display: flex; flex-direction: column; gap: 18px; }
	h1 { margin: 0; }
	.card { padding: 22px 24px; border-radius: var(--r-lg); background: var(--surface); border: 1px solid var(--border); min-width: 0; }
	h2 { margin: 0 0 8px; }
	h3 { margin: 22px 0 6px; font-size: 16px; }
	.note { margin: 0 0 10px; font-size: 14px; color: var(--text-2); max-width: 75ch; }
	.hint { color: var(--text-3); }
	/* a table wider than a phone scrolls inside its card, not the page */
	table { display: block; max-width: 100%; overflow-x: auto; width: max-content; border-collapse: collapse; margin: 8px 0 4px; font-size: 14px; font-variant-numeric: tabular-nums; }
	th, td { text-align: left; padding: 6px 12px 6px 0; border-bottom: 1px solid var(--border); vertical-align: top; }
	td { text-align: right; }
	thead th { font-size: 12.5px; color: var(--text-3); font-weight: 650; }
	.items { width: auto; }
	.items td:first-child, .items td:nth-child(2) { text-align: left; }
	.items .q { display: block; }
	.items code { font-size: 11.5px; color: var(--text-3); }
	tr.weak td, tr.weak th { background: var(--danger-soft); }
	.scroll { overflow-x: auto; }
</style>
