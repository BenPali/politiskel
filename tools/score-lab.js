#!/usr/bin/env node
"use strict";
/* How reliable is the "nearest party" reading, and would another scorer make
   it more robust?

     node tools/score-lab.js
     node tools/score-lab.js --draws 400 --seed 7 --se 0.5
     node tools/score-lab.js --country fr --sections recovery,centre

   Nothing here is wired into the site or the server. The page ranks parties by
   euclidean distance (politi-model.js: nearestReference, rankParties). This
   file keeps that as the baseline and sets three alternatives against it, all
   on the same synthetic inputs and the same random numbers:

     magnitude   a term on how far each of the two sits from the centre, so a
                 moderate profile is not read as close to an extreme party just
                 because the direction from the centre agrees. Written in polar
                 form: the distance splits into a radial part (difference of
                 the two norms) and an angular part, and the radial part is
                 weighted (1 + lambda). lambda = 0 is the baseline.
     worst       an outlier penalty: distance plus mu times the largest
                 single-axis gap, so a party close on average but far on one
                 axis loses ground.
     augcos      angular distance between the vectors (x, y, c) centred on the
                 middle of the board, with the constant c appended to both, so
                 a centred profile still has a direction. Small c is a pure
                 direction reading (a centred profile gets an arbitrary one);
                 large c converges to the distance ranking.

   Ground truth is the party positions themselves, which is a synthetic test:
   a profile drawn from a party's position plus noise says how well each scorer
   recovers it, not who a real person would vote for. Three limits to keep in
   mind when reading the numbers, all printed again next to them:
     - Under isotropic Gaussian noise the euclidean distance is the optimal
       rule (maximum likelihood, equal priors), so on that noise no scorer can
       beat the baseline; an alternative can only win where the noise is not
       that (answers are quantised, clipped at the ends of the scale, and noisier
       on x than on y).
     - The answer noise is assumed, not measured. The item-level simulation
       runs the real questionnaire (PolitiQuiz's item bank, scales and
       aggregation) with an idiosyncratic error per item, `--se`. What that
       error is on real respondents needs real answers; the printed
       within-dimension item spread is the number to compare with them.
     - Parties have two coordinates here, so "worst axis" is a two-axis idea.

   Parameters (lambda, mu, c) are fixed a priori, then swept in the last table
   to show how much the verdict depends on them. Thresholds are derived per
   scorer, exactly as limitsFor derives the site's: near = median gap from a
   party to its nearest neighbour, tie = 0.3 of it, in the scorer's own units.

   No result is written anywhere: the numbers are for reading, not for keeping.
   Seeded, so two runs of the same command print the same numbers. */

const M = require("./politi-model.js");
const Q = require("./politi-quiz.js");

/* ---------- command line ---------- */

const argv = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = argv.indexOf("--" + name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback;
};
const SEED = Number(argOf("seed", 20260929));
/* profiles drawn per party (recovery, mirror) */
const DRAWS = Number(argOf("draws", 200));
/* reference idiosyncratic error per questionnaire item, on the [-1, 1] scale */
const SE = Number(argOf("se", 0.35));
const ONLY = argOf("sections", "all").split(",");
const want = name => ONLY.includes("all") || ONLY.includes(name);
const ONLY_COUNTRY = argOf("country", null);

/* ---------- seeded randomness ---------- */

function hashString(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h;
}
/* mulberry32 + Box-Muller. One stream per named use, so asking for one
   section prints the same numbers as asking for all of them. */
function makeRng(name) {
  let a = (SEED ^ hashString(name)) >>> 0;
  let spare = null;
  const u = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const g = () => {
    if (spare !== null) { const s = spare; spare = null; return s; }
    let p; do p = u(); while (!p);
    const q = u(), r = Math.sqrt(-2 * Math.log(p));
    spare = r * Math.sin(2 * Math.PI * q);
    return r * Math.cos(2 * Math.PI * q);
  };
  return { u, g };
}
const clampB = v => Math.max(-100, Math.min(100, v));

/* ---------- the scorers: dissimilarity between a profile and a party ---------- */

const baseline = (px, py, qx, qy) => Math.hypot(px - qx, py - qy);

const magnitude = lambda => (px, py, qx, qy) => {
  const dx = px - qx, dy = py - qy;
  const dr = Math.hypot(px, py) - Math.hypot(qx, qy);
  /* d^2 = dr^2 + angular part; the angular part is what is left */
  const ang2 = Math.max(0, dx * dx + dy * dy - dr * dr);
  return Math.sqrt(ang2 + (1 + lambda) * dr * dr);
};

const worst = mu => (px, py, qx, qy) => {
  const dx = px - qx, dy = py - qy;
  return Math.hypot(dx, dy) + mu * Math.max(Math.abs(dx), Math.abs(dy));
};

const augcos = c => (px, py, qx, qy) => {
  const ux = px / 100, uy = py / 100, vx = qx / 100, vy = qy / 100;
  const nu = Math.hypot(ux, uy, c), nv = Math.hypot(vx, vy, c);
  if (!nu || !nv) return Math.PI / 2;
  return Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy + c * c) / (nu * nv))));
};

