/* The questionnaire: its pages — the list of themes, one question per
   screen, the result — its fixed order, and the readings it adds to a
   profile.
   The page has one script: the web/*.js files are concatenated in the order
   web/shell.html includes them, and share its top-level scope. */

/* ----------------------------------------------------------- questionnaire --- */

/* The questionnaire is a page of its own inside this file, reached through
   the address: #questionnaire/<profile id>. Same document rather than a second
   HTML file, because the answers live in this page's localStorage, and
   browsers do not all share that storage between two file:// pages.

   Screens: an introduction, the salience question, one per item, salience
   again, the result. Items come mixed, in a fixed order (see screensFor).
   Salience comes first: asked after thirty questions on the economy, it
   would measure how much the respondent had just been made to think about
   it, not how much it weighs in their politics. It is asked once more at the
   end, so the page can show whether answering moved it.
   Items are mixed and carry no section heading, for the same reason: a
   heading such as "class", or a run of items on one subject, would tell the
   respondent what an item is for. Every answer is saved
   the moment it is given, so leaving halfway loses nothing. */
const QUIZ_ROUTE = "#questionnaire/";
const quizItems = () => PolitiQuiz.ITEMS.filter(i => i.theme === "economy");
const ALL = "all";      /* the complete questionnaire: every theme at once */
const openThemes = () => PolitiQuiz.THEMES.filter(t => !t.planned);

/* A flow is a list of screens: how much each of its themes matters, its items
   mixed in the one fixed order politi-quiz.js defines, how much each theme
   matters now. A theme's flow has one theme; the complete questionnaire has
   them all, its items mixed across themes. Same questions, same keys, so a
   theme answered on its own shows up as answered in it. */
const flowThemes = key => (key === ALL ? openThemes().map(t => t.key) : [key]);
/* a profile's score on one theme, as withQuiz() computed it */
const scoreOf = (c, key) => (key === "economy" ? c.quiz : key === "society" ? c.soc : null);

function screensFor(key) {
  const keys = flowThemes(key);
  const items = [].concat(...keys.map(PolitiQuiz.askedItems));
  return keys.map(k => ({ kind: "salience", theme: k, after: false }))
    .concat(PolitiQuiz.mixedOrder(items).map(item => ({ kind: "item", item })))
    .concat(keys.map(k => ({ kind: "salience", theme: k, after: true })));
}
const screenKey = sc => sc.kind === "item" ? sc.item.id
  : "salience." + sc.theme + (sc.after ? ".after" : "");
/* { p, id, theme, step } while the questionnaire is shown; theme null = the
   list of themes */
let quiz = null;
let quizAdvance = null;   /* pending auto-advance after an answer */

function route() {
  clearTimeout(quizAdvance);   /* an answer's auto-advance belongs to the page it was given on */
  if (SERVER.on) return serverRoute();
  const h = location.hash;
  if (h.startsWith(QUIZ_ROUTE)) {
    /* #questionnaire/<id> lists the themes, #questionnaire/<id>/<theme> runs
       one. The id is URI-encoded, so it holds no slash of its own. */
    const [rawId, themeKey] = h.slice(QUIZ_ROUTE.length).split("/");
    const id = decodeURIComponent(rawId);
    const p = profiles.find(q => idOf(q) === id);
    const theme = themeKey === ALL ? { key: ALL }
      : PolitiQuiz.THEMES.find(t => t.key === themeKey && !t.planned);
    if (p && !(SERVER.on && !p.me)) {
      const key = theme ? theme.key : null;
      if (!quiz || quiz.id !== id || quiz.theme !== key) quiz = { p, id, theme: key, step: 0 };
      $("view-main").hidden = true;
      $("view-quiz").hidden = false;
      if (key) renderQuiz(); else renderHub();
      window.scrollTo(0, 0);
      return;
    }
  }
  const wasQuiz = quiz;
  quiz = null;
  $("view-quiz").hidden = true;
  $("view-main").hidden = false;
  if (wasQuiz) {
    /* back on the compass, on the profile just completed */
    const i = profiles.findIndex(q => idOf(q) === wasQuiz.id);
    selection = i >= 0 ? { kind: "profile", i } : selection;
    render();
    $("detail-card").scrollIntoView({ block: "start" });
  }
}
window.addEventListener("hashchange", route);

