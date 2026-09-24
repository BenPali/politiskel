<!-- The site's header: the brand, which leads home, and the outside links. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import ThemePicker from '$lib/components/ThemePicker.svelte';
</script>

<header class="masthead">
	<a class="brand" href="/">
		<svg class="mark" width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
			<circle cx="17" cy="17" r="15.5" fill="none" stroke="var(--border)" />
			<line x1="17" y1="4" x2="17" y2="30" stroke="var(--axis)" stroke-width="1" />
			<line x1="4" y1="17" x2="30" y2="17" stroke="var(--axis)" stroke-width="1" />
			<circle cx="11.5" cy="22" r="3" fill="var(--series-1)" />
			<circle cx="22" cy="12" r="2.2" fill="var(--series-1)" opacity="0.45" />
		</svg>
		<div>
			<span class="name">Politiskel</span>
			<p class="tag">{L.brandTag}</p>
		</div>
	</a>
	<nav>
		<a href="https://politiscales.fr" target="_blank" rel="noopener noreferrer">
			<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
				<path d="M6.5 9.5 14 2M14 2h-4.5M14 2v4.5" />
				<path d="M12 9.5v3a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 2 12.5v-7A1.5 1.5 0 0 1 3.5 4h3" />
			</svg>
			<span>{L.navTest}</span>
		</a>
		<a href="https://github.com/BenPali/politiskel" target="_blank" rel="noopener noreferrer">
			<span>{L.navSource}</span>
		</a>
		<ThemePicker />
	</nav>
</header>

<style>
	.brand { text-decoration: none; color: inherit; }
	.name { font-size: 1.32rem; font-weight: 700; letter-spacing: -0.015em; display: block; }
</style>
