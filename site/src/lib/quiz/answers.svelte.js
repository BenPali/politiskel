/* One's own answers while answering. Signed in, they are the server's copy:
   an answer waits while its question is on screen — it may still change —
   and is saved when the reader moves on (flush, called by the page), or
   when the page is left or closed. Quietly: only a failure says so. A save
   that did not leave is kept and sent again. As a guest they live in this
   browser only. */

import { api, apiError } from '$lib/api.js';
import { session } from '$lib/session.svelte.js';
import { board } from '$lib/compass/board.svelte.js';
import { L } from '$lib/i18n/fr.js';
import { toast } from '$lib/toast.svelte.js';

const GUEST_KEY = 'politiskel.guest.v1';

export const mine = $state({
	/** "server" or "guest" */
	mode: 'server',
	answers: {},
});

/* the guest's profile, kept in this browser: the answers, and a
   PolitiScales result with its flag when one was imported */
export function readGuest() {
	try {
		const g = JSON.parse(localStorage.getItem(GUEST_KEY) || 'null');
		return g && typeof g === 'object'
			? { alias: String(g.alias || ''), answers: g.answers || {}, politiscales: g.politiscales || null, flag: g.flag || null }
			: null;
	} catch {
		return null;
	}
}
/* the guest as a group member would come from the server */
export function guestMember() {
	const g = readGuest();
	return g ? { username: L.guestName, me: true, owner: false, politiscales: g.politiscales, answers: g.answers, flag: g.flag } : null;
}
export function updateGuest(part) {
	writeGuest({ alias: '', answers: {}, politiscales: null, flag: null, ...(readGuest() || {}), ...part });
}
export function writeGuest(g) {
	try {
		g === null ? localStorage.removeItem(GUEST_KEY) : localStorage.setItem(GUEST_KEY, JSON.stringify(g));
	} catch {
		/* quota, or private browsing */
	}
}

let timer = null;
/* what waits to be sent, and whose it is: a save is only ever sent for the
   account that made it, never for whoever is signed in by then */
let pending = null;
let pendingFor = null;
let inflight = null;
let retrying = false;

export function startMine(mode) {
	const who = session.me?.username ?? null;
	/* answers of this account not yet on the server are newer than its copy:
	   keep them rather than reload what they replace */
	if (mode === 'server' && mine.mode === 'server' && who && pendingFor === who && (pending || inflight)) return;
	mine.mode = mode;
	mine.answers = mode === 'server' ? { ...(session.me?.profile?.answers || {}) } : { ...(readGuest()?.answers || {}) };
}

/* Signing out: whatever was waiting belonged to that account, and goes. */
export function forgetPending() {
	clearTimeout(timer);
	pending = null;
	pendingFor = null;
	mine.answers = {};
}

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

/* Every answer, every theme: gone, and saved at once. */
export async function eraseAll() {
	mine.answers = {};
	persist();
	await flush();
}

function persist() {
	if (mine.mode === 'guest') {
		updateGuest({ answers: mine.answers });
		/* the compass reads the guest again next time */
		board.loaded = false;
		return;
	}
	clearTimeout(timer);
	pending = { ...mine.answers };
	pendingFor = session.me?.username ?? null;
}

/* The page is being closed: what waits goes in one last request, which the
   browser finishes even once the page is gone. */
export function flushOnExit() {
	if (!pending || !session.me || session.me.username !== pendingFor) return;
	try {
		fetch('/api/me/profile', {
			method: 'PUT', keepalive: true, credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: pending })
		});
		pending = null;
	} catch {
		/* too large for keepalive, or no fetch: the next visit's answers stand */
	}
}

/* Sends what is pending, and returns only once nothing is in flight: a page
   about to read the answers back must not do so mid-save. */
export async function flush() {
	clearTimeout(timer);
	while (inflight) await inflight;
	const answers = pending;
	if (!answers || !session.me) return;
	if (session.me.username !== pendingFor) {
		pending = pendingFor = null;
		return;
	}
	pending = null;
	inflight = (async () => {
		const r = await api('PUT', '/api/me/profile', { answers });
		/* a network failure retries on its own; any other refusal is said */
		if (!r.ok && r.status !== 0) toast(apiError(r), { kind: 'error' });
		if (r.status === 0 && !retrying) toast(L.saveRetrying, { kind: 'error', ms: 6000 });
		retrying = r.status === 0;
		if (r.ok) {
			session.me.profile = r.data;
			/* the compass reloads the group next time, with these answers */
			board.loaded = false;
		}
		if (r.status === 0) {
			if (!pending) {
				pending = answers;
				pendingFor = session.me?.username ?? null;
			}
			timer = setTimeout(flush, 5000);
		}
	})();
	try {
		await inflight;
	} finally {
		inflight = null;
	}
}