/* This browser's answers first, then those imported with the page. On a
   server there is one copy, the server's: a local one could only go stale. */
function localAnswers(id) { return SERVER.on ? undefined : overlay.answers[id]; }
function answersOf(id) { return localAnswers(id) || SEED_ANSWERS[id] || {}; }

/* On a server the site has real addresses, and the questionnaire is always
   one's own; as a local file everything lives in the hash. */
const hubHref = id => (SERVER.on ? "/questionnaire" : QUIZ_ROUTE + encodeURIComponent(id));
const themeHref = (id, key) => hubHref(id) + "/" + key;
const homeHref = () => (SERVER.on ? "/boussole" : "#");

/* Goes to an address of the page, whichever kind it is. */
function go(href) {
  if (SERVER.on) { history.pushState(null, "", href); serverRoute(); }
  else location.hash = href.replace(/^#/, "");
}

/* The list of themes: what exists, what is coming, and how far this profile
   has got in each. It is the questionnaire's front page, so that the economy
   reads as a first theme rather than the whole test. */
function renderHub() {
  const root = $("view-quiz");
  root.replaceChildren();
  const saved = answersOf(quiz.id);

  const top = document.createElement("div");
  top.className = "quiz-top";
  const back = document.createElement("a");
  back.href = homeHref();
  back.textContent = L.quizBack;
  const who = document.createElement("span");
  who.className = "who";
  who.textContent = L.quizWho(quiz.p.alias);
  top.append(back, who);
  root.appendChild(top);

  const card = document.createElement("section");
  card.className = "quiz-card";
  const eb = document.createElement("p");
  eb.className = "eyebrow";
  eb.textContent = L.hubEyebrow;
  const h = document.createElement("h2");
  h.textContent = hasPolitiscales(quiz.p) ? L.quizIntroTitle(quiz.p.alias) : L.nativeTitle(quiz.p.alias);
  const lead = document.createElement("p");
  lead.className = "lead";
  lead.textContent = L.hubLead;
  card.append(eb, h, lead);

  const list = document.createElement("div");
  list.className = "theme-list";
  for (const t of [{ key: ALL }].concat(PolitiQuiz.THEMES)) {
    const copy = t.key === ALL
      ? { name: L.allName, desc: L.allDesc(openThemes().map(o => L.themes[o.key].name)) }
      : L.themes[t.key];
    const item = document.createElement("div");
    item.className = "theme-card" + (t.planned ? " planned" : "") + (t.key === ALL ? " all" : "");
    const name = document.createElement("h3");
    name.textContent = copy.name;
    const desc = document.createElement("p");
    desc.textContent = copy.desc;
    const status = document.createElement("span");
    status.className = "status";
    item.append(name, desc, status);
    if (t.planned) {
      status.textContent = L.hubPlanned;
    } else {
      const items = screensFor(t.key).filter(sc => sc.kind === "item").map(sc => sc.item);
      const done = items.filter(i => saved[i.id] !== undefined).length;
      status.textContent = L.hubProgress(done, items.length);
      const go = document.createElement("a");
      go.className = "button go " + (done === items.length ? "ghost" : "primary");
      go.href = themeHref(quiz.id, t.key);
      go.textContent = !done ? L.quizStart : done < items.length ? L.quizResume : L.quizReview;
      item.appendChild(go);
    }
    list.appendChild(item);
  }
  card.appendChild(list);
  root.appendChild(card);
}

function setAnswer(key, value) {
  if (SERVER.on) {
    const a = SEED_ANSWERS[quiz.id] || (SEED_ANSWERS[quiz.id] = {});
    a[key] = value;
    saveAnswersSoon();
    return;
  }
  /* a first local edit starts from the imported answers, not from nothing */
  const a = overlay.answers[quiz.id]
    || (overlay.answers[quiz.id] = Object.assign({}, SEED_ANSWERS[quiz.id] || {}));
  a[key] = value;
  saveOverlay();
}

function goStep(step) {
  clearTimeout(quizAdvance);
  const last = screensFor(quiz.theme).length + 1;
  quiz.step = Math.max(0, Math.min(last, step));
  renderQuiz();
  window.scrollTo(0, 0);
}

function renderQuiz() {
  const root = $("view-quiz");
  root.replaceChildren();
  const screens = screensFor(quiz.theme);
  const nQ = screens.length;
  const step = quiz.step;
  const saved = answersOf(quiz.id);

  const top = document.createElement("div");
  top.className = "quiz-top";
  const back = document.createElement("a");
  back.href = hubHref(quiz.id);
  back.textContent = L.backToThemes;
  top.appendChild(back);
  if (step >= 1 && step <= nQ) {
    const bar = document.createElement("div");
    bar.className = "progress";
    const fill = document.createElement("div");
    fill.style.width = Math.round(100 * step / nQ) + "%";
    bar.appendChild(fill);
    const cnt = document.createElement("span");
    cnt.className = "quiz-count";
    cnt.textContent = L.quizCount(step, nQ);
    top.append(bar, cnt);
  }
  const who = document.createElement("span");
  who.className = "who";
  who.textContent = L.quizWho(quiz.p.alias);
  top.appendChild(who);
  root.appendChild(top);

  const card = document.createElement("section");
  card.className = "quiz-card";
  root.appendChild(card);
  const nav = document.createElement("div");
  nav.className = "quiz-nav";
  root.appendChild(nav);
  const button = (text, cls, onClick) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = cls; b.textContent = text;
    b.addEventListener("click", onClick);
    return b;
  };
  const spacer = () => document.createElement("span");

  if (step === 0) {
    introScreen(card, screens);
    const started = screens.some(sc => saved[screenKey(sc)] !== undefined);
    nav.append(spacer(), button(started ? L.quizResume : L.quizStart, "primary", () => goStep(1)));
    return;
  }
  if (step === nQ + 1) {
    resultScreen(card, nav, button, screens);
    return;
  }

  const sc = screens[step - 1];
  if (sc.kind === "salience") {
    /* The closing one is not pre-filled, and the first answer is not
       recalled: shown it, most people repeat it to stay consistent, and
       nothing would be measured. */
    const src = document.createElement("p");
    src.className = "q-src";
    src.textContent = L.quizSalienceSrc;
    const copy = L.themes[sc.theme];
    if (quiz.theme === ALL) {
      const eb = document.createElement("p");
      eb.className = "eyebrow";
      eb.textContent = L.themes[sc.theme].name;
      card.appendChild(eb);
    }
    questionScreen(card, { key: screenKey(sc), scale: PolitiQuiz.SCALES.salience,
                           text: sc.after ? copy.salienceAfter : copy.salience,
                           source: src }, saved[screenKey(sc)]);
  } else {
    const item = sc.item;
    questionScreen(card, {
      key: item.id, scale: PolitiQuiz.SCALES[item.scale], text: item.fr, stem: item.ask,
      left: item.left, right: item.right, note: item.note,
      source: sourceLine(item.src, item.translated)
    }, saved[item.id]);
  }

  nav.append(
    button(L.quizPrev, "ghost", () => goStep(step - 1)),
    button(L.quizSkip, "skip", () => goStep(step + 1)),
    button(step === nQ ? L.quizSeeResult : L.quizNext, "primary", () => goStep(step + 1)));
  const keys = document.createElement("p");
  keys.className = "quiz-keys";
  keys.textContent = L.quizKeys;
  root.appendChild(keys);
}

