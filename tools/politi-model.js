"use strict";
/* The compass model: the axes and their weights, the party references, and
   every computation that turns a PolitiScales profile into a position.

   Shared file: loaded as-is by the browser (inlined into index.html) and by
   Node (require), exactly like politi-dissect.js beside it. It touches no DOM
   and holds no state — the page keeps the current country, the module only
   computes.

   It returns KEYS, never sentences: `fitOf` gives "near", not "proche", and
   `methodTag` gives "revolutionary". Wording belongs to the site's locale table,
   site/src/lib/i18n/fr.js, so a second language changes nothing here.

   Being requirable is the point: the weighting, the thresholds and the
   proximity claims have all been measured, and a measurement nobody else can
   re-run is just an assertion. */
(function (global) {

  /* The 8 PolitiScales axes. `neg` pulls left (X) or down (Y), `pos` pulls
     right or up. `axis: null` means descriptive only. */
  const AXES = [
    { neg: ["com"], pos: ["cap"],  axis: "x", w: 0.45 },
    { neg: ["reg"], pos: ["laf"],  axis: "x", w: 0.35 },
    /* Ecology <-> Productivism does NOT feed axis X. It used to, at 20%, which
       mixed two different things: the party references come from CHES, whose
       `lrecon` scale (taxes, spending, deregulation) excludes the environment —
       CHES keeps it as a separate variable. So we were comparing an
       economy+ecology axis against a purely economic one. The worst-affected
       profile came out 12 points too far left: ecological AND pro-market, their
       ecology dragged them leftwards even though it says nothing about their
       relationship to the market. Ecology is now a separate readout, like
       sovereignism. */
    { neg: ["eco"], pos: ["prod"], axis: null },
    { neg: ["cst"], pos: ["ess"],  axis: "y", w: 0.30 },
    { neg: ["rehab"], pos: ["pun"], axis: "y", w: 0.25 },
    { neg: ["prg"], pos: ["csv"],  axis: "y", w: 0.25 },
    { neg: ["int"], pos: ["nat"],  axis: "y", w: 0.20 },
    { neg: ["rev"], pos: ["ref"],  axis: null }
  ];

  /* Reference parties, on the same [-100, 100] scales as the profiles, grouped
     by country. A profile means nothing in the absolute: it only reads against
     the forces it could actually vote for, and those change at every border.

     `src` carries where a pair of coordinates comes from, so the page can count
     its own sources instead of a hardcoded sentence going stale:
       "ches" — read off the Chapel Hill Expert Survey 2024 (609 political
                scientists, 279 European parties), converted from its 0-10
                `lrecon` (economic left-right) and `galtan` (libertarian-
                authoritarian) scales: value = (score − 5) × 20. Those are
                exactly the two dimensions of this compass, which is why the
                conversion is a rescaling and nothing more.
       "est"  — hand estimate, calibrated against the CHES entries around it.

     `prot` is CHES `protectionism` (0 = trade liberalisation, 10 = protection
     of domestic producers), converted the same way. It is carried for France,
     Germany and the UK only. For Italy all nine party means are whole
     numbers, where the other countries' rest on five to eleven experts —
     consistent with a single rater, so the variable is left out rather than
     drawn as if it were a measure; `protWhy` says so on the page. Hand
     estimates carry no `prot`: there is nothing to estimate it from.

     What does NOT transpose is the meaning of "a party". CHES rates parties, so
     in a multi-party system each reference is one. The United States are not in
     CHES — no expert survey on these scales covers them — and two parties that
     each span half the board would place nobody: the American table therefore
     rates the main tendencies as well, and says so. Comparing a profile to
     "the Democratic Party" and to "its progressive wing" are two different
     questions, and only the second one is informative there. */
  const COUNTRIES = [
    {
      code: "fr", name: "France", parties: [
        { name: "Lutte ouvrière",     x: -92, y: -30, src: "est",  note: "Trotskisme, anticapitalisme de classe" },
        { name: "NPA / Rév. perm.",   x: -88, y: -70, src: "est",  note: "Anticapitalisme, forte ouverture sociétale" },
        { name: "La France insoumise",x: -82, y: -64, src: "ches", prot: 48, note: "Rupture écosocialiste, populisme de gauche" },
        { name: "PCF",                x: -75, y: -29, src: "ches", prot: 56, note: "Étatisme économique, sensibilité souverainiste" },
        { name: "Les Écologistes",    x: -54, y: -66, src: "ches", prot: 15, note: "Écologie politique, libéralisme culturel" },
        { name: "Parti socialiste",   x: -33, y: -45, src: "ches", prot: 8, note: "Social-démocratie réformiste" },
        { name: "La France humaniste",x: -15, y: -22, src: "est",  note: "Villepin, 2025 — gaullisme social : patrimoine et successions taxés, mais déficit sous 3 %, simplification par ordonnances. Postérieur au CHES, placement incertain" },
        { name: "MoDem",              x:  14, y: -10, src: "ches", prot: -24, note: "Centrisme social, europhilie" },
        { name: "Rassemblement national", x: 20, y: 67, src: "ches", prot: 70, note: "Étatisme social ciblé, nationalisme" },
        { name: "Renaissance",        x:  24, y: -18, src: "ches", prot: -24, note: "Libéralisme économique, centre-droit" },
        { name: "Horizons",           x:  36, y:   6, src: "ches", prot: -28, note: "Droite libérale gestionnaire" },
        { name: "Debout la France",   x:  38, y:  62, src: "est",  note: "Souverainisme gaulliste" },
        { name: "Les Républicains",   x:  56, y:  44, src: "ches", prot: -12, note: "Droite conservatrice, ordre et marché" },
        { name: "Nouvelle Énergie",   x:  62, y:  32, src: "est",  note: "Lisnard — droite libérale et décentralisatrice : choc de dérégulation, retraite par capitalisation, migration hors contrôle des cours européennes" },
        { name: "Reconquête",         x:  67, y:  82, src: "ches", prot: 37, note: "Libéralisme économique, national-conservatisme" }
      ]
    },
    {
      code: "de", name: "Allemagne", parties: [
        { name: "Die Linke",          x: -73, y: -54, src: "ches", prot: 60, note: "Gauche radicale, redistribution et ouverture sociétale" },
        { name: "BSW",                x: -44, y:  41, src: "ches", prot: 63, note: "Scission de Die Linke — étatisme économique et conservatisme culturel, le quadrant que l'échiquier français laisse vide" },
        { name: "Grüne",              x: -33, y: -68, src: "ches", prot: -6, note: "Écologie politique, libéralisme culturel" },
        { name: "SPD",                x: -31, y: -28, src: "ches", prot: 6, note: "Social-démocratie de gouvernement" },
        { name: "Freie Wähler",       x:  29, y:  34, src: "ches", prot: 10, note: "Centre-droit localiste, ancré en Bavière" },
        { name: "CDU",                x:  32, y:  31, src: "ches", prot: -29, note: "Démocratie chrétienne, centre-droit de gouvernement" },
        { name: "CSU",                x:  35, y:  51, src: "ches", prot: 0, note: "Aile bavaroise de la CDU, nettement plus conservatrice" },
        { name: "FDP",                x:  52, y: -36, src: "ches", prot: -63, note: "Libéralisme de marché ET libéralisme culturel — sans équivalent français de ce poids" },
        { name: "AfD",                x:  53, y:  88, src: "ches", prot: 40, note: "Droite radicale nationaliste" }
      ]
    },
    {
      code: "it", name: "Italie",
      protWhy: "pour l'Italie, les neuf positions du CHES 2024 sur le protectionnisme sont des "
             + "nombres entiers, là où les autres pays reposent sur cinq à onze experts : "
             + "vraisemblablement un seul expert, trop peu pour placer les partis.",
      parties: [
        { name: "Sinistra Italiana",  x: -72, y: -66, src: "ches", note: "Gauche radicale, composante de l'alliance AVS" },
        { name: "Europa Verde",       x: -56, y: -66, src: "ches", note: "Écologistes, composante de l'alliance AVS" },
        { name: "M5S",                x: -43, y: -35, src: "ches", note: "Mouvement 5 étoiles — populisme devenu social, longtemps hors du clivage" },
        { name: "Partito Democratico",x: -41, y: -53, src: "ches", note: "Centre-gauche social-démocrate" },
        { name: "SVP",                x:   0, y:   2, src: "ches", note: "Parti régionaliste sud-tyrolien, au centre des deux axes" },
        { name: "Azione",             x:   4, y: -31, src: "ches", note: "Centre libéral réformateur" },
        { name: "Più Europa",         x:   5, y: -73, src: "ches", note: "Centre libéral, fortement europhile" },
        { name: "Fratelli d'Italia",  x:  28, y:  83, src: "ches", note: "Droite nationale-conservatrice, au gouvernement depuis 2022" },
        { name: "Lega",               x:  36, y:  77, src: "ches", note: "Droite radicale, régionaliste à l'origine" },
        { name: "Forza Italia",       x:  48, y:  21, src: "ches", note: "Droite libérale-conservatrice" }
      ]
    },
    {
      code: "uk", name: "Royaume-Uni", parties: [
        { name: "Green Party",        x: -58, y: -71, src: "ches", prot: 0, note: "Écologistes d'Angleterre et du pays de Galles" },
        { name: "Plaid Cymru",        x: -42, y: -31, src: "ches", prot: -4, note: "Nationalisme gallois de gauche" },
        { name: "SNP",                x: -38, y: -44, src: "ches", prot: -14, note: "Indépendantisme écossais, social-démocrate" },
        { name: "Labour",             x: -28, y: -33, src: "ches", prot: -31, note: "Travaillisme de gouvernement, recentré" },
        { name: "Liberal Democrats",  x: -14, y: -65, src: "ches", prot: -46, note: "Centre libéral, très libéral culturellement" },
        { name: "Conservative Party", x:  49, y:  43, src: "ches", prot: -16, note: "Conservatisme de marché" },
        { name: "Reform UK",          x:  68, y:  82, src: "ches", prot: 22, note: "Droite radicale issue du Brexit" }
      ]
    },
    {
      /* No CHES survey covers the United States: CHES-USA is announced but
         unreleased. Every position here is an estimate, and the table is the
         one that mixes parties and tendencies — see the note above. */
      code: "us", name: "États-Unis",
      why: "aucune enquête CHES ne couvre les États-Unis (CHES-USA est annoncée, pas publiée). "
         + "Le bipartisme y rend d'ailleurs le parti seul peu parlant : les deux grands partis "
         + "agrègent des positions très écartées, donc leurs principaux courants sont placés à "
         + "part. À lire comme un ordre de grandeur, pas comme une mesure.",
      parties: [
        { name: "Green Party",              x: -65, y: -62, src: "est", note: "Écosocialisme, hors des deux grands partis" },
        { name: "Démocrates progressistes", x: -52, y: -52, src: "est", note: "Sanders, Ocasio-Cortez — assurance maladie publique, Green New Deal" },
        { name: "Parti démocrate",          x: -16, y: -30, src: "est", note: "Centre-gauche à l'échelle européenne : le marché y est peu contesté, le libéralisme culturel assumé" },
        { name: "Républicains modérés",     x:  55, y:  30, src: "est", note: "Républicanisme d'avant 2016 : marché, défense, conservatisme social tempéré" },
        { name: "Parti républicain",        x:  62, y:  72, src: "est", note: "Marché, conservatisme social et national" },
        { name: "Parti libertarien",        x:  88, y: -32, src: "est", note: "Marché sans entrave et libertés individuelles — quadrant que personne n'occupe en Europe à ce niveau" }
      ]
    }
  ];

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* A component only counts if at least one of its two poles is filled in.
     Weights are renormalised over the components present, so an incomplete
     profile stays on the same [-100, 100] scale as the others. */
  function axisScore(p, which) {
    let sum = 0, weight = 0;
    for (const a of AXES) {
      if (a.axis !== which) continue;
      const lo = p[a.neg[0]], hi = p[a.pos[0]];
      const hasLo = Number.isFinite(lo), hasHi = Number.isFinite(hi);
      if (!hasLo && !hasHi) continue;
      sum += a.w * ((hasHi ? hi : 0) - (hasLo ? lo : 0));
      weight += a.w;
    }
    if (!weight) return 0;
    return clamp(sum / weight, -100, 100);
  }

  /* "revolutionary" | "reformist" | "neither" | null */
  function methodTag(p) {
    const rev = Number(p.rev), ref = Number(p.ref);
    if (!Number.isFinite(rev) && !Number.isFinite(ref)) return null;
    const d = (rev || 0) - (ref || 0);
    if (d > 20) return "revolutionary";
    if (d < -20) return "reformist";
    return "neither";
  }

  function coords(p) {
    return {
      x: Math.round(axisScore(p, "x")),
      y: Math.round(axisScore(p, "y")),
      /* No longer shown: tools/model-check.js, run on a real group, found it
         repeating y while looking like a separate reading. Kept so the check
         can be re-run on other groups. */
      sov: Math.round((Number(p.nat) || 0) - (Number(p.int) || 0)),
      ecol: Math.round((Number(p.eco) || 0) - (Number(p.prod) || 0)),
      method: methodTag(p)
    };
  }

  /* Median distance from a reference to its nearest neighbour. */
  function spacingOf(refs) {
    if (refs.length < 2) return 0;
    const nn = refs.map((r, i) => Math.min(...refs
      .filter((_, j) => j !== i).map(o => Math.hypot(o.x - r.x, o.y - r.y))));
    nn.sort((a, b) => a - b);
    return nn[nn.length >> 1];
  }

  /* Proximity thresholds, DERIVED from the references rather than hardcoded.
     "Close" means no further from a reference than that reference is from its
     own neighbour; beyond one and a half times, none is genuinely close.
     Deriving them keeps them from going stale: pinned at 20 and 32 against the
     old positions, they were wrong the moment the CHES data was adopted.

     `tie` is the third: below that gap between the first and second reference,
     the attachment is a toss-up. Measured on 4000 synthetic profiles over the
     French board — under a third of the spacing, a third to a half of profiles
     get a different nearest reference under equally defensible axis weights,
     against 6% past ten points. The scaling to other countries follows their
     own spacing, which is an inference and not a measurement.

     Every country gets its own: one whose parties crowd together earns tighter
     thresholds than one spread over the whole board. */
  function limitsFor(refs) {
    const s = spacingOf(refs);
    return { near: Math.round(s), far: Math.round(s * 1.5), tie: Math.round(s * 0.3) };
  }

  /* "near" | "moderate" | "far" */
  const fitOf = (d, limits) =>
    (d <= limits.near ? "near" : d <= limits.far ? "moderate" : "far");

  /* Nearest neighbour, replacing a cascade of thresholds that left gaps (the
     whole right-libertarian quadrant, and x = 0) and had unreachable branches
     (the RN was always caught by "x > 0 && y < 0" before being tested).

     Named for what it returns: the closest reference point and how far away it
     is. It was `nearestFamily`, which promised a political family the two
     coordinates cannot establish — and the runner-up comes back with it,
     because the margin between the two is what decides whether the answer
     survives a different weighting. */
  function nearestReference(x, y, refs, limits) {
    if (!refs.length) return null;
    const ranked = refs
      .map(r => ({ r, d: Math.hypot(r.x - x, r.y - y) }))
      .sort((a, b) => a.d - b.d);
    const best = ranked[0];
    const d = Math.round(best.d);
    const runnerUp = ranked[1];
    const second = runnerUp
      ? { name: runnerUp.r.name, d: Math.round(runnerUp.d) } : null;
    return { name: best.r.name, ref: best.r, d, fit: fitOf(best.d, limits), second,
             margin: second ? second.d - d : Infinity };
  }

  /* Distances from a point to every reference, nearest first. dx/dy are
     signed: "this party sits 34 points to your right". */
  function rankParties(c, refs) {
    return refs
      .map(r => ({ name: r.name, ref: r,
                   d: Math.round(Math.hypot(r.x - c.x, r.y - c.y)),
                   dx: r.x - c.x, dy: r.y - c.y }))
      .sort((a, b) => a.d - b.d);
  }

  /* The widest hole on the economic axis, which is where a profile gets
     attached to a reference it is not really close to. Measured rather than
     asserted: the copy used to name the French centre gap, which said nothing
     about Germany. */
  function widestEconGap(refs) {
    const sorted = refs.slice().sort((a, b) => a.x - b.x);
    let best = null;
    for (let i = 1; i < sorted.length; i++) {
      const d = sorted[i].x - sorted[i - 1].x;
      if (!best || d > best.d) best = { d, lo: sorted[i - 1], hi: sorted[i] };
    }
    return best;
  }

  const countryByCode = code => COUNTRIES.find(c => c.code === code) || null;

  const api = { AXES, COUNTRIES, clamp, axisScore, methodTag, coords, spacingOf,
                limitsFor, fitOf, nearestReference, rankParties, widestEconGap,
                countryByCode };
  /* both: Node's tools require it, and the site imports it as a module,
     which may or may not see `module` depending on where it runs */
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.PolitiModel = api;

})(typeof globalThis !== "undefined" ? globalThis : this);
