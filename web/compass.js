/* The compass: the model wrappers (coordinates, readings of the compass,
   the questionnaire's axes replacing PolitiScales's), the axis labels, and
   the rendering of the chart, the profiles table, the strips and the
   distance panel.
   The page has one script: the web/*.js files are concatenated in the order
   web/shell.html includes them, and share its top-level scope. */

/* ---------------------------------------------------------------- model --- */

/* The axes and their weights live in tools/politi-model.js, inlined above:
   the same table has to be readable from Node, or the measurements that set
   those weights cannot be re-run by anyone else. */
const AXES = PolitiModel.AXES;

/* Axis wording comes from the locale, so AXES itself stays language-neutral. */
AXES.forEach(a => { a.neg[1] = L.axis[a.neg[0]]; a.pos[1] = L.axis[a.pos[0]]; });

/* The reference tables, likewise, live in the shared model. */
const COUNTRIES = PolitiModel.COUNTRIES;

/* The active country. Everything downstream keeps reading REFERENCES, which is
   rebound rather than rebuilt, so the rendering code never learns that
   countries exist. */
let country = COUNTRIES[0];
let REFERENCES = country.parties;

/* Provenance is shown, not hidden: a hand estimate and a surveyed position
   should not look alike in a tooltip. */
const noteOf = r => r.note + (r.src === "ches" ? " — CHES 2024" : " — estimation");

/* Starting profiles: the ones extracted from politi-results/ by
   tools/extract.js. They carry all 8 PolitiScales axes, where the original
   hand-typed data only covered 6. If profiles-data.js is missing the page
   starts empty rather than on copied values that would drift from the
   source. */
function fromCapture(p) {
  return Object.assign({ alias: p.alias, flag: p.flag || null,
                         slogan: p.slogan || null, source: p.source || null },
                       p.values);
}
const SEED = (window.POLITI_PROFILES || []).map(fromCapture);


/* v4: the browser no longer stores the full profile list, only what the user
   did on top of it — which profiles they hid and which they typed in. The
   profiles extracted from politi-results/ stay the source of truth and are
   re-read on every load.

   Before, a single deletion froze the list in localStorage: a newly extracted
   screenshot would never appear again, shadowed by the stale local copy. */
const STORE_KEY = "politicompass.overlay.v4";

/* Stable id for an extracted profile: its source file. Hand-typed profiles
   have none, so we fall back to the alias. */
const idOf = p => p.source || ("alias:" + p.alias);

/* Answers exported by the group's members and dropped in
   politi-results/answers/: the build folds them in as POLITI_ANSWERS. A file
   naming a screenshot completes that profile; one that names none is a
   profile started on the site, and joins the list as such. Answers given in
   this browser afterwards take precedence (see answersOf). */
const SEED_ANSWERS = {};
for (const a of window.POLITI_ANSWERS || []) {
  const match = a.source && SEED.find(p => p.source === a.source);
  if (match) { SEED_ANSWERS[idOf(match)] = a.answers; continue; }
  /* tools/extract.js already matched aliases to screenshots and kept one
     file per profile, so this only guards a hand-edited data file */
  if (SEED.some(p => p.alias.toLowerCase() === a.alias.toLowerCase())) continue;
  const p = { alias: a.alias, native: true, source: null };
  SEED.push(p);
  SEED_ANSWERS[idOf(p)] = a.answers;
}

function loadOverlay() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { hidden: [], added: [], answers: {} };
    const o = JSON.parse(raw);
    return {
      hidden: Array.isArray(o && o.hidden) ? o.hidden.filter(x => typeof x === "string") : [],
      added: Array.isArray(o && o.added)
        ? o.added.filter(x => x && typeof x.alias === "string") : [],
      /* Questionnaire answers, keyed by profile id. They live here and nowhere
         else: the repository never holds anything derived from a person. */
      answers: o && o.answers && typeof o.answers === "object" && !Array.isArray(o.answers)
        ? o.answers : {}
    };
  } catch (_) {
    return { hidden: [], added: [], answers: {} };
  }
}
function saveOverlay() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(overlay)); } catch (_) { /* quota exceeded, or private browsing */ }
}

let overlay = loadOverlay();

/* Server mode. Served by server/ (the optional Rust backend), the page finds
   /api/me and turns on accounts: the profiles shown are the chosen group's,
   and the signed-in member's answers are saved to the server rather than to
   this browser. Opened as a local file it never asks, and nothing changes. */
const SERVER = { on: false, me: null, group: null, saving: null, pending: null, inflight: null,
                 status: "", invite: null };

function rebuild() {
  const hidden = new Set(overlay.hidden);
  /* A profile added in this browser and one imported with the page can share
     an id: the organiser's own questionnaire-only profile, exported, dropped
     in politi-results/answers/ and rebuilt. They are the same person, so it
     is listed once, as imported; its local answers still take precedence. */
  const seeded = new Set(SEED.map(idOf));
  /* In server mode the list is the group's, and profiles added in this
     browser are not part of it. Nor is hiding: a hidden row would still be
     on the server and visible to the whole group while its owner thought it
     gone — there, a profile leaves a group by leaving the group. */
  profiles = SEED.filter(p => SERVER.on || !hidden.has(idOf(p))).map(p => ({ ...p }))
    .concat(SERVER.on ? [] : overlay.added.filter(p => !seeded.has(idOf(p))).map(p => ({ ...p })));
}

let profiles = [];
rebuild();

/* The model returns keys, not sentences, so the wrappers below are the whole
   of the presentation layer: they look the wording up and change nothing else. */
/* A profile started on this site has no PolitiScales result at all: nothing
   to project, so its coordinates start empty rather than at a centre it never
   answered. Whatever it gets comes from the questionnaire. */
const hasPolitiscales = p => AXES.some(a => Number.isFinite(p[a.neg[0]])
                                         || Number.isFinite(p[a.pos[0]]));

function coords(p) {
  if (!hasPolitiscales(p)) {
    return withQuiz(p, { x: null, y: null, ecol: null, sov: null, method: null, native: true });
  }
  const c = PolitiModel.coords(p);
  if (c.method) c.method = L.method[c.method];
  return withQuiz(p, c);
}

/* A questionnaire axis replaces the PolitiScales one WHOLESALE, never averaged
   with it: each coordinate keeps a single source, and the page says which.
   `from` keeps where PolitiScales had put the profile, so the journey from
   one instrument to the other can be drawn. */
