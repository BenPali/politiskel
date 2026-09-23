#!/usr/bin/env node
"use strict";
/* Reads every PolitiScales result in politi-results/, writes profiles-data.js
   and assembles index.html.

     node tools/extract.js            # only re-reads changed screenshots
     node tools/extract.js --force    # ignores the cache
     node tools/extract.js --no-ocr   # skips the motto (no tesseract)

   The cache is keyed on size + mtime, so running the tool again after dropping
   in one new screenshot only re-reads that one. */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { decodePNG } = require("./lib/png.js");
const { encodePNG, cropScale } = require("./lib/png-encode.js");
const X = require("./politi-dissect.js");
const Q = require("./politi-quiz.js");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "politi-results");
const CACHE = path.join(SRC, ".extract-cache.json");
/* Questionnaire answers exported from the page, one file per profile. They sit
   beside the screenshots, so they are as local and as ignored by git. */
const ANSWERS = path.join(SRC, "answers");
const OUT = path.join(ROOT, "profiles-data.js");
const PAGE = path.join(ROOT, "index.html");       /* generated, not committed */
/* The page's sources live in web/: a shell with the markup, the stylesheet,
   and the app's scripts, each a file of its own. The build assembles them —
   with the shared tools below — into template.html, which is committed so
   that a clone works with no build step and no Node, and which the group
   server serves. template.html is generated: edit web/, not it. */
const WEB = path.join(ROOT, "web");
const SHELL = path.join(WEB, "shell.html");
const TEMPLATE = path.join(ROOT, "template.html"); /* assembled, committed, no data */
/* The files shared with the browser, each inlined into its own marked block:
   the screenshot reader, the compass model, and the questionnaire. */
const SHARED = [
  { file: path.join(__dirname, "politi-dissect.js"),
    start: "/* POLITI-EXTRACTOR:START */", end: "/* POLITI-EXTRACTOR:END */" },
  { file: path.join(__dirname, "politi-model.js"),
    start: "/* POLITI-MODEL:START */", end: "/* POLITI-MODEL:END */" },
  { file: path.join(__dirname, "politi-quiz.js"),
    start: "/* POLITI-QUIZ:START */", end: "/* POLITI-QUIZ:END */" }
];

/* Replaces the content between two markers, leaving the rest untouched. */
function between(text, start, end, body) {
  const a = text.indexOf(start), b = text.indexOf(end);
  if (a < 0 || b < 0 || b < a) return null;
  return text.slice(0, a + start.length) + "\n" + body + "\n" + text.slice(b);
}

/* A literal "</script>" inside a string would close the surrounding tag. */
const safe = s => s.replace(/<\/(script)/gi, "<\\/$1");

/* The shell's "/* @include web/<file> *\/" lines are replaced by those files,
   verbatim; its marked blocks by the shared tools. The page stays one file:
   opened as file://, a page cannot reliably load its neighbours, and a single
   file can be shared as is. */
function assemble() {
  if (!fs.existsSync(SHELL) || SHARED.some(s => !fs.existsSync(s.file))) return null;
  let page = fs.readFileSync(SHELL, "utf8").replace(
    /^\/\* @include (web\/[\w.-]+) \*\/\n/gm,
    (_, f) => safe(fs.readFileSync(path.join(ROOT, f), "utf8")));
  for (const { file, start, end } of SHARED) {
    page = between(page, start, end, safe(fs.readFileSync(file, "utf8").trimEnd()));
    if (page === null) return null;
  }
  return page;
}

/* Rewrites template.html only when its sources changed, then fills in the
   data. Only the DATA is left out of the template, since that is what must
   never be committed; index.html is REBUILT from the template on every run,
   so it never holds anything beyond the template plus the current data. */
function inject(count, dataJs) {
  const page = assemble();
  if (!page) return false;
  if (!fs.existsSync(TEMPLATE) || fs.readFileSync(TEMPLATE, "utf8") !== page)
    fs.writeFileSync(TEMPLATE, page);

  const out = between(page, "/* POLITI-DATA:START */", "/* POLITI-DATA:END */",
                      "/* " + count + " profile(s) extracted from politi-results/ */\n"
                      + safe(dataJs));
  if (!out) return false;
  fs.writeFileSync(PAGE, out);
  return true;
}

