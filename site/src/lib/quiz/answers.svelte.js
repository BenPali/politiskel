/* One's own answers while answering. Signed in, they are the server's copy,
   saved half a second after the last answer so a run of answers is one
   request; a save that did not leave is kept and sent again. As a guest
   they live in this browser only. */

import { api, apiError } from '$lib/api.js';
import { session } from '$lib/session.svelte.js';
import { board } from '$lib/compass/board.svelte.js';
import { L } from '$lib/i18n/fr.js';

const GUEST_KEY = 'politiskel.guest.v1';

export const mine = $state({
	/** "server" or "guest" */
	mode: 'server',
	answers: {},
	status: ''
});

/* the guest's profile, kept in this browser: an alias and the answers */
export function readGuest() {
	try {
		const g = JSON.parse(localStorage.getItem(GUEST_KEY) || 'null');
		return g && typeof g === 'object' ? { alias: String(g.alias || ''), answers: g.answers || {} } : null;
	} catch {
		return null;
	}
}
export function writeGuest(g) {
	try {
		g === null ? localStorage.removeItem(GUEST_KEY) : localStorage.setItem(GUEST_KEY, JSON.stringify(g));
	} catch {
		/* quota, or private browsing */
	}
}

export function startMine(mode) {
	mine.mode = mode;
	mine.answers = mode === 'server' ? { ...(session.me?.profile?.answers || {}) } : { ...(readGuest()?.answers || {}) };
}

let timer = null;
let pending = null;
let inflight = null;

export function setAnswer(key, value) {
	mine.answers = { ...mine.answers, [key]: value };
	persist();
}
export function eraseKeys(keys) {
	const a = { ...mine.answers };
	for (const k of keys) delete a[k];
	mine.answers = a;
	persist();
}

function persist() {
	if (mine.mode === 'guest') {
		const g = readGuest() || { alias: '', answers: {} };
		writeGuest({ ...g, answers: mine.answers });
		return;
	}
	clearTimeout(timer);
	pending = { ...mine.answers };
	timer = setTimeout(flush, 500);
}

/* Sends what is pending, and returns only once nothing is in flight: a page
   about to read the answers back must not do so mid-save. */
export async function flush() {
	clearTimeout(timer);
	while (inflight) await inflight;
	const answers = pending;
	if (!answers || !session.me) return;
	pending = null;
	inflight = (async () => {
		const r = await api('PUT', '/api/me/profile', { answers });
		mine.status = r.ok ? L.saved : apiError(r);
		if (r.ok) {
			session.me.profile = r.data;
			/* the compass reloads the group next time, with these answers */
			board.loaded = false;
		}
		if (r.status === 0) {
			if (!pending) pending = answers;
			timer = setTimeout(flush, 5000);
		}
	})();
	try {
		await inflight;
	} finally {
		inflight = null;
	}
}
