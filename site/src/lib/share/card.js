/* A profile as a card to share: the same data drawn in several layouts,
   each an SVG string at its final size (a link preview, a square, a story),
   so that the page shows it as it is and a PNG is only that SVG rasterised.
   Only results go in: position, readings, badges, flag, nearest party;
   never an answer. Everything a member typed (the alias) is escaped. */
import { L } from '$lib/i18n/fr.js';
import { COUNTRIES, coords, nearestBase, fitOf } from '$lib/compass/model.js';
import { politiskelFlag } from '$lib/flag/flag.js';
import { PolitiModel } from '$lib/model.js';
import { badgesOf, sortBadges, SINGLE, familyOf } from '$lib/badges/badges.js';
import { drawBadge } from '$lib/badges/draw.js';
import { signed } from '$lib/format.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* The export's own themes, taken from the site's palettes: a card keeps the
   theme chosen for it whatever the site is shown in. `left` and `right`
   fill the two halves of a reading bar; `tints` the four quadrants. */
export const THEMES = {
	clair: { bg: '#f4f4f2', surface: '#ffffff', sunk: '#ececea', border: '#dfdfdb', text: '#1c1c1b', text2: '#4a4a47', text3: '#62625e',
		accent: '#0f6468', left: '#0f6468', right: '#c8733a', onBar: '#ffffff', tints: ['#e9d9d6', '#d9e2ee', '#dcebdd', '#ece5d3'], tintOp: 0.55 },
	sombre: { bg: '#232427', surface: '#2c2d31', sunk: '#1b1c1f', border: '#404146', text: '#f3f3f1', text2: '#d0d0cc', text3: '#aaaaa6',
		accent: '#7fd3cf', left: '#4fa9a5', right: '#d98a5a', onBar: '#101113', tints: ['#5a3a3a', '#34435a', '#35503a', '#55503a'], tintOp: 0.5 },
	corpo: { bg: '#0a0a0c', surface: '#131316', sunk: '#060607', border: '#2a2a31', text: '#ecebe9', text2: '#c2c1c6', text3: '#9a99a1',
		accent: '#e0202e', left: '#e0202e', right: '#7a7a84', onBar: '#ffffff', tints: ['#2a1214', '#1c1c21', '#16161a', '#22161a'], tintOp: 0.9 },
	sepia: { bg: '#f2e8d5', surface: '#faf3e4', sunk: '#e4d6bb', border: '#dccdb1', text: '#2b2114', text2: '#56462f', text3: '#6b5a41',
		accent: '#7d5519', left: '#7d5519', right: '#9a3a20', onBar: '#faf3e4', tints: ['#ead2c0', '#e0dcc8', '#dfe0c0', '#efe0bf'], tintOp: 0.7 },
	pop: { bg: '#9fe9ee', surface: '#ffffff', sunk: '#d9f3f4', border: '#121212', text: '#121212', text2: '#2c2c2a', text3: '#3f3f3c',
		accent: '#00666d', left: '#ff5c8a', right: '#00a3ad', onBar: '#ffffff', tints: ['#ffd9e4', '#d9f3f4', '#fff3a6', '#e4dcff'], tintOp: 1 }
};
let C = THEMES.clair;
/* ids inside a card, unique on the page: several cards may be shown at once */
let P = 'k0', uid = 0;
const FONT = "Geist, system-ui, sans-serif";

/* the readings a card may show beside the compass, most marked first */
const READINGS = ['europe', 'ecology', 'people', 'protectionism', 'defence', 'nuclear', 'degrowth', 'transition', 'executive', 'russia', 'world', 'labour', 'class'];

export function cardData(p, country) {
	const c = coords(p);
	const flag = politiskelFlag(c, p);
	const badges = sortBadges(badgesOf(p, c, { country })).filter((b) => !SINGLE.has(b.key) || b.key === 'loyal' || b.key === 'orphan')
		.map((b) => ({ key: b.key, level: b.level, strength: b.strength }));
	const q = c.quiz || {}, eu = c.eu || {}, inst = c.inst || {}, eco = c.ecology || {};
	const values = { europe: eu.europe, defence: eu.defence, russia: eu.russia, world: eu.world, people: inst.people, executive: inst.executive,
		ecology: eco.ecology, transition: eco.transition, nuclear: eco.nuclear, degrowth: eco.degrowth,
		protectionism: q.protectionism, labour: q.labour, class: q.class };
	return assemble({ alias: p.alias, x: c.x, y: c.y, flag: flag ? flag.url : null, badges, values }, country);
}

/* The card's data from results alone: what a profile gives, and what a
   shared link keeps. Names and labels come from the copy, never from the
   results, and the nearest party is found again. */