function introScreen(card, screens) {
  const native = !hasPolitiscales(quiz.p);
  const all = quiz.theme === ALL;
  const eb = document.createElement("p");
  eb.className = "eyebrow";
  eb.textContent = L.hubEyebrow + " · " + (all ? L.allName : L.themes[quiz.theme].name);
  const h = document.createElement("h2");
  h.textContent = native ? L.nativeTitle(quiz.p.alias) : L.quizIntroTitle(quiz.p.alias);
  const lead = document.createElement("p");
  lead.className = "lead";
  lead.textContent = all ? L.allLead(openThemes().length, PolitiQuiz.THEMES.length)
                   : native ? L.themes[quiz.theme].leadNative : L.themes[quiz.theme].lead;
  const hint = document.createElement("p");
  hint.className = "hint";
  hint.textContent = L.quizHint;
  const meta = document.createElement("p");
  meta.className = "q-src";
  meta.textContent = L.quizIntroMeta(screens.filter(sc => sc.kind === "item").length,
                                     screens.filter(sc => sc.kind === "salience").length / 2);
  card.append(eb, h, lead, hint, meta);
}

/* One question. A categorical scale is a column of full-width choices; a
   bipolar one shows its two statements side by side over a numbered ladder,
   numbered as the survey's card was (1-10, or 0-10). */
