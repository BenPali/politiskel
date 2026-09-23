/* The Politiskel flag: an emblem drawn from a profile's readings, for the
   profiles PolitiScales never drew one for, and for anyone who prefers it.

   It follows how political flags actually speak, and how PolitiScales builds
   its own (read from its source): conventional political colours, the layouts
   of real flags, and one symbol for the most marked trait — within NAVA's
   rules for a good flag (two or three strong colours, one symbol, large
   shapes, no lettering). Every element stands for a reading, and the legend
   says which.

     colours   red: economic left · gold: economic liberalism · blue: order ·
               purple: feminism · pink: LGBT rights · green: ecology ·
               sky blue (the UN's): cosmopolitanism · orange: the centre ·
               black, as structure: marked libertarianism
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
  green: "#1a8a4a", pink: "#e0529c", orange: "#f28c28", sky: "#4a90d9", white: "#ffffff"
};
const FLAG_LIGHT = new Set(["gold", "white", "pink", "orange", "sky"]);
const FLAG_RAINBOW = ["#e40303", "#ff8c00", "#ffed00", "#008026", "#004dff", "#750787"];
const FLAG_KEY = "politicompass.flags.v1";

/* Readings a future theme will provide — the institutions theme will measure
   monarchism. Until then they are absent and what depends on them never
   shows; a reading is looked up by name on the computed profile. */
const futureReading = (c, key) => (c.readings && Number.isFinite(c.readings[key]) ? c.readings[key] : null);

/* What a profile's readings say, as strengths (0-100): colours, symbols, and
   the few values the layout is chosen from. `ps` are PolitiScales's own
   percentages, used where the questionnaire has not been answered, so a
   PolitiScales-only profile still gets a flag of its own. */
