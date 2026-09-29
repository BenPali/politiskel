/* Which historical figure a profile resembles, for the "Pour rire" page.

   A pure module, importable by Node (tools/fun-check.js and
   tools/fun-measure.js run it). It reads a profile and the catalogue of
   figures.js and touches nothing else: not score(), not the party
   comparison, not the board. It is not a reading of the compass and is never
   fed back into one.

   The distance lives in the model's own space. The two axes are the
   compass's, on the same [-100, 100] scale, and the proximity notions are the
   model's: `near`, `far` and `tie` come from PolitiModel.limitsFor, derived
   here from the catalogue's own spacing exactly as they are from a country's
   parties, and fitOf gives the same keys. What limitsFor measures is a
   catalogue, so they are the catalogue's, not the parties'.

   Secondary readings (Europe, pacifism, populism, ecology) count only when
   both sides carry one; a null on either side is ignored. The profile's own
   readings come from coords(p).readings, which compass/model.js already
   gates with firm() and PolitiQuiz.MIN_PER_DIM: a reading built from a
   single answer (worth plus or minus 100 on its own) is null there, and so
   never counts here. */

import { PolitiModel } from '../model.js';
import { FIGURES } from './figures.js';

export const READINGS = ['europe', 'pacifism', 'populism', 'ecology'];

/* A low-confidence figure needs to be that much closer to win: its distance
   is multiplied. Measured in tools/fun-measure.js, not asserted. */
export const CONFIDENCE_FACTOR = { high: 1, medium: 1.06, low: 1.2 };

/* Secondary readings refine the axes' distance, they never override it. A
   first version added them to the squared distance; measured, they then
   decided every match, since two positions on a reading differ by tens of
   points where the nearest figure on the axes is a few points away. Now the
   axes' distance is multiplied by a factor between 0.76 (readings alike) and
   1.56 (readings opposed), and 1 when the readings shared are, on average,
   NEUTRAL apart. That neutral point is the gap between a random figure and a
   random profile, about 60 points on a reading, so a figure that carries
   readings is not penalised for carrying them. One shared reading counts for
   half, two or more for the whole. A figure with no reading in common is
   left as the axes place it. */
const BETA = 0.4;
const NEUTRAL = 0.6;

const finite = (v) => typeof v === 'number' && Number.isFinite(v);

/* The profile as this module reads it, from a coords() result (or any object
   with x, y and readings). */
export function profileOf(c) {
	const readings = {};
	for (const k of READINGS) readings[k] = finite(c?.readings?.[k]) ? c.readings[k] : null;
	return { x: finite(c?.x) ? c.x : null, y: finite(c?.y) ? c.y : null, readings };
}

/* The distance between two positions ({x, y, readings}), in axis points, and
   the readings both carry. */
export function distance(a, b) {
	const axes = Math.hypot(a.x - b.x, a.y - b.y);
	const shared = READINGS.filter((k) => finite(a.readings?.[k]) && finite(b.readings?.[k]));
	if (!shared.length) return { d: axes, shared };
	const apart = shared.reduce((s, k) => s + Math.abs(a.readings[k] - b.readings[k]), 0) / shared.length / 100;
	const strength = Math.min(shared.length, 2) / 2;
	return { d: axes * (1 + strength * BETA * (apart - NEUTRAL)), shared };
}

/* The model's near / far / tie for a catalogue, computed once. */
const limitsCache = new WeakMap();
export function limitsOf(catalogue = FIGURES) {
	if (!limitsCache.has(catalogue)) limitsCache.set(catalogue, PolitiModel.limitsFor(catalogue));
	return limitsCache.get(catalogue);
}

/* "You are closer to this figure than X% of the catalogue is": the share of
   the other figures that lie farther from this one than the profile does.
   Only the catalogue can say it, hence no absolute percentage. */
export function percentileOf(profile, figure, catalogue = FIGURES) {
	const d = distance(profile, figure).d;
	const others = catalogue.filter((f) => f !== figure);
	if (!others.length) return 100;
	return Math.floor((100 * others.filter((f) => distance(figure, f).d > d).length) / others.length);
}

/* The match of a profile: null when it has no place on both axes, otherwise
   every figure ranked, and what may be claimed:
     tie      the top two are within the model's tie limit: no winner, `tied`
              lists them all
     fit      near, moderate or far, of the best figure's adjusted distance
     best / second   with distance, adjusted distance, readings shared, and
              the percentile within the catalogue */
export function matchProfile(input, catalogue = FIGURES) {
	const profile = profileOf(input);
	if (profile.x === null || profile.y === null || !catalogue.length) return null;
	const limits = limitsOf(catalogue);
	const ranked = catalogue
		.map((figure) => {
			const { d, shared } = distance(profile, figure);
			return { figure, d, score: d * CONFIDENCE_FACTOR[figure.confidence], shared };
		})
		.sort((a, b) => a.score - b.score || (a.figure.id < b.figure.id ? -1 : 1));
	const best = ranked[0], second = ranked[1] || null;
	const tied = ranked.filter((r) => r.score - best.score <= limits.tie);
	for (const r of tied.concat(second ? [second] : [])) r.percentile = percentileOf(profile, r.figure, catalogue);
	return {
		profile, ranked, best, second, limits,
		tie: tied.length > 1,
		tied,
		fit: PolitiModel.fitOf(best.score, limits),
		lowConfidence: best.figure.confidence === 'low'
	};
}