function withQuiz(p, c) {
  const id = idOf(p);
  const answers = localAnswers(id) || SEED_ANSWERS[id];
  /* an erased profile keeps an empty entry (see the erase button): no answers */
  if (!answers || !Object.keys(answers).length) return c;
  c.quiz = PolitiQuiz.score(answers, "economy");
  c.soc = PolitiQuiz.score(answers, "society");
  const ps = { x: c.x, y: c.y };
  if (c.quiz.x !== null) { c.x = c.quiz.x; c.xSrc = "quiz"; }
  if (c.soc.y !== null) { c.y = c.soc.y; c.ySrc = "quiz"; }
  if (!c.native && (c.xSrc || c.ySrc)) {
    c.from = ps;
    c.psX = ps.x;
    c.psY = ps.y;
  }
  return c;
}

/* Readings of the compass. The same profiles and the same parties, seen along
   two other dimensions: each reading picks what goes on each axis, for the
   profiles and for the parties alike, so a profile is only ever compared with
   parties measured on the same thing. A reading with no party counterpart
   does not belong here — the class readings stay in their own panel.

     politiskel     x from the questionnaire where answered, y from PolitiScales
     politiscales   the original reading, PolitiScales alone, kept for reference
     protectionism  x against CHES `protectionism`, which the two usual axes
                    blur: LFI and the RN sit apart on y, together on this one
     populist       listed, not available: it needs the institutions theme,
                    and it is named for the theory it adopts

   A profile with no value on a reading's axis is left off the chart and
   keeps its row in the table, marked. */
const VIEWS = [
  { key: "politiskel" },
  { key: "politiscales" },
  { key: "protectionism" },
  { key: "populist", planned: true }
];
const VIEW_KEY = "politicompass.view.v1";
let view = VIEWS[0];

/* Copy for the current reading, falling back on the default wording. */
const V = () => Object.assign({}, L, L.views[view.key] || {});

function project(p) {
  const c = coords(p);
  const v = view.key === "politiskel" ? c : Object.assign({}, c, { base: c, from: null });
  if (view.key === "politiscales") {
    v.x = c.native ? null : c.psX !== undefined ? c.psX : c.x;
    v.y = c.native ? null : c.psY !== undefined ? c.psY : c.y;
    v.xSrc = v.ySrc = null;
  } else if (view.key === "protectionism") {
    const y = c.quiz ? c.quiz.protectionism : null;
    v.y = y === undefined ? null : y;
    v.ySrc = null;   /* y is protectionism here: "Y from the questionnaire" would name the social axis */
  }
  /* no value on one axis, no place on the chart */
  if (v.x === null || v.y === null) v.off = true;
  return v;
}

function viewReferences() {
  if (view.key !== "protectionism") return country.parties;
  return country.parties.filter(r => r.prot !== undefined).map(r => ({ ...r, y: r.prot }));
}

/* The journey and the result screen always speak of the default reading. */
function nearestBase(x, y) {
  const refs = country.parties;
  return PolitiModel.nearestReference(x, y, refs, PolitiModel.limitsFor(refs));
}

/* Nearest neighbour, replacing a cascade of thresholds that left gaps (the
   whole right-libertarian quadrant, and x = 0) and had unreachable branches
   (the RN was always caught by "x > 0 && y < 0" before being tested).

   Named for what it returns: the closest reference point and how far away it
   is. It was `nearestFamily`, which promised a political family the two
   coordinates cannot establish. */
function nearestReference(x, y) {
  const n = PolitiModel.nearestReference(x, y, REFERENCES, LIMITS);
  if (!n) return null;
  n.fit = L.fit[n.fit];
  n.note = noteOf(n.ref);
  return n;
}

/* { kind: "profile" | "party", i } — whatever is currently being compared. */
let selection = null;

/* Thresholds are derived from the references by the model, and recomputed on
   every country change: a board whose parties crowd together earns tighter
   ones than a board spread over the whole square. */
let LIMITS = { near: 0, far: 0, tie: 0 };
const fitOf = d => L.fit[PolitiModel.fitOf(d, LIMITS)];
const fitPhrase = d => (d <= LIMITS.far ? L.proximity + fitOf(d) : L.noCloseParty);

/* The chosen country is a preference, not data: it is kept apart from the
   profile overlay so that clearing one never clears the other. */
const COUNTRY_KEY = "politicompass.country.v1";

function setCountry(code) {
  const found = COUNTRIES.find(c => c.code === code);
  if (found) country = found;
  REFERENCES = viewReferences();
  LIMITS = PolitiModel.limitsFor(REFERENCES);
  /* `selection` holds an index into the previous table, which now points at
     another party or at nothing at all. */
  if (selection && selection.kind === "party") selection = null;
}


/* Every piece of copy that names the country or counts its references. */
function applyCountry() {
  $("legend-parties").textContent = L.legendParties(country.name);
  $("detail-hint").textContent = L.detailHint(REFERENCES.length);

  /* The whole table, whatever the reading keeps: a reading that drops every
     party (Italy on protectionism) must not make them read as estimates. */
  const all = country.parties;
  const ches = all.filter(r => r.src === "ches");
  const est = all.filter(r => r.src !== "ches");
  $("method-refs").textContent =
      !ches.length ? L.methodRefsEstimated(country.name, all.length, country.why || "")
    : !est.length  ? L.methodRefsAll(country.name, ches.length)
    : L.methodRefsMixed(country.name, ches.length, est.length,
                        est.map(r => r.name).join(", "));

  const gap = PolitiModel.widestEconGap(REFERENCES);
  $("method-gap").textContent = gap ? L.methodGap(gap.lo.name, gap.hi.name, gap.d) : "";
  $("method-tie").textContent = L.methodTie(LIMITS.tie);
  applyView();
}

/* Distances to every reference, nearest first, with the wording added. */
function rankParties(c) {
  return PolitiModel.rankParties(c, REFERENCES)
    .map(r => Object.assign(r, { note: noteOf(r.ref) }));
}

