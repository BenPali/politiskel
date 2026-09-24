/* Server mode: when the page is served by server/, accounts, groups and the
   site's own pages and router. None of it runs from a local file.
   The page has one script: the web/*.js files are concatenated in the order
   web/shell.html includes them, and share its top-level scope. */

/* ---------------------------------------------------------------- server --- */

/* Served by server/, the page is a small site: real addresses (/connexion,
   /boussole, /questionnaire, /groupes, /compte, /rejoindre/<code>), tabs in
   the header, and one view per address, all routed here. Opened as a local
   file none of this runs. */

const GROUP_KEY = "politicompass.group.v1";
const JOIN_KEY = "politiskel.join";

/* Never rejects: a network failure comes back as { ok: false, status: 0 },
   so a dropped connection cannot abort a caller half-way (a group switch,
   a sign-out) or lose what it was sending. */
async function api(method, path, body) {
  let res;
  try {
    res = await fetch(path, {
      method, credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (_) {
    return { ok: false, status: 0, data: { error: "network" } };
  }
  let data = null;
  try { data = await res.json(); } catch (_) { /* 204, or not JSON */ }
  return { ok: res.ok, status: res.status, data };
}
const apiError = r => L.apiErrors[r.data && r.data.error] || L.apiErrors.default;

/* DOM built with properties and text only: every string from the server —
   pseudonyms, group names — goes in as text, never as markup. */
function h(tag, props, ...kids) {
  const n = document.createElement(tag);
  Object.assign(n, props || {});
  for (const k of kids) if (k !== null && k !== undefined && k !== false) n.append(k);
  return n;
}
const store = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (_) { /* quota, private browsing */ } };
const stash = (k, v) => { try { v === null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (_) { /* private browsing */ } };
const unstash = k => { try { return sessionStorage.getItem(k); } catch (_) { return null; } };

/* Asks once, over http(s) only. Anything but our backend's answer — a 404
   from a plain static host, a network error — leaves the page local. */
async function detectServer() {
  if (!/^https?:$/.test(location.protocol)) return;
  const r = await api("GET", "/api/me");
  const ours = r.status === 200 ? r.data && typeof r.data.username === "string"
             : r.status === 401 && r.data && r.data.error === "not_signed_in";
  if (!ours) return;
  const cfg = await api("GET", "/api/config");
  /* a closed site still lets its very first account in */
  SERVER.signup = cfg.ok && cfg.data && cfg.data.signup === "invite" && !cfg.data.empty ? "invite" : "open";
  /* A guest stays a local page: no account, nothing sent, every answer kept
     in this browser, as on a copy of the file. */
  if (r.status !== 200 && location.pathname.replace(/\/+$/, "") === "/essai") return enterGuest();
  SERVER.on = true;
  SERVER.me = r.status === 200 ? r.data : null;
  document.body.classList.add("server-mode");
  $("foot-privacy").textContent = L.footPrivacyServer;
  /* The PolitiScales form belongs to the account page on a server. */
  $("add-card-title").textContent = L.addTitleServer;
  $("view-account").appendChild(document.querySelector(".add-card"));
  /* Links inside the site move without reloading; the back button works. */
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    const href = a.getAttribute("href");
    if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/api/")) return;
    e.preventDefault();
    go(href);
  });
  window.addEventListener("popstate", serverRoute);
  if (SERVER.me) await chooseGroup();
  await loadGroup();
  serverRoute();
}

/* The local page, on a server, with a way back to the site. Its links load
   the site afresh, so the server mode starts from a clean page. */
function enterGuest() {
  SERVER.guest = true;
  const box = $("account");
  box.className = "account guest-bar";
  box.hidden = false;
  box.replaceChildren(h("p", { textContent: L.guestBanner }),
    h("div", { className: "actions" },
      h("a", { href: "/connexion?inscription", className: "button primary", textContent: L.guestSignUp }),
      h("a", { href: "/connexion", className: "button ghost", textContent: L.guestSignIn })));
}

/* The answers given as a guest in this browser, the fullest set: offered at
   sign-up, so trying the site first costs nothing. */
function guestAnswers() {
  const sets = Object.values((overlay && overlay.answers) || {})
    .map(a => Object.fromEntries(Object.entries(a || {}).filter(([k]) =>
      PolitiQuiz.itemById(k) || k.startsWith("salience."))));
  return sets.sort((a, b) => Object.keys(b).length - Object.keys(a).length)[0] || {};
}

async function refreshMe() {
  const r = await api("GET", "/api/me");
  SERVER.me = r.ok ? r.data : null;
}

/* The group on show: the one last chosen, else the first; null means one's
   own profile alone. */
async function chooseGroup(id) {
  let want = id;
  if (want === undefined) {
    try { want = Number(localStorage.getItem(GROUP_KEY)); } catch (_) { want = null; }
  }
  const groups = SERVER.me ? SERVER.me.groups : [];
  SERVER.group = groups.find(g => g.id === want) || (id === null ? null : groups[0]) || null;
  store(GROUP_KEY, SERVER.group ? String(SERVER.group.id) : null);
}

/* The profiles on show: the chosen group's, or one's own alone. It reloads
   data and redraws the compass, and never changes page: the caller decides
   where to go next, or two navigations would race. */
async function loadGroup() {
  /* Two switches in a row start two loads: only the latest may draw, or a
     slow answer for the first group would show under the second's name. */
  const seq = SERVER.loadSeq = (SERVER.loadSeq || 0) + 1;
  await flushAnswers();   /* an answer still waiting must reach the server first */
  let list = [];
  if (SERVER.me && SERVER.group) {
    const r = await api("GET", "/api/groups/" + SERVER.group.id + "/profiles");
    if (seq !== SERVER.loadSeq) return;
    list = r.ok ? r.data : [];
  } else if (SERVER.me) {
    list = [{ username: SERVER.me.username, me: true, flag: SERVER.me.profile.flag,
              politiscales: SERVER.me.profile.politiscales, answers: SERVER.me.profile.answers }];
  }
  SEED.length = 0;
  for (const k of Object.keys(SEED_ANSWERS)) delete SEED_ANSWERS[k];
  for (const m of list) {
    const p = Object.assign({ alias: m.username, source: "user:" + m.username, me: !!m.me,
                              flag: m.flag || null, slogan: null }, m.politiscales || {});
    SEED.push(p);
    if (m.answers && Object.keys(m.answers).length) SEED_ANSWERS[idOf(p)] = m.answers;
  }
  selection = null;
  rebuild();
  render();
}

const myId = () => SERVER.me ? "user:" + SERVER.me.username : null;

/* Saved half a second after the last answer, so a run of answers is one
   request. What is sent is the answers as they stand when the save is
   scheduled, not when it fires: in between, loadGroup() may have reloaded
   them from the server, and the older copy would overwrite the answer just
   given. */
function saveAnswersSoon() {
  clearTimeout(SERVER.saving);
  SERVER.pending = Object.assign({}, SEED_ANSWERS[myId()] || {});
  SERVER.saving = setTimeout(flushAnswers, 500);
}

/* Sends what is pending, and in every case returns only once no save is in
   flight: a caller about to reload the list from the server must not read it
   while an answer is still on its way there. Saves go one after another. */
async function flushAnswers() {
  clearTimeout(SERVER.saving);
  while (SERVER.inflight) await SERVER.inflight;
  const answers = SERVER.pending;
  if (!answers || !SERVER.me) return;
  SERVER.pending = null;
  SERVER.inflight = (async () => {
    const r = await api("PUT", "/api/me/profile", { answers });
    SERVER.status = r.ok ? L.saved : apiError(r);
    if (r.ok && SERVER.me) SERVER.me.profile = r.data;
    /* Not sent: keep the answers, unless newer ones are already waiting,
       and try again shortly. */
    if (r.status === 0) {
      if (!SERVER.pending) SERVER.pending = answers;
      clearTimeout(SERVER.saving);
      SERVER.saving = setTimeout(flushAnswers, 5000);
    }
  })();
  try { await SERVER.inflight; } finally { SERVER.inflight = null; }
}

async function savePolitiscales(p) {
  const values = {};
  for (const a of AXES) for (const k of [a.neg[0], a.pos[0]]) if (Number.isFinite(p[k])) values[k] = p[k];
  /* The flag follows only when the values are still the screenshot's (readForm
     keeps it then): a profile typed by hand must not carry a flag it no
     longer matches. */
  const r = await api("PUT", "/api/me/profile", { politiscales: values, flag: p.flag || null });
  if (!r.ok) { $("form-error").textContent = apiError(r); $("form-error").hidden = false; return; }
  SERVER.me.profile = r.data;
  SERVER.status = L.savedPolitiscales;
  $("add-form").reset();
  pendingCapture = null;
  captureFeedback(null, null);
  await loadGroup();
  renderAccountPage();
}

async function signedOut() {
  await flushAnswers();
  SERVER.me = null;
  SERVER.group = null;
  SERVER.invite = null;
  await loadGroup();
  go("/connexion");
}

/* ----------------------------------------------------------- the router --- */

const SITE_VIEWS = ["view-main", "view-quiz", "view-login", "view-groups", "view-account"];
function show(view, title) {
  for (const v of SITE_VIEWS) $(v).hidden = v !== view;
  document.title = title ? title + " · Politiskel" : "Politiskel";
}

async function serverRoute() {
  clearTimeout(quizAdvance);
  const path = location.pathname.replace(/\/+$/, "") || "/";
  renderTabs(path);

  if (path.startsWith("/rejoindre/")) {
    const raw = path.slice("/rejoindre/".length);
    let code;
    try { code = decodeURIComponent(raw); } catch (_) { code = raw; }   /* a mangled link: the server will say no such invite */
    if (!SERVER.me) {
      stash(JOIN_KEY, code);
      history.replaceState(null, "", "/connexion");
      return serverRoute();
    }
    return renderInvite(code);
  }
  if (!SERVER.me) {
    if (path !== "/connexion") history.replaceState(null, "", "/connexion");
    renderTabs("/connexion");
    return renderLogin();
  }
  if (path === "/connexion" || path === "/") {
    const code = unstash(JOIN_KEY);
    stash(JOIN_KEY, null);
    history.replaceState(null, "", code ? "/rejoindre/" + encodeURIComponent(code) : "/boussole");
    return serverRoute();
  }
  if (path === "/groupes") return renderGroups();
  if (path === "/compte") return renderAccountPage();
  if (path.startsWith("/questionnaire")) return routeQuiz(path.slice("/questionnaire".length));
  if (path === "/boussole") return showCompass();
  history.replaceState(null, "", "/boussole");
  return serverRoute();
}

function renderTabs(path) {
  const nav = $("tabs");
  nav.replaceChildren();
  nav.hidden = !SERVER.on;
  const tab = (href, text) => h("a", { href, textContent: text,
    className: path === href || path.startsWith(href + "/") ? "on" : "" });
  if (!SERVER.me) {
    nav.append(tab("/connexion", L.signInTitle));
    return;
  }
  nav.append(tab("/boussole", L.tabCompass), tab("/questionnaire", L.tabQuiz),
             tab("/groupes", L.tabGroups), tab("/compte", L.tabAccount),
             h("span", { className: "me", textContent: SERVER.me.username }));
}

/* The compass, with the chosen group, and the group bar above it. */
function showCompass() {
  const wasQuiz = quiz;
  quiz = null;
  show("view-main", L.tabCompass);
  renderGroupBar();
  if (wasQuiz) {
    const i = profiles.findIndex(q => q.me);
    selection = i >= 0 ? { kind: "profile", i } : selection;
    render();
    $("detail-card").scrollIntoView({ block: "start" });
  }
}

/* The questionnaire is always one's own on a server: /questionnaire lists the
   themes, /questionnaire/<theme> runs one. */
function routeQuiz(rest) {
  const p = profiles.find(q => q.me);
  if (!p) return go("/boussole");
  const themeKey = rest.replace(/^\//, "");
  const theme = !themeKey ? null : themeKey === ALL ? { key: ALL }
    : PolitiQuiz.THEMES.find(t => t.key === themeKey && !t.planned);
  const key = theme ? theme.key : null;
  const id = idOf(p);
  if (!quiz || quiz.id !== id || quiz.theme !== key) quiz = { p, id, theme: key, step: 0 };
  show("view-quiz", L.tabQuiz);
  if (key) renderQuiz(); else renderHub();
  window.scrollTo(0, 0);
}

/* ------------------------------------------------------------ the pages --- */

function renderGroupBar() {
  const box = $("account");
  box.replaceChildren();
  box.hidden = false;
  box.className = "account group-head";
  const me = SERVER.me;
  const g = SERVER.group;

  /* A menu rather than a picker: the group on show is the title, so the
     select only lists where one can go, and snaps back to its prompt. */
  const others = me.groups.filter(x => !g || x.id !== g.id);
  const menu = h("select", { ariaLabel: L.groupSwitch });
  menu.append(h("option", { value: "", textContent: L.groupSwitch, disabled: true, selected: true, hidden: true }));
  for (const x of others) menu.append(h("option", { value: String(x.id), textContent: x.name + " (" + x.members + ")" }));
  if (g) menu.append(h("option", { value: "alone", textContent: L.groupNone }));
  menu.addEventListener("change", async () => {
    const v = menu.value;
    menu.disabled = true;
    await chooseGroup(v === "alone" ? null : Number(v));
    await loadGroup();
    renderGroupBar();
  });

  const actions = h("div", { className: "group-actions" },
    menu.options.length > 1 ? menu : null);
  if (g) {
    const link = location.origin + "/rejoindre/" + g.invite;
    const copy = h("button", { type: "button", className: "ghost", textContent: L.inviteShort, title: L.invite });
    copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(link); copy.textContent = L.inviteCopiedShort; }
      catch (_) { prompt(L.invite, link); }
    });
    actions.append(copy);
  }
  actions.append(h("a", { href: "/groupes", className: "button ghost", textContent: L.manageGroupsShort }));

  /* who is on the compass: a chip each, which selects that profile */
  const members = h("div", { className: "group-members" });
  profiles.forEach((p, i) => {
    const chip = h("button", { type: "button", className: "member" + (p.me ? " me" : ""),
                               title: L.memberShow(p.alias) });
    chip.append(flagEl(p, ""), h("span", { textContent: p.alias + (p.me ? " (" + L.you + ")" : "") }));
    chip.addEventListener("click", () => {
      select("profile", i);
      $("detail-card").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    members.append(chip);
  });

  const title = h("div", { className: "group-title" },
    h("span", { className: "eyebrow", textContent: L.groupShown }),
    h("h2", { textContent: g ? g.name : L.groupNone }),
    h("span", { className: "count", textContent: g ? L.memberCount(g.members)
      : me.groups.length ? L.groupAloneShort : L.groupAloneLead }));
  box.append(h("div", { className: "group-top" }, title, actions));
  if (g) box.append(members);
  if (SERVER.status) box.append(h("p", { className: "status", textContent: SERVER.status }));
  SERVER.status = "";   /* said once, not left standing */
}

function errorLine() {
  const p = h("p", { className: "error", hidden: true });
  p.fail = r => { p.textContent = typeof r === "string" ? r : apiError(r); p.hidden = false; };
  return p;
}

function renderLogin() {
  show("view-login", L.signInTitle);
  const root = $("view-login");
  root.replaceChildren();
  const mode = root.dataset.mode || (location.search.includes("inscription") ? "up" : "in");
  const card = h("section", { className: "card login-card" });
  const switchIn = h("button", { type: "button", textContent: L.signInTitle, className: mode === "in" ? "on" : "" });
  const switchUp = h("button", { type: "button", textContent: L.registerTitle, className: mode === "up" ? "on" : "" });
  switchIn.addEventListener("click", () => { root.dataset.mode = "in"; renderLogin(); });
  switchUp.addEventListener("click", () => { root.dataset.mode = "up"; renderLogin(); });
  card.append(h("div", { className: "switch" }, switchIn, switchUp));
  if (unstash(JOIN_KEY)) card.append(h("p", { className: "status", textContent: L.joinPending }));

  const err = errorLine();
  const user = h("input", { type: "text", placeholder: L.username, autocomplete: "username", maxLength: 24, required: true });
  if (mode === "in") {
    const pass = h("input", { type: "password", placeholder: L.password, autocomplete: "current-password", required: true });
    const form = h("form", {}, user, pass, h("button", { type: "submit", className: "primary", textContent: L.signIn }), err);
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const r = await api("POST", "/api/login", { username: user.value, password: pass.value });
      if (!r.ok) return err.fail(r);
      await refreshMe();
      await chooseGroup();
      await loadGroup();
      serverRoute();   /* from /connexion: to a pending invitation, else the compass */
    });
    card.append(form);
  } else if (SERVER.signup === "invite" && !unstash(JOIN_KEY)) {
    card.append(h("p", { className: "lead", textContent: L.signupInviteOnly }));
  } else {
    const pass = h("input", { type: "password", placeholder: L.passwordNew, autocomplete: "new-password", required: true });
    const consent = h("input", { type: "checkbox" });
    const kept = guestAnswers();
    const nKept = Object.keys(kept).length;
    const carry = h("input", { type: "checkbox", checked: true });
    const form = h("form", {}, user, pass,
      h("label", { className: "consent" }, consent, h("span", { textContent: L.consent })),
      nKept ? h("label", { className: "consent" }, carry, h("span", { textContent: L.guestCarry(nKept) })) : null,
      h("button", { type: "submit", className: "primary", textContent: L.register }), err);
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (!consent.checked) return err.fail(L.apiErrors.consent_required);
      const r = await api("POST", "/api/register", { username: user.value, password: pass.value, consent: true,
                                                     invite: unstash(JOIN_KEY) || undefined });
      if (!r.ok) return err.fail(r);
      if (nKept && carry.checked) await api("PUT", "/api/me/profile", { answers: kept });
      await refreshMe();
      await chooseGroup();
      await loadGroup();
      serverRoute();
    });
    card.append(form, h("p", { className: "note", textContent: L.serverNote }));
  }
  const guest = h("button", { type: "button", className: "ghost", textContent: L.guestTry });
  guest.addEventListener("click", () => { location.href = "/essai"; });
  root.append(h("h2", { textContent: L.welcomeTitle }), h("p", { className: "lead", textContent: L.welcomeLead }), card,
    h("div", { className: "guest-offer" }, guest, h("p", { className: "note", textContent: L.guestNote })));
  user.focus();
}

