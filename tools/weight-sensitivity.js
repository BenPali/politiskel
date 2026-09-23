#!/usr/bin/env node
"use strict";
/* Do the hand-picked axis weights decide where a profile lands?

     node tools/weight-sensitivity.js
     node tools/weight-sensitivity.js --country de --profiles 8000

   The weights in politi-model.js (0.45/0.35 on X, 0.30/0.25/0.25/0.20 on Y)
   are not derived from anything. This measures what they are worth: it builds
   synthetic profiles, recomputes their position under other weightings, and
   counts how often the nearest reference changes.

   Deriving better weights would need real answers paired with something to
   check them against, which nobody has. Knowing whether it would MATTER needs
   only the model, which is why this runs on nothing but the module next door.

   No profile from politi-results/ is read: the question is about the model's
   own behaviour over its whole input space, not about anyone's answers. */

const M = require("./politi-model.js");

const argv = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = argv.indexOf("--" + name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const COUNTRY = argOf("country", "fr");
const N = Number(argOf("profiles", 4000));
const DRAWS = Number(argOf("draws", 200));

const country = M.countryByCode(COUNTRY);
if (!country) {
  console.error("unknown country: " + COUNTRY + " (have: "
    + M.COUNTRIES.map(c => c.code).join(", ") + ")");
  process.exit(1);
}
const REFS = country.parties;
const LIMITS = M.limitsFor(REFS);

/* Seeded so two runs of the same command print the same numbers. */
let seed = 20260922;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const gauss = () => {
  let u = 0, v = 0;
  while (!u) u = rnd();
  while (!v) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const clamp1 = v => Math.max(-1, Math.min(1, v));

const PAIRS = M.AXES.map(a => [a.neg[0], a.pos[0]]);
const SOCIAL = new Set(["cst", "ess", "rehab", "pun", "prg", "csv", "int", "nat"]);
const FLIPPED = new Set(["eco"]);   /* ecology leans with the economic left */

/* Coherent profiles: two latent leanings plus noise. Real answers are not
   independent across axes, and independent ones inflate every flip rate by
   manufacturing people whose axes contradict each other. This is the
   conservative population. */
function profile() {
  const econ = rnd() * 2 - 1, social = rnd() * 2 - 1;
  const p = {};
  for (const [neg, pos] of PAIRS) {
    const latent = SOCIAL.has(pos) ? social : econ;
    const sign = FLIPPED.has(neg) ? 0.6 : 1;
    const v = clamp1(latent * sign + gauss() * 0.35);
    const span = 100 - Math.round(rnd() * 40);
    const hi = Math.round(span * (v + 1) / 2);
    p[pos] = hi;
    p[neg] = span - hi;
  }
  return p;
}

const BASE = M.AXES.map(a => a.w);
const setWeights = ws => M.AXES.forEach((a, i) => { a.w = ws[i]; });
const IX = M.AXES.map((a, i) => (a.axis === "x" ? i : -1)).filter(i => i >= 0);
const IY = M.AXES.map((a, i) => (a.axis === "y" ? i : -1)).filter(i => i >= 0);

const pool = [];
for (let i = 0; i < N; i++) pool.push(profile());

const nearestOf = p => {
  const c = M.coords(p);
  return M.nearestReference(c.x, c.y, REFS, LIMITS);
};

setWeights(BASE);
const base = pool.map(nearestOf);

function flipRate(ws) {
  setWeights(ws);
  let flips = 0;
  for (let i = 0; i < pool.length; i++) if (nearestOf(pool[i]).name !== base[i].name) flips++;
  setWeights(BASE);
  return 100 * flips / pool.length;
}

const pad = (v, w) => String(v).padStart(w);
const pc = v => v.toFixed(1) + " %";

console.log("Country: " + country.name + "  ·  " + REFS.length + " references"
  + "  ·  thresholds near/far/tie = " + LIMITS.near + "/" + LIMITS.far + "/" + LIMITS.tie);
console.log(N + " synthetic profiles, " + DRAWS + " random reweightings\n");

console.log("Named reweightings                        nearest reference changes");
const named = [
  ["Y flattened to 0.25 each", ws => IY.forEach(i => { ws[i] = 0.25; })],
  ["all weights equal", ws => IX.concat(IY).forEach(i => { ws[i] = 1; })],
  ["X swapped (0.35 / 0.45)", ws => { ws[IX[0]] = 0.35; ws[IX[1]] = 0.45; }],
  ["X on its first component only", ws => { ws[IX[0]] = 1; ws[IX[1]] = 0.001; }],
  ["X on its second component only", ws => { ws[IX[0]] = 0.001; ws[IX[1]] = 1; }]
];
for (const [label, mutate] of named) {
  const ws = BASE.slice();
  mutate(ws);
  console.log("  " + label.padEnd(38) + pad(pc(flipRate(ws)), 8));
}

/* Every weight redrawn independently over the range someone might plausibly
   have written down instead. */
const rates = [];
for (let d = 0; d < DRAWS; d++) {
  const ws = BASE.slice();
  IX.concat(IY).forEach(i => { ws[i] = 0.05 + rnd() * 0.55; });
  rates.push(flipRate(ws));
}
rates.sort((a, b) => a - b);
const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
console.log("\nRandom reweightings: mean " + pc(mean)
  + "  ·  p90 " + pc(rates[Math.floor(rates.length * 0.9)])
  + "  ·  worst " + pc(rates[rates.length - 1]));

/* The finding that matters: flips follow the margin to the runner-up, not the
   weights. A confident attachment survives; a tight one was a coin toss. */
const BANDS = [[0, 2], [2, 5], [5, 10], [10, Infinity]];
const bandOf = m => BANDS.findIndex(([lo, hi]) => m >= lo && m < hi);
const counts = BANDS.map(() => 0), flips = BANDS.map(() => 0);
base.forEach(b => { counts[bandOf(b.margin)]++; });
for (let d = 0; d < DRAWS; d++) {
  const ws = BASE.slice();
  IX.concat(IY).forEach(i => { ws[i] = 0.05 + rnd() * 0.55; });
  setWeights(ws);
  for (let i = 0; i < pool.length; i++) {
    if (nearestOf(pool[i]).name !== base[i].name) flips[bandOf(base[i].margin)]++;
  }
}
setWeights(BASE);

console.log("\nBy margin to the runner-up under the shipped weights:");
console.log("  margin        profiles     changes reference");
BANDS.forEach(([lo, hi], i) => {
  const label = hi === Infinity ? lo + "+ pts" : lo + "-" + hi + " pts";
  console.log("  " + label.padEnd(14)
    + pad(pc(100 * counts[i] / N), 8) + "    "
    + pad(pc(100 * flips[i] / (counts[i] * DRAWS || 1)), 10));
});
console.log("\nA tight margin is what makes an attachment fragile, not the weighting.");