function questionScreen(card, q, was) {
  if (q.stem) {
    const st = document.createElement("p");
    st.className = "stem";
    st.textContent = q.stem;
    card.appendChild(st);
  }
  if (q.text) {
    const h = document.createElement("h2");
    h.textContent = q.text;
    card.appendChild(h);
  }
  const group = document.createElement("div");
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-label", q.text || (q.left + " / " + q.right));

  const choice = (value, label, key, cls) => {
    const lab = document.createElement("label");
    lab.className = "choice" + (cls ? " " + cls : "");
    const r = document.createElement("input");
    r.type = "radio"; r.name = "q"; r.value = String(value);
    if (was === value) r.checked = true;
    r.addEventListener("change", () => {
      setAnswer(q.key, value);
      clearTimeout(quizAdvance);
      /* route() cancels it on any navigation; the check covers the rest */
      quizAdvance = setTimeout(() => { if (quiz && quiz.theme) goStep(quiz.step + 1); }, 260);
    });
    lab.appendChild(r);
    if (key !== null) {
      const k = document.createElement("span");
      k.className = "key";
      k.textContent = key;
      lab.appendChild(k);
    }
    lab.appendChild(document.createTextNode(label));
    lab.dataset.key = key === null ? "" : key;
    return lab;
  };

  if (q.scale.bipolar) {
    const first = q.scale.values.length === 11 ? 0 : 1;
    const last = first + q.scale.values.length - 1;
    const poles = document.createElement("div");
    poles.className = "poles";
    for (const [text, n, cls] of [[q.left, first, "pole"], [q.right, last, "pole r"]]) {
      const d = document.createElement("div");
      d.className = cls;
      const sm = document.createElement("small");
      sm.textContent = L.quizPoleFull(n);
      d.append(sm, document.createTextNode(text));
      poles.appendChild(d);
    }
    card.appendChild(poles);
    const ladder = document.createElement("div");
    ladder.className = "ladder";
    q.scale.values.forEach((_, k) => {
      const n = first + k;
      const lab = choice(k, String(n), null);
      lab.dataset.key = n === 10 ? "0" : String(n);   /* the 0 key stands for 10 on a 1-10 card */
      if (first === 0 && n === 10) lab.dataset.key = "";
      ladder.appendChild(lab);
    });
    group.appendChild(ladder);
  } else {
    const col = document.createElement("div");
    col.className = "choices";
    q.scale.fr.forEach((t, k) => col.appendChild(choice(k, t, String(k + 1))));
    group.appendChild(col);
  }
  if (q.scale.dk) {
    const col = document.createElement("div");
    col.className = "choices";
    col.appendChild(choice("dk", q.scale.dk, null, "dk"));
    group.appendChild(col);
  }
  card.appendChild(group);

  if (q.note) {
    const n = document.createElement("p");
    n.className = "q-note";
    n.textContent = q.note;
    card.appendChild(n);
  }
  card.appendChild(q.source);
}