/* The mirror image: which profiles come closest to a given party. */
function rankProfiles(r, computed) {
  return computed
    .map(({ p, c }, i) => ({ name: p.alias, note: null, i, off: c.off,
                             d: Math.round(Math.hypot(c.x - r.x, c.y - r.y)),
                             dx: c.x - r.x, dy: c.y - r.y }))
    .filter(o => !o.off)
    .sort((a, b) => a.d - b.d);
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const toSvgX = x => clamp(300 + x * 2.5, 58, 542);
const toSvgY = y => clamp(300 - y * 2.5, 58, 542);
const signed  = n => (n > 0 ? "+" : "") + n;

/* Flag thumbnail, or a plain series dot when the profile has none (typed in
   by hand). */
function flagEl(p, cls, captureOnly) {
  /* Politiskel's flag when chosen, or when PolitiScales drew none — drawn here
     from numbers, never from the profile's own strings. A screenshot being
     read (captureOnly) shows what it holds and nothing else. */
  const ps = p.flag && /^data:image\/(png|jpeg|webp);base64,/.test(p.flag);
  if (!captureOnly && (flagMode === "politiskel" || !ps)) {
    const f = politiskelFlag(coords(p), p);
    if (f) {
      const img = document.createElement("img");
      img.className = "flag " + (cls || "");
      img.src = f.url;
      img.alt = L.flagGeneratedAlt(p.alias);
      img.title = f.legend.join("\n");
      return img;
    }
  }
  /* The flag comes from profiles-data.js or from a local canvas; we still only
     accept an image data URI, so a profile tampered with in localStorage
     cannot slip another URL into a src. */
  if (ps) {
    const img = document.createElement("img");
    img.className = "flag " + (cls || "");
    img.src = p.flag;
    img.alt = L.flagAlt(p.alias);
    return img;
  }
  const sw = document.createElement("span");
  sw.className = "swatch";
  return sw;
}

/* Key concepts: the three most pronounced axes, named by their dominant
   pole. Computed from the scores, so available for hand-typed profiles too —
   unlike the motto, which is read off the screenshot. */
function conceptsEl(p) {
  const ul = document.createElement("ul");
  ul.className = "concepts";
  const list = window.PolitiExtract ? PolitiExtract.keyConcepts(p, 3) : [];
  if (!list.length) {
    const li = document.createElement("li");
    li.textContent = L.balancedProfile;
    ul.appendChild(li);
    return ul;
  }
  for (const c of list) {
    const li = document.createElement("li");
    const b = document.createElement("b"); b.textContent = L.pole[c.key];
    const i = document.createElement("i");
    i.textContent = " " + c.intensity + " · " + L.band[c.band];
    li.append(b, i);
    ul.appendChild(li);
  }
  return ul;
}

/* ------------------------------------------------------------- labels --- */

const overlaps = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

const CANDIDATES = [
  { dx:  11, dy:   3.5, anchor: "start"  },
  { dx: -11, dy:   3.5, anchor: "end"    },
  { dx:   0, dy: -12,   anchor: "middle" },
  { dx:   0, dy:  17,   anchor: "middle" },
  { dx:  11, dy: -8,    anchor: "start"  },
  { dx: -11, dy: -8,    anchor: "end"    },
  { dx:  11, dy:  15,   anchor: "start"  },
  { dx: -11, dy:  15,   anchor: "end"    },
  /* wider ring: in dense areas (bottom-left), all eight tight positions are
     taken and the label has to move further out */
  { dx:   0, dy: -23,   anchor: "middle" },
  { dx:   0, dy:  28,   anchor: "middle" },
  { dx:  22, dy: -18,   anchor: "start"  },
  { dx: -22, dy: -18,   anchor: "end"    },
  { dx:  22, dy:  24,   anchor: "start"  },
  { dx: -22, dy:  24,   anchor: "end"    },
  { dx:  18, dy: -30,   anchor: "start"  },
  { dx: -18, dy: -30,   anchor: "end"    }
];

/* Places each label at the first free spot around its point. `taken`
   accumulates the boxes already occupied (markers first, then labels). */
function placeLabel(item, taken) {
  const w = item.w + 3;          /* actually measured width, plus a little air */
  const h = item.size;
  for (const c of CANDIDATES) {
    let x0 = item.x + c.dx;
    if (c.anchor === "end") x0 -= w;
    else if (c.anchor === "middle") x0 -= w / 2;
    const box = { x0, x1: x0 + w, y0: item.y + c.dy - h * 0.8, y1: item.y + c.dy + h * 0.3 };
    if (box.x0 < 52 || box.x1 > 548 || box.y0 < 52 || box.y1 > 548) continue;
    if (taken.some(t => overlaps(t, box))) continue;
    taken.push(box);
    return c;
  }
  return null;            /* no free spot: the caller decides what to do */
}

/* ------------------------------------------------------------------ rendu --- */

/* Real text width, measured by the engine. Estimating it from the character
   count was off by 33% on short capitalised strings ("MoDem"), and the error
   varied between engines: Firefox then overlapped two labels that Chrome kept
   apart. `visibility:hidden` keeps the element in layout, hence measurable —
   `display:none` would return 0. */
function measureWidths(strings, cls) {
  if (!strings.length) return [];
  const holder = el("g", { visibility: "hidden" });
  $("compass").appendChild(holder);
  const nodes = strings.map(str => {
    const t = el("text", { class: cls });
    t.textContent = str;
    holder.appendChild(t);
    return t;
  });
  const widths = nodes.map(t => {
    try { return t.getComputedTextLength(); }
    catch (_) { return t.textContent.length * 6; }
  });
  holder.remove();
  return widths;
}

const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};
const $ = id => document.getElementById(id);

function renderChrome() {
  const grid = $("grid-layer");
  const chrome = $("chrome-layer");
  grid.replaceChildren();
  chrome.replaceChildren();

  for (let v = -100; v <= 100; v += 25) {
    if (v === 0) continue;
    grid.appendChild(el("line", { class: "grid-line", x1: toSvgX(v), y1: 50, x2: toSvgX(v), y2: 550 }));
    grid.appendChild(el("line", { class: "grid-line", x1: 50, y1: toSvgY(v), x2: 550, y2: toSvgY(v) }));
  }

  const W = V();
  const caps = [
    { t: W.axisTop,    x: 300, y: 38,  anchor: "middle", cls: "axis-cap" },
    { t: W.axisBottom, x: 300, y: 574, anchor: "middle", cls: "axis-cap" },
    { t: W.quadTopLeft,     x:  60, y:  68, anchor: "start", cls: "quad-cap" },
    { t: W.quadTopRight,    x: 540, y:  68, anchor: "end",   cls: "quad-cap" },
    { t: W.quadBottomLeft,  x:  60, y: 538, anchor: "start", cls: "quad-cap" },
    { t: W.quadBottomRight, x: 540, y: 538, anchor: "end",   cls: "quad-cap" },
    { t: "−100", x: 52,  y: 315, anchor: "start",  cls: "tick-cap" },
    { t: "−50",  x: 175, y: 315, anchor: "middle", cls: "tick-cap" },
    { t: "+50",  x: 425, y: 315, anchor: "middle", cls: "tick-cap" },
    { t: "+100", x: 548, y: 315, anchor: "end",    cls: "tick-cap" }
  ];
  for (const c of caps) {
    const t = el("text", { class: c.cls, x: c.x, y: c.y, "text-anchor": c.anchor });
    t.textContent = c.t;
    chrome.appendChild(t);
  }

  const side = [
    { t: W.axisLeft,  x: 22,  y: 300, rot: -90 },
    { t: W.axisRight, x: 578, y: 300, rot: 90 }
  ];
  for (const s of side) {
    const t = el("text", { class: "axis-cap", x: s.x, y: s.y, "text-anchor": "middle",
                           transform: "rotate(" + s.rot + " " + s.x + " " + s.y + ")" });
    t.textContent = s.t;
    chrome.appendChild(t);
  }

  /* Axis arrowheads are drawn, not written. The side labels are rotated by
     ±90°, which rotates a glyph's meaning too: "◄" ended up pointing down, and
     so did "►". A shape drawn at each axis end cannot point the wrong way. */
  const heads = [
    "M 52 300 L 62 295 L 62 305 Z",      /* gauche */
    "M 548 300 L 538 295 L 538 305 Z",   /* droite */
    "M 300 52 L 295 62 L 305 62 Z",      /* haut : autoritaire */
    "M 300 548 L 295 538 L 305 538 Z"    /* bas : libertaire */
  ];
  for (const d of heads) chrome.appendChild(el("path", { class: "axis-head", d }));
}

