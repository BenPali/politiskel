/* The compass's arithmetic, with no page in it: a member's coordinates on
   each reading, the parties a reading keeps, the nearest party, every
   distance. The model itself is tools/politi-model.js; this is the layer
   that looks the wording up and applies the questionnaire. */

import { L } from '$lib/i18n/fr.js';
import { PolitiModel, PolitiQuiz } from '$lib/model.js';

export const AXES = PolitiModel.AXES;
AXES.forEach((a) => {
	a.neg[1] = L.axis[a.neg[0]];
	a.pos[1] = L.axis[a.pos[0]];
});
export const COUNTRIES = PolitiModel.COUNTRIES;

/* Readings of the compass: the same profiles and parties, along other axes.
   A reading with no party counterpart does not belong here. */
export const VIEWS = [{ key: 'politiskel' }, { key: 'politiscales' }, { key: 'protectionism' }, { key: 'europe' }, { key: 'ecology' }, { key: 'populist' }];

/* The readings drawn as y against the economy, and where each is found:
   on the profile's score for a theme, and on each party. */
const SIDE = {
	protectionism: { of: (c) => c.quiz?.protectionism, ref: 'prot' },
	europe: { of: (c) => c.eu?.europe, ref: 'eu', score: (c) => c.eu, theme: 'europe' },
	ecology: { of: (c) => c.ecology?.ecology, ref: 'env', score: (c) => c.ecology, theme: 'ecology' },
	populist: { of: (c) => c.inst?.people, ref: 'pop', score: (c) => c.inst, theme: 'institutions', ysrc: 'populisme : POPPA 2023' }
};

/* Whether a reading has anything to draw in a country: a reading against
   the economy needs parties that carry its measure (none carry POPPA's in
   Turkey, CHES protectionism in Italy, anything but estimates in the US). */
export const viewAvailable = (viewKey, country) => {
	const side = SIDE[viewKey];
	return !side || !country || country.parties.some((r) => r[side.ref] !== undefined);
};

/* A theme's own reading, as each party carries it (CHES for Europe, POPPA for populism) */
export const THEME_REF = { europe: 'eu', ecology: 'env', institutions: 'pop' };

/* Copy for a reading, falling back on the default wording. */
export const copyOf = (viewKey) => Object.assign({}, L, L.views[viewKey] || {});

/* Provenance is shown, not hidden: a hand estimate and a surveyed position
   should not look alike. */
export const noteOf = (r) => r.note + ' (' + (r.src === 'ches' ? 'CHES 2024' : 'estimation') + (r.ysrc ? ' ; ' + r.ysrc : '') + ')';

/* A member as the server sends it, as the compass reads it. */
export function fromMember(m) {
	return Object.assign(
		{ alias: m.username, id: m.username, me: !!m.me, owner: !!m.owner, flag: m.flag || null, slogan: null, answers: m.answers || {} },
		m.politiscales || {}
	);
}

export const hasPolitiscales = (p) =>
	AXES.some((a) => Number.isFinite(p[a.neg[0]]) || Number.isFinite(p[a.pos[0]]));

/* A questionnaire axis replaces the PolitiScales one wholesale, never averaged
   with it; `from` keeps where PolitiScales had put the profile. */
function withQuiz(p, c) {
	const answers = p.answers;
	if (!answers || !Object.keys(answers).length) return c;
	c.quiz = PolitiQuiz.score(answers, 'economy');
	c.soc = PolitiQuiz.score(answers, 'society');
	c.eu = PolitiQuiz.score(answers, 'europe');
	c.inst = PolitiQuiz.score(answers, 'institutions');
	c.ecology = PolitiQuiz.score(answers, 'ecology');
	/* readings by name, for the flag and the badges */
	c.readings = { europe: c.eu.europe, pacifism: c.eu.defence === null ? null : -c.eu.defence, populism: c.inst.people, directdemocracy: c.inst.dims.direct,
		ecology: c.ecology.ecology, transition: c.ecology.transition, nuclear: c.ecology.nuclear, degrowth: c.ecology.degrowth,
		russia: c.eu.russia, world: c.eu.world, executive: c.inst.executive };
	/* the questionnaire's ecology replaces PolitiScales's in the readout, as an axis does */
	if (c.ecology.ecology !== null) c.ecol = c.ecology.ecology;
	const ps = { x: c.x, y: c.y };
	if (c.quiz.x !== null) {
		c.x = c.quiz.x;
		c.xSrc = 'quiz';
	}
	if (c.soc.y !== null) {
		c.y = c.soc.y;
		c.ySrc = 'quiz';
	}
	if (!c.native && (c.xSrc || c.ySrc)) {
		c.from = ps;
		c.psX = ps.x;
		c.psY = ps.y;
	}
	return c;
}

export function coords(p) {
	if (!hasPolitiscales(p)) return withQuiz(p, { x: null, y: null, ecol: null, sov: null, method: null, native: true });
	const c = PolitiModel.coords(p);
	if (c.method) c.method = L.method[c.method];
	return withQuiz(p, c);
}

/* A profile on a reading: null where the reading cannot place it, and off
   the chart then (its row stays in the table, marked). */
