/* The badges a profile earns: one for each trait it marks, at three levels,
   and a few about the profile itself or the way through the questionnaire.

   A trait's strength is the flag's (flag.js traitStrengths), read before
   the flag's own thresholds, so that a badge and the flag never disagree on
   what a profile is. A few badges read what the flag does not draw: the
   other end of a reading (defence against pacifism, parliament against a
   strong executive), Russia and the international readings, the centre.
   Nothing here is stored: badges are computed from the answers each time,
   like the compass. The drawings are in scenes/, loaded only where shown. */
import { traitStrengths } from '$lib/flag/flag.js';
import { progressOf, ALL } from '$lib/quiz/flow.js';
import { PolitiModel } from '$lib/model.js';

export const LEVELS = [60, 75, 90];
export const levelOf = (s) => (s >= 90 ? 3 : s >= 75 ? 2 : s >= 60 ? 1 : 0);

/* the catalog, in the order of the badge page */
export const FAMILIES = [
	['economy', ['robin', 'hand', 'classstruggle', 'camarade', 'rose', 'picket', 'customs', 'factory', 'market']],
	['society', ['sheriff', 'liberties', 'hussard', 'temple', 'cocarde', 'globe', 'mosaic', 'feminism', 'pride', 'tightrope', 'reform', 'barricade']],
	['ecology', ['forest', 'snail', 'turbines', 'atom']],
	['world', ['eustars', 'border', 'dove', 'defence', 'ironcurtain', 'datcha', 'bluehelmet']],
	['institutions', ['ballot', 'megaphone', 'executive', 'hemicycle', 'colombey']],
	['profile', ['orphan', 'loyal', 'oddball', 'undecided', 'weathervane', 'soulmate']],
	['journey', ['firststep', 'explorer', 'diligent']]
];
export const SINGLE = new Set(['orphan', 'loyal', 'oddball', 'undecided', 'weathervane', 'soulmate', 'firststep', 'explorer', 'diligent']);
/* A girouette needs to know how often answers changed, which nothing
   records yet: the badge is drawn in the catalog and never awarded. */
export const SOON = new Set(['weathervane']);
/* shown to the member alone: it says where another member stands */
export const PRIVATE = new Set(['soulmate']);

/* badge → the flag trait it reads */
const TRAIT = {
	robin: 'redistribution', hand: 'deregulation', classstruggle: 'class', camarade: 'communism', rose: 'socdem',
	picket: 'syndicalism', customs: 'protectionism', factory: 'productivism', market: 'market',
	sheriff: 'laworder', liberties: 'liberties', hussard: 'secular', temple: 'tradition', cocarde: 'nation',
	globe: 'cosmopolitan', mosaic: 'multicultural', feminism: 'feminism', pride: 'lgbt', reform: 'reform',
	barricade: 'revolution', forest: 'ecology', snail: 'degrowth', turbines: 'transition', atom: 'nuclear',
	eustars: 'federalism', border: 'sovereignty', dove: 'pacifism', ballot: 'direct', megaphone: 'populism',
	colombey: 'gaullism'
};

const num = (v) => (Number.isFinite(v) ? v : null);
const neg = (v) => (num(v) === null ? null : -v);

/* Strengths the flag does not carry. The centre is the nearness of both
   axes to zero: 60 within 16 points, 75 within 10, 90 within 4. */
function extraStrengths(c) {
	const r = c.readings || {};
	const centre = num(c.x) !== null && num(c.y) !== null ? 100 - 2.5 * Math.max(Math.abs(c.x), Math.abs(c.y)) : null;
	return {
		tightrope: centre, defence: neg(r.pacifism), ironcurtain: neg(r.russia), datcha: num(r.russia),
		bluehelmet: num(r.world), executive: num(r.executive), hemicycle: neg(r.executive)
	};
}

/* Traits that seldom go together: marked on both sides of the social axis,
   or on both sides of the economic one, through different questions. */
const OPEN = ['liberties', 'feminism', 'pride', 'mosaic', 'globe'];
const ORDER = ['sheriff', 'temple', 'cocarde', 'border'];
const LEFT = ['robin', 'classstruggle', 'picket', 'customs'];
const RIGHT = ['hand', 'market'];

/* ctx: { country, members }: the parties of the country on show, and the
   other members of the group for the one badge that looks at them */
export function badgesOf(p, c, ctx = {}) {
	const out = [];
	const raw = traitStrengths(c, p);
	const extra = extraStrengths(c);
	for (const [, keys] of FAMILIES)
		for (const key of keys) {
			if (SINGLE.has(key)) continue;
			const s = TRAIT[key] ? raw[TRAIT[key]] : extra[key];
			const level = num(s) === null ? 0 : levelOf(s);
			if (level) out.push({ key, level, strength: Math.round(s) });
		}
	const has = new Set(out.map((b) => b.key));
	const any = (list) => list.some((k) => has.has(k));
	const one = (key) => out.push({ key, level: 1, strength: null });

	const placed = num(c.x) !== null && num(c.y) !== null;
	const answers = (p && p.answers) || {};
	const values = Object.values(answers);
	if (placed && ctx.country) {
		const refs = ctx.country.parties;
		const nearest = PolitiModel.rankParties(c, refs)[0];
		if (nearest && nearest.d > PolitiModel.limitsFor(refs).far) one('orphan');
		if (nearest && nearest.d <= 5) one('loyal');
	}
	if ((any(OPEN) && any(ORDER)) || (any(LEFT) && any(RIGHT))) one('oddball');
	const dk = values.filter((v) => v === 'dk').length;
	if (values.length >= 20 && dk / values.length >= 0.25) one('undecided');
	if (placed && ctx.members && p.me) {
		const near = ctx.members.filter((m) => m.id !== p.id && num(m.x) !== null && num(m.y) !== null
			&& Math.hypot(m.x - c.x, m.y - c.y) <= 5);
		if (near.length) out.push({ key: 'soulmate', level: 1, strength: null, with: near.map((m) => m.alias) });
	}
	if (placed) one('firststep');
	const all = progressOf(ALL, answers);
	if (all.total && all.done === all.total) {
		one('explorer');
		if (!dk) one('diligent');
	}
	return out;
}

const FAMILY_OF = Object.fromEntries(FAMILIES.flatMap(([f, keys]) => keys.map((k) => [k, f])));
export const familyOf = (key) => FAMILY_OF[key];

/* strongest first; the profile and journey badges after the traits */
export const sortBadges = (list) =>
	[...list].sort((a, b) => SINGLE.has(a.key) - SINGLE.has(b.key) || b.level - a.level || (b.strength || 0) - (a.strength || 0));