function render() {
  const refsLayer = $("refs-layer");
  const ptsLayer  = $("points-layer");
  const annot     = $("annot-layer");
  const tbody     = document.querySelector("#profiles-table tbody");
  refsLayer.replaceChildren();
  ptsLayer.replaceChildren();
  annot.replaceChildren();
  tbody.replaceChildren();

  /* a deletion may have invalidated the current selection */
  if (selection && selection.kind === "profile" && selection.i >= profiles.length) selection = null;
  if (selection && selection.kind === "party" && !$("t-refs").checked) selection = null;

  const showRefs      = $("t-refs").checked;
  const showRefLabels = $("t-reflabels").checked;
  const showLabels    = $("t-labels").checked;

  const computed = profiles.map(p => ({ p, c: project(p) }));
  const placed = computed.filter(r => !r.c.off);

  /* Background text (ticks, quadrant corners) occupies space just like a
     marker: without this a label would be laid on top of it. */
  const taken = [
    { x0:  46, x1:  90, y0: 306, y1: 318 }, { x0: 160, x1: 190, y0: 306, y1: 318 },
    { x0: 410, x1: 440, y0: 306, y1: 318 }, { x0: 510, x1: 554, y0: 306, y1: 318 },
    { x0:  56, x1: 150, y0:  58, y1:  72 }, { x0: 452, x1: 544, y0:  58, y1:  72 },
    { x0:  56, x1: 156, y0: 528, y1: 542 }, { x0: 446, x1: 544, y0: 528, y1: 542 },
    /* the four axis arrowheads */
    { x0:  50, x1:  64, y0: 293, y1: 307 }, { x0: 536, x1: 550, y0: 293, y1: 307 },
    { x0: 293, x1: 307, y0:  50, y1:  64 }, { x0: 293, x1: 307, y0: 536, y1: 550 }
  ];

  /* The group mean is drawn later but reserves its space here, otherwise a
     party label lands on top of it. */
  if ($("t-centroid").checked && placed.length >= 2) {
    const cx = toSvgX(placed.reduce((a, r) => a + r.c.x, 0) / placed.length);
    const cy = toSvgY(placed.reduce((a, r) => a + r.c.y, 0) / placed.length);
    taken.push({ x0: cx - 13, x1: cx + 125, y0: cy - 13, y1: cy + 13 });
  }

  /* Every marker claims space first, profiles before parties: party labels
     give way to profile labels, not the other way round. */
  for (const { c } of placed) {
    const x = toSvgX(c.x), y = toSvgY(c.y);
    taken.push({ x0: x - 10, x1: x + 10, y0: y - 10, y1: y + 10 });
  }
  if (showRefs) {
    for (const r of REFERENCES) {
      const x = toSvgX(r.x), y = toSvgY(r.y);
      taken.push({ x0: x - 7, x1: x + 7, y0: y - 7, y1: y + 7 });
    }
  }

  const ptTexts = computed.map(({ p }) => p.alias.slice(0, 16));
  const ptW = showLabels ? measureWidths(ptTexts, "pt-label") : [];
  const ptPlacements = computed.map(({ c }, i) => {
    const x = toSvgX(c.x), y = toSvgY(c.y);
    if (!showLabels || c.off) return null;
    /* A profile always keeps its label: it is the subject of the chart. */
    return placeLabel({ x, y, text: ptTexts[i], w: ptW[i], size: 10.5 }, taken)
        || CANDIDATES[0];
  });

  const refW = (showRefs && showRefLabels)
    ? measureWidths(REFERENCES.map(r => r.name), "ref-label") : [];
  if (showRefs) {
    REFERENCES.forEach((r, ri) => {
      const x = toSvgX(r.x), y = toSvgY(r.y);
      const g = el("g", {});
      g.dataset.party = String(ri);
      if (selection && selection.kind === "party" && selection.i === ri) g.classList.add("sel");
      const hit = el("circle", { class: "ref-hit", cx: x, cy: y, r: 13, tabindex: "0",
                                 role: "button", "aria-label": L.partyAria(r.name) });
      g.appendChild(hit);
      g.appendChild(el("path", {
        class: "ref-mark",
        d: "M " + x + " " + (y - 5.5) + " L " + (x + 5.5) + " " + y +
           " L " + x + " " + (y + 5.5) + " L " + (x - 5.5) + " " + y + " Z"
      }));
      const title = el("title", {});
      title.textContent = r.name + " — " + noteOf(r);
      g.appendChild(title);

      if (showRefLabels) {
        /* If a reference finds no free spot we drop its label rather than lay it
           over a profile's: the name stays available by hovering the diamond. */
        const c = placeLabel({ x, y, text: r.name, w: refW[ri], size: 9.5 }, taken);
        if (c) {
          const t = el("text", { class: "ref-label", x: x + c.dx, y: y + c.dy, "text-anchor": c.anchor });
          t.textContent = r.name;
          g.appendChild(t);
        }
      }
      const pick = () => select("party", ri);
      g.addEventListener("click", e => { e.stopPropagation(); pick(); });
      hit.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); }
      });
      refsLayer.appendChild(g);
    });
  }

  computed.forEach(({ p, c }, i) => {
    const x = toSvgX(c.x), y = toSvgY(c.y);
    const g = el("g", {});
    g.dataset.idx = String(i);
    if (selection && selection.kind === "profile" && selection.i === i) g.classList.add("sel");

    const hit = el("circle", { class: "hit", cx: x, cy: y, r: 14, tabindex: "0",
                               role: "button", "aria-label": p.alias });
    g.appendChild(hit);
    if (c.from && $("t-trail").checked && (c.from.x !== c.x || c.from.y !== c.y)) {
      const fx = toSvgX(c.from.x), fy = toSvgY(c.from.y);
      g.appendChild(el("line", { class: "trail", x1: fx, y1: fy, x2: x, y2: y }));
      g.appendChild(el("circle", { class: "trail-ghost", cx: fx, cy: fy, r: 4 }));
    }
    const pick = () => select("profile", i);
    g.addEventListener("click", e => { e.stopPropagation(); pick(); });
    hit.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); }
    });
    g.appendChild(el("circle", { class: "pt-ring", cx: x, cy: y, r: 7 }));
    g.appendChild(el("circle", { class: "pt-dot",  cx: x, cy: y, r: 7 }));

    const place = ptPlacements[i];
    if (place) {
      const t = el("text", { class: "pt-label", x: x + place.dx, y: y + place.dy,
                             "text-anchor": place.anchor });
      t.textContent = p.alias.slice(0, 16);
      g.appendChild(t);
    }
    if (!c.off) ptsLayer.appendChild(g);

    /* textContent throughout: the alias is free input, never HTML. */
    const nearest = c.off ? null : nearestReference(c.x, c.y);
    const tr = document.createElement("tr");
    tr.dataset.idx = String(i);
    if (selection && selection.kind === "profile" && selection.i === i) tr.classList.add("sel");
    tr.addEventListener("click", e => {
      if (!e.target.closest("button")) select("profile", i);
    });

    const tdAlias = document.createElement("td");
    tdAlias.className = "who-cell";
    const line1 = document.createElement("div");
    line1.append(flagEl(p, ""), document.createTextNode(p.alias));
    tdAlias.appendChild(line1);
    if (p.slogan) {
      const dv = document.createElement("div");
      dv.className = "devise";
      dv.textContent = p.slogan.join(" · ");
      tdAlias.appendChild(dv);
    }
    tr.appendChild(tdAlias);

    /* project() nulls what a reading cannot place, so null is the only "—" */
    [c.x, c.y, c.ecol].forEach((v, k) => {
      const td = document.createElement("td");
      td.className = "num";
      td.textContent = v === null ? "—" : signed(v);
      if (k === 0 && c.xSrc === "quiz") {
        td.classList.add("quiz");
        td.title = c.native ? L.fromQuizNative : L.fromQuiz(signed(c.psX));
      }
      if (k === 1 && c.ySrc === "quiz" && c.y !== null) {
        td.classList.add("quiz");
        td.title = c.native ? L.fromQuizNativeY : L.fromQuizY(signed(c.psY));
      }
      tr.appendChild(td);
    });

    const tdFam = document.createElement("td");
    tdFam.className = "fam";
    if (!nearest) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = !c.off ? L.viewNoRefs
        : c.native && !c.quiz ? L.nativeEmpty
        : c.native && view.key === "politiskel" && c.x !== null ? L.nativeNoY
        : c.native && view.key === "politiskel" && c.y !== null ? L.nativeNoX
        : c.native && view.key === "politiskel" ? L.nativeNoXY
        : L.viewOff;
      tdFam.appendChild(tag);
    } else {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = " · " + fitPhrase(nearest.d) + " (" + nearest.d + ")";
    if (nearest.d > LIMITS.far) tag.classList.add("far-note");
    tdFam.append(document.createTextNode(nearest.name), tag);
    }

    /* A near-tie is shown rather than hidden behind the winner: the runner-up
       was already computed, and which of the two comes first is not robust. */
    if (nearest && nearest.margin <= LIMITS.tie) {
      const tie = document.createElement("span");
      tie.className = "tie";
      tie.textContent = L.tieWith(nearest.second.name, nearest.margin);
      tie.title = L.tieTitle(nearest.margin);
      tdFam.appendChild(tie);
    }
    tr.appendChild(tdFam);

    const tdDel = document.createElement("td");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "del";
    btn.textContent = "×";
    btn.title = L.deleteProfile(p.alias);
    btn.setAttribute("aria-label", L.deleteProfile(p.alias));
    btn.addEventListener("click", e => {
      e.stopPropagation();
      if (selection && selection.kind === "profile") {
        if (selection.i === i) selection = null;
        else if (selection.i > i) selection.i -= 1;
      }
      /* Decide by where the profile actually lives, not by whether it has a
         source file. A screenshot imported through the page has a source AND
         sits in overlay.added: keying on the source alone marked it hidden,
         which does nothing to a profile absent from SEED, so it could never
         be deleted. */
      const id = idOf(p);
      if (overlay.added.some(q => idOf(q) === id)) {
        overlay.added = overlay.added.filter(q => idOf(q) !== id);
        delete overlay.answers[id];   /* gone for good, so are its answers */
      } else if (!overlay.hidden.includes(id)) {
        overlay.hidden.push(id);   /* extracted: hide it, the file stays the reference */
      }
      saveOverlay();
      rebuild();
      render();
    });
    tdDel.appendChild(btn);
    tr.appendChild(tdDel);

    tbody.appendChild(tr);
  });

  if (!computed.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.className = "empty";
    td.textContent = window.POLITI_PROFILES ? L.emptyDrop : L.emptyNoData;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  applyView();   /* its note counts the profiles left off, which answers change */
  renderStrips(computed);
  renderCentroid(placed, annot);
  renderAnnotations(computed, annot);
  renderDetail(computed);
  ptsLayer.classList.toggle("dim", !!selection);
  refsLayer.classList.toggle("dim", !!selection);

  wireHover(computed);
}

