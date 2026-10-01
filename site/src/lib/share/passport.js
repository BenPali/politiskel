/* The political passport: a booklet one leafs through, drawn
   from the same card data as the share cards. This file holds what the
   pages draw as SVG strings (guilloche, stamps, seal) and the few values
   the pages compute (nationality, machine-readable zone). Nothing a member
   typed goes into an SVG string: the alias is written by the page, as
   text. Its copy is L.passport. */
import { L } from '$lib/i18n/fr.js';

export const COPY = L.passport;

/* ---------- values ---------- */

/* a playful nationality: the quadrant, or the centre */
export function nationalityOf(d) {
	if (!d.placed) return '?';
	if (Math.abs(d.x) < 15 && Math.abs(d.y) < 15) return COPY.centre;
	const top = d.y >= 0, left = d.x < 0;
	return top ? (left ? L.quadTopLeft : L.quadTopRight) : left ? L.quadBottomLeft : L.quadBottomRight;
}

const MONTHS = ['JANV', 'FÉVR', 'MARS', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];
export const stampDate = (t = new Date()) => String(t.getDate()).padStart(2, '0') + ' ' + MONTHS[t.getMonth()] + ' ' + t.getFullYear();

/* a stable number from the alias, for the document number and the layout */
function hash(s) {
	let h = 2166136261;
	for (const ch of String(s)) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
	return h;
}
export const docNumber = (alias) => 'PSK' + String(hash(alias) % 1e7).padStart(7, '0');

/* The machine-readable zone of a passport: two lines of 44 characters,
   letters, digits and fillers only. The alias is folded to A-Z. */
export function mrz(d, date = new Date()) {
	const fold = (s) => String(s).normalize('NFKD').toUpperCase().replace(/[^A-Z0-9]/g, '<');
	const pad = (s, n) => (s + '<'.repeat(n)).slice(0, n);
	const num = (v) => (Number.isFinite(v) ? (v < 0 ? 'M' : 'P') + String(Math.abs(Math.round(v))).padStart(3, '0') : '<<<<');
	const ymd = String(date.getFullYear()).slice(2) + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
	const line1 = pad('P<PSK' + fold(d.alias) + '<<' + fold(nationalityOf(d)), 44);
	const line2 = pad(docNumber(d.alias) + '<' + 'PSK' + ymd + 'X' + num(d.x) + 'Y' + num(d.y) + '<' + fold(d.country), 44);
	return [line1, line2];
}

/* ---------- drawings ---------- */

/* Guilloche: interlaced rose curves, the security pattern of banknotes.
   Returns path data only, drawn by the page in its own colours. */
export function guilloche(cx, cy, r, n = 14, waves = 9, seed = 1) {
	const out = [];
	for (let k = 0; k < n; k++) {
		const phase = (k / n) * Math.PI * 2 + seed, amp = r * 0.16, base = r * (0.62 + 0.3 * (k % 3) / 2);
		let d = '';
		for (let i = 0; i <= 360; i += 3) {
			const t = (i * Math.PI) / 180;
			const rr = base + amp * Math.sin(waves * t + phase);
			d += (i ? 'L' : 'M') + (cx + rr * Math.cos(t)).toFixed(1) + ' ' + (cy + rr * Math.sin(t)).toFixed(1);
		}
		out.push(d + 'Z');
	}
	return out;
}

/* horizontal wavy lines across a page, the background of a data page */
export function waves(w, h, n = 22, seed = 0) {
	const out = [];
	for (let k = 0; k < n; k++) {
		const y0 = (h / n) * (k + 0.5);
		let d = '';
		for (let x = 0; x <= w; x += 6) {
			const y = y0 + 4 * Math.sin(x / 17 + k * 0.7 + seed) + 2 * Math.sin(x / 7 + k);
			d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1);
		}
		out.push(d);
	}
	return out;
}

const INKS = ['#2b4c9b', '#a3262e', '#2f6b3a', '#5a2b7a', '#3a3a3a', '#8a4b12'];
let uid = 0;

/* A badge as a rubber stamp: its scene turned to ink, inside rings, its name
   around the top and the level and date around the bottom. The shape
   varies (round, oval, square) as real entry stamps do. */
