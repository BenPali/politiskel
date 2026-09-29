"use strict";
/* Synthetic questionnaire answers, for checks that need a profile the model
   can score. Nothing here is a person: a profile is a set of latent positions
   on the readings, and each item is answered with the option closest to the
   latent position, plus noise. Seeded, so a check can be re-run. */

const Q = require("../politi-quiz.js");

/* mulberry32: a small seeded generator, enough for a simulation */
function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.normal = () => Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next());
  return next;
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* The readings a latent position can set, and the items that carry them */
const READINGS = ["x", "y", "europe", "ecology", "people", "protectionism"];

/* latent: { reading: [-100, 100] }. A reading left out is answered at random.
   noise: spread of an item around the latent position, on [-1, 1].
   perDim: answer only this many items per sub-dimension (the sparse case),
   or all of them when null. */
function answersFor(latent, random, { noise = 0.35, perDim = null } = {}) {
  const answers = {};
  const items = Q.ITEMS.filter(i => !i.reserve && Q.THEMES.some(t => t.key === i.theme));
  const groups = new Map();
  for (const item of items) {
    const key = item.theme + "/" + item.reading + "/" + (item.dim || "");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  for (const group of groups.values()) {
    const pool = group.slice();
    if (perDim) {
      /* a seeded partial shuffle, to keep perDim of them */
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      pool.length = Math.min(perDim, pool.length);
    }
    for (const item of pool) {
      const scale = Q.SCALES[item.scale];
      const base = latent[item.reading] === undefined ? random() * 2 - 1 : latent[item.reading] / 100;
      const target = clamp(base + noise * random.normal(), -1, 1);
      let best = 0, gap = Infinity;
      scale.values.forEach((v, i) => {
        const g = Math.abs(item.pole * v - target);
        if (g < gap) { gap = g; best = i; }
      });
      answers[item.id] = best;
    }
  }
  return answers;
}

module.exports = { rng, answersFor, READINGS, clamp };
