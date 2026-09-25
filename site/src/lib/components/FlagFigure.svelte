<!-- A member's Politiskel flag, large, with its legend — one line per element
     drawn — and a button to enlarge it, remembered in this browser. -->
<script>
	import { onMount } from 'svelte';
	import { L } from '$lib/i18n/fr.js';
	import { coords } from '$lib/compass/model.js';
	import { politiskelFlag } from '$lib/flag/flag.js';

	let { p } = $props();
	const KEY = 'politicompass.flagsize.v1';
	const f = $derived(politiskelFlag(coords(p), p));
	let large = $state(false);

	onMount(() => {
		try {
			large = localStorage.getItem(KEY) === 'large';
		} catch {
			/* private browsing */
		}
	});
	function toggle() {
		large = !large;
		try {
			localStorage.setItem(KEY, large ? 'large' : 'default');
		} catch {
			/* quota */
		}
	}
</script>

{#if f}
	<figure class="flag-figure">
		<div class="flag-figure-head">
			<figcaption class="hint">{L.flagFigureTitle}</figcaption>
			<button type="button" class="ghost flag-size" onclick={toggle}>{large ? L.flagShrink : L.flagEnlarge}</button>
		</div>
		<img class="flag-drawn" class:large src={f.url} alt={L.flagGeneratedAlt(p.alias)} />
		<ul class="flag-legend">
			{#each f.legend as line}<li>{line}</li>{/each}
		</ul>
		<p class="note">{L.flagCredit} <a href="/drapeaux">{L.navFlags}</a></p>
	</figure>
{/if}

<style>
	figure { margin: 0 0 14px; }
</style>
