/* What connects the page to its user: the chart's hover cards, the
   PolitiScales form and screenshot reader, the controls, and the start-up
   sequence.
   The page has one script: the web/*.js files are concatenated in the order
   web/shell.html includes them, and share its top-level scope. */

/* ---------------------------------------------------------------- survol --- */

function wireHover(computed) {
  const tip = $("tip");
  const plot = document.querySelector(".plot");

  const show = (idx, clientX, clientY) => {
    const { p, c } = computed[idx];
    const nearest = nearestReference(c.x, c.y);
    const Vc = V();

    tip.replaceChildren();
    const b = document.createElement("b");
    b.textContent = p.alias;
    tip.appendChild(b);

    const dl = document.createElement("dl");
    const rows = [
      [L.tipEcon, signed(c.x)],
      [Vc.tipSocial, signed(c.y)
        + (c.y > 0 ? Vc.suffixAuthor : c.y < 0 ? Vc.suffixLibert : "")],
      [L.tipEcol, c.ecol === null ? "—" : signed(c.ecol)]
    ];
    if (c.method) rows.push([L.tipMethod, c.method]);
    for (const [k, v] of rows) {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    }
    tip.appendChild(dl);

    if (p.slogan) {
      const dv = document.createElement("p");
      dv.className = "near";
      dv.textContent = p.slogan.join(" · ");
      tip.appendChild(dv);
    }
    const ct = document.createElement("p");
    ct.className = "near";
    ct.textContent = (window.PolitiExtract ? PolitiExtract.keyConcepts(p, 3) : [])
      .map(c => L.pole[c.key]).join(" · ") || L.noMarkedAxis;
    tip.appendChild(ct);

    const near = document.createElement("p");
    near.className = "near";
    near.textContent = !nearest ? L.viewNoRefs : (nearest.d > LIMITS.far
      ? L.nearestFar + nearest.name + " (" + nearest.d + ")"
      : L.nearest + nearest.name + " (" + L.proximity + nearest.fit + ")")
      + (nearest.margin <= LIMITS.tie ? L.tieWith(nearest.second.name, nearest.margin) : "");
    tip.appendChild(near);

    tip.hidden = false;

    const box = plot.getBoundingClientRect();
    const tb = tip.getBoundingClientRect();
    let left = clientX - box.left + 16;
    let top  = clientY - box.top + 16;
    if (left + tb.width > box.width) left = clientX - box.left - tb.width - 16;
    if (top + tb.height > box.height) top = clientY - box.top - tb.height - 16;
    tip.style.left = Math.max(0, left) + "px";
    tip.style.top  = Math.max(0, top) + "px";

    document.querySelectorAll("#points-layer g, #profiles-table tbody tr")
      .forEach(n => n.classList.toggle("on", n.dataset.idx === String(idx)));
  };

  const hide = () => {
    tip.hidden = true;
    document.querySelectorAll(".on").forEach(n => n.classList.remove("on"));
  };

  $("points-layer").querySelectorAll("g").forEach(g => {
    const idx = Number(g.dataset.idx);
    const hit = g.querySelector(".hit");
    g.addEventListener("pointermove", e => show(idx, e.clientX, e.clientY));
    g.addEventListener("pointerleave", hide);
    hit.addEventListener("focus", () => {
      const r = hit.getBoundingClientRect();
      show(idx, r.left + r.width / 2, r.top + r.height / 2);
    });
    hit.addEventListener("blur", hide);
  });
}

/* ------------------------------------------------------------ formulaire --- */

