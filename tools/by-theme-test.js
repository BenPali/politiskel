#!/usr/bin/env node
"use strict";
/* Checks for the nearest party theme by theme (site/src/lib/compass/bytheme.js):
   what it says, and above all what it refuses to say. The block exists to
   name a party where a theme parts from the overall answer, so the cases that
   matter are the ones where naming one would be wrong: the overall party
   itself, a tie, a reading the profile has not earned.

     node tools/by-theme-test.js

   Exits with a non-zero code on the first failed group. Nothing is written. */

const { site } = require("./lib/site.js");
const { rng, answersFor } = require("./lib/sim-answers.js");

let failed = 0;
function check(name, ok, detail) {
  if (ok) return;
  failed++;
  console.error("FAIL " + name + (detail ? " : " + detail : ""));
}
const eq = (name, got, want) => check(name, JSON.stringify(got) === JSON.stringify(want), "got " + JSON.stringify(got) + ", want " + JSON.stringify(want));

/* A board small enough to reason about. Distances on x are what the
   economy theme reads; eu is carried by four of the six. */
const LIMITS = { near: 20, far: 30, tie: 5 };
const party = (name, x, y, extra) => Object.assign({ name, x, y, src: "est", note: "" }, extra);
const COUNTRY = {
  code: "zz", name: "Testland", parties: [
    party("Alpha", -50, -50, { eu: 80, env: 70 }),
    party("Bravo", -40, 40, { eu: -50, env: -20 }),
    party("Charlie", 20, 0, { eu: 10, env: 0 }),
    party("Delta", 60, 60, { eu: -70, env: -60 }),
    party("Echo", 62, 58),
    party("Foxtrot", 90, -10)
  ]
};
const of = (result, key) => result.themes.find((t) => t.key === key);