/* `main` ones go in every table; the others only in the parameter sweep. */
const SCORERS = [
  { id: "base",     label: "distance (baseline)",   f: baseline, main: true },
  { id: "mag1",     label: "magnitude, lambda=1",   f: magnitude(1), main: true },
  { id: "worst.5",  label: "worst axis, mu=0.5",    f: worst(0.5), main: true },
  { id: "acos1",    label: "augmented cosine, c=1", f: augcos(1), main: true },
  { id: "mag.5",    label: "magnitude, lambda=0.5", f: magnitude(0.5) },
  { id: "mag2",     label: "magnitude, lambda=2",   f: magnitude(2) },
  { id: "mag4",     label: "magnitude, lambda=4",   f: magnitude(4) },
  { id: "worst.25", label: "worst axis, mu=0.25",   f: worst(0.25) },
  { id: "worst1",   label: "worst axis, mu=1",      f: worst(1) },
  { id: "worst2",   label: "worst axis, mu=2",      f: worst(2) },
  { id: "acos0",    label: "pure cosine, c=0",      f: augcos(0) },
  { id: "acos.25",  label: "augmented cosine, c=0.25", f: augcos(0.25) },
  { id: "acos.5",   label: "augmented cosine, c=0.5",  f: augcos(0.5) },
  { id: "acos2",    label: "augmented cosine, c=2",    f: augcos(2) },
  { id: "acos4",    label: "augmented cosine, c=4",    f: augcos(4) }
];
const MAIN = SCORERS.filter(s => s.main);

/* ---------- the reference sets ---------- */

/* Malta has two parties: top-3 and margins mean nothing there. */
const MIN_PARTIES = 4;
const COUNTRIES = M.COUNTRIES
  .filter(c => c.parties.length >= MIN_PARTIES && (!ONLY_COUNTRY || c.code === ONLY_COUNTRY));
if (!COUNTRIES.length) {
  console.error("no country to run (have: " + M.COUNTRIES.map(c => c.code).join(", ") + ")");
  process.exit(1);
}

const median = xs => { const s = xs.slice().sort((a, b) => a - b); return s[s.length >> 1]; };
const mean = xs => xs.reduce((s, v) => s + v, 0) / xs.length;

/* limitsFor's derivation, for any scorer: the median gap from a party to its
   nearest neighbour is the "near" limit, 0.3 of it the tie limit. */
function contextFor(country) {
  const refs = country.parties.map(p => ({ x: p.x, y: p.y, norm: Math.hypot(p.x, p.y), name: p.name }));
  const spacing = {}, tie = {};
  for (const sc of SCORERS) {
    const nn = refs.map((r, i) => Math.min(...refs
      .filter((_, j) => j !== i).map(o => sc.f(r.x, r.y, o.x, o.y))));
    spacing[sc.id] = median(nn);
    tie[sc.id] = 0.3 * spacing[sc.id];
  }
  return { country, refs, spacing, tie };
}
const CTX = COUNTRIES.map(contextFor);

const scoresOf = (f, refs, px, py) => refs.map(r => f(px, py, r.x, r.y));
/* index of the best, of the runner-up, and the rank of `target` (0 = best) */
function topTwo(s) {
  let b = 0, b2 = -1;
  for (let i = 1; i < s.length; i++) {
    if (s[i] < s[b]) { b2 = b; b = i; } else if (b2 < 0 || s[i] < s[b2]) b2 = i;
  }
  return { b, b2 };
}
function rankOf(s, t) {
  let r = 0;
  for (let j = 0; j < s.length; j++) if (s[j] < s[t] || (s[j] === s[t] && j < t)) r++;
  return r;
}

/* ---------- the questionnaire as a noise source ---------- */

/* The real item bank and the real aggregation, with the answer simulated: a
   respondent whose position on an axis is L has, on each item feeding that
   axis, the latent value L/100 plus an idiosyncratic error, clipped to the
   scale, then snapped to the nearest option of that item's own answer scale
   (5 options for most, 11 for the EVS cards, 2 for a few). It is the
   quantisation, the clipping at the ends and the number of items per
   sub-dimension that shape the noise, which is why the questionnaire is run
   and not replaced by a Gaussian. */
function compileAxis(themeKey, reading) {
  const theme = Q.THEMES.find(t => t.key === themeKey);
  const items = Q.askedItems(themeKey).filter(i => i.reading === reading);
  return theme.dims.map(d => items.filter(i => i.dim === d).map(i => {
    const scale = Q.SCALES[i.scale];
    return { id: i.id, vals: scale.values.map(v => i.pole * v) };
  }));
}
const AXIS_X = compileAxis("economy", "x");
const AXIS_Y = compileAxis("society", "y");

/* One simulated axis reading, replicating PolitiQuiz.score's arithmetic:
   each sub-dimension is round(100 * mean of its items), the axis the rounded
   mean of the sub-dimensions. `answers`, if given, records the option chosen
   so the check below can hand the same answers to the real score(). */
