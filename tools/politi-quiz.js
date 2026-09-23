"use strict";
/* The native questionnaire: the item bank, the answer scales, and the scoring
   that turns answers into readings.

   Shared file, like politi-model.js beside it: loaded as-is by the browser
   (inlined into index.html) and by Node (require). It touches no DOM and holds
   no state.

   Every item is quoted, not written. The wording comes from a field-tested
   survey (ESS, ISSP, EVS), in the official French questionnaire of that
   survey, and each item carries where it comes from. The one exception is
   Wright's class scale, which has no French version at all — France was not in
   his project — so its items are translated here and marked `translated`, and
   the page has to say so. Item text is French because it is quoted material,
   like the party notes in politi-model.js: a second language adds a key next
   to `fr`, it does not replace it.

   Several readings, not one point. The economy theme feeds:
     x              the economic left-right axis, on the scale of CHES `lrecon`
     protectionism  a separate readout: in CHES 2024 it runs AGAINST lrecon
                    (r = -0.37 over 279 parties) and with galtan (+0.43) —
                    LFI and the RN are both protectionist — so folding it into
                    x would repeat the mistake ecology made at 20%
     class          Wright's anticapitalism scale, which is a rival account of
                    the same conflict, not a component of x
     conflict       perceived conflict between classes (ISSP), reported beside
                    Wright's scale rather than mixed into it: adding items to a
                    validated scale makes it a different, unvalidated one
     labour         the balance of power between capital and labour — unions,
                    business — which is an attitude to that balance, not a
                    perception of conflict, so it gets its own reading
   Salience is asked per theme, twice: before the items and after them. The
   first records the weight the theme had coming in, the second whether
   answering moved it; both are returned as is, never folded into a score. */
