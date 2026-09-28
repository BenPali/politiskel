<!-- Every page's frame: the header, the page, the footer. The session is
     asked for once, here; pages read it from the shared state. -->
<script>
	import '../fonts.css';
	import '../tokens.css';
	import '../app.css';
	import '../design.css';
	import { onMount } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import { updated } from '$app/state';
	import { refresh } from '$lib/session.svelte.js';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import Tour from '$lib/components/Tour.svelte';
	import { announce, watchRequests } from '$lib/notify.svelte.js';
	import { readPrefs } from '$lib/compass/board.svelte.js';

	let { children } = $props();

	/* A new version is out: the next page is loaded afresh rather than drawn
	   by the old code. A member who kept a tab open saw a page without a
	   button the site had since gained. A save under way survives the reload:
	   answers are sent with keepalive (answers.svelte.js). */
	beforeNavigate(({ willUnload, to }) => {
		if (!updated.current || willUnload || !to?.url) return;
		/* moving between the screens of one page (the questionnaire's ?q=)
		   is not a new page: it waits for the next one */
		if (to.url.pathname === location.pathname) return;
		location.href = to.url.href;
	});

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
<Tour />
