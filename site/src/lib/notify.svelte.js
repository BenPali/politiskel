/* Telling a group's owner that someone asks to join. There is no e-mail:
   the site looks again every minute while it is on screen, counts the
   requests waiting on the groups one owns, and says so when there are more
   than when one last looked — then, and on the next visit. The header's
   Groupes tab carries the count. */

import { session, refresh } from '$lib/session.svelte.js';
import { toast } from '$lib/toast.svelte.js';
import { L } from '$lib/i18n/fr.js';

const KEY = 'politiskel.requests.seen.v1';
const read = () => {
	try {
		return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
	} catch {
		return {};
	}
};
const write = (seen) => {
	try {
		localStorage.setItem(KEY, JSON.stringify(seen));
	} catch {
		/* private browsing */
	}
};

/** requests waiting, over the groups one owns */
export const waitingRequests = () =>
	session.me ? session.me.groups.filter((g) => g.owner).reduce((n, g) => n + (g.requests || 0), 0) : 0;

/* Compares what waits with what was seen, and says what is new. */
export function announce() {
	if (!session.me) return;
	const who = session.me.username;
	const seen = read();
	const mine = seen[who] || {};
	for (const g of session.me.groups) {
		if (!g.owner) continue;
		const n = g.requests || 0;
		if (n > (mine[g.id] || 0))
			toast(L.requestsNew(g.name, n - (mine[g.id] || 0)), { ms: 9000, action: { label: L.requestsSee, href: '/groupes/' + g.id } });
		mine[g.id] = n;
	}
	seen[who] = mine;
	write(seen);
}

let timer = null;
export function watchRequests() {
	clearInterval(timer);
	timer = setInterval(async () => {
		if (document.visibilityState !== 'visible' || !session.me) return;
		await refresh();
		announce();
	}, 60000);
	return () => clearInterval(timer);
}
