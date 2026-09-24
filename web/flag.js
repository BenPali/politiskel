/* The Politiskel flag: an emblem drawn from a profile's readings, for the
   profiles PolitiScales never drew one for, and for anyone who prefers it.

   It follows how political flags actually speak, and how PolitiScales builds
   its own (read from its source): conventional political colours, the layouts
   of real flags, and one symbol for the most marked trait — within NAVA's
   rules for a good flag (two or three strong colours, one symbol, large
   shapes, no lettering). Every element stands for a reading, and the legend
   says which.

   Nothing is picked from a fixed list of flags: every trait carries its own
   colour and symbol, and a flag is the combination of its profile's
   strongest traits — colours filling the layout's fields in order, a main
   symbol and a second one elsewhere, and modifiers for intensity (the number
   of stripes, a border for marked protectionism, the rainbow bar). An
   ecologist anarchist and a productivist one share the diagonal and differ
   in everything else.

     colours   red: economic left · gold: economic liberalism · blue: order ·
               purple: feminism · pink: LGBT rights · green: ecology ·
               steel: productivism · sky blue (the UN's): cosmopolitanism ·
               orange: the centre · black, as structure: marked
               libertarianism
     layouts   the anarchist per-bend diagonal (black at the lower fly), the
               revolutionary hoist triangle and star, a white field with a
               gold border for order and tradition — or for monarchism, once a
               question measures it — the Nordic cross for order, a Y-shaped
               pall for multiculturalism, canton and stripes for
               cosmopolitanism, a national triband, the vertical tricolour; a
               rainbow bar joins any of them for marked support of LGBT rights
     symbols   chosen in flagTraits below; each one's meaning is in
               web/locale-fr.js, flagSymbolLines

   Left out on purpose: the hammer and sickle and the fleur-de-lis as
   PolitiScales uses them (the fleur-de-lis waits for a monarchism reading),
   brown and "bleu marine", party logos, faiths' emblems, and hate symbols —
   the Iron Cross among them, which the far right has made its own; the croix
   de guerre carries martial patriotism without that charge.

   The drawing is numbers, fixed colours and the paths of web/flag-icons.js
   only; no string from a profile ever enters it.

   The page has one script: the web/*.js files are concatenated in the order
   web/shell.html includes them, and share its top-level scope. */

const FLAG_COLOURS = {
  red: "#d52b1e", gold: "#f5c518", blue: "#1c4fa0", black: "#151515", purple: "#6b2c91",
  green: "#1a8a4a", pink: "#e0529c", orange: "#f28c28", sky: "#4a90d9", steel: "#5f6f7e",
  white: "#ffffff"
};
const FLAG_LIGHT = new Set(["gold", "white", "pink", "orange", "sky"]);
const FLAG_RAINBOW = ["#e40303", "#ff8c00", "#ffed00", "#008026", "#004dff", "#750787"];
const FLAG_KEY = "politicompass.flags.v1";

/* Readings a future theme will provide — the institutions theme will measure
   monarchism. Until then they are absent and what depends on them never
   shows; a reading is looked up by name on the computed profile. */
const futureReading = (c, key) => (c.readings && Number.isFinite(c.readings[key]) ? c.readings[key] : null);

/* Every trait a flag can speak of, each with the strength it has in a profile
   (0-100, or null), and what it contributes: a colour, a symbol, or both. A
   flag is the combination of its profile's strongest traits — two anarchists
   differ by what else they are, ecology or productivism, feminism or the
   market — so every trait worth reading has a way to show.

   `min` is where a trait starts to count; `bonus` lifts a composite above
   the traits it is made of. `v` is what the legend reports. PolitiScales's
   own percentages stand in where the questionnaire has not been answered. */