export function project(p, viewKey) {
	const c = coords(p);
	const v = viewKey === 'politiskel' ? c : Object.assign({}, c, { base: c, from: null });
	if (viewKey === 'politiscales') {
		v.x = c.native ? null : c.psX !== undefined ? c.psX : c.x;
		v.y = c.native ? null : c.psY !== undefined ? c.psY : c.y;
		v.xSrc = v.ySrc = null;
	} else if (SIDE[viewKey]) {
		const y = SIDE[viewKey].of(c);
		v.y = y === undefined ? null : y;
		v.ySrc = null;
		/* y is not the society axis here: a profile's own bands read `base` */
		v.side = viewKey;
	}
	if (v.x === null || v.y === null) v.off = true;
	return v;
}

/* The parties a reading keeps: those measured on its axes. */
export function referencesOf(country, viewKey) {
	const side = SIDE[viewKey];
	if (!side) return country.parties;
	return country.parties.filter((r) => r[side.ref] !== undefined).map((r) => ({ ...r, y: r[side.ref], ysrc: side.ysrc }));
}

export const limitsOf = (refs) => PolitiModel.limitsFor(refs);
export const fitOf = (d, limits) => L.fit[PolitiModel.fitOf(d, limits)];
export const fitPhrase = (d, limits) => (d <= limits.far ? L.proximity + fitOf(d, limits) : L.noCloseParty);

export function nearestReference(x, y, refs, limits) {
	const n = PolitiModel.nearestReference(x, y, refs, limits);
	if (!n) return null;
	n.fit = L.fit[n.fit];
	n.note = noteOf(n.ref);
	return n;
}

/* The journey and the result screen always speak of the default reading. */
export const nearestBase = (x, y, country) =>
	PolitiModel.nearestReference(x, y, country.parties, PolitiModel.limitsFor(country.parties));

export const rankParties = (c, refs) => PolitiModel.rankParties(c, refs).map((r) => Object.assign(r, { note: noteOf(r.ref) }));

/* The mirror image: which profiles come closest to a given party. */
export const rankProfiles = (r, computed) =>
	computed
		.map(({ p, c }, i) => ({ name: p.alias, id: p.id, note: null, i, off: c.off, d: Math.round(Math.hypot(c.x - r.x, c.y - r.y)), dx: c.x - r.x, dy: c.y - r.y }))
		.filter((o) => !o.off)
		.sort((a, b) => a.d - b.d);

/* Why a profile has no place on a reading, for its row. */
export function offReason(c, viewKey) {
	if (!c.off) return L.viewNoRefs;
	if (c.native && !c.quiz) return L.nativeEmpty;
	if (c.native && viewKey === 'politiskel' && c.x !== null) return L.nativeNoY;
	if (c.native && viewKey === 'politiskel' && c.y !== null) return L.nativeNoX;
	if (c.native && viewKey === 'politiskel') return L.nativeNoXY;
	return L.viewOff;
}

/* The notes under a reading: what it drops, and who it cannot place. */
export function viewNotes(viewKey, country, refs, computed) {
	const parts = [];
	if (viewKey === 'politiscales') parts.push(L.viewNotePolitiscales);
	if (viewKey === 'protectionism') {
		const dropped = country.parties.length - refs.length;
		if (country.protWhy) parts.push(L.viewNoteNoProt(country.protWhy));
		else if (!refs.length) parts.push(L.viewNoteAllEstimated);
		else if (dropped) parts.push(L.viewNoteDropped(dropped));
		const offs = computed.map((r) => r.c).filter((c) => c.off);
		const econ = (c) => c.quiz && Object.values(c.quiz.n).some((n) => n > 0);
		const none = offs.filter((c) => !econ(c)).length;
		const noProt = offs.filter((c) => econ(c) && c.y === null).length;
		const noX = offs.filter((c) => econ(c) && c.y !== null && c.x === null).length;
		if (none) parts.push(L.viewNoteOff(none));
		if (noProt) parts.push(L.viewNoteSkippedProt(noProt));
		if (noX) parts.push(L.viewNoteNoX(noX));
	}
	const side = SIDE[viewKey];
	if (side?.theme) {
		const N = L.viewNotesFor[viewKey];
		const dropped = country.parties.length - refs.length;
		if (!refs.length) parts.push(N.allEstimated);
		else if (dropped) parts.push(N.dropped(dropped));
		const offs = computed.map((r) => r.c).filter((c) => c.off);
		/* begun but under the two-per-group threshold is not "no answer" */
		const begun = (c) => side.score(c.base || c)?.provisional != null;
		const none = offs.filter((c) => c.y === null && !begun(c)).length;
		const pending = offs.filter((c) => c.y === null && begun(c)).length;
		const noX = offs.filter((c) => c.y !== null && c.x === null).length;
		if (none) parts.push(N.none(none));
		if (pending) parts.push(N.pending(pending));
		if (noX) parts.push(L.viewNoteNoX(noX));
	}
	return parts;
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const toSvgX = (x) => clamp(300 + x * 2.5, 58, 542);
export const toSvgY = (y) => clamp(300 - y * 2.5, 58, 542);