function pipeAxis(axis, latent, se, rng, answers) {
  const t0 = latent / 100;
  let sum = 0;
  for (const dim of axis) {
    let s = 0;
    for (const it of dim) {
      const t = Math.max(-1, Math.min(1, t0 + se * rng.g()));
      let k = 0;
      for (let j = 1; j < it.vals.length; j++) {
        if (Math.abs(it.vals[j] - t) < Math.abs(it.vals[k] - t)) k = j;
      }
      s += it.vals[k];
      if (answers) answers[it.id] = k;
    }
    sum += Math.round(100 * s / dim.length);
  }
  return Math.round(sum / axis.length);
}
const pipe = (lx, ly, se, rng) => [pipeAxis(AXIS_X, lx, se, rng), pipeAxis(AXIS_Y, ly, se, rng)];

/* The replica must agree with the real thing, or every number below is about
   something else. */
function checkPipeline() {
  const rng = makeRng("pipeline-check");
  for (let k = 0; k < 300; k++) {
    const lx = Math.round((rng.u() * 2 - 1) * 100), ly = Math.round((rng.u() * 2 - 1) * 100);
    const se = rng.u() * 0.6;
    const seed = rng.u();
    const r1 = makeRng("c" + seed);
    const ans = {};
    const x = pipeAxis(AXIS_X, lx, se, r1, ans), y = pipeAxis(AXIS_Y, ly, se, r1, ans);
    const rx = Q.score(ans, "economy").x, ry = Q.score(ans, "society").y;
    if (x !== rx || y !== ry) {
      throw new Error("pipeline replica differs from PolitiQuiz.score: "
        + [lx, ly, se, x, rx, y, ry].join(" "));
    }
  }
}
checkPipeline();

/* ---------- output helpers ---------- */

const pc = v => (100 * v).toFixed(1);
const f1 = v => v.toFixed(1);
const f2 = v => v.toFixed(2);
const padL = (v, w) => String(v).padStart(w);
const padR = (v, w) => String(v).padEnd(w);
const NAME_W = 26;

function printTable(title, columns, rows, note) {
  console.log("\n" + title);
  console.log("  " + padR("", NAME_W) + columns.map(c => padL(c, 10)).join(""));
  for (const [label, vals] of rows) {
    console.log("  " + padR(label, NAME_W) + vals.map(v => padL(v, 10)).join(""));
  }
  if (note) console.log("  " + note);
}

/* The mean over countries of a per-country rate: every country weighs the
   same, a big multi-party system does not drown the others. */
const macro = (perCountry, sid, get) => {
  const vs = perCountry.map(pcs => get(pcs[sid])).filter(v => Number.isFinite(v));
  return vs.length ? mean(vs) : NaN;
};
const rate = (a, b) => (b ? a / b : NaN);

console.log("score-lab  seed " + SEED + "  draws/party " + DRAWS + "  item error se " + SE
  + "  countries " + COUNTRIES.length + " (of " + M.COUNTRIES.length + ", Malta out: two parties)");

/* ---------- 1. how noisy are real answers? ---------- */

const partyPoints = [];
for (const ctx of CTX) for (const r of ctx.refs) partyPoints.push([r.x, r.y]);

/* The reading's error against the position it was drawn from, over every party
   position. RMS, not spread: the error has a systematic part (an answer is
   snapped to a few options, and clipped at the ends), and with no item error
   at all that part is the whole error. */
function noiseProfile(se) {
  const rng = makeRng("noise-" + se);
  const R = 60;
  let sx = 0, sy = 0, n = 0, bx = 0, by = 0;
  let shrinkNum = 0, shrinkDen = 0;
  const within = [];
  for (const [x, y] of partyPoints) {
    for (let k = 0; k < R; k++) {
      const [px, py] = pipe(x, y, se, rng);
      sx += (px - x) ** 2; sy += (py - y) ** 2; bx += px - x; by += py - y; n++;
      if (Math.hypot(x, y) >= 60) { shrinkNum += Math.hypot(px, py); shrinkDen += Math.hypot(x, y); }
    }
    /* spread of the item values around their sub-dimension's mean, for a
       respondent at this position: the number to hold against real answers */
    for (const axis of [AXIS_X, AXIS_Y]) {
      const lat = axis === AXIS_X ? x : y;
      for (const dim of axis) {
        const vs = dim.map(it => {
          const t = Math.max(-1, Math.min(1, lat / 100 + se * rng.g()));
          return it.vals.reduce((b, v) => (Math.abs(v - t) < Math.abs(b - t) ? v : b), it.vals[0]);
        });
        const m = mean(vs);
        within.push(Math.sqrt(vs.reduce((s, v) => s + (v - m) * (v - m), 0) / (vs.length - 1)));
      }
    }
  }
  return { se, rmsx: Math.sqrt(sx / n), rmsy: Math.sqrt(sy / n), biasx: bx / n, biasy: by / n,
           within: mean(within), shrink: shrinkNum / shrinkDen };
}
const ITEM_SES = [...new Set([0.2, SE, 0.5, 0.7])].sort((a, b) => a - b);
const NOISE_GRID = [0].concat(ITEM_SES).map(noiseProfile);
const REF_NOISE = NOISE_GRID.find(n => n.se === SE) || noiseProfile(SE);
/* the isotropic Gaussian that matches it, for the sigma grid */
const SIGMA_MATCH = Math.sqrt((REF_NOISE.rmsx ** 2 + REF_NOISE.rmsy ** 2) / 2);