function flagTraits(c, p) {
  const x = c.x, y = c.y;
  const d = Object.assign({}, (c.quiz && c.quiz.dims) || {}, (c.soc && c.soc.dims) || {});
  const ps = {};
  for (const k of ["com", "laf", "eco", "prod", "rehab", "pun", "prg", "csv", "int", "nat", "rev", "ref"])
    if (p && Number.isFinite(p[k])) ps[k] = p[k];
  const has = v => v !== null && v !== undefined && Number.isFinite(v);
  const neg = v => (has(v) ? -v : null);
  const first = (...vs) => { for (const v of vs) if (has(v)) return v; return null; };
  const cls = c.quiz ? c.quiz.class : null;
  const prot = c.quiz ? c.quiz.protectionism : null;
  const intl = has(d.nationalism) ? -d.nationalism : has(ps.int) || has(ps.nat) ? (ps.int || 0) - (ps.nat || 0) : null;
  const nat = first(d.nationalism, ps.nat);
  const ord = first(d.laworder, ps.pun);
  const rev = Math.max(has(cls) ? cls : -100, has(ps.rev) ? ps.rev : -100);
  const monarchy = futureReading(c, "monarchism");
  const stands = (v, axis) => v >= 80 || !has(axis) || v >= axis + 15;

  const T = [
    { k: "left",        s: neg(x),                      min: 34, colour: "red" },
    { k: "market",      s: x,                           min: 34, colour: "gold" },
    { k: "order",       s: y,                           min: 34, colour: "blue" },
    { k: "class",       s: first(cls, ps.com),          min: 50, colour: "red", symbol: "fist" },
    { k: "redistribution", s: neg(d.redistribution),    min: 60, colour: "red", symbol: "scales" },
    { k: "deregulation", s: first(d.deregulation, ps.laf), min: 60, colour: "gold", symbol: "swallow" },
    /* Law and order is part of y, and so is liberty against it: their
       symbols show only when they say more than the axis's colour already
       does — standing clear of y, or very strong. */
    { k: "liberties",   s: first(neg(d.laworder), ps.rehab), min: 60, symbol: "liberty",
      when: () => stands(first(neg(d.laworder), ps.rehab), neg(y)) },
    { k: "laworder",    s: ord,                         min: 60, colour: "blue", symbol: "shield",
      when: () => stands(ord, y) },
    { k: "cosmopolitan", s: intl,                       min: 60, colour: "sky", symbol: "globe" },
    { k: "nation",      s: nat,                         min: 60, symbol: "oak" },
    { k: "protectionism", s: prot,                      min: 60, symbol: "tower" },
    { k: "secular",     s: neg(d.religion),             min: 60, symbol: "book" },
    { k: "tradition",   s: first(d.religion, has(ps.csv) ? ps.csv - 10 : null), min: 60, symbol: "column" },
    { k: "multicultural", s: neg(d.multiculturalism),   min: 60, symbol: "rings" },
    { k: "feminism",    s: neg(d.women),                min: 60, colour: "purple", symbol: "venus" },
    { k: "lgbt",        s: neg(d.lgbt),                 min: 60, colour: "pink" },
    { k: "ecology",     s: ps.eco,                      min: 60, colour: "green", symbol: "sprout" },
    { k: "productivism", s: ps.prod,                    min: 60, colour: "steel", symbol: "factory" },
    { k: "revolution",  s: ps.rev,                      min: 65, symbol: "star" },
    { k: "reform",      s: ps.ref,                      min: 65, symbol: "handshake" },
    { k: "progress",    s: ps.prg,                      min: 70, symbol: "torch" },
    { k: "centre",      s: has(x) && has(y) && Math.abs(x) < 25 && Math.abs(y) < 25
                             ? 60 - Math.max(Math.abs(x), Math.abs(y)) : null, min: 1, colour: "orange" },
    /* composites, which outrank the traits they combine */
    { k: "anarchy",     s: neg(y),                      min: 80, symbol: "anarchy", bonus: 12 },
    { k: "phrygian",    s: has(y) && y <= -30 ? rev : null, min: 70, symbol: "phrygian", bonus: 12 },
    { k: "croix",       s: has(nat) && has(ord) ? Math.min(nat, ord) : null,
                             min: 60, symbol: "croix", bonus: 20, when: () => nat >= 70 },
    { k: "monarchy",    s: monarchy,                    min: 60, symbol: "crown", bonus: 20 },
    { k: "legitimism",  s: monarchy,                    min: 85, symbol: "fleur", bonus: 30 }
  ].filter(t => has(t.s) && t.s >= t.min && (!t.when || t.when()))
   .map(t => Object.assign(t, { v: Math.round(t.s), rank: t.s + (t.bonus || 0) }))
   .sort((a, b) => b.rank - a.rank);

  /* colours: each trait's, strongest first, each colour once */
  const cols = [];
  for (const t of T) if (t.colour && !cols.includes(t.colour)) cols.push(t.colour);
  /* symbols: the two strongest, from two different traits; a composite
     replaces the symbols of the traits it is made of */
  const covers = { anarchy: [], phrygian: ["revolution", "class"], croix: ["nation", "laworder"],
                   monarchy: [], legitimism: ["monarchy"] };
  const syms = [];
  const hidden = new Set();
  for (const t of T) {
    if (!t.symbol || hidden.has(t.k) || syms.length === 2) continue;
    syms.push(t);
    for (const k of covers[t.k] || []) hidden.add(k);
  }
  const trait = k => T.find(t => t.k === k) || null;
  return { x, y, traits: T, cols: cols.slice(0, 3), syms, trait,
           intl: has(intl) ? intl : 0, rev, nat: has(nat) ? nat : 0, monarchy,
           tradition: (trait("tradition") || {}).s || 0,
           multi: (trait("multicultural") || {}).s || 0, lgbt: (trait("lgbt") || {}).s || 0,
           prot: has(prot) ? prot : 0 };
}