/* An invitation is read, not followed: joining shows one's answers to every
   member, so the page names the group and asks first. */
async function renderInvite(code) {
  show("view-groups", L.tabGroups);
  const root = $("view-groups");
  root.replaceChildren(h("p", { className: "status", textContent: L.loading }));
  const r = await api("GET", "/api/invites/" + encodeURIComponent(code));
  root.replaceChildren();
  root.append(h("h2", { textContent: L.inviteTitle }));
  if (!r.ok) {
    root.append(h("p", { className: "lead", textContent: apiError(r) }),
                h("a", { href: "/groupes", className: "button ghost", textContent: L.backToGroups }));
    return;
  }
  const g = r.data;
  if (g.member) {
    await chooseGroup(g.id);
    await loadGroup();
    SERVER.status = L.alreadyMember(g.name);
    return go("/groupes");
  }
  const err = errorLine();
  const yes = h("button", { type: "button", className: "primary", textContent: L.inviteAccept });
  const no = h("a", { href: "/groupes", className: "button ghost", textContent: L.inviteDecline });
  yes.addEventListener("click", async () => {
    const j = await api("POST", "/api/groups/join", { code });
    if (!j.ok) return err.fail(j);
    await refreshMe();
    await chooseGroup(j.data.id);
    SERVER.status = L.joined(j.data.name);
    await loadGroup();
    go("/boussole");
  });
  root.append(h("section", { className: "card invite-card" },
    h("h3", { textContent: g.name }),
    h("p", { className: "members", textContent: L.memberCount(g.members) }),
    h("p", { textContent: L.inviteWarn }),
    h("div", { className: "actions" }, yes, no), err));
}

