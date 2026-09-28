/* The guided tour for newcomers: a few steps across the site, each on its
   page, each pointing at one thing. It starts on its own the first time a
   member is signed in, and again from the account page. Seen — finished or
   skipped — is kept with the account, so it shows once per person on any
   browser; this browser keeps it too, for guests and as the first
   version's record, carried over to the account. */

import { L } from '$lib/i18n/fr.js';
import { api } from '$lib/api.js';
import { session } from '$lib/session.svelte.js';

const KEY = 'politiskel.tour.v1';

/** path: the page the step shows; target: its [data-tour] element (none: a
    centred card); click: the step moves on once that element is clicked */
export const STEPS = [
	{ id: 'welcome', path: '/boussole' },
	{ id: 'group', path: '/boussole', target: 'group' },
	{ id: 'compass', path: '/boussole', target: 'compass', click: '#points-layer .mark' },
	{ id: 'profiles', path: '/boussole', target: 'profiles' },
	{ id: 'themes', path: '/questionnaire', target: 'themes' },
	{ id: 'groups', path: '/groupes', target: 'groups' },
	{ id: 'display', path: '/groupes', target: 'display' },
	{ id: 'account', path: '/groupes', target: 'account' },
	{ id: 'end', path: '/questionnaire' }
].map((s) => ({ ...s, ...L.tour.steps[s.id] }));

export const tour = $state({ active: false, step: 0 });

const read = () => {
	try {
		return localStorage.getItem(KEY);
	} catch {
		return 'done';
	}
};
const write = (v) => {
	try {
		localStorage.setItem(KEY, v);
	} catch {
		/* private browsing: the tour simply comes back */
	}
};

/* The accounts that have seen the tour in this browser: the server keeps
   it too, but a reload right after skipping can cancel the request that
   tells it, and the tour came back. */
const SEEN_KEY = 'politiskel.tour.seen.v2';
const seenHere = () => {
	try {
		const list = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
		return Array.isArray(list) ? list : [];
	} catch {
		return [];
	}
};
const addSeenHere = (who) => {
	try {
		const list = seenHere();
		if (!list.includes(who)) localStorage.setItem(SEEN_KEY, JSON.stringify([...list, who].slice(-20)));
	} catch {
		/* private browsing */
	}
};
/* told to the server in a request the browser finishes even if the page goes */
const tellServer = () => {
	try {
		fetch('/api/me/tour', { method: 'POST', keepalive: true, credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seen: true }) });
	} catch {
		api('POST', '/api/me/tour', { seen: true });
	}
};

/** whether the tour has yet to be seen: by this account, signed in */
export function tourPending() {
	if (!session.me) return read() !== 'done';
	if (session.me.tour_seen) return false;
	const who = session.me.username;
	/* seen here, but the server was not told in time: tell it now */
	if (seenHere().includes(who)) {
		session.me.tour_seen = true;
		tellServer();
		return false;
	}
	/* seen in this browser before accounts kept it: the first account signed
	   in here takes it over, and the browser's record goes — another
	   account on this browser has not seen it */
	if (read() === 'done') {
		forget();
		markSeen();
		return false;
	}
	return true;
}
function markSeen() {
	if (!session.me) return write('done');
	addSeenHere(session.me.username);
	if (!session.me.tour_seen) {
		session.me.tour_seen = true;
		tellServer();
	}
}
const forget = () => {
	try {
		localStorage.removeItem(KEY);
	} catch {
		/* private browsing */
	}
};

export function startTour() {
	tour.step = 0;
	tour.active = true;
}
export function endTour() {
	tour.active = false;
	markSeen();
}
export function nextStep() {
	if (tour.step >= STEPS.length - 1) return endTour();
	tour.step += 1;
}
export function prevStep() {
	if (tour.step > 0) tour.step -= 1;
}