(function (global) {

  /* Answer scales. `values` go from the first option to the last, in [-1, 1],
     and are oriented later by each item's `pole`. `dk` is the survey's own
     "can't choose" option, which counts as no answer — except in Wright's
     scale, where it scores 0 and so still counts. */
  const even = n => Array.from({ length: n }, (_, i) => -1 + 2 * i / (n - 1));

  const SCALES = {
    /* ESS, France: the agree/disagree card, as printed from round 1 to round
       11 ("LISTE 13" in round 9). "Ne sait pas" was an interviewer code, never
       read out. */
    agreePlutot: {
      values: [1, 0.5, 0, -0.5, -1],
      fr: ["Tout à fait d'accord", "Plutôt d'accord", "Ni d'accord, ni pas d'accord",
           "Plutôt pas d'accord", "Pas du tout d'accord"]
    },
    /* ISSP, France, 2013-2023. */
    agreeIssp: {
      values: [1, 0.5, 0, -0.5, -1],
      fr: ["Tout à fait d'accord", "Plutôt d'accord", "Ni d'accord, ni pas d'accord",
           "Plutôt pas d'accord", "Pas du tout d'accord"],
      dk: "Ne peut choisir"
    },
    /* ISSP Role of Government, France, 2016, Q5. */
    favourIssp: {
      values: [1, 0.5, 0, -0.5, -1],
      fr: ["Très favorable", "Assez favorable", "Ni pour, ni contre",
           "Assez défavorable", "Très défavorable"],
      dk: "Ne peut choisir"
    },
    /* ISSP Social Inequality, France, 2019, Q08a. */
    taxShareIssp: {
      values: [-1, -0.5, 0, 0.5, 1],
      fr: ["Une part beaucoup plus importante", "Une part plus importante",
           "Une part égale", "Une part plus faible", "Une part beaucoup plus faible"],
      dk: "Ne peut choisir"
    },
    /* ISSP Social Inequality, France, 2019, Q12. */
    conflictIssp: {
      values: [1, 1 / 3, -1 / 3, -1],
      fr: ["Des conflits très importants", "Des conflits importants",
           "Des conflits, mais pas très importants", "Pas de conflits du tout"],
      dk: "Ne peut choisir"
    },
    /* ISSP Role of Government, France, 2016, Q6. */
    spendIssp: {
      values: [-1, -0.5, 0, 0.5, 1],
      fr: ["Dépenser beaucoup plus", "Dépenser plus", "Maintenir les dépenses actuelles",
           "Dépenser moins", "Dépenser beaucoup moins"],
      dk: "Ne peut choisir"
    },
    /* ISSP Role of Government, France, 1996, Q11. */
    powerIssp: {
      values: [1, 0.5, 0, -0.5, -1],
      fr: ["Beaucoup trop", "Trop", "À peu près comme il faut", "Trop peu", "Beaucoup trop peu"],
      dk: "Ne peut choisir"
    },
    /* ISSP Role of Government, France, 1996, Q18: two options only. */
    ownerIssp: {
      values: [1, -1],
      fr: ["Le secteur privé", "L'État"],
      dk: "Ne peut choisir"
    },
    /* EVS 2017: a 1-10 card between two opposed statements, carried by the
       item (`left`, `right`). Kept at ten points because that is the format
       it was fielded in; the fine grain matters little once averaged. */
    bipolar10: { values: even(10), bipolar: true },
    /* ESS round 4, D34: 0-10. */
    bipolar11: { values: even(11), bipolar: true },
    /* Wright: four points, no midpoint, "don't know" scored 0. The French
       labels are ours, like the items. */
    agreeWright: {
      values: [1, 0.5, -0.5, -1],
      fr: ["Tout à fait d'accord", "Plutôt d'accord", "Plutôt pas d'accord",
           "Pas du tout d'accord"],
      dk: "Ne sait pas", dkScores: 0
    },
    /* Salience. Not a survey item — no field-tested per-theme importance
       question exists; the surveys ask for "the most important problem"
       instead. Four labelled points rather than CHES's expert 0-10: a
       respondent cannot tell a 9 from a 10 about themselves. */
    salience: {
      values: [0, 1 / 3, 2 / 3, 1],
      fr: ["Secondaire pour moi", "Assez important", "Très important",
           "C'est ce qui décide de mon vote"]
    }
  };

  const ESS_FR = "https://stessrelpubprodwe.blob.core.windows.net/data/";
  const GESIS = id => "https://access.gesis.org/dbk/" + id;
  const WRIGHT = "https://www.sscc.wisc.edu/soc/faculty/pages/wright/";

  /* The item bank. `reading` is what the item feeds, `dim` the CHES
     sub-dimension for x. `pole: 1` keeps the scale's orientation, `-1` flips
     it, so that after orientation +1 always means: right on x, protectionist,
     anticapitalist on class, conflict perceived, on the side of labour. */
  const SPEND_STEM = "Pour chacun des secteurs suivants, pouvez-vous dire si vous souhaiteriez que le gouvernement dépense plus ou moins ? N'oubliez pas que dépenser « beaucoup plus » peut entraîner une augmentation des impôts, taxes ou cotisations sociales.";
  const OWNER_STEM = "Qui, d'après vous, devrait principalement gérer les services suivants, l'État ou le secteur privé ?";
  const ACTIONS_STEM = "Voici un certain nombre d'actions économiques que les gouvernements peuvent faire. Pouvez-vous indiquer si vous y êtes favorable ou défavorable ?";
  const CONFLICT_STEM = "Dans tous les pays, il y a des différences, ou même des conflits entre les différents groupes. À votre avis, en France, est-ce qu'il y a beaucoup de conflits…";

  const spending = (id, fr) => ({
    id: "issp.spend." + id, theme: "economy", reading: "x", dim: "spendvtax",
    scale: "spendIssp", pole: 1, stem: SPEND_STEM, fr,
    src: { survey: "ISSP", wave: "Rôle de l'État 2016", variable: "Q6", url: GESIS(63847) } });
  const ownership = (id, fr) => ({
    id: "issp.owner." + id, theme: "economy", reading: "x", dim: "deregulation",
    scale: "ownerIssp", pole: 1, stem: OWNER_STEM, fr,
    src: { survey: "ISSP", wave: "Rôle de l'État 1996", variable: "Q18", url: GESIS(6806) } });

  const ITEMS = [
    /* --- x: redistribution (CHES `redistribution`, r = 0.96 with lrecon) --- */
    { id: "ess.gincdif", theme: "economy", reading: "x", dim: "redistribution",
      scale: "agreePlutot", pole: -1,
      fr: "Le gouvernement devrait prendre des mesures pour réduire les différences de revenu.",
      src: { survey: "ESS", wave: "rounds 4-11", variable: "gincdif",
             url: ESS_FR + "round9/fieldwork/france/ESS9_questionnaires_FR.pdf" } },
    { id: "evs.v106", theme: "economy", reading: "x", dim: "redistribution",
      scale: "bipolar10", pole: 1,
      left: "Les revenus devraient être plus égalitaires",
      right: "Il faudrait encourager davantage les efforts individuels",
      src: { survey: "EVS", wave: "2017", variable: "v106", url: GESIS(66251) } },
    { id: "issp.taxshare", theme: "economy", reading: "x", dim: "redistribution",
      scale: "taxShareIssp", pole: 1,
      fr: "Pensez-vous que les personnes ayant des revenus élevés devraient payer en impôts une part plus importante, égale ou plus faible que celle des personnes à faibles revenus ?",
      src: { survey: "ISSP", wave: "Inégalités sociales 2019", variable: "v28", url: GESIS(73310) } },
    { id: "ess.smdfslv", theme: "economy", reading: "x", dim: "redistribution",
      scale: "agreePlutot", pole: -1,
      fr: "Pour qu'une société soit juste, les différences de niveau de vie entre les gens devraient être faibles.",
      src: { survey: "ESS", wave: "rounds 4 and 8", variable: "smdfslv",
             url: ESS_FR + "round8/fieldwork/france/ESS8_questionnaires_FR.pdf" } },
    { id: "ess.dfincac", theme: "economy", reading: "x", dim: "redistribution",
      scale: "agreePlutot", pole: 1,
      fr: "De grandes différences de revenus entre les gens sont acceptables pour récompenser convenablement les différences de talents et d'efforts de chacun.",
      src: { survey: "ESS", wave: "rounds 4 and 8", variable: "dfincac",
             url: ESS_FR + "round8/fieldwork/france/ESS8_questionnaires_FR.pdf" } },

    /* --- x: public services vs taxes (CHES `spendvtax`, r = 0.92) --- */
    { id: "ess.ditxssp", theme: "economy", reading: "x", dim: "spendvtax",
      scale: "bipolar11", pole: -1,
      fr: "Beaucoup de services et prestations sociales sont financés par les impôts. Si le gouvernement devait choisir entre augmenter les impôts et consacrer plus d'argent aux services et prestations sociales ou, au contraire, diminuer les impôts et consacrer moins d'argent aux services et prestations sociales, que devrait-il choisir ?",
      /* The question is official French; the two ends of its show card were not
         found, so these anchors are translated from the English source. */
      left: "Diminuer beaucoup les impôts et dépenser beaucoup moins",
      right: "Augmenter beaucoup les impôts et dépenser beaucoup plus",
      translated: "anchors",
      src: { survey: "ESS", wave: "round 4", variable: "ditxssp",
             url: ESS_FR + "round4/fieldwork/france/ESS4_main_questionnaire_FR.pdf" } },
    { id: "evs.v103", theme: "economy", reading: "x", dim: "spendvtax",
      scale: "bipolar10", pole: -1,
      left: "Les individus devraient avoir davantage la responsabilité de subvenir à leurs propres besoins",
      right: "L'État devrait avoir davantage la responsabilité d'assurer à chacun ses besoins",
      src: { survey: "EVS", wave: "2017", variable: "v103", url: GESIS(66251) } },
    spending("health", "La santé"),
    spending("education", "L'éducation"),
    spending("pensions", "Les retraites"),
    spending("unemployment", "Les allocations de chômage"),

    /* --- x: deregulation (CHES `deregulation`, r = 0.90) --- */
    { id: "issp.dereg", theme: "economy", reading: "x", dim: "deregulation",
      scale: "favourIssp", pole: 1,
      stem: ACTIONS_STEM,
      fr: "Assouplir la réglementation du commerce et des affaires",
      src: { survey: "ISSP", wave: "Rôle de l'État 2016", variable: "Q5", url: GESIS(63847) } },
    { id: "evs.v107", theme: "economy", reading: "x", dim: "deregulation",
      scale: "bipolar10", pole: -1,
      left: "La propriété privée des entreprises et des industries devrait être développée",
      right: "La nationalisation des entreprises et des industries devrait être développée",
      src: { survey: "EVS", wave: "2017", variable: "v107", url: GESIS(66251) } },
    { id: "evs.v105", theme: "economy", reading: "x", dim: "deregulation",
      scale: "bipolar10", pole: -1,
      left: "La concurrence est une bonne chose",
      right: "La concurrence est dangereuse",
      src: { survey: "EVS", wave: "2017", variable: "v105", url: GESIS(66251) } },
    { id: "issp.declining", theme: "economy", reading: "x", dim: "deregulation",
      scale: "favourIssp", pole: -1, stem: ACTIONS_STEM,
      fr: "Soutenir les industries en difficulté pour protéger les emplois",
      src: { survey: "ISSP", wave: "Rôle de l'État 2016", variable: "Q5", url: GESIS(63847) } },
    ownership("electricity", "L'électricité"),
    ownership("hospitals", "Les hôpitaux"),
    /* "Le banques" in the 1996 French questionnaire: its typo, corrected. */
    ownership("banks", "Les banques"),

    /* --- protectionism (CHES `protectionism`): not part of x --- */
    { id: "issp.imports", theme: "economy", reading: "protectionism",
      scale: "agreeIssp", pole: 1,
      fr: "La France devrait limiter l'importation de produits étrangers afin de protéger son économie nationale.",
      src: { survey: "ISSP", wave: "Identité nationale 2023", variable: "Q06_A", url: GESIS(80546) } },
    { id: "issp.multinationals", theme: "economy", reading: "protectionism",
      scale: "agreeIssp", pole: 1,
      fr: "Les grands groupes internationaux font de plus en plus de tort aux entreprises locales en France.",
      src: { survey: "ISSP", wave: "Identité nationale 2023", variable: "Q06_F", url: GESIS(80546) } },

    /* --- class: Wright's anticapitalism scale, Class Counts ch. 11 ---
       Five items, -2..+2 each, summed to -10..+10. No official French
       exists; the translations are ours. */
    { id: "wright.corporations", theme: "economy", reading: "class",
      scale: "agreeWright", pole: 1, translated: "item",
      fr: "Les entreprises profitent à leurs propriétaires aux dépens des salariés et des consommateurs.",
      src: { survey: "Wright", wave: "Class Counts, ch. 11, item 1", url: WRIGHT } },
    { id: "wright.strikers", theme: "economy", reading: "class",
      scale: "agreeWright", pole: 1, translated: "item",
      fr: "Pendant une grève, la loi devrait interdire à la direction d'embaucher des travailleurs pour remplacer les grévistes.",
      /* Reads differently here: French law already bars temps and fixed-term
         hires from replacing strikers (Code du travail L1251-10, L1242-6).
         Kept, because it belongs to the validated scale. */
      note: "En France, la loi interdit déjà de remplacer des grévistes par des intérimaires ou des CDD.",
      src: { survey: "Wright", wave: "Class Counts, ch. 11, item 2", url: WRIGHT } },
    { id: "wright.income", theme: "economy", reading: "class",
      scale: "agreeWright", pole: 1, translated: "item",
      fr: "Beaucoup de gens en France gagnent bien moins que ce qu'ils méritent.",
      src: { survey: "Wright", wave: "Class Counts, ch. 11, item 3", url: WRIGHT } },
    { id: "wright.power", theme: "economy", reading: "class",
      scale: "agreeWright", pole: 1, translated: "item",
      fr: "Les grandes entreprises ont trop de pouvoir dans la société française aujourd'hui.",
      src: { survey: "Wright", wave: "Class Counts, ch. 11, item 4", url: WRIGHT } },
    { id: "wright.bosses", theme: "economy", reading: "class",
      scale: "agreeWright", pole: 1, translated: "item",
      fr: "Les salariés non-cadres de votre lieu de travail pourraient faire tourner les choses efficacement sans patrons.",
      src: { survey: "Wright", wave: "Class Counts, ch. 11, item 5", url: WRIGHT } },

    /* --- conflict: ISSP, official French, reported beside Wright's scale --- */
    { id: "issp.conflict.workers", theme: "economy", reading: "conflict",
      scale: "conflictIssp", pole: 1,
      stem: CONFLICT_STEM,
      fr: "Entre les dirigeants et les travailleurs",
      src: { survey: "ISSP", wave: "Inégalités sociales 2019", variable: "Q12_c", url: GESIS(73310) } },
    { id: "issp.conflict.rich", theme: "economy", reading: "conflict",
      scale: "conflictIssp", pole: 1,
      stem: CONFLICT_STEM,
      fr: "Entre les riches et les pauvres",
      src: { survey: "ISSP", wave: "Inégalités sociales 2019", variable: "Q12_a", url: GESIS(73310) } },
    { id: "issp.conflict.classes", theme: "economy", reading: "conflict",
      scale: "conflictIssp", pole: 1, stem: CONFLICT_STEM,
      fr: "Entre la classe ouvrière et la classe moyenne",
      src: { survey: "ISSP", wave: "Inégalités sociales 2019", variable: "Q12_b", url: GESIS(73310) } },
    { id: "issp.cause1", theme: "economy", reading: "conflict",
      scale: "agreeIssp", pole: 1,
      fr: "Les inégalités continuent d'exister car elles bénéficient aux riches et aux puissants.",
      src: { survey: "ISSP", wave: "Inégalités sociales 1999", variable: "V9", url: GESIS(10483) } },

    /* --- labour: the balance of power, +1 = on the side of labour --- */
    { id: "ess.needtru", theme: "economy", reading: "labour",
      scale: "agreePlutot", pole: 1,
      fr: "Les salariés ont besoin de syndicats forts pour défendre leurs conditions de travail et leurs salaires.",
      src: { survey: "ESS", wave: "round 1", variable: "needtru",
             url: ESS_FR + "round1/fieldwork/france/ESS1_main_questionnaire_FR.pdf" } },
    { id: "issp.power.unions", theme: "economy", reading: "labour",
      scale: "powerIssp", pole: -1,
      fr: "Selon vous, les syndicats ont-ils trop ou pas assez de pouvoir ?",
      src: { survey: "ISSP", wave: "Rôle de l'État 1996", variable: "Q11a", url: GESIS(6806) } },
    /* "Et les dirigeants…" answers the unions question: it cannot be read
       alone, so it always follows it, whatever the order. */
    { id: "issp.power.business", theme: "economy", reading: "labour",
      scale: "powerIssp", pole: 1, follows: "issp.power.unions",
      fr: "Et les dirigeants du commerce et de l'industrie, ont-ils trop ou pas assez de pouvoir ?",
      src: { survey: "ISSP", wave: "Rôle de l'État 1996", variable: "Q11b", url: GESIS(6806) } }
  ];

  /* The economy is the first theme, not the only one. The others are listed
     so the page can say what is coming; each has its counterpart in CHES, so
     its readings will be comparable to the parties like x is. `planned`
     themes have no items yet. */
  const THEMES = [
    { key: "economy", readings: ["x", "protectionism", "class", "conflict", "labour"],
      dims: ["redistribution", "spendvtax", "deregulation"] },
    { key: "society", planned: true },       /* y: galtan, immigration, rights, law and order */
    { key: "europe", planned: true },        /* eu_position, eu_russia */
    { key: "ecology", planned: true },       /* environment, climate_change */
    { key: "institutions", planned: true }   /* executive_power, judicial_independence,
                                                regions, and people_v_elite */
  ];

  const itemById = id => ITEMS.find(i => i.id === id) || null;

  /* Items are asked mixed, in one fixed order that everyone gets — within a
     theme and in the complete questionnaire alike. Mixed, so that a run of
     items on one subject does not tell the respondent what is being measured;
     fixed, so that order effects, if any, are the same for every profile and
     answers stay comparable.

     The order is a sort on a hash of each item's id (FNV-1a, 32 bits) rather
     than a seeded shuffle: adding an item slots it in somewhere without
     moving any of the others, where a shuffle would deal the whole deck
     again. Items of a shared grid need no special care, since every screen
     repeats the grid's stem; an item whose wording leans on the one before
     it says so with `follows`, and the two travel as one block, placed by the
     first one's hash. */
  function hashId(id) {
    let h = 0x811c9dc5;
    for (let k = 0; k < id.length; k++) {
      h ^= id.charCodeAt(k);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h;
  }
  function mixedOrder(items) {
    const present = new Set(items.map(i => i.id));
    const heads = items.filter(i => !i.follows || !present.has(i.follows));
    const next = new Map(items.filter(i => i.follows && present.has(i.follows))
                              .map(i => [i.follows, i]));
    heads.sort((a, b) => hashId(a.id) - hashId(b.id) || (a.id < b.id ? -1 : 1));
    const out = [];
    for (const h of heads) {
      for (let i = h; i; i = next.get(i.id)) out.push(i);
    }
    return out;
  }
  const mean = xs => xs.reduce((s, v) => s + v, 0) / xs.length;

  /* One answer, oriented: a number in [-1, 1], or null when the item was
     skipped or answered "can't choose". `answer` is the index of the option
     chosen, or "dk". */
  function itemValue(item, answer) {
    const scale = SCALES[item.scale];
    if (answer === "dk") return scale.dkScores === undefined ? null : scale.dkScores;
    if (!Number.isInteger(answer) || answer < 0 || answer >= scale.values.length) return null;
    return item.pole * scale.values[answer];
  }

  /* Answers -> readings, each on [-100, 100], or null when nothing feeding it
     was answered.

     x is the mean of the three CHES sub-dimensions, each the mean of its
     items. Equal weights, because the plain mean of redistribution, spendvtax
     and deregulation already reproduces lrecon at r = 0.96 across the 279
     CHES 2024 parties — there is no gap for a weighting to close.

     Wright's scale is his sum rescaled, and only reported complete: a partial
     sum of a five-item additive scale is not the scale.

     `n` counts the answers behind each reading, so the page can say how
     thin it is. */
  function score(answers, themeKey) {
    const theme = THEMES.find(t => t.key === themeKey);
    const items = ITEMS.filter(i => i.theme === themeKey);
    const answered = items
      .map(i => ({ i, v: itemValue(i, answers[i.id]) }))
      .filter(a => a.v !== null);

    const out = { n: {} };

    const dims = {};
    for (const d of theme.dims) {
      const vs = answered.filter(a => a.i.reading === "x" && a.i.dim === d).map(a => a.v);
      dims[d] = vs.length ? Math.round(100 * mean(vs)) : null;
    }
    const present = theme.dims.filter(d => dims[d] !== null);
    out.x = present.length ? Math.round(mean(present.map(d => dims[d]))) : null;
    out.dims = dims;
    out.n.x = answered.filter(a => a.i.reading === "x").length;

    for (const r of ["protectionism", "conflict", "labour"]) {
      const vs = answered.filter(a => a.i.reading === r).map(a => a.v);
      out[r] = vs.length ? Math.round(100 * mean(vs)) : null;
      out.n[r] = vs.length;
    }

    const wright = items.filter(i => i.reading === "class");
    const wv = answered.filter(a => a.i.reading === "class");
    out.class = wv.length === wright.length
      ? Math.round(100 * wv.reduce((s, a) => s + a.v, 0) / wright.length) : null;
    out.n.class = wv.length;

    const level = key => {
      const v = answers[key];
      return Number.isInteger(v) && v >= 0 && v < SCALES.salience.values.length ? v : null;
    };
    out.salience = level("salience." + themeKey);
    out.salienceAfter = level("salience." + themeKey + ".after");

    return out;
  }

  const api = { SCALES, ITEMS, THEMES, itemById, itemValue, score, mixedOrder };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.PolitiQuiz = api;

})(typeof globalThis !== "undefined" ? globalThis : this);
