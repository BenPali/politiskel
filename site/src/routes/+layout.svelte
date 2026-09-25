<!-- Every page's frame: the header, the page, the footer. The session is
     asked for once, here; pages read it from the shared state. -->
<script>
	import '../fonts.css';
	import '../tokens.css';
	import '../app.css';
	import '../design.css';
	import { onMount } from 'svelte';
	import { refresh } from '$lib/session.svelte.js';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import { announce, watchRequests } from '$lib/notify.svelte.js';
	import { readPrefs } from '$lib/compass/board.svelte.js';

	let { children } = $props();

	/* the session, then what waits for this owner; and again every minute */
	onMount(() => {
		/* the viewer's choices — which flags, which country, which reading —
		   for every page, not only the compass's: a flag shown on the groups
		   page follows them too */
		readPrefs();
		refresh().then(announce);
		return watchRequests();
	});
</script>

<SiteHeader />
<main>
	{@render children()}
</main>
<SiteFooter />
<Toasts />
