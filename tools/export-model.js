#!/usr/bin/env node
"use strict";
/* The model as data, for the server's model check.

     node tools/export-model.js            → site/static/model.json
     node tools/export-model.js --fixture  → server/tests/fixtures/scoring.json

   The server checks how the model behaves on the answers of the members who
   agreed to it, and it does so itself, so that no answer ever leaves it. It
   needs what the scoring needs: each item's scale, orientation and
   sub-dimension, the PolitiScales weights. Those live here, in JavaScript;
   exporting them keeps one item bank rather than a copy in Rust.

   The fixture is for the other half of that promise: synthetic profiles,
   scored here, that the server's tests score again. If the two ever disagree,
   the check would be measuring a model the site does not use. Nothing in it
   comes from a real person. */

const fs = require("fs");
const path = require("path");
const M = require("./politi-model.js");
const Q = require("./politi-quiz.js");

/* A scale whose first option is agreeing ("Tout à fait d'accord", "Très
   favorable"): the ones a tendency to agree pulls on. */
const agreeing = s => Array.isArray(s.fr) && s.values[0] === 1 && /d'accord|favorable/i.test(s.fr[0]);

function model() {
  return {
    format: "politiskel-model", version: 1,
    min_per_dim: Q.MIN_PER_DIM,
    axes: M.AXES.filter(a => a.axis).map(a => ({ neg: a.neg[0], pos: a.pos[0], axis: a.axis, w: a.w })),
    scales: Object.fromEntries(Object.entries(Q.SCALES).map(([k, s]) => [k, {
      values: s.values,
      ...(s.dkScores !== undefined ? { dk_scores: s.dkScores } : {}),
      agree: agreeing(s)
    }])),
    themes: Q.THEMES.filter(t => !t.planned).map(t => ({ key: t.key, reading: t.axis || t.reading, axis: t.axis || null, dims: t.dims })),
    items: Q.ITEMS.map(i => ({ id: i.id, theme: i.theme, reading: i.reading, dim: i.dim || null,
                               scale: i.scale, pole: i.pole, asked: !i.reserve }))
  };
}

function fixture() {
  let seed = 20260928;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const keys = ["com", "cap", "reg", "laf", "eco", "prod", "cst", "ess", "rehab", "pun", "prg", "csv", "int", "nat", "rev", "ref"];
  const profiles = [];
  for (let n = 0; n < 60; n++) {
    const ps = {};
    if (rnd() < 0.85) for (let k = 0; k < keys.length; k += 2) {
      if (rnd() < 0.1) continue;                       /* an axis left blank */
      const a = Math.round(rnd() * 70), b = Math.round(rnd() * (100 - a));
      ps[keys[k]] = a; ps[keys[k + 1]] = b;
    }
    const answers = {};
    const share = [0.05, 0.3, 0.7, 1][n % 4];          /* from barely begun to complete */
    for (const i of Q.ITEMS) {
      if (rnd() > share) continue;
      const len = Q.SCALES[i.scale].values.length;
      answers[i.id] = Q.SCALES[i.scale].dk && rnd() < 0.05 ? "dk" : Math.floor(rnd() * len);
    }
    const c = M.coords(ps), e = Q.score(answers, "economy"), s = Q.score(answers, "society"), u = Q.score(answers, "europe"),
          i = Q.score(answers, "institutions");
    const has = Object.keys(ps).length > 0;
    profiles.push({ politiscales: has ? ps : null, answers,
      expect: { ps_x: has ? c.x : null, ps_y: has ? c.y : null, x: e.x, y: s.y, europe: u.europe, people: i.people } });
  }
  return { model: model(), profiles };
}

const root = path.join(__dirname, "..");
if (process.argv.includes("--fixture")) {
  const out = path.join(root, "server", "tests", "fixtures", "scoring.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(fixture()) + "\n");
  console.log("→ " + path.relative(root, out));
} else {
  const out = path.join(root, "site", "static", "model.json");
  fs.writeFileSync(out, JSON.stringify(model()) + "\n");
  console.log("→ " + path.relative(root, out));
}
