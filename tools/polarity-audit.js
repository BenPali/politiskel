#!/usr/bin/env node
"use strict";
/* Is the questionnaire protected against acquiescence?

     node tools/polarity-audit.js
     node tools/polarity-audit.js --json
     node tools/polarity-audit.js --draws 5000 --threshold 8

   In an agree/disagree questionnaire, someone who tends to say "agree"
   whatever is asked gets pushed to the pole that the agreeing items are keyed
   towards. A balanced reading has about as many items keyed to each pole, and
   the display order alternates them instead of clustering them. This measures
   both, on the item bank as politi-quiz.js defines it and in the order the
   site shows it. It reads the bank and changes nothing.

   What "keyed" means. Only some answer formats have an agreeing direction:

     agree     agree/disagree cards (ESS, ISSP, EVS, Eurobarometer, Wright)
     yes       for/against, favour, yes/no, allowed, "has the right", "a good
               way to govern": the first option endorses the proposition
     rating    "more or less", "how much": the first (or last) option is the
               high end. Yea-saying is weaker evidence here, so these are only
               counted in the widest responder below, never in the keyed shares
     choice    two or more alternatives, or a bipolar card with both ends
               written out: nothing to agree with, balanced by construction

   An item's keyed direction is the pole its endorsing answer moves the
   reading towards: sign(value of the first option) * pole, for `agree` and
   `yes` scales.

   Responders. Each is simulated on the asked items, then again on the asked
   items plus the reserve (what a promotion would change). Every reading is
   on [-100, 100], the centre being 0:

     agree      "plutôt d'accord" on every agree/yes item, the middle answer
                (value 0) on everything else: a centrist who leans to agreeing
     strong     "tout à fait d'accord", middle elsewhere
     wide       strong on agree/yes items and the high end on rating items
     only       "plutôt d'accord" on agree/yes items, everything else skipped:
                the same pull without the dilution, and the one that
                Q.score() can be asked, so it cross-checks this file's
                arithmetic against the real scoring
     middle     the middle answer everywhere: must land on 0, a sanity check

   Nothing is written to disk: the numbers are for reading, not for keeping.
   Seeded, so two runs print the same figures. */

const Q = require("./politi-quiz.js");

const argv = process.argv.slice(2);
const flag = name => argv.includes("--" + name);
const argOf = (name, fallback) => {
  const i = argv.indexOf("--" + name);
  return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : fallback;
};
const DRAWS = argOf("draws", 2000);
const THRESHOLD = argOf("threshold", 10);   /* |shift| above this is "unbalanced" */
const JSON_OUT = flag("json");

/* ---- how each answer scale is exposed to acquiescence ------------------- */

const AGREE = ["agreePlutot", "agreeIssp", "agreeFam", "agreeFamFr", "agreeRel18", "agreeRel18b",
  "agreeRel08", "agree4Evs", "agree5Evs", "agreeWright", "agreeEb", "agreeEvsEnv", "agree4Fr"];
const YES = ["favourIssp", "forAgainstEss", "favourFr", "forEb", "yesNoEvs", "citedEvs", "allowIssp",
  "rightIssp", "respIssp", "goodEvs", "willingIssp"];
/* rating scales and the index of their high end */
const RATING = { spendIssp: 0, powerIssp: 0, powerRel18: 0, importanceIssp: 0, dangerIssp: 0,
  amountEss: 0, worryEss: 4, morePowerIssp: 4, euPowerIssp: 0, benefitIssp: 0, immigNumberIssp: 0,
  taxShareIssp: 0, conflictIssp: 0, climateEss: 0, allowEss: 0 };
const CHOICE = ["bipolar10", "bipolar11", "ownerIssp", "remainEss", "obeyIssp", "errorIssp",
  "goodThingEvs", "cultureIssp", "bornIssp", "growthEvs", "libertiesFr"];

const kindOf = scale =>
  AGREE.includes(scale) ? "agree" : YES.includes(scale) ? "yes"
    : scale in RATING ? "rating" : CHOICE.includes(scale) ? "choice" : null;

for (const item of Q.ITEMS) {
  if (!kindOf(item.scale)) {
    console.error("polarity-audit: scale " + item.scale + " (" + item.id + ") is not classified: "
      + "add it to AGREE, YES, RATING or CHOICE");
    process.exit(1);
  }
}