function buildForm() {
  const box = $("axis-fields");
  box.replaceChildren();

  const head = document.createElement("div");
  head.className = "axis-row";
  const hp = document.createElement("div");
  hp.className = "poles";
  hp.style.color = "var(--text-3)";
  hp.style.fontSize = "0.72rem";
  hp.textContent = L.formAxisHead;
  const h1 = document.createElement("div"); h1.className = "col-head"; h1.textContent = L.formColLeft;
  const h2 = document.createElement("div"); h2.className = "col-head"; h2.textContent = L.formColRight;
  head.append(hp, h1, h2);
  box.appendChild(head);

  for (const a of AXES) {
    const row = document.createElement("div");
    row.className = "axis-row";
    row.dataset.axis = a.neg[0] + "-" + a.pos[0];

    const poles = document.createElement("div");
    poles.className = "poles";
    const e1 = document.createElement("em"); e1.textContent = a.neg[1];
    const e2 = document.createElement("em"); e2.textContent = a.pos[1];
    poles.append(e1, document.createTextNode(" ↔ "), e2);
    row.appendChild(poles);

    for (const [key, label] of [a.neg, a.pos]) {
      const inp = document.createElement("input");
      inp.type = "number";
      inp.id = "p-" + key;
      inp.min = "0"; inp.max = "100"; inp.step = "1";
      inp.value = "0";
      inp.setAttribute("aria-label", label + " (%)");
      inp.addEventListener("input", () => checkRow(row, a));
      row.appendChild(inp);
    }
    box.appendChild(row);
  }
}

const val = key => {
  const n = Number($("p-" + key).value);
  return Number.isFinite(n) ? clamp(Math.round(n), 0, 100) : 0;
};

function checkRow(row, a) {
  row.classList.toggle("over", val(a.neg[0]) + val(a.pos[0]) > 100);
}

function readForm() {
  const alias = $("p-alias").value.trim();
  const err = $("form-error");
  const fail = msg => { err.textContent = msg; err.hidden = false; return null; };
  err.hidden = true;

  /* on a server the alias is the account's pseudonym, not typed here */
  if (!SERVER.on) {
    if (!alias) return fail(L.errNoAlias);
    if (profiles.some(p => p.alias.toLowerCase() === alias.toLowerCase()))
      return fail(L.errDuplicate(alias));
  }

  const over = AXES.filter(a => val(a.neg[0]) + val(a.pos[0]) > 100);
  if (over.length)
    return fail(L.errOverHundred(over.map(a => a.neg[1] + " ↔ " + a.pos[1]).join(", ")));

  const p = { alias };
  let any = false;
  for (const a of AXES) {
    const lo = val(a.neg[0]), hi = val(a.pos[0]);
    if (lo === 0 && hi === 0) continue;   /* axis left blank: we do not invent a value for it */
    p[a.neg[0]] = lo;
    p[a.pos[0]] = hi;
    any = true;
  }
  if (!any) return fail(L.errNoAxis);

  /* The flag only follows if the values on screen are still the ones read from
     the screenshot: a profile edited by hand must not carry the flag of a
     result that no longer matches. */
  if (pendingCapture) {
    const same = AXES.every(a =>
      val(a.neg[0]) === (pendingCapture.values[a.neg[0]] || 0) &&
      val(a.pos[0]) === (pendingCapture.values[a.pos[0]] || 0));
    if (same) { p.flag = pendingCapture.flag; p.source = pendingCapture.source; }
  }
  return p;
}

/* ------------------------------------------------------------- wiring --- */

document.getElementById("add-form").addEventListener("submit", e => {
  e.preventDefault();
  const p = readForm();
  if (!p) return;
  if (SERVER.on) { savePolitiscales(p); return; }
  overlay.added.push(p);
  saveOverlay();
  rebuild();
  render();
  e.target.reset();
  pendingCapture = null;
  captureFeedback(null, null);
  document.querySelectorAll(".axis-row.over").forEach(r => r.classList.remove("over"));
  $("p-alias").focus();
});

$("clear-btn").addEventListener("click", () => {
  document.getElementById("add-form").reset();
  pendingCapture = null;
  captureFeedback(null, null);
  $("form-error").hidden = true;
  document.querySelectorAll(".axis-row.over").forEach(r => r.classList.remove("over"));
});

