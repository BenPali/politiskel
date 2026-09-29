/* A profile in the address itself: the part of a link after "#", which a
   browser never sends to a server, so that nothing is stored anywhere and no
   account is needed.

   Only results go in, as in a stored share (see snapshotOf in card.js):
   country, position, readings, badges, and the card's layout and theme.
   Never an answer, a name or a flag. Everything decoded is a number or an
   index into a table below, so nothing a stranger wrote can reach the page
   as text.

   The address reads  v1.<base64url>  and the bytes are, in order:
     country            2 bytes, ASCII lowercase (the reference tables' code)
     layout, theme      1 byte each, an index into LAYOUT_KEYS, THEME_KEYS
     x, y               2 bytes each, big endian: (value + 100) * 10, or 0xFFFF for none
     readings present   2 bytes, one bit per entry of READING_KEYS (bit 0 first)
     readings           2 bytes each for the bits set, in table order, coded like x
     badge count        1 byte
     badges             3 bytes each: index into BADGE_KEYS, level 1 to 3,
                        strength 0 to 100 or 255 for none

   The tables are part of the format: an entry is only ever appended, never
   moved or removed, or links already shared would read wrongly (the test in
   tools/share-fragment-test.mjs checks the tables against the site). A
   change of shape is a new version prefix; a page that meets a version it
   does not know says so instead of guessing. */

export const VERSION = 1;
export const PREFIX = 'v' + VERSION + '.';
/* a valid address is under 340 characters: anything longer is refused unread */
export const MAX_LENGTH = 400;

export const READING_KEYS = ['europe', 'ecology', 'people', 'protectionism', 'defence', 'nuclear', 'degrowth', 'transition', 'executive', 'russia', 'world', 'labour', 'class'];
export const LAYOUT_KEYS = ['wide', 'squareFull', 'readings', 'story', 'tabloid', 'boarding', 'receipt'];
export const THEME_KEYS = ['clair', 'sombre', 'corpo', 'sepia', 'pop'];
export const BADGE_KEYS = ['robin', 'hand', 'classstruggle', 'camarade', 'rose', 'picket', 'customs', 'factory', 'market', 'taxpayer', 'boss', 'startup', 'sheriff', 'liberties', 'hussard', 'temple', 'cocarde', 'oldfrance', 'chrisdem', 'fortress', 'gauls', 'globe', 'mosaic', 'feminism', 'pride', 'tightrope', 'nuance', 'reform', 'barricade', 'forest', 'snail', 'turbines', 'atom', 'eustars', 'border', 'dove', 'defence', 'ironcurtain', 'datcha', 'bluehelmet', 'ballot', 'megaphone', 'executive', 'hemicycle', 'colombey', 'orphan', 'loyal', 'oddball', 'undecided', 'weathervane', 'soulmate', 'firststep', 'explorer', 'diligent'];

const NONE16 = 0xffff;
const NONE8 = 255;
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const B64_INDEX = new Map([...B64].map((c, i) => [c, i]));

/* ---------- base64url, unpadded and strict ---------- */
function toBase64Url(bytes) {
	let out = '';
	for (let i = 0; i < bytes.length; i += 3) {
		const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
		const chars = [n >> 18, (n >> 12) & 63, (n >> 6) & 63, n & 63];
		out += chars.slice(0, Math.min(4, bytes.length - i + 1)).map((k) => B64[k]).join('');
	}
	return out;
}

/* null for anything but the canonical text of some bytes: an alphabet
   character outside the table, a length no byte count gives, or spare bits
   that are not zero (which would let two texts stand for the same bytes) */
function fromBase64Url(text) {
	if (text.length % 4 === 1) return null;
	const bytes = [];
	let acc = 0, bits = 0;
	for (const c of text) {
		const k = B64_INDEX.get(c);
		if (k === undefined) return null;
		acc = (acc << 6) | k;
		bits += 6;
		if (bits >= 8) {
			bits -= 8;
			bytes.push((acc >> bits) & 255);
			acc &= (1 << bits) - 1;
		}
	}
	return acc === 0 ? Uint8Array.from(bytes) : null;
}

/* ---------- values ---------- */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
/* a position or a reading, -100 to 100, to a tenth */
const pack = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round((clamp(v, -100, 100) + 100) * 10) : NONE16);
const unpack = (n) => (n === NONE16 ? null : n <= 2000 ? (n - 1000) / 10 : undefined);