async function renderGroups() {
  show("view-groups", L.tabGroups);
  const root = $("view-groups");
  const me = SERVER.me;
  root.replaceChildren(h("h2", { textContent: L.tabGroups }),
    h("p", { className: "lead", textContent: L.groupsLead }));
  if (SERVER.status) { root.append(h("p", { className: "status", textContent: SERVER.status })); SERVER.status = ""; }

  /* one's groups, with who is in them */
  const lists = await Promise.all(me.groups.map(g => api("GET", "/api/groups/" + g.id + "/profiles")));
  if (!me.groups.length) root.append(h("section", { className: "card" }, h("p", { textContent: L.noGroups })));
  me.groups.forEach((g, i) => {
    const names = lists[i].ok ? lists[i].data.map(m => m.username + (m.me ? " (" + L.you + ")" : "")) : [];
    const link = location.origin + "/rejoindre/" + g.invite;
    const linkLine = h("p", { className: "link", textContent: link });
    const err = errorLine();
    const view = h("button", { type: "button", className: "primary", textContent: L.seeOnCompass });
    view.addEventListener("click", async () => { await chooseGroup(g.id); await loadGroup(); go("/boussole"); });
    const copy = h("button", { type: "button", className: "ghost", textContent: L.invite });
    copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(link); copy.textContent = L.inviteCopiedShort; }
      catch (_) { linkLine.style.color = "var(--text)"; }
    });
    const leave = h("button", { type: "button", className: "ghost", textContent: L.leave });
    leave.addEventListener("click", async () => {
      if (!confirm(L.leaveConfirm(g.name))) return;
      const r = await api("POST", "/api/groups/" + g.id + "/leave");
      if (!r.ok) return err.fail(r);
      await refreshMe();
      await chooseGroup();
      await loadGroup();
      renderGroups();
    });
    const members = lists[i].ok ? lists[i].data : [];
    const owner = members.find(m => m.owner);
    const redo = async () => { await refreshMe(); await chooseGroup(SERVER.group ? SERVER.group.id : undefined); await loadGroup(); renderGroups(); };
    const act = async (method, path, body, done) => {
      const r = await api(method, path, body);
      if (!r.ok) return err.fail(r);
      if (done) SERVER.status = done;
      await redo();
    };
    let manage = null;
    if (g.owner) {
      const fresh = h("button", { type: "button", className: "ghost", textContent: L.ownerNewLink });
      fresh.addEventListener("click", () => confirm(L.ownerNewLinkConfirm)
        && act("POST", "/api/groups/" + g.id + "/invite", null, L.ownerNewLinkDone));
      const rows = members.filter(m => !m.me).map(m => {
        const out = h("button", { type: "button", className: "ghost", textContent: L.ownerRemove });
        out.addEventListener("click", () => confirm(L.ownerRemoveConfirm(m.username, g.name))
          && act("POST", "/api/groups/" + g.id + "/remove", { username: m.username }));
        const give = h("button", { type: "button", className: "ghost", textContent: L.ownerHandOver });
        give.addEventListener("click", () => confirm(L.ownerHandOverConfirm(m.username, g.name))
          && act("POST", "/api/groups/" + g.id + "/owner", { username: m.username }));
        return h("li", {}, h("span", { textContent: m.username }), h("span", { className: "actions" }, give, out));
      });
      const drop = h("button", { type: "button", className: "ghost danger", textContent: L.ownerDelete });
      drop.addEventListener("click", () => confirm(L.ownerDeleteConfirm(g.name))
        && act("DELETE", "/api/groups/" + g.id, null));
      manage = h("details", { className: "owner-tools" }, h("summary", { textContent: L.ownerManage }),
        h("div", { className: "actions" }, fresh, drop),
        rows.length ? h("ul", { className: "member-rows" }, ...rows) : null,
        h("p", { className: "note", textContent: L.ownerNote }));
    }
    root.append(h("section", { className: "card group-card" },
      h("h3", { textContent: g.name }),
      h("p", { className: "members", textContent: L.memberCount(g.members) + (names.length ? " : " + names.join(", ") : "") }),
      h("p", { className: "note", textContent: g.owner ? L.ownerYou : owner ? L.ownerIs(owner.username) : "" }),
      h("div", { className: "actions" }, view, copy, leave), linkLine, manage, err));
  });

  /* create one */
  const gname = h("input", { type: "text", placeholder: L.groupName, maxLength: 60, required: true });
  const errC = errorLine();
  const create = h("form", { className: "row" }, gname, h("button", { type: "submit", className: "primary", textContent: L.groupCreate }));
  create.addEventListener("submit", async e => {
    e.preventDefault();
    const r = await api("POST", "/api/groups", { name: gname.value });
    if (!r.ok) return errC.fail(r);
    await refreshMe();
    await chooseGroup(r.data.id);
    await loadGroup();
    SERVER.status = L.groupCreated(r.data.name);
    renderGroups();
  });

  /* join one, from a pasted link or code: it goes through the invitation page */
  const code = h("input", { type: "text", placeholder: L.joinPlaceholder, required: true });
  const join = h("form", { className: "row" }, code, h("button", { type: "submit", className: "ghost", textContent: L.joinGo }));
  join.addEventListener("submit", e => {
    e.preventDefault();
    const v = code.value.trim().replace(/\/+$/, "");
    const c = v.includes("/") ? v.slice(v.lastIndexOf("/") + 1) : v;
    if (c) go("/rejoindre/" + encodeURIComponent(c));
  });

  root.append(
    h("section", { className: "card" }, h("h3", { textContent: L.groupCreateTitle }), create, errC,
      h("p", { className: "note", textContent: L.groupCreateNote })),
    h("section", { className: "card" }, h("h3", { textContent: L.joinTitle }), join,
      h("p", { className: "note", textContent: L.joinNote })));
}