$("reset-btn").addEventListener("click", () => {
  /* "Show everything again" brings hidden profiles back; it is not an erase
     button, so the answers of the profiles it keeps survive it. The profiles
     it removes — every added one — take their answers with them, as a
     deletion does: left behind, they would come back on a new profile that
     happened to reuse the alias. */
  const kept = new Set(SEED.map(idOf));
  const answers = {};
  for (const [id, a] of Object.entries(overlay.answers)) if (kept.has(id)) answers[id] = a;
  overlay = { hidden: [], added: [], answers };
  saveOverlay();
  rebuild();
  render();
});

["t-refs", "t-reflabels", "t-labels", "t-centroid", "t-trail"].forEach(id =>
  $(id).addEventListener("change", render)
);

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && selection) { selection = null; render(); }
});

/* clicking the chart background clears the selection */
$("compass").addEventListener("click", e => {
  if (selection && !e.target.closest("#points-layer g, #refs-layer g")) {
    selection = null;
    render();
  }
});

/* ------------------------------------------------ screenshot import ---
   Same extraction code as the command line (tools/politi-dissect.js), so what
   is read here and what `node tools/extract.js` writes cannot diverge. We fill
   the form rather than adding straight away, so the values go through the same
   validation and stay correctable. */
let pendingCapture = null;

function aliasFromFileName(name) {
  const base = name.replace(/\.[^.]+$/, "").replace(/[-_]?\d{4}$/, "");
  return base.split(/[-_\s]+/).filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || base;
}

function captureFeedback(kind, text, flag) {
  const box = $("capture-ok");
  box.replaceChildren();
  if (!text) { box.hidden = true; return; }
  if (flag) box.appendChild(flagEl({ flag, alias: "capture" }, "lg", true));
  const span = document.createElement("span");
  span.className = kind === "ok" ? "who" : "";
  if (kind !== "ok") span.style.color = "var(--warn)";
  span.textContent = text;
  box.appendChild(span);
  box.hidden = false;
}

function readCapture(file) {
  if (!window.PolitiExtract) {
    captureFeedback("err", L.errNoExtractor);
    return;
  }
  const fr = new FileReader();
  fr.onerror = () => captureFeedback("err", L.errUnreadable);
  fr.onload = () => {
    const img = new Image();
    img.onerror = () => captureFeedback("err", L.errNotImage);
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      let data;
      try { data = ctx.getImageData(0, 0, c.width, c.height); }
      catch (_) { captureFeedback("err", L.errPixels); return; }

      let res;
      try { res = PolitiExtract.extract(data); }
      catch (e) { captureFeedback("err", L.errExtract(e.message)); return; }
      if (!res.ok) {
        captureFeedback("err", L.errUnrecognised(res.warnings.join(" ; ")));
        return;
      }

      /* the flag, re-cropped from the canvas */
      let flag = null;
      const g = res.geometry;
      if (g.flag) {
        const fc = document.createElement("canvas");
        fc.width = 160; fc.height = Math.max(24, Math.round(160 * g.flag.h / g.flag.w));
        fc.getContext("2d").drawImage(c, g.flag.x, g.flag.y, g.flag.w, g.flag.h,
                                      0, 0, fc.width, fc.height);
        try { flag = fc.toDataURL("image/png"); } catch (_) { flag = null; }
      }

      const alias = aliasFromFileName(file.name);
      $("p-alias").value = alias;
      for (const a of AXES) {
        $("p-" + a.neg[0]).value = String(res.values[a.neg[0]] ?? 0);
        $("p-" + a.pos[0]).value = String(res.values[a.pos[0]] ?? 0);
      }
      document.querySelectorAll(".axis-row").forEach(r => r.classList.remove("over"));
      $("form-error").hidden = true;

      /* The motto is text: it cannot be read here without OCR. The CLI gets it via
         tesseract; in the browser we leave the field empty rather than invent
         something. Key concepts, on the other hand, are computed. */
      pendingCapture = { flag, source: file.name, values: { ...res.values } };
      /* the read values land in the form, to be checked and submitted there */
      $("manual-entry").open = true;
      const concepts = PolitiExtract.keyConcepts(res.values, 3)
        .map(x => L.pole[x.key]).join(" · ");
      captureFeedback("ok", L.captureOk(alias, concepts)
        + (res.warnings.length ? "  (" + res.warnings.join(" ; ") + ")" : ""), flag);
    };
    img.src = fr.result;
  };
  fr.readAsDataURL(file);
}