function select(kind, i) {
  $("tip").hidden = true;
  selection = (selection && selection.kind === kind && selection.i === i)
    ? null                       /* clicking the same target again clears the selection */
    : { kind, i };
  render();
}

/* One strip per PolitiScales axis, every profile laid on it, sorted by
   decreasing spread. The compass projects eight dimensions onto two; here
   nothing is projected. It earns its place mostly because this kind of group
   is highly collinear: the map shows it as a line, these strips show on WHICH
   axes it actually splits and on which everyone agrees. */
function renderStrips(computed) {
  const host = $("axes-strips");
  if (!host) return;
  host.replaceChildren();

  /* For each profile and each axis: the position (lean) AND the neutral share.
     The latter is not noise — it is the fraction of answers left undecided,
     hence the margin the position could slide within if that indecision tipped
     one way. We draw it as a band around the point: the only view in the page
     where this information survives. */
  const rows = AXES.map(a => {
    const vals = computed.map(({ p }) => {
      const lo = p[a.neg[0]], hi = p[a.pos[0]];
      if (!Number.isFinite(lo) && !Number.isFinite(hi)) return null;
      const L = Number(lo) || 0, R = Number(hi) || 0;
      return { lean: R - L, neutral: Math.max(0, 100 - L - R), L, R };
    });
    const ok = vals.filter(v => v !== null).map(v => v.lean);
    const m = ok.length ? ok.reduce((s, v) => s + v, 0) / ok.length : 0;
    const sd = ok.length ? Math.sqrt(ok.reduce((s, v) => s + (v - m) ** 2, 0) / ok.length) : 0;
    return { a, vals, sd };
  }).sort((u, v) => v.sd - u.sd);

  const pct = v => ((v + 100) / 200) * 100;

  for (const r of rows) {
    const row = document.createElement("div");
    row.className = "strip";

    const l = document.createElement("span");
    l.className = "pole";
    l.textContent = r.a.neg[1];
    const rt = document.createElement("span");
    rt.className = "pole r";
    rt.textContent = r.a.pos[1];

    const track = document.createElement("div");
    track.className = "track";
    const zero = document.createElement("div");
    zero.className = "zero";
    track.appendChild(zero);

    if ($("t-centroid") && $("t-centroid").checked) {
      const ok2 = r.vals.filter(v => v !== null);
      if (ok2.length) {
        const mean = ok2.reduce((s, v) => s + v.lean, 0) / ok2.length;
        const mk = document.createElement("div");
        mk.className = "mean";
        mk.style.left = pct(mean) + "%";
        mk.title = L.groupMean(signed(Math.round(mean)));
        track.appendChild(mk);
      }
    }

    r.vals.forEach((v, i) => {
      if (v === null) return;
      if (v.neutral > 0) {
        const band = document.createElement("div");
        band.className = "band";
        band.dataset.idx = String(i);
        const a = clamp(v.lean - v.neutral, -100, 100);
        const b = clamp(v.lean + v.neutral, -100, 100);
        band.style.left = pct(a) + "%";
        band.style.width = (pct(b) - pct(a)) + "%";
        track.appendChild(band);
      }
      const dot = document.createElement("div");
      dot.className = "pt";
      dot.style.left = pct(v.lean) + "%";
      dot.dataset.idx = String(i);
      dot.dataset.lean = String(v.lean);
      dot.addEventListener("click", e => { e.stopPropagation(); select("profile", i); });
      dot.addEventListener("pointerenter", e => openStripTip(dot, r, computed, e));
      dot.setAttribute("aria-label", computed[i].p.alias + " : " + signed(v.lean));
      dot.addEventListener("pointerleave", scheduleHideStripTip);
      track.appendChild(dot);
    });

    const sd = document.createElement("span");
    sd.className = "sd";
    sd.textContent = Math.round(r.sd);

    row.append(l, track, rt, sd);
    host.appendChild(row);
  }

  /* Grouping of overlapping points, rather than stacking them. Two profiles
     can land on exactly the same lean: the last one drawn hid the other, which
     became unreachable. On a set of ten profiles a few exact collisions and a
     handful of near ones are routine. Rather than offsetting vertically —
     legible but ugly — we keep the alignment and let hovering open the whole
     group as a clickable list. The threshold comes from the track's real
     measured width, not from a guess. */
  host.querySelectorAll(".track").forEach(track => {
    const w = track.offsetWidth || 700;
    const minGap = 13 * 200 / w;          /* 11 px de point + 2 px de marge */
    const items = [...track.querySelectorAll(".pt")]
      .map(d => ({ d, lean: Number(d.dataset.lean) }))
      .sort((a, b) => a.lean - b.lean);
    let cid = 0, prev = null;
    for (const e of items) {
      if (prev === null || e.lean - prev >= minGap) cid++;
      e.d.dataset.cluster = String(cid);
      prev = e.lean;
    }
    /* The extra ring only flags an EXACT overlap — two profiles on the same
       lean, hence strictly invisible one under the other. Merely neighbouring
       points stay distinct to the eye and need no marking; they still share
       the tooltip, which keeps every one of them reachable. */
    const exact = {};
    items.forEach(e => { exact[e.lean] = (exact[e.lean] || 0) + 1; });
    items.forEach(e => { if (exact[e.lean] > 1) e.d.classList.add("multi"); });
  });

  host.classList.toggle("dim", !!(selection && selection.kind === "profile"));
  if (selection && selection.kind === "profile")
    host.querySelectorAll('[data-idx="' + selection.i + '"]').forEach(n => n.classList.add("on"));

  const hint = $("strips-hint");
  if (hint) hint.textContent = L.stripsHint;
}