function flagLayout(t) {
  const y = t.y === null ? 0 : t.y;
  if (t.monarchy !== null && t.monarchy >= 60) return "royal";
  if (y <= -55) return "diagonal";
  if (t.rev >= 70) return "revolution";
  if (y >= 60 && t.tradition >= 60) return "royal";
  if (y >= 34) return "nordic";
  if (t.multi >= 70) return "pall";
  if (t.intl >= 60) return "stripes";
  if (t.nat >= 60) return "triband";
  return "pale";
}

function flagIcon(k, cx, cy, size, fill, field) {
  const s = size / 512;
  return FLAG_ICONS[k].map(e => {
    const d = typeof e === "string" ? e : e.d;
    if (e.knock && !field) return "";   /* nothing to part the shapes with */
    return '<path transform="translate(' + (cx - size / 2) + "," + (cy - size / 2) + ") scale(" + s + ')"'
      + ' fill="' + (e.knock ? field : fill) + '"' + (e.rule ? ' fill-rule="' + e.rule + '"' : "")
      + ' d="' + d + '"/>';
  }).join("");
}
const inkOn = bg => (FLAG_LIGHT.has(bg) ? "#151515" : "#ffffff");

/* The flag of a computed profile: { url, legend, layout } — or null when there
   is nothing to draw from.

   Each layout has its zones, filled in order of strength: its colour fields
   take the strongest traits' colours, its first place takes the strongest
   symbol and its second place, smaller and elsewhere, the next one. So the
   same layout reads differently for every combination of traits. */
