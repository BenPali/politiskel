#!/usr/bin/env node
"use strict";
/* Checks the "Pour rire" catalogue and its matching:

     node tools/fun-check.js

   No test framework, like tools/model-check.js: each check prints, a failure
   sets the exit code. It covers what would make the page dishonest or
   broken:

     - every figure is valid: required fields, ranges, unique ids, only the
       dead (a death year in the past, after the birth year), a Wikipedia
       pointer, a one-sentence basis that names each coordinate and each
       secondary reading it carries, a French role in the locale table;
     - nobody on the exclusion list is in it (the rule is in figures.js);
     - the matching is sane: a figure matches itself, the nearest wins, a
       profile with no place matches nothing, secondary readings only count
       when both sides carry one and a null is ignored, ties are reported as
       ties, a low-confidence figure is weighted down;
     - a reading built from a single questionnaire answer never reaches the
       matching (coords() gates it, through firm() and MIN_PER_DIM);
     - the fun modules stay apart from the badges, the passport, the share
       cards and the board.

   The site's `$lib/` alias is resolved here by a module hook, so that the
   locale table and compass/model.js load in Node as they do in Vite. */

const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const Module = require("module");

const SITE_LIB = path.join(__dirname, "..", "site", "src", "lib");
Module.registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("$lib/")) {
      return nextResolve(pathToFileURL(path.join(SITE_LIB, specifier.slice(5))).href, context);
    }
    return nextResolve(specifier, context);
  }
});

let failures = 0, checks = 0;
function check(name, ok, detail) {
  checks++;
  if (!ok) {
    failures++;
    console.log("FAIL  " + name + (detail ? " : " + detail : ""));
  }
}
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

/* People who must never appear: leaders who founded or ran a regime or an
   apparatus responsible for genocide, mass killing or man-made famine, and
   the borderline cases left out by caution (see the rule in figures.js). */
const EXCLUDED = [
  "hitler", "himmler", "goebbels", "goering", "mussolini", "stalin", "mao", "pol-pot", "pol pot", "kim il", "kim jong",
  "lenin", "trotsky", "trotski", "robespierre", "napoleon", "franco", "pinochet", "videla", "leopold", "petain", "pétain",
  "khomeini", "deng xiaoping", "ceausescu", "ceaușescu", "hoxha", "mengistu", "idi amin", "suharto", "salazar", "kissinger"
];