async function main() {
  const model = await site("compass/model.js");
  const bt = await site("compass/bytheme.js");
  const { byTheme } = bt;

  /* 1. the readings compared: those with a party counterpart, nothing else */
  eq("themes", bt.THEMES.map((t) => t.key), ["economy", "protectionism", "society", "europe", "ecology", "institutions"]);
  for (const t of bt.THEMES) {
    check("counterpart " + t.key, model.COUNTRIES.some((c) => c.parties.some((r) => Number.isFinite(r[t.ref]))), t.ref);
  }
  for (const gone of ["class", "conflict", "labour", "nuclear", "transition", "degrowth", "russia", "world", "defence", "executive"]) {
    check("no counterpart, not compared: " + gone, !bt.THEMES.some((t) => t.key === gone));
  }

  /* 2. a profile with nothing firm places nothing */
  let r = byTheme({ x: null, y: null, quiz: null }, COUNTRY, LIMITS);
  eq("empty profile has no overall", r.overall, null);
  eq("empty profile: every theme unplaced", r.themes.map((t) => t.status), Array(6).fill("unplaced"));

  /* 3. the overall party, and its ties */
  r = byTheme({ x: -45, y: -45 }, COUNTRY, LIMITS);
  eq("overall nearest", r.overall.name, "Alpha");
  eq("overall names", r.overall.names, ["Alpha"]);
  eq("economy: nearest is the overall one, said nothing", of(r, "economy").status, "same");
  eq("society: same", of(r, "society").status, "same");

  /* 4. a distinct nearest: Charlie is the overall party (2-D), Alpha alone
     is nearest on Europe */
  r = byTheme({ x: 15, y: 5, eu: { europe: 75 } }, COUNTRY, LIMITS);
  eq("overall is Charlie", r.overall.name, "Charlie");
  let t = of(r, "europe");
  eq("europe distinct", t.status, "distinct");
  eq("europe nearest", t.best.name, "Alpha");
  eq("europe distance is on the theme's scale", t.best.d, 5);
  eq("europe: what the overall party is worth there", t.overall, { name: "Charlie", d: 65 });
  eq("europe measured", t.measured, { n: 4, of: 6 });
  eq("europe fit comes from the country's limits", t.best.fit, "near");

  /* 5. the overall party as close as the best: a tie, not a difference */
  r = byTheme({ x: 15, y: 5, eu: { europe: 45 } }, COUNTRY, LIMITS);
  t = of(r, "europe");
  /* Charlie at 35, Alpha at 35: as close as each other */
  eq("europe tied with overall", t.status, "tied-with-overall");
  r = byTheme({ x: 15, y: 5, eu: { europe: 47 } }, COUNTRY, LIMITS);
  eq("within the tie limit still ties with overall", of(r, "europe").status, "tied-with-overall");
  r = byTheme({ x: 15, y: 5, eu: { europe: 53 } }, COUNTRY, LIMITS);
  t = of(r, "europe");
  check("past the tie limit it is a difference", t.status === "distinct" && t.best.name === "Alpha", JSON.stringify(t));

  /* 6. a party within the limit of the best, and not the overall one: named together */
  r = byTheme({ x: 15, y: 5, eu: { europe: -52 } }, COUNTRY, LIMITS);
  t = of(r, "europe");
  eq("europe: Bravo at 2, Delta at 18, distinct", [t.status, t.best.name], ["distinct", "Bravo"]);
  r = byTheme({ x: 15, y: 5, eu: { europe: -60 } }, COUNTRY, LIMITS);
  eq("europe: Bravo and Delta both at 10, named together", [of(r, "europe").status, of(r, "europe").tied.map((o) => o.name)], ["ex-aequo", ["Delta"]]);
  r = byTheme({ x: 15, y: 5, eu: { europe: -57 } }, { code: "zz", name: "T", parties: [...COUNTRY.parties, party("Golf", -60, 0, { eu: -64 })] }, LIMITS);
  t = of(r, "europe");
  eq("ex aequo names the others, and only those within the limit", [t.status, t.best.name, t.tied.map((o) => o.name)], ["ex-aequo", "Bravo", ["Golf"]]);
  check("ex aequo is shown", bt.SHOWN.has(t.status));

  /* 7. a crowd is not a list */
  const crowd = { code: "zz", name: "T", parties: [party("Hub", 0, 0, { eu: 0 }), party("One", 5, 90, { eu: 50 }), party("Two", 5, -90, { eu: 51 }),
    party("Three", 90, 5, { eu: 52 }), party("Four", -90, 5, { eu: 53 }), party("Far", -60, 60, { eu: -100 })] };
  r = byTheme({ x: 0, y: 0, eu: { europe: 51 } }, crowd, LIMITS);
  eq("crowded: no name", [of(r, "europe").status, bt.SHOWN.has(of(r, "europe").status)], ["crowded", false]);

  /* 8. too few parties carry the reading */
  const thin = { code: "zz", name: "T", parties: [party("P", 0, 0, { eu: 10 }), party("Q", 40, 40), party("R", -40, -40)] };
  r = byTheme({ x: 0, y: 0, eu: { europe: 10 } }, thin, LIMITS);
  eq("one carrier is not a comparison", of(r, "europe").status, "unmeasured");
  const none = { code: "us", name: "T", parties: [party("P", 0, 0), party("Q", 40, 40)] };
  eq("no carrier", of(byTheme({ x: 0, y: 0, ecology: { ecology: 20 }, eu: { europe: 3 } }, none, LIMITS), "ecology").status, "unmeasured");

  /* 9. the overall nearest is itself a tie: both are "already shown" */
  const twins = { code: "zz", name: "T", parties: [party("Twin1", 0, 30, { eu: -80 }), party("Twin2", 0, -30, { eu: 80 }), party("Other", 80, 0, { eu: 0 })] };
  r = byTheme({ x: 0, y: 2, eu: { europe: 75 } }, twins, LIMITS);
  eq("overall tie: both named", r.overall.names, ["Twin1", "Twin2"]);
  eq("nearest on the theme is one of the two: nothing to add", of(r, "europe").status, "same");

  /* 10. a profile with a theme and no place on the board: no overall to exclude */
  r = byTheme({ x: null, y: null, eu: { europe: 75 } }, COUNTRY, LIMITS);
  eq("no overall", r.overall, null);
  t = of(r, "europe");
  eq("theme still read", [t.status, t.best.name], ["distinct", "Alpha"]);
  eq("nothing to compare with the overall", t.overall, undefined);

  /* 11. protectionism needs its own answers: the score alone is not enough */
  const prot = (n, v) => ({ x: 0, y: 0, quiz: { protectionism: v, n: { protectionism: n } } });
  const withProt = { code: "zz", name: "T", parties: COUNTRY.parties.map((p, i) => ({ ...p, prot: p.x / 2 + i })) };
  eq("one protectionism answer: not enough", of(byTheme(prot(1, 40), withProt, LIMITS), "protectionism").status, "unplaced");
  check("two answers: placed", of(byTheme(prot(2, 40), withProt, LIMITS), "protectionism").status !== "unplaced");
  eq("a null score is not a zero", of(byTheme(prot(2, null), withProt, LIMITS), "protectionism").status, "unplaced");

  /* 12. through the real scoring: only what was answered is compared */
  const random = rng(7);
  const econOnly = {};
  for (const [id, a] of Object.entries(answersFor({ x: -70, y: 0, europe: 0, ecology: 0, people: 0 }, random, { perDim: 2 }))) {
    if (id.startsWith("ess.") || id.startsWith("issp.") || id.startsWith("evs.")) econOnly[id] = a;
  }
  const Q = require("./politi-quiz.js");
  const econAnswers = {};
  for (const item of Q.askedItems("economy")) if (econOnly[item.id] !== undefined) econAnswers[item.id] = econOnly[item.id];
  const france = model.COUNTRIES.find((c) => c.code === "fr");
  const c = model.coords({ answers: econAnswers });
  r = byTheme(c, france);
  check("economy answered only: economy placed", of(r, "economy").status !== "unplaced");
  for (const k of ["society", "europe", "ecology", "institutions"]) eq("not answered, not compared: " + k, of(r, k).status, "unplaced");
  eq("no overall without a society score", r.overall, null);

  /* 13. invariants over simulated profiles in every country */
  const rnd = rng(11);
  let shown = 0, cells = 0;
  for (const country of model.COUNTRIES) {
    for (let i = 0; i < 25; i++) {
      const latent = {};
      for (const k of ["x", "y", "europe", "ecology", "people", "protectionism"]) latent[k] = rnd() * 200 - 100;
      const cc = model.coords({ answers: answersFor(latent, rnd, { perDim: i % 3 === 0 ? 2 : null }) });
      const limits = model.limitsOf(country.parties);
      const res = byTheme(cc, country, limits);
      eq("one entry per theme in " + country.code, res.themes.length, bt.THEMES.length);
      for (const th of res.themes) {
        cells++;
        const def = bt.THEMES.find((x) => x.key === th.key);
        const value = def.of(cc);
        check(country.code + " " + th.key + ": unplaced iff no firm score", (th.status === "unplaced") === !Number.isFinite(value));
        if (!th.best) continue;
        const ref = country.parties.find((p) => p.name === th.best.name);
        check(country.code + " " + th.key + ": distance is |score - party|", th.best.d === Math.round(Math.abs(ref[def.ref] - value)));
        check(country.code + " " + th.key + ": best is the nearest carrier", country.parties.every((p) => !Number.isFinite(p[def.ref]) || Math.round(Math.abs(p[def.ref] - value)) >= th.best.d));
        if (!bt.SHOWN.has(th.status)) continue;
        shown++;
        check(country.code + " " + th.key + ": never repeats the overall nearest", !res.overall || !res.overall.names.includes(th.best.name));
        check(country.code + " " + th.key + ": never names a tie member of the overall", !th.tied || th.tied.every((o) => !res.overall || !res.overall.names.includes(o.name)));
        check(country.code + " " + th.key + ": overall party is further by more than the tie", !th.overall || !res.overall || th.overall.d - th.best.d > limits.tie);
        check(country.code + " " + th.key + ": ex aequo means within the limit", th.status !== "ex-aequo" || th.tied.every((o) => o.d - th.best.d <= limits.tie));
        check(country.code + " " + th.key + ": distinct means the runner-up is past the limit or is an overall party", th.status !== "distinct" || th.margin > limits.tie || (res.overall && res.overall.names.includes(th.second.name)));
      }
    }
  }
  check("the simulation shows something", shown > 0, shown + " of " + cells);

  if (failed) {
    console.error(failed + " check" + (failed > 1 ? "s" : "") + " failed");
    process.exit(1);
  }
  console.log("by-theme: all checks passed (" + shown + " shown of " + cells + " simulated theme readings)");
}

main();