if (want("noise")) {
  printTable("1. Noise of the questionnaire, on the model scale (points out of 100)",
    ["se", "rms x", "rms y", "in-dim sd", "extr. keep"],
    NOISE_GRID.map(n => ["item error se = " + n.se, [f2(n.se), f1(n.rmsx), f1(n.rmsy), f2(n.within), pc(n.shrink) + "%"]]),
    "rms = root mean square gap between the reading and the position it was drawn from (party positions of all countries);\n"
    + "  in-dim sd = spread of item values inside one sub-dimension, on the [-1, 1] scale (compare with real answers);\n"
    + "  extr. keep = mean norm of the reading over the norm of the position, for parties past 60: the pull to the centre\n"
    + "  that clipping and quantisation cause. Reference used below: se = " + SE + ", rms x " + f1(REF_NOISE.rmsx)
    + ", rms y " + f1(REF_NOISE.rmsy) + ", matched isotropic sigma " + f1(SIGMA_MATCH) + ".\n"
    + "  Why 0.35: a single attitude item typically tracks its latent trait with a reliability near 0.6; with a\n"
    + "  trait spread of 0.4 across parties that is an item error of 0.4 * sqrt(0.4 / 0.6) = 0.33. Assumed, not measured.");
}

/* ---------- 2. benchmark engine ---------- */

/* Noise sources for recovery: a function from a position to a noisy profile. */
const SIGMAS = [10, 15, 20, 30];
/* Moderate respondents: the position pulled towards the middle by a factor
   before the (matched) noise, as people who avoid the ends of a scale do. A
   scorer that leans on the norm is tested here, one that reads directions is
   helped. */
const SHRINKS = [0.8, 0.6];
const SOURCES = SIGMAS.map(s => ({
  key: "gauss" + s, label: "sigma " + s,
  make: rng => (x, y) => [clampB(x + s * rng.g()), clampB(y + s * rng.g())]
})).concat([
  { key: "gaussM", label: "sigma ~" + Math.round(SIGMA_MATCH),
    make: rng => (x, y) => [clampB(x + REF_NOISE.rmsx * rng.g()), clampB(y + REF_NOISE.rmsy * rng.g())] }
]).concat(SHRINKS.map(g => ({
  key: "shrink" + g, label: "x" + g,
  make: rng => (x, y) => [clampB(g * x + REF_NOISE.rmsx * rng.g()), clampB(g * y + REF_NOISE.rmsy * rng.g())]
}))).concat(ITEM_SES.map(se => ({
  key: se === SE ? "item" : "item" + se, label: "se " + se,
  make: rng => (x, y) => pipe(x, y, se, rng)
})));

const newAcc = () => ({ n: 0, top1: 0, top3: 0, margin: 0, tie: 0,
  outN: 0, outHit: 0, inN: 0, inHit: 0, bandN: [0, 0, 0], bandHit: [0, 0, 0], normRank: 0 });

/* Recovery: each party's position plus noise; is the party found? */
function recovery(source) {
  const perCountry = [];
  const pooled = {};
  for (const sc of SCORERS) pooled[sc.id] = newAcc();
  for (const ctx of CTX) {
    const rng = makeRng("recovery-" + source.key + "-" + ctx.country.code);
    const noisy = source.make(rng);
    const accs = {};
    for (const sc of SCORERS) accs[sc.id] = newAcc();
    ctx.refs.forEach((q, i) => {
      for (let d = 0; d < DRAWS; d++) {
        const [px, py] = noisy(q.x, q.y);
        for (const sc of SCORERS) {
          const s = scoresOf(sc.f, ctx.refs, px, py);
          const { b, b2 } = topTwo(s);
          const marginN = (s[b2] - s[b]) / ctx.spacing[sc.id];
          const hit = b === i;
          for (const a of [accs[sc.id], pooled[sc.id]]) {
            a.n++;
            if (hit) a.top1++;
            if (rankOf(s, i) < 3) a.top3++;
            a.margin += marginN;
            if (s[b2] - s[b] < ctx.tie[sc.id]) { a.tie++; a.inN++; if (hit) a.inHit++; }
            else { a.outN++; if (hit) a.outHit++; }
            if (sc.id === "base") {
              const band = s[b] <= ctx.spacing.base ? 0 : s[b] <= 1.5 * ctx.spacing.base ? 1 : 2;
              a.bandN[band]++;
              if (hit) a.bandHit[band]++;
            }
          }
        }
      }
    });
    perCountry.push(accs);
  }
  return { perCountry, pooled };
}

const RECOVERY = {};
if (want("recovery") || want("reliability") || want("sweep") || want("discrimination")) {
  for (const src of SOURCES) RECOVERY[src.key] = recovery(src);
}

const rows4 = (fn, list) => list.map(sc => [sc.label, fn(sc)]);