async function main() {
  const { FIGURES } = await import("../site/src/lib/fun/figures.js");
  const M = await import("../site/src/lib/fun/match.js");
  const { L } = await import("../site/src/lib/i18n/fr.js");
  const { coords } = await import("../site/src/lib/compass/model.js");
  const Quiz = globalThis.PolitiQuiz;

  /* ---- the catalogue ---- */
  const THIS_YEAR = new Date().getFullYear();
  const CONF = new Set(["high", "medium", "low"]);
  const KEYS = new Set(["id", "name", "born", "died", "x", "y", "readings", "confidence", "wiki", "basis"]);
  const ids = new Set();
  const isInt = Number.isInteger;

  check("catalogue size is in the range promised", FIGURES.length >= 80 && FIGURES.length <= 120, "n = " + FIGURES.length);

  for (const f of FIGURES) {
    const at = (m) => f.id + ": " + m;
    check(at("only known fields"), Object.keys(f).every((k) => KEYS.has(k)), Object.keys(f).filter((k) => !KEYS.has(k)).join(","));
    check(at("id is a slug"), typeof f.id === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.id));
    check(at("id is unique"), !ids.has(f.id));
    ids.add(f.id);
    check(at("name"), typeof f.name === "string" && f.name.trim().length > 2);
    check(at("dead: a death year is required"), isInt(f.died) && isInt(f.born));
    check(at("dead: died before this year"), f.died < THIS_YEAR, "died " + f.died);
    check(at("life is plausible"), f.died > f.born && f.died - f.born <= 105, f.born + "-" + f.died);
    check(at("no living-person flag"), !("living" in f) && !("alive" in f));
    check(at("x and y are integers in [-100, 100]"),
      isInt(f.x) && isInt(f.y) && Math.abs(f.x) <= 100 && Math.abs(f.y) <= 100, f.x + "," + f.y);
    check(at("confidence"), CONF.has(f.confidence));
    check(at("wikipedia title"), typeof f.wiki === "string" && f.wiki.length > 2 && !/[_/]|http/.test(f.wiki));
    check(at("basis is a single sentence"), typeof f.basis === "string" && f.basis.length > 40 && f.basis.length < 560
      && /\.$/.test(f.basis) && !/\.\s+[A-Z]/.test(f.basis.replace(/\b[A-Z]\.(?=\s)/g, "").replace(/\bJr\./g, "Jr")), f.basis && f.basis.slice(-60));
    check(at("basis names the economy"), /economy/i.test(f.basis));
    check(at("basis names the society"), /society/i.test(f.basis));
    check(at("no em dash"), !/—/.test(f.basis + f.name));
    check(at("readings is an object"), f.readings && typeof f.readings === "object");
    for (const [k, v] of Object.entries(f.readings || {})) {
      check(at("reading " + k + " is known"), M.READINGS.includes(k));
      check(at("reading " + k + " in range"), isInt(v) && Math.abs(v) <= 100, String(v));
      const word = { europe: /europe/i, pacifism: /pacifis/i, populism: /populis/i, ecology: /ecolog/i }[k];
      check(at("basis justifies reading " + k), word && word.test(f.basis));
    }
    check(at("role in the locale table"), typeof L.figures.roles[f.id] === "string" && L.figures.roles[f.id].length > 5);
    check(at("role has no em dash"), !/—/.test(L.figures.roles[f.id] || ""));
    const hay = (f.id + " " + f.name).toLowerCase();
    check(at("not on the exclusion list"), !EXCLUDED.some((e) => hay.includes(e)));
  }
  for (const id of Object.keys(L.figures.roles)) check("role " + id + " has a figure", ids.has(id));

  /* the locale copy of the page */
  const copy = JSON.stringify(L.figures);
  check("figures copy has no em dash", !/—/.test(copy));
  check("copy never calls anarchism libertarianism", !/libertarisme/i.test(copy));

  /* ---- the modules stay apart ---- */
  const FORBIDDEN = /badges|passport|share|board|session/i;
  for (const file of ["figures.js", "match.js"]) {
    const src = fs.readFileSync(path.join(SITE_LIB, "fun", file), "utf8");
    const imports = [...src.matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1]);
    check(file + " imports nothing of the badges, passport, share cards or board", imports.every((i) => !FORBIDDEN.test(i)), imports.join(" "));
  }
  const page = fs.readFileSync(path.join(SITE_LIB, "..", "routes", "boussole", "[membre]", "fun", "+page.svelte"), "utf8");
  check("the page never touches the compass's drawing or the badges", !/Compass\.svelte|BadgeShelf|PassportBook|ShareSheet/.test(page));

  /* ---- matching on the real catalogue ---- */
  const limits = M.limitsOf();
  check("limits are the model's: near < far and a positive tie", limits.near > 0 && limits.far > limits.near && limits.tie > 0, JSON.stringify(limits));

  check("no position on x: no match", M.matchProfile({ x: null, y: 10, readings: {} }) === null);
  check("no position on y: no match", M.matchProfile({ x: 10, y: null, readings: {} }) === null);
  check("nothing at all: no match", M.matchProfile({}) === null && M.matchProfile(null) === null);
  check("NaN coordinates: no match", M.matchProfile({ x: NaN, y: 0 }) === null);

  for (const f of FIGURES) {
    const r = M.matchProfile({ x: f.x, y: f.y, readings: f.readings });
    const top = r.tied.map((t) => t.figure.id);
    check(f.id + " matches itself, or ties with a neighbour that is truly as close", top.includes(f.id), top.join(","));
    check(f.id + " on itself is near", r.fit === "near");
  }

  const all = M.matchProfile({ x: 0, y: 0, readings: {} });
  check("ranking covers the whole catalogue", all.ranked.length === FIGURES.length);
  check("ranking is sorted by adjusted distance", all.ranked.every((r, i, a) => i === 0 || a[i - 1].score <= r.score));
  check("percentiles are in [0, 100]", all.tied.concat([all.second]).every((r) => r.percentile >= 0 && r.percentile <= 100));
  const a1 = M.matchProfile({ x: -40, y: -50, readings: {} }), a2 = M.matchProfile({ x: -40, y: -50, readings: {} });
  check("deterministic", a1.best.figure.id === a2.best.figure.id && near(a1.best.score, a2.best.score));

  const corner = M.matchProfile({ x: -100, y: 100, readings: {} });
  check("a profile far from everyone is reported far, and still gets a nearest figure", corner.fit === "far" && corner.best.figure);
  const far = M.matchProfile({ x: -100, y: 100, readings: {} });
  const nearOwn = M.matchProfile({ x: FIGURES[0].x, y: FIGURES[0].y, readings: {} });
  check("percentile falls with distance", far.best.percentile < nearOwn.best.percentile,
    far.best.percentile + " vs " + nearOwn.best.percentile);

  /* ---- matching on a synthetic catalogue: exact expectations ---- */
  const fig = (id, x, y, readings = {}, confidence = "high") => ({ id, name: id, born: 1800, died: 1900, x, y, readings, confidence, wiki: id, basis: "b" });
  const S = [fig("a", 0, 0), fig("b", 30, 0), fig("c", 0, 40), fig("d", 60, 60), fig("e", -50, -50)];
  const sl = M.limitsOf(S);

  const hit = M.matchProfile({ x: 2, y: 1, readings: {} }, S);
  check("the nearest wins", hit.best.figure.id === "a" && !hit.tie && hit.tied.length === 1);
  check("second is the next nearest", hit.second.figure.id === "b");

  /* a tie: the profile sits exactly between a and b on the x axis */
  const mid = M.matchProfile({ x: 15, y: 0, readings: {} }, S);
  check("equidistant profile is a tie", mid.tie === true && mid.tied.length === 2, "gap " + (mid.second.score - mid.best.score));
  check("a tie lists both, first the one with the lower id", mid.tied[0].figure.id === "a" && mid.tied[1].figure.id === "b");
  /* just past the tie limit it is a match again */
  const off = M.matchProfile({ x: 15 - (sl.tie + 2) / 2, y: 0, readings: {} }, S);
  check("a gap above the tie limit is a match", off.tie === false && off.best.figure.id === "a", "tie " + sl.tie);
  /* just inside it it is still a tie */
  const inside = M.matchProfile({ x: 15 - sl.tie / 2, y: 0, readings: {} }, S);
  check("a gap at the tie limit is a tie", inside.tie === true);

  /* null readings are ignored */
  const R = [fig("p", 0, 0, { populism: 80 }), fig("q", 0, 0, {})];
  const noReadings = M.distance({ x: 10, y: 0, readings: {} }, R[0]);
  check("no reading on the profile: distance is the axes'", near(noReadings.d, 10) && noReadings.shared.length === 0);
  const nullProfile = M.distance({ x: 10, y: 0, readings: { populism: null, europe: null } }, R[0]);
  check("null readings on the profile are ignored", near(nullProfile.d, 10) && nullProfile.shared.length === 0);
  const nanProfile = M.distance({ x: 10, y: 0, readings: { populism: NaN } }, R[0]);
  check("NaN readings are ignored", near(nanProfile.d, 10) && nanProfile.shared.length === 0);
  const noFigureReading = M.distance({ x: 10, y: 0, readings: { populism: 80 } }, R[1]);
  check("a figure without the reading is left as the axes place it", near(noFigureReading.d, 10) && noFigureReading.shared.length === 0);
  const agree = M.distance({ x: 10, y: 0, readings: { populism: 80 } }, R[0]);
  const clash = M.distance({ x: 10, y: 0, readings: { populism: -80 } }, R[0]);
  check("an agreeing reading brings a figure closer, a clashing one pushes it away", agree.d < 10 && clash.d > 10, agree.d + " / " + clash.d);
  check("readings refine, they never override: at most about half again on the axes",
    clash.d < 10 * 1.4 && agree.d > 10 * 0.7, agree.d + " / " + clash.d);
  check("readings count only where both sides carry one", agree.shared.join() === "populism");
  /* the readings decide between two figures the axes cannot separate */
  const T = [fig("pop", 0, 0, { populism: 90 }), fig("rep", 0, 0, { populism: -90 })];
  const byReading = M.matchProfile({ x: 20, y: 0, readings: { populism: 85 } }, T);
  check("readings separate two figures on the same point", byReading.best.figure.id === "pop" && byReading.second.figure.id === "rep");
  const byNothing = M.matchProfile({ x: 20, y: 0, readings: { populism: null } }, T);
  check("with the reading null they stay tied", byNothing.tie === true);

  /* a reading cannot move a far figure ahead of a near one */
  const U = [fig("near", 10, 0, { populism: -90 }), fig("far", 40, 0, { populism: 90 })];
  const stay = M.matchProfile({ x: 0, y: 0, readings: { populism: 90 } }, U);
  check("a reading does not carry a distant figure over a near one", stay.best.figure.id === "near");

  /* confidence weighting: a low-confidence figure must be clearly closer */
  const C = [fig("sure", 20, 0, {}, "high"), fig("shaky", 18, 0, {}, "low")];
  const weighted = M.matchProfile({ x: 0, y: 0, readings: {} }, C);
  check("a slightly closer low-confidence figure does not win", weighted.best.figure.id === "sure");
  const C2 = [fig("sure", 40, 0, {}, "high"), fig("shaky", 10, 0, {}, "low")];
  check("a much closer low-confidence figure still wins, flagged", M.matchProfile({ x: 0, y: 0, readings: {} }, C2).best.figure.id === "shaky"
    && M.matchProfile({ x: 0, y: 0, readings: {} }, C2).lowConfidence === true);
  check("the confidence factors run from high to low", M.CONFIDENCE_FACTOR.high === 1 && M.CONFIDENCE_FACTOR.low > M.CONFIDENCE_FACTOR.medium && M.CONFIDENCE_FACTOR.medium > 1);

  /* percentile: closer than the other figures are to that figure */
  const P = [fig("f", 0, 0), fig("g", 10, 0), fig("h", 20, 0), fig("i", 30, 0), fig("j", 40, 0)];
  check("percentile: a profile on the figure is closer than all others", M.percentileOf({ x: 0, y: 0, readings: {} }, P[0], P) === 100);
  check("percentile: closer than the three of four others that lie beyond 15", M.percentileOf({ x: 15, y: 0, readings: {} }, P[0], P) === 75, String(M.percentileOf({ x: 15, y: 0, readings: {} }, P[0], P)));
  check("percentile: farther than everyone is 0", M.percentileOf({ x: 100, y: 0, readings: {} }, P[0], P) === 0);

  /* ---- the questionnaire's gate: one answer never reaches the matching ---- */
  const answersFor = (themes, perDim, only) => {
    const out = {};
    for (const t of themes) {
      const seen = {};
      for (const item of Quiz.askedItems(t)) {
        const dimKey = item.reading + "/" + item.dim;
        if (only && item.reading !== only) continue;
        seen[dimKey] = (seen[dimKey] || 0) + 1;
        if (seen[dimKey] <= perDim) out[item.id] = 0;
      }
    }
    return out;
  };
  const full = coords({ alias: "t", answers: answersFor(["economy", "society", "institutions"], Quiz.MIN_PER_DIM) });
  check("a member with the economy, society and institutions themes has a place", full.x !== null && full.y !== null);
  check("and a populism reading, built from enough answers", Number.isFinite(full.readings.populism));
  const withPop = M.matchProfile(full);
  check("that reading reaches the matching", withPop.best.shared.includes("populism") || withPop.ranked.some((r) => r.shared.includes("populism")));

  const thin = coords({
    alias: "t",
    answers: Object.assign(answersFor(["economy", "society"], Quiz.MIN_PER_DIM), answersFor(["institutions"], 1, "people"))
  });
  check("a single answer per group leaves the populism reading null", thin.readings.populism === null);
  const thinMatch = M.matchProfile(thin);
  check("and it never reaches the matching", thinMatch.ranked.every((r) => !r.shared.includes("populism")));

  const noAxes = coords({ alias: "t", answers: {} });
  check("a member with no answer has no match", M.matchProfile(noAxes) === null);

  if (failures) {
    console.log("\n" + failures + " of " + checks + " checks failed");
    process.exit(1);
  }
  console.log("fun-check: " + checks + " checks passed, " + FIGURES.length + " figures");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