function assemble(r, country) {
	const B = L.badges;
	const placed = r.x !== null && r.y !== null;
	const near = placed ? nearestBase(r.x, r.y, country) : null;
	const limits = PolitiModel.limitsFor(country.parties);
	const readings = READINGS.filter((k) => Number.isFinite(r.values[k]))
		.map((k) => ({ k, v: r.values[k], label: L.bands.label[k], ends: L.bands.ends[k] }))
		.sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
	return {
		alias: r.alias, x: r.x, y: r.y, placed, flag: r.flag, values: r.values, readings,
		badges: r.badges.map((b) => ({ ...b, name: B.items[b.key].names[SINGLE.has(b.key) ? 0 : b.level - 1], label: B.items[b.key].label || B.families[familyOf(b.key)] })),
		axes: [['x', r.x], ['y', r.y]].filter(([, v]) => Number.isFinite(v)).map(([k, v]) => ({ k, v, label: L.bands.label[k], ends: L.bands.ends[k] })),
		country: country.name, countryCode: country.code,
		parties: country.parties.map((q) => ({ x: q.x, y: q.y, name: q.name })),
		nearest: near ? { name: near.name, d: Math.round(near.d), fit: fitOf(near.d, limits) } : null
	};
}

/* What a public link stores: results only, in a shape small enough to check. */
export const snapshotOf = (d) => ({
	v: 1, alias: d.alias, country: d.countryCode, x: d.x, y: d.y, flag: d.flag,
	badges: d.badges.map((b) => ({ key: b.key, level: b.level, strength: b.strength })),
	values: Object.fromEntries(READINGS.filter((k) => Number.isFinite(d.values[k])).map((k) => [k, d.values[k]]))
});

/* A flag as politiskelFlag makes it: an SVG percent-encoded by
   encodeURIComponent, so only the characters it can produce. */
const FLAG_URL = /^data:image\/svg\+xml;charset=utf-8,[A-Za-z0-9\-_.!~*'()%]*$/;

/* A stored snapshot read back: it comes from a server anyone can post to
   through their own account, so every field is checked, and whatever does
   not fit is dropped rather than drawn. */
export function fromSnapshot(s) {
	if (!s || typeof s !== 'object' || s.v !== 1) return null;
	const country = COUNTRIES.find((c) => c.code === s.country);
	if (!country) return null;
	const pos = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(-100, Math.min(100, v)) : null);
	const alias = typeof s.alias === 'string' ? s.alias.slice(0, 40) : '';
	const flag = typeof s.flag === 'string' && s.flag.length < 40000 && FLAG_URL.test(s.flag) ? s.flag : null;
	const badges = (Array.isArray(s.badges) ? s.badges : []).slice(0, 60)
		.filter((b) => b && typeof b.key === 'string' && Object.hasOwn(L.badges.items, b.key) && [1, 2, 3].includes(b.level))
		.map((b) => ({ key: b.key, level: SINGLE.has(b.key) ? 1 : b.level, strength: typeof b.strength === 'number' && Number.isFinite(b.strength) ? Math.round(Math.max(0, Math.min(100, b.strength))) : null }));
	const values = {};
	for (const k of READINGS) { const v = pos(s.values && s.values[k]); if (v !== null) values[k] = v; }
	return assemble({ alias, x: pos(s.x), y: pos(s.y), flag, badges, values }, country);
}

/* ---------- pieces ---------- */
const text = (x, y, s, size, o = {}) =>
	`<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${o.w || 400}" fill="${o.fill || C.text}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(s)}</text>`;
/* a line of text shrunk to fit a width, at about 0.55 em a character */
const fitSize = (s, size, width) => Math.min(size, width / (String(s).length * 0.56));

function brand(x, y, size, anchor = 'start') {
	return text(x, y, 'politiskel', size, { w: 700, fill: C.text, anchor }) +
		text(anchor === 'end' ? x : x, y + size * 1.25, 'politiskel.benit.ooo', size * 0.62, { fill: C.text3, anchor });
}

function flagImage(d, x, y, w) {
	if (!d.flag) return '';
	const h = w * 2 / 3;
	return `<rect x="${x - 1}" y="${y - 1}" width="${w + 2}" height="${h + 2}" rx="6" fill="${C.border}"/>` +
		`<image href="${esc(d.flag)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>`;
}

