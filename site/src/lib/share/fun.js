/* The fun cards to share: a tabloid front page, a boarding pass and a till
   receipt of opinions. Each is an SVG string at its final size, like the
   layouts of card.js, drawn from cardData; only the boarding pass takes the
   export theme, the other two keep their own paper and ink. */
import { L } from '$lib/i18n/fr.js';
import { drawBadge } from '$lib/badges/draw.js';
import { SINGLE } from '$lib/badges/badges.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const SANS = 'Geist, system-ui, sans-serif';
const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, Menlo, 'Courier New', monospace";

const COPY = L.share.fun;

const traitBadges = (d) => d.badges.filter((b) => !SINGLE.has(b.key));

/* what a trait makes someone do, for a headline: present tense */
const DEEDS = {
	robin: 'veut taxer les milliardaires', hand: 'veut brûler la paperasse', classstruggle: 'prépare le Grand Soir',
	camarade: 'relance le plan quinquennal', rose: 'distribue des roses au marché', picket: 'appelle à la grève générale',
	customs: 'rétablit les douanes', factory: 'rallume les hauts-fourneaux', market: 'fait confiance au marché',
	taxpayer: 'déclare la guerre au fisc', boss: "s'installe sur le trône du conseil", startup: 'lève des fonds pour la France',
	sheriff: 'promet la tolérance zéro', liberties: 'défend les libertés publiques', hussard: 'rappelle la loi de 1905',
	temple: 'garde le temple', cocarde: 'agite la cocarde', oldfrance: 'défend la messe et le marché du dimanche',
	chrisdem: 'tend la main et la soupe', fortress: 'relève le pont-levis', gauls: 'invoque nos ancêtres les Gaulois',
	globe: 'rend son passeport au monde', mosaic: 'construit la tour de Babel', feminism: 'enfourche son balai',
	pride: 'prend la tête du char', tightrope: 'marche sur le fil du centre', nuance: 'ne tranche rien, bien au contraire',
	reform: 'avance pas à pas', barricade: 'monte sur la barricade', forest: "s'installe dans une cabane perchée",
	snail: 'ralentit le monde', turbines: 'plante des éoliennes partout', atom: 'veut une centrale dans chaque village',
	eustars: 'réclame les États-Unis d\'Europe', border: 'veut reprendre le contrôle', dove: 'veut désarmer le pays',
	defence: 'mobilise les réservistes', ironcurtain: 'surveille l\'Est à la jumelle', datcha: 'prend le thé à la datcha',
	bluehelmet: 'envoie les casques bleus', ballot: 'veut un référendum sur tout', megaphone: 'parle au nom du peuple',
	executive: 'réclame un homme providentiel', hemicycle: 'regrette la IVe République', colombey: 'repart à Colombey'
};

/* ---------- drawing helpers ---------- */
const T = (x, y, s, size, o = {}) =>
	`<text x="${x}" y="${y}" font-family="${o.font || SANS}" font-size="${size.toFixed ? size.toFixed(1) : size}" font-weight="${o.w || 400}" fill="${o.fill || '#1c1c1b'}"` +
	`${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.italic ? ' font-style="italic"' : ''}${o.op ? ` opacity="${o.op}"` : ''}>${esc(s)}</text>`;
/* about 0.55 em a character for sans, 0.5 for serif, 0.6 for mono */
const fit = (s, size, width, k = 0.56) => Math.min(size, width / (String(s).length * k));
/* words into lines of at most `chars` characters */
function wrap(s, chars) {
	const out = [];
	let line = '';
	for (const w of String(s).split(/ +/)) {
		if (line && (line + ' ' + w).length > chars) { out.push(line); line = w; } else line = line ? line + ' ' + w : w;
	}
	if (line) out.push(line);
	return out;
}
const lines = (list, x, y, size, lh, o) => list.map((l, i) => T(x, y + i * size * lh, l, size, o)).join('');