function flagTraits(c, p) {
  const x = c.x, y = c.y;
  const ed = (c.quiz && c.quiz.dims) || {}, sd = (c.soc && c.soc.dims) || {};
  const d = Object.assign({}, ed, sd);
  const ps = {};
  for (const k of ["com", "laf", "eco", "prod", "rehab", "pun", "prg", "csv", "int", "nat", "rev", "ref"])
    if (p && Number.isFinite(p[k])) ps[k] = p[k];
  const has = v => v !== null && v !== undefined && Number.isFinite(v);
  const neg = v => (has(v) ? -v : null);

  const colours = [], symbols = [];
  const colour = (k, s) => { if (has(s)) colours.push({ k, s }); };
  if (has(x) && x <= -34) colour("red", -x);
  if (has(x) && x >= 34) colour("gold", x);
  if (has(y) && y >= 34) colour("blue", y);
  if (has(d.women) && d.women <= -60) colour("purple", -d.women);
  if (has(d.lgbt) && d.lgbt <= -60) colour("pink", -d.lgbt);
  if ((ps.eco || 0) >= 60) colour("green", ps.eco);
  const intl = has(d.nationalism) ? -d.nationalism : (ps.int || 0) - (ps.nat || 0);
  if (intl >= 60) colour("sky", intl);
  if (has(x) && has(y) && Math.abs(x) < 25 && Math.abs(y) < 25)
    colour("orange", 60 - Math.max(Math.abs(x), Math.abs(y)));

  /* s orders the symbols; v is the reading the legend reports */
  const symbol = (k, s, min) => { if (has(s) && s >= min) symbols.push({ k, s, v: s }); };
  const cls = c.quiz ? c.quiz.class : null;
  const prot = c.quiz ? c.quiz.protectionism : null;
  symbol("fist", cls, 50);               symbol("fist", ps.com, 65);
  symbol("swallow", d.deregulation, 60); symbol("swallow", ps.laf, 65);
  symbol("liberty", neg(d.laworder), 60); symbol("liberty", ps.rehab, 65);
  symbol("sword", d.laworder, 60);       symbol("sword", ps.pun, 65);
  symbol("globe", intl, 60);
  symbol("oak", d.nationalism, 60);      symbol("oak", ps.nat, 65);
  symbol("tower", prot, 60);
  symbol("book", neg(d.religion), 60);
  symbol("column", d.religion, 60);      symbol("column", ps.csv, 70);
  symbol("scales", neg(d.redistribution), 60);
  symbol("rings", neg(d.multiculturalism), 60);
  symbol("star", ps.rev, 65);
  symbol("sprout", ps.eco, 65);
  symbol("torch", ps.prg, 70);
  symbol("venus", neg(d.women), 75);
  symbol("handshake", ps.ref, 65);
  symbol("factory", ps.prod, 65);
  /* composites outrank their parts */
  const rev = Math.max(has(cls) ? cls : 0, ps.rev || 0);
  if (has(y) && y <= -80) symbols.push({ k: "anarchy", s: -y + 12, v: -y });
  if (rev >= 70 && has(y) && y <= -30) symbols.push({ k: "phrygian", s: rev + 12, v: rev });
  const nat = has(d.nationalism) ? d.nationalism : ps.nat || 0;
  const ord = has(d.laworder) ? d.laworder : ps.pun || 0;
  if (nat >= 70 && ord >= 60) symbols.push({ k: "croix", s: Math.max(nat, ord) + 12, v: Math.min(nat, ord) });
  const monarchy = futureReading(c, "monarchism");
  if (has(monarchy) && monarchy >= 60) symbols.push({ k: monarchy >= 85 ? "fleur" : "crown", s: monarchy + 20, v: monarchy });

  colours.sort((a, b) => b.s - a.s);
  symbols.sort((a, b) => b.s - a.s);
  const cols = [];
  for (const t of colours) if (!cols.includes(t.k)) cols.push(t.k);
  const tradition = Math.max(has(d.religion) ? d.religion : -100, (ps.csv || 0) - 10);
  return {
    x, y, cols: cols.slice(0, 3), strengths: colours, symbol: symbols[0] || null,
    intl, rev, tradition, nat, monarchy,
    multi: neg(d.multiculturalism) || 0, lgbt: neg(d.lgbt) || 0
  };
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

function flagIcon(k, cx, cy, size, fill) {
  const s = size / 512;
  return FLAG_ICONS[k].map(d => '<path transform="translate(' + (cx - size / 2) + "," + (cy - size / 2)
    + ") scale(" + s + ')" fill="' + fill + '" d="' + d + '"/>').join("");
}

/* The flag of a computed profile: { url, legend, layout } — or null when there
   is nothing to draw from. */
function politiskelFlag(c, p) {
  const t = flagTraits(c, p);
  if (t.x === null && t.y === null && !t.symbol && !t.cols.length) return null;
  const cols = t.cols.length ? t.cols : ["white"];
  const layout = flagLayout(t);
  const C = k => FLAG_COLOURS[k];
  const [a, b] = cols;
  const P = [];
  let sx = 75, sy = 50, size = 46, bg = a, symbol = t.symbol;
  let drawn = [];   /* the meaningful colours this layout shows, for the legend */

  if (layout === "diagonal") {
    const other = a === "white" ? "black" : a;
    P.push('<rect width="150" height="100" fill="' + C("black") + '"/>');
    if (other !== "black") P.push('<polygon points="0,0 150,0 0,100" fill="' + C(other) + '"/>');
    sx = 42; sy = 32; size = 40; bg = other;
    drawn = other !== "black" ? [other] : [];
  } else if (layout === "revolution") {
    const tri = a === "white" ? "red" : a;
    P.push('<rect width="150" height="100" fill="' + C(b || "black") + '"/>',
           '<rect y="33.3" width="150" height="33.4" fill="' + C("white") + '"/>',
           '<polygon points="0,0 70,50 0,100" fill="' + C(tri) + '"/>',
           flagIcon("star", 24, 50, 26, "#ffffff"));
    sx = 108; sy = 50; size = 30; bg = "white";
    if (symbol && symbol.k === "star") symbol = null;
    drawn = [tri, b].filter(k => k && k !== "white");
  } else if (layout === "royal") {
    const field = a === "blue" || a === "white" ? "white" : a;
    P.push('<rect width="150" height="100" fill="' + C(field) + '"/>',
           '<rect x="5" y="5" width="140" height="90" fill="none" stroke="' + C("gold") + '" stroke-width="10"/>');
    size = 52; bg = field;
    drawn = field !== "white" ? [field] : [];
  } else if (layout === "nordic") {
    const cross = b || "white";
    P.push('<rect width="150" height="100" fill="' + C(a) + '"/>');
    if (cross !== "white") P.push('<rect x="38" width="26" height="100" fill="#fff"/><rect y="37" width="150" height="26" fill="#fff"/>');
    P.push('<rect x="43" width="16" height="100" fill="' + C(cross) + '"/><rect y="42" width="150" height="16" fill="' + C(cross) + '"/>');
    sx = 19; sy = 19; size = 28;
    drawn = [a, cross].filter(k => k !== "white");
  } else if (layout === "pall") {
    P.push('<rect width="150" height="100" fill="' + C(a) + '"/>',
           '<polygon points="0,62 0,100 66,100" fill="' + C(b || "white") + '"/><polygon points="0,0 0,38 66,0" fill="' + C(b || "white") + '"/>',
           '<path d="M0,20 L60,50 L150,50 M0,80 L60,50" stroke="#fff" stroke-width="22" fill="none"/>',
           '<path d="M0,20 L60,50 L150,50 M0,80 L60,50" stroke="' + C("black") + '" stroke-width="12" fill="none"/>');
    sx = 110; sy = 26; size = 30;
    drawn = [a, b].filter(k => k && k !== "white");
  } else if (layout === "stripes") {
    const second = b && b !== "sky" ? b : (a === "sky" ? "white" : "sky");
    for (let i = 0; i < 5; i++)
      P.push('<rect y="' + (i * 20) + '" width="150" height="20" fill="' + (i % 2 ? C("white") : C(second === "white" ? a : second)) + '"/>');
    P.push('<rect width="66" height="60" fill="' + C(a) + '"/>');
    sx = 33; sy = 30; size = 36;
    drawn = [a, second].filter(k => k !== "white");
  } else if (layout === "triband") {
    P.push('<rect width="150" height="100" fill="' + C(a) + '"/><rect y="33.3" width="150" height="33.4" fill="' + C(b || "white") + '"/>');
    size = 30; bg = b || "white";
    drawn = [a, b].filter(k => k && k !== "white");
  } else {
    const cs = cols.map(C);
    if (cs.length === 1) P.push('<rect width="150" height="100" fill="' + cs[0] + '"/>');
    else if (cs.length === 2) { P.push('<rect width="75" height="100" fill="' + cs[0] + '"/><rect x="75" width="75" height="100" fill="' + cs[1] + '"/>'); sx = 37; }
    else { P.push('<rect width="50" height="100" fill="' + cs[0] + '"/><rect x="50" width="50" height="100" fill="' + cs[1] + '"/><rect x="100" width="50" height="100" fill="' + cs[2] + '"/>'); bg = cols[1]; }
    drawn = cols.slice();
  }
  if (t.lgbt >= 80 && layout !== "revolution" && layout !== "diagonal")
    FLAG_RAINBOW.forEach((col, i) => P.push('<rect x="138" y="' + (i * 100 / 6) + '" width="12" height="' + (100 / 6 + 0.2) + '" fill="' + col + '"/>'));
  if (symbol) {
    const fg = symbol.k === "phrygian" && bg === "white" ? C("red") : FLAG_LIGHT.has(bg) ? "#151515" : "#ffffff";
    P.push(flagIcon(symbol.k, sx, sy, size, fg));
  }
  if (bg === "white" && layout === "pale") P.push('<rect x=".5" y=".5" width="149" height="99" fill="none" stroke="#c8c8c8"/>');

  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100" width="150" height="100">'
    + P.join("") + "</svg>";
  return { url: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg), layout,
           legend: flagLegend(t, drawn, layout, symbol) };
}

