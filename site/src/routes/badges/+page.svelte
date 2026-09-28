<!-- Every badge, at each of its levels, by family: what the questionnaires
     can earn. Open to anyone, like the method page. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { FAMILIES, SINGLE } from '$lib/badges/badges.js';
	import BadgeShelf from '$lib/components/BadgeShelf.svelte';

	const B = L.badges;
	const levels = (key) => (SINGLE.has(key) ? [{ key, level: 1, strength: null }] : [1, 2, 3].map((level) => ({ key, level, strength: null })));
</script>

<svelte:head><title>{B.catalogTitle} · Politiskel</title></svelte:head>

<h1>{B.catalogTitle}</h1>
<p class="lead">{B.catalogLead}</p>

{#each FAMILIES as [family, keys]}
	<h2>{B.families[family]}</h2>
	<div class="cards">
		{#each keys as key}
			<section class="card">
				<h3>{B.items[key].label || B.items[key].names[0]}</h3>
				<BadgeShelf badges={levels(key)} catalog />
			</section>
		{/each}
	</div>
{/each}

<style>
	h1 { font-family: var(--font-display); font-size: 40px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em; }
	.lead { margin: 0 0 8px; max-width: 70ch; color: var(--text-2); line-height: 1.5; }
	h2 { font-size: 22px; margin: 40px 0 14px; }
	.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(460px, 1fr)); gap: 16px; }
	.card { padding: 20px; margin: 0; }
	h3 { margin: 0 0 14px; font-size: 16px; }
	@media (max-width: 700px) {
		h1 { font-size: 30px; }
		.cards { grid-template-columns: minmax(0, 1fr); }
		.card { padding: 18px 16px; }
	}
</style>
