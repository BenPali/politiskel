/* The guided tour for newcomers: a few steps across the site, each on its
   page, each pointing at one thing. It starts on its own the first time a
   member is signed in, and again from the account page. Where it is kept:
   this browser, under one key — "done" once finished or skipped. */

import { L } from '$lib/i18n/fr.js';

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

/** whether the tour has yet to be seen in this browser */
export const tourPending = () => read() !== 'done';

export function startTour() {
	tour.step = 0;
	tour.active = true;
}
export function endTour() {
	tour.active = false;
	write('done');
}
export function nextStep() {
	if (tour.step >= STEPS.length - 1) return endTour();
	tour.step += 1;
}
export function prevStep() {
	if (tour.step > 0) tour.step -= 1;
}