const drop = $("drop");
$("drop-input").addEventListener("change", e => {
  if (e.target.files && e.target.files[0]) readCapture(e.target.files[0]);
  e.target.value = "";
});
["dragenter", "dragover"].forEach(ev =>
  drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach(ev =>
  drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", e => {
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) readCapture(f);
});

/* A screenshot dropped anywhere else on the page used to be opened by the
   browser in its place, leaving the page. Anywhere now counts as the drop
   zone: the image is read, and the form it fills is brought into view. */
const draggingFiles = e => e.dataTransfer && [...e.dataTransfer.types].includes("Files");
document.addEventListener("dragover", e => { if (draggingFiles(e)) e.preventDefault(); });
document.addEventListener("drop", e => {
  if (!draggingFiles(e) || e.defaultPrevented || e.target.closest("#drop")) return;
  e.preventDefault();
  const f = e.dataTransfer.files[0];
  if (!f || !/^image\//.test(f.type)) return;
  if (SERVER.on && location.pathname !== "/compte") go("/compte");
  readCapture(f);
  $("drop").scrollIntoView({ block: "center", behavior: "smooth" });
});

/* Fills the static markup from the locale. Every node carrying data-i18n gets
   its text, data-i18n-title its tooltip, data-i18n-placeholder its placeholder.
   Nothing below hardcodes copy, so another language is one more object in
   LOCALES plus the matching <html lang>. */
function applyLocale() {
  document.querySelectorAll("[data-i18n]").forEach(n => {
    const v = L[n.dataset.i18n];
    if (typeof v === "string") n.textContent = v;
  });
  document.querySelectorAll("[data-i18n-title]").forEach(n => {
    const v = L[n.dataset.i18nTitle];
    if (typeof v === "string") n.title = v;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(n => {
    const v = L[n.dataset.i18nPlaceholder];
    if (typeof v === "string") n.placeholder = v;
  });
}
applyLocale();

/* A profile that starts here, with no PolitiScales result: an alias, then
   straight to the list of themes. It lives in the overlay like a hand-typed
   profile, so deleting it deletes its answers. */
$("native-form").addEventListener("submit", e => {
  e.preventDefault();
  const alias = $("native-alias").value.trim();
  const err = $("native-error");
  err.hidden = true;
  const fail = msg => { err.textContent = msg; err.hidden = false; };
  if (!alias) return fail(L.errNoAlias);
  if (profiles.some(p => p.alias.toLowerCase() === alias.toLowerCase()))
    return fail(L.errDuplicate(alias));
  const p = { alias, native: true };
  overlay.added.push(p);
  saveOverlay();
  rebuild();
  render();
  $("native-alias").value = "";
  location.hash = hubHref(idOf(p));
});

/* Reading picker. Changing reading changes both axes, the party table (only
   the parties measured on the new axis), and so the thresholds, which are
   derived from those parties' spacing. */
function applyView() {
  const W = V();
  document.querySelector('#profiles-table th[data-i18n="colY"]').textContent = W.colY;
  document.querySelector('#profiles-table th[data-i18n="colY"]').title = W.titleY;
  const note = $("view-note");
  const parts = [];
  if (view.key === "politiscales") parts.push(L.viewNotePolitiscales);
  if (view.key === "protectionism") {
    const dropped = country.parties.length - REFERENCES.length;
    if (country.protWhy) parts.push(L.viewNoteNoProt(country.protWhy));
    else if (!REFERENCES.length) parts.push(L.viewNoteAllEstimated);
    else if (dropped) parts.push(L.viewNoteDropped(dropped));
    /* why each profile is off: never answered, skipped protectionism, or
       answered protectionism but nothing that places it on x */
    const offs = profiles.map(project).filter(c => c.off);
    /* c.quiz exists as soon as any theme is answered, so ask the economy's own counts */
    const econ = c => c.quiz && Object.values(c.quiz.n).some(n => n > 0);
    const none = offs.filter(c => !econ(c)).length;
    const noProt = offs.filter(c => econ(c) && c.y === null).length;
    const noX = offs.filter(c => econ(c) && c.y !== null && c.x === null).length;
    if (none) parts.push(L.viewNoteOff(none));
    if (noProt) parts.push(L.viewNoteSkippedProt(noProt));
    if (noX) parts.push(L.viewNoteNoX(noX));
  }
  note.textContent = parts.join(" ");
  note.hidden = !parts.length;
}

(function () {
  const sel = $("view");
  for (const v of VIEWS) {
    const o = document.createElement("option");
    o.value = v.key;
    o.textContent = L.views[v.key].name;
    if (v.planned) o.disabled = true;
    sel.appendChild(o);
  }
  let saved = null;
  try { saved = localStorage.getItem(VIEW_KEY); } catch (_) { /* private browsing */ }
  const found = VIEWS.find(v => v.key === saved && !v.planned);
  if (found) view = found;
  sel.value = view.key;
  sel.addEventListener("change", () => {
    view = VIEWS.find(v => v.key === sel.value) || VIEWS[0];
    try { localStorage.setItem(VIEW_KEY, view.key); } catch (_) { /* quota, or private browsing */ }
    selection = null;
    setCountry(country.code);
    applyCountry();
    renderChrome();
    render();
  });
})();

/* Flag picker: PolitiScales's flag where there is one, or Politiskel's for all. */
(function () {
  const sel = $("flags");
  for (const [v, t] of [["politiscales", L.flagsPolitiscales], ["politiskel", L.flagsPolitiskel]]) {
    const o = document.createElement("option");
    o.value = v; o.textContent = t;
    sel.appendChild(o);
  }
  sel.value = flagMode;
  sel.addEventListener("change", () => {
    flagMode = sel.value;
    try { localStorage.setItem(FLAG_KEY, flagMode); } catch (_) { /* quota, or private browsing */ }
    render();
    if (SERVER.on && SERVER.me && !$("account").hidden) renderGroupBar();   /* its member chips carry flags too */
  });
})();

/* Country picker. The labels that name the country or count its references are
   written from the data, so adding a party cannot leave a wrong figure in the
   copy — and a country change rewrites them all through applyCountry(). */
(function () {
  const sel = $("country");
  for (const c of COUNTRIES) {
    const o = document.createElement("option");
    o.value = c.code;
    o.textContent = c.name;
    sel.appendChild(o);
  }
  let saved = null;
  try { saved = localStorage.getItem(COUNTRY_KEY); } catch (_) { /* private browsing */ }
  setCountry(saved || COUNTRIES[0].code);
  sel.value = country.code;

  sel.addEventListener("change", () => {
    setCountry(sel.value);
    try { localStorage.setItem(COUNTRY_KEY, country.code); } catch (_) { /* quota, or private browsing */ }
    applyCountry();
    render();
  });
})();
applyCountry();

/* the strip tooltip stays open while the pointer is over it */
(function () {
  const t = $("strip-tip");
  if (!t) return;
  t.addEventListener("pointerenter", () => clearTimeout(stripTipTimer));
  t.addEventListener("pointerleave", hideStripTip);
})();

buildForm();
renderChrome();
render();
route();   /* a reload on #questionnaire/... lands back on the questionnaire */