function compass(d, x, y, S, o = {}) {
	const X = (v) => x + ((v + 100) / 200) * S, Y = (v) => y + ((100 - v) / 200) * S;
	const f = S / 520;
	let s = `<rect x="${x}" y="${y}" width="${S}" height="${S}" rx="${14 * f}" fill="${C.surface}" stroke="${C.border}" stroke-width="${1.5 * f}"/>`;
	/* quadrant tints, faint */
	[[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([i, j], k) => {
		s += `<rect x="${x + i * S / 2 + 1}" y="${y + j * S / 2 + 1}" width="${S / 2 - 2}" height="${S / 2 - 2}" rx="${10 * f}" fill="${C.tints[k]}" opacity="${C.tintOp}"/>`;
	});
	s += `<path d="M${x + S / 2} ${y + 8 * f} V${y + S - 8 * f} M${x + 8 * f} ${y + S / 2} H${x + S - 8 * f}" stroke="${C.text3}" stroke-width="${1.4 * f}" opacity=".6"/>`;
	const cap = 15 * f;
	s += text(x + 14 * f, y + S / 2 - 10 * f, L.bands.ends.x[0], cap, { fill: C.text2, w: 600 });
	s += text(x + S - 14 * f, y + S / 2 - 10 * f, L.bands.ends.x[1], cap, { fill: C.text2, w: 600, anchor: 'end' });
	s += text(x + S / 2 + 10 * f, y + 26 * f, L.bands.ends.y[1], cap, { fill: C.text2, w: 600 });
	s += text(x + S / 2 + 10 * f, y + S - 14 * f, L.bands.ends.y[0], cap, { fill: C.text2, w: 600 });
	for (const r of d.parties) s += `<circle cx="${X(r.x)}" cy="${Y(r.y)}" r="${5 * f}" fill="${C.text3}" opacity=".45"/>`;
	if (d.nearest && o.labelNearest !== false) {
		const r = d.parties.find((q) => q.name === d.nearest.name);
		if (r) s += `<circle cx="${X(r.x)}" cy="${Y(r.y)}" r="${6.5 * f}" fill="none" stroke="${C.text2}" stroke-width="${1.6 * f}"/>` +
			/* on the side away from the profile, so the name is never read as the profile's */
			text(X(r.x), Y(r.y) + (d.placed && r.y < d.y ? 34 * f : -24 * f), r.name, 15 * f,
				{ fill: C.text, w: 650, anchor: r.x > 60 ? 'end' : r.x < -60 ? 'start' : 'middle' });
	}
	if (d.placed) {
		s += `<circle cx="${X(d.x)}" cy="${Y(d.y)}" r="${22 * f}" fill="${C.accent}" opacity=".16"/>` +
			`<circle cx="${X(d.x)}" cy="${Y(d.y)}" r="${10 * f}" fill="${C.accent}" stroke="${C.surface}" stroke-width="${3 * f}"/>`;
	}
	if (o.caption !== false && d.placed)
		s += text(x, y + S + 30 * f, 'X ' + signed(Math.round(d.x)) + ' · Y ' + signed(Math.round(d.y)) + ' · ' + d.country, 17 * f, { fill: C.text3 });
	return s;
}

function bars(d, x, y, w, n, size = 1) {
	let s = '';
	const rowH = 88 * size;
	d.readings.slice(0, n).forEach((r, i) => {
		const top = y + i * rowH, track = top + 30 * size, pos = x + ((r.v + 100) / 200) * w;
		s += text(x, top + 14 * size, r.label, 19 * size, { w: 650 });
		s += text(x + w, top + 14 * size, signed(Math.round(r.v)), 19 * size, { w: 650, anchor: 'end' });
		s += `<rect x="${x}" y="${track - 3 * size}" width="${w}" height="${6 * size}" rx="${3 * size}" fill="${C.sunk}"/>`;
		s += `<rect x="${x + w / 2 - 1}" y="${track - 7 * size}" width="2" height="${14 * size}" fill="${C.text3}" opacity=".5"/>`;
		s += `<circle cx="${pos}" cy="${track}" r="${9 * size}" fill="${C.accent}" stroke="${C.bg}" stroke-width="${2.5 * size}"/>`;
		s += text(x, track + 26 * size, r.ends[0], 14 * size, { fill: C.text3 }) + text(x + w, track + 26 * size, r.ends[1], 14 * size, { fill: C.text3, anchor: 'end' });
	});
	return s;
}

/* A reading as PolitiScales draws its axes: one bar split in two at the
   profile's value, each end named with its share. */
function splitBars(list, x, y, w, rowH) {
	let s = '';
	const h = rowH * 0.36, r = h / 2;
	list.forEach((b, i) => {
		const top = y + i * rowH, bar = top + rowH * 0.34;
		const left = Math.round((100 - b.v) / 2), right = 100 - left, cut = x + (w * left) / 100;
		s += text(x + w / 2, top + rowH * 0.22, b.label, rowH * 0.2, { w: 650, anchor: 'middle', fill: C.text });
		s += `<clipPath id="${P}bar${i}"><rect x="${x}" y="${bar}" width="${w}" height="${h}" rx="${r}"/></clipPath>` +
			`<g clip-path="url(#${P}bar${i})"><rect x="${x}" y="${bar}" width="${cut - x}" height="${h}" fill="${C.left}"/>` +
			`<rect x="${cut}" y="${bar}" width="${x + w - cut}" height="${h}" fill="${C.right}"/></g>`;
		const inside = rowH * 0.19, mid = bar + h / 2 + inside * 0.36;
		if (left >= 12) s += text(x + 16, mid, left + ' %', inside, { w: 700, fill: C.onBar });
		if (right >= 12) s += text(x + w - 16, mid, right + ' %', inside, { w: 700, fill: C.onBar, anchor: 'end' });
		s += text(x, bar + h + rowH * 0.2, b.ends[0], rowH * 0.16, { fill: C.text2 }) +
			text(x + w, bar + h + rowH * 0.2, b.ends[1], rowH * 0.16, { fill: C.text2, anchor: 'end' });
	});
	return s;
}

function badgeAt(ART, b, x, y, size, withName = true, nameSize = 18) {
	if (!ART || !ART[b.key]) return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size * 0.4}" fill="${C.sunk}"/>`;
	const svg = drawBadge(ART[b.key], SINGLE.has(b.key) ? 2 : b.level, b.label, size).replace('<svg ', `<svg x="${x}" y="${y}" `);
	return svg + (withName ? text(x + size / 2, y + size + nameSize * 1.2, b.name, fitSize(b.name, nameSize, size * 1.15), { w: 650, anchor: 'middle' }) : '');
}

