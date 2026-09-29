/* A profile as a card to share: the same data drawn in several layouts,
   each an SVG string at its final size (a link preview, a square, a story),
   so that the page shows it as it is and a PNG is only that SVG rasterised.
   Only results go in: position, readings, badges, flag, nearest party;
   never an answer. Everything a member typed (the alias) is escaped. */
import { L } from '$lib/i18n/fr.js';
import { coords, nearestBase, fitOf } from '$lib/compass/model.js';
import { politiskelFlag } from '$lib/flag/flag.js';
import { PolitiModel } from '$lib/model.js';
import { badgesOf, sortBadges, SINGLE, familyOf } from '$lib/badges/badges.js';
import { drawBadge } from '$lib/badges/draw.js';
import { signed } from '$lib/format.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const C = {
	bg: '#f4f4f2', surface: '#ffffff', sunk: '#ececea', border: '#dfdfdb',
	text: '#1c1c1b', text2: '#4a4a47', text3: '#62625e', accent: '#0f6468', accentSoft: '#d6ecea'
};
const FONT = "Geist, system-ui, sans-serif";

/* the readings a card may show beside the compass, most marked first */
const READINGS = ['europe', 'ecology', 'people', 'protectionism', 'defence', 'nuclear', 'degrowth', 'transition', 'executive', 'russia', 'world', 'labour', 'class'];

export function cardData(p, country) {
	const c = coords(p);
	const flag = politiskelFlag(c, p);
	const B = L.badges;
	const badges = sortBadges(badgesOf(p, c, { country })).filter((b) => !SINGLE.has(b.key) || b.key === 'loyal' || b.key === 'orphan')
		.map((b) => ({ ...b, name: B.items[b.key].names[SINGLE.has(b.key) ? 0 : b.level - 1], label: B.items[b.key].label || B.families[familyOf(b.key)] }));
	const placed = c.x !== null && c.y !== null;
	const near = placed ? nearestBase(c.x, c.y, country) : null;
	const limits = PolitiModel.limitsFor(country.parties);
	const q = c.quiz || {}, eu = c.eu || {}, inst = c.inst || {}, eco = c.ecology || {};
	const value = { europe: eu.europe, defence: eu.defence, russia: eu.russia, world: eu.world, people: inst.people, executive: inst.executive,
		ecology: eco.ecology, transition: eco.transition, nuclear: eco.nuclear, degrowth: eco.degrowth,
		protectionism: q.protectionism, labour: q.labour, class: q.class };
	const readings = READINGS.filter((k) => Number.isFinite(value[k]))
		.map((k) => ({ k, v: value[k], label: L.bands.label[k], ends: L.bands.ends[k] }))
		.sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
	return {
		alias: p.alias, x: c.x, y: c.y, placed, flag: flag ? flag.url : null, badges, readings,
		country: country.name,
		parties: country.parties.map((r) => ({ x: r.x, y: r.y, name: r.name })),
		nearest: near ? { name: near.name, d: Math.round(near.d), fit: fitOf(near.d, limits) } : null
	};
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
		`<image href="${d.flag}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>`;
}

function compass(d, x, y, S, o = {}) {
	const X = (v) => x + ((v + 100) / 200) * S, Y = (v) => y + ((100 - v) / 200) * S;
	const f = S / 520;
	let s = `<rect x="${x}" y="${y}" width="${S}" height="${S}" rx="${14 * f}" fill="${C.surface}" stroke="${C.border}" stroke-width="${1.5 * f}"/>`;
	/* quadrant tints, faint */
	const tints = ['#e9d9d6', '#d9e2ee', '#dcebdd', '#ece5d3'];
	[[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([i, j], k) => {
		s += `<rect x="${x + i * S / 2 + 1}" y="${y + j * S / 2 + 1}" width="${S / 2 - 2}" height="${S / 2 - 2}" rx="${10 * f}" fill="${tints[k]}" opacity=".55"/>`;
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
			text(X(r.x), Y(r.y) - 30 * f, r.name, 15 * f, { fill: C.text, w: 650, anchor: r.x > 60 ? 'end' : r.x < -60 ? 'start' : 'middle' });
	}
	if (d.placed) {
		s += `<circle cx="${X(d.x)}" cy="${Y(d.y)}" r="${22 * f}" fill="${C.accent}" opacity=".16"/>` +
			`<circle cx="${X(d.x)}" cy="${Y(d.y)}" r="${10 * f}" fill="${C.accent}" stroke="#fff" stroke-width="${3 * f}"/>`;
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
		s += `<circle cx="${pos}" cy="${track}" r="${9 * size}" fill="${C.accent}" stroke="#fff" stroke-width="${2.5 * size}"/>`;
		s += text(x, track + 26 * size, r.ends[0], 14 * size, { fill: C.text3 }) + text(x + w, track + 26 * size, r.ends[1], 14 * size, { fill: C.text3, anchor: 'end' });
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
		key: 'wideBadges', w: 1200, h: 630,
		draw: (d, ART) => {
			const n = Math.min(5, d.badges.length), size = 196, gap = 30;
			const x0 = (1200 - (n * size + (n - 1) * gap)) / 2;
			return frame(1200, 630,
				flagImage(d, 64, 56, 150) +
				text(240, 110, d.alias, fitSize(d.alias, 60, 700), { w: 700, ls: -1 }) +
				text(240, 150, L.share.badgesCount(d.badges.length), 22, { fill: C.text2 }) +
				d.badges.slice(0, n).map((b, i) => badgeAt(ART, b, x0 + i * (size + gap), 220, size, true, 20)).join('') +
				brand(1136, 560, 26, 'end'));
		}
	},
	{
		key: 'square', w: 1080, h: 1080,
		draw: (d) => frame(1080, 1080,
			text(80, 132, d.alias, fitSize(d.alias, 76, 640), { w: 700, ls: -1.5 }) +
			nearestLines(d, 80, 180, 28, 700) +
			flagImage(d, 830, 72, 170) +
			compass(d, 200, 250, 680) +
			brand(80, 1020, 28))
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
		key: 'story', w: 1080, h: 1920,
		draw: (d, ART) => frame(1080, 1920,
			flagImage(d, 180, 110, 720) +
			text(540, 710, d.alias, fitSize(d.alias, 96, 900), { w: 700, anchor: 'middle', ls: -2 }) +
			nearestLines(d, 540, 766, 32, 940, 'middle') +
			compass(d, 190, 820, 700, { caption: false }) +
			d.badges.slice(0, 3).map((b, i) => badgeAt(ART, b, 150 + i * 280, 1560, 220, true, 24)).join('') +
			brand(540, 1860, 30, 'middle'))
	},
	{
		key: 'hero', w: 1080, h: 1080,
		draw: (d, ART) => {
			const b = d.badges[0];
			return frame(1080, 1080,
				(b ? badgeAt(ART, b, 220, 90, 640, false) +
					text(540, 830, b.name, fitSize(b.name, 76, 960), { w: 700, anchor: 'middle', ls: -1.5 }) +
					text(540, 882, b.label + (b.strength !== null ? ' · ' + b.strength + ' sur 100' : ''), 28, { fill: C.text2, anchor: 'middle' })
					: text(540, 540, L.badges.none, 32, { anchor: 'middle', fill: C.text2 })) +
				flagImage(d, 72, 950, 90) +
				text(184, 996, d.alias, fitSize(d.alias, 36, 520), { w: 700 }) +
				brand(1008, 990, 26, 'end'));
		}
	}
];
