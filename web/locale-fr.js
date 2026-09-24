/* Every sentence the page shows, in French. Code elsewhere looks wording up
   here and never writes it, so a second language is a second table.
   The page has one script: the web/*.js files are concatenated in the order
   web/shell.html includes them, and share its top-level scope. */

"use strict";

/* ----------------------------------------------------------------- i18n ---
   Every user-facing string lives here. Adding a language means adding one
   object to LOCALES and nothing else: no copy is hardcoded anywhere below,
   and the static markup is filled from the same table through data-i18n
   attributes. The language is taken from <html lang>.

   Two things deliberately stay out: the numbers themselves, and everything
   that lives in the reference tables — party names, which are proper nouns,
   along with the country names and the one-line notes that sit next to them.
   Those notes are prose about specific parties, they belong with the
   coordinates they describe, and splitting them off would leave two tables to
   keep in step. A second language would translate COUNTRIES, not this. */
const LOCALES = {
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

    axisTop: "AUTORITAIRE — ordre et tradition",
    axisBottom: "LIBERTAIRE — ouverture sociétale",
    axisLeft: "GAUCHE économique",
    axisRight: "DROITE économique",
    quadTopLeft: "Gauche autoritaire", quadTopRight: "Droite autoritaire",
    quadBottomLeft: "Gauche libertaire", quadBottomRight: "Droite libertaire",

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
    emptyNoData: "profiles-data.js absent — lancez « node tools/extract.js » pour lire politi-results/.",
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
    legendProfiles: "Profils", legendParties: c => "Partis — " + c + " (repères)",
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
    titleY: "Positif = autoritaire (haut) · négatif = libertaire (bas)",
    titleEcol: "Écologie − Productivisme : positif = écologiste. Hors des deux axes, comme dans le CHES.",
    titleDeltaEcon: "Écart sur l'axe économique",
    titleDeltaSocial: "Écart sur l'axe sociétal : positif = le parti est plus autoritaire que vous",

    neutralPct: "Neutre", positionLabel: "Position",
    uncertainty: "Incertitude", uncertaintyNone: "aucune",
    poleNegative: "Pôle négatif", polePositive: "Pôle positif",

    /* the native questionnaire */
    optTrail: "Trajet depuis PolitiScales",
    optView: "Lecture",
    optFlags: "Drapeaux",
    flagsPolitiscales: "PolitiScales quand il existe", flagsPolitiskel: "Politiskel pour tous",
    flagGeneratedAlt: a => "Drapeau Politiskel de " + a,
    manualEntry: "Saisir les pourcentages à la main",
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
        + "pour un profil nettement libertaire (Y " + signed(t.y) + ").",
      revolution: t => "Triangle de hampe et bandes : la famille des drapeaux révolutionnaires, "
        + "pour une lecture révolutionnaire ou de classe très marquée (" + signed(Math.round(t.rev)) + ").",
      royal: t => t.monarchy !== null && t.monarchy >= 60
        ? "Champ blanc et bordure d'or : la famille des drapeaux royaux, pour un monarchisme marqué ("
          + signed(Math.round(t.monarchy)) + ")."
        : "Champ blanc et bordure d'or : ordre (Y " + signed(t.y) + ") et tradition marqués.",
      nordic: t => "Croix nordique : la famille des drapeaux d'ordre, pour un profil autoritaire (Y "
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
    flagColourLines: {
      red: v => "Rouge : la gauche économique (" + v + ").",
      gold: v => "Or : le libéralisme économique (" + v + ").",
      blue: v => "Bleu : l'ordre (" + v + ").",
      purple: v => "Violet, la couleur des suffragettes : le féminisme (" + v + ").",
      pink: v => "Rose : les droits des personnes LGBT (" + v + ").",
      green: v => "Vert : l'écologie, d'après PolitiScales (" + v + ").",
      sky: v => "Bleu ciel, celui des Nations unies : le cosmopolitisme (" + v + ").",
      orange: () => "Orange, la couleur des centristes : aucun axe ne penche nettement.",
      white: () => "Blanc : aucune lecture assez marquée pour une couleur.",
      black: v => "Noir : le libertarisme, dans la tradition anarchiste (" + v + ").",
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
      anarchy: v => "A cerclé : un libertarisme radical (" + v + ").",
      phrygian: v => "Bonnet phrygien : la révolution et la liberté (" + v + ").",
      croix: v => "Croix de guerre : le patriotisme martial, nation et ordre ensemble (" + v + ").",
      crown: v => "Couronne : le monarchisme (" + v + ").",
      fleur: v => "Fleur de lys : un monarchisme légitimiste (" + v + ")."
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
    accountMore: "Nouveau groupe, mes données",
    exportAccount: "Exporter toutes mes données",
    deleteWarn: "Votre compte, votre profil, vos réponses et vos appartenances aux groupes seront "
      + "effacés, définitivement. Confirmez avec votre mot de passe.",
    deleteAccount: "Supprimer définitivement",
    deleteConfirm: "Supprimer votre compte, votre profil et vos réponses ? C'est définitif.",
    saved: "Enregistré.", addTitleServer: "Mon résultat PolitiScales",
    apiErrors: {
      default: "Le serveur n'a pas pu traiter la demande.",
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
      group_name_length: "Donnez au groupe un nom de 1 à 60 caractères."
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
    quizWho: a => "Profil de " + a,
    backToThemes: "← Tous les thèmes", otherThemes: "Autres thèmes",
    hubEyebrow: "Questionnaire Politiskel",
    hubLead: "Le questionnaire est découpé en thèmes, que vous remplissez dans l'ordre que "
      + "vous voulez. Chacun remplace ou ajoute une lecture de votre profil ; l'économie est la "
      + "première disponible, pas la seule.",
    hubPlanned: "À venir",
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
        leadNative: "Ces questions placent votre profil sur l'axe libertaire-autoritaire, sur "
          + "l'échelle qu'utilisent les experts du CHES pour les partis.",
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
      + "traduite ici. Vous pouvez passer une question ; vos réponses restent dans ce navigateur.",
    quizStart: "Commencer", quizResume: "Reprendre", quizPrev: "← Précédent",
    quizNext: "Suivant →", quizSkip: "Passer", quizSeeResult: "Voir le résultat →",
    quizErase: "Effacer mes réponses",
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
    resultEnds: { x: ["gauche", "droite"], y: ["libertaire", "autoritaire"] },
    backToCompass: "Voir sur la boussole", quizReview: "Revoir mes réponses",
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
      y: "négatif = libertaire, positif = autoritaire, sur l'échelle galtan du CHES",
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
const LANG = (document.documentElement.lang || "fr").slice(0, 2);
const L = LOCALES[LANG] || LOCALES.fr;