const sign = v => (v > 0 ? 1 : v < 0 ? -1 : 0);
const mean = xs => xs.reduce((s, v) => s + v, 0) / xs.length;

/* keyed: +1 or -1 for an item whose endorsing answer moves its reading, 0 when
   the format has no such answer */
function keyOf(item) {
  const kind = kindOf(item.scale);
  const values = Q.SCALES[item.scale].values;
  if (kind === "agree" || kind === "yes") return sign(values[0]) * item.pole;
  return 0;
}
/* the high-end sign, for rating items */
function highKey(item) {
  const top = RATING[item.scale];
  return sign(Q.SCALES[item.scale].values[top]) * item.pole;
}

/* ---- responders ---------------------------------------------------------- */

const mildIndex = item => (Q.SCALES[item.scale].values.length >= 4 ? 1 : 0);

const RESPONDERS = {
  /* each returns an oriented value in [-1, 1], or null for a skipped item */
  agree: item => {
    const k = kindOf(item.scale);
    return k === "agree" || k === "yes" ? Q.itemValue(item, mildIndex(item)) : 0;
  },
  strong: item => {
    const k = kindOf(item.scale);
    return k === "agree" || k === "yes" ? Q.itemValue(item, 0) : 0;
  },
  wide: item => {
    const k = kindOf(item.scale);
    if (k === "agree" || k === "yes") return Q.itemValue(item, 0);
    if (k === "rating") return Q.itemValue(item, RATING[item.scale]);
    return 0;
  },
  only: item => {
    const k = kindOf(item.scale);
    return k === "agree" || k === "yes" ? Q.itemValue(item, mildIndex(item)) : null;
  },
  middle: () => 0
};
/* The responders Q.score() can be asked, as answers: the ones that skip what
   they do not endorse, since a scale may have no zero to answer with. Each is
   paired with the responder of this file that must agree with it. */
const AS_ANSWERS = {
  only: { answer: item => { const k = kindOf(item.scale); return k === "agree" || k === "yes" ? mildIndex(item) : undefined; },
          value: RESPONDERS.only },
  strongOnly: { answer: item => { const k = kindOf(item.scale); return k === "agree" || k === "yes" ? 0 : undefined; },
                value: item => { const k = kindOf(item.scale); return k === "agree" || k === "yes" ? Q.itemValue(item, 0) : null; } }
};

/* ---- aggregation, the same as Q.score() but without its gating ----------- */

const themeOf = key => Q.THEMES.find(t => t.key === key);
const axisOf = theme => theme.axis || theme.reading;

/* the reading of `items` (all of one theme) under `valueOf`; `reading` is a
   reading of the theme. Null when nothing feeds it. */
function readingOf(theme, reading, items, valueOf) {
  const mine = items.filter(i => i.reading === reading);
  const vs = i => valueOf(i);
  if (reading === axisOf(theme)) {
    const dimMeans = theme.dims.map(d => {
      const xs = mine.filter(i => i.dim === d).map(vs).filter(v => v !== null);
      return xs.length ? mean(xs) : null;
    }).filter(v => v !== null);
    return dimMeans.length ? 100 * mean(dimMeans) : null;
  }
  const xs = mine.map(vs).filter(v => v !== null);
  return xs.length ? 100 * mean(xs) : null;
}
const dimOf = (items, dim, valueOf) => {
  const xs = items.filter(i => i.dim === dim).map(valueOf).filter(v => v !== null);
  return xs.length ? 100 * mean(xs) : null;
};

/* ---- the audit ------------------------------------------------------------ */

const rows = [];   /* one per (theme, reading) and per (theme, axis, dim) */
const round = v => (v === null ? null : Math.round(v));