function politiskelFlag(c, p) {
  const t = flagTraits(c, p);
  if (t.x === null && t.y === null && !t.traits.length) return null;
  const cols = t.cols.length ? t.cols : ["white"];
  const layout = flagLayout(t);
  const C = k => FLAG_COLOURS[k];
  const [a, b, c3] = cols;
  const P = [];
  let places = [];   /* [{ x, y, size, bg }] — where the symbols go, first the main one */
  let drawn = [];    /* the meaningful colours shown, for the legend */
  let syms = t.syms.slice();

  if (layout === "diagonal") {
    const other = a === "white" ? "black" : a;
    P.push('<rect width="150" height="100" fill="' + C("black") + '"/>');
    if (other !== "black") P.push('<polygon points="0,0 150,0 0,100" fill="' + C(other) + '"/>');
    places = [{ x: 42, y: 32, size: 40, bg: other }, { x: 112, y: 70, size: 28, bg: "black" }];
    drawn = other !== "black" ? [other] : [];
  } else if (layout === "revolution") {
    const tri = a === "white" ? "red" : a, band = b && b !== tri ? b : "black";
    P.push('<rect width="150" height="100" fill="' + C(band) + '"/>',
           '<rect y="33.3" width="150" height="33.4" fill="' + C("white") + '"/>',
           '<polygon points="0,0 70,50 0,100" fill="' + C(tri) + '"/>');
    /* the triangle keeps the revolution's star unless a symbol claims it */
    const star = !syms.some(s => s.symbol === "star");
    if (star) P.push(flagIcon("star", 24, 50, 26, "#ffffff"));
    else syms = [syms.find(s => s.symbol === "star")].concat(syms.filter(s => s.symbol !== "star"));
    places = star ? [{ x: 108, y: 50, size: 30, bg: "white" }, { x: 132, y: 84, size: 18, bg: band }]
                  : [{ x: 24, y: 50, size: 26, bg: tri }, { x: 108, y: 50, size: 30, bg: "white" }];
    /* a black band chosen for want of a second colour is filler, not a reading */
    drawn = [tri, b && b !== tri ? band : null].filter(k => k && k !== "white");
  } else if (layout === "royal") {
    const field = a === "blue" || a === "white" ? "white" : a;
    P.push('<rect width="150" height="100" fill="' + C(field) + '"/>',
           '<rect x="5" y="5" width="140" height="90" fill="none" stroke="' + C("gold") + '" stroke-width="10"/>');
    places = [{ x: 75, y: 48, size: 50, bg: field }, { x: 128, y: 80, size: 16, bg: field }];
    drawn = field !== "white" ? [field] : [];
  } else if (layout === "nordic") {
    const cross = b || "white";
    P.push('<rect width="150" height="100" fill="' + C(a) + '"/>');
    if (cross !== "white") P.push('<rect x="38" width="26" height="100" fill="#fff"/><rect y="37" width="150" height="26" fill="#fff"/>');
    P.push('<rect x="43" width="16" height="100" fill="' + C(cross) + '"/><rect y="42" width="150" height="16" fill="' + C(cross) + '"/>');
    if (c3) P.push('<rect x="64" y="63" width="86" height="37" fill="' + C(c3) + '"/>');
    places = [{ x: 19, y: 19, size: 28, bg: a }, { x: 107, y: 81, size: 24, bg: c3 || a }];
    drawn = [a, cross, c3].filter(k => k && k !== "white");
  } else if (layout === "pall") {
    const field2 = b || "white";
    P.push('<rect width="150" height="100" fill="' + C(a) + '"/>',
           '<rect y="50" width="150" height="50" fill="' + C(c3 || a) + '"/>',
           '<polygon points="0,62 0,100 66,100" fill="' + C(field2) + '"/><polygon points="0,0 0,38 66,0" fill="' + C(field2) + '"/>',
           '<path d="M0,20 L60,50 L150,50 M0,80 L60,50" stroke="#fff" stroke-width="22" fill="none"/>',
           '<path d="M0,20 L60,50 L150,50 M0,80 L60,50" stroke="' + C("black") + '" stroke-width="12" fill="none"/>');
    places = [{ x: 110, y: 25, size: 28, bg: a }, { x: 110, y: 77, size: 24, bg: c3 || a }];
    drawn = [a, b, c3].filter(k => k && k !== "white");
  } else if (layout === "stripes") {
    const second = b && b !== "sky" ? b : (a === "sky" ? "white" : "sky");
    const n = t.intl >= 80 ? 7 : 5, h = 100 / n, canton = h * (n === 7 ? 4 : 3);
    for (let i = 0; i < n; i++)
      P.push('<rect y="' + (i * h) + '" width="150" height="' + (h + 0.2) + '" fill="' + (i % 2 ? C("white") : C(second === "white" ? a : second)) + '"/>');
    P.push('<rect width="66" height="' + canton + '" fill="' + C(a) + '"/>');
    places = [{ x: 33, y: canton / 2, size: 34, bg: a }];
    drawn = [a, second].filter(k => k !== "white");
  } else if (layout === "triband") {
    const mid = b || "white";
    P.push('<rect width="150" height="100" fill="' + C(a) + '"/>',
           '<rect y="66.6" width="150" height="33.4" fill="' + C(c3 || a) + '"/>',
           '<rect y="33.3" width="150" height="33.4" fill="' + C(mid) + '"/>');
    places = [{ x: 75, y: 50, size: 30, bg: mid }, { x: 18, y: 16, size: 20, bg: a }];
    drawn = [a, b, c3].filter(k => k && k !== "white");
  } else {
    const cs = cols.map(C);
    if (cs.length === 1) {
      P.push('<rect width="150" height="100" fill="' + cs[0] + '"/>');
      places = [{ x: 75, y: 50, size: 46, bg: cols[0] }, { x: 128, y: 18, size: 20, bg: cols[0] }];
    } else if (cs.length === 2) {
      P.push('<rect width="75" height="100" fill="' + cs[0] + '"/><rect x="75" width="75" height="100" fill="' + cs[1] + '"/>');
      places = [{ x: 37, y: 50, size: 40, bg: cols[0] }, { x: 112, y: 50, size: 30, bg: cols[1] }];
    } else {
      P.push('<rect width="50" height="100" fill="' + cs[0] + '"/><rect x="50" width="50" height="100" fill="' + cs[1] + '"/><rect x="100" width="50" height="100" fill="' + cs[2] + '"/>');
      places = [{ x: 75, y: 50, size: 38, bg: cols[1] }, { x: 25, y: 18, size: 18, bg: cols[0] }];
    }
    drawn = cols.slice();
  }

  /* modifiers */
  const rainbow = t.lgbt >= 80 && layout !== "revolution";
  if (rainbow)
    FLAG_RAINBOW.forEach((col, i) => P.push('<rect x="138" y="' + (i * 100 / 6) + '" width="12" height="' + (100 / 6 + 0.2) + '" fill="' + col + '"/>'));
  const border = t.prot >= 75 && layout !== "royal";
  if (border) P.push('<rect x="3" y="3" width="144" height="94" fill="none" stroke="' + C("black") + '" stroke-width="6"/>');

  const shown = syms.slice(0, places.length);
  shown.forEach((s, i) => {
    const pl = places[i];
    const fg = s.symbol === "phrygian" && pl.bg === "white" ? C("red") : inkOn(pl.bg);
    P.push(flagIcon(s.symbol, pl.x, pl.y, pl.size, fg, C(pl.bg)));
  });
  if (cols[0] === "white" && layout === "pale") P.push('<rect x=".5" y=".5" width="149" height="99" fill="none" stroke="#c8c8c8"/>');

  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100" width="150" height="100">'
    + P.join("") + "</svg>";
  return { url: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg), layout,
           legend: flagLegend(t, drawn, layout, shown, border, rainbow,
                              !t.syms.some(s => s.symbol === "star")) };
}

