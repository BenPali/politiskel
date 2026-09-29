/* A member's signature against the parties: where they stand apart, where
   they blend in, and, when there is one, a tension.

   No page and no wording in here, and no import, so that Node can load it
   as it is (tools/signature-check.js measures its thresholds, and
   tools/signature-test.js tests it). It returns keys and numbers; the copy
   lives in the locale table.

   The reference is the CHES party data already in the repo, all countries
   pooled: 279 parties carry x and y and most carry the secondary readings.
   Nothing is invented for it, and nothing is stored: the correlations
   are computed from the parties on first use.

   A tension is a pair of readings that go together among the parties,
   which the member combines the other way round: pro-European and
   protectionist, say, where parties that are one are mostly not the other.
   It needs the pair to be correlated (MIN_CORR), both positions to be
   marked (LEAN), and the member to sit in the quadrant the pattern
   leaves empty. A centrist has none, and none is shown then. The thresholds
   were chosen with tools/signature-check.js, which shows that noise passes
   none of them. */

/* The readings the parties can be compared on, by the key the bands use,
   and the field each is found in on a party. */
export const READINGS = ['x', 'y', 'protectionism', 'europe', 'ecology', 'people'];
export const PARTY_FIELD = { x: 'x', y: 'y', protectionism: 'prot', europe: 'eu', ecology: 'env', people: 'pop' };

/* a pair counts as a pattern from this correlation on (among parties) */
export const MIN_CORR = 0.4;
/* a position is marked from this far off the middle of the scale, on [-100, 100] */
export const LEAN = 30;
/* "blends in with" a party: within this many points on a reading */
export const BAND = 15;
/* and it is a tension only if this few of the parties combine the pair as the
   member does (a share): a quadrant a third of the parties sit in is no
   contradiction, whatever the correlation says */
export const RARE = 0.03;
/* a pair needs this many parties carrying both readings to be read at all */
export const MIN_PARTIES = 60;
/* no standout or blend line unless the two differ by this share of the parties */
export const MIN_GAP = 0.1;

const finite = (v) => typeof v === 'number' && Number.isFinite(v);

/* Pearson correlation of two equal-length lists, NaN when either is flat. */
export function correlation(a, b) {
	const n = a.length;
	if (n < 3) return NaN;
	let ma = 0, mb = 0;
	for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
	ma /= n; mb /= n;
	let num = 0, da = 0, db = 0;
	for (let i = 0; i < n; i++) {
		const u = a[i] - ma, v = b[i] - mb;
		num += u * v; da += u * u; db += v * v;
	}
	return da && db ? num / Math.sqrt(da * db) : NaN;
}

/* The reference: the surveyed parties of every country, and how each pair
   of readings goes among those carrying both. Hand estimates are left out,
   they carry no secondary reading and are not the experts'. */
export function referenceOf(countries) {
	const parties = [];
	for (const c of countries) for (const p of c.parties) if (p.src === 'ches') parties.push(p);
	return { parties, pairs: pairsOf(parties) };
}

/* Every pair of readings with enough parties behind it: its correlation and
   how many parties carry both. */
export function pairsOf(parties) {
	const out = [];
	for (let i = 0; i < READINGS.length; i++) {
		for (let j = i + 1; j < READINGS.length; j++) {
			const A = PARTY_FIELD[READINGS[i]], B = PARTY_FIELD[READINGS[j]];
			const both = parties.filter((p) => finite(p[A]) && finite(p[B]));
			if (both.length < MIN_PARTIES) continue;
			out.push({ a: READINGS[i], b: READINGS[j], n: both.length, r: correlation(both.map((p) => p[A]), both.map((p) => p[B])) });
		}
	}
	return out;
}

/* A member's readings, from what the compass computed for them (coords()):
   null wherever the questionnaire has too few answers behind the reading.
   The theme readings (Europe, ecology, people) already wait for every
   sub-dimension to have its answers; protectionism has no such wait, so its
   own count is checked here, as firm() does in the compass's model. */
export function readingsOf(c, minPerDim) {
	const out = {};
	if (!c) return out;
	const put = (k, v) => { out[k] = finite(v) ? v : null; };
	put('x', c.x);
	put('y', c.y);
	const prot = c.quiz;
	put('protectionism', prot && prot.n && prot.n.protectionism >= minPerDim ? prot.protectionism : null);
	put('europe', c.eu?.europe);
	put('ecology', c.ecology?.ecology);
	put('people', c.inst?.people);
	return out;
}

const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);

/* Where the member stands on one reading against the parties: how many are
   within BAND points of them, out of those that carry the reading. */
export function nearOn(value, key, parties) {
	const f = PARTY_FIELD[key];
	let m = 0, n = 0;
	for (const p of parties) {
		if (!finite(p[f])) continue;
		m++;
		if (Math.abs(p[f] - value) <= BAND) n++;
	}
	return { key, value, n, m, share: m ? n / m : 0 };
}

/* The member's tension: among the pairs that go together (or against each
   other) among the parties, the one they combine the wrong way round, the
   rarest first. `n` of `m` parties combine the two as the member does, with
   the same lean. Null when there is none. `opts` overrides the constants,
   for the measuring script. */
export function tensionOf(values, ref, opts = {}) {
	const minCorr = opts.minCorr ?? MIN_CORR, lean = opts.lean ?? LEAN, rare = opts.rare ?? RARE;
	let best = null;
	for (const pair of ref.pairs) {
		if (!(Math.abs(pair.r) >= minCorr)) continue;
		const a = values[pair.a], b = values[pair.b];
		if (!finite(a) || !finite(b) || Math.abs(a) < lean || Math.abs(b) < lean) continue;
		/* the pattern: a positive correlation puts the poles' signs together */
		if (sign(a) * sign(b) !== -sign(pair.r)) continue;
		const A = PARTY_FIELD[pair.a], B = PARTY_FIELD[pair.b];
		let n = 0, m = 0;
		for (const p of ref.parties) {
			if (!finite(p[A]) || !finite(p[B])) continue;
			m++;
			if (sign(p[A]) === sign(a) && sign(p[B]) === sign(b) && Math.abs(p[A]) >= lean && Math.abs(p[B]) >= lean) n++;
		}
		if (!m || n / m > rare) continue;
		const t = { a: pair.a, b: pair.b, va: a, vb: b, r: pair.r, n, m };
		const rarer = !best || n / m < best.n / best.m ||
			(n / m === best.n / best.m && Math.min(Math.abs(a), Math.abs(b)) * Math.abs(pair.r) > Math.min(Math.abs(best.va), Math.abs(best.vb)) * Math.abs(best.r));
		if (rarer) best = t;
	}
	return best;
}

/* The signature: { standout, blend, tension }, each null when it does not
   hold; null altogether when there is nothing to show. `values` maps a
   reading key to the member's value or null (see readingsOf). */
export function signatureOf(values, ref) {
	if (!values || !ref || !ref.parties.length) return null;
	const near = READINGS.filter((k) => finite(values[k])).map((k) => nearOn(values[k], k, ref.parties)).filter((s) => s.m > 0);
	let standout = null, blend = null;
	if (near.length >= 2) {
		const sorted = near.slice().sort((p, q) => p.share - q.share);
		const lo = sorted[0], hi = sorted[sorted.length - 1];
		if (hi.share - lo.share >= MIN_GAP) { standout = lo; blend = hi; }
	}
	const tension = tensionOf(values, ref);
	if (!standout && !tension) return null;
	return { standout, blend, tension };
}
