#!/usr/bin/env node
"use strict";
/* How often the nearest party on a theme is not the nearest overall, and how
   often that answer is a toss-up. The "nearest party per theme" block only
   earns its place if the first is common; it may only name a party if the
   second is not.

     node tools/by-theme-measure.js [seed]

   Simulated profiles, over every country of the model, answered through the
   real questionnaire and scored by the site's own code (compass/model.js,
   compass/bytheme.js). Three kinds, told apart because whoever generates
   them picks their coherence, and with it the answer:

     anchored     near a random party of the country on every reading, with
                  noise: a voter who is roughly consistent
     independent  every reading drawn at random: the least coherent case,
                  where themes part the most
     sparse       anchored, with the two answers per sub-dimension a theme
                  needs to count and no more: the thinnest scores that show

   plus a few archetypes, answered with little noise. The distances are on
   one theme's scale, but the thresholds are the country's two-dimensional
   ones, as on the party list; the same measure is repeated with thresholds
   derived from the parties projected on the theme's axis, to see how much
   the choice matters.

   Nothing is written: the numbers are for reading, not for keeping. */

const { site } = require("./lib/site.js");
const { rng, answersFor } = require("./lib/sim-answers.js");
const M = require("./politi-model.js");
const Q = require("./politi-quiz.js");

const SEED = Number(process.argv[2]) || 20260929;

const ARCHETYPES = [
  ["social-democrat, pro-European", { x: -45, y: -40, europe: 70, ecology: 50, people: -50, protectionism: -10 }],
  ["market liberal", { x: 60, y: -20, europe: 60, ecology: -10, people: -60, protectionism: -50 }],
  ["national conservative", { x: 20, y: 70, europe: -60, ecology: -50, people: 70, protectionism: 50 }],
  ["radical ecologist", { x: -70, y: -70, europe: 40, ecology: 90, people: 0, protectionism: -10 }],
  ["centrist", { x: 0, y: 0, europe: 20, ecology: 0, people: -20, protectionism: 0 }],
  ["sovereigntist left", { x: -70, y: 40, europe: -60, ecology: 20, people: 50, protectionism: 60 }],
  ["libertarian", { x: 90, y: -40, europe: -20, ecology: -60, people: -20, protectionism: -70 }],
  ["Eurosceptic conservative", { x: 45, y: 55, europe: -75, ecology: -30, people: 10, protectionism: 20 }]
];

const KEYS = ["economy", "protectionism", "society", "europe", "ecology", "institutions"];
const clamp = (v) => Math.max(-100, Math.min(100, v));