export function stampSvg(ART, b, i, date) {
	const id = 'st' + ++uid;
	const ink = INKS[(hash(b.key) + i) % INKS.length];
	const shape = ['round', 'round', 'oval', 'square'][(hash(b.key) >> 3) % 4];
	const scene = ART && ART[b.key] ? ART[b.key].art(id + 's', b.level || 2) : '';
	const lvl = b.level ? COPY.level(b.level) : '';
	const stars = '★'.repeat(b.level || 1);
	/* the scene as ink: the darker a part, the more ink it carries */
	const filter = `<filter id="${id}f" x="-10%" y="-10%" width="120%" height="120%">
		<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.45 -0.75 -0.15 0 1.18"/>
		<feComponentTransfer><feFuncA type="gamma" amplitude="1.1" exponent="1.6" offset="0"/></feComponentTransfer>
		<feComposite in2="SourceGraphic" operator="in" result="a"/>
		<feFlood flood-color="${ink}"/><feComposite in2="a" operator="in" result="inked"/>
		<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="${i + 3}" result="noise"/>
		<feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 1.55" result="holes"/>
		<feComposite in="inked" in2="holes" operator="in"/></filter>
		<filter id="${id}r"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" seed="${i + 9}"/>
		<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.7"/>
		<feComposite in="SourceGraphic" operator="in"/></filter>`;
	let frame, top, bottom, clip;
	if (shape === 'square') {
		clip = `<rect x="40" y="46" width="120" height="108" rx="8"/>`;
		frame = `<rect x="14" y="14" width="172" height="172" rx="14" fill="none" stroke="${ink}" stroke-width="6"/>
			<rect x="26" y="26" width="148" height="148" rx="10" fill="none" stroke="${ink}" stroke-width="2"/>`;
		top = `<text x="100" y="42" text-anchor="middle" font-family="Geist, sans-serif" font-weight="800" font-size="${fit(b.name, 15, 140)}" fill="${ink}">${esc(b.name)}</text>`;
		bottom = `<text x="100" y="170" text-anchor="middle" font-family="Geist, sans-serif" font-weight="700" font-size="12" fill="${ink}">${esc(stars + '  ' + date)}</text>`;
	} else {
		const rx = shape === 'oval' ? 92 : 86, ry = shape === 'oval' ? 72 : 86;
		clip = `<ellipse cx="100" cy="100" rx="${rx - 34}" ry="${ry - 34}"/>`;
		frame = `<ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="none" stroke="${ink}" stroke-width="6"/>
			<ellipse cx="100" cy="100" rx="${rx - 26}" ry="${ry - 26}" fill="none" stroke="${ink}" stroke-width="2.4"/>
			<path id="${id}t" d="M${100 - rx + 13} 100 A${rx - 13} ${ry - 13} 0 0 1 ${100 + rx - 13} 100" fill="none"/>
			<path id="${id}b" d="M${100 - rx + 22} 100 A${rx - 22} ${ry - 22} 0 0 0 ${100 + rx - 22} 100" fill="none"/>`;
		top = `<text font-family="Geist, sans-serif" font-weight="800" font-size="${fit(b.name, 16, (rx - 13) * 2.6)}" fill="${ink}" letter-spacing=".5"><textPath href="#${id}t" startOffset="50%" text-anchor="middle">${esc(b.name.toUpperCase())}</textPath></text>`;
		bottom = `<text font-family="Geist, sans-serif" font-weight="700" font-size="12" fill="${ink}"><textPath href="#${id}b" startOffset="50%" text-anchor="middle">${esc(stars + '  ' + lvl + '  ' + date)}</textPath></text>`;
	}
	return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs>${filter}<clipPath id="${id}c">${clip}</clipPath></defs>
		<g filter="url(#${id}r)" opacity=".9">${frame}${top}${bottom}</g>
		<g clip-path="url(#${id}c)" filter="url(#${id}f)" opacity=".85">${scene}</g></svg>`;
}

/* The authority's seal: a round seal with its text around and the compass
   inside, the profile's point on it. */
export function sealSvg(d) {
	const id = 'seal' + ++uid, ink = '#a3262e';
	const X = (v) => 70 + (v / 100) * 38, Y = (v) => 100 - (v / 100) * 38;
	const dot = d.placed ? `<circle cx="${X(d.x)}" cy="${Y(d.y)}" r="5" fill="${ink}"/>` : '';
	return `<svg viewBox="-30 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs>
		<path id="${id}p" d="M70 100 m-62 0 a62 62 0 1 1 124 0 a62 62 0 1 1 -124 0"/>
		<filter id="${id}r"><feTurbulence type="fractalNoise" baseFrequency="1.1" seed="4"/>
		<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.8"/><feComposite in="SourceGraphic" operator="in"/></filter></defs>
		<g filter="url(#${id}r)" opacity=".85" transform="rotate(-8 70 100)">
		<circle cx="70" cy="100" r="78" fill="none" stroke="${ink}" stroke-width="5"/>
		<circle cx="70" cy="100" r="50" fill="none" stroke="${ink}" stroke-width="2"/>
		<text font-family="Geist, sans-serif" font-weight="800" font-size="11" fill="${ink}"><textPath href="#${id}p" textLength="386" lengthAdjust="spacing">${esc(COPY.sealText)}</textPath></text>
		<path d="M70 62 V138 M32 100 H108" stroke="${ink}" stroke-width="1.6"/>
		<rect x="32" y="62" width="76" height="76" fill="none" stroke="${ink}" stroke-width="1.6"/>${dot}</g></svg>`;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fit = (s, size, width) => Math.min(size, width / (String(s).length * 0.62));

/* Stamp places on a visa page, irregular like real ones: 0-100 units of
   the page, each with a turn. */
export function stampSlots(n, seed) {
	const base = [[28, 26], [72, 30], [30, 56], [72, 59], [29, 84], [71, 86]];
	let s = seed || 1;
	const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
	return base.slice(0, n).map(([x, y]) => ({ x: x + (r() - 0.5) * 8, y: y + (r() - 0.5) * 4, rot: (r() - 0.5) * 26, size: 36 + r() * 6 }));
}
export const seedOf = hash;