if (want("recovery")) {
  const cols = SOURCES.map(s => s.label);
  printTable("2a. Recovery, top-1: the generating party is ranked first (% of draws, mean over countries)",
    cols, rows4(sc => SOURCES.map(s => pc(macro(RECOVERY[s.key].perCountry, sc.id, a => rate(a.top1, a.n)))), MAIN),
    "Gaussian columns: isotropic noise, sigma in points (the baseline is optimal there by construction).\n"
    + "  'x0.8', 'x0.6': moderate respondents, position pulled to the middle by that factor, plus the matched noise.\n"
    + "  'sigma ~" + Math.round(SIGMA_MATCH) + "': Gaussian with the questionnaire's own rms on x and on y.\n"
    + "  'se' columns: the real questionnaire with that item error (" + SE + " is the reference).");
  printTable("2b. Recovery, top-3: the generating party is among the first three",
    cols, rows4(sc => SOURCES.map(s => pc(macro(RECOVERY[s.key].perCountry, sc.id, a => rate(a.top3, a.n)))), MAIN));

  /* the paired difference at the item-level noise, with its standard error over
     countries: is a gap bigger than the spread between countries? */
  const pcItem = RECOVERY.item.perCountry;
  const diffs = sc => {
    const d = pcItem.map(cs => rate(cs[sc.id].top1, cs[sc.id].n) - rate(cs.base.top1, cs.base.n));
    const m = mean(d);
    const se = d.length > 1 ? Math.sqrt(d.reduce((s, v) => s + (v - m) * (v - m), 0) / (d.length - 1) / d.length) : NaN;
    return [(m >= 0 ? "+" : "") + pc(m), Number.isFinite(se) ? "+-" + pc(se) : "n/a"];
  };
  printTable("2c. Top-1 against the baseline, items noise (points of %, standard error over countries)",
    ["diff", "se"], MAIN.slice(1).map(sc => [sc.label, diffs(sc)]),
    "Paired by country. A difference under two standard errors is not a difference.");
}

/* ---------- 3. what the site could print ---------- */