async function main() {
  const model = await site("compass/model.js");
  const bt = await site("compass/bytheme.js");
  const random = rng(SEED);

  /* one tally per kind of profile, and one for all */
  const tally = () => ({ profiles: 0, withShown: 0, shownTotal: 0, cells: {} });
  const tallies = { anchored: tally(), independent: tally(), sparse: tally(), archetype: tally(), all: tally() };
  const cell = (t, key) => (t.cells[key] = t.cells[key] || {
    placed: 0, measured: 0, differs: 0, rawTie: 0, rawTie1d: 0, differsTie: 0, differsTie1d: 0, far: 0,
    same: 0, "tied-with-overall": 0, "ex-aequo": 0, crowded: 0, distinct: 0, overallUnmeasured: 0 });

  const oneD = (country, ref) => {
    const refs = country.parties.filter((r) => Number.isFinite(r[ref])).map((r) => ({ x: r[ref], y: 0 }));
    return M.limitsFor(refs);
  };

  let overallTie = 0, overallN = 0, maxTied = 0;
  const groupSizes = {};

  function tick(kind, country, profile) {
    const c = model.coords({ answers: profile });
    const limits = M.limitsFor(country.parties);
    const { overall, themes } = bt.byTheme(c, country, limits);
    if (overall) {
      const ranked = country.parties.map((r) => Math.hypot(r.x - c.x, r.y - c.y)).sort((a, b) => a - b);
      overallN++;
      if (ranked.length > 1 && Math.round(ranked[1]) - Math.round(ranked[0]) <= limits.tie) overallTie++;
    }
    for (const t of [tallies[kind], tallies.all]) {
      t.profiles++;
      const shown = themes.filter((th) => bt.SHOWN.has(th.status)).length;
      t.shownTotal += shown;
      if (shown) t.withShown++;
    }
    for (const th of themes) {
      if (th.status === "unplaced") continue;
      for (const t of [tallies[kind], tallies.all]) {
        const k = cell(t, th.key);
        k.placed++;
        if (th.status === "unmeasured") continue;
        k.measured++;
        const l1 = oneD(country, bt.THEMES.find((x) => x.key === th.key).ref);
        const differs = !!overall && th.best.name !== overall.name;
        if (differs) k.differs++;
        if (th.margin <= limits.tie) { k.rawTie++; if (differs) k.differsTie++; }
        if (th.margin <= l1.tie) { k.rawTie1d++; if (differs) k.differsTie1d++; }
        if (th.best.d > limits.far) k.far++;
        k[th.status]++;
        if (overall && th.overall === null) k.overallUnmeasured++;
      }
      if (th.tied) { maxTied = Math.max(maxTied, th.tied.length); groupSizes[th.tied.length] = (groupSizes[th.tied.length] || 0) + 1; }
    }
  }

  const nCountries = model.COUNTRIES.length;
  for (const country of model.COUNTRIES) {
    const pick = () => country.parties[Math.floor(random() * country.parties.length)];
    const anchored = () => {
      const p = pick();
      const near = (v) => (Number.isFinite(v) ? clamp(v + 25 * random.normal()) : undefined);
      const latent = { x: near(p.x), y: near(p.y), europe: near(p.eu), ecology: near(p.env), people: near(p.pop), protectionism: near(p.prot) };
      for (const k of Object.keys(latent)) if (latent[k] === undefined) delete latent[k];
      return latent;
    };
    for (let i = 0; i < 300; i++) tick("anchored", country, answersFor(anchored(), random));
    for (let i = 0; i < 150; i++) {
      const latent = {};
      for (const k of ["x", "y", "europe", "ecology", "people", "protectionism"]) latent[k] = random() * 200 - 100;
      tick("independent", country, answersFor(latent, random));
    }
    for (let i = 0; i < 150; i++) tick("sparse", country, answersFor(anchored(), random, { perDim: 2 }));
    for (const [, latent] of ARCHETYPES) tick("archetype", country, answersFor(latent, random, { noise: 0.1 }));
  }

  const pct = (a, b) => (b ? (100 * a / b).toFixed(1).padStart(5) + "%" : "    -");
  console.log("seed " + SEED + ", " + nCountries + " countries\n");
  console.log("overall nearest within the tie limit of the runner-up (2-D): " + pct(overallTie, overallN) + " of " + overallN + " profiles\n");
  for (const [kind, t] of Object.entries(tallies)) {
    console.log("== " + kind + " (" + t.profiles + " profiles): at least one theme worth showing " + pct(t.withShown, t.profiles) + ", themes shown per profile " + (t.shownTotal / t.profiles).toFixed(2));
    console.log("   theme          placed  measured | nearest differs | margin<=tie: all / when differs | (1-D limits) | far | same  tied-w-overall  ex-aequo  crowded  distinct");
    for (const key of KEYS) {
      const k = t.cells[key];
      if (!k) continue;
      console.log("   " + key.padEnd(14) + String(k.placed).padStart(6) + String(k.measured).padStart(9) + "  | "
        + pct(k.differs, k.measured) + "         | " + pct(k.rawTie, k.measured) + " / " + pct(k.differsTie, k.differs) + "         | "
        + pct(k.rawTie1d, k.measured) + " / " + pct(k.differsTie1d, k.differs) + " | " + pct(k.far, k.measured) + " | "
        + pct(k.same, k.measured) + "  " + pct(k["tied-with-overall"], k.measured) + "           " + pct(k["ex-aequo"], k.measured) + "   " + pct(k.crowded, k.measured) + "   " + pct(k.distinct, k.measured));
    }
    console.log("");
  }
  console.log("others within the tie limit of a theme's nearest party, by count (0 = alone): " + JSON.stringify(groupSizes) + ", at most " + maxTied);

  /* Stability: does the nearest party on a theme survive a different but
     equally defensible score? Two alternatives: every answered item weighted
     alike (instead of every sub-dimension), and one answer dropped at
     random. Flips are read against the margin of the first over the second,
     which is what a tie limit is meant to catch. */
  const READ = { economy: ["economy", "x"], society: ["society", "y"], europe: ["europe", "europe"], ecology: ["ecology", "ecology"], institutions: ["institutions", "people"] };
  const BINS = [[0, 1], [2, 3], [4, 5], [6, 8], [9, 12], [13, 1e9]];
  const flips = BINS.map(() => ({ n: 0, pooled: 0, dropped: 0 }));
  const ties = { d2: [], d1: [] };
  const r3 = rng(SEED + 2);
  for (const country of model.COUNTRIES) {
    const limits = M.limitsFor(country.parties);
    for (let i = 0; i < 200; i++) {
      const p = country.parties[Math.floor(r3() * country.parties.length)];
      const near = (v) => (Number.isFinite(v) ? clamp(v + 25 * r3.normal()) : undefined);
      const latent = { x: near(p.x), y: near(p.y), europe: near(p.eu), ecology: near(p.env), people: near(p.pop) };
      for (const k of Object.keys(latent)) if (latent[k] === undefined) delete latent[k];
      const answers = answersFor(latent, r3, { perDim: i % 2 ? 2 : null });
      const c = model.coords({ answers });
      const { themes } = bt.byTheme(c, country, limits);
      for (const th of themes) {
        if (!READ[th.key] || !th.best) continue;
        const [qk, reading] = READ[th.key];
        const theme = bt.THEMES.find((x) => x.key === th.key);
        const nearest = (v) => {
          if (!Number.isFinite(v)) return null;
          return country.parties.filter((r) => Number.isFinite(r[theme.ref]))
            .map((r) => [r.name, Math.abs(r[theme.ref] - v)]).sort((a, b) => a[1] - b[1])[0][0];
        };
        /* pooled: all answered items of the reading, equal weight */
        const its = Q.askedItems(qk).filter((it) => it.reading === reading && Q.itemValue(it, answers[it.id]) !== null);
        const pooled = 100 * its.reduce((a, it) => a + Q.itemValue(it, answers[it.id]), 0) / its.length;
        /* dropped: one answered item removed, scored as usual */
        const gone = its[Math.floor(r3() * its.length)];
        const rest = Object.assign({}, answers); delete rest[gone.id];
        const dropped = Q.score(rest, qk)[reading];
        const b = BINS.findIndex(([lo, hi]) => th.margin >= lo && th.margin <= hi);
        flips[b].n++;
        if (nearest(pooled) !== th.best.name) flips[b].pooled++;
        if (dropped !== null && nearest(dropped) !== th.best.name) flips[b].dropped++;
      }
      /* the two candidate tie limits, once per country */
    }
    const ref = (k) => country.parties.filter((r) => Number.isFinite(r[k])).map((r) => ({ x: r[k], y: 0 }));
    ties.d2.push(limits.tie);
    ties.d1.push(...["x", "y", "eu", "env", "pop"].map((k) => M.limitsFor(ref(k)).tie));
  }
  const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
  console.log("\nstability of the theme's nearest party under an alternative score, by margin (points)");
  console.log("   margin     n   flips with pooled items   flips with one item dropped");
  BINS.forEach(([lo, hi], i) => console.log("   " + (hi > 1e8 ? lo + "+" : lo + "-" + hi).padEnd(7) + String(flips[i].n).padStart(7) + "   " + pct(flips[i].pooled, flips[i].n) + "                    " + pct(flips[i].dropped, flips[i].n)));
  console.log("   tie limit, median over countries: 2-D " + med(ties.d2) + ", theme axis projected " + med(ties.d1));

  /* Per country, the shown share on the anchored profiles alone: where the
     block is thin because parties are missing, not because themes agree. */
  console.log("\nper country, anchored profiles: share of profiles with at least one theme shown");
  const rows = [];
  for (const country of model.COUNTRIES) {
    const r2 = rng(SEED + 1);
    let n = 0, w = 0;
    for (let i = 0; i < 100; i++) {
      const p = country.parties[Math.floor(r2() * country.parties.length)];
      const near = (v) => (Number.isFinite(v) ? clamp(v + 25 * r2.normal()) : undefined);
      const latent = { x: near(p.x), y: near(p.y), europe: near(p.eu), ecology: near(p.env), people: near(p.pop), protectionism: near(p.prot) };
      for (const k of Object.keys(latent)) if (latent[k] === undefined) delete latent[k];
      const c = model.coords({ answers: answersFor(latent, r2) });
      const { themes } = bt.byTheme(c, country);
      n++;
      if (themes.some((th) => bt.SHOWN.has(th.status))) w++;
    }
    rows.push(country.code + " " + Math.round(100 * w / n) + "%");
  }
  console.log(rows.join("  "));
}

main();
