#!/usr/bin/env node
"use strict";
/* Tests for the signature block's logic (site/src/lib/compass/signature.js).

     node tools/signature-test.js

   No framework: each check prints its own line, and the exit code is 1 if
   any failed. The party data is the repo's own, so the checks that name a
   pair assert what the rule promises about it rather than a number that
   would go stale with the next CHES wave. */

const path = require("path");
const { pathToFileURL } = require("url");
const M = require("./politi-model.js");
const Q = require("./politi-quiz.js");

let failed = 0;
function check(name, ok, detail) {
  if (!ok) failed++;
  console.log((ok ? "  ok    " : "  FAIL  ") + name + (ok || detail === undefined ? "" : "  " + JSON.stringify(detail)));
}
const sign = v => (v > 0 ? 1 : v < 0 ? -1 : 0);

(async () => {
  const S = await import(pathToFileURL(path.join(__dirname, "..", "site", "src", "lib", "compass", "signature.js")).href);
  const ref = S.referenceOf(M.COUNTRIES);

  console.log("The reference");
  check("only surveyed parties, no hand estimate", ref.parties.length > 200 && ref.parties.every(p => p.src === "ches"));
  check("every pair of readings that has parties is listed once", ref.pairs.length === 15 && new Set(ref.pairs.map(p => p.a + p.b)).size === 15);
  check("correlations are within [-1, 1]", ref.pairs.every(p => p.r >= -1 && p.r <= 1));
  const yEco = ref.pairs.find(p => p.a === "y" && p.b === "ecology");
  check("society and ecology go against each other among parties", yEco && yEco.r < -0.5, yEco);

  console.log("\nA centrist has no tension");
  const centrist = { x: 5, y: -10, protectionism: 0, europe: 15, ecology: 10, people: -20 };
  check("nothing marked, nothing found", S.tensionOf(centrist, ref) === null);
  const c2 = S.signatureOf(centrist, ref);
  check("no tension in the signature either", !c2 || c2.tension === null, c2);
  check("just under the lean on every reading is still none", S.tensionOf(Object.fromEntries(S.READINGS.map(k => [k, S.LEAN - 1])), ref) === null);
  check("lean on one reading only is none", S.tensionOf({ x: 90, y: 0, protectionism: 0, europe: 0, ecology: 0, people: 0 }, ref) === null);

  console.log("\nA profile that goes against the pattern has one");
  /* society (tradition) and ecology (environment first) are at r = -0.89
     among parties: the member who is both sits where almost no party does */
  const contrarian = { y: 80, ecology: 80 };
  const t = S.tensionOf(contrarian, ref);
  check("a tension is found", !!t, t);
  check("it is the pair the member combines against", t && t.a === "y" && t.b === "ecology", t);
  check("it is against the pattern: signs oppose the correlation", t && sign(t.va) * sign(t.vb) === -sign(t.r), t);
  check("few parties combine it like that", t && t.n / t.m <= S.RARE, t);
  check("the counts are parties out of those carrying both readings", t && t.m > S.MIN_PARTIES && t.n >= 0, t);
  const mirrored = S.tensionOf({ y: -80, ecology: -80 }, ref);
  check("the mirror image is one too", mirrored && mirrored.a === "y" && mirrored.b === "ecology", mirrored);
  check("the same two, following the pattern, are none", S.tensionOf({ y: 80, ecology: -80 }, ref) === null);
  const sig = S.signatureOf({ y: 80, ecology: 80, x: 0 }, ref);
  check("the signature carries it", sig && sig.tension && sig.tension.a === "y", sig);

  console.log("\nEvery tension the rule finds honours the rule");
  let bad = 0, found = 0;
  const seedRnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let i = 0; i < 3000; i++) {
    const v = {};
    for (const k of S.READINGS) v[k] = seedRnd() < 0.2 ? null : Math.round(-100 + 200 * seedRnd());
    const u = S.tensionOf(v, ref);
    if (!u) continue;
    found++;
    const pair = ref.pairs.find(p => p.a === u.a && p.b === u.b);
    if (!(Math.abs(pair.r) >= S.MIN_CORR) || Math.abs(u.va) < S.LEAN || Math.abs(u.vb) < S.LEAN
      || sign(u.va) * sign(u.vb) !== -sign(pair.r) || u.n / u.m > S.RARE || v[u.a] !== u.va || v[u.b] !== u.vb) bad++;
  }
  check("no tension breaks a constant (" + found + " found in 3000 draws)", found > 0 && bad === 0, { bad });

  console.log("\nNoise is not a tension");
  /* the same parties with each reading shuffled among them: no pattern is
     left, so no pair may pass MIN_CORR and no member may get a tension */
  const rnd2 = (() => { let s = 99; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  let anyPair = 0, anyTension = 0;
  for (let run = 0; run < 100; run++) {
    const fake = ref.parties.map(p => ({ x: p.x }));
    for (const k of S.READINGS.slice(1)) {
      const f = S.PARTY_FIELD[k];
      const idx = ref.parties.map((p, i) => i).filter(i => Number.isFinite(ref.parties[i][f]));
      const vals = idx.map(i => ref.parties[i][f]);
      for (let i = vals.length - 1; i > 0; i--) { const j = Math.floor(rnd2() * (i + 1)); [vals[i], vals[j]] = [vals[j], vals[i]]; }
      idx.forEach((i, n) => (fake[i][f] = vals[n]));
    }
    const noise = { parties: fake, pairs: S.pairsOf(fake) };
    if (noise.pairs.some(p => Math.abs(p.r) >= S.MIN_CORR)) anyPair++;
    for (let i = 0; i < 20; i++) {
      const v = {}; for (const k of S.READINGS) v[k] = Math.round(-100 + 200 * rnd2());
      if (S.tensionOf(v, noise)) anyTension++;
    }
  }
  check("no shuffled reference reaches MIN_CORR (100 shuffles)", anyPair === 0, { anyPair });
  check("so no member gets a tension against it (2000 members)", anyTension === 0, { anyTension });

  console.log("\nMissing readings are safe");
  check("no values", S.signatureOf({}, ref) === null);
  check("undefined values", S.signatureOf(undefined, ref) === null);
  check("no reference", S.signatureOf({ x: 50, y: 50 }, null) === null);
  check("an empty reference", S.signatureOf({ x: 50, y: 50 }, { parties: [], pairs: [] }) === null);
  check("nulls and NaN are ignored", S.signatureOf({ x: null, y: NaN, europe: undefined, ecology: null }, ref) === null);
  check("one reading alone has no standout, no blend, no tension", S.signatureOf({ x: 90 }, ref) === null);
  check("strings are not readings", S.tensionOf({ y: "80", ecology: "80" }, ref) === null);
  check("a tension needs both readings", S.tensionOf({ y: 80, ecology: null }, ref) === null && S.tensionOf({ y: 80 }, ref) === null);
  check("a reading missing elsewhere does not hide a pair", S.tensionOf({ y: 80, ecology: 80, people: null }, ref)?.b === "ecology");
  check("readingsOf(null) is empty", Object.keys(S.readingsOf(null, 2)).length === 0);
  const empty = S.readingsOf({ x: null, y: null }, 2);
  check("readingsOf with nothing is all null", S.READINGS.every(k => empty[k] === null || empty[k] === undefined) || Object.values(empty).every(v => v === null), empty);
  check("no Europe reading is a null, not a crash", S.readingsOf({ x: 10, y: 10, eu: null, quiz: null }, 2).europe === null);

  console.log("\nStandout and blend");
  const s = S.signatureOf({ x: 0, y: 0, europe: 90, ecology: -90, protectionism: 10, people: -10 }, ref);
  check("both are found, on two different readings", s && s.standout && s.blend && s.standout.key !== s.blend.key, s);
  check("the standout has fewer parties near than the blend", s && s.standout.share < s.blend.share, s);
  check("they differ by at least MIN_GAP", s && s.blend.share - s.standout.share >= S.MIN_GAP, s);
  check("n and m are parties", s && s.standout.n <= s.standout.m && s.standout.m > 0, s);
  /* on a reading only two parties out of 279 come near, that is the standout */
  const extreme = S.signatureOf({ x: 0, y: 0, europe: -100 }, ref);
  const near = S.nearOn(-100, "europe", ref.parties);
  check("nearOn counts parties within BAND", near.n === ref.parties.filter(p => Math.abs(p.eu + 100) <= S.BAND).length, near);
  check("the far reading is the standout", extreme && extreme.standout.key === "europe", extreme);
  const flat = S.signatureOf({ x: 0, y: 0 }, { parties: ref.parties.map(() => ({ x: 0, y: 0, src: "ches" })), pairs: [] });
  check("when every party is as near as any other there is nothing to say", flat === null, flat);

  console.log("\nReadings, from what the compass computes");
  const answers = {};
  const prot = Q.ITEMS.filter(i => i.reading === "protectionism" && !i.reserve);
  const cOf = a => ({ x: 20, y: -30, quiz: Q.score(a, "economy"), eu: Q.score(a, "europe"), inst: Q.score(a, "institutions"), ecology: Q.score(a, "ecology") });
  check("no answer, no protectionism", S.readingsOf(cOf({}), Q.MIN_PER_DIM).protectionism === null);
  answers[prot[0].id] = 0;
  check("one answer is not enough, as the compass says", cOf(answers).quiz.n.protectionism === 1 && S.readingsOf(cOf(answers), Q.MIN_PER_DIM).protectionism === null);
  answers[prot[1].id] = 0;
  const two = S.readingsOf(cOf(answers), Q.MIN_PER_DIM);
  check("two answers are", two.protectionism !== null && Number.isFinite(two.protectionism), two);
  check("x and y come through", two.x === 20 && two.y === -30);
  check("a theme not begun stays null", two.europe === null && two.ecology === null && two.people === null, two);
})().then(() => {
  console.log(failed ? "\n" + failed + " failed" : "\nall passed");
  process.exit(failed ? 1 : 0);
});