if (want("reliability")) {
  const it = RECOVERY.item;
  const cols = SOURCES.filter(sr => /^item|gaussM|shrink/.test(sr.key)).concat(SOURCES.filter(sr => sr.key === "gauss10" || sr.key === "gauss20"));
  const P = sr => RECOVERY[sr.key];
  printTable("3a. Reliability of the nearest party (baseline scorer), by noise level, % of draws",
    cols.map(sr => sr.label),
    [["top-1: right party", cols.map(sr => pc(macro(P(sr).perCountry, "base", a => rate(a.top1, a.n))))],
     ["top-3: among first three", cols.map(sr => pc(macro(P(sr).perCountry, "base", a => rate(a.top3, a.n))))],
     ["top-1 when margin >= tie", cols.map(sr => pc(rate(P(sr).pooled.base.outHit, P(sr).pooled.base.outN)))],
     ["top-1 when margin < tie", cols.map(sr => pc(rate(P(sr).pooled.base.inHit, P(sr).pooled.base.inN)))],
     ["share of draws inside tie", cols.map(sr => pc(rate(P(sr).pooled.base.inN, P(sr).pooled.base.n)))],
     ["top-1 when d <= near", cols.map(sr => pc(rate(P(sr).pooled.base.bandHit[0], P(sr).pooled.base.bandN[0])))],
     ["top-1 when near < d <= far", cols.map(sr => pc(rate(P(sr).pooled.base.bandHit[1], P(sr).pooled.base.bandN[1])))],
     ["top-1 when d > far", cols.map(sr => pc(rate(P(sr).pooled.base.bandHit[2], P(sr).pooled.base.bandN[2])))]],
    "Conditional lines are pooled over all draws (not averaged by country). near/far/tie are the site's limits, derived per country.\n"
    + "  'se' columns: the real questionnaire with that item error (reference " + SE + "); 'sigma' columns: Gaussian noise in points.");

  /* the same statement across countries, since one national figure hides the spread */
  const per = CTX.map((ctx, k) => ({ code: ctx.country.code, n: ctx.refs.length, spacing: ctx.spacing.base,
    r: rate(it.perCountry[k].base.top1, it.perCountry[k].base.n) }))
    .sort((a, b) => a.r - b.r);
  const line = list => list.map(p => p.code + " " + pc(p.r) + " (" + p.n + " parties, spacing " + f1(p.spacing) + ")").join(" ; ");
  console.log("\n3b. Baseline top-1 by country (items noise): lowest three and highest three");
  console.log("  lowest : " + line(per.slice(0, 3)));
  console.log("  highest: " + line(per.slice(-3)));
  const ns = CTX.map((c, k) => [c.refs.length, rate(it.perCountry[k].base.top1, it.perCountry[k].base.n)]);
  const corrN = (() => {
    const xs = ns.map(v => v[0]), ys = ns.map(v => v[1]);
    const mx = mean(xs), my = mean(ys);
    let nu = 0, dx = 0, dy = 0;
    for (let i = 0; i < xs.length; i++) { nu += (xs[i] - mx) * (ys[i] - my); dx += (xs[i] - mx) ** 2; dy += (ys[i] - my) ** 2; }
    return nu / Math.sqrt(dx * dy);
  })();
  console.log("  correlation of top-1 with the number of parties across countries: " + f2(corrN));

  /* Test-retest: the same person answering twice. Needs no party as ground
     truth, only the noise: the reading of a latent position, twice. The
     person sits near a party, not on it, since real people do not sit on
     parties. */
  const retestRun = (se, scorers) => {
    const per = [];
    for (const ctx of CTX) {
      const rng = makeRng("retest-" + se + "-" + ctx.country.code);
      const cnt = {};
      for (const sc of scorers) cnt[sc.id] = { same: 0, truth: 0, n: 0, outN: 0, outSame: 0, inN: 0, inSame: 0 };
      for (const q of ctx.refs) {
        for (let d = 0; d < DRAWS; d++) {
          const lx = clampB(q.x + 20 * rng.g()), ly = clampB(q.y + 20 * rng.g());
          const a = pipe(lx, ly, se, rng), b = pipe(lx, ly, se, rng);
          for (const sc of scorers) {
            const sa = scoresOf(sc.f, ctx.refs, a[0], a[1]);
            const { b: ta, b2: ta2 } = topTwo(sa);
            const tb = topTwo(scoresOf(sc.f, ctx.refs, b[0], b[1])).b;
            const t0 = topTwo(scoresOf(sc.f, ctx.refs, lx, ly)).b;
            const c = cnt[sc.id];
            c.n++;
            if (ta === tb) c.same++;
            if (ta === t0) c.truth++;
            /* does the first questionnaire's own margin foretell the second's agreement? */
            if (sa[ta2] - sa[ta] < ctx.tie[sc.id]) { c.inN++; if (ta === tb) c.inSame++; }
            else { c.outN++; if (ta === tb) c.outSame++; }
          }
        }
      }
      per.push(cnt);
    }
    return per;
  };
  const rt = retestRun(SE, MAIN);
  const pool = (per, sid, k) => per.reduce((s, c) => s + c[sid][k], 0);
  printTable("3c. Same person, two questionnaires (person = party position + 20 points of spread), % of people",
    ["retest", "own pos.", "ret|wide", "ret|tie", "in tie"],
    MAIN.map(sc => [sc.label, [pc(macro(rt, sc.id, c => rate(c.same, c.n))), pc(macro(rt, sc.id, c => rate(c.truth, c.n))),
      pc(rate(pool(rt, sc.id, "outSame"), pool(rt, sc.id, "outN"))), pc(rate(pool(rt, sc.id, "inSame"), pool(rt, sc.id, "inN"))),
      pc(rate(pool(rt, sc.id, "inN"), pool(rt, sc.id, "n")))]]),
    "retest: same nearest party both times. own pos.: the reading names the party nearest the true position.\n"
    + "  ret|wide, ret|tie: retest agreement when the first reading's margin was at least / under the tie limit; in tie: share of the latter.");
  const base1 = [SCORERS[0]];
  const seRows = ITEM_SES.map(se => {
    const r = retestRun(se, base1);
    return ["se " + se, [pc(macro(r, "base", c => rate(c.same, c.n))), pc(macro(r, "base", c => rate(c.truth, c.n))),
      pc(rate(pool(r, "base", "outSame"), pool(r, "base", "outN"))), pc(rate(pool(r, "base", "inSame"), pool(r, "base", "inN"))),
      pc(rate(pool(r, "base", "inN"), pool(r, "base", "n")))]];
  });
  printTable("3d. The same, baseline scorer, at each item error",
    ["retest", "own pos.", "ret|wide", "ret|tie", "in tie"], seRows);

  /* one line per country, for a page that wants to name its own country */
  console.log("\n3e. Baseline by country, items noise: top-1 / top-3 / inside tie (%), parties, near limit (points)");
  for (let k = 0; k < CTX.length; k++) {
    const a = it.perCountry[k].base;
    console.log("  " + padR(CTX[k].country.code + " " + CTX[k].country.name, 22)
      + padL(pc(rate(a.top1, a.n)), 7) + padL(pc(rate(a.top3, a.n)), 7) + padL(pc(rate(a.tie, a.n)), 7)
      + padL(CTX[k].refs.length, 6) + padL(f1(CTX[k].spacing.base), 7));
  }
}

/* ---------- 4. opposite rejection ---------- */

const ITEM_MIRROR = {};
if (want("mirror") || want("sweep")) {
  /* Only parties with something to mirror: a party at the centre is its own opposite. */
  for (const sc of SCORERS) ITEM_MIRROR[sc.id] = { n: 0, top1: 0, top3: 0, nr: 0 };
  const perCountry = [];
  for (const ctx of CTX) {
    const rng = makeRng("mirror-" + ctx.country.code);
    const accs = {};
    for (const sc of SCORERS) accs[sc.id] = { n: 0, top1: 0, top3: 0, nr: 0 };
    ctx.refs.forEach((q, i) => {
      if (q.norm < 40) return;
      for (let d = 0; d < DRAWS; d++) {
        const [px, py] = pipe(-q.x, -q.y, SE, rng);
        for (const sc of SCORERS) {
          const s = scoresOf(sc.f, ctx.refs, px, py);
          const r = rankOf(s, i);
          for (const a of [accs[sc.id], ITEM_MIRROR[sc.id]]) {
            a.n++;
            if (r === 0) a.top1++;
            if (r < 3) a.top3++;
            a.nr += r / (ctx.refs.length - 1);
          }
        }
      }
    });
    perCountry.push(accs);
  }
  ITEM_MIRROR.perCountry = perCountry;
}
if (want("mirror")) {
  const pcs = ITEM_MIRROR.perCountry;
  printTable("4. Opposite rejection: the party's mirror image through the centre, read through the questionnaire",
    ["top-1", "top-3", "rank"],
    MAIN.map(sc => [sc.label, [pc(macro(pcs, sc.id, a => rate(a.top1, a.n))), pc(macro(pcs, sc.id, a => rate(a.top3, a.n))),
      pc(macro(pcs, sc.id, a => rate(a.nr, a.n)))]]),
    "Parties past 40 points from the centre only. top-1/top-3: the mirrored party still comes out first / in the first\n"
    + "  three (should be near 0). rank: its mean rank, 0 = first, 100 = last (should be high).");
}

