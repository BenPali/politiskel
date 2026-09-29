#!/usr/bin/env node
"use strict";
/* How the "Pour rire" matching behaves, measured rather than assumed.

     node tools/fun-measure.js [--n 20000] [--seed 1]

   Draws seeded random profiles and matches each against the catalogue of
   site/src/lib/fun/figures.js, under three populations:

     uniform   every point of the [-100, 100] square equally likely, the
               harshest test of coverage (nobody is ever "far" in a
               catalogue that fills the board);
     centred   a normal cloud around a moderate left-libertarian centre,
               closer to who fills in a questionnaire;
     parties   the reference parties of the five hand-written countries,
               jittered, which is where real profiles have been found.

   Each population is run twice, without secondary readings and with all
   four, since a profile that took the Europe, ecology and institutions
   themes matches on more than the axes.

   It reports, per run: the figure that wins most often and its share, how
   many figures are never or almost never chosen, the tie rate (the top two
   within the model's tie limit: no winner is claimed), how the best match
   splits into near, moderate and far, and how often a low-confidence
   figure wins with and without the confidence weighting.

   A catalogue is a partition of the board: a figure alone in a sparse region
   wins a wide area by geometry, and one inside a cluster wins almost nothing.
   The numbers are there to judge whether that is tolerable, and to be
   re-run after every edit of the catalogue. Nothing is written: this
   script prints, and its output is not a file of the repository. */

const M = require("./politi-model.js");

const arg = (name, dflt) => {
  const i = process.argv.indexOf("--" + name);
  return i > 0 ? Number(process.argv[i + 1]) : dflt;
};
const N = arg("n", 20000);
const SEED = arg("seed", 1);

/* mulberry32: a small seeded generator, so a run can be repeated */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const normal = (rand) => {
  const u = 1 - rand(), v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const clamp = (v) => Math.max(-100, Math.min(100, Math.round(v)));

const PARTIES = ["fr", "de", "it", "uk", "us"]
  .flatMap((code) => M.countryByCode(code).parties);

const POPULATIONS = {
  uniform: (rand) => [clamp(rand() * 200 - 100), clamp(rand() * 200 - 100)],
  centred: (rand) => [clamp(-10 + 45 * normal(rand)), clamp(-15 + 45 * normal(rand))],
  parties: (rand) => {
    const p = PARTIES[Math.floor(rand() * PARTIES.length)];
    return [clamp(p.x + 15 * normal(rand)), clamp(p.y + 15 * normal(rand))];
  }
};

const pct = (n, d) => (100 * n / d).toFixed(1).padStart(5) + " %";

async function main() {
  const { matchProfile, READINGS, limitsOf } = await import("../site/src/lib/fun/match.js");
  const { FIGURES } = await import("../site/src/lib/fun/figures.js");
  const limits = limitsOf();
  console.log("catalogue: " + FIGURES.length + " figures, limits near " + limits.near
    + " / far " + limits.far + " / tie " + limits.tie + ", " + N + " profiles per run, seed " + SEED + "\n");

  for (const [pop, draw] of Object.entries(POPULATIONS)) {
    for (const withReadings of [false, true]) {
      const rand = rng(SEED * 7919 + (withReadings ? 1 : 0));
      const wins = new Map(), unweighted = new Map();
      let ties = 0, lowWins = 0, lowWinsUnweighted = 0;
      const fit = { near: 0, moderate: 0, far: 0 };
      let percentileSum = 0;
      for (let i = 0; i < N; i++) {
        const [x, y] = draw(rand);
        const readings = {};
        for (const k of READINGS) readings[k] = withReadings ? clamp(45 * normal(rand)) : null;
        const r = matchProfile({ x, y, readings });
        wins.set(r.best.figure.id, (wins.get(r.best.figure.id) || 0) + 1);
        const closest = r.ranked.reduce((a, b) => (b.d < a.d ? b : a));
        unweighted.set(closest.figure.id, (unweighted.get(closest.figure.id) || 0) + 1);
        if (r.tie) ties++;
        if (r.best.figure.confidence === "low") lowWins++;
        if (closest.figure.confidence === "low") lowWinsUnweighted++;
        fit[r.fit]++;
        percentileSum += r.best.percentile;
      }
      const sorted = [...wins.entries()].sort((a, b) => b[1] - a[1]);
      const never = FIGURES.filter((f) => !wins.has(f.id));
      const rare = FIGURES.filter((f) => (wins.get(f.id) || 0) < N * 0.001);
      console.log("== " + pop + (withReadings ? ", with readings" : ", axes only"));
      console.log("  most frequent: " + sorted.slice(0, 5).map(([id, n]) => id + " " + pct(n, N).trim()).join(", "));
      console.log("  never chosen: " + never.length + ", under 0.1 %: " + rare.length
        + (never.length ? " (" + never.map((f) => f.id).join(", ") + ")" : ""));
      console.log("  tie (top two within " + limits.tie + "): " + pct(ties, N).trim());
      console.log("  best is near " + pct(fit.near, N).trim() + ", moderate " + pct(fit.moderate, N).trim() + ", far " + pct(fit.far, N).trim());
      console.log("  a low-confidence figure wins: " + pct(lowWins, N).trim() + " (" + pct(lowWinsUnweighted, N).trim() + " without the weighting)");
      console.log("  mean percentile of the best match: " + (percentileSum / N).toFixed(1));
      const half = [...wins.values()].sort((a, b) => b - a);
      let acc = 0, k = 0;
      while (acc < N / 2) acc += half[k++];
      console.log("  figures making up half of all wins: " + k + " of " + FIGURES.length + "\n");
    }
  }
}
main();
