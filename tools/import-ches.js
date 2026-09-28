#!/usr/bin/env node
"use strict";
/* The reference tables of every CHES 2024 country but the four written by
   hand in politi-model.js (France, Germany, Italy, United Kingdom).

     node tools/import-ches.js   → tools/politi-countries.js

   Three public sources, downloaded each time, so that anyone can re-run it
   and get the same file:
     - CHES 2024: positions (lrecon, galtan, protectionism, eu_position,
       environment and climate_change) and
       each party's family
     - Party Facts: the link from the CHES id to POPPA's
     - POPPA 2023 (CC0): populism, through the Party Facts id
   and one file kept in the repo, tools/ches-2024-party-names.json, read
   from the CHES 2024 codebook by tools/ches-names.js: each party's current
   full name.
   Conversions are those of politi-model.js: (score − 5) × 20 for 0-10
   scales, (score − 4) / 3 × 100 for eu_position, rounded as JavaScript does.

   A party is named by its CHES short name, the current one, as a foreign
   party usually is. Its note gives its full name in its own language and
   its CHES family, which is all these sources say about it; no
   description is written by hand for these countries. The full name comes
   from the codebook. Failing it, Party Facts's is taken, but only when its
   short name matches the CHES one: Party Facts follows a party's lineage
   and may name it as it was (Amaiur for EH Bildu).

   Protectionism is left out of a country where half or more of its party
   means are whole numbers: one or two experts, as Italy's, not a measure.
   The country then says why, as Italy does. */

const fs = require("fs");
const path = require("path");

const CHES_URL = "https://github.com/chesdata/chesdata.github.io/releases/download/ches-europe/CHES_2024_final_v2.csv";
const PF_EXTERNAL = "https://partyfacts.herokuapp.com/download/external-parties-csv/";
const PF_CORE = "https://partyfacts.herokuapp.com/download/core-parties-csv/";
const POPPA_URL = "https://dataverse.harvard.edu/api/access/datafile/13172366";
const CODEBOOK = require("./ches-2024-party-names.json");

/* CHES country codes, the four handled by hand left out */
const COUNTRY = {
  1: ["be", "Belgique"], 2: ["dk", "Danemark"], 4: ["gr", "Grèce"], 5: ["es", "Espagne"],
  7: ["ie", "Irlande"], 10: ["nl", "Pays-Bas"], 12: ["pt", "Portugal"], 13: ["at", "Autriche"],
  14: ["fi", "Finlande"], 16: ["se", "Suède"], 20: ["bg", "Bulgarie"], 21: ["cz", "Tchéquie"],
  22: ["ee", "Estonie"], 23: ["hu", "Hongrie"], 24: ["lv", "Lettonie"], 25: ["lt", "Lituanie"],
  26: ["pl", "Pologne"], 27: ["ro", "Roumanie"], 28: ["sk", "Slovaquie"], 29: ["si", "Slovénie"],
  31: ["hr", "Croatie"], 34: ["tr", "Turquie"], 35: ["no", "Norvège"], 36: ["ch", "Suisse"],
  37: ["mt", "Malte"], 40: ["cy", "Chypre"], 45: ["is", "Islande"]
};
/* CHES party families, checked on the French and German parties */
const FAMILY = {
  1: "droite radicale", 2: "conservateurs", 3: "libéraux", 4: "démocrates-chrétiens",
  5: "sociaux-démocrates", 6: "gauche radicale", 7: "écologistes", 8: "régionalistes",
  9: "sans famille", 10: "confessionnels", 11: "agrariens et centre"
};

/* RFC 4180, enough for these three files */
function parseCsv(text) {
  const rows = []; let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows.filter(r => r.length > 1);
  return body.map(r => Object.fromEntries(head.map((h, k) => [h, r[k] ?? ""])));
}
const get = async url => {
  const r = await fetch(url, { redirect: "follow" });
  if (!r.ok) throw new Error(url + ": " + r.status);
  return parseCsv(await r.text());
};
const num = v => (v === "" || v === "NA" || v === undefined ? null : Number(v));
const jsRound = v => Math.floor(v + 0.5);
const on10 = v => (v === null ? null : jsRound((v - 5) * 20));
const on7 = v => (v === null ? null : jsRound((v - 4) / 3 * 100));
const whole = v => Math.abs(v - Math.round(v)) < 1e-4;
const bare = s => (s || "").normalize("NFKD").replace(/[^A-Za-z0-9]/g, "").toLowerCase();
/* the two sources name the same party alike */
const sameParty = (ches, ...pf) => {
  const a = bare(ches);
  return !!a && pf.some(n => { const b = bare(n); return !!b && (a.includes(b) || b.includes(a)); });
};
/* Party Facts writes successive or bilingual names with a long dash */
const tidy = s => s.replace(/\s*—\s*/g, " / ");