/* ---------- 5. centre behaviour ---------- */

const CENTRE = {};
if (want("centre") || want("sweep")) {
  const CENTRAL = 30, EXTREME = 60, DISC = 15;
  const classify = norm => (norm <= CENTRAL ? "central" : norm >= EXTREME ? "extreme" : "mid");
  const eligible = CTX.filter(c => c.refs.some(r => r.norm <= CENTRAL) && c.refs.some(r => r.norm >= EXTREME));
  const N_DISC = Math.max(200, DRAWS * 5);
  const perCountry = [];
  for (const ctx of eligible) {
    const rng = makeRng("centre-" + ctx.country.code);
    const accs = {};
    for (const sc of SCORERS) accs[sc.id] = { c: { n: 0, central: 0, extreme: 0, tie: 0 },
      d3: { n: 0, same: 0, extreme: 0, central: 0 }, d5: { n: 0, same: 0, extreme: 0, central: 0 } };
    /* centrists: uniform in a disc around the middle, no party in mind */
    for (let k = 0; k < N_DISC; k++) {
      const r = DISC * Math.sqrt(rng.u()), th = 2 * Math.PI * rng.u();
      const px = r * Math.cos(th), py = r * Math.sin(th);
      for (const sc of SCORERS) {
        const s = scoresOf(sc.f, ctx.refs, px, py);
        const { b, b2 } = topTwo(s);
        const a = accs[sc.id].c;
        a.n++;
        const cls = classify(ctx.refs[b].norm);
        if (cls === "central") a.central++;
        if (cls === "extreme") a.extreme++;
        if (s[b2] - s[b] < ctx.tie[sc.id]) a.tie++;
      }
    }
    /* diluted extremists: an extreme party's own direction, at a fraction of its distance */
    ctx.refs.forEach((q, i) => {
      if (q.norm < EXTREME) return;
      for (const [alpha, key] of [[0.3, "d3"], [0.5, "d5"]]) {
        for (let k = 0; k < Math.max(20, DRAWS / 4); k++) {
          const px = alpha * q.x + 5 * rng.g(), py = alpha * q.y + 5 * rng.g();
          for (const sc of SCORERS) {
            const { b } = topTwo(scoresOf(sc.f, ctx.refs, px, py));
            const a = accs[sc.id][key];
            a.n++;
            if (b === i) a.same++;
            const cls = classify(ctx.refs[b].norm);
            if (cls === "extreme") a.extreme++;
            if (cls === "central") a.central++;
          }
        }
      }
    });
    perCountry.push(accs);
  }
  CENTRE.perCountry = perCountry;
  CENTRE.n = eligible.length;
  CENTRE.discR = DISC;
}
if (want("centre")) {
  const pcs = CENTRE.perCountry;
  printTable("5a. Centrist profiles (uniform within " + CENTRE.discR + " points of the centre), " + CENTRE.n + " countries with a central and an extreme party",
    ["central", "extreme", "in tie"],
    MAIN.map(sc => [sc.label, [pc(macro(pcs, sc.id, a => rate(a.c.central, a.c.n))), pc(macro(pcs, sc.id, a => rate(a.c.extreme, a.c.n))),
      pc(macro(pcs, sc.id, a => rate(a.c.tie, a.c.n)))]]),
    "Nearest party is central (norm <= 30) / extreme (norm >= 60). in tie: margin under the tie limit.\n"
    + "  Expected: mostly central, hardly ever extreme.");
  printTable("5b. Diluted extremists: an extreme party's direction at 30% and at 50% of its distance (+5 points of noise)",
    ["30% same", "30% extr", "30% cent", "50% same", "50% extr", "50% cent"],
    MAIN.map(sc => [sc.label, [
      pc(macro(pcs, sc.id, a => rate(a.d3.same, a.d3.n))), pc(macro(pcs, sc.id, a => rate(a.d3.extreme, a.d3.n))), pc(macro(pcs, sc.id, a => rate(a.d3.central, a.d3.n))),
      pc(macro(pcs, sc.id, a => rate(a.d5.same, a.d5.n))), pc(macro(pcs, sc.id, a => rate(a.d5.extreme, a.d5.n))), pc(macro(pcs, sc.id, a => rate(a.d5.central, a.d5.n)))]]),
    "same: still attached to that very party. extr / cent: attached to any extreme / any central party.\n"
    + "  A moderate profile is 'as close' to the extreme party as its direction says when same is high.");
}