/* the nearest party on two lines: its name, then how near */
function nearestLines(d, x, y, size, width, anchor) {
	if (!d.nearest) return '';
	const a = L.share.nearest(d.nearest.name), b = L.share.nearestFit(d.nearest.fit, d.nearest.d);
	return text(x, y, a, fitSize(a, size, width), { fill: C.text, w: 600, anchor }) +
		text(x, y + size * 1.35, b, size * 0.85, { fill: C.text2, anchor });
}

function frame(w, h, body) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
		`<rect width="${w}" height="${h}" fill="${C.bg}"/>${body}</svg>`;
}

/* ---------- layouts ---------- */
export const LAYOUTS = [
	{
		key: 'wide', w: 1200, h: 630,
		draw: (d) => frame(1200, 630,
			text(64, 118, d.alias, fitSize(d.alias, 72, 560), { w: 700, ls: -1.5 }) +
			nearestLines(d, 64, 166, 26, 540) +
			flagImage(d, 64, 236, 330) +
			brand(64, 540, 30) +
			compass(d, 640, 56, 500))
	},
	{
		key: 'squareFull', w: 1080, h: 1080,
		draw: (d, ART) => frame(1080, 1080,
			flagImage(d, 72, 64, 180) +
			text(284, 128, d.alias, fitSize(d.alias, 64, 700), { w: 700, ls: -1 }) +
			nearestLines(d, 284, 170, 24, 720) +
			compass(d, 72, 250, 470) +
			bars(d, 600, 262, 408, 5) +
			d.badges.slice(0, 4).map((b, i) => badgeAt(ART, b, 72 + i * 240, 790, 170, true, 19)).join('') +
			brand(1008, 1040, 22, 'end'))
	},
	{
		key: 'readings', w: 1080, h: 1350,
		draw: (d) => {
			const list = [...d.axes, ...d.readings.slice().sort((a, b) => READINGS.indexOf(a.k) - READINGS.indexOf(b.k))].slice(0, 10);
			const rowH = Math.min(118, 1000 / Math.max(list.length, 1));
			return frame(1080, 1350,
				flagImage(d, 72, 64, 180) +
				text(284, 128, d.alias, fitSize(d.alias, 64, 720), { w: 700, ls: -1 }) +
				nearestLines(d, 284, 170, 24, 720) +
				splitBars(list, 72, 250, 936, rowH) +
				brand(1008, 1296, 24, 'end'));
		}
	},
	{
		key: 'story', w: 1080, h: 1920,
		draw: (d, ART) => frame(1080, 1920,
			flagImage(d, 180, 110, 720) +
			text(540, 710, d.alias, fitSize(d.alias, 96, 900), { w: 700, anchor: 'middle', ls: -2 }) +
			nearestLines(d, 540, 766, 32, 940, 'middle') +
			compass(d, 190, 820, 700, { caption: false }) +
			d.badges.slice(0, 3).map((b, i) => badgeAt(ART, b, 150 + i * 280, 1560, 220, true, 24)).join('') +
			brand(540, 1860, 30, 'middle'))
	}
];

/* a layout drawn in a theme */
export function drawCard(layout, d, ART, theme = 'clair') {
	C = THEMES[theme] || THEMES.clair;
	P = 'k' + ++uid;
	return layout.draw(d, ART);
}
