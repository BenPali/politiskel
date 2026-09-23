#!/usr/bin/env node
"use strict";
/* Checks the model against the profiles you actually have.

     node tools/extract.js        # first, to build profiles-data.js
     node tools/model-check.js

   Two readouts on the page, "Souv." and "Écolo.", are shown beside the axes
   as if they said something the axes do not. Whether they do depends on how
   people answer: the more coherently someone answers from one axis to the
   next, the more those columns repeat the axes. Synthetic profiles cannot
   settle it — whoever generates them picks their coherence, and with it the
   answer. Real answers can.

   Every correlation comes with its 95% interval, and the verdict is read off
   the interval, not the point: with ten profiles a correlation of 0.7 is
   compatible with almost anything, and printing "0.7" alone would pass noise
   off as a finding.

   Reads profiles-data.js, which is generated and ignored by git. Nothing is
   written and nothing leaves the machine. */

const fs = require("fs");
const path = require("path");
const M = require("./politi-model.js");

const DATA = path.join(__dirname, "..", "profiles-data.js");
if (!fs.existsSync(DATA)) {
  console.error("profiles-data.js not found — run node tools/extract.js first");
  process.exit(1);
}
const src = fs.readFileSync(DATA, "utf8");
const profiles = JSON.parse(src.slice(src.indexOf("["), src.lastIndexOf("]") + 1));
const N = profiles.length;
if (N < 4) {
  console.error(N + " profile(s): a correlation needs at least 4, and means little under 30");
  process.exit(1);
}

/* A readout counts as repeating an axis when |r| is at least this. */
const REDUNDANT = 0.8;

function corr(a, b) {
  const n = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma, y = b[i] - mb;
    num += x * y; da += x * x; db += y * y;
  }
  return da && db ? num / Math.sqrt(da * db) : NaN;
}

/* Fisher transform: the usual interval for a correlation, and a wide one at
   small n — which is the point of printing it. */
function interval(r, n) {
  const z = Math.atanh(Math.max(-0.9999, Math.min(0.9999, r)));
  const se = 1 / Math.sqrt(n - 3);
  return [Math.tanh(z - 1.96 * se), Math.tanh(z + 1.96 * se)];
}

/* Read on |r|, since a readout can mirror an axis with either sign. */
function verdict(r, lo, hi) {
  const [a, b] = r >= 0 ? [lo, hi] : [-hi, -lo];
  if (a >= REDUNDANT) return "repeats the axis — established";
  if (b < REDUNDANT) return "adds information — established";
  return "too few profiles to conclude";
}

const f2 = v => (v >= 0 ? " " : "") + v.toFixed(2);
const cs = profiles.map(p => M.coords(p.values));

console.log(N + " profiles\n");
console.log("Does a readout repeat an axis?   (|r| >= " + REDUNDANT + " counts as repeating)");
for (const [label, a, b] of [
  ["Souv.  vs Y (social)  ", cs.map(c => c.sov), cs.map(c => c.y)],
  ["Écolo. vs X (economic)", cs.map(c => c.ecol), cs.map(c => c.x)]
]) {
  const r = corr(a, b);
  const [lo, hi] = interval(r, N);
  console.log("  " + label + "  r =" + f2(r) + "   95% [" + f2(lo) + " ," + f2(hi) + " ]   "
    + verdict(r, lo, hi));
}

/* The parameter underneath both: how much the four social components move
   together. Synthetic runs put the Souv. column at 0.39 against Y when they
   do not at all and 0.96 when they move like a party's positions. */
const Y_PAIRS = M.AXES.filter(a => a.axis === "y").map(a => [a.neg[0], a.pos[0]]);
const leans = Y_PAIRS.map(([neg, pos]) =>
  profiles.map(p => (Number(p.values[pos]) || 0) - (Number(p.values[neg]) || 0)));
const pairs = [];
for (let i = 0; i < leans.length; i++)
  for (let j = i + 1; j < leans.length; j++) pairs.push(corr(leans[i], leans[j]));
const coherence = pairs.reduce((s, v) => s + v, 0) / pairs.length;
console.log("\nCoherence of the four social components: mean r =" + f2(coherence)
  + "  (0 = answered independently, 1 = in lockstep)");

/* How many of these attachments are toss-ups, country by country. */
console.log("\nNearest reference within the tie band (runner-up close behind):");
for (const c of M.COUNTRIES) {
  const limits = M.limitsFor(c.parties);
  const ties = [];
  cs.forEach((co, i) => {
    const n = M.nearestReference(co.x, co.y, c.parties, limits);
    if (n.margin <= limits.tie)
      ties.push(profiles[i].alias + " (" + n.name + " / " + n.second.name + ", " + n.margin + " pt)");
  });
  console.log("  " + c.code + "  " + ties.length + "/" + N
    + (ties.length ? "   " + ties.join(" · ") : ""));
}

if (N < 30) {
  console.log("\nUnder 30 profiles, only a clear repetition can be established; showing that"
    + "\na readout adds information takes more answers than a group usually has.");
}