for (const theme of Q.THEMES) {
  const bank = Q.ITEMS.filter(i => i.theme === theme.key);
  const asked = bank.filter(i => !i.reserve);
  const units = theme.readings.map(r => ({ reading: r, dim: null }));
  for (const d of theme.dims) units.push({ reading: axisOf(theme), dim: d });

  for (const u of units) {
    const inUnit = i => i.reading === u.reading && (u.dim === null || i.dim === u.dim);
    const a = asked.filter(inUnit), all = bank.filter(inUnit);
    const r = all.filter(i => i.reserve);
    const count = items => {
      const c = { n: items.length, plus: 0, minus: 0, rating: 0, choice: 0 };
      for (const i of items) {
        const k = keyOf(i);
        if (k > 0) c.plus++; else if (k < 0) c.minus++;
        else if (kindOf(i.scale) === "rating") c.rating++; else c.choice++;
      }
      return c;
    };
    const eff = (items, valueOf) => (u.dim === null
      ? readingOf(theme, u.reading, items, valueOf)
      : dimOf(items, u.dim, valueOf));
    const shifts = items => Object.fromEntries(Object.keys(RESPONDERS)
      .map(k => [k, round(eff(items, RESPONDERS[k]))]));
    rows.push({ theme: theme.key, reading: u.reading, dim: u.dim,
      asked: count(a), reserve: count(r), shiftAsked: shifts(a), shiftAll: shifts(all) });
  }
}

/* Cross-check against the real scoring: the arithmetic here must give what
   Q.score() gives for the responders that score() can take. */
const problems = [];
for (const theme of Q.THEMES) {
  for (const who of Object.keys(AS_ANSWERS)) {
    const answers = {};
    for (const i of Q.askedItems(theme.key)) {
      const a = AS_ANSWERS[who].answer(i);
      if (a !== undefined) answers[i.id] = a;
    }
    const real = Q.score(answers, theme.key);
    const asked = Q.askedItems(theme.key);
    for (const r of theme.readings) {
      const mine = readingOf(theme, r, asked, AS_ANSWERS[who].value);
      const theirs = r === axisOf(theme) ? real.provisional : real[r];
      if (mine === null && theirs === null) continue;
      if (mine === null || theirs === null || Math.abs(Math.round(mine) - theirs) > 1) {
        problems.push(theme.key + "/" + r + " (" + who + "): audit " + (mine === null ? null : Math.round(mine))
          + ", score() " + theirs);
      }
    }
  }
}
const middleOff = rows.filter(r => r.dim === null && r.shiftAsked.middle !== null && r.shiftAsked.middle !== 0);

/* ---- display order ------------------------------------------------------- */

/* The complete questionnaire, as site/src/lib/quiz/flow.js builds it:
   salience screens, then every open theme's asked items in mixedOrder, then
   salience again. Salience screens carry no keyed direction and are left out
   of the runs. */
const openThemes = Q.THEMES.filter(t => !t.planned).map(t => t.key);
const flowItems = keys => Q.mixedOrder([].concat(...keys.map(Q.askedItems)));
const exposed = items => items.filter(i => keyOf(i) !== 0);

function runsOf(signs) {
  let best = 0, run = 0, prev = 0, runs = 0;
  for (const s of signs) {
    if (s === prev) run++; else { run = 1; prev = s; runs++; }
    if (run > best) best = run;
  }
  return { longest: best, runs, n: signs.length };
}

/* a seeded shuffle, to say what a random order would give */
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
/* what random orders of the same signs give: the mean longest run, its 95th
   percentile, and the share of orders at least as long as `actual` */
function nullRuns(signs, seed, actual) {
  const rand = rng(seed), xs = signs.slice(), longest = [];
  for (let d = 0; d < DRAWS; d++) {
    for (let i = xs.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [xs[i], xs[j]] = [xs[j], xs[i]];
    }
    longest.push(runsOf(xs).longest);
  }
  longest.sort((p, q) => p - q);
  return { mean: mean(longest), p95: longest[Math.floor(0.95 * (longest.length - 1))],
    atLeast: longest.filter(v => v >= actual).length / longest.length };
}
function orderReport(label, items, seed) {
  const signs = exposed(items).map(keyOf);
  const actual = runsOf(signs);
  const nr = nullRuns(signs, seed, actual.longest);
  return { label, n: actual.n, plus: signs.filter(s => s > 0).length, longest: actual.longest,
    runs: actual.runs, randomMean: +nr.mean.toFixed(1), randomP95: nr.p95, pAtLeast: +nr.atLeast.toFixed(3) };
}

/* A candidate, not wired in anywhere: the same hash order, but when the run
   of one keyed direction reaches `cap`, the next item keyed the other way is
   pulled forward. Blocks that travel together (`follows`) stay together. It is
   here to say what such a repair would cost, so that the owner can decide: it
   bounds the runs whatever the bank becomes, and it gives up the property
   that adding an item moves none of the others. */