/* ---------- 6. stability and discrimination ---------- */

const STAB = {};
if (want("stability") || want("sweep")) {
  const DELTA = 5;
  /* three populations: people near parties (spread 20), the whole board, the centre */
  const POPS = {
    near: rng => ctx => { const q = ctx.refs[Math.floor(rng.u() * ctx.refs.length)]; return [clampB(q.x + 20 * rng.g()), clampB(q.y + 20 * rng.g())]; },
    board: rng => () => [(rng.u() * 2 - 1) * 100, (rng.u() * 2 - 1) * 100],
    centre: rng => () => { const r = 25 * Math.sqrt(rng.u()), th = 2 * Math.PI * rng.u(); return [r * Math.cos(th), r * Math.sin(th)]; }
  };
  for (const [popKey, mk] of Object.entries(POPS)) {
    const perCountry = [];
    for (const ctx of CTX) {
      const rng = makeRng("stab-" + popKey + "-" + ctx.country.code);
      const draw = mk(rng);
      const accs = {};
      for (const sc of SCORERS) accs[sc.id] = { n: 0, same: 0, marg: 0, tie: 0, margTie: 0 };
      const N = Math.max(300, DRAWS * 5);
      for (let k = 0; k < N; k++) {
        const [px, py] = draw(ctx);
        const qx = clampB(px + DELTA * rng.g()), qy = clampB(py + DELTA * rng.g());
        for (const sc of SCORERS) {
          const s = scoresOf(sc.f, ctx.refs, px, py);
          const { b, b2 } = topTwo(s);
          const s2 = scoresOf(sc.f, ctx.refs, qx, qy);
          const a = accs[sc.id];
          a.n++;
          if (topTwo(s2).b === b) a.same++;
          a.marg += (s[b2] - s[b]) / ctx.spacing[sc.id];
          if (s[b2] - s[b] < ctx.tie[sc.id]) a.tie++;
        }
      }
      perCountry.push(accs);
    }
    STAB[popKey] = perCountry;
  }
}
if (want("stability")) {
  const cols = ["near", "board", "centre"];
  printTable("6a. Stability: nearest party unchanged after a perturbation of 5 points per axis (% of profiles)",
    cols, MAIN.map(sc => [sc.label, cols.map(k => pc(macro(STAB[k], sc.id, a => rate(a.same, a.n))))]),
    "near: person near a party (spread 20). board: uniform over the board. centre: uniform within 25 points of the centre.");
  printTable("6b. Discrimination: mean margin between first and second, in units of the scorer's own party spacing",
    cols, MAIN.map(sc => [sc.label, cols.map(k => f2(macro(STAB[k], sc.id, a => rate(a.marg, a.n))))]),
    "A wider margin is only better if it goes with recovery: it is a property of the scale as much as of the scorer.");
  printTable("6c. Share of outcomes inside the tie limit (0.3 of the party spacing), %",
    cols, MAIN.map(sc => [sc.label, cols.map(k => pc(macro(STAB[k], sc.id, a => rate(a.tie, a.n))))]));
}

/* ---------- 7. parameter sweep ---------- */

if (want("sweep")) {
  const it = RECOVERY.item, g15 = RECOVERY.gauss15;
  printTable("7. Sweep of the three parameters (every scorer, same draws)",
    ["top1 it", "top1 s15", "top1 x.8", "top3 it", "mirr t3", "ctr ext", "ctr cen", "dil30", "stab", "tie%"],
    SCORERS.map(sc => [sc.label, [
      pc(macro(it.perCountry, sc.id, a => rate(a.top1, a.n))),
      pc(macro(g15.perCountry, sc.id, a => rate(a.top1, a.n))),
      pc(macro(RECOVERY["shrink0.8"].perCountry, sc.id, a => rate(a.top1, a.n))),
      pc(macro(it.perCountry, sc.id, a => rate(a.top3, a.n))),
      pc(macro(ITEM_MIRROR.perCountry, sc.id, a => rate(a.top3, a.n))),
      pc(macro(CENTRE.perCountry, sc.id, a => rate(a.c.extreme, a.c.n))),
      pc(macro(CENTRE.perCountry, sc.id, a => rate(a.c.central, a.c.n))),
      pc(macro(CENTRE.perCountry, sc.id, a => rate(a.d3.same, a.d3.n))),
      pc(macro(STAB.near, sc.id, a => rate(a.same, a.n))),
      pc(macro(STAB.near, sc.id, a => rate(a.tie, a.n)))]]),
    "top1 it / top3 it: recovery through the questionnaire. top1 s15 / x.8: recovery under sigma 15 / with respondents pulled to 0.8 of their position. mirr t3: mirrored party in\n"
    + "  the first three (lower is better). ctr ext / ctr cen: centrists attached to an extreme / a central party.\n"
    + "  dil30: a party at 30% of its distance still attached to it. stab: top-1 unchanged (near). tie%: inside tie limit.");
}