/* One line per element, in the order the eye reads a flag. */
function flagLegend(t, drawn, layout, shown, border, rainbow, starOfLayout) {
  const lines = [L.flagLayouts[layout](t)];
  const strength = colour => Math.round(Math.max(...t.traits.filter(x => x.colour === colour).map(x => x.s), 0));
  for (const k of drawn) lines.push(L.flagColourLines[k](strength(k), t));
  if (layout === "diagonal") lines.push(L.flagColourLines.black(Math.round(-t.y)));
  if (layout === "revolution" && starOfLayout) lines.push(L.flagRevolutionStar(Math.round(t.rev)));
  shown.forEach((s, i) => lines.push((i ? L.flagSecond : "") + L.flagSymbolLines[s.symbol](s.v)));
  if (rainbow) lines.push(L.flagRainbow(Math.round(t.lgbt)));
  if (border) lines.push(L.flagBorder(Math.round(t.prot)));
  return lines;
}

/* Which flag the page shows: PolitiScales's when there is one, or Politiskel's
   for every profile. A viewer's preference, kept in this browser. */
let flagMode = "politiscales";
try { flagMode = localStorage.getItem(FLAG_KEY) === "politiskel" ? "politiskel" : "politiscales"; }
catch (_) { /* private browsing */ }

/* How large the flag is drawn in the profile card: a viewer's preference. */
const FLAG_SIZE_KEY = "politicompass.flagsize.v1";
let flagLarge = false;
try { flagLarge = localStorage.getItem(FLAG_SIZE_KEY) === "large"; } catch (_) { /* private browsing */ }

/* The flag and its legend, for the profile card: shown whatever the mode,
   so both flags can be seen there — PolitiScales's above, this one here. */
function flagFigure(p) {
  const f = politiskelFlag(coords(p), p);
  if (!f) return null;
  const img = document.createElement("img");
  img.className = "flag-drawn" + (flagLarge ? " large" : "");
  img.src = f.url;
  img.alt = L.flagGeneratedAlt(p.alias);
  const ul = document.createElement("ul");
  ul.className = "flag-legend";
  for (const line of f.legend) {
    const li = document.createElement("li");
    li.textContent = line;
    ul.appendChild(li);
  }
  const box = document.createElement("div");
  box.className = "flag-figure";
  const cap = document.createElement("p");
  cap.className = "hint";
  cap.textContent = L.flagFigureTitle;
  const credit = document.createElement("p");
  credit.className = "note";
  credit.textContent = L.flagCredit;
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "ghost flag-size";
  const label = () => { toggle.textContent = flagLarge ? L.flagShrink : L.flagEnlarge; };
  label();
  toggle.addEventListener("click", () => {
    flagLarge = !flagLarge;
    img.classList.toggle("large", flagLarge);
    label();
    try { localStorage.setItem(FLAG_SIZE_KEY, flagLarge ? "large" : "default"); } catch (_) { /* quota */ }
  });
  const head = document.createElement("div");
  head.className = "flag-figure-head";
  head.append(cap, toggle);
  box.append(head, img, ul, credit);
  return box;
}