/* Hovering a point opens the WHOLE group sitting at that position, one
   clickable row per profile. Two exactly superposed points therefore both stay
   reachable, without shifting anything on screen. */
let stripTipTimer = null;

function openStripTip(dot, row, computed, ev) {
  const tip = $("strip-tip"), card = $("strips-card"), host = $("axes-strips");
  if (!tip || !card) return;
  clearTimeout(stripTipTimer);

  const track = dot.parentElement;
  const members = [...track.querySelectorAll('.pt[data-cluster="' + dot.dataset.cluster + '"]')]
    .map(d => ({ i: Number(d.dataset.idx), v: row.vals[Number(d.dataset.idx)] }))
    .sort((a, b) => b.v.lean - a.v.lean);

  tip.replaceChildren();
  const ax = document.createElement("div");
  ax.className = "ax";
  ax.textContent = row.a.neg[1] + " ↔ " + row.a.pos[1];
  tip.appendChild(ax);

  if (members.length > 1) {
    const more = document.createElement("p");
    more.className = "more";
    more.textContent = L.groupHere(members.length);
    tip.appendChild(more);
  }

  for (const m of members) {
    const p = computed[m.i].p, v = m.v;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "row";

    const top = document.createElement("div");
    top.className = "top";
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = p.alias;
    const val = document.createElement("span");
    val.className = "val";
    val.textContent = signed(v.lean);
    top.append(who, val);

    const seg = document.createElement("div");
    seg.className = "seg";
    [["l", v.L], ["n", v.neutral], ["r", v.R]].forEach(([cls, q]) => {
      if (q <= 0) return;
      const i = document.createElement("i");
      i.className = cls;
      i.style.width = q + "%";
      seg.appendChild(i);
    });

    const det = document.createElement("div");
    det.className = "det";
    det.textContent = L.stripDetail(row.a.neg[1], v.L, v.neutral, row.a.pos[1], v.R)
      + (v.neutral ? L.stripUncertainty(signed(-v.neutral), signed(v.neutral)) : "");

    btn.append(top, seg, det);
    btn.addEventListener("click", e => { e.stopPropagation(); hideStripTip(); select("profile", m.i); });
    btn.addEventListener("pointerenter", () => {
      host.querySelectorAll(".band.hi").forEach(n => n.classList.remove("hi"));
      host.querySelectorAll('.band[data-idx="' + m.i + '"]').forEach(n => n.classList.add("hi"));
      host.classList.add("hov");
    });
    tip.appendChild(btn);
  }

  /* hovering the first of the group already brings its band forward */
  host.querySelectorAll(".band.hi").forEach(n => n.classList.remove("hi"));
  host.querySelectorAll('.band[data-idx="' + members[0].i + '"]').forEach(n => n.classList.add("hi"));
  host.classList.add("hov");

  tip.hidden = false;
  const box = card.getBoundingClientRect(), tb = tip.getBoundingClientRect();
  let left = ev.clientX - box.left + 16, top = ev.clientY - box.top + 14;
  if (left + tb.width > box.width) left = ev.clientX - box.left - tb.width - 16;
  if (top + tb.height > box.height) top = ev.clientY - box.top - tb.height - 14;
  tip.style.left = Math.max(0, left) + "px";
  tip.style.top = Math.max(0, top) + "px";
}

