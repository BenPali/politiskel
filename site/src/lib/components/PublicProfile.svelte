<!-- A profile seen by someone else, read-only: the card in its layout and
     theme, the passport, and for a visitor with no place yet a way to make
     one's own. Shared by the stored public link (/p/{token}) and the link
     that holds the result itself (/v#...). `data` comes from fromSnapshot,
     which checks every field. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { session } from '$lib/session.svelte.js';
	import { coords, fromMember } from '$lib/compass/model.js';
	import PassportBook from '$lib/components/PassportBook.svelte';

	/** data: the card's data; layout: an entry of SHARE_LAYOUTS; ART: the badge scenes, once loaded */
	let { data, layout, theme, ART, title, lead } = $props();

	const S = L.share;
	/* the invitation to make one's own is for visitors who have no place yet */
	const placed = $derived.by(() => {
		if (!session.me) return false;
		const c = coords(fromMember({ username: session.me.username, politiscales: session.me.profile.politiscales, answers: session.me.profile.answers }));
		return c.x !== null && c.y !== null;
	});
</script>

<div class="public">
	<header>
		<h1>{title}</h1>
		<p class="lead">{lead}</p>
	</header>
	<figure class="shared" class:tall={layout.h > layout.w}>{@html layout.draw(data, ART, theme)}</figure>
	<section class="card passport" aria-label={L.passport.title}>
		<h2>{L.passport.title}</h2>
		<PassportBook {data} {ART} />
	</section>
	{#if session.ready && !placed}
	<div class="card cta">
		<p>{S.ctaPublic}</p>
		<a class="button primary" href="/">{S.makeYours}</a>
	</div>
	{/if}
</div>

<style>
	h1 { font-family: var(--font-display); font-size: clamp(30px, 5vw, 44px); font-weight: 700; margin: 0 0 6px; letter-spacing: -0.02em; overflow-wrap: anywhere; }
	.lead { margin: 0; color: var(--text-2); }
	.public { display: flex; flex-direction: column; gap: 28px; max-width: 960px; margin: 0 auto; }
	.shared { margin: 0; }
	.shared :global(svg) { display: block; width: 100%; height: auto; border-radius: 12px; box-shadow: 0 0 0 1px var(--border), var(--shadow-2); }
	.shared.tall { max-width: 520px; margin: 0 auto; width: 100%; }
	.card { padding: 24px; }
	h2 { margin: 0 0 14px; font-size: 20px; }
	.cta { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
	.cta p { margin: 0; font-size: 16px; }
	@media (max-width: 700px) { .card { padding: 18px 16px; } }
</style>