function resultScreen(card, nav, button, screens) {
  const c = coords(quiz.p);
  const eb = document.createElement("p");
  eb.className = "eyebrow";
  eb.textContent = L.resultEyebrow(quiz.theme === ALL ? L.allName : L.themes[quiz.theme].name);
  const h = document.createElement("h2");
  h.textContent = c.native ? L.resultTitleNative : L.resultTitle;
  card.append(eb, h);

  const keys = flowThemes(quiz.theme);
  const cs = getComputedStyle(card);
  const inner = card.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  for (const k of keys) {
    const axis = PolitiQuiz.THEMES.find(t => t.key === k).axis;
    const score = scoreOf(c, k);
    if (keys.length > 1) {
      const h3 = document.createElement("p");
      h3.className = "eyebrow";
      h3.textContent = L.themes[k].name;
      card.appendChild(h3);
    }
    if (!score || score[axis] === null) {
      const p = document.createElement("p");
      p.className = "lead";
      p.textContent = L.resultNoAxis(L.themes[k].name, c.native);
      card.appendChild(p);
    } else {
      card.appendChild(journeyStrip(c, inner, axis));
    }
  }
  if (c.quiz) {
    const r = readingsEl(c, keys);
    r.className = "readings";
    r.style.borderTop = "none";
    card.appendChild(r);
  }

  /* erases what this flow asked, not the answers to other themes */
  const erase = button(L.quizErase, "skip", () => {
    const a = Object.assign({}, answersOf(quiz.id));
    for (const sc of screens) delete a[screenKey(sc)];
    if (SERVER.on) {
      SEED_ANSWERS[quiz.id] = a;
      saveAnswersSoon();
      goStep(0);
      return;
    }
    /* An empty local entry is kept when answers were imported: removing it
       would bring the imported ones straight back. */
    if (Object.keys(a).length || SEED_ANSWERS[quiz.id]) overlay.answers[quiz.id] = a;
    else delete overlay.answers[quiz.id];
    saveOverlay();
    goStep(0);
  });
  const right = document.createElement("span");
  right.style.display = "flex";
  right.style.flexWrap = "wrap";
  right.style.justifyContent = "flex-end";
  right.style.gap = "10px";
  const hint = document.createElement("p");
  hint.className = "hint";
  hint.style.marginTop = "14px";
  hint.textContent = L.exportHint;
  card.appendChild(hint);
  if (!SERVER.on) right.appendChild(exportButton(quiz.p, "ghost"));
  right.append(
               button(L.quizReview, "ghost", () => goStep(1)),
               button(L.otherThemes, "ghost", () => go(hubHref(quiz.id))),
               button(L.backToCompass, "primary", () => go(homeHref())));
  nav.append(erase, right);
}

/* The journey along one axis, against the reference parties: the axis a theme
   replaced. Only the two nearest references are named, below the axis; the
   rest keep their name in a tooltip. Labels that would collide are moved to a
   second row. */