/* One line per element, in the order the eye reads a flag. */
function flagLegend(t, drawn, layout, symbol) {
  const lines = [L.flagLayouts[layout](t)];
  const strength = k => (t.strengths.find(s => s.k === k) || {}).s;
  for (const k of drawn) lines.push(L.flagColourLines[k](Math.round(strength(k) || 0), t));
  if (layout === "diagonal") lines.push(L.flagColourLines.black(Math.round(-t.y)));
  if (layout === "revolution") lines.push(L.flagRevolutionStar(Math.round(t.rev)));
  if (symbol) lines.push(L.flagSymbolLines[symbol.k](Math.round(symbol.v)));
  if (t.lgbt >= 80 && layout !== "revolution" && layout !== "diagonal") lines.push(L.flagRainbow(Math.round(t.lgbt)));
  return lines;
}

/* Which flag the page shows: PolitiScales's when there is one, or Politiskel's
   for every profile. A viewer's preference, kept in this browser. */
let flagMode = "politiscales";
try { flagMode = localStorage.getItem(FLAG_KEY) === "politiskel" ? "politiskel" : "politiscales"; }
catch (_) { /* private browsing */ }

/* The flag and its legend, for the distance panel: shown whatever the mode,
   so both flags can be seen side by side there. */
function flagFigure(p) {
  const f = politiskelFlag(coords(p), p);
  if (!f) return null;
  const img = document.createElement("img");
  img.className = "flag lg";
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
  box.append(cap, img, ul, credit);
  return box;
}