/* delay before closing: the pointer must be able to cross the gap between
   the point and the tooltip to go and click a row */
function scheduleHideStripTip() {
  clearTimeout(stripTipTimer);
  stripTipTimer = setTimeout(hideStripTip, 220);
}
function hideStripTip() {
  clearTimeout(stripTipTimer);
  const t = $("strip-tip"), host = $("axes-strips");
  if (t) t.hidden = true;
  if (host) {
    host.querySelectorAll(".band.hi").forEach(n => n.classList.remove("hi"));
    host.classList.remove("hov");
  }
}

/* Group mean: where the profiles sit taken as a whole. */
function renderCentroid(computed, annot) {
  if (!$("t-centroid").checked || computed.length < 2) return;
  const mx = computed.reduce((a, r) => a + r.c.x, 0) / computed.length;
  const my = computed.reduce((a, r) => a + r.c.y, 0) / computed.length;
  const x = toSvgX(mx), y = toSvgY(my);
  const g = el("g", {});
  g.appendChild(el("circle", { class: "centroid", cx: x, cy: y, r: 8 }));
  g.appendChild(el("line", { class: "centroid", x1: x - 12, y1: y, x2: x + 12, y2: y }));
  g.appendChild(el("line", { class: "centroid", x1: x, y1: y - 12, x2: x, y2: y + 12 }));
  const t = el("text", { class: "centroid-cap", x: x + 15, y: y + 3.5 });
  t.textContent = L.mean(signed(Math.round(mx)), signed(Math.round(my)));
  g.appendChild(t);
  annot.appendChild(g);
}

/* Around the selection: the two proximity thresholds (derived, see SPACING)
   and a line to the three nearest neighbours. */
function renderAnnotations(computed, annot) {
  if (!selection) return;
  const origin = selection.kind === "profile"
    ? (computed[selection.i] ? computed[selection.i].c : null)
    : REFERENCES[selection.i];
  if (!origin || origin.off) return;

  const ox = toSvgX(origin.x), oy = toSvgY(origin.y);
  annot.appendChild(el("circle", { class: "sel-disc", cx: ox, cy: oy, r: 50 }));
  for (const [d, r] of [[LIMITS.near, LIMITS.near * 2.5], [LIMITS.far, LIMITS.far * 2.5]]) {
    annot.appendChild(el("circle", { class: "sel-ring", cx: ox, cy: oy, r }));
    const t = el("text", { class: "sel-ring-cap", x: ox, y: oy - r - 3, "text-anchor": "middle" });
    t.textContent = d;
    annot.appendChild(t);
  }

  const near = (selection.kind === "profile"
    ? rankParties(origin).map(o => REFERENCES.find(r => r.name === o.name))
    : rankProfiles(origin, computed).map(o => computed[o.i].c)
  ).slice(0, 3);

  for (const n of near) {
    if (!n) continue;
    annot.appendChild(el("line", { class: "link-line",
      x1: ox, y1: oy, x2: toSvgX(n.x), y2: toSvgY(n.y) }));
  }
}

/* The distance panel: every distance, not only the shortest. */
function renderDetail(computed) {
  const wrap = $("detail-wrap");
  const tbody = document.querySelector("#detail-table tbody");
  const hint = $("detail-hint");
  const title = $("detail-title");
  const col = $("detail-col");
  tbody.replaceChildren();

  if (!selection) {
    wrap.hidden = true;
    hint.hidden = false;
    $("detail-id").hidden = true;
    $("detail-readings").hidden = true;
    title.textContent = L.distances;
    return;
  }

  const isProfile = selection.kind === "profile";
  const origin = isProfile ? computed[selection.i] : { p: REFERENCES[selection.i] };
  if (!origin) { selection = null; wrap.hidden = true; hint.hidden = false; return; }

  const rows = isProfile ? (origin.c.off ? [] : rankParties(origin.c))
                         : rankProfiles(REFERENCES[selection.i], computed);
  const label = isProfile ? origin.p.alias : REFERENCES[selection.i].name;

  title.replaceChildren(document.createTextNode(
    isProfile ? L.distancesOf : L.profilesNear));
  const strong = document.createElement("span");
  strong.textContent = label;
  title.appendChild(strong);

  col.textContent = isProfile ? L.colParty : L.colProfile;
  hint.hidden = true;
  wrap.hidden = false;

  /* identity card: flag, motto read off the screenshot, computed concepts */
  const card = $("detail-id");
  card.replaceChildren();
  if (isProfile) {
    const p = origin.p;
    card.appendChild(flagEl(p, "lg"));
    const meta = document.createElement("div");
    meta.className = "meta";
    const d = document.createElement("p");
    d.className = "d";
    const native = !hasPolitiscales(p);
    d.textContent = p.slogan ? p.slogan.join(" · ") : native ? L.nativeMotto : L.noMotto;
    if (!p.slogan) d.style.color = "var(--text-3)";
    meta.appendChild(d);
    /* no PolitiScales answers, no PolitiScales concepts to compute */
    if (!native) meta.appendChild(conceptsEl(p));
    card.appendChild(meta);
    card.hidden = false;
    renderReadings(p, origin.c.base || origin.c);
  } else {
    card.hidden = true;
    $("detail-readings").hidden = true;
  }

  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6; td.className = "empty";
    td.textContent = !(isProfile && origin.c.off) ? L.nothingToCompare
      : origin.c.native && view.key === "politiskel"
        ? L.nativeOffDetail([origin.c.x === null && "X", origin.c.y === null && "Y"].filter(Boolean))
        : L.viewOffDetail;
    tr.appendChild(td); tbody.appendChild(tr);
    return;
  }

  const max = Math.max(...rows.map(r => r.d), 1);

  rows.forEach((r, n) => {
    const tr = document.createElement("tr");
    if (!isProfile && selection.kind === "party") tr.dataset.idx = String(r.i);

    const tdRank = document.createElement("td");
    tdRank.className = "rank";
    tdRank.textContent = String(n + 1);
    tr.appendChild(tdRank);

    const tdName = document.createElement("td");
    tdName.append(document.createTextNode(r.name));
    if (n === 0) {
      const pill = document.createElement("span");
      pill.className = "fit-pill" + (r.d > LIMITS.far ? " far-note" : "");
      pill.textContent = " · " + fitPhrase(r.d);
      tdName.appendChild(pill);
    }
    if (r.note) tdName.title = r.note;
    tr.appendChild(tdName);

    const tdBar = document.createElement("td");
    tdBar.className = "bar-cell";
    const bar = document.createElement("div");
    bar.className = "bar" + (r.d > LIMITS.far ? " far" : "");
    bar.style.width = Math.max(2, Math.round((r.d / max) * 100)) + "%";
    tdBar.appendChild(bar);
    tr.appendChild(tdBar);

    for (const v of [String(r.d), signed(Math.round(r.dx)), signed(Math.round(r.dy))]) {
      const td = document.createElement("td");
      td.className = "num";
      td.textContent = v;
      tr.appendChild(td);
    }

    if (!isProfile) {
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => select("profile", r.i));
    }
    tbody.appendChild(tr);
  });
}