function journeyStrip(c, width, axis) {
  /* drawn at the card's real width, so its text keeps its size on a phone
     instead of shrinking with a fixed viewBox */
  const W = Math.round(Math.max(300, Math.min(700, width || 640)));
  const H = 128, pad = 28, axisY = 70;
  const sx = v => pad + (v + 100) / 200 * (W - 2 * pad);
  const anchorAt = x => (x < pad + 60 ? "start" : x > W - pad - 60 ? "end" : "middle");
  const start = c.from;
  const svg = el("svg", { class: "journey-strip", viewBox: "0 0 " + W + " " + H, role: "img",
                          "aria-label": (start ? L.resultWas + " " + signed(start[axis]) + " → " : "")
                                        + L.resultNow + " " + signed(c[axis]) });
  svg.appendChild(el("line", { class: "axis", x1: pad, y1: axisY, x2: W - pad, y2: axisY }));
  const ends = L.resultEnds[axis];
  for (const [v, t, anchor] of [[-100, ends[0], "start"], [100, ends[1], "end"]]) {
    const e = el("text", { class: "end", x: sx(v), y: H - 4, "text-anchor": anchor });
    e.textContent = t;
    svg.appendChild(e);
  }

  /* The nearest reference is read on both axes when both are known; a
     profile started here with only one axis answered is read on that one. */
  const byAxis = v => country.parties.reduce((b, r) =>
    (!b || Math.abs(r[axis] - v) < Math.abs(b[axis] - v) ? r : b), null);
  const both = c.x !== null && c.y !== null;
  const now = both ? nearestBase(c.x, c.y) : { ref: byAxis(c[axis]) };
  const was = start ? nearestBase(start.x, start.y) : now;
  for (const r of country.parties) {
    const x = sx(r[axis]);
    const g = el("g", {});
    g.appendChild(el("path", { class: "ref",
      d: "M " + x + " " + (axisY - 4) + " L " + (x + 4) + " " + axisY + " L " + x + " "
         + (axisY + 4) + " L " + (x - 4) + " " + axisY + " Z" }));
    const title = el("title", {});
    title.textContent = r.name + " (" + signed(r[axis]) + ")";
    g.appendChild(title);
    svg.appendChild(g);
  }
  /* the two named references: a second row when they would overlap */
  const named = [was.ref, now.ref].filter((r, i, a) => a.indexOf(r) === i);
  const nameW = named.map(r => r.name.length * 5.6);
  named.forEach((r, i) => {
    const x = sx(r[axis]);
    const clash = i === 1 && Math.abs(x - sx(named[0][axis])) < (nameW[0] + nameW[1]) / 2 + 10;
    const t = el("text", { class: "ref-name", x, y: axisY + (clash ? 34 : 20),
                           "text-anchor": anchorAt(x) });
    t.textContent = r.name;
    svg.appendChild(t);
  });

  const tx = sx(c[axis]), fx = start ? sx(start[axis]) : tx;
  if (start && Math.abs(tx - fx) > 12) {
    const dir = Math.sign(tx - fx);
    svg.appendChild(el("path", { class: "arrow",
      d: "M " + fx + " " + (axisY - 10) + " Q " + (fx + tx) / 2 + " " + (axisY - 40) + " "
         + (tx - dir * 6) + " " + (axisY - 12) }));
    svg.appendChild(el("path", { class: "head",
      d: "M " + tx + " " + (axisY - 8) + " l " + (-dir * 9) + " -7 l " + (dir * 1) + " 10 Z" }));
  }
  if (start) svg.appendChild(el("circle", { class: "trail-ghost", cx: fx, cy: axisY, r: 6 }));
  svg.appendChild(el("circle", { class: "dot", cx: tx, cy: axisY, r: 7 }));

  /* captions above the axis: the new one lifted when the two are close */
  const capW = el("text", { class: "cap was", x: fx, y: axisY - 16, "text-anchor": anchorAt(fx) });
  capW.textContent = start ? L.resultWas + " " + signed(start[axis]) : "";
  const capN = el("text", { class: "cap", x: tx, y: axisY - 16, "text-anchor": anchorAt(tx) });
  capN.textContent = L.resultNow + " " + signed(c[axis]);
  if (start && Math.abs(tx - fx) < 150) capN.setAttribute("y", axisY - 48);
  if (W < 460) svg.style.maxWidth = W + "px";
  svg.append(capW, capN);
  return svg;
}

function sourceLine(src, translated) {
  const p = document.createElement("p");
  p.className = "q-src";
  const a = document.createElement("a");
  a.href = src.url; a.target = "_blank"; a.rel = "noopener";
  a.textContent = [src.survey, src.wave, src.variable].filter(Boolean).join(" · ");
  p.appendChild(a);
  if (translated) {
    const t = document.createElement("span");
    t.className = "tr";
    t.textContent = " · " + L.quizTranslated[translated];
    p.appendChild(t);
  }
  return p;
}

/* Keyboard, on the questionnaire only: digits answer, arrows move. */
document.addEventListener("keydown", e => {
  /* inside a flow only: the list of themes has no steps to move through */
  if (!quiz || !quiz.theme || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === "ArrowRight" || (e.key === "Enter" && !e.target.closest("button, a"))) {
    e.preventDefault(); goStep(quiz.step + 1);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault(); goStep(quiz.step - 1);
  } else if (/^[0-9]$/.test(e.key)) {
    const lab = document.querySelector('#view-quiz .choice[data-key="' + e.key + '"]');
    if (lab) { const r = lab.querySelector("input"); r.checked = true; r.dispatchEvent(new Event("change")); }
  }
});

