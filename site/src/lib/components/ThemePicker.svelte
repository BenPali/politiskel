<!-- The theme picker: "Auto" follows the system; a picked theme is remembered
     in this browser, and applied from app.html on the next visit. -->
<script>
	import { onMount } from 'svelte';
	import { L } from '$lib/i18n/fr.js';

	const KEY = 'politicompass.theme.v1';
	const THEMES = ['auto', 'light', 'dark', 'contrast', 'sepia'];
	let theme = $state('auto');

	onMount(() => {
		try {
			const saved = localStorage.getItem(KEY);
			if (saved && THEMES.includes(saved)) theme = saved;
		} catch {
			/* private browsing */
		}
	});

	function pick() {
		if (theme === 'auto') delete document.documentElement.dataset.theme;
		else document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem(KEY, theme);
		} catch {
			/* quota, or private browsing */
		}
	}
</script>

<label class="theme-pick">
	<span>{L.themeLabel}</span>
	<select bind:value={theme} onchange={pick}>
		{#each THEMES as k}
			<option value={k}>{L.uiThemes[k]}</option>
		{/each}
	</select>
</label>
