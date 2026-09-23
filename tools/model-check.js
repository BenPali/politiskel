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

   The same goes for the questionnaire, whose answers come in as files
   exported from the page and dropped in politi-results/answers/: whether the
   class readings repeat x, whether a sub-dimension of y parts from the rest,
   whether an item runs against its own axis. Only real answers can say.

   Reads profiles-data.js, which is generated and ignored by git. Nothing is
   written and nothing leaves the machine. */

const fs = require("fs");
const path = require("path");
const M = require("./politi-model.js");
const Q = require("./politi-quiz.js");

const DATA = path.join(__dirname, "..", "profiles-data.js");
if (!fs.existsSync(DATA)) {
  console.error("profiles-data.js not found — run node tools/extract.js first");
  process.exit(1);
}
/* Run, not sliced: the file holds two arrays, the profiles and the answers. */
const sandbox = { window: {} };
require("vm").runInNewContext(fs.readFileSync(DATA, "utf8"), sandbox);
const profiles = sandbox.window.POLITI_PROFILES || [];
const answerFiles = sandbox.window.POLITI_ANSWERS || [];
const N = profiles.length;

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

/* The PolitiScales checks need the screenshots; the questionnaire ones, the
   answer files. Either can run without the other. */
function politiscalesChecks() {
if (N < 4) {
  console.log(N + " PolitiScales profile(s): a correlation needs at least 4 — skipped\n");
  return;
}
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

}

/* ---------------------------------------------------------- questionnaire */

/* Pairs where both values exist: answers are optional, so each correlation
   runs on the profiles that answered both sides, and says how many. */
function pairwise(a, b) {
  const x = [], y = [];
  a.forEach((v, i) => { if (v !== null && b[i] !== null) { x.push(v); y.push(b[i]); } });
  return { x, y, n: x.length };
}
const mean = xs => xs.reduce((s, v) => s + v, 0) / xs.length;

function line(label, a, b, readVerdict) {
  const { x, y, n } = pairwise(a, b);
  if (n < 4) return "  " + label + "  n = " + n + "   too few answers";
  const r = corr(x, y);
  if (!Number.isFinite(r)) return "  " + label + "  n = " + n + "   no spread — everyone answered alike";
  const [lo, hi] = interval(r, n);
  return "  " + label + "  n =" + String(n).padStart(3) + "   r =" + f2(r)
    + "   95% [" + f2(lo) + " ," + f2(hi) + " ]" + (readVerdict ? "   " + readVerdict(r, lo, hi) : "");
}

/* An item or a sub-dimension belongs with its axis when it moves with the
   rest of that axis. Read on the interval, like everything here: below 0.2
   at the top of the interval it does not, established; a clear positive
   bottom, it does. */
function belongs(r, lo, hi) {
  if (hi < 0.2) return "does not go with the rest — established";
  if (lo > 0.2) return "goes with the rest — established";
  return "too few answers to conclude";
}

function questionnaireChecks() {
  const rows = answerFiles.map(a => {
    const p = a.source && profiles.find(q => q.source === a.source);
    return { alias: a.alias, answers: a.answers,
             ps: p ? M.coords(p.values) : null,
             eco: Q.score(a.answers, "economy"), soc: Q.score(a.answers, "society") };
  });
  console.log("\nQuestionnaire: " + rows.length + " answer file(s) in politi-results/answers/");
  if (rows.length < 4) {
    console.log("  a correlation needs at least 4 — export answers from the page first");
    return;
  }

  const col = f => rows.map(r => { const v = f(r); return v === null || v === undefined ? null : v; });

  console.log("\nDo the economy's other readings repeat x?   (|r| >= " + REDUNDANT + " counts as repeating)");
  for (const [label, key] of [["protectionism", "protectionism"], ["class (Wright)", "class"],
                              ["class conflict", "conflict"], ["capital/labour", "labour"]])
    console.log(line((label + " vs x").padEnd(24), col(r => r.eco[key]), col(r => r.eco.x), verdict));

  console.log("\nPolitiScales against the questionnaire, same people:");
  for (const [label, ps, qz] of [["x", r => r.ps && r.ps.x, r => r.eco.x],
                                 ["y", r => r.ps && r.ps.y, r => r.soc.y]]) {
    const { x, y, n } = pairwise(col(ps), col(qz));
    console.log(line(("PolitiScales " + label + " vs Politiskel " + label).padEnd(24), col(ps), col(qz))
      + (n ? "   mean shift " + Math.round(mean(y.map((v, i) => v - x[i]))) : ""));
  }

  /* Each sub-dimension against the mean of the others on its axis. */
  for (const theme of Q.THEMES.filter(t => !t.planned)) {
    const axis = theme.axis, sc = theme.key === "economy" ? "eco" : "soc";
    console.log("\n" + theme.key + ": each sub-dimension against the rest of " + axis);
    for (const d of theme.dims) {
      const rest = rows.map(r => {
        const others = theme.dims.filter(o => o !== d).map(o => r[sc].dims[o]).filter(v => v !== null);
        return others.length ? mean(others) : null;
      });
      console.log(line(d.padEnd(24), col(r => r[sc].dims[d]), rest, belongs));
    }
  }

  /* Each asked item against the rest of its axis, oriented, so a negative r
     means the item pulls the other way from the axis it is scored on. */
  /* Only the items that do not belong are worth a line each; the rest are
     counted. */
  console.log("\nItems against the rest of their axis:");
  const tally = { goes: 0, open: 0, thin: 0 };
  for (const theme of Q.THEMES.filter(t => !t.planned)) {
    const items = Q.askedItems(theme.key).filter(i => i.reading === theme.axis);
    const val = (r, i) => Q.itemValue(i, r.answers[i.id]);
    for (const it of items) {
      const own = rows.map(r => val(r, it));
      const rest = rows.map(r => {
        const vs = items.filter(o => o !== it).map(o => val(r, o)).filter(v => v !== null);
        return vs.length ? mean(vs) : null;
      });
      const { x, y, n } = pairwise(own, rest);
      const rr = n >= 4 ? corr(x, y) : NaN;
      if (!Number.isFinite(rr)) { tally.thin++; continue; }
      const [lo, hi] = interval(rr, n);
      const v = belongs(rr, lo, hi);
      if (v.startsWith("does not")) console.log(line(it.id.padEnd(24), own, rest, belongs));
      else if (v.startsWith("goes")) tally.goes++;
      else tally.open++;
    }
  }
  console.log("  " + tally.goes + " go with their axis, " + tally.open + " too few answers to conclude, "
    + tally.thin + " not answered enough (or answered alike) to test");
}

politiscalesChecks();
questionnaireChecks();

if (N < 30 || answerFiles.length < 30) {
  console.log("\nUnder 30 profiles, only a clear repetition can be established; showing that"
    + "\na readout adds information takes more answers than a group usually has.");
}