function capRuns(order, cap) {
  const present = new Set(order.map(i => i.id));
  const units = [];
  const byId = new Map();
  for (const i of order) {
    if (i.follows && present.has(i.follows)) byId.get(i.follows).push(i);
    else { const u = [i]; units.push(u); byId.set(i.id, u); }
    if (i.follows && present.has(i.follows)) byId.set(i.id, byId.get(i.follows));
  }
  const firstKey = u => { const e = u.find(i => keyOf(i) !== 0); return e ? keyOf(e) : 0; };
  const out = [];
  let run = 0, prev = 0;
  const rest = units.slice();
  while (rest.length) {
    let k = 0;
    if (firstKey(rest[0]) === prev && prev !== 0 && run >= cap) {
      const j = rest.findIndex(u => firstKey(u) === -prev);
      if (j > 0) k = j;
    }
    const u = rest.splice(k, 1)[0];
    for (const i of u) {
      out.push(i);
      const s = keyOf(i);
      if (s === 0) continue;
      if (s === prev) run++; else { prev = s; run = 1; }
    }
  }
  return out;
}

const orders = [];
orders.push(orderReport("complete questionnaire", flowItems(openThemes), 1));
for (const theme of Q.THEMES) {
  const items = flowItems([theme.key]);
  orders.push(orderReport("theme " + theme.key, items, 2));
}
/* per reading, in the complete questionnaire's order */
const full = flowItems(openThemes);
const perReading = [];
for (const theme of Q.THEMES) {
  for (const r of theme.readings) {
    const items = full.filter(i => i.theme === theme.key && i.reading === r);
    if (exposed(items).length >= 2) perReading.push(orderReport(theme.key + "/" + r, items, 3));
  }
}

const capped = [];
for (const cap of [3, 4, 5]) {
  const order = capRuns(full, cap);
  const moved = order.filter((it, k) => full[k].id !== it.id).length;
  const disp = mean(order.map((it, k) => Math.abs(full.indexOf(it) - k)));
  const same = order.length === full.length && new Set(order.map(i => i.id)).size === full.length;
  capped.push({ cap, longest: runsOf(exposed(order).map(keyOf)).longest, moved,
    meanShift: +disp.toFixed(1), sameItems: same,
    perReadingLongest: Math.max(...Q.THEMES.flatMap(t => t.readings.map(r =>
      runsOf(exposed(order.filter(i => i.theme === t.key && i.reading === r)).map(keyOf)).longest))) });
}

/* ---- rebalancing candidates ---------------------------------------------- */

/* For every reading that is unbalanced, the reserve items that could be
   promoted, what each does alone, and the smallest set that brings the
   `agree` responder closest to the centre. Promotion changes what is asked,
   so this is a proposal, never applied. */
const proposals = [];
for (const theme of Q.THEMES) {
  const bank = Q.ITEMS.filter(i => i.theme === theme.key);
  const asked = bank.filter(i => !i.reserve);
  for (const reading of theme.readings) {
    const row = rows.find(r => r.theme === theme.key && r.reading === reading && r.dim === null);
    const base = row.shiftAsked.agree;
    const cands = bank.filter(i => i.reserve && i.reading === reading);
    if (base === null || Math.abs(base) < THRESHOLD || !cands.length) continue;
    const at = extra => readingOf(theme, reading, asked.concat(extra), RESPONDERS.agree);
    const single = cands.map(i => ({ id: i.id, dim: i.dim, kind: kindOf(i.scale), keyed: keyOf(i),
      alone: round(at([i])), reason: i.reserve }));
    let best = null;
    for (let mask = 0; mask < (1 << cands.length); mask++) {
      const set = cands.filter((_, k) => mask & (1 << k));
      const v = Math.abs(at(set));
      const size = set.length;
      if (!best || v < best.abs - 1e-9 || (Math.abs(v - best.abs) < 1e-9 && size < best.set.length)) best = { abs: v, set };
    }
    proposals.push({ theme: theme.key, reading, base, single,
      best: { ids: best.set.map(i => i.id), shift: round(at(best.set)) },
      all: round(at(cands)) });
  }
}

/* ---- output --------------------------------------------------------------- */

