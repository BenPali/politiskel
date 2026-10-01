<!-- A member's flag: their PolitiScales flag, or Politiskel's when chosen or
     when there is none, or a plain dot when neither can be drawn. Only an
     image data URI is accepted as a PolitiScales flag. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { board } from '$lib/compass/board.svelte.js';
	import { coords } from '$lib/compass/model.js';
	import { politiskelFlag } from '$lib/flag/flag.js';

	let { p, size = '', captureOnly = false } = $props();

	const hasOwn = $derived(!!p.flag && /^data:image\/(png|jpeg|webp);base64,/.test(p.flag));
	const drawn = $derived(!captureOnly && (board.flagMode === 'politiskel' || !hasOwn) ? politiskelFlag(coords(p), p) : null);
</script>

{#if drawn}
	<img class="flag {size}" src={drawn.url} alt={L.flagGeneratedAlt(p.alias)} title={drawn.legend.join('\n')} />
{:else if hasOwn}
	<img class="flag {size}" src={p.flag} alt={L.flagAlt(p.alias)} />
{:else}
	<span class="swatch"></span>
{/if}