function badge(ART, b, x, y, size, rot = 0) {
	if (!ART || !ART[b.key]) return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size * 0.42}" fill="#00000018"/>`;
	const svg = drawBadge(ART[b.key], SINGLE.has(b.key) ? 2 : b.level, b.label, size).replace('<svg ', `<svg x="${x}" y="${y}" `);
	return rot ? `<g transform="rotate(${rot} ${x + size / 2} ${y + size / 2})">${svg}</g>` : svg;
}
function flag(d, x, y, w, extra = '') {
	const h = (w * 2) / 3;
	return d.flag ? `<image href="${esc(d.flag)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"${extra}/>` :
		`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ccc"/>`;
}
const svgOpen = (w, h, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${defs}</defs>`;
/* a stable number from a string, for barcodes and flight numbers */
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const all = (d) => [...d.axes, ...d.readings];
const pole = (r) => r.ends[r.v >= 0 ? 1 : 0];
let uid = 0;

/* ---------- 2. newspaper front page ---------- */
function headline(d) {
	const [a, b] = traitBadges(d);
	if (!a) return d.alias + ', citoyen sans étiquette, garde le mystère';
	return d.alias + ' alias «\u00a0' + a.name + '\u00a0» ' + DEEDS[(b || a).key];
}
function news(d, ART, tabloid) {
	const W = 1080, H = 1350, P = 'fn' + ++uid;
	const pal = tabloid
		? { paper: '#fbfbf7', ink: '#111', mast: '#d7141a', mastInk: '#fff', rule: '#111', photoTint: 0 }
		: { paper: '#efe6d2', ink: '#221c14', mast: 'none', mastInk: '#221c14', rule: '#221c14', photoTint: 0.18 };
	const defs = `<filter id="${P}bw"><feColorMatrix type="saturate" values="${tabloid ? 1 : 0.15}"/></filter>` +
		`<pattern id="${P}dots" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".9" fill="#000" opacity=".08"/></pattern>`;
	let s = svgOpen(W, H, defs) + `<rect width="${W}" height="${H}" fill="${pal.paper}"/>`;
	if (!tabloid) s += `<rect width="${W}" height="${H}" fill="url(#${P}dots)"/>`;
	const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
	/* masthead */
	if (tabloid) {
		s += `<rect x="0" y="0" width="${W}" height="170" fill="${pal.mast}"/>` + T(W / 2, 128, COPY.tabloidMast, 118, { w: 900, fill: '#fff', anchor: 'middle', ls: -3 });
		s += `<rect x="0" y="170" width="${W}" height="46" fill="#111"/>` + T(60, 201, date, 20, { fill: '#fff', w: 600 }) + T(W - 60, 201, COPY.edition.toUpperCase(), 20, { fill: '#ffd400', w: 800, anchor: 'end' });
	} else {
		s += T(W / 2, 130, COPY.masthead, 104, { font: SERIF, w: 700, fill: pal.ink, anchor: 'middle' });
		s += `<path d="M60 160 H${W - 60} M60 206 H${W - 60}" stroke="${pal.rule}" stroke-width="2"/><path d="M60 166 H${W - 60}" stroke="${pal.rule}" stroke-width="1"/>`;
		s += T(60, 192, date, 20, { font: SERIF, italic: true, fill: pal.ink }) + T(W / 2, 192, COPY.edition, 20, { font: SERIF, w: 700, fill: pal.ink, anchor: 'middle' }) + T(W - 60, 192, COPY.price, 20, { font: SERIF, italic: true, fill: pal.ink, anchor: 'end' });
	}
	/* headline, wrapped */
	const h = headline(d), hSize = tabloid ? 76 : 68;
	const hl = wrap(h, tabloid ? 22 : 26).slice(0, 4);
	s += lines(hl, 60, 300, hSize, 1.08, { font: tabloid ? SANS : SERIF, w: tabloid ? 900 : 700, fill: pal.ink, ls: tabloid ? -2 : -1 });
	const top = 300 + hl.length * hSize * 1.08;
	/* the photo */
	s += `<g filter="url(#${P}bw)">${flag(d, 60, top, 560)}</g>`;
	if (!tabloid) s += `<rect x="60" y="${top}" width="560" height="373" fill="#7a5a2a" opacity="${pal.photoTint}"/>`;
	s += `<rect x="60" y="${top}" width="560" height="373" fill="none" stroke="${pal.rule}" stroke-width="2"/>`;
	s += T(60, top + 400, COPY.photo(d.alias), 17, { font: SERIF, italic: true, fill: pal.ink });
	/* side column: readings as news items */
	const cx = 650, cw = 370;
	s += `<path d="M${cx - 15} ${top} V${top + 400}" stroke="${pal.rule}" stroke-width="1"/>`;
	let y = top + 22;
	for (const r of all(d).slice(0, 4)) {
		const a = Math.abs(r.v), adv = a >= 70 ? COPY.firmly : a >= 35 ? COPY.clearly : COPY.slightly;
		s += T(cx, y, r.label.toUpperCase(), 16, { w: 800, fill: tabloid ? '#d7141a' : pal.ink, ls: 1 });
		const body = wrap(COPY.lean(d.alias, pole(r)).replace(' penche ', ' penche ' + adv + ' ') + ' (' + Math.round(r.v > 0 ? r.v : -r.v) + ' sur 100).', 34);
		s += lines(body.slice(0, 3), cx, y + 26, 19, 1.3, { font: SERIF, fill: pal.ink });
		y += 26 + Math.min(body.length, 3) * 19 * 1.3 + 22;
	}
	/* the nearest party, and the badges as small ads */
	const adsTop = Math.max(top + 440, y + 10);
	if (d.nearest) s += T(60, adsTop, COPY.nearestNews(d.nearest.name, d.nearest.d), fit(COPY.nearestNews(d.nearest.name, d.nearest.d), 24, W - 120, 0.5), { font: SERIF, w: 700, fill: pal.ink });
	s += `<path d="M60 ${adsTop + 24} H${W - 60}" stroke="${pal.rule}" stroke-width="2"/>`;
	s += T(60, adsTop + 56, COPY.ads.toUpperCase(), 18, { w: 800, fill: pal.ink, ls: 2 });
	const n = Math.min(4, d.badges.length), bw = (W - 120 - (n - 1) * 20) / Math.max(n, 1);
	d.badges.slice(0, n).forEach((b, i) => {
		const x = 60 + i * (bw + 20), yy = adsTop + 72, bh = Math.min(200, H - yy - 30), size = Math.max(50, Math.min(110, bh - 76));
		s += `<rect x="${x}" y="${yy}" width="${bw}" height="${bh}" fill="none" stroke="${pal.rule}" stroke-width="1.5" stroke-dasharray="${tabloid ? '0' : '6 4'}"/>`;
		s += badge(ART, b, x + (bw - size) / 2, yy + 8, size);
		s += lines(wrap(b.name, 18).slice(0, 2), x + bw / 2, yy + size + 30, 17, 1.2, { font: SERIF, w: 700, fill: pal.ink, anchor: 'middle' });
	});
	return s + '</svg>';
}

/* ---------- 3. boarding pass ---------- */
const initials = (s) => s.replace(/[^A-Za-zÀ-ÿ ]/g, ' ').split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase()).join('').slice(0, 3) || 'XXX';
function boarding(d, ART, theme) {
	const W = 1200, H = 630, P = 'fb' + ++uid;
	const c = theme || { bg: '#f4f4f2', surface: '#ffffff', text: '#1c1c1b', text2: '#4a4a47', text3: '#62625e', accent: '#0f6468', border: '#dfdfdb' };
	const from = (d.country || 'FR').slice(0, 3).toUpperCase(), to = d.nearest ? initials(d.nearest.name) : '???';
	const row = d.placed ? Math.round((100 - d.y) / 200 * 39) + 1 : 20, letter = d.placed ? 'ABCDEF'[Math.min(5, Math.floor((d.x + 100) / 200 * 6))] : 'C';
	const gate = !d.placed ? '?' : (d.y >= 0 ? 'T' : 'O') + (d.x < 0 ? 'G' : 'D');
	const flight = 'PSK ' + (hash(d.alias) % 9000 + 1000);
	const top = d.badges[0];
	let s = svgOpen(W, H, `<clipPath id="${P}c"><rect x="30" y="30" width="${W - 60}" height="${H - 60}" rx="28"/></clipPath>`);
	s += `<rect width="${W}" height="${H}" fill="${c.bg}"/>`;
	s += `<g clip-path="url(#${P}c)"><rect x="30" y="30" width="${W - 60}" height="${H - 60}" fill="${c.surface}"/>` +
		`<rect x="30" y="30" width="${W - 60}" height="96" fill="${c.accent}"/></g>`;
	/* the notches of the tear line */
	s += `<circle cx="850" cy="30" r="22" fill="${c.bg}"/><circle cx="850" cy="${H - 30}" r="22" fill="${c.bg}"/>`;
	s += `<path d="M850 60 V${H - 60}" stroke="${c.border}" stroke-width="3" stroke-dasharray="10 9"/>`;
	s += T(70, 92, COPY.boarding.toUpperCase(), 30, { w: 800, fill: '#fff', ls: 3 }) + T(810, 92, flight, 26, { w: 700, fill: '#fff', anchor: 'end' });
	/* route */
	const label = (x, y, t) => T(x, y, t.toUpperCase(), 15, { w: 700, fill: c.text3, ls: 2 });
	s += label(70, 180, COPY.from) + T(70, 262, from, 84, { w: 800, fill: c.text, ls: -2 });
	s += `<path d="M300 232 H520" stroke="${c.text3}" stroke-width="3" stroke-dasharray="4 10" stroke-linecap="round"/>` +
		`<g transform="translate(560 232) rotate(90)"><path d="M0 -26 L7 -8 L26 4 V10 L7 4 V18 L13 24 V28 L0 24 L-13 28 V24 L-7 18 V4 L-26 10 V4 L-7 -8 Z" fill="${c.accent}"/></g>`;
	s += label(610, 180, COPY.to) + T(610, 262, to, 84, { w: 800, fill: c.text, ls: -2 });
	if (d.nearest) s += T(610, 294, d.nearest.name, fit(d.nearest.name, 20, 220), { fill: c.text2 });
	s += T(70, 294, d.country, 20, { fill: c.text2 });
	/* passenger and seat */
	const cell = (x, y, k, v, size = 34) => label(x, y, k) + T(x, y + 42, v, fit(v, size, 250), { w: 700, fill: c.text });
	s += cell(70, 360, COPY.passenger, d.alias, 38) + cell(400, 360, COPY.seat, row + letter) + cell(560, 360, COPY.gate, gate);
	s += cell(70, 460, COPY.cls, top ? top.name : 'Éco', 30);
	s += T(70, 560, COPY.boardingNote, 18, { fill: c.text3, italic: true });
	/* stub: barcode, the flag, a sticker */
	let bars = '', h = hash(d.alias + flight), x = 880;
	while (x < 1140) { const w = 2 + (h & 3) * 2; if (h & 4) bars += `<rect x="${x}" y="470" width="${w}" height="80" fill="${c.text}"/>`; x += w + 2; h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0; }
	s += label(880, 180, COPY.passenger) + T(880, 216, d.alias, fit(d.alias, 28, 250), { w: 700, fill: c.text });
	s += T(880, 262, from + ' → ' + to, 26, { w: 700, fill: c.text2 }) + T(880, 296, COPY.seat + ' ' + row + letter + ' · ' + COPY.gate + ' ' + gate, 18, { fill: c.text2 });
	s += flag(d, 880, 320, 120, ` opacity=".95"`) + bars;
	d.badges.slice(1, 3).forEach((b, i) => { s += badge(ART, b, i ? 1018 : 690, i ? 312 : 400, i ? 120 : 150, i ? 14 : -12); });
	return s + '</svg>';
}

/* ---------- 4. till receipt of opinions ---------- */
function receipt(d, ART) {
	const W = 720, H = 1400, P = 'fk' + ++uid;
	const ink = '#2a2a2a';
	let zig = `M0 0 H${W} V${H - 20}`;
	for (let x = W; x > 0; x -= 20) zig += ` L${x - 10} ${H} L${x - 20} ${H - 20}`;
	let s = svgOpen(W, H, `<filter id="${P}f"><feTurbulence baseFrequency=".9" numOctaves="1" seed="3"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .05 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>`);
	s += `<rect width="${W}" height="${H}" fill="#d9d6cf"/><path d="${zig} Z" fill="#fbfaf6"/><path d="${zig} Z" fill="#fff" filter="url(#${P}f)"/>`;
	const M = (x, y, t, size = 22, o = {}) => T(x, y, t, size, { font: MONO, fill: ink, ...o });
	const dash = (y) => M(W / 2, y, '-'.repeat(40), 20, { anchor: 'middle', op: 0.6 });
	s += M(W / 2, 90, COPY.shop, 30, { w: 800, anchor: 'middle' }) + M(W / 2, 128, COPY.shopLine, 20, { anchor: 'middle' });
	const date = new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	s += M(60, 180, date, 20) + M(W - 60, 180, COPY.cashier + (hash(d.alias) % 9 + 1), 20, { anchor: 'end' });
	s += M(60, 212, 'Client : ' + d.alias, fit('Client : ' + d.alias, 20, W - 120, 0.6)) + dash(248);
	let y = 290, total = 0;
	for (const r of all(d).slice(0, 8)) {
		const price = (Math.abs(r.v) / 10).toFixed(2).replace('.', ',');
		total += Math.abs(r.v) / 10;
		const name = pole(r);
		s += M(60, y, name.length > 26 ? name.slice(0, 25) + '.' : name, 22) + M(W - 60, y, price + ' €', 22, { anchor: 'end' });
		s += M(80, y + 26, '  ' + r.label, 16, { op: 0.65 });
		y += 56;
	}
	s += dash(y);
	y += 40;
	for (const b of d.badges.slice(0, 3)) {
		s += M(60, y, COPY.promo + ' ' + b.name, fit(COPY.promo + ' ' + b.name, 20, W - 240, 0.6), { w: 700 }) + M(W - 60, y, '-' + (b.level || 1) + ',00 €', 20, { anchor: 'end', w: 700 });
		total -= b.level || 1;
		y += 34;
	}
	s += dash(y + 4);
	y += 52;
	s += M(60, y, COPY.total, 34, { w: 800 }) + M(W - 60, y, Math.max(0, total).toFixed(2).replace('.', ',') + ' €', 34, { w: 800, anchor: 'end' });
	y += 44;
	if (d.nearest) s += M(60, y, 'Rayon conseillé : ' + d.nearest.name, fit('Rayon conseillé : ' + d.nearest.name, 20, W - 120, 0.6));
	/* the flag stamped, the top badge as a sticker */
	const stamp = Math.min(y + 40, H - 380);
	s += `<g transform="rotate(-6 200 ${stamp + 70})">${flag(d, 90, stamp, 210, ' opacity=".9"')}</g>`;
	if (d.badges[0]) s += badge(ART, d.badges[0], 430, stamp - 20, 180, 10);
	let bars = '', h = hash(d.alias), x = 120;
	while (x < W - 120) { const w = 2 + (h & 3) * 2; if (h & 4) bars += `<rect x="${x}" y="${H - 200}" width="${w}" height="70" fill="${ink}"/>`; x += w + 2; h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0; }
	s += bars + M(W / 2, H - 80, COPY.thanks, 26, { w: 800, anchor: 'middle' }) + M(W / 2, H - 48, COPY.keep, 18, { anchor: 'middle' });
	return s + '</svg>';
}

export const FUN = [
	{ key: 'tabloid', w: 1080, h: 1350, draw: (d, ART) => news(d, ART, true) },
	{ key: 'boarding', w: 1200, h: 630, draw: (d, ART, theme) => boarding(d, ART, theme) },
	{ key: 'receipt', w: 720, h: 1400, draw: (d, ART) => receipt(d, ART) }
];
