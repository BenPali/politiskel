#!/usr/bin/env node
"use strict";
/* The full name of every CHES 2024 party, from the CHES 2024 codebook.

     pdftotext -layout "CHES 2024 Codebook.pdf" codebook.txt
     node tools/ches-names.js codebook.txt   → tools/ches-2024-party-names.json

   The codebook's party list gives, for each party id, its short name and its
   name in its own language and in English. A cell may list several names,
   current first ("Vooruit; Socialistische Partij"): only the first is kept.
   A long name runs on to the next line, in the same column. The result is
   read by tools/import-ches.js; a party the codebook does not list keeps
   Party Facts's name, or none. */

const fs = require("fs");
const path = require("path");

const src = process.argv[2];
if (!src) {
  console.error("usage: node tools/ches-names.js <codebook as text>");
  process.exit(2);
}
const lines = fs.readFileSync(src, "utf8").split("\n");

const names = {};
let last = null;           // the party a continuation line belongs to
let nativeAt = 0, englishAt = 0;
/* the current name, without what the codebook adds in brackets (an
   acronym, a former name, "merger of ..."), bilingual names spaced alike */
const current = s => {
  /* pdftotext writes a caron as a breve before its letter (ob˘canů): put it back */
  let n = s.split(";")[0].replace(/˘(\p{L})/gu, (_, c) => (c + "\u030C").normalize("NFC"));
  while (/\([^()]*\)/.test(n)) n = n.replace(/\s*\([^()]*\)/g, "");
  n = n.replace(/\s*\(.*$/, "");          /* a bracket left open */
  return n.replace(/\s*\/\s*/g, " / ").replace(/\s+/g, " ").trim();
};
/* where the codebook itself is wrong: Junts under PDeCAT's name, and typos */
const FIX = {
  1406: { native: "Ruotsalainen kansanpuolue / Svenska folkpartiet", english: "Swedish People's Party" },
  2104: { native: "Křesťanská a demokratická unie – Československá strana lidová",
          english: "Christian and Democratic Union – Czechoslovak People's Party" },
  550: { native: "Junts per Catalunya", english: "Together for Catalonia" },
  /* the Finns list their former name first; the social democrats' wraps after a ";" */
  1405: { native: "Perussuomalaiset", english: "Finns Party" },
  1401: { native: "Suomen Sosialidemokraattinen Puolue", english: "Social Democratic Party of Finland" },
  1202: { native: "Centro Democrático e Social – Partido Popular", english: "CDS – People's Party" },
  1250: { native: "Pessoas – Animais – Natureza", english: "People – Animals – Nature" },
  111: { native: "Démocrate fédéraliste indépendant", english: "Democratic, Federalist, Independent" },
  2314: { native: "Momentum Mozgalom", english: "Momentum Movement" }
};

for (const raw of lines) {
  /* a page break sits at the start of a page's first line */
  let line = raw.replace(/\f/g, "");
  /* a party's line: [country] id short-name native-name english-name */
  const m = line.match(/^(?:[A-Z][A-Za-z ]+?)?\s+(\d{3,4})\s{2,}(\S.*?)\s{2,}(\S.*?)(?:\s{2,}(\S.*))?$/);
  if (m && Number(m[1]) >= 100) {
    last = m[1];
    nativeAt = line.indexOf(m[3], line.indexOf(m[2]) + m[2].length);
    englishAt = m[4] ? line.lastIndexOf(m[4]) : Infinity;
    names[last] = { short: m[2].trim(), native: m[3].trim(), english: (m[4] || "").trim() };
    continue;
  }
  /* a continuation: text under the native or the English column; the
     country's name may sit at the start of it, and is blanked out */
  const labelled = line.match(/^([A-Z][A-Za-z ]+?)(\s{10,}\S.*)$/);
  if (last && labelled && !/\d{3,4}/.test(line)) line = " ".repeat(labelled[1].length) + labelled[2];
  if (last && /^\s{20,}\S/.test(line) && !/^\s+\d+\s*$/.test(line)) {
    const nat = line.slice(nativeAt, englishAt === Infinity ? undefined : englishAt).trim();
    const eng = englishAt === Infinity ? "" : line.slice(englishAt).trim();
    if (nat) names[last].native += " " + nat;
    if (eng) names[last].english += " " + eng;
    continue;
  }
  if (!line.trim()) last = null;
}

const out = {};
for (const [id, n] of Object.entries(names)) {
  out[id] = FIX[id] || { native: current(n.native), english: current(n.english) };
}
const file = path.join(__dirname, "ches-2024-party-names.json");
fs.writeFileSync(file, JSON.stringify(out, null, 1) + "\n");
console.log(`→ tools/ches-2024-party-names.json: ${Object.keys(out).length} parties`);