/* What the questionnaire adds to a profile, as a block: the journey from its
   PolitiScales position, then every reading beside the compass. Used by the
   distance panel and by the questionnaire's result screen. */
function readingsEl(c, keys) {
  const box = document.createElement("div");
  keys = keys || openThemes().map(t => t.key);
  const pair = (x, y) => "(" + (x === null ? "—" : signed(x)) + ", " + (y === null ? "—" : signed(y)) + ")";

  if (c.native && (c.x !== null || c.y !== null)) {
    const j = document.createElement("p");
    j.className = "journey";
    j.textContent = L.journeyNative(pair(c.x, c.y));
    box.appendChild(j);
  }
  if (c.from) {
    const was = nearestBase(c.from.x, c.from.y);
    const now = nearestBase(c.x, c.y);
    const j = document.createElement("p");
    j.className = "journey";
    j.textContent = L.journey(pair(c.from.x, c.from.y), pair(c.x, c.y), was.name, now.name);
    box.appendChild(j);
  }

  const show = v => (v === null ? L.readingNone : signed(v));
  const lvl = PolitiQuiz.SCALES.salience.fr;
  for (const k of keys) {
    const q = scoreOf(c, k);
    const theme = PolitiQuiz.THEMES.find(t => t.key === k);
    const items = PolitiQuiz.askedItems(k);
    const count = r => items.filter(i => i.reading === r).length;
    const any = q && (Object.values(q.n).some(n => n > 0) || q.salience !== null || q.salienceAfter !== null);
    if (!any) continue;

    if (keys.length > 1) {
      const h = document.createElement("h4");
      h.className = "readings-theme";
      h.textContent = L.themes[k].name;
      box.appendChild(h);
    }
    const dl = document.createElement("dl");
    const row = (label, value, note, sub) => {
      const dt = document.createElement("dt");
      dt.textContent = label;
      if (sub) dt.style.paddingLeft = "12px";
      const dd = document.createElement("dd");
      dd.textContent = value;
      if (note) {
        const sm = document.createElement("small");
        sm.textContent = " · " + note;
        dd.appendChild(sm);
      }
      dl.append(dt, dd);
    };
    const axis = theme.axis;
    row(L.readingAxis[axis], show(q[axis]),
        L.answeredOf(q.n[axis], count(axis)) + " · " + L.readingNotes[axis]);
    for (const d of theme.dims) row(L.dims[d], show(q.dims[d]), null, true);
    if (k === "economy") {
      row(L.readingProtectionism, show(q.protectionism),
          L.answeredOf(q.n.protectionism, count("protectionism")) + " · " + L.readingNotes.protectionism);
      row(L.readingClass, q.class === null && q.n.class ? L.readingClassIncomplete(q.n.class) : show(q.class),
          q.class === null ? null : L.readingNotes.class);
      row(L.readingConflict, show(q.conflict),
          L.answeredOf(q.n.conflict, count("conflict")) + " · " + L.readingNotes.conflict);
      row(L.readingLabour, show(q.labour),
          L.answeredOf(q.n.labour, count("labour")) + " · " + L.readingNotes.labour);
    }
    box.appendChild(dl);

    if (q.salience !== null || q.salienceAfter !== null) {
      const sal = document.createElement("p");
      sal.className = "hint";
      sal.textContent = q.salience !== null && q.salienceAfter !== null
        ? L.salienceMoved(lvl[q.salience], lvl[q.salienceAfter], q.salienceAfter - q.salience)
        : L.salienceOf(lvl[q.salience !== null ? q.salience : q.salienceAfter]);
      box.appendChild(sal);
    }
  }
  return box;
}

function renderReadings(p, c) {
  const box = $("detail-readings");
  box.replaceChildren();
  box.hidden = false;
  const fig = flagFigure(p);
  box.className = c.quiz ? "readings" : "";
  if (c.quiz) {
    const h = document.createElement("h3");
    h.textContent = L.readingsTitle;
    box.append(h, readingsEl(c));
  }
  if (fig) box.appendChild(fig);
  /* on a server, another member's profile is theirs to answer, not ours */
  if (SERVER.on && !p.me) return;
  const btn = document.createElement("a");
  btn.href = hubHref(idOf(p));
  btn.className = "button " + (c.quiz ? "ghost" : "primary");
  btn.textContent = c.quiz ? L.quizEdit : L.quizOpen;
  const actions = document.createElement("div");
  actions.className = "actions";
  actions.style.margin = "0 0 14px";
  actions.appendChild(btn);
  if (!SERVER.on && Object.keys(answersOf(idOf(p))).length) actions.appendChild(exportButton(p, "ghost"));
  box.appendChild(actions);
}

/* Downloads a profile's answers as the file tools/extract.js reads back from
   politi-results/answers/. The format is versioned so that a later bank can
   still tell an old file apart. */
const slugOf = a => a.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "profil";

function exportAnswers(p) {
  const data = { format: "politiskel-answers", version: 1, alias: p.alias,
                 source: p.source || null, exported: new Date().toISOString(),
                 answers: answersOf(idOf(p)) };
  const blob = new Blob([JSON.stringify(data, null, 1) + "\n"], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = slugOf(p.alias) + "-reponses.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function exportButton(p, cls) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = cls;
  b.textContent = L.exportAnswers;
  b.title = L.exportHint;
  b.addEventListener("click", () => exportAnswers(p));
  return b;
}

