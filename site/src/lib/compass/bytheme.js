/* The nearest party theme by theme, next to the nearest overall. The party
   closest on the whole board is often not the closest on economy alone, or on
   Europe alone, and the difference says more than the ranking does.

   No page in it, and no wording: it returns keys, and the component looks the
   sentences up. Nothing here touches score() or model.js.

   A theme is compared on its own axis only: the profile's score against each
   party's value for that reading, so a distance is a number of points on one
   scale, not a place on the board. The thresholds are the country's own
   (PolitiModel.limitsFor), the ones the party list uses, so "near" and "tie"
   mean the same on both. */

import { PolitiModel, PolitiQuiz } from '../model.js';

/* A theme is only compared where its reading places the profile and where a
   party counterpart exists. `ref` is the value a party carries for it. The
   readings with no counterpart (class, nuclear, Russia, defence...) are not
   here: there is nothing to compare them with. `of` gives the profile's score,
   null while the reading does not stand: the questionnaire's themes wait for
   every sub-dimension to have its answers (PolitiQuiz.MIN_PER_DIM), and
   protectionism, which is not built from dimensions, for that many answers
   on its own. Economy and society read the compass axes, wherever the profile
   got them (questionnaire or PolitiScales), since those are the coordinates
   the overall nearest party is drawn from.

   Order is the order shown. */
const firm = (score, r) => (score && score.n && score.n[r] >= PolitiQuiz.MIN_PER_DIM ? score[r] : null);

export const THEMES = [
	{ key: 'economy', ref: 'x', of: (c) => c.x },
	{ key: 'protectionism', ref: 'prot', of: (c) => firm(c.quiz, 'protectionism') },
	{ key: 'society', ref: 'y', of: (c) => c.y },
	{ key: 'europe', ref: 'eu', of: (c) => c.eu?.europe },
	{ key: 'ecology', ref: 'env', of: (c) => c.ecology?.ecology },
	{ key: 'institutions', ref: 'pop', of: (c) => c.inst?.people }
];

/* What a theme comes to, for a profile:
     unplaced          the profile has no firm score on it
     unmeasured        fewer than two parties carry the reading in this country
     same              its nearest party is the overall one: nothing to add
     tied-with-overall the overall party is as close (within the tie limit):
                       naming another one would overstate the difference
     ex-aequo          another party is nearest, and one or two others are within
                       the tie limit of it: one name alone would overstate, all
                       are named
     crowded           more than that are within the tie limit: no name says
                       anything
     distinct          another party is clearly the nearest
   Only ex-aequo and distinct are worth showing. */
export const SHOWN = new Set(['ex-aequo', 'distinct']);

/* Names in a tie the page can carry. Past this a list is a shrug. */
export const MAX_NAMED = 3;

const rankOn = (theme, value, parties) =>
	parties
		.filter((r) => Number.isFinite(r[theme.ref]))
		.map((r) => ({ name: r.name, ref: r, d: Math.round(Math.abs(r[theme.ref] - value)) }))
		.sort((a, b) => a.d - b.d);

/* The parties nearest overall, on the whole board: the best, and the ones
   within the tie limit of it, since the page names those together. */
export function overallOf(c, country, limits) {
	if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) return null;
	const ranked = PolitiModel.rankParties(c, country.parties);
	if (!ranked.length) return null;
	const names = ranked.filter((r) => r.d - ranked[0].d <= limits.tie).map((r) => r.name);
	return { name: ranked[0].name, d: ranked[0].d, names };
}

/* c: a profile as coords() gives it. Returns the overall nearest party (null
   when the profile has no place on the board) and one entry per theme. */
export function byTheme(c, country, limits = PolitiModel.limitsFor(country.parties)) {
	const overall = overallOf(c, country, limits);
	const themes = THEMES.map((theme) => {
		const value = theme.of(c);
		if (!Number.isFinite(value)) return { key: theme.key, status: 'unplaced' };
		const ranked = rankOn(theme, value, country.parties);
		const measured = { n: ranked.length, of: country.parties.length };
		if (ranked.length < 2) return { key: theme.key, status: 'unmeasured', measured };
		const best = ranked[0];
		const out = { key: theme.key, value, measured, best: { name: best.name, ref: best.ref, d: best.d, fit: PolitiModel.fitOf(best.d, limits) },
			second: { name: ranked[1].name, d: ranked[1].d }, margin: ranked[1].d - best.d };
		if (overall) {
			const own = ranked.find((r) => r.name === overall.name);
			out.overall = own ? { name: own.name, d: own.d } : null;
			if (overall.names.includes(best.name)) return { ...out, status: 'same' };
			/* any of the overall parties as close as the best, on this theme */
			if (ranked.some((r) => overall.names.includes(r.name) && r.d - best.d <= limits.tie)) return { ...out, status: 'tied-with-overall' };
		}
		const others = ranked.filter((r) => r !== best && !(overall && overall.names.includes(r.name)));
		out.tied = others.filter((r) => r.d - best.d <= limits.tie).map((r) => ({ name: r.name, d: r.d }));
		out.status = !out.tied.length ? 'distinct' : out.tied.length + 1 > MAX_NAMED ? 'crowded' : 'ex-aequo';
		return out;
	});
	return { overall, themes };
}
