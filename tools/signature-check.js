#!/usr/bin/env node
"use strict";
/* Measures the thresholds behind the signature block, on the CHES party data.

     node tools/signature-check.js [--perms 2000]

   The signature (site/src/lib/compass/signature.js) calls a "tension" a pair
   of readings that go together among the parties, which a member combines
   the other way round. Three constants decide when that fires: how strong a
   correlation counts as a pattern (MIN_CORR), how far off centre a position
   must be to count as marked (LEAN), and how many parties must carry both
   readings (MIN_PARTIES). This script says whether they are far enough from
   noise to be trusted, and prints what the block would do to real parties.

   Nothing is written. The numbers are for reading here and for the commit
   message, not for the repository: no derived table belongs in it. */

const path = require("path");
const { pathToFileURL } = require("url");
const M = require("./politi-model.js");

const perms = Number((process.argv.find((a, i, all) => all[i - 1] === "--perms")) || 2000);

/* mulberry32: a seeded generator, so that a run can be repeated */
function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = rng(20260929);
const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
const pct = (v, p) => { const s = v.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const f2 = v => (v >= 0 ? " " : "") + v.toFixed(2);
const pc = v => (100 * v).toFixed(1) + "%";

(async () => {
  const S = await import(pathToFileURL(path.join(__dirname, "..", "site", "src", "lib", "compass", "signature.js")).href);
  const { READINGS, PARTY_FIELD, MIN_CORR, LEAN, BAND, MIN_PARTIES, MIN_GAP, correlation } = S;
  const ref = S.referenceOf(M.COUNTRIES);
  const countryOf = new Map();
  for (const c of M.COUNTRIES) for (const p of c.parties) countryOf.set(p, c.code);
  const countries = [...new Set(ref.parties.map(p => countryOf.get(p)))];

  console.log(ref.parties.length + " surveyed parties, " + countries.length + " countries");
  console.log("constants: MIN_CORR " + MIN_CORR + ", LEAN " + LEAN + ", BAND " + BAND + ", MIN_PARTIES " + MIN_PARTIES + ", MIN_GAP " + MIN_GAP + "\n");

  /* 1. the pairs, with a country-level bootstrap: parties of one country are
     not independent, so whole countries are drawn again, not parties. */
  console.log("Pairs (pooled r, n parties, 95% bootstrap by country, countries agreeing on the sign):");
  const byCountry = {};
  for (const p of ref.parties) (byCountry[countryOf.get(p)] ||= []).push(p);
  const rOf = (parties, a, b) => {
    const both = parties.filter(p => Number.isFinite(p[a]) && Number.isFinite(p[b]));
    return correlation(both.map(p => p[a]), both.map(p => p[b]));
  };
  for (const pair of ref.pairs) {
    const A = PARTY_FIELD[pair.a], B = PARTY_FIELD[pair.b];
    const boots = [];
    for (let i = 0; i < 1000; i++) {
      const sample = [];
      for (let k = 0; k < countries.length; k++) sample.push(...byCountry[countries[Math.floor(rnd() * countries.length)]]);
      const r = rOf(sample, A, B);
      if (Number.isFinite(r)) boots.push(r);
    }
    /* within each country of at least 5 parties, the sign of its own r */
    let same = 0, tot = 0;
    for (const cc of countries) {
      const ps = byCountry[cc].filter(p => Number.isFinite(p[A]) && Number.isFinite(p[B]));
      if (ps.length < 5) continue;
      const r = rOf(ps, A, B);
      if (!Number.isFinite(r)) continue;
      tot++;
      if (Math.sign(r) === Math.sign(pair.r)) same++;
    }
    const strong = Math.abs(pair.r) >= MIN_CORR;
    console.log("  " + pair.a.padEnd(14) + pair.b.padEnd(14) + "r =" + f2(pair.r) + "  n = " + pair.n + "  [" + f2(pct(boots, 0.025)) + " ," + f2(pct(boots, 0.975)) + " ]  "
      + same + "/" + tot + " countries" + (strong ? "   PATTERN" : ""));
  }

  /* 2. permutation: break the pairing of the readings and see how large |r|
     gets by chance, over all pairs at once (the largest counts, since any
     pair could have been the finding). Once across all parties, once within
     each country (keeping what a country's parties share). */
  function shuffleInside(groups, field) {
    const vals = new Map();
    for (const g of groups) {
      const idx = g.filter(p => Number.isFinite(p[field]));
      const v = idx.map(p => p[field]);
      for (let i = v.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [v[i], v[j]] = [v[j], v[i]]; }
      idx.forEach((p, i) => vals.set(p, v[i]));
    }
    return vals;
  }
  function maxNull(groups) {
    const maxes = [];
    for (let t = 0; t < perms; t++) {
      /* x stays put, every other reading (y included) is shuffled */
      const fake = ref.parties.map(p => ({ x: p.x }));
      const idx = new Map(ref.parties.map((p, i) => [p, i]));
      for (const k of READINGS.slice(1)) {
        const f = PARTY_FIELD[k];
        const vals = shuffleInside(groups, f);
        for (const [p, v] of vals) fake[idx.get(p)][f] = v;
      }
      const pairs = S.pairsOf(fake);
      maxes.push(Math.max(...pairs.map(q => Math.abs(q.r))));
    }
    return maxes;
  }
  const all = maxNull([ref.parties]);
  const within = maxNull(Object.values(byCountry));
  console.log("\nLargest |r| over all " + ref.pairs.length + " pairs when the readings are shuffled (" + perms + " runs):");
  console.log("  across all parties:   median " + f2(pct(all, 0.5)) + "  99th " + f2(pct(all, 0.99)) + "  max " + f2(Math.max(...all)));
  console.log("  inside each country:  median " + f2(pct(within, 0.5)) + "  99th " + f2(pct(within, 0.99)) + "  max " + f2(Math.max(...within)));
  console.log("  runs where any pair reaches MIN_CORR: " + all.filter(v => v >= MIN_CORR).length + " and " + within.filter(v => v >= MIN_CORR).length + " of " + perms);

  /* 3. what the block does to real parties, taken as if they were members. */
  const valuesOf = p => {
    const v = {};
    for (const k of READINGS) v[k] = Number.isFinite(p[PARTY_FIELD[k]]) ? p[PARTY_FIELD[k]] : null;
    return v;
  };
  const have = ref.parties.map(valuesOf);
  const rate = (fn) => have.filter(fn).length / have.length;
  console.log("\nReal parties read as members (" + have.length + "):");
  console.log("  with a tension, as configured: " + pc(rate(v => S.tensionOf(v, ref))));
  console.log("  sweep, share of real parties flagged (rows: largest share of parties allowed to combine the pair like the member; columns: LEAN):");
  console.log("             " + [20, 25, 30, 35, 40].map(l => String(l).padStart(7)).join(""));
  for (const rare of [0.02, 0.03, 0.05, 0.1, 1]) {
    console.log("    RARE " + String(rare).padEnd(5) + [20, 25, 30, 35, 40].map(l => pc(rate(v => S.tensionOf(v, ref, { lean: l, rare }))).padStart(7)).join(""));
  }
  console.log("  sweep on MIN_CORR (RARE and LEAN as configured): " + [0.3, 0.4, 0.5, 0.6].map(m => m + " -> " + pc(rate(v => S.tensionOf(v, ref, { minCorr: m })))).join(", "));
  console.log("  with a signature at all: " + pc(rate(v => S.signatureOf(v, ref))));

  /* 4. random members: independent readings, so no structure to find. */
  for (const [label, draw] of [["uniform on [-100, 100]", () => -100 + 200 * rnd()], ["gaussian, sd 40", () => Math.max(-100, Math.min(100, 40 * gauss()))], ["gaussian, sd 20 (centrists)", () => Math.max(-100, Math.min(100, 20 * gauss()))]]) {
    let t = 0, sig = 0, zero = 0, n = 5000;
    for (let i = 0; i < n; i++) {
      const v = {}; READINGS.forEach(k => (v[k] = Math.round(draw())));
      const tt = S.tensionOf(v, ref);
      if (tt) { t++; if (tt.n === 0) zero++; }
      if (S.signatureOf(v, ref)) sig++;
    }
    console.log("\nRandom members, " + label + ", all six readings (" + n + "):");
    console.log("  tension " + pc(t / n) + " (\"none\" for the parties in " + pc(zero / Math.max(1, t)) + " of those); any signature " + pc(sig / n));
  }

  /* 5. stability: does a tension survive the noise a short questionnaire
     leaves on a reading? Every reading of a real party is nudged (sd 10). */
  {
    let flagged = 0, kept = 0, anyKept = 0;
    for (const v of have) {
      const t = S.tensionOf(v, ref);
      if (!t) continue;
      for (let i = 0; i < 20; i++) {
        const w = {}; for (const k of READINGS) w[k] = v[k] === null ? null : v[k] + 10 * gauss();
        const u = S.tensionOf(w, ref);
        flagged++;
        if (u && u.a === t.a && u.b === t.b) kept++;
        if (u) anyKept++;
      }
    }
    console.log("\nA tension found on a real party stays the same pair after noise of sd 10 in " + pc(kept / Math.max(1, flagged)) + " of runs, and some tension survives in " + pc(anyKept / Math.max(1, flagged)));
    /* and the other way: a real party with none, given noise, gets one? */
    let clean = 0, gained = 0;
    for (const v of have) {
      if (S.tensionOf(v, ref)) continue;
      for (let i = 0; i < 20; i++) {
        const w = {}; for (const k of READINGS) w[k] = v[k] === null ? null : v[k] + 10 * gauss();
        clean++;
        if (S.tensionOf(w, ref)) gained++;
      }
    }
    console.log("A real party with none gets one from that noise in " + pc(gained / Math.max(1, clean)) + " of runs");
  }

  /* 6. standout and blend: does the pick depend on the band? */
  {
    const pick = (v, band) => {
      const near = READINGS.filter(k => v[k] !== null).map(k => {
        const f = PARTY_FIELD[k]; let m = 0, n = 0;
        for (const p of ref.parties) if (Number.isFinite(p[f])) { m++; if (Math.abs(p[f] - v[k]) <= band) n++; }
        return { k, s: n / m };
      });
      if (near.length < 2) return null;
      near.sort((a, b) => a.s - b.s);
      return { lo: near[0].k, hi: near[near.length - 1].k, gap: near[near.length - 1].s - near[0].s };
    };
    const full = have.filter(v => READINGS.every(k => v[k] !== null));
    console.log("\nStandout and blend, on the " + full.length + " parties carrying all six readings:");
    for (const band of [10, 15, 20]) {
      const a = full.map(v => pick(v, band)), b = full.map(v => pick(v, BAND));
      const same = a.filter((x, i) => x.lo === b[i].lo).length, sameHi = a.filter((x, i) => x.hi === b[i].hi).length;
      console.log("  band " + band + " vs " + BAND + ": same standout " + pc(same / full.length) + ", same blend " + pc(sameHi / full.length));
    }
    const gaps = full.map(v => pick(v, BAND).gap);
    console.log("  gap between blend and standout (share of parties): median " + f2(pct(gaps, 0.5)) + ", 10th " + f2(pct(gaps, 0.1)) + "; below MIN_GAP: " + pc(gaps.filter(g => g < MIN_GAP).length / gaps.length));
    const count = {}; full.forEach(v => { const k = pick(v, BAND).lo; count[k] = (count[k] || 0) + 1; });
    console.log("  standout reading by frequency: " + Object.entries(count).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + " " + n).join(", "));
  }
})();