const argv = process.argv.slice(2);
const FORCE = argv.includes("--force");
const NO_OCR = argv.includes("--no-ocr");

/* ----------------------------------------------------------------- motto ---
   Only the English tesseract pack is installed here: it reads the text but
   loses accents ("Egalité" for "Égalité", "Foologie" for "Écologie"). Each
   word is therefore snapped to the PolitiScales vocabulary, first ignoring
   accents, then by edit distance. A word that resembles nothing known is kept
   as read rather than replaced with a guess. */
const VOCAB = ["Égalité", "Écologie", "Humanisme", "Socialisme", "Ordre", "Liberté",
  "Justice", "Progrès", "Tradition", "Nation", "Révolution", "Réformisme",
  "Sécurité", "Propriété", "Marché", "Travail", "Solidarité", "Laïcité",
  "Anarchie", "Autorité", "Communauté", "Nature", "Paix", "Famille",
  "Démocratie", "Souveraineté", "Croissance", "Foi", "Patrie"];

const strip = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const VOCAB_BY_PLAIN = new Map(VOCAB.map(w => [strip(w), w]));

function editDistance(a, b) {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

function snapWord(raw) {
  const w = raw.replace(/[^A-Za-zÀ-ÿ'-]/g, "");
  if (w.length < 3) return null;
  const plain = strip(w);
  if (VOCAB_BY_PLAIN.has(plain)) return VOCAB_BY_PLAIN.get(plain);
  let best = null, bestD = Infinity;
  for (const [p, orig] of VOCAB_BY_PLAIN) {
    const d = editDistance(plain, p);
    if (d < bestD) { bestD = d; best = orig; }
  }
  if (best && bestD <= Math.max(1, Math.floor(plain.length * 0.34))) return best;
  return w.charAt(0).toUpperCase() + w.slice(1);   /* unknown: keep what OCR read */
}

/* Surrounds a binarised image with white margin: tesseract will not read a
   line flush against the edges. */
function padWhite(im, m) {
  const W = im.width + m * 2, H = im.height + m * 2;
  const out = new Uint8ClampedArray(W * H * 4).fill(255);
  for (let y = 0; y < im.height; y++)
    for (let x = 0; x < im.width; x++) {
      const s = (y * im.width + x) * 4, d = ((y + m) * W + (x + m)) * 4;
      out[d] = im.data[s]; out[d + 1] = im.data[s + 1];
      out[d + 2] = im.data[s + 2]; out[d + 3] = 255;
    }
  return { width: W, height: H, data: out };
}

function ocrSlogan(img, box, tmp) {
  if (NO_OCR || !box) return null;
  /* Widen the band: a crop flush against the text does not read, and we aim
     for a constant absolute width so small screenshots (618px wide here) reach
     OCR at the same resolution as large ones. */
  const padY = Math.round(box.h * 0.15);
  const y0 = Math.max(0, box.y - padY);
  const bandH = Math.min(img.height - y0, box.h + padY * 2);

  /* Tighten horizontally onto the text. A full-width band gives a 13:1 aspect
     ratio that tesseract's layout analysis rejects: it returned nothing at all,
     while the crop was perfectly legible to the eye. */
  let inkL = img.width, inkR = 0;
  for (let y = y0; y < y0 + bandH; y++)
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      if (Math.max(img.data[i], img.data[i + 1], img.data[i + 2]) < 120) {
        if (x < inkL) inkL = x;
        if (x > inkR) inkR = x;
      }
    }
  if (inkR <= inkL) return null;
  const mx = Math.round(bandH * 0.6);
  const x0 = Math.max(0, inkL - mx);
  const wide = { x: x0, y: y0, w: Math.min(img.width - x0, inkR - inkL + 1 + mx * 2), h: bandH };

  const mult = Math.max(2, 1400 / wide.w);
  let up = cropScale(img, wide, Math.round(wide.w * mult), Math.round(wide.h * mult));
  for (let i = 0; i < up.data.length; i += 4) {
    const l = up.data[i] * 0.3 + up.data[i + 1] * 0.59 + up.data[i + 2] * 0.11;
    const v = l < 140 ? 0 : 255;
    up.data[i] = up.data[i + 1] = up.data[i + 2] = v; up.data[i + 3] = 255;
  }
  up = padWhite(up, 30);
  fs.writeFileSync(tmp, encodePNG(up));
  let text;
  try {
    text = execFileSync("tesseract", [tmp, "stdout", "--psm", "6", "-l", "eng"],
                        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch (_) { return null; } finally { try { fs.unlinkSync(tmp); } catch (_) {} }

  /* Picking the line: the motto is 2-3 short words separated by a middle dot.
     Any line containing an axis label is discarded first — if the white margin
     lets "Constructivisme Essentialisme" in, that is the line "the longest one"
     would pick. */
  const AXIS_WORDS = /constructiv|essential|réhabilit|rehabilit|punitiv|progressis|conservat|internationa|nationalis|communis|capitalis|régulat|regulat|laissez|écolog(ie)?\s*produc|productiv|révolution\s*réform|reformis/i;
  const scored = text.split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 6 && !AXIS_WORDS.test(l))
    .map(l => {
      /* Split on anything that is not a letter: the middle dot comes back as
         "·", "-", "«" or "*" depending on the screenshot, and a closed list of
         separators ended up gluing two words together. */
      const words = l.split(/[^A-Za-zÀ-ÿ]+/).map(snapWord).filter(Boolean);
      const known = words.filter(w => VOCAB.includes(w)).length;
      return { words, known, n: words.length };
    })
    .filter(c => c.n >= 2 && c.n <= 4)
    /* most recognised words first, then closest to three words */
    .sort((a, b) => (b.known - a.known) || (Math.abs(3 - a.n) - Math.abs(3 - b.n)));
  const best = scored[0];
  return best && best.known >= 2 ? best.words.slice(0, 3) : null;
}

/* ----------------------------------------------------------------- alias ---
   "firstname-2026.png" becomes "Firstname". Renaming the file is enough to
   rename the profile. */
function aliasFromFile(file) {
  const base = path.basename(file, path.extname(file)).replace(/[-_]?\d{4}$/, "");
  return base.split(/[-_\s]+/).filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || base;
}

function loadCache() {
  if (FORCE) return {};
  try { return JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch (_) { return {}; }
}

/* How many profiles the current profiles-data.js holds: 0 when there is no
   file or an empty list. A file that cannot be read back counts as non-empty,
   so that it is never overwritten on a guess. */
function existingProfileCount() {
  if (!fs.existsSync(OUT)) return 0;
  const sandbox = { window: {} };
  try { require("vm").runInNewContext(fs.readFileSync(OUT, "utf8"), sandbox); }
  catch (_) { return Infinity; }
  const list = sandbox.window.POLITI_PROFILES;
  return Array.isArray(list) ? list.length : Infinity;
}

/* ------------------------------------------------------------ answers ---
   A group answers on as many machines as it has members, and each browser
   keeps its own answers. "Exporter mes réponses" on the page writes one file;
   dropped in politi-results/answers/, it is folded into the page like a
   screenshot, and read by tools/model-check.js.

   Every key and value is checked against the item bank: an answer file is
   input from someone else's machine, and a wrong index would score silently. */
const SALIENCE = new Set(Q.THEMES.filter(t => !t.planned)
  .flatMap(t => ["salience." + t.key, "salience." + t.key + ".after"]));

function answerProblem(key, v) {
  if (SALIENCE.has(key))
    return Number.isInteger(v) && v >= 0 && v < Q.SCALES.salience.values.length ? null : "bad salience";
  const item = Q.itemById(key);
  if (!item || item.reserve) return "unknown item";
  const scale = Q.SCALES[item.scale];
  if (v === "dk") return scale.dk ? null : "no \"can't choose\" on this item";
  return Number.isInteger(v) && v >= 0 && v < scale.values.length ? null : "out of range";
}

function readAnswers() {
  if (!fs.existsSync(ANSWERS)) return [];
  const out = [];
  for (const file of fs.readdirSync(ANSWERS).filter(f => /\.json$/i.test(f)).sort()) {
    let data;
    try { data = JSON.parse(fs.readFileSync(path.join(ANSWERS, file), "utf8")); }
    catch (e) { console.log("  ! answers/" + file + "  not JSON: " + e.message); continue; }
    if (!data || data.format !== "politiskel-answers" || data.version !== 1
        || typeof data.alias !== "string" || !data.alias.trim()
        || !data.answers || typeof data.answers !== "object") {
      console.log("  ! answers/" + file + "  not a Politiskel answers file (format, version 1)");
      continue;
    }
    const answers = {}, bad = [];
    for (const [k, v] of Object.entries(data.answers)) {
      const why = answerProblem(k, v);
      if (why) bad.push(k + " (" + why + ")"); else answers[k] = v;
    }
    /* when it was exported: the file's own stamp, else when it landed here */
    const stamp = typeof data.exported === "string" && !isNaN(Date.parse(data.exported))
      ? Date.parse(data.exported) : fs.statSync(path.join(ANSWERS, file)).mtimeMs;
    out.push({ file, stamp, alias: data.alias.trim(),
               source: typeof data.source === "string" ? data.source : null, answers });
    console.log("  + answers/" + file.padEnd(28) + " " + data.alias.trim().padEnd(9)
      + Object.keys(answers).length + " answers"
      + (bad.length ? "   [skipped: " + bad.join(", ") + "]" : ""));
  }
  return out;
}

/* Decides, once and here, whose answers each file holds, so that the page and
   tools/model-check.js see the same profiles.

   - A file naming a screenshot that is here completes that profile.
   - One that names none, or one that is not here, but whose alias is a
     screenshot's, completes that profile too: someone who first answered on
     their own copy without their capture is still the same person.
   - Otherwise it is a questionnaire-only profile, known by its alias.
   - Several files for the same profile — an export done twice arrives as
     "alice-reponses (1).json" — keep the most recent; the others are named
     and dropped, or the same person would count twice in every check. */
function resolveAnswers(files, profiles) {
  const byKey = new Map();
  for (const a of files) {
    let source = a.source && profiles.some(p => p.source === a.source) ? a.source : null;
    if (!source) {
      const same = profiles.find(p => p.alias.toLowerCase() === a.alias.toLowerCase());
      if (same) {
        console.log("  ? answers/" + a.file + ": " + (a.source ? a.source + " is not here; " : "")
          + "matched to " + same.source + " by its alias");
        source = same.source;
      } else if (a.source) {
        console.log("  ? answers/" + a.file + ": " + a.source
          + " is not here — kept as a questionnaire-only profile");
      }
    }
    const key = source || "alias:" + a.alias.toLowerCase();
    const prev = byKey.get(key);
    if (prev) {
      const [keep, drop] = a.stamp >= prev.stamp ? [a, prev] : [prev, a];
      console.log("  ? answers/" + drop.file + " and answers/" + keep.file
        + " are the same profile — keeping the later, " + keep.file);
      byKey.set(key, Object.assign({}, keep, { source }));
    } else {
      byKey.set(key, Object.assign({}, a, { source }));
    }
  }
  return [...byKey.values()].map(a => ({ alias: a.alias, source: a.source, answers: a.answers }));
}

function main() {
  /* No screenshots is not an error: the page works without them — a profile
     can be dropped onto it or typed in by hand. Failing here left whoever
     just cloned the repository with no index.html at all, and no way to get
     one short of producing a PolitiScales capture first. */
  const hasFolder = fs.existsSync(SRC);
  const files = hasFolder
    ? fs.readdirSync(SRC).filter(f => /\.png$/i.test(f)).sort() : [];
  if (!files.length) {
    /* ...but only when there is nothing to lose: a moved or emptied folder
       must not silently wipe the profiles already extracted. */
    const kept = existingProfileCount();
    if (kept) {
      console.error((hasFolder
        ? "no .png screenshot in " + path.relative(ROOT, SRC)
        : path.relative(ROOT, SRC) + " not found")
        + ", but " + path.relative(ROOT, OUT)
        + (kept === Infinity ? " is not empty" : " still holds " + kept + " profile(s)")
        + " — aborting. Delete it first to build an empty page.");
      process.exit(1);
    }
    console.log(hasFolder
      ? "no .png screenshot in " + path.relative(ROOT, SRC) + " — building an empty page"
      : path.relative(ROOT, SRC) + " not found — building an empty page");
  }

  const cache = loadCache();
  const next = {}, profiles = [];
  let fresh = 0, reused = 0, failed = 0;

  for (const file of files) {
    const full = path.join(SRC, file);
    const st = fs.statSync(full);
    const key = file;
    const stamp = st.size + ":" + Math.round(st.mtimeMs);

    if (cache[key] && cache[key].stamp === stamp && cache[key].profile) {
      next[key] = cache[key];
      profiles.push(cache[key].profile);
      reused++;
      console.log("  = " + file.padEnd(20) + "unchanged, reused from cache");
      continue;
    }

    let res;
    try { res = X.extract(decodePNG(fs.readFileSync(full))); }
    catch (e) { console.log("  ! " + file.padEnd(20) + "unreadable: " + e.message); failed++; continue; }
    if (!res.ok) { console.log("  ! " + file.padEnd(20) + res.warnings.join(" ; ")); failed++; continue; }

    const img = decodePNG(fs.readFileSync(full));
    const g = res.geometry;

    let flag = null;
    if (g.flag) {
      const h = Math.round(80 * (g.flag.h / g.flag.w) * (g.flag.w / g.flag.h));
      const crop = cropScale(img, g.flag, 160, Math.max(24, Math.round(160 * g.flag.h / g.flag.w)));
      flag = "data:image/png;base64," + encodePNG(crop).toString("base64");
    }

    const slogan = ocrSlogan(img, g.slogan, path.join(SRC, ".ocr-tmp.png"));
    const concepts = X.keyConcepts(res.values, 3);

    const profile = {
      alias: aliasFromFile(file), source: file,
      values: res.values, neutral: res.neutrals,
      slogan, concepts, flag
    };
    next[key] = { stamp, profile };
    profiles.push(profile);
    fresh++;
    console.log("  + " + file.padEnd(20) + profile.alias.padEnd(9)
      + (slogan ? slogan.join(" · ") : "(motto not read)")
      + (res.warnings.length ? "   [" + res.warnings.join(" ; ") + "]" : ""));
  }

  if (hasFolder) fs.writeFileSync(CACHE, JSON.stringify(next, null, 1));
  const banner = "/* Generated by tools/extract.js — do not edit by hand.\n"
    + "   Source: politi-results/  ·  " + profiles.length + " profile(s)\n"
    + "   Regenerate: node tools/extract.js */\n";
  const answers = resolveAnswers(readAnswers(), profiles);
  const dataJs = "window.POLITI_PROFILES = " + JSON.stringify(profiles, null, 1) + ";"
    + "\nwindow.POLITI_ANSWERS = " + JSON.stringify(answers, null, 1) + ";";
  fs.writeFileSync(OUT, banner + dataJs + "\n");

  /* The extractor and the data are also copied INTO index.html. A file:// page
     loading neighbouring <script src> depends on browser settings (and on any
     extensions): when those blocked it, the page came up empty. Inlining
     everything removes the problem and makes the file shareable as-is. */
  const injected = inject(profiles.length, dataJs);

  console.log("\n" + fresh + " extracted, " + reused + " cached, " + failed + " failed"
    + (answers.length ? ", answers for " + answers.length + " profile(s)" : "")
    + "  →  " + path.relative(ROOT, OUT)
    + " (" + (fs.statSync(OUT).size / 1024).toFixed(1) + " KB)"
    + (injected ? "\n   index.html rebuilt (extractor + data inlined, "
        + (fs.statSync(PAGE).size / 1024).toFixed(1) + " KB)"
      : "\n   index.html NOT rebuilt: POLITI-DATA/POLITI-EXTRACTOR markers not found"));
  if (failed) process.exitCode = 1;
}

main();
