<!-- The compass's settings: the country compared against, what is drawn, the
     flags, the reading. Every change is remembered in this browser. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { board, savePrefs } from '$lib/compass/board.svelte.js';
	import { COUNTRIES, VIEWS } from '$lib/compass/model.js';

	const toggles = [
		['refs', L.optRefs],
		['refLabels', L.optRefLabels],
		['labels', L.optLabels],
		['centroid', L.optMean],
		['trail', L.optTrail]
	];
</script>

<div class="controls">
	<label class="country">
		<span>{L.optCountry}</span>
		<select bind:value={board.country} onchange={savePrefs}>
			{#each COUNTRIES as c (c.code)}<option value={c.code}>{c.name}</option>{/each}
		</select>
	</label>
	{#each toggles as [k, label] (k)}
		<label><input type="checkbox" bind:checked={board.show[k]} onchange={savePrefs} /> <span>{label}</span></label>
	{/each}
	<label class="country">
		<span>{L.optFlags}</span>
		<select bind:value={board.flagMode} onchange={savePrefs}>
			<option value="politiscales">{L.flagsPolitiscales}</option>
			<option value="politiskel">{L.flagsPolitiskel}</option>
		</select>
	</label>
	<label class="country">
		<span>{L.optView}</span>
		<select bind:value={board.view} onchange={savePrefs}>
			{#each VIEWS as v (v.key)}<option value={v.key} disabled={v.planned}>{L.views[v.key].name}</option>{/each}
		</select>
	</label>
</div>