(async () => {
  const [ches, external, core, poppa] = await Promise.all([get(CHES_URL), get(PF_EXTERNAL), get(PF_CORE), get(POPPA_URL)]);
  const pfOfChes = new Map(external.filter(r => r.dataset_key === "ches").map(r => [r.dataset_party_id, r.partyfacts_id]));
  const coreById = new Map(core.map(r => [r.partyfacts_id, r]));
  const popByPf = new Map(poppa.filter(r => r.wave.startsWith("Wave 2") && num(r.populism_cfa_rescaled) !== null)
    .map(r => [r.partyfacts_id, on10(num(r.populism_cfa_rescaled))]));

  const countries = [];
  let named = 0, withPop = 0, total = 0;
  for (const [cc, [code, name]] of Object.entries(COUNTRY)) {
    const rows = ches.filter(r => r.country === cc);
    const prots = rows.map(r => num(r.protectionism)).filter(v => v !== null);
    const protThin = prots.length > 0 && prots.filter(whole).length / prots.length >= 0.5;
    const parties = rows
      .filter(r => num(r.lrecon) !== null && num(r.galtan) !== null)
      .map(r => {
        total++;
        const pf = pfOfChes.get(r.party_id);
        const c = pf ? coreById.get(pf) : null;
        const ext = pf ? external.find(e => e.dataset_key === "ches" && e.dataset_party_id === r.party_id) : null;
        const book = CODEBOOK[r.party_id];
        const full = book && (book.native || book.english) ? book.native || book.english
          : c && (c.name || c.name_english) && sameParty(r.party, c.name_short, ext && ext.name_short)
            ? tidy(c.name || c.name_english) : null;
        if (full) named++;
        const p = { name: tidy(r.party), x: on10(num(r.lrecon)), y: on10(num(r.galtan)), src: "ches" };
        if (!protThin && num(r.protectionism) !== null) p.prot = on10(num(r.protectionism));
        if (num(r.eu_position) !== null) p.eu = on7(num(r.eu_position));
        /* the environment against growth, turned so that +100 is the environment */
        const envs = [num(r.environment), num(r.climate_change)].filter(v => v !== null);
        if (envs.length) p.env = -on10(envs.reduce((a, b) => a + b, 0) / envs.length);
        const pop = pf ? popByPf.get(pf) : undefined;
        if (pop !== undefined) { p.pop = pop; withPop++; }
        p.note = (full ? full + " · " : "") + (FAMILY[r.family] || "famille non renseignée");
        return p;
      })
      .sort((a, b) => a.x - b.x);
    const country = { code, name, parties };
    if (protThin) country.protWhy = "pour ce pays, la moitié au moins des positions du CHES 2024 sur le "
      + "protectionnisme sont des nombres entiers : vraisemblablement un ou deux experts, trop peu "
      + "pour placer les partis.";
    countries.push(country);
  }
  countries.sort((a, b) => a.name.localeCompare(b.name, "fr"));

  const body = countries.map(c => {
    const why = c.protWhy ? `\n    protWhy: ${JSON.stringify(c.protWhy)},` : "";
    const ps = c.parties.map(p => "      " + JSON.stringify(p)).join(",\n");
    return `  {\n    code: ${JSON.stringify(c.code)}, name: ${JSON.stringify(c.name)},${why}\n    parties: [\n${ps}\n    ]\n  }`;
  }).join(",\n");
  const out = `"use strict";
/* Generated by tools/import-ches.js: do not edit by hand, re-run it.
   CHES 2024 (positions, families, names from its codebook), POPPA 2023 (populism).
   ${countries.length} countries, ${total} parties. */
(function (global) {
  const COUNTRIES = [
${body}
  ];
  if (typeof module !== "undefined" && module.exports) module.exports = COUNTRIES;
  global.PolitiCountries = COUNTRIES;
})(typeof globalThis !== "undefined" ? globalThis : this);
`;
  const file = path.join(__dirname, "politi-countries.js");
  fs.writeFileSync(file, out);
  console.log(`→ tools/politi-countries.js: ${countries.length} countries, ${total} parties, `
    + `${named} with a full name, ${withPop} with a POPPA score; protectionism left out in `
    + (countries.filter(c => c.protWhy).map(c => c.name).join(", ") || "none"));
})().catch(e => { console.error(e.message); process.exit(1); });
