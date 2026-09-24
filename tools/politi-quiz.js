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
    /* ---- society ---- */
    /* ISSP National Identity, France, 2023, Q08. */
    immigNumberIssp: {
      values: [-1, -0.5, 0, 0.5, 1],
      fr: ["Être beaucoup augmenté", "Être un peu augmenté", "Rester le même",
           "Être un peu diminué", "Être beaucoup diminué"],
      dk: "Ne peut choisir"
    },
    /* ISSP 2023, Q09: three positions, from keeping one's culture only to
       giving it up. */
    cultureIssp: {
      values: [-1, 0, 1],
      fr: ["Les immigrés devraient conserver leur culture d'origine et ne pas adopter la culture française",
           "Les immigrés devraient conserver leur culture d'origine et adopter également la culture française",
           "Les immigrés devraient renoncer à leur culture d'origine et adopter la culture française"],
      dk: "Ne peut choisir"
    },
    /* ISSP 2023, Q04. */
    bornIssp: {
      values: [-1, -1 / 3, 1 / 3, 1],
      fr: ["Je suis tout à fait d'accord avec l'affirmation A",
           "Je suis plus d'accord avec l'affirmation A qu'avec l'affirmation B",
           "Je suis plus d'accord avec l'affirmation B qu'avec l'affirmation A",
           "Je suis tout à fait d'accord avec l'affirmation B"],
      dk: "Ne peut choisir"
    },
    /* ISSP 2023, Q01. */
    importanceIssp: {
      values: [1, 1 / 3, -1 / 3, -1],
      fr: ["Très important", "Plutôt important", "Plutôt pas important", "Pas important du tout"],
      dk: "Ne peut choisir"
    },
    /* ISSP Role of Government, France, 2016. */
    obeyIssp: {
      values: [1, -1],
      fr: ["Il faut toujours obéir aux lois, sans exception",
           "Dans certains cas, il faut suivre sa conscience"],
      dk: "Ne peut choisir"
    },
    errorIssp: {
      values: [-1, 1],
      fr: ["Condamner un innocent", "Laisser une personne coupable en liberté"],
      dk: "Ne peut choisir"
    },
    allowIssp: {
      values: [-1, -1 / 3, 1 / 3, 1],
      fr: ["Certainement autorisées", "Probablement autorisées", "Probablement pas autorisées",
           "Certainement pas autorisées"],
      dk: "Ne peut choisir"
    },
    rightIssp: {
      values: [1, 1 / 3, -1 / 3, -1],
      fr: ["Absolument le droit", "Probablement le droit", "Probablement pas le droit",
           "Absolument pas le droit"],
      dk: "Ne peut choisir"
    },
    respIssp: {
      values: [1, 1 / 3, -1 / 3, -1],
      fr: ["Tout à fait", "Probablement", "Probablement pas", "Pas du tout"],
      dk: "Ne peut choisir"
    },
    /* ISSP Family, France, 2022: its own card ("Pas d'accord du tout"). */
    agreeFam: {
      values: [1, 0.5, 0, -0.5, -1],
      fr: ["Tout à fait d'accord", "Plutôt d'accord", "Ni d'accord, ni pas d'accord",
           "Plutôt pas d'accord", "Pas d'accord du tout"],
      dk: "Ne peut choisir"
    },
    /* ISSP 2022, the French national add-on block: four points. */
    agreeFamFr: {
      values: [1, 1 / 3, -1 / 3, -1],
      fr: ["Tout à fait d'accord", "Plutôt d'accord", "Plutôt pas d'accord", "Pas d'accord du tout"],
      dk: "Ne peut choisir"
    },
    /* ISSP Religion, France, 2018 and 2008: each wave printed its own card. */
    agreeRel18: {
      values: [1, 0.5, 0, -0.5, -1],
      fr: ["Tout à fait d'accord", "D'accord", "Ni d'accord, ni pas d'accord", "En désaccord",
           "Fortement en désaccord"],
      dk: "Ne peut pas dire"
    },
    agreeRel18b: {
      values: [1, 0.5, 0, -0.5, -1],
      fr: ["Tout à fait d'accord", "D'accord", "Ni d'accord, ni pas d'accord", "Pas d'accord",
           "Pas d'accord du tout"],
      dk: "Ne peut pas dire"
    },
    agreeRel08: {
      values: [1, 0.5, 0, -0.5, -1],
      fr: ["Tout à fait d'accord", "D'accord", "Ni d'accord ni pas d'accord", "Pas d'accord",
           "Pas d'accord du tout"],
      dk: "Ne peut pas dire"
    },
    powerRel18: {
      values: [1, 0.5, 0, -0.5, -1],
      fr: ["Beaucoup trop de pouvoir", "Trop de pouvoir", "Ce qu'il faut de pouvoir",
           "Trop peu de pouvoir", "Beaucoup trop peu de pouvoir"],
      dk: "Ne peut pas dire"
    },
    /* EVS 2017, France: a four-point card with no midpoint, and a five-point
       one. "NSP" was an interviewer code, never read out. */
    agree4Evs: {
      values: [1, 1 / 3, -1 / 3, -1],
      fr: ["Tout à fait d'accord", "Plutôt d'accord", "Plutôt pas d'accord", "Pas d'accord du tout"]
    },
    agree5Evs: {
      values: [1, 0.5, 0, -0.5, -1],
      fr: ["Tout à fait d'accord", "Plutôt d'accord", "Ni d'accord, ni pas d'accord",
           "Plutôt pas d'accord", "Pas d'accord du tout"]
    },
    /* EVS 2017, Q37: not ordered — indifference sits between the two. */
    goodThingEvs: {
      values: [1, -1, 0],
      fr: ["Une bonne chose", "Une mauvaise chose", "Ça vous est égal"]
    },
    citedEvs: { values: [1, -1], fr: ["Cité", "Pas cité"] },
    /* ESS 11, B40: four answers. */
    allowEss: {
      values: [-1, -1 / 3, 1 / 3, 1],
      fr: ["Elle doit autoriser un grand nombre d'entre eux à venir vivre ici",
           "Elle doit autoriser certains d'entre eux", "Elle ne doit autoriser que peu d'entre eux",
           "Elle ne doit autoriser aucun d'entre eux"]
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

  /* Society items are many and alike: `soc` builds one, the source helpers
     below name the questionnaire it is quoted from. */
  const soc = (id, dim, scale, pole, extra, src) =>
    Object.assign({ id, theme: "society", reading: "y", dim, scale, pole }, extra, { src });
  const ESS11 = v => ({ survey: "ESS", wave: "round 11", variable: v,
                        url: ESS_FR + "round11/fieldwork/france/ESS11_questionnaires_FR.pdf" });
  const ESS9 = v => ({ survey: "ESS", wave: "round 9", variable: v,
                       url: ESS_FR + "round9/fieldwork/france/ESS9_questionnaires_FR.pdf" });
  const ESS8 = v => ({ survey: "ESS", wave: "round 8", variable: v,
                       url: ESS_FR + "round8/fieldwork/france/ESS8_questionnaires_FR.pdf" });
  const NI23 = v => ({ survey: "ISSP", wave: "Identité nationale 2023", variable: v, url: GESIS(80546) });
  const NI13 = v => ({ survey: "ISSP", wave: "Identité nationale 2013", variable: v, url: GESIS(55581) });
  const ROG16 = v => ({ survey: "ISSP", wave: "Rôle de l'État 2016", variable: v, url: GESIS(63847) });
  const FAM22 = v => ({ survey: "ISSP", wave: "Famille 2022", variable: v, url: GESIS(79168) });
  const REL18 = v => ({ survey: "ISSP", wave: "Religion 2018", variable: v, url: GESIS(67283) });
  const REL08 = v => ({ survey: "ISSP", wave: "Religion 2008", variable: v, url: GESIS(16212) });
  const EVS = v => ({ survey: "EVS", wave: "2017", variable: v, url: GESIS(66251) });

  const IMMIG_STEM = "Il existe différentes opinions concernant les immigrés venus d'autres pays pour vivre en France. Êtes-vous d'accord ou pas d'accord avec chacune des affirmations suivantes :";
  const IMMIG_STEM_13 = "Il existe différentes opinions concernant les immigrés venus d'autres pays pour vivre en France. Etes-vous d'accord ou pas d'accord avec chacune des affirmations suivantes :";
  const REFUGEE_STEM = "Certaines personnes arrivent en France et demandent le statut de réfugié parce qu'elles craignent des persécutions dans leur propre pays. Dites-moi si vous êtes d'accord ou pas d'accord avec la proposition suivante.";
  const MINORITIES_STEM = "Maintenant, abordons quelques questions sur les minorités en France. Etes-vous d'accord ou pas d'accord avec les affirmations suivantes ?";
  const EVS_SCALES_STEM = "Voici différentes phrases. Personnellement, où vous situez-vous sur ces échelles?";
  const EVS_AGREE_STEM = "Etes-vous d'accord ou pas d'accord avec les affirmations suivantes ?";
  const EVS_OPINIONS_STEM = "Pour chacune des opinions que je vais vous lire, pouvez-vous me dire si vous êtes tout à fait d'accord, plutôt d'accord, plutôt pas d'accord, pas d'accord du tout ?";
  const EVS_JUSTIF_STEM = "Pour chacune des choses que je vais vous citer, voulez-vous me dire en vous plaçant sur cette échelle si vous pensez que cela peut toujours se justifier, que cela ne peut jamais se justifier ou que c'est entre les deux ?";
  const PROTEST_STEM = "Il y a plusieurs façons de s'opposer à une décision gouvernementale que l'on désapprouve fortement. Pouvez-vous indiquer si de votre point de vue, les actions suivantes doivent être autorisées ou non autorisées ?";
  const TERROR_STEM = "Imaginez que le gouvernement s'attende à un attentat terroriste. Selon vous, les autorités devraient-elles ou non avoir le droit de…";
  const ESS_B38_STEM = "À l'aide de cette liste de réponses, dites-moi dans quelle mesure vous êtes d'accord ou non avec chacune des propositions suivantes.";
  const ESS_B33_STEM = "Veuillez m'indiquer, à l'aide de cette carte, dans quelle mesure vous êtes d'accord ou non avec les phrases suivantes.";
  const FAM_STEM = "Dans quelle mesure êtes-vous d'accord ou pas d'accord avec les propositions suivantes ?";
  const FAM_FR_STEM = "Voici maintenant une liste de phrases. Pour chacune d'elles, pouvez-vous me dire si vous êtes tout à fait d'accord, plutôt d'accord, plutôt pas d'accord, pas d'accord du tout ou si vous ne savez pas ?";
  const FAMILIES_STEM = "Les enfants grandissent dans différents types de familles. Dans quelle mesure êtes-vous d'accord ou pas d'accord avec les affirmations suivantes ?";
  const NI_AGREE_STEM = "Êtes-vous d'accord ou pas d'accord avec les affirmations suivantes ?";
  const NI13_AGREE_STEM = "Etes-vous d'accord ou pas d'accord avec les propositions suivantes ?";

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
      src: { survey: "ISSP", wave: "Rôle de l'État 1996", variable: "Q11b", url: GESIS(6806) } },

    /* ================= society: y, the libertarian-authoritarian axis =====
       Seven sub-dimensions, the ones CHES 2024 rates and whose plain mean
       reproduces galtan at r = 0.97 across its 279 parties (each alone 0.77
       to 0.94, and none indispensable: dropping any leaves 0.96). After
       orientation +1 always means authoritarian, as on the compass.

       `reserve: true` items are verified and sourced but not asked: kept so
       that a thin sub-dimension can be widened without searching again. Each
       says why it is not asked. */

    /* --- immigration (CHES immigrate_policy, r = 0.88) --- */
    soc("ess.imbgeco", "immigration", "bipolar11", -1, {
      fr: "Dans l'ensemble, diriez-vous que c'est mauvais ou bon pour l'économie française que des personnes d'autres pays viennent vivre en France ?",
      left: "Mauvais pour l'économie", right: "Bon pour l'économie" }, ESS11("B43 imbgeco")),
    soc("ess.imwbcnt", "immigration", "bipolar11", -1, {
      fr: "Diriez-vous que la présence de personnes d'autres pays venant vivre en France rend la vie plus agréable ou moins agréable ?",
      left: "Moins agréable", right: "Plus agréable" }, ESS11("B45 imwbcnt")),
    soc("issp.immig.number", "immigration", "immigNumberIssp", 1, {
      fr: "Pensez-vous qu'aujourd'hui, le nombre d'immigrés qui viennent en France devrait… ?" },
      NI23("Q08")),
    soc("issp.immig.priority", "immigration", "agreeIssp", 1, { stem: IMMIG_STEM,
      fr: "Les personnes nées en France devraient avoir la priorité sur les immigrés en matière d'emploi, de logement ou de santé" },
      NI23("Q07_E")),
    soc("issp.immig.expel", "immigration", "agreeIssp", 1, { stem: IMMIG_STEM_13,
      fr: "La France devrait prendre des mesures plus sévères pour renvoyer les immigrés clandestins" },
      NI13("Q9g")),
    soc("ess.gvrfgap", "immigration", "agreePlutot", -1, { stem: REFUGEE_STEM,
      fr: "Les pouvoirs publics devraient se montrer plus ouverts dans l'examen des demandes du statut de réfugié." },
      ESS8("C42 gvrfgap")),
    soc("ess.rfgbfml", "immigration", "agreePlutot", -1, { stem: REFUGEE_STEM,
      fr: "Les réfugiés dont la demande est acceptée devraient avoir le droit de faire venir leur famille proche." },
      ESS8("C44 rfgbfml")),
    soc("ess.imsmetn", "immigration", "allowEss", 1, { reserve: "opens a chain of three whose next two depend on it",
      fr: "Maintenant, en utilisant cette liste de réponses, dans quelle mesure pensez-vous que la France doit autoriser des gens de même origine ethnique que la plupart des Français à venir vivre ici ?" },
      ESS11("B40 imsmetn")),
    soc("ess.imdfetn", "immigration", "allowEss", 1, { reserve: "worded as a follow-up to imsmetn",
      follows: "ess.imsmetn",
      fr: "Et à propos des gens d'une origine ethnique différente de la plupart des Français ? Utilisez de nouveau cette liste de réponses." },
      ESS11("B41 imdfetn")),
    soc("ess.impcntr", "immigration", "allowEss", 1, { reserve: "worded as a follow-up to imsmetn",
      follows: "ess.imdfetn",
      fr: "En ce qui concerne les gens venant des pays pauvres non européens ? Utilisez de nouveau cette liste de réponses." },
      ESS11("B42 impcntr")),
    soc("ess.rfgfrpc", "immigration", "agreePlutot", 1, { reserve: "a factual belief about claimants more than a policy position",
      stem: REFUGEE_STEM,
      fr: "La plupart des personnes qui demandent ce statut ne risquent pas vraiment des persécutions dans leur pays." },
      ESS8("C43 rfgfrpc")),

    /* --- multiculturalism vs assimilation (CHES multiculturalism, 0.87) --- */
    soc("issp.culture", "multiculturalism", "cultureIssp", 1, {
      fr: "Parmi ces affirmations sur les immigrés, laquelle est la plus proche de ce que vous pensez ?" },
      NI23("Q09")),
    soc("ess.imueclt", "multiculturalism", "bipolar11", -1, {
      fr: "Diriez-vous que, dans l'ensemble, la culture française est menacée ou enrichie par la présence de personnes d'autres pays venant vivre ici ?",
      left: "La culture est menacée", right: "La culture est enrichie" }, ESS11("B44 imueclt")),
    soc("evs.v188", "multiculturalism", "bipolar10", 1, { stem: EVS_SCALES_STEM,
      left: "Il vaut mieux que les immigrés conservent leurs propres coutumes et traditions",
      right: "Il vaut mieux que les immigrés ne conservent pas leurs propres coutumes et traditions" },
      EVS("v188")),
    soc("issp.never.french", "multiculturalism", "agreeIssp", 1, { stem: MINORITIES_STEM,
      fr: "Les personnes qui ne partagent pas les coutumes et les traditions françaises ne seront jamais des Français à part entière" },
      NI13("Q7a")),
    soc("issp.minorities.help", "multiculturalism", "agreeIssp", -1, { reserve: "state support for customs, narrower than the integration question CHES asks",
      stem: MINORITIES_STEM,
      fr: "Les minorités ethniques devraient bénéficier de l'aide du gouvernement pour préserver leurs coutumes et leurs traditions" },
      NI13("Q7b")),
    soc("issp.same.rights", "multiculturalism", "agreeIssp", -1, { reserve: "closer to CHES ethnic_minorities, not one of the seven",
      stem: IMMIG_STEM_13,
      fr: "Les immigrés en situation régulière en France, mais qui ne sont pas français, devraient avoir les mêmes droits que les citoyens français" },
      NI13("Q9f")),
    soc("evs.v80", "multiculturalism", "agree5Evs", 1, { reserve: "the French version drops the master's \"over immigrants\"",
      stem: EVS_AGREE_STEM,
      fr: "Quand les emplois sont rares, les employeurs devraient embaucher en priorité des Français" },
      EVS("v80")),
    soc("evs.v22", "multiculturalism", "citedEvs", 1, { reserve: "social distance, not a political position",
      stem: "Sur cette liste figurent différentes catégories de gens. Voulez-vous m'indiquer s'il y en a que vous n'aimeriez pas avoir comme voisins?",
      fr: "Des gens d'une autre race" }, EVS("v22")),

    /* --- civil liberties vs law and order (CHES civlib_laworder, 0.91) --- */
    soc("issp.obey", "laworder", "obeyIssp", 1, {
      fr: "Selon vous, faut-il absolument toujours obéir aux lois ou existe-t-il des circonstances exceptionnelles où il faut suivre sa conscience, même si cela conduit à enfreindre la loi ?" },
      ROG16("Q1")),
    soc("issp.worse.error", "laworder", "errorIssp", 1, {
      fr: "Tous les systèmes judiciaires font des erreurs, mais selon vous, laquelle est la pire ?" },
      ROG16("Q4")),
    soc("issp.protest", "laworder", "allowIssp", 1, { stem: PROTEST_STEM,
      fr: "Organiser des réunions publiques de protestation contre le gouvernement" }, ROG16("Q2a")),
    soc("issp.detain", "laworder", "rightIssp", 1, { stem: TERROR_STEM,
      fr: "…détenir des personnes, aussi longtemps qu'elles le souhaitent, sans les traduire en justice" },
      ROG16("Q14a")),
    soc("issp.wiretap", "laworder", "rightIssp", 1, { stem: TERROR_STEM,
      fr: "…mettre sur écoute les conversations téléphoniques des individus" }, ROG16("Q14b")),
    soc("evs.v163", "laworder", "bipolar10", 1, { stem: EVS_JUSTIF_STEM, fr: "La peine de mort",
      left: "Jamais justifié", right: "Toujours justifié" }, EVS("v163")),
    soc("ess.lrnobed", "laworder", "agreePlutot", 1, { stem: ESS_B38_STEM,
      fr: "L'obéissance et le respect de l'autorité sont les valeurs les plus importantes que les enfants doivent apprendre." },
      ESS11("B38 lrnobed")),
    soc("issp.demos", "laworder", "allowIssp", 1, { reserve: "repeats the protest-meetings item one step further",
      stem: PROTEST_STEM, fr: "Organiser des manifestations de rue" }, ROG16("Q2b")),
    soc("issp.stop", "laworder", "rightIssp", 1, { reserve: "a third item of the same grid, kept short",
      stem: TERROR_STEM, fr: "…arrêter les gens au hasard dans la rue" }, ROG16("Q14c")),
    soc("ess.loylead", "laworder", "agreePlutot", 1, { reserve: "loyalty to leaders is closer to the institutions theme",
      stem: ESS_B38_STEM,
      fr: "Ce dont la France a le plus besoin, c'est de loyauté envers ses leaders politiques." },
      ESS11("B39 loylead")),
    soc("evs.v114", "laworder", "goodThingEvs", 1, { reserve: "its third answer, indifference, is not a point on the scale",
      stem: "Je vais vous citer deux changements qui pourraient se produire dans notre manière de vivre d'ici quelque temps. Si cela arrivait, pensez-vous que ce serait une bonne chose, une mauvaise chose ou ça vous est égal ?",
      fr: "Qu'on respecte davantage l'autorité" }, EVS("v114")),

    /* --- women's rights (CHES womens_rights, 0.89) --- */
    soc("issp.working.mother", "women", "agreeFam", -1, { stem: FAM_STEM,
      fr: "Une mère qui travaille peut avoir avec ses enfants des relations aussi chaleureuses et sécurisantes qu'une mère qui ne travaille pas" },
      FAM22("Q01a")),
    soc("issp.breadwinner", "women", "agreeFam", 1, { stem: FAM_STEM,
      fr: "Le rôle d'un homme, c'est de gagner l'argent du ménage ; le rôle d'une femme, c'est de s'occuper de la maison et de la famille" },
      FAM22("Q01f")),
    soc("evs.v76", "women", "agree4Evs", 1, { stem: EVS_OPINIONS_STEM,
      fr: "En général, les hommes s'avèrent être de meilleurs dirigeants politiques que les femmes" },
      EVS("v76")),
    soc("evs.v81", "women", "agree5Evs", 1, { stem: EVS_AGREE_STEM,
      fr: "Quand les emplois sont rares, un homme a plus droit à un travail qu'une femme" }, EVS("v81")),
    soc("evs.v154", "women", "bipolar10", -1, { stem: EVS_JUSTIF_STEM, fr: "L'avortement",
      left: "Jamais justifié", right: "Toujours justifié" }, EVS("v154")),
    soc("issp.feminism", "women", "agreeFamFr", 1, { stem: FAM_FR_STEM,
      fr: "Dans la société actuelle, le féminisme va trop loin",
      note: "Question ajoutée par l'équipe française de l'ISSP, non posée dans les autres pays." },
      FAM22("OF21c")),
    soc("issp.preschool", "women", "agreeFam", 1, { reserve: "the mirror of the working-mother item, asked once",
      stem: FAM_STEM,
      fr: "Un enfant qui n'a pas encore l'âge d'aller à l'école a des chances de souffrir si sa mère travaille" },
      FAM22("Q01b")),
    soc("evs.v72", "women", "agree4Evs", 1, { reserve: "the mirror of the working-mother item, asked once",
      stem: EVS_OPINIONS_STEM, fr: "Quand une mère a un emploi, les enfants en souffrent" }, EVS("v72")),
    soc("issp.leaders.fr", "women", "agreeFamFr", 1, { reserve: "repeats EVS v76",
      stem: FAM_FR_STEM, fr: "Les hommes font de meilleurs dirigeants que les femmes" }, FAM22("OF21a")),
    soc("issp.equality.gov", "women", "respIssp", -1, { reserve: "government responsibility, which mixes in the economic axis",
      stem: "Globalement, les responsabilités suivantes doivent-elles ou non incomber au gouvernement ?",
      fr: "Promouvoir l'égalité entre hommes et femmes" }, ROG16("Q7k")),

    /* --- LGBT rights (CHES lgbtq_rights, 0.94, and samesex_marriage) --- */
    soc("ess.freehms", "lgbt", "agreePlutot", -1, { stem: ESS_B33_STEM,
      fr: "Les homosexuels hommes et femmes devraient être libres de vivre leur vie comme ils le souhaitent." },
      ESS9("B34 freehms")),
    soc("ess.hmsacld", "lgbt", "agreePlutot", -1, { stem: ESS_B33_STEM,
      fr: "Les couples homosexuels, hommes ou femmes, devraient avoir les mêmes droits à l'adoption que les couples hétérosexuels." },
      ESS9("B36 hmsacld")),
    soc("ess.hmsfmlsh", "lgbt", "agreePlutot", 1, { stem: ESS_B33_STEM,
      fr: "Si un membre de ma famille proche était homosexuel, homme ou femme, j'aurais honte." },
      ESS9("B35 hmsfmlsh")),
    soc("evs.v153", "lgbt", "bipolar10", -1, { stem: EVS_JUSTIF_STEM, fr: "L'homosexualité",
      left: "Jamais justifié", right: "Toujours justifié" }, EVS("v153")),
    soc("issp.two.women", "lgbt", "agreeFam", -1, { stem: FAMILIES_STEM,
      fr: "Un couple de deux femmes peut élever un enfant aussi bien qu'un couple hétérosexuel" },
      FAM22("Q05c")),
    soc("issp.trans", "lgbt", "agreeFamFr", -1, { stem: FAM_FR_STEM,
      fr: "Une personne transgenre, c'est-à-dire un garçon né dans un corps de fille ou une fille née dans un corps de garçon, doit pouvoir être légalement reconnue comme elle le souhaite",
      note: "Question ajoutée par l'équipe française de l'ISSP, non posée dans les autres pays. C'est la seule, dans ces enquêtes, sur les droits des personnes trans, que le CHES cite." },
      FAM22("OF21i")),
    soc("issp.two.men", "lgbt", "agreeFam", -1, { reserve: "the mirror of the two-women item, asked once",
      stem: FAMILIES_STEM,
      fr: "Un couple de deux hommes peut élever un enfant aussi bien qu'un couple hétérosexuel" },
      FAM22("Q05d")),
    soc("evs.v82", "lgbt", "agree5Evs", -1, { reserve: "its French stem opens on \"Et\", after another question",
      stem: "Et êtes-vous d'accord ou pas d'accord avec les affirmations suivantes ?",
      fr: "Les couples homosexuels sont d'aussi bons parents que les autres couples" }, EVS("v82")),

    /* --- religion in politics (CHES religious_principles, 0.77) --- */
    soc("issp.rel.vote", "religion", "agreeRel18", -1, {
      fr: "Dans quelle mesure êtes-vous d'accord ou non avec l'opinion suivante : Les autorités religieuses ne devraient pas essayer d'influencer le vote des gens aux élections." },
      REL18("Q8")),
    soc("issp.rel.gov", "religion", "agreeRel08", -1, {
      fr: "Les autorités religieuses ne devraient pas essayer d'influencer les décisions du gouvernement" },
      REL08("Q10b")),
    soc("issp.faith", "religion", "agreeRel18b", 1, {
      stem: "Voici plusieurs affirmations : pouvez-vous me dire si vous êtes d'accord ou pas d'accord avec elles ?",
      fr: "Nous faisons trop confiance à la science et pas assez à la foi religieuse" }, REL18("Q9a")),
    soc("evs.v156", "religion", "bipolar10", -1, { stem: EVS_JUSTIF_STEM,
      fr: "L'euthanasie (c'est-à-dire mettre fin aux jours de quelqu'un qui est incurable)",
      left: "Jamais justifié", right: "Toujours justifié" }, EVS("v156")),
    soc("issp.church.power", "religion", "powerRel18", -1, { reserve: "power of churches, where religion's role in politics is what CHES rates",
      fr: "Pensez-vous que, dans ce pays, les églises et les organisations religieuses ont trop ou pas assez de pouvoir ?" },
      REL18("Q10")),

    /* --- nationalism (CHES nationalism, 0.90) --- */
    soc("issp.rather.french", "nationalism", "agreeIssp", 1, { stem: NI_AGREE_STEM,
      fr: "Je préfère être français(e) plutôt que citoyen(ne) d'un autre pays" }, NI23("Q02_A")),
    soc("issp.better.country", "nationalism", "agreeIssp", 1, { stem: NI_AGREE_STEM,
      fr: "D'une manière générale, la France est un pays meilleur que la plupart des autres" }, NI23("Q02_D")),
    soc("issp.world.better", "nationalism", "agreeIssp", 1, { stem: NI_AGREE_STEM,
      fr: "Le monde serait meilleur si les gens des autres pays ressemblaient plus aux Français" }, NI23("Q02_C")),
    soc("issp.support.wrong", "nationalism", "agreeIssp", 1, { stem: NI_AGREE_STEM,
      fr: "Les gens devraient soutenir leur pays même lorsque ce pays se trompe" }, NI23("Q02_E")),
    soc("issp.world.citizen", "nationalism", "agreeIssp", -1, { stem: NI13_AGREE_STEM,
      fr: "Je me sens plus citoyen du monde que de n'importe quel pays" }, NI13("Q6e")),
    soc("issp.born", "nationalism", "bornIssp", 1, {
      fr: "Certaines personnes disent qu'il est possible de devenir vraiment français si l'on fait un effort. D'autres disent qu'il faut être né en France pour être vraiment français. Quelle est votre position ? A : Il est possible de devenir vraiment français si l'on fait un effort. B : Il faut naître en France pour être vraiment français." },
      NI23("Q04")),
    soc("issp.born.important", "nationalism", "importanceIssp", 1, { reserve: "asks again what Q04 asks",
      stem: "Certaines personnes estiment que pour être vraiment français, il est important de posséder certaines des caractéristiques suivantes. Pour d'autres, cela n'est pas important. À votre avis, pour être vraiment français, est-il important… ?",
      fr: "…d'être né en France" }, NI23("Q01_A"))
  ];

  /* What a screen shows above its question. A survey's stem introduces a
     grid — "each of the following statements", "the things I am going to
     read you", "using this card" — and here each screen asks one item, in a
     mixed order: repeated as is, the stem promised a run of questions that
     the next, unrelated screen broke. So `stem` keeps the official wording,
     the item's provenance, which the source check compares; `ask` is what the
     screen shows: the same instruction, for one item, with no interviewer or
     card. The item's own wording is never touched. A stem missing here that
     speaks of a list is caught by tools/extract.js. */
  const AGREE_ONE = "Êtes-vous d'accord ou pas d'accord avec l'affirmation suivante ?";
  const SCREEN_STEMS = new Map([
    [SPEND_STEM, "Souhaiteriez-vous que le gouvernement dépense plus ou moins dans le domaine suivant ? "
      + "N'oubliez pas que dépenser « beaucoup plus » peut entraîner une augmentation des impôts, taxes "
      + "ou cotisations sociales."],
    [OWNER_STEM, "Qui, d'après vous, devrait principalement gérer le service suivant, l'État ou le secteur privé ?"],
    [ACTIONS_STEM, "Voici une action économique qu'un gouvernement peut mener. Y êtes-vous favorable ou défavorable ?"],
    [IMMIG_STEM, "Il existe différentes opinions concernant les immigrés venus d'autres pays pour vivre en France. "
      + "Êtes-vous d'accord ou pas d'accord avec l'affirmation suivante ?"],
    [IMMIG_STEM_13, "Il existe différentes opinions concernant les immigrés venus d'autres pays pour vivre en France. "
      + "Êtes-vous d'accord ou pas d'accord avec l'affirmation suivante ?"],
    [REFUGEE_STEM, "Certaines personnes arrivent en France et demandent le statut de réfugié parce qu'elles "
      + "craignent des persécutions dans leur propre pays. Êtes-vous d'accord ou pas d'accord avec la "
      + "proposition suivante ?"],
    [MINORITIES_STEM, "À propos des minorités en France : êtes-vous d'accord ou pas d'accord avec l'affirmation suivante ?"],
    [EVS_SCALES_STEM, "Personnellement, où vous situez-vous sur cette échelle ?"],
    [EVS_AGREE_STEM, AGREE_ONE],
    [NI_AGREE_STEM, AGREE_ONE],
    [NI13_AGREE_STEM, "Êtes-vous d'accord ou pas d'accord avec la proposition suivante ?"],
    [EVS_OPINIONS_STEM, "Êtes-vous tout à fait d'accord, plutôt d'accord, plutôt pas d'accord ou pas d'accord "
      + "du tout avec l'opinion suivante ?"],
    [EVS_JUSTIF_STEM, "Pensez-vous que ce qui suit peut toujours se justifier, ne peut jamais se justifier, ou "
      + "que c'est entre les deux ?"],
    [PROTEST_STEM, "Il y a plusieurs façons de s'opposer à une décision gouvernementale que l'on désapprouve "
      + "fortement. De votre point de vue, l'action suivante doit-elle être autorisée ou non autorisée ?"],
    [ESS_B38_STEM, "Dans quelle mesure êtes-vous d'accord ou non avec la proposition suivante ?"],
    [ESS_B33_STEM, "Dans quelle mesure êtes-vous d'accord ou non avec la phrase suivante ?"],
    [FAM_STEM, "Dans quelle mesure êtes-vous d'accord ou pas d'accord avec la proposition suivante ?"],
    [FAM_FR_STEM, "Êtes-vous tout à fait d'accord, plutôt d'accord, plutôt pas d'accord ou pas d'accord du "
      + "tout avec la phrase suivante ?"],
    [FAMILIES_STEM, "Les enfants grandissent dans différents types de familles. Dans quelle mesure êtes-vous "
      + "d'accord ou pas d'accord avec l'affirmation suivante ?"],
    ["Voici plusieurs affirmations : pouvez-vous me dire si vous êtes d'accord ou pas d'accord avec elles ?", AGREE_ONE]
  ]);
  for (const item of ITEMS) if (item.stem) item.ask = SCREEN_STEMS.get(item.stem) || item.stem;

  /* The economy is the first theme, not the only one. The others are listed
     so the page can say what is coming; each has its counterpart in CHES, so
     its readings will be comparable to the parties like x is. `planned`
     themes have no items yet. */
  const THEMES = [
    /* `axis` is the compass axis a theme replaces, built from `dims`; the
       other readings are its own, read beside the compass. */
    { key: "economy", axis: "x", readings: ["x", "protectionism", "class", "conflict", "labour"],
      dims: ["redistribution", "spendvtax", "deregulation"] },
    { key: "society", axis: "y", readings: ["y"],
      dims: ["immigration", "multiculturalism", "laworder", "women", "lgbt", "religion",
             "nationalism"] },
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
     shows its instruction in the singular (`ask`, above); an item whose
     wording leans on the one before it says so with `follows`, and the two
     travel as one block, placed by the first one's hash. */
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

  /* The items a theme asks: its bank, minus the reserve. */
  const askedItems = themeKey => ITEMS.filter(i => i.theme === themeKey && !i.reserve);

  /* Answers -> readings, each on [-100, 100], or null when nothing feeding it
     was answered.

     A theme's axis is the mean of its CHES sub-dimensions, each the mean of
     its items. Equal weights, because the plain mean of the sub-scales already
     reproduces the experts' axis across the 279 CHES 2024 parties — lrecon at
     r = 0.96 for the economy, galtan at 0.97 for society — so there is no gap
     for a weighting to close. Reserve items never count.

     Wright's scale is his sum rescaled, and only reported complete: a partial
     sum of a five-item additive scale is not the scale.

     `n` counts the answers behind each reading, so the page can say how
     thin it is. */
  function score(answers, themeKey) {
    const theme = THEMES.find(t => t.key === themeKey);
    const items = askedItems(themeKey);
    const answered = items
      .map(i => ({ i, v: itemValue(i, answers[i.id]) }))
      .filter(a => a.v !== null);

    const out = { n: {} };
    const axis = theme.axis;

    const dims = {};
    for (const d of theme.dims) {
      const vs = answered.filter(a => a.i.reading === axis && a.i.dim === d).map(a => a.v);
      dims[d] = vs.length ? Math.round(100 * mean(vs)) : null;
    }
    const present = theme.dims.filter(d => dims[d] !== null);
    out[axis] = present.length ? Math.round(mean(present.map(d => dims[d]))) : null;
    out.dims = dims;
    out.n[axis] = answered.filter(a => a.i.reading === axis).length;

    for (const r of theme.readings) {
      if (r === axis || r === "class") continue;
      const vs = answered.filter(a => a.i.reading === r).map(a => a.v);
      out[r] = vs.length ? Math.round(100 * mean(vs)) : null;
      out.n[r] = vs.length;
    }

    if (theme.readings.includes("class")) {
      const wright = items.filter(i => i.reading === "class");
      const wv = answered.filter(a => a.i.reading === "class");
      out.class = wv.length === wright.length
        ? Math.round(100 * wv.reduce((s, a) => s + a.v, 0) / wright.length) : null;
      out.n.class = wv.length;
    }

    const level = key => {
      const v = answers[key];
      return Number.isInteger(v) && v >= 0 && v < SCALES.salience.values.length ? v : null;
    };
    out.salience = level("salience." + themeKey);
    out.salienceAfter = level("salience." + themeKey + ".after");

    return out;
  }

  const api = { SCALES, ITEMS, THEMES, itemById, itemValue, score, mixedOrder, askedItems };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.PolitiQuiz = api;

})(typeof globalThis !== "undefined" ? globalThis : this);