if (JSON_OUT) {
  console.log(JSON.stringify({ rows, orders, perReading, capped, proposals, crossCheck: problems }, null, 1));
  process.exit(problems.length || middleOff.length ? 1 : 0);
}

const pad = (v, n) => String(v === null ? "-" : v).padEnd(n);
const lpad = (v, n) => String(v === null ? "-" : v).padStart(n);
const cnt = c => c.plus + "+/" + c.minus + "-";

console.log("Keyed direction: the pole an endorsing answer (agree, yes, for) moves the reading towards.");
console.log("Items by format: keyed = agree/yes scales; other = rating (more/less) + choice (bipolar, alternatives).\n");
console.log(pad("theme/reading", 30) + pad("asked", 6) + pad("keyed", 9) + pad("other", 7)
  + pad("reserve", 8) + pad("keyed", 9) + " |" + lpad("agree", 6) + lpad("only", 6) + lpad("strong", 7)
  + lpad("wide", 6) + " |" + lpad("agree", 6) + lpad("strong", 7) + lpad("wide", 6) + "   (asked | asked+reserve)");
for (const r of rows) {
  const name = r.theme + "/" + r.reading + (r.dim ? "." + r.dim : "");
  const indent = r.dim ? "  " : "";
  console.log(indent + pad(name, 30 - indent.length) + pad(r.asked.n, 6) + pad(cnt(r.asked), 9)
    + pad(r.asked.rating + r.asked.choice, 7) + pad(r.reserve.n || "", 8) + pad(r.reserve.n ? cnt(r.reserve) : "", 9)
    + " |" + lpad(r.shiftAsked.agree, 6) + lpad(r.shiftAsked.only, 6) + lpad(r.shiftAsked.strong, 7)
    + lpad(r.shiftAsked.wide, 6) + " |" + lpad(r.shiftAll.agree, 6) + lpad(r.shiftAll.strong, 7)
    + lpad(r.shiftAll.wide, 6));
}
console.log("\nShift = where the responder lands on [-100, 100]; the true centre is 0.");
console.log("Cross-check with Q.score(): " + (problems.length ? "MISMATCH\n  " + problems.join("\n  ") : "arithmetic agrees"));
console.log("Middle responder at exactly 0 on every reading: " + (middleOff.length ? "NO" : "yes"));

console.log("\nDisplay order, longest run of same keyed direction among agree/yes items");
console.log(pad("", 26) + lpad("items", 6) + lpad("+", 4) + lpad("longest", 8) + lpad("runs", 5)
  + lpad("random", 8) + lpad("p95", 5) + lpad("P(>=)", 7));
for (const o of orders.concat(perReading)) {
  console.log(pad(o.label, 26) + lpad(o.n, 6) + lpad(o.plus, 4) + lpad(o.longest, 8) + lpad(o.runs, 5)
    + lpad(o.randomMean, 8) + lpad(o.randomP95, 5) + lpad(o.pAtLeast, 7));
}
console.log("random = mean longest run over " + DRAWS + " seeded shuffles of the same items; "
  + "P(>=) = share of shuffles at least as long as the actual order.");

console.log("\nCandidate order (not applied): the hash order, with the run of one direction capped");
for (const c of capped) {
  console.log("  cap " + c.cap + ": longest run " + c.longest + " overall, " + c.perReadingLongest
    + " in a reading; " + c.moved + " of " + full.length + " positions differ, mean displacement "
    + c.meanShift + (c.sameItems ? "" : "  ITEMS LOST"));
}

if (proposals.length) {
  console.log("\nRebalancing candidates among the reserve (readings with |agree shift| >= " + THRESHOLD + ")");
  for (const p of proposals) {
    console.log("\n" + p.theme + "/" + p.reading + ": agree lands at " + p.base
      + "; all reserve promoted: " + p.all + "; best set " + (p.best.ids.join(", ") || "none") + ": " + p.best.shift);
    for (const s of p.single) {
      console.log("   " + pad(s.id, 24) + pad(s.dim || "-", 18) + pad(s.kind, 8)
        + pad(s.keyed > 0 ? "keyed +" : s.keyed < 0 ? "keyed -" : "not keyed", 10) + "alone: " + lpad(s.alone, 4)
        + "   (" + s.reason + ")");
    }
  }
}
process.exit(problems.length || middleOff.length ? 1 : 0);
