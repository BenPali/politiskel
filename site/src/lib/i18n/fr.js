/* Every sentence the site shows, in French. Code looks wording up here and
   never writes it, so a second language is a second table.

   Two things deliberately stay out: the numbers themselves, and everything
   that lives in the reference tables — party names, which are proper nouns,
   along with the country names and the one-line notes next to them. A second
   language would translate COUNTRIES, not this. */

import { signed } from '$lib/format.js';

export const LOCALES = {
  fr: {
    /* poles, keyed by axis side — also used for the concept pills */
    pole: {
      cst: "Constructivisme", ess: "Essentialisme",
      rehab: "Réhabilitation", pun: "Répression",
      prg: "Progressisme", csv: "Conservatisme",
      int: "Internationalisme", nat: "Nationalisme",
      com: "Anticapitalisme", cap: "Capitalisme",
      reg: "Régulation", laf: "Laissez-faire",
      eco: "Écologie", prod: "Productivisme",
      rev: "Révolution", ref: "Réformisme"
    },
    /* axis labels as the questionnaire words them */
    axis: {
      com: "Communisme", cap: "Capitalisme",
      reg: "Régulation", laf: "Laissez-faire",
      eco: "Écologie", prod: "Productivisme",
      cst: "Constructivisme", ess: "Essentialisme",
      rehab: "Justice réhabilitative", pun: "Justice punitive",
      prg: "Progressisme", csv: "Conservatisme",
      int: "Internationalisme", nat: "Nationalisme",
      rev: "Révolution", ref: "Réformisme"
    },
    band: { strong: "très marqué", marked: "marqué", slight: "léger", balanced: "équilibré" },
    fit: { near: "proche", moderate: "modérée", far: "lointaine" },
    proximity: "proximité ",
    noCloseParty: "aucun parti vraiment proche",
    nearest: "Le plus proche : ",
    nearestFar: "Aucun parti vraiment proche — le moins lointain : ",
    method: { revolutionary: "Révolutionnaire", reformist: "Réformiste", neither: "Ni l'un ni l'autre" },

    axisTop: "TRADITION · AUTORITÉ · NATION",
    axisBottom: "ÉCOLOGIE · ALTERNATIVES · LIBERTÉS",
    axisLeft: "GAUCHE économique",
    axisRight: "DROITE économique",
    quadTopLeft: "Gauche traditionaliste", quadTopRight: "Droite traditionaliste",
    quadBottomLeft: "Gauche d'ouverture", quadBottomRight: "Droite d'ouverture",

    tipEcon: "Axe économique", tipSocial: "Axe sociétal",
    tipEcol: "Écologie", tipMethod: "Méthode",
    suffixAuthor: " autor.", suffixLibert: " libert.",

    distances: "Fiche",
    distancesOf: "Profil de ",
    profilesNear: "Profils proches de ",
    colParty: "Parti", colProfile: "Profil",
    nothingToCompare: "Aucun profil à comparer.",
    groupHere: n => n + " profils à cette position — cliquez celui à suivre",

    flagAlt: a => "Drapeau PolitiScales de " + a,
    deleteProfile: a => "Supprimer " + a,
    balancedProfile: "profil équilibré sur tous les axes",
    noMarkedAxis: "aucun axe marqué",
    mean: (x, y) => "Moyenne (" + x + ", " + y + ")",
    groupMean: v => "Moyenne du groupe : " + v,

    emptyDrop: "Aucun profil. Déposez une capture ci-dessous, ou saisissez-en un à la main.",
    emptyNoData: "Aucun profil à afficher pour l'instant.",
    detailHint: n => "Cliquez un profil (●) pour voir sa distance à chacun des " + n
      + " partis, ou un parti (◇) pour voir quels profils s'en rapprochent le plus.",
    stripsHint: "Chaque ligne est un axe PolitiScales, chaque point un profil. Les axes sont "
      + "triés par dispersion (σ) : en haut ceux qui vous séparent le plus, en bas ceux sur "
      + "lesquels vous êtes d'accord. Survolez un point pour voir le détail et sa zone "
      + "d'incertitude — la part de réponses neutres, donc la marge où il glisserait si son "
      + "indécision basculait. Un liseré double signale deux profils exactement superposés : "
      + "l'infobulle les liste tous les deux. « Moyenne du groupe » ajoute un repère par axe.",

    formAxisHead: "Axe — gauche du ↔ tire vers ◄ / ▼",
    formColLeft: "◄ ▼", formColRight: "► ▲",
    errNoAlias: "Renseignez un alias.",
    errDuplicate: a => "Un profil porte déjà l'alias « " + a + " ».",
    errOverHundred: l => "Les deux pôles d'un axe ne peuvent pas dépasser 100 % au total : " + l + ".",
    errNoAxis: "Renseignez au moins un axe.",
    errNoExtractor: "tools/politi-dissect.js n'est pas chargé.",
    errUnreadable: "Fichier illisible.",
    errNotImage: "Ce fichier n'est pas une image exploitable.",
    errPixels: "Lecture des pixels refusée par le navigateur.",
    errExtract: m => "Échec de l'extraction : " + m,
    errUnrecognised: w => "Capture non reconnue — " + w,
    captureOk: (a, c) => a + " — " + (c || "profil équilibré") + " · vérifiez puis validez",

    noMotto: "Devise non disponible (profil saisi à la main)",
    stripDetail: (ln, l, n, rn, r) => ln + " " + l + " % · neutre " + n + " % · " + rn + " " + r + " %",
    stripUncertainty: (a, b) => "  (incertitude " + a + " à " + b + ")",
    /* static markup, applied through data-i18n */
    brandTag: "Votre squelette politique",
    navTest: "Passer le test", navSource: "Code source",
    subtitle: "Placez un profil — depuis un résultat PolitiScales, ou avec le questionnaire "
      + "Politiskel — sur plusieurs lectures de l'espace politique, et comparez-le aux principales "
      + "forces du pays choisi, placées d'après les experts du CHES.",
    optCountry: "Pays de référence",
    optRefs: "Repères partis", optRefLabels: "Étiquettes des repères",
    optLabels: "Étiquettes des profils",
    optMean: "Moyenne du groupe", optMeanWhere: "(carte et axes)",
    chartTitle: "Positions calculées",
    legendProfiles: "Profils", legendParties: (c, est) => "Partis — " + c + " (CHES 2024" + (est ? ", " + est + " estimé" + (est > 1 ? "s" : "") : "") + ")",
    partyAria: n => "Parti " + n,
    /* Written from the tables rather than by hand: the previous copy claimed
       "dix des quatorze partis" against a list that held fifteen. */
    methodRefsAll: (country, n) =>
      "Les " + n + " repères " + country + " sont tous placés d'après le CHES 2024.",
    methodRefsMixed: (country, ches, est, names) =>
      "Sur les " + (ches + est) + " repères " + country + ", " + ches + " sont placés d'après le "
      + "CHES 2024. Les " + est + " autres (" + names + ") n'y figurent pas — trop petits, plus "
      + "récents, ou hors du champ de l'enquête — et restent des estimations à la main, calées "
      + "sur l'échelle des premiers.",
    methodRefsEstimated: (country, n, why) =>
      "Les " + n + " repères " + country + " sont tous des estimations à la main, calées sur "
      + "l'échelle du CHES : " + why,
    /* Party names are quoted rather than dropped straight into the sentence:
       French would need "de l'Aile" before a vowel, and no table of labels is
       going to carry its own elision. */
    methodTie: n => "Un troisième seuil en découle : quand le second repère est à moins de " + n
      + " points du premier, les deux sont affichés. À marge aussi courte, lequel arrive premier "
      + "dépend des pondérations d'axes, qui n'ont rien d'évident — mesuré sur 4 000 profils "
      + "synthétiques et l'échiquier français, un tiers à une moitié d'entre eux changent de "
      + "repère sous des pondérations tout aussi défendables, contre 6 % au-delà de dix points "
      + "de marge. Le seuil des autres pays est mis à la même échelle que leurs repères, non mesuré.",
    methodGap: (lo, hi, d) =>
      "Le plus grand vide sur l'axe économique sépare « " + lo + " » de « " + hi + " » (" + d
      + " points) : un profil qui tombe dans cet intervalle a mécaniquement un rattachement "
      + "plus lâche qu'un profil marqué.",
    tableTitle: "Profils enregistrés", addTitle: "Ajouter un profil",
    stripsTitle: "Seconde lecture : les huit axes",
    stripsLead: "La boussole compresse huit axes en deux, et cette compression est un choix, "
      + "pas une évidence : elle rapproche des profils que ces huit axes séparent. Ici rien "
      + "n'est compressé — même profils, une ligne par axe. Les deux lectures ne disent pas "
      + "la même chose, et l'écart entre elles est ce qu'il y a de plus instructif.",
    dropTitle: "Déposer une capture PolitiScales",
    dropHint: "Ou cliquez pour choisir un fichier PNG",
    submit: "Calculer et placer", clear: "Vider", reset: "Tout réafficher",
    aliasLabel: "Alias", aliasPlaceholder: "Ex. Luc",
    footPrivacy: "Vos données", footSources: "Sources", footCode: "Code",
    footSourceItems: {
      politiscales: "le questionnaire à huit axes",
      ches: "position des partis, pays par pays",
      surveys: "les questions du questionnaire",
      wright: "l'échelle de classe",
      icons: "la plupart des symboles des drapeaux"
    },
    footLicence: "Licence MIT",
    footFine: "Les repères partisans situent un ordre de grandeur, pas une mesure : la plupart viennent "
      + "d'une enquête d'experts, les autres sont des estimations à la main, signalées comme telles et "
      + "comptées dans la méthode, pays par pays.",
    compassAria: "Boussole Politiskel : axe horizontal gauche-droite économique, axe vertical sociétal, "
      + "tradition, autorité et nation en haut, écologie, alternatives et libertés en bas. Choisissez un "
      + "membre ou un parti pour voir toutes les distances ; les valeurs chiffrées sont dans le tableau.",
    membersTitle: "Membres",
    boardHint: "Choisissez un membre pour ouvrir sa fiche, ou un parti pour voir qui en est le plus proche.",
    memberBack: "← Boussole du groupe",
    memberSwitch: "Changer de profil",
    groupEyebrow: (n, owner) => "Groupe · " + n + " membre" + (n > 1 ? "s" : "") + (owner ? " · vous en êtes propriétaire" : ""),
    legendProfilesN: n => "Profils (" + n + ")",
    optFlagsOurs: "Drapeaux Politiskel pour tous",
    profilesTitle: "Profils du groupe",
    profilesHint: "Cliquez un profil pour le suivre sur la boussole ; ses repères proches s'entourent.",
    profilesFoot: "Une proximité mesurée sur deux axes, pas une appartenance.",
    openCard: a => "Fiche de " + a + " →",
    points: d => d + " pts",
    tieShort: (name, margin) => " · ou " + name + ", à " + margin + " pts près",
    profileSource: (ps, quiz) => "Profil tiré de : " + (ps && quiz ? "Questionnaire + PolitiScales" : ps ? "PolitiScales" : quiz ? "Questionnaire" : "aucune réponse pour l'instant"),
    flagFigureShort: "Drapeau",
    bands: {
      title: "Lectures",
      lead: "Chaque ligne est une lecture indépendante ; X et Y placent le profil sur la boussole.",
      label: { x: "Économie (X)", y: "Société (Y)", protectionism: "Protectionnisme", class: "Classe (Wright)",
               conflict: "Conflit de classe perçu", labour: "Capital / travail" },
      hintQuiz: { x: "Questionnaire · échelle CHES", y: "Questionnaire · GAL-TAN" },
      hintPs: "D'après PolitiScales",
      hint: { protectionism: "À part de X, comme dans le CHES", class: "Lecture rivale de X",
              conflict: "ISSP", labour: "Syndicats, pouvoir des patrons · ESS, ISSP" },
      ends: { x: ["Gauche", "Droite"], y: ["Ouverture", "Tradition"], protectionism: ["Libre-échange", "Protection"],
              class: ["Pro-capitaliste", "Anticapitaliste"], conflict: ["Faible", "Fort"], labour: ["Côté capital", "Côté travail"] }
    },
    partiesTitle: "Partis, du plus proche au plus lointain",
    partiesScope: (country, view) => country + " · " + view,
    nearestLine: (name, fit, d) => "Le plus proche : " + name + ", proximité " + fit + " (" + d + " pts)",
    nearestTie: (name, margin) => " — ou " + name + ", à " + margin + " points près.",
    memberUnknown: n => "« " + n + " » n'est pas dans le groupe affiché.",
    brandHome: "Politiskel, accueil", navMain: "Navigation principale", navMenu: "Ouvrir le menu",
    displayPalette: "Palette", displayMode: "Mode",
    palettes: { classique: "Classique", pop: "Pop", journal: "Journal", nuit: "Nuit", aurore: "Aurore", graphite: "Graphite",
                catppuccin: "Catppuccin", sepia: "Sépia", contraste: "Contraste élevé" },
    modes: { auto: "Auto", clair: "Clair", sombre: "Sombre" },
    paletteHints: { classique: "Neutre, accent pétrole", pop: "Turquoise et citron", journal: "Papier journal, encre noire",
                    nuit: "Encre profonde et cuivre", aurore: "Violet d'aube et pêche", graphite: "Gris crayon, filets nets",
                    catppuccin: "Latte le jour, Mocha la nuit, mauve", sepia: "Lecture longue", contraste: "AAA, traits pleins" },
    displayLead: "Choisissez votre palette, puis clair, sombre ou comme le système : chaque palette a sa version sombre.",
    displayMotion: "Animations", motions: { full: "Activées", reduce: "Réduites" },
    accountSignedIn: (n, g) => "Connecté : " + n + " · membre de " + g + " groupe" + (g > 1 ? "s" : ""),
    profilePs: "PolitiScales", profilePsYes: "Résultat enregistré", profilePsNo: "Aucun résultat",
    exportLead: "Un fichier JSON avec votre compte, votre profil, vos réponses et vos groupes. Aucun traceur, aucune donnée ailleurs que sur ce serveur.",
    passwordHint: "10 caractères ou plus. Changer de mot de passe ferme toutes vos autres sessions.",
    deleteForever: "Supprimer définitivement",
    navHome: "Accueil", navTry: "Essayer", navMethod: "Méthode", navFlags: "Drapeaux",
    navSignIn: "Se connecter", navSignUp: "Créer un compte",
    homeTitle: "Voyez où vous divergez vraiment, entre amis.",
    homeLead: "Politiskel place votre profil sur une boussole, le compare aux partis de votre pays, placés "
      + "d'après une enquête d'experts, et le décompose axe par axe — pour voir, dans un groupe, où l'on "
      + "diverge plutôt que seulement où tombe la moyenne.",
    homeTry: "Essayer sans compte →",
    homePrivacy: "Aucun e-mail demandé · aucun traceur · vos réponses ne sont vues que de vos groupes.",
    homeAxes: { top: "TRADITION", bottom: "OUVERTURE", left: "GAUCHE", right: "DROITE" },
    /* the hero's illustration: invented names, placed by hand */
    homeSample: [["Camille", -38, -52], ["Inès", -74, -61], ["Jules", 14, -26], ["Sacha", 46, 22]],
    homePoints: [
      ["Un questionnaire sourcé", "Chaque question vient d'une grande enquête publique — ESS, ISSP, EVS — "
        + "dans sa version française officielle, avec sa variable."],
      ["Des repères réels", "Les partis sont placés par les experts du Chapel Hill Expert Survey, pays par "
        + "pays. Les rares estimations à la main sont signalées."],
      ["En groupe, et entre soi", "Un groupe ne se voit que de l'intérieur, sur invitation ; vos réponses "
        + "ne sont montrées qu'à ses membres. Exportez ou effacez tout, quand vous voulez."]
    ],
    homeSignedIn: n => "Bon retour, " + n + ".",
    loadingPage: "Chargement…",
    soon: "Cette page arrive avec la refonte du site.",
    notFoundTitle: "Page introuvable",
    notFoundLead: "Cette adresse ne mène à rien sur Politiskel.",
    colAlias: "Alias", colX: "X éco", colY: "Y sociétal",
    colEcol: "Écolo.",
    /* Not "famille politique": the measure is a distance between two points on
       two axes, which is a proximity, not a belonging. The column used to
       claim the second while computing the first. */
    colFamily: "Repère le plus proche",
    titleFamily: "Le repère le plus proche sur les deux axes, et la distance qui l'en sépare. "
      + "Une proximité mesurée, pas une appartenance.",
    tieWith: (name, margin) => " ou " + name
      + (margin === 0 ? ", à égalité"
                      : ", à " + margin + " point" + (margin > 1 ? "s" : "") + " près"),
    tieTitle: margin => "Le second repère n'est qu'à " + margin + " points de plus : lequel arrive "
      + "premier dépend de pondérations d'axes qui n'ont rien d'évident. À marge aussi courte, "
      + "environ un profil sur trois change de repère sous des pondérations tout aussi défendables.",
    colDistance: "Distance", colDeltaEcon: "Δ éco", colDeltaSocial: "Δ soc.",
    titleY: "Positif = tradition, autorité, nation (haut) · négatif = écologie, alternatives, libertés (bas)",
    titleEcol: "Écologie − Productivisme : positif = écologiste. Hors des deux axes, comme dans le CHES.",
    titleDeltaEcon: "Écart sur l'axe économique",
    titleDeltaSocial: "Écart sur l'axe sociétal : positif = le parti est plus traditionaliste que vous",

    neutralPct: "Neutre", positionLabel: "Position",
    uncertainty: "Incertitude", uncertaintyNone: "aucune",
    poleNegative: "Pôle négatif", polePositive: "Pôle positif",

    /* the native questionnaire */
    optTrail: "Trajet depuis PolitiScales",
    optView: "Lecture",
    themeLabel: "Thème",
    uiThemes: { auto: "Auto", light: "Clair", dark: "Sombre", contrast: "Contraste élevé", sepia: "Sépia" },
    optFlags: "Drapeaux",
    flagsPolitiscales: "PolitiScales quand il existe", flagsPolitiskel: "Politiskel pour tous",
    flagGeneratedAlt: a => "Drapeau Politiskel de " + a,
    manualEntry: "Saisir les pourcentages à la main",
    dropTitleShort: "Déposez la capture ici, ou choisissez-la",
    dropFormats: "PNG ou JPEG · la capture entière du résultat",
    captureRead: c => "Capture lue — " + (c || "profil équilibré") + ". Vérifiez les pourcentages, puis enregistrez.",
    psTitle: "Résultat PolitiScales",
    captureSave: "Enregistrer ce résultat", captureSaved: "Résultat PolitiScales enregistré.",
    guestName: "Vous",
    guestBanner: "Mode invité : vos réponses restent dans ce navigateur, rien n'est envoyé au serveur.",
    guestTitle: "Essayer sans compte",
    guestLead: "Deux façons d'obtenir un profil. Vous ne verrez aucun groupe, mais la boussole, la fiche et le drapeau fonctionnent en entier.",
    guestFromPs: "Depuis PolitiScales",
    guestFromPsLead: "Déposez la capture d'écran de votre résultat : elle est lue dans votre navigateur et ne le quitte jamais.",
    guestFromQuiz: "Avec le questionnaire",
    guestFromQuizLead: "Des questions citées des grandes enquêtes publiques, une par écran. Chaque thème remplace un axe.",
    guestThemeMeta: n => n + " questions",
    guestLater: "En créant un compte plus tard, vous reprendrez les réponses données ici.",
    guestSeeCompass: "Voir ma boussole",
    guestForget: "Effacer ce profil d'essai",
    guestForgotten: "Profil d'essai effacé de ce navigateur.",
    guestHeader: "Votre profil d'essai", guestEyebrow: "Mode invité",
    guestHeaderLead: "Il n'existe que dans ce navigateur. Créez un compte pour rejoindre un groupe.",
    footPrivacyServer: "Sur ce site, vos réponses et vos pourcentages PolitiScales sont enregistrés "
      + "sur ce serveur et visibles des seuls membres de vos groupes. Les captures ne quittent "
      + "jamais votre navigateur. Aucun traceur, aucun e-mail demandé ; vous pouvez exporter vos "
      + "données ou supprimer votre compte à tout moment.",
    flagInTriangle: "Dans le triangle — ", flagOnBand: "Sur la bande — ",
    flagEnlarge: "Agrandir", flagShrink: "Taille par défaut",
    flagFigureTitle: "Drapeau Politiskel — tiré des lectures, selon les conventions des drapeaux "
      + "politiques :",
    flagCredit: "Symboles : game-icons.net (Lorc, Delapouite), licence CC BY 3.0.",
    flagLayouts: {
      diagonal: t => "Diagonale, noir en bas côté battant : la convention des drapeaux anarchistes, "
        + "pour un profil qui rejette l'État (" + Math.round(t.antistate) + ").",
      revolution: t => "Triangle de hampe et bandes : la famille des drapeaux révolutionnaires, "
        + "pour une lecture révolutionnaire ou de classe très marquée (" + signed(Math.round(t.rev)) + ").",
      royal: t => t.monarchy !== null && t.monarchy >= 60
        ? "Champ blanc et bordure d'or : la famille des drapeaux royaux, pour un monarchisme marqué ("
          + signed(Math.round(t.monarchy)) + ")."
        : "Champ blanc et bordure d'or : ordre (Y " + signed(t.y) + ") et tradition marqués.",
      centred: t => "Croix centrée liserée : deux axes qui se croisent à rebours de l'habitude — "
        + (t.x < 0 ? "une gauche traditionaliste" : "une droite d'ouverture") + " (X " + signed(t.x) + ", Y " + signed(t.y) + ").",
      disc: t => "Croix nordique à disque : une cause au-dessus de toutes les autres, portée au croisement ("
        + Math.round(t.syms[0].s) + ").",
      nordic: t => "Croix nordique : la famille des drapeaux d'ordre, pour un profil traditionaliste (Y "
        + signed(t.y) + ").",
      pall: t => "Pall en Y, comme sur le drapeau sud-africain : la convergence, pour un "
        + "multiculturalisme marqué (" + signed(Math.round(t.multi)) + ").",
      stripes: t => "Canton et bandes : l'ouverture sur le monde, pour un cosmopolitisme marqué ("
        + signed(Math.round(t.intl)) + ").",
      triband: t => "Triband : la famille des drapeaux nationaux, pour un nationalisme marqué ("
        + signed(Math.round(t.nat)) + ").",
      pale: t => "Bandes verticales : la disposition des tricolores républicains, quand rien ne "
        + "l'emporte nettement."
    },
    /* The method page. Paragraphs are trusted markup (em, code, strong),
       written here, never taken from a profile. */
    methodPage: {
      eyebrow: "Méthode",
      title: "Comment Politiskel mesure, et ce qu'il ne mesure pas",
      standfirst: "Une boussole est une réduction. Voici ce qu'elle garde, ce qu'elle perd, et d'où vient chaque chiffre.",
      toc: "Sommaire",
      sections: [
        { id: "mesure", title: "Ce que mesure Politiskel", paras: [
          "La boussole croise deux axes. L'axe horizontal est l'économie, de la gauche à la droite : redistribution, services publics et impôts, régulation des marchés. L'axe vertical est celui que les politistes appellent GAL-TAN — écologie, alternatives, libertés en bas ; tradition, autorité, nation en haut. C'est l'espace dans lequel le <em>Chapel Hill Expert Survey</em> (CHES) place les partis européens depuis vingt ans.",
          "GAL-TAN mesure des valeurs culturelles, pas le rapport à l'État : on peut être tout en bas et demander plus d'État, pour l'économie comme pour les services publics. Deux axes compressent forcément ; Politiskel propose donc plusieurs <em>lectures</em> — celle du questionnaire, celle de PolitiScales d'origine, l'économie croisée avec le protectionnisme — et la fiche d'un profil décompose le reste lecture par lecture."
        ] },
        { id: "sources", title: "Les deux sources d'un profil", paras: [
          "Un profil a deux sources possibles : un résultat PolitiScales, lu sur une capture, et le questionnaire Politiskel. Quand un thème du questionnaire est répondu, l'axe qu'il mesure <strong>remplace entièrement</strong> celui de PolitiScales — les deux ne sont jamais moyennés. Chaque coordonnée a donc une seule source, et le tableau la signale.",
          "Depuis PolitiScales, X est une moyenne pondérée de Capitalisme − Communisme (<code>0,45</code>) et de Laissez-faire − Régulation (<code>0,35</code>) ; Y, de Essentialisme − Constructivisme (<code>0,30</code>), Justice punitive − réhabilitative (<code>0,25</code>), Conservatisme − Progressisme (<code>0,25</code>) et Nationalisme − Internationalisme (<code>0,20</code>). Les poids sont renormalisés sur les seules composantes renseignées. Écologie ↔ Productivisme n'entre pas dans X : l'échelle économique du CHES exclut l'environnement.",
          "Depuis le questionnaire, X est la moyenne simple de trois sous-dimensions — redistribution, services publics contre impôts, régulation des marchés —, les trois sous-échelles économiques du CHES, dont la moyenne reproduit son axe <code>lrecon</code> à <code>r = 0,96</code>. Y suit le même principe sur les sept sous-dimensions sociétales du CHES ; leur moyenne reproduit <code>galtan</code> à <code>r = 0,97</code>. Le protectionnisme est lu à part, jamais dans X : dans le CHES il va contre la gauche-droite économique (<code>r = −0,37</code>)."
        ] },
        { id: "questions", title: "D'où viennent les questions", paras: [
          "Aucune question n'est écrite pour Politiskel. Chacune est citée d'une enquête publique éprouvée — l'<em>European Social Survey</em>, l'<em>International Social Survey Programme</em>, l'<em>European Values Study</em> — dans sa version française officielle, avec sa source jusqu'à la variable. On peut donc vérifier chaque formulation.",
          "Les exceptions sont signalées sur la question même : l'échelle de classe d'Erik Olin Wright, qui n'existe pas en français et est traduite, et les deux bornes d'une échelle de l'ESS dont la carte n'a pas été retrouvée. Seule la consigne change : écrite pour une série de questions posées à la suite, elle est mise au singulier, puisqu'ici chaque écran n'en pose qu'une, dans un ordre mélangé mais identique pour tout le monde."
        ], quote: ["« Le gouvernement devrait prendre des mesures pour réduire les différences de revenu. »", "ESS, variable <code>gincdif</code> — questionnaire français officiel"] },
        { id: "partis", title: "Comment les partis sont placés", paras: [
          "Les repères viennent du CHES 2024 : 609 politologues notent 279 partis européens sur les échelles <code>lrecon</code> et <code>galtan</code>, exactement les deux dimensions de cette boussole, ramenées de −100 à +100 : position = (note sur 10 − 5) × 20. Ce ne sont pas des scores PolitiScales ; les distances profil-parti gardent donc une part d'approximation."
        ] },
        { id: "distance", title: "Une proximité, pas une appartenance", paras: [
          "La distance entre un profil et un parti est mesurée sur les deux axes de la lecture choisie. Les seuils ne sont pas fixés à la main : on mesure l'espacement médian entre un parti et son voisin le plus proche, puis <em>proche</em> vaut jusqu'à cet espacement, <em>modérée</em> jusqu'à une fois et demie. Au-delà, le parti le moins lointain reste nommé, mais la page dit qu'aucun n'est vraiment proche. Le repère le plus proche n'est pas une famille politique : c'est le point le moins éloigné, et il peut être loin."
        ] },
        { id: "limites", title: "Limites", paras: [
          "Un groupe d'amis est un petit échantillon : il montre où ses membres divergent, il ne dit rien de la population. L'import PolitiScales lit une capture d'écran ; si sa mise en page change, la lecture peut échouer, et Politiskel le dit plutôt que de deviner.",
          "Deux axes ne voient ni le populisme — peuple contre élites — ni l'intégration européenne, dont les deux axes n'expliquent pas même la moitié dans le CHES. Ce sont des thèmes à venir du questionnaire. Le drapeau, enfin, est une illustration : il suit les conventions des drapeaux politiques, et sa légende dit ce que chaque élément représente."
        ] },
        { id: "donnees", title: "Vos données", paras: [
          "Vos réponses sont des opinions politiques — des données sensibles au sens de l'article 9 du RGPD. Elles ne sont enregistrées qu'avec votre consentement explicite, sur ce serveur seulement, et ne sont montrées qu'aux membres des groupes que vous avez rejoints. Les captures PolitiScales ne quittent jamais votre navigateur. Aucun traceur, aucun e-mail. Vous pouvez tout exporter ou tout effacer depuis votre compte."
        ] }
      ],
      limitsCaption: "Seuils de proximité par pays, en points sur l'échelle −100 … +100",
      colCountry: "Pays", colNear: "Proche", colFar: "Modérée", colTie: "Second repère affiché",
      upTo: n => "jusqu'à " + n, under: n => "moins de " + n + " pts d'écart",
      aside: "Les calculs sont publics et peuvent être refaits : les pondérations, les seuils et les affirmations de cette page sont mesurés par des scripts du dépôt, que chacun peut relancer.",
      source: "Voir le code source"
    },
    flagWhich: "Drapeau affiché", flagPolitiskel: "Politiskel", flagPolitiscales: "PolitiScales",
    flagPsCaption: "Drapeau extrait du résultat PolitiScales, tel que PolitiScales l'a dessiné.",
    flagsPage: {
      eyebrow: "Drapeaux",
      title: "Un drapeau tiré de vos positions",
      lead: "Chaque profil reçoit un drapeau, dans les conventions des drapeaux politiques : deux ou trois couleurs fortes, "
        + "un symbole, de grandes formes, aucune lettre. Rien n'est choisi dans une liste fixe : chaque trait porte sa "
        + "couleur et son symbole, et le drapeau combine les traits les plus marqués.",
      symbolsTitle: n => "Les " + n + " symboles",
      symbolsLead: "Silhouettes pleines et évidements larges : chacun reste lisible à 24 px, taille des pastilles de groupe.",
      drawn: "Dessin Politiskel", credit: a => "game-icons.net · " + a,
      symbols: {
        fist: ["Poing levé", "une lecture de classe anticapitaliste"], scales: ["Balance", "la redistribution"],
        swallow: ["Hirondelle", "le libre marché"], factory: ["Usine", "le productivisme"], sprout: ["Pousse", "l'écologie"],
        handshake: ["Poignée de mains", "le réformisme"], star: ["Étoile", "la révolution"],
        phrygian: ["Bonnet phrygien", "la révolution et la liberté"], anarchy: ["A cerclé", "un rejet radical de l'État"],
        torch: ["Torche", "le progressisme"], liberty: ["Chaîne brisée", "les libertés publiques"],
        shield: ["Bouclier", "l'ordre et la sécurité"], globe: ["Globe", "le cosmopolitisme"],
        rings: ["Anneaux entrelacés", "le multiculturalisme"], oak: ["Feuille de chêne", "l'enracinement national"],
        tower: ["Tour", "le protectionnisme"], book: ["Livre ouvert", "la religion hors de la politique"],
        column: ["Colonne", "la tradition"], venus: ["Symbole ♀", "le féminisme"],
        equality: ["Signe égal", "l'égalité des droits pour tous"], croix: ["Croix de guerre", "le patriotisme martial"],
        crown: ["Couronne", "le monarchisme"], fleur: ["Fleur de lys", "un monarchisme légitimiste"],
        hammer: ["Faucille et marteau", "le communisme"], rose: ["Rose", "la social-démocratie"],
        lorraine: ["Croix de Lorraine", "le gaullisme"], cog: ["Roue dentée", "le syndicalisme"],
        dove: ["Colombe", "le pacifisme · thème Europe et monde"], wheat: ["Épi de blé", "l'agrarisme · à venir"],
        snail: ["Escargot", "la décroissance · thème Écologie"], turbine: ["Éolienne", "la transition énergétique · thème Écologie"],
        atom: ["Atome", "le nucléaire civil · thème Écologie"], eustars: ["Cercle d'étoiles", "le fédéralisme européen · thème Europe"],
        wall: ["Rempart", "la souveraineté nationale · thème Europe"], vote: ["Urne", "la démocratie directe · thème Institutions"],
        megaphone: ["Mégaphone", "le populisme · thème Institutions"], ermine: ["Hermine", "le régionalisme · thème Institutions"]
      },
      coloursTitle: "Les couleurs",
      coloursLead: "Les couleurs politiques conventionnelles, d'après l'usage français et européen.",
      colours: {
        red: ["Rouge", "la gauche économique"], gold: ["Or", "le libéralisme économique"], blue: ["Bleu", "l'ordre"],
        purple: ["Violet", "le féminisme"], pink: ["Rose", "la social-démocratie"], green: ["Vert", "l'écologie"],
        steel: ["Acier", "le productivisme"], sky: ["Bleu ciel", "le cosmopolitisme"], orange: ["Orange", "le centre"],
        black: ["Noir", "le rejet de l'État"], navy: ["Bleu marine", "le national-conservatisme"],
        brown: ["Brun", "l'extrême droite autoritaire"], white: ["Blanc", "aucune lecture marquée"]
      },
      layoutsTitle: "Les dispositions",
      layoutsLead: "La disposition vient de la lecture dominante ; ses champs prennent les couleurs des traits les plus forts, dans l'ordre.",
      layouts: {
        pale: ["Bandes verticales", "La disposition des tricolores républicains, quand rien ne l'emporte nettement."],
        triband: ["Triband", "La famille des drapeaux nationaux, pour un nationalisme marqué."],
        nordic: ["Croix nordique", "La famille des drapeaux d'ordre, pour un profil traditionaliste."],
        royal: ["Champ blanc, bordure d'or", "La famille des drapeaux royaux : ordre et tradition marqués, ou monarchisme."],
        revolution: ["Triangle de hampe", "Les drapeaux révolutionnaires, pour une lecture de classe très marquée."],
        diagonal: ["Diagonale", "La convention anarchiste, noir en bas côté battant, pour le rejet de l'État."],
        pall: ["Pall en Y", "Comme le drapeau sud-africain : la convergence, pour un multiculturalisme marqué."],
        stripes: ["Canton et bandes", "L'ouverture sur le monde, pour un cosmopolitisme marqué."],
        centred: ["Croix centrée liserée", "Deux axes qui se croisent à rebours : une gauche traditionaliste, une droite d'ouverture."],
        disc: ["Croix nordique à disque", "Une cause au-dessus de toutes les autres, portée au croisement."]
      },
      modifier: n => "Modificateur · " + n,
      mods: {
        rainbow: ["Barre arc-en-ciel", "Un soutien marqué aux droits des personnes LGBT ; elle rejoint n'importe quelle disposition."],
        border: ["Bordure sombre", "Un protectionnisme très marqué."]
      },
      example: n => "Exemple : " + n,
      asideTitle: "Écartés volontairement",
      aside: "Les logos de partis, les emblèmes religieux, et tout symbole de haine — la croix de fer, la croix gammée "
        + "et leurs dérivés parmi eux ; la croix de guerre porte le patriotisme martial sans cette charge. Les symboles marqués "
        + "d'un thème à venir ne sont pas encore dessinés : ils attendent la lecture qui les justifie."
    },
    flagColourLines: {
      red: v => "Rouge : la gauche économique (" + v + ").",
      gold: v => "Or : le libéralisme économique (" + v + ").",
      blue: v => "Bleu : l'ordre (" + v + ").",
      purple: v => "Violet, la couleur des suffragettes : le féminisme (" + v + ").",
      pink: v => "Rose, celle des socialistes : la social-démocratie (" + v + ").",
      navy: v => "Bleu marine : le national-conservatisme, nation et ordre ensemble (" + v + ").",
      brown: v => "Brun, la couleur que l'histoire a donnée à l'extrême droite autoritaire : nation, ordre et refus de l'égalité des droits, tous très marqués (" + v + ").",
      green: v => "Vert : l'écologie, d'après PolitiScales (" + v + ").",
      sky: v => "Bleu ciel, celui des Nations unies : le cosmopolitisme (" + v + ").",
      orange: () => "Orange, la couleur des centristes : aucun axe ne penche nettement.",
      white: () => "Blanc : aucune lecture assez marquée pour une couleur.",
      black: v => "Noir : le rejet de l'État, dans la tradition anarchiste (" + v + ").",
      steel: v => "Acier : le productivisme, d'après PolitiScales (" + v + ")."
    },
    flagSecond: "Et, plus petit — ",
    flagBorder: v => "Bordure sombre : un protectionnisme très marqué (" + v + ").",
    flagRevolutionStar: v => "Étoile : la révolution (" + v + ").",
    flagRainbow: v => "Barre arc-en-ciel : un soutien marqué aux droits des personnes LGBT (" + v + ").",
    flagSymbolLines: {
      fist: v => "Poing levé : une lecture de classe anticapitaliste (" + v + ").",
      swallow: v => "Hirondelle, l'oiseau en vol du libéralisme : le libre marché (" + v + ").",
      liberty: v => "Chaîne brisée : les libertés publiques, plus marquées que le reste de l'axe sociétal (" + v + ").",
      shield: v => "Bouclier : l'ordre et la sécurité, plus marqués que le reste de l'axe sociétal (" + v + ").",
      globe: v => "Globe : le cosmopolitisme (" + v + ").",
      oak: v => "Feuille de chêne : l'enracinement national (" + v + ").",
      tower: v => "Tour : le protectionnisme (" + v + ").",
      book: v => "Livre ouvert : la religion tenue hors de la politique (" + v + ").",
      column: v => "Colonne : la tradition (" + v + ").",
      scales: v => "Balance : la redistribution (" + v + ").",
      rings: v => "Anneaux entrelacés : le multiculturalisme (" + v + ").",
      star: v => "Étoile : la révolution (" + v + ").",
      sprout: v => "Pousse : l'écologie (" + v + ").",
      torch: v => "Torche : le progressisme (" + v + ").",
      venus: v => "Symbole ♀ : le féminisme (" + v + ").",
      handshake: v => "Poignée de mains : le réformisme (" + v + ").",
      factory: v => "Usine : le productivisme (" + v + ").",
      anarchy: v => "A cerclé : un rejet radical de l'État (" + v + ").",
      phrygian: v => "Bonnet phrygien : la révolution et la liberté (" + v + ").",
      croix: v => "Croix de guerre : le patriotisme martial, nation et ordre ensemble (" + v + ").",
      crown: v => "Couronne : le monarchisme (" + v + ").",
      equality: v => "Signe égal : l'égalité des droits pour tous — personnes LGBT, femmes, minorités — plutôt qu'une cause parmi d'autres (" + v + ").",
      fleur: v => "Fleur de lys : un monarchisme légitimiste (" + v + ").",
      hammer: v => "Faucille et marteau : le communisme, l'alliance des ouvriers et des paysans (" + v + ").",
      rose: v => "Rose : la social-démocratie, le socialisme qui réforme (" + v + ").",
      lorraine: v => "Croix de Lorraine : le gaullisme, la nation et un État qui oriente l'économie (" + v + ").",
      cog: v => "Roue dentée : le syndicalisme, du côté du travail face au capital (" + v + ").",
      dove: v => "Colombe : le pacifisme (" + v + ").",
      wheat: v => "Épi de blé : l'agrarisme et la ruralité (" + v + ").",
      snail: v => "Escargot : la décroissance (" + v + ").",
      turbine: v => "Éolienne : la transition énergétique (" + v + ").",
      atom: v => "Atome : le nucléaire civil (" + v + ").",
      eustars: v => "Cercle d'étoiles : le fédéralisme européen (" + v + ").",
      wall: v => "Rempart : la souveraineté nationale face à l'Union (" + v + ").",
      vote: v => "Urne : la démocratie directe, le référendum d'initiative citoyenne (" + v + ").",
      megaphone: v => "Mégaphone : le populisme, le peuple contre les élites (" + v + ").",
      ermine: v => "Hermine : le régionalisme, la décentralisation (" + v + ")."
    },
    tabCompass: "Boussole", tabQuiz: "Questionnaire", tabGroups: "Groupes", tabAccount: "Mon compte",
    welcomeTitle: "Politiskel, en groupe",
    welcomeLead: "Chaque membre a son compte et son profil, et voit ceux des groupes qu'il a "
      + "rejoints — et d'eux seuls.",
    loading: "Chargement…", you: "vous",
    groupShown: "Groupe affiché", manageGroups: "Gérer mes groupes →",
    groupSwitch: "Changer de groupe…", manageGroupsShort: "Gérer les groupes",
    inviteShort: "Inviter", memberShow: a => "Voir le profil de " + a,
    groupAloneShort: "Seul votre profil est affiché.",
    groupAloneLead: "Seul votre profil est affiché : créez un groupe, ou rejoignez celui d'un "
      + "proche, pour vous comparer.",
    groupsLead: "Vos groupes, leurs membres et leur lien d'invitation. Un groupe ne se voit que "
      + "de l'intérieur : sans invitation, personne ne sait qu'il existe.",
    noGroups: "Vous n'êtes dans aucun groupe pour l'instant : créez-en un, ou rejoignez celui "
      + "d'un proche avec son lien.",
    memberCount: n => n + " membre" + (n > 1 ? "s" : ""),
    seeOnCompass: "Voir sur la boussole", backToGroups: "Retour à mes groupes",
    inviteCopiedShort: "Lien copié", groupCreateTitle: "Créer un groupe",
    groupCreateNote: "Vous en serez le premier membre. Partagez ensuite son lien d'invitation : "
      + "quiconque l'a peut demander à rejoindre.",
    groupCreated: g => "Groupe « " + g + " » créé.",
    joinTitle: "Rejoindre un groupe", joinPlaceholder: "Lien ou code d'invitation",
    joinGo: "Voir l'invitation",
    groupsTitle: "Mes groupes",
    groupsLeadShort: "Un groupe ne se voit que de l'intérieur : sans invitation, personne ne sait qu'il existe.",
    groupNotFound: "Ce groupe n'existe pas, ou vous n'en êtes pas membre.",
    memberSource: (ps, quiz) => ps && quiz ? "Questionnaire + PolitiScales" : ps ? "PolitiScales" : quiz ? "Questionnaire" : "Pas encore de réponses",
    youOwner: "vous · propriétaire", youTag: "vous", ownerTag: "propriétaire",
    inviteLinkTitle: "Lien d'invitation",
    inviteLinkLead: "Quiconque a ce lien peut demander à rejoindre le groupe. Il voit son nom avant de décider.",
    copyLink: "Copier le lien", copied: "Copié",
    ownerToolsTitle: "Outils du propriétaire",
    ownerDeleteLead: "Supprimer le groupe pour tous ses membres. Les profils restent sur leurs comptes ; seul le groupe disparaît.",
    memberToolsLead: "Quitter le groupe : vous n'y verrez plus ses membres, et ils ne verront plus votre profil.",
    confirmCancel: "Annuler",
    backToGroupsShort: "← Mes groupes",
    joinNote: "Vous verrez le nom du groupe avant de décider : rien n'est rejoint sans votre accord.",
    inviteTitle: "Invitation",
    inviteWarn: "En rejoignant ce groupe, vos réponses et vos pourcentages PolitiScales seront "
      + "visibles de ses membres. Vous pourrez le quitter à tout moment.",
    alreadyMember: g => "Vous êtes déjà membre de « " + g + " ».",
    myProfile: "Mon profil", myData: "Mes données", deleteTitle: "Supprimer mon compte",
    savedPolitiscales: "Pourcentages PolitiScales enregistrés.",
    username: "Pseudonyme", password: "Mot de passe", passwordNew: "Mot de passe (10 caractères ou plus)",
    signInTitle: "Se connecter", signIn: "Connexion", registerTitle: "Créer un compte",
    register: "Créer mon compte", signOut: "Se déconnecter", signedInAs: "Connecté : ",
    consent: "J'accepte que mes réponses — des opinions politiques — soient enregistrées sur "
      + "ce serveur et montrées aux membres des groupes que je rejoins, et à eux seuls. Je peux "
      + "exporter mes données ou supprimer mon compte à tout moment, ce qui efface tout.",
    serverNote: "Choisissez un pseudonyme plutôt que votre nom : c'est lui que verront les "
      + "membres de vos groupes. Aucun e-mail n'est demandé.",
    serverNoteIn: "Vos réponses et vos pourcentages PolitiScales sont enregistrés sur ce serveur, "
      + "visibles des membres de vos groupes seulement. Les captures, elles, ne quittent jamais "
      + "votre navigateur.",
    groupLabel: "Groupe", groupNone: "Mon profil seul", groupName: "Nom du nouveau groupe",
    groupCreate: "Créer le groupe", invite: "Copier le lien d'invitation",
    inviteCopied: "Lien d'invitation copié : quiconque l'a peut rejoindre le groupe.",
    leave: "Quitter ce groupe", leaveConfirm: g => "Quitter « " + g + " » ? Vous n'y verrez plus "
      + "les profils, et ses membres ne verront plus le vôtre.",
    joined: g => "Vous avez rejoint « " + g + " ».",
    joinPending: "Connectez-vous ou créez un compte : vous verrez ensuite quel groupe vous "
      + "invite, avant de décider de le rejoindre.",
    inviteAsk: (g, n) => "Le groupe « " + g + " » (" + n + " membre" + (n > 1 ? "s" : "") + ") vous "
      + "invite. En le rejoignant, vos réponses et vos pourcentages PolitiScales seront visibles "
      + "de ses membres.",
    inviteAccept: "Rejoindre", inviteDecline: "Refuser",
    ownerYou: "Vous en êtes propriétaire", ownerIs: n => "Propriétaire : " + n,
    ownerManage: "Gérer le groupe",
    ownerNewLink: "Changer le lien d'invitation",
    ownerNewLinkConfirm: "Changer le lien ? L'ancien cessera de fonctionner aussitôt ; les membres "
      + "actuels restent dans le groupe.",
    ownerNewLinkDone: "Nouveau lien créé : l'ancien ne fonctionne plus.",
    ownerRemove: "Retirer", ownerRemoveConfirm: (m, g) => "Retirer " + m + " de « " + g + " » ? Il ou elle "
      + "ne verra plus le groupe. Pensez à changer le lien s'il circule encore.",
    ownerHandOver: "Transmettre", ownerHandOverConfirm: (m, g) => "Transmettre « " + g + " » à " + m
      + " ? Vous resterez membre, sans pouvoir le gérer.",
    ownerDelete: "Supprimer le groupe",
    ownerDeleteConfirm: g => "Supprimer « " + g + " » pour tous ses membres ? Les profils restent sur "
      + "leurs comptes ; seul le groupe disparaît.",
    ownerNote: "Si le lien a circulé au-delà du groupe, changez-le : l'ancien ne mènera plus nulle part.",
    passwordTitle: "Mot de passe", passwordCurrent: "Mot de passe actuel",
    passwordWrong: "Le mot de passe actuel n'est pas le bon.",
    passwordChange: "Changer le mot de passe", passwordNewLabel: "Nouveau mot de passe",
    passwordChanged: "Mot de passe changé : vos autres sessions sont fermées.",
    passwordNote: "Changer de mot de passe ferme toutes vos autres sessions. Sans e-mail, un mot de passe "
      + "perdu ne peut être réinitialisé que par la personne qui héberge ce site.",
    signOutOthers: "Se déconnecter partout ailleurs",
    signedOutOthers: "Vos autres sessions sont fermées.",
    signupInviteOnly: "Sur ce site, on crée un compte depuis le lien d'invitation d'un groupe. Si vous en "
      + "avez un, ouvrez-le : le formulaire vous attendra.",
    guestTry: "Essayer sans compte",
    guestNote: "Sans compte, rien n'est enregistré sur le serveur : vos réponses restent dans ce navigateur, "
      + "et vous ne voyez aucun groupe.",
    guestBanner: "Mode invité : vos réponses restent dans ce navigateur, rien n'est envoyé au serveur.",
    guestSignUp: "Créer un compte", guestSignIn: "Se connecter",
    guestCarry: n => "Reprendre les " + n + " réponses données en mode invité",
    accountMore: "Nouveau groupe, mes données",
    exportAccount: "Exporter toutes mes données",
    deleteWarn: "Votre compte, votre profil, vos réponses et vos appartenances aux groupes seront "
      + "effacés, définitivement. Confirmez avec votre mot de passe.",
    deleteAccount: "Supprimer définitivement",
    deleteConfirm: "Supprimer votre compte, votre profil et vos réponses ? C'est définitif.",
    saved: "Enregistré.", addTitleServer: "Mon résultat PolitiScales",
    apiErrors: {
      default: "Le serveur n'a pas pu traiter la demande.",
      cross_origin: "Le serveur a refusé une demande qui ne venait pas de son propre site.",
      network: "Pas de connexion au serveur : ce qui n'a pas pu partir sera renvoyé.",
      flag_too_large: "Le drapeau de la capture est trop lourd pour être enregistré.",
      flag_not_png: "Le drapeau de la capture n'est pas une image PNG valide.",
      consent_required: "Cochez la case de consentement pour créer un compte.",
      username_length: "Le pseudonyme doit faire de 2 à 24 caractères.",
      username_chars: "Le pseudonyme ne peut contenir que des lettres, des chiffres, des espaces et - _ . '",
      username_taken: "Ce pseudonyme est déjà pris.",
      password_short: "Le mot de passe doit faire au moins 10 caractères.",
      password_long: "Ce mot de passe est trop long.",
      bad_credentials: "Pseudonyme ou mot de passe incorrect.",
      too_many_attempts: "Trop de tentatives : réessayez dans un quart d'heure.",
      not_signed_in: "Votre session a expiré : reconnectez-vous.",
      no_such_invite: "Ce lien d'invitation ne mène à aucun groupe.",
      no_such_group: "Ce groupe n'existe plus, ou vous n'en êtes plus membre.",
      group_name_length: "Donnez au groupe un nom de 1 à 60 caractères.",
      not_owner: "Seul le propriétaire du groupe peut faire cela.",
      no_such_member: "Ce membre n'est plus dans le groupe.",
      signup_invite_only: "Sur ce site, on crée un compte depuis un lien d'invitation : demandez-en un au "
        + "groupe que vous voulez rejoindre.",
      too_many_signups: "Trop de comptes créés depuis cette adresse : réessayez dans une heure."
    },
    viewOff: "pas de position dans cette lecture",
    viewOffDetail: "Ce profil n'a pas de position dans cette lecture : il lui manque les réponses "
      + "au questionnaire qui la mesurent.",
    viewNoRefs: "aucun parti mesuré dans cette lecture",
    viewNotePolitiscales: "Lecture d'origine : X et Y calculés depuis PolitiScales seul, sans "
      + "tenir compte du questionnaire.",
    viewNoteNoProt: why => "Aucun repère dans cette lecture : " + why,
    viewNoteAllEstimated: "Aucun repère dans cette lecture : ceux de ce pays sont tous des "
      + "estimations à la main, et il n'y a rien sur quoi estimer leur protectionnisme.",
    viewNoteDropped: n => n + " repère" + (n > 1 ? "s" : "") + " placé" + (n > 1 ? "s" : "")
      + " à la main n'" + (n > 1 ? "ont" : "a") + " pas de position CHES sur le protectionnisme "
      + "et n'" + (n > 1 ? "apparaissent" : "apparaît") + " pas.",
    viewNoteOff: n => n + " profil" + (n > 1 ? "s" : "") + " sans réponse au questionnaire "
      + "économie " + (n > 1 ? "ne sont" : "n'est") + " pas placé" + (n > 1 ? "s" : "")
      + " : c'est lui qui mesure le protectionnisme.",
    viewNoteSkippedProt: n => n + " profil" + (n > 1 ? "s ont" : " a") + " passé les deux "
      + "questions sur le protectionnisme, et " + (n > 1 ? "ne sont" : "n'est") + " donc pas "
      + "placé" + (n > 1 ? "s" : "") + ".",
    viewNoteNoX: n => n + " profil" + (n > 1 ? "s" : "") + " sans réponse sur l'axe économique "
      + (n > 1 ? "ne sont" : "n'est") + " pas placé" + (n > 1 ? "s" : "") + ".",
    views: {
      politiskel: { name: "Politiskel — économie × société" },
      politiscales: { name: "PolitiScales d'origine" },
      protectionism: { name: "Économie × protectionnisme",
        axisTop: "PROTECTIONNISTE — protéger les producteurs",
        axisBottom: "LIBRE-ÉCHANGISTE — ouvrir les échanges",
        quadTopLeft: "Gauche protectionniste", quadTopRight: "Droite protectionniste",
        quadBottomLeft: "Gauche libre-échangiste", quadBottomRight: "Droite libre-échangiste",
        colY: "Y protect.",
        titleY: "Positif = protectionniste (haut) · négatif = libre-échangiste (bas)",
        tipSocial: "Protectionnisme", suffixAuthor: " protect.", suffixLibert: " libre-éch." },
      populist: { name: "Lecture populiste — thème Institutions, à venir" }
    },
    quizOpen: "Compléter mon profil", quizEdit: "Modifier mes réponses",
    quizBack: "← Retour à la boussole",
    backToThemes: "← Tous les thèmes", otherThemes: "Autres thèmes",
    hubEyebrow: "Questionnaire Politiskel",
    hubLead: "Le questionnaire est découpé en thèmes, que vous remplissez dans l'ordre que "
      + "vous voulez. Chacun remplace ou ajoute une lecture de votre profil ; l'économie est la "
      + "première disponible, pas la seule.",
    hubPlanned: "À venir",
    hubTitle: "Répondez par thèmes, dans l'ordre que vous voulez.",
    hubLeadShort: "Chacun remplace ou ajoute une lecture de votre profil. L'économie est la première disponible, pas la seule.",
    hubSources: "Aucune question n'est écrite pour Politiskel : chacune est citée d'une grande enquête publique — ESS, ISSP, EVS — dans sa version française officielle, avec sa source.",
    hubMethod: "Lire la méthode",
    hubProgress: (n, m) => n + " / " + m + " réponses",
    themes: {
      economy: { name: "Économie",
        desc: "Redistribution, impôts et services publics, régulation des marchés — qui remplacent "
          + "l'axe X de PolitiScales — et, à part, le protectionnisme et trois lectures de classe.",
        lead: "Ces questions remplacent l'axe économique de PolitiScales, qui ne repose que sur "
          + "deux de ses axes et ne pose rien sur la redistribution.",
        leadNative: "Ces questions placent votre profil sur l'axe économique, sur l'échelle "
          + "qu'utilisent les experts du CHES pour les partis, et en tirent plusieurs autres "
          + "lectures.",
        salience: "Quelle place l'économie tient-elle dans vos choix politiques ?",
        salienceAfter: "Maintenant que vous avez répondu : quelle place l'économie tient-elle "
          + "dans vos choix politiques ?" },
      society: { name: "Société",
        desc: "Immigration, multiculturalisme, ordre et libertés, droits des femmes et des "
          + "personnes LGBT, religion, nation — qui remplacent l'axe Y de PolitiScales.",
        lead: "Ces questions remplacent l'axe sociétal de PolitiScales par les sept dimensions "
          + "sur lesquelles les experts du CHES placent les partis, de l'immigration à la "
          + "place de la religion.",
        leadNative: "Ces questions placent votre profil sur l'axe sociétal — tradition, autorité et "
          + "nation contre écologie, alternatives et libertés —, sur l'échelle qu'utilisent les "
          + "experts du CHES pour les partis.",
        salience: "Quelle place les questions de société tiennent-elles dans vos choix "
          + "politiques ?",
        salienceAfter: "Maintenant que vous avez répondu : quelle place les questions de "
          + "société tiennent-elles dans vos choix politiques ?" },
      europe: { name: "Europe et monde",
        desc: "Intégration européenne et rapport à la Russie, que PolitiScales ne demande pas : "
          + "de quoi faire enfin une vraie lecture de la souveraineté." },
      ecology: { name: "Écologie",
        desc: "Environnement et climat, lus à part de l'économie, comme le fait le CHES." },
      institutions: { name: "Institutions",
        desc: "Pouvoir exécutif, indépendance de la justice, régions — et la lecture populiste, "
          + "peuple contre élites, présentée comme telle." }
    },
    quizCount: (i, n) => i + " / " + n,
    quizIntroEyebrow: "Questionnaire Politiskel · Économie",
    quizIntroTitle: a => "Compléter le profil de " + a,
    quizIntroMeta: (n, t) => n + " questions, et deux fois la même sur l'importance "
      + (t > 1 ? "de chaque thème" : "du thème") + " · environ " + Math.max(5, Math.round(n / 3.5))
      + " minutes",
    quizHint: "Chaque question est reprise telle quelle d'une grande enquête publique (ESS, ISSP, "
      + "EVS), dans sa version française officielle, avec sa source. Les exceptions sont "
      + "signalées : l'échelle de classe d'Erik Olin Wright n'existe pas en français, elle est "
      + "traduite ici. Seule la consigne est mise au singulier : l'enquête pose ses questions en "
      + "série, ici chaque écran n'en pose qu'une. Vous pouvez passer une question ; vos réponses "
      + "restent dans ce navigateur.",
    quizStart: "Commencer", quizResume: "Reprendre", quizPrev: "← Précédent",
    quizNext: "Suivant →", quizSkip: "Passer", quizSeeResult: "Voir le résultat →",
    quizErase: "Effacer mes réponses",
    eraseAllTitle: "Effacer toutes mes réponses",
    eraseAllLead: "Toutes les réponses au questionnaire, de tous les thèmes. Votre résultat PolitiScales et votre compte restent.",
    eraseAllConfirm: "Effacer toutes vos réponses au questionnaire ? Votre position sur la boussole reviendra à celle de PolitiScales, ou disparaîtra si vous n'en avez pas. C'est définitif.",
    eraseAllDone: "Toutes vos réponses sont effacées.",
    exportAnswers: "Exporter mes réponses",
    exportHint: "Le fichier téléchargé contient vos réponses, rien d'autre. Déposé dans "
      + "politi-results/answers/ par la personne qui assemble la page du groupe, il y ajoute "
      + "votre profil, et permet de tester le questionnaire sur de vraies réponses.",
    quizKeys: "Touches 1 à 9 pour répondre · ← → pour naviguer",
    quizPoleFull: n => "Tout à fait d'accord : " + n,
    resultEyebrow: t => "Résultat · " + t,
    resultTitle: "D'où vous partiez, où vous arrivez",
    resultNoAxis: (theme, native) => "Aucune réponse au thème " + theme
      + (native ? " pour l'instant." : " : cet axe reste celui de PolitiScales."),
    resultWas: "PolitiScales", resultNow: "Politiskel",
    journeyAria: a => "Trajet sur l'axe " + a, journeyZoom: (lo, hi) => "vue rapprochée, de " + lo + " à " + hi,
    journeyWas: v => "PolitiScales " + v, journeyNow: v => "Questionnaire " + v,
    resultCount: (t, n, m) => t + " · " + n + " / " + m + " réponses",
    resultLead: { x: "Vos réponses remplacent l'axe économique de PolitiScales, qui ne posait rien sur la redistribution. Votre point se déplace sur la boussole.",
                  y: "Vos réponses remplacent l'axe sociétal de PolitiScales, question par question tirées des enquêtes publiques. Votre point se déplace sur la boussole." },
    resultLeadNative: "Vos réponses placent votre point sur cet axe de la boussole.",
    resultWasPs: v => "était " + v + " avec PolitiScales", resultNativeNote: "mesuré par le questionnaire",
    nextTheme: n => "Thème suivant : " + n, dimNote: "sous-dimension du CHES",
    resultEnds: { x: ["gauche", "droite"], y: ["ouverture", "tradition"] },
    backToCompass: "Voir sur la boussole", quizReview: "Revoir mes réponses",
    quizSourceLabel: "Source : ",
    quizTranslated: { item: "traduction Politiskel", anchors: "bornes traduites par Politiskel" },
    quizSalienceSrc: "Question Politiskel — aucune enquête publique ne mesure l'importance "
      + "d'un thème sur une échelle.",
    fromQuiz: from => "X tiré du questionnaire (PolitiScales : " + from + ")",
    fromQuizY: from => "Y tiré du questionnaire (PolitiScales : " + from + ")",

    readingsTitle: "Questionnaire",
    journey: (from, to, fr, tr) => "PolitiScales " + from + " → Politiskel " + to
      + (fr === tr ? " · repère inchangé : " + tr : " · repère : " + fr + " → " + tr),
    dims: { redistribution: "Redistribution", spendvtax: "Services publics / impôts",
            deregulation: "Régulation des marchés",
            immigration: "Immigration", multiculturalism: "Multiculturalisme / assimilation",
            laworder: "Libertés / ordre", women: "Droits des femmes", lgbt: "Droits LGBT",
            religion: "Religion et politique", nationalism: "Nationalisme" },
    readingAxis: { x: "Économie (X)", y: "Société (Y)" },
    readingProtectionism: "Protectionnisme",
    readingClass: "Classe (Wright)",
    readingConflict: "Conflit de classe perçu",
    readingLabour: "Rapport capital / travail",
    readingNone: "—",
    readingClassIncomplete: n => "incomplète (" + n + "/5) — l'échelle ne vaut que complète",
    answeredOf: (n, m) => n + "/" + m + " réponses",
    readingNotes: {
      x: "négatif = gauche, positif = droite, sur l'échelle lrecon du CHES",
      y: "négatif = écologie, alternatives, libertés ; positif = tradition, autorité, nation — le GAL-TAN du CHES",
      protectionism: "hors de l'axe X : dans le CHES, il va contre la gauche-droite économique",
      class: "anticapitaliste si positif — une lecture rivale de X, pas une composante",
      conflict: "à côté de l'échelle de Wright, pas dedans",
      labour: "du côté du travail si positif — syndicats, pouvoir des patrons"
    },
    salienceOf: s => "Importance déclarée : " + s,
    salienceMoved: (a, b, d) => "Importance déclarée : " + a + " au début, " + b + " à la fin"
      + (d === 0 ? " — inchangée" : d > 0 ? " — en hausse" : " — en baisse"),
    nativeLead: "Pas de résultat PolitiScales ? Partez d'ici :",
    nativeStart: "Commencer le questionnaire",
    nativeTitle: a => "Le profil de " + a,
    nativeMotto: "Profil Politiskel, sans résultat PolitiScales",
    nativeEmpty: "questionnaire pas encore commencé",
    nativeNoY: "pas encore de Y — répondez au thème Société",
    nativeNoX: "pas encore de X — répondez au thème Économie",
    nativeNoXY: "pas encore de position — répondez aux thèmes Économie et Société",
    nativeOffDetail: missing => missing.length > 1
      ? "Ce profil n'a encore ni X ni Y : ils viendront des thèmes Économie et Société du "
        + "questionnaire. En attendant, il n'est pas placé sur cette boussole."
      : "Ce profil n'a pas encore de " + missing[0] + " : il viendra du thème "
        + (missing[0] === "X" ? "Économie" : "Société") + " du questionnaire. En attendant, il "
        + "n'est pas placé sur cette boussole."
        + (missing[0] === "Y" ? " La lecture « Économie × protectionnisme » le place." : ""),
    fromQuizNative: "X tiré du questionnaire",
    fromQuizNativeY: "Y tiré du questionnaire",
    journeyNative: pair => "Politiskel " + pair,
    resultTitleNative: "Où vous placent vos réponses",
    allName: "Questionnaire complet",
    allDesc: names => "Toutes les questions de tous les thèmes disponibles, mélangées dans un "
      + "ordre fixe, le même pour tout le monde. Pour l'instant : " + names.join(", ") + ".",
    allLead: (n, m) => "Toutes les questions des thèmes disponibles — " + n + " sur " + m
      + " pour l'instant — mélangées dans un ordre fixe, le même pour tout le monde : une suite "
      + "de questions sur un même sujet laisse deviner ce qu'elle mesure. Les réponses sont les "
      + "mêmes que thème par thème : ce qui est déjà répondu d'un côté l'est de l'autre."
  }
};

export const L = LOCALES.fr;