function renderAccountPage() {
  show("view-account", L.tabAccount);
  const root = $("view-account");
  const card = document.querySelector(".add-card");
  for (const n of [...root.children]) if (n !== card) n.remove();
  const me = SERVER.me;

  /* one's own profile, as the compass reads it */
  const mine = profiles.find(q => q.me);
  const c = mine ? coords(mine) : null;
  const show2 = v => (v === null || v === undefined ? "—" : signed(v));
  const summary = h("dl", { className: "profile-summary" },
    h("dt", { textContent: L.username }), h("dd", { textContent: me.username }),
    h("dt", { textContent: L.readingAxis.x }), h("dd", { textContent: show2(c && c.x) }),
    h("dt", { textContent: L.readingAxis.y }), h("dd", { textContent: show2(c && c.y) }),
    h("dt", { textContent: L.tabGroups }), h("dd", { textContent: me.groups.map(g => g.name).join(", ") || "—" }));

  const exportBtn = h("button", { type: "button", className: "ghost", textContent: L.exportAccount });
  exportBtn.addEventListener("click", async () => {
    const r = await api("GET", "/api/me/export");
    if (!r.ok) return;
    const blob = new Blob([JSON.stringify(r.data, null, 1) + "\n"], { type: "application/json" });
    const a = h("a", { href: URL.createObjectURL(blob), download: slugOf(me.username) + "-compte.json" });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  const logout = h("button", { type: "button", className: "ghost", textContent: L.signOut });
  logout.addEventListener("click", async () => { await flushAnswers(); await api("POST", "/api/logout"); await signedOut(); });

  const others = h("button", { type: "button", className: "ghost", textContent: L.signOutOthers });
  others.addEventListener("click", async () => {
    const r = await api("DELETE", "/api/me/sessions/others");
    SERVER.status = r.ok ? L.signedOutOthers : apiError(r);
    renderAccountPage();
  });

  const errP = errorLine();
  const cur = h("input", { type: "password", placeholder: L.passwordCurrent, autocomplete: "current-password", required: true });
  const nxt = h("input", { type: "password", placeholder: L.passwordNew, autocomplete: "new-password", required: true });
  const pw = h("form", { className: "row" }, cur, nxt, h("button", { type: "submit", className: "ghost", textContent: L.passwordChange }));
  pw.addEventListener("submit", async e => {
    e.preventDefault();
    const r = await api("POST", "/api/me/password", { current: cur.value, new: nxt.value });
    if (!r.ok) return errP.fail(r.data && r.data.error === "bad_credentials" ? L.passwordWrong : r);
    SERVER.status = L.passwordChanged;
    renderAccountPage();
  });

  const err = errorLine();
  const delPass = h("input", { type: "password", placeholder: L.password, autocomplete: "current-password", required: true });
  const del = h("form", { className: "row" }, delPass, h("button", { type: "submit", className: "ghost", textContent: L.deleteAccount }));
  del.addEventListener("submit", async e => {
    e.preventDefault();
    if (!confirm(L.deleteConfirm)) return;
    const r = await api("DELETE", "/api/me", { password: delPass.value });
    if (!r.ok) return err.fail(r);
    await signedOut();
  });

  const head = [
    h("h2", { textContent: L.tabAccount }),
    SERVER.status ? h("p", { className: "status", textContent: SERVER.status }) : null,
    h("section", { className: "card" }, h("h3", { textContent: L.myProfile }), summary,
      h("div", { className: "actions" },
        h("a", { href: "/questionnaire", className: "button primary", textContent: L.quizOpen }),
        h("a", { href: "/boussole", className: "button ghost", textContent: L.seeOnCompass })))
  ].filter(Boolean);
  const tail = [
    h("section", { className: "card" }, h("h3", { textContent: L.myData }),
      h("p", { className: "note", textContent: L.serverNoteIn }),
      h("div", { className: "actions" }, exportBtn, others, logout)),
    h("section", { className: "card" }, h("h3", { textContent: L.passwordTitle }), pw, errP,
      h("p", { className: "note", textContent: L.passwordNote })),
    h("section", { className: "card" }, h("h3", { textContent: L.deleteTitle }),
      h("p", { textContent: L.deleteWarn }), del, err)
  ];
  root.prepend(...head);
  root.append(...tail);
  SERVER.status = "";
}

detectServer();
