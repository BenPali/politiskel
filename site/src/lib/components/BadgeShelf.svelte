<!-- A row of badges: each drawn at its level, its name, and what earned
     it. The drawings load on demand, a placeholder disc standing in until
     they are there. `catalog` shows every level of every badge instead. -->
<script>
	import { onMount } from 'svelte';
	import { L } from '$lib/i18n/fr.js';
	import { drawBadge } from '$lib/badges/draw.js';
	import { LEVELS, SINGLE, PRIVATE, SOON, familyOf } from '$lib/badges/badges.js';

	/** badges: [{ key, level, strength, with? }] */
	let { badges, size = 'md', catalog = false } = $props();

	const B = L.badges;
	let ART = $state(null);
	onMount(async () => {
		ART = (await import('$lib/badges/scenes/index.js')).ART;
	});

	const ribbon = (key) => B.items[key].label || B.families[familyOf(key)];
	const name = (b) => B.items[b.key].names[SINGLE.has(b.key) ? 0 : b.level - 1];
	const why = (b) => {
		if (b.with) return B.items[b.key].rule + ' : ' + b.with.join(', ');
		if (SINGLE.has(b.key)) return B.items[b.key].rule;
		if (catalog) return B.from(LEVELS[b.level - 1]);
		return B.items[b.key].label + ' · ' + (b.strength !== null && b.strength !== undefined ? b.strength : B.from(LEVELS[b.level - 1]));
	};
</script>

<ul class="shelf {size}">
	{#each badges as b (b.key + b.level)}
		<li>
			<span class="art" aria-hidden="true">
				{#if ART}{@html drawBadge(ART[b.key], SINGLE.has(b.key) ? 2 : b.level, ribbon(b.key))}{:else}<span class="ph"></span>{/if}
			</span>
			<b>{name(b)}</b>
			<span class="why">{why(b)}</span>
			{#if PRIVATE.has(b.key)}<span class="why private">{B.privateNote}</span>{/if}
			{#if SOON.has(b.key)}<span class="why private">{B.soon}</span>{/if}
		</li>
	{/each}
</ul>

<style>
	.shelf { display: grid; grid-template-columns: repeat(auto-fill, minmax(128px, 1fr)); gap: 18px 12px; margin: 0; padding: 0; list-style: none; }
	.shelf.lg { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
	li { display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 0; }
	.art { display: block; width: 100%; max-width: 132px; aspect-ratio: 1; }
	.lg .art { max-width: 160px; }
	.art :global(svg) { display: block; width: 100%; height: auto; filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.14)); }
	.ph { display: block; width: 78%; aspect-ratio: 1; margin: 11%; border-radius: 50%; background: var(--surface-2); }
	b { margin-top: 6px; font-size: 14px; line-height: 1.25; }
	.why { margin-top: 2px; font-size: 12.5px; line-height: 1.3; color: var(--text-3); }
	.private { color: var(--accent-ink); }
</style>
