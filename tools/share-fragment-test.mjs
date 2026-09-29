#!/usr/bin/env node
/* Checks for the stateless share address (site/src/lib/share/fragment.js):
   round trip, ranges, hostile and malformed input, versions, and that the
   format's tables still cover what the site can produce.

     node tools/share-fragment-test.mjs                                        */
import { register } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lib = pathToFileURL(path.join(root, 'site/src/lib')) + '/';

/* the site's "$lib/" alias, for the modules that import through it */
register('data:text/javascript,' + encodeURIComponent(
	`export async function resolve(s, c, next) {
		if (s.startsWith('$lib/')) return next(${JSON.stringify(lib)} + s.slice(5), c);
		return next(s, c);
	}`));

const F = await import(pathToFileURL(path.join(root, 'site/src/lib/share/fragment.js')));
const { L } = await import(lib + 'i18n/fr.js');
const { SHARE_LAYOUTS } = await import(lib + 'share/layouts.js');
const { THEMES, fromSnapshot } = await import(lib + 'share/card.js');
const { COUNTRIES } = await import(lib + 'compass/model.js');

let failed = 0, checked = 0;
function check(name, ok, detail) {
	checked++;
	if (!ok) { failed++; console.log('  FAIL ' + name + (detail !== undefined ? ' : ' + detail : '')); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sorted = (o) => ({ ...o, values: Object.fromEntries(Object.entries(o.values).sort()) });
const bad = (name, input, reason) => {
	let r;
	try { r = F.decode(input); } catch (e) { return check(name + ' (threw)', false, e.message); }
	check(name, r.ok === false && r.reason === reason, JSON.stringify(r));
};

const sample = {
	country: 'fr', layout: 'story', theme: 'sepia', x: -12.3, y: 45.6,
	values: { europe: 33.3, ecology: -100, class: 100, nuclear: 0 },
	badges: [{ key: 'eustars', level: 3, strength: 92 }, { key: 'loyal', level: 1, strength: null }, { key: 'forest', level: 2, strength: 0 }]
};

/* ---- round trip ---- */
{
	const a = F.encode(sample);
	check('prefix', a.startsWith('v1.'));
	check('compact', a.length < 120, a.length);
	check('url safe', /^v1\.[A-Za-z0-9_-]+$/.test(a));
	const r = F.decode(a);
	check('decodes', r.ok, JSON.stringify(r));
	check('round trip', eq(sorted(r.share), sorted(sample)), JSON.stringify(r.share));
	check('accepts #', eq(F.decode('#' + a), r));
	const none = F.decode(F.encode({ country: 'de', layout: 'wide', theme: 'clair', x: null, y: null, values: {}, badges: [] }));
	check('empty profile', none.ok && none.share.x === null && none.share.y === null && none.share.badges.length === 0, JSON.stringify(none));
	const edge = F.decode(F.encode({ country: 'uk', x: -100, y: 100, values: { europe: -100 }, badges: [] }));
	check('range ends', edge.ok && edge.share.x === -100 && edge.share.y === 100 && edge.share.values.europe === -100);
	const over = F.decode(F.encode({ country: 'fr', x: 1e9, y: -1e9, values: { europe: Infinity, ecology: NaN }, badges: [] }));
	check('encoder clamps, drops non-numbers', over.ok && over.share.x === 100 && over.share.y === -100 && Object.keys(over.share.values).length === 0, JSON.stringify(over));
	const junk = F.decode(F.encode({ country: 'fr', layout: 'nope', theme: '<b>', x: 0, y: 0, values: { evil: 5 },
		badges: [{ key: 'evil', level: 1 }, { key: 'atom', level: 9 }, { key: 'atom', level: 1, strength: 300 }, { key: 'atom', level: 2 }] }));
	check('encoder drops unknowns and duplicates', junk.ok && junk.share.layout === 'wide' && junk.share.theme === 'clair' && eq(junk.share.values, {})
		&& junk.share.badges.length === 1 && junk.share.badges[0].strength === 100, JSON.stringify(junk));
	let threw = false;
	try { F.encode({ country: '<x>' }); } catch { threw = true; }
	check('encoder refuses a bad country', threw);
	const many = F.encode({ country: 'fr', x: 0, y: 0, values: Object.fromEntries(F.READING_KEYS.map((k) => [k, -99.9])),
		badges: F.BADGE_KEYS.map((key) => ({ key, level: 3, strength: 100 })) });
	check('largest address stays under the limit', many.length <= F.MAX_LENGTH, many.length);
	check('largest address decodes', F.decode(many).ok);
}

/* ---- refusals ---- */
bad('undefined', undefined, 'empty');
bad('not a string', { a: 1 }, 'empty');
bad('empty', '', 'empty');
bad('just #', '#', 'empty');
bad('oversize', 'v1.' + 'A'.repeat(F.MAX_LENGTH), 'size');
bad('huge', 'v1.' + 'A'.repeat(5e6), 'size');
bad('no prefix', 'hello', 'malformed');
bad('prefix only', 'v1.', 'malformed');
bad('leading zero version', 'v01.AAAA', 'malformed');
bad('version 0', 'v0.AAAA', 'malformed');
bad('unknown future version', 'v2.whatever-follows', 'version');
bad('unknown version, garbage body', 'v9.<script>alert(1)</script>', 'version');
bad('bad alphabet', 'v1.' + F.encode(sample).slice(3, -1) + '+', 'malformed');
bad('padding', F.encode(sample) + '=', 'malformed');
bad('html', 'v1.<img src=x onerror=alert(1)>', 'malformed');
bad('percent', 'v1.%41%41', 'malformed');
bad('length 4n+1', 'v1.AAAAA', 'malformed');
{
	const a = F.encode(sample);
	bad('truncated', a.slice(0, -4), 'malformed');
	bad('trailing bytes', a + 'AAAA', 'malformed');
}

/* hand-built bodies, to reach each range check */
const b64 = (bytes) => 'v1.' + Buffer.from(bytes).toString('base64url');
const u16 = (n) => [n >> 8, n & 255];
const body = (o = {}) => [
	...(o.country || [102, 114]), o.layout ?? 0, o.theme ?? 0, ...u16(o.x ?? 1000), ...u16(o.y ?? 1000), ...u16(o.mask ?? 0), ...(o.readings || []),
	o.count ?? 0, ...(o.badges || [])];
check('hand-built body is valid', F.decode(b64(body())).ok);
{
	/* an 11-byte body ends on a character with two spare bits: setting one is a second text for the same bytes */
	const t = b64(body()), K = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
	bad('non-canonical tail', t.slice(0, -1) + K[K.indexOf(t.at(-1)) | 1], 'malformed');
}
bad('country not lowercase', b64(body({ country: [70, 82] })), 'malformed');
bad('country not letters', b64(body({ country: [60, 62] })), 'malformed');
bad('layout out of table', b64(body({ layout: 200 })), 'malformed');
bad('theme out of table', b64(body({ theme: F.THEME_KEYS.length })), 'malformed');
bad('x beyond range', b64(body({ x: 2001 })), 'malformed');
bad('y beyond range', b64(body({ y: 65000 })), 'malformed');
check('x none (0xFFFF) is allowed', F.decode(b64(body({ x: 0xffff }))).share?.x === null);
bad('reading bits beyond the table', b64(body({ mask: 1 << F.READING_KEYS.length, readings: u16(1000) })), 'malformed');
bad('reading value beyond range', b64(body({ mask: 1, readings: u16(2001) })), 'malformed');
bad('reading value none', b64(body({ mask: 1, readings: u16(0xffff) })), 'malformed');
bad('reading missing', b64(body({ mask: 1 })), 'malformed');
bad('badge count over the table', b64(body({ count: F.BADGE_KEYS.length + 1 })), 'malformed');
bad('badge count over the bytes', b64(body({ count: 2, badges: [0, 1, 50] })), 'malformed');
bad('badge key out of table', b64(body({ count: 1, badges: [F.BADGE_KEYS.length, 1, 50] })), 'malformed');
bad('badge level 0', b64(body({ count: 1, badges: [0, 0, 50] })), 'malformed');
bad('badge level 4', b64(body({ count: 1, badges: [0, 4, 50] })), 'malformed');
bad('badge strength 101', b64(body({ count: 1, badges: [0, 1, 101] })), 'malformed');
bad('badge repeated', b64(body({ count: 2, badges: [0, 1, 50, 0, 2, 60] })), 'malformed');
check('badge without strength', F.decode(b64(body({ count: 1, badges: [0, 1, 255] }))).share?.badges[0].strength === null);
bad('country cut short', b64([102]), 'malformed');
bad('nothing but the prefix bytes', b64([]), 'malformed');

/* random and mutated input never throws and never returns out-of-range data */
{
	let seed = 12345;
	const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
	const good = F.encode(sample);
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
	let accepted = 0, sane = true;
	for (let i = 0; i < 20000; i++) {
		let s = good.split('');
		for (let k = 0, n = 1 + Math.floor(rnd() * 3); k < n; k++) s[3 + Math.floor(rnd() * (s.length - 3))] = alphabet[Math.floor(rnd() * 64)];
		if (rnd() < 0.2) s = s.slice(0, 3 + Math.floor(rnd() * s.length));
		let r;
		try { r = F.decode(s.join('')); } catch { sane = false; break; }
		if (r.ok) {
			accepted++;
			const v = r.share;
			const inR = (n) => n === null || (n >= -100 && n <= 100);
			if (!inR(v.x) || !inR(v.y) || !Object.values(v.values).every(inR) || !F.LAYOUT_KEYS.includes(v.layout) || !F.THEME_KEYS.includes(v.theme)
				|| !v.badges.every((b) => F.BADGE_KEYS.includes(b.key) && b.level >= 1 && b.level <= 3)) sane = false;
		}
	}
	check('mutations never throw, accepted ones are in range', sane);
	check('mutations sometimes still decode (the check is not vacuous)', accepted > 0 && accepted < 20000, accepted);
	for (let i = 0; i < 5000; i++) {
		const len = Math.floor(rnd() * 500);
		let s = 'v1.';
		for (let k = 0; k < len; k++) s += String.fromCharCode(Math.floor(rnd() * 0x3000));
		try { F.decode(s); F.decode('#' + s); } catch { sane = false; }
	}
	check('arbitrary unicode never throws', sane);
}

/* ---- the tables against the site ---- */
{
	const items = Object.keys(L.badges.items);
	check('every badge is in BADGE_KEYS', items.every((k) => F.BADGE_KEYS.includes(k)), items.filter((k) => !F.BADGE_KEYS.includes(k)).join(','));
	check('BADGE_KEYS holds only badges that exist', F.BADGE_KEYS.every((k) => items.includes(k)), F.BADGE_KEYS.filter((k) => !items.includes(k)).join(','));
	check('no key twice', [F.BADGE_KEYS, F.READING_KEYS, F.LAYOUT_KEYS, F.THEME_KEYS].every((t) => new Set(t).size === t.length));
	check('every layout is in LAYOUT_KEYS', SHARE_LAYOUTS.every((l) => F.LAYOUT_KEYS.includes(l.key)), SHARE_LAYOUTS.map((l) => l.key).join(','));
	check('LAYOUT_KEYS holds only layouts that exist', F.LAYOUT_KEYS.every((k) => SHARE_LAYOUTS.some((l) => l.key === k)));
	check('every theme is in THEME_KEYS', Object.keys(THEMES).every((k) => F.THEME_KEYS.includes(k)));
	check('THEME_KEYS holds only themes that exist', F.THEME_KEYS.every((k) => k in THEMES));
	check('reading bits fit in two bytes', F.READING_KEYS.length <= 16);
	check('every country code is two lowercase letters', COUNTRIES.every((c) => /^[a-z]{2}$/.test(c.code)));

	/* a decoded share goes through the site's own reader, as the page does it */
	const r = F.decode(F.encode(sample));
	const d = fromSnapshot({ v: 1, alias: 'Anonyme', flag: null, ...r.share });
	const zz = F.decode('v1.' + Buffer.from([122, 122, 0, 0, 0x03, 0xe8, 0x03, 0xe8, 0, 0, 0]).toString('base64url'));
	check('a country the site lacks decodes but is not drawn', zz.ok && fromSnapshot({ v: 1, alias: 'A', flag: null, ...zz.share }) === null);
	check('the site reads a decoded share', d && d.placed && d.countryCode === 'fr' && d.badges.length === 3 && d.readings.length === 4, JSON.stringify(d && d.badges));
}

console.log(failed ? `\n${failed} of ${checked} checks FAILED` : `all ${checked} checks pass`);
process.exit(failed ? 1 : 0);