/* The address of a profile. `share` has the shape of a stored snapshot
   (country, x, y, values, badges) plus the card's layout and theme; what
   the format has no place for (an unknown reading, badge, layout or theme)
   is left out, and a position beyond the axes is brought back onto them. */
export function encode(share) {
	const bytes = [];
	const code = typeof share.country === 'string' ? share.country : '';
	if (!/^[a-z]{2}$/.test(code)) throw new Error('share: country is a two-letter code');
	bytes.push(code.charCodeAt(0), code.charCodeAt(1));
	bytes.push(Math.max(0, LAYOUT_KEYS.indexOf(share.layout)), Math.max(0, THEME_KEYS.indexOf(share.theme)));
	for (const v of [share.x, share.y]) { const n = pack(v); bytes.push(n >> 8, n & 255); }
	const values = share.values || {};
	const present = READING_KEYS.filter((k) => Number.isFinite(values[k]));
	const mask = present.reduce((m, k) => m | (1 << READING_KEYS.indexOf(k)), 0);
	bytes.push(mask >> 8, mask & 255);
	for (const k of present) { const n = pack(values[k]); bytes.push(n >> 8, n & 255); }
	const seen = new Set();
	const badges = (share.badges || []).filter((b) => b && BADGE_KEYS.includes(b.key) && [1, 2, 3].includes(b.level) && !seen.has(b.key) && seen.add(b.key));
	bytes.push(badges.length);
	for (const b of badges) {
		bytes.push(BADGE_KEYS.indexOf(b.key), b.level, Number.isFinite(b.strength) ? Math.round(clamp(b.strength, 0, 100)) : NONE8);
	}
	return PREFIX + toBase64Url(Uint8Array.from(bytes));
}

/* What an address says, or why it says nothing: { ok: true, share } with the
   same shape encode takes, or { ok: false, reason } where reason is
     'empty'      nothing after the "#"
     'size'       longer than any address this version makes
     'version'    a well-formed prefix for a version this page does not know
     'malformed'  anything else, out-of-range values and trailing bytes included
   `hash` is location.hash, with or without its "#". Never throws. */
export function decode(hash) {
	let text = typeof hash === 'string' ? hash : '';
	if (text.startsWith('#')) text = text.slice(1);
	if (text === '') return { ok: false, reason: 'empty' };
	if (text.length > MAX_LENGTH) return { ok: false, reason: 'size' };
	const head = /^v([1-9][0-9]{0,2})\./.exec(text);
	if (!head) return { ok: false, reason: 'malformed' };
	if (Number(head[1]) !== VERSION) return { ok: false, reason: 'version' };
	const bytes = fromBase64Url(text.slice(PREFIX.length));
	const share = bytes && read(bytes);
	return share ? { ok: true, share } : { ok: false, reason: 'malformed' };
}

/* the bytes as a share, or null: strict, and the whole input must be used */
function read(bytes) {
	let at = 0;
	const u8 = () => (at < bytes.length ? bytes[at++] : -1);
	const u16 = () => { const a = u8(), b = u8(); return a < 0 || b < 0 ? -1 : (a << 8) | b; };
	const a = u8(), b = u8();
	if (a < 97 || a > 122 || b < 97 || b > 122) return null;
	const layout = LAYOUT_KEYS[u8()], theme = THEME_KEYS[u8()];
	if (!layout || !theme) return null;
	const x = unpack(u16()), y = unpack(u16());
	if (x === undefined || y === undefined) return null;
	const mask = u16();
	if (mask < 0 || mask >> READING_KEYS.length) return null;
	const values = {};
	for (let i = 0; i < READING_KEYS.length; i++) {
		if (!(mask & (1 << i))) continue;
		const v = unpack(u16());
		if (v === undefined || v === null) return null;
		values[READING_KEYS[i]] = v;
	}
	const count = u8();
	if (count < 0 || count > BADGE_KEYS.length) return null;
	const badges = [], seen = new Set();
	for (let i = 0; i < count; i++) {
		const key = BADGE_KEYS[u8()], level = u8(), strength = u8();
		if (!key || seen.has(key) || level < 1 || level > 3 || strength < 0 || (strength > 100 && strength !== NONE8)) return null;
		seen.add(key);
		badges.push({ key, level, strength: strength === NONE8 ? null : strength });
	}
	if (at !== bytes.length) return null;
	return { country: String.fromCharCode(a, b), layout, theme, x, y, values, badges };
}
