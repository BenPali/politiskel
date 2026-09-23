/* The Politiskel flag: an emblem drawn from a profile's readings, for the
   profiles PolitiScales never drew one for, and for anyone who prefers it.

   It uses no existing political symbol and no party colour — a star, a
   sickle, a party's red or blue would claim a belonging the page refuses to
   claim. Every element stands for one reading, and the legend says which:

     hoist band   the economy: on the side one leans, as wide as |x|,
                  in the colour of x's most marked sub-dimension
     field        society: the colour of y's most marked sub-dimension;
                  plain near the centre, a central stripe towards
                  authoritarian (order: symmetric), a diagonal towards
                  libertarian (asymmetric)
     disc / ring  Wright's class reading: filled when anticapitalist, a ring
                  when procapitalist, sized by its strength
     border       protectionism, when it is marked

   A colour names a dimension, never a side: which one dominates, not where
   the profile stands on it. The drawing is numbers and fixed colours only;
   no string from a profile ever enters it.

   The page has one script: the web/*.js files are concatenated in the order
   web/shell.html includes them, and share its top-level scope. */

/* One muted tincture per sub-dimension, chosen away from parties' colours. */
const TINCTURES = {
  redistribution: "#c08a3e", spendvtax: "#3f8f8a", deregulation: "#6b7a8f",
  immigration: "#8a5a7a", multiculturalism: "#a0663f", laworder: "#5b6b3a",
  women: "#b07a8c", lgbt: "#6f6aa8", religion: "#8c7b5a", nationalism: "#4f7896"
};
const FLAG_BAND_NONE = "#39434d", FLAG_FIELD_NONE = "#d8d2c4", FLAG_INK = "#2b2f33";
const FLAG_KEY = "politicompass.flags.v1";

/* The sub-dimension with the largest |score| among a theme's, or null. */
function strongestDim(score) {
  if (!score || !score.dims) return null;
  let best = null;
  for (const [d, v] of Object.entries(score.dims)) {
    if (v !== null && (!best || Math.abs(v) > Math.abs(best.v))) best = { d, v };
  }
  return best;
}

const lighten = (hex, t) => {
  const n = parseInt(hex.slice(1), 16);
  const mix = c => Math.round(c + (255 - c) * t);
  return "#" + [n >> 16 & 255, n >> 8 & 255, n & 255].map(c => mix(c).toString(16).padStart(2, "0")).join("");
};

/* The flag of a computed profile: { url, legend } — or null when there is
   nothing to draw from (no position and no answer). */
function politiskelFlag(c) {
  const x = c.x, y = c.y;
  const eco = strongestDim(c.quiz), soc = strongestDim(c.soc);
  const cls = c.quiz ? c.quiz.class : null;
  const prot = c.quiz ? c.quiz.protectionism : null;
  if (x === null && y === null && !eco && !soc && cls === null) return null;

  const W = 150, H = 100;
  const field = soc ? TINCTURES[soc.d] : FLAG_FIELD_NONE;
  const band = eco ? TINCTURES[eco.d] : FLAG_BAND_NONE;
  const parts = ['<rect width="150" height="100" fill="' + field + '"/>'];
  const legend = [];

  /* the field's pattern: y */
  const yy = y === null ? 0 : y;
  if (yy >= 34) {
    parts.push('<rect y="36" width="150" height="28" fill="' + lighten(field, 0.45) + '"/>');
  } else if (yy <= -34) {
    parts.push('<polygon points="0,100 150,0 150,100" fill="' + lighten(field, 0.45) + '"/>');
  }
  const fieldLine = L.flagField(soc ? L.dims[soc.d] : null, soc ? soc.v : null, y,
                                yy >= 34 ? "stripe" : yy <= -34 ? "diagonal" : "plain");

  /* the hoist band: x, on its side */
  let open = [0, W];
  if (x !== null) {
    const w = Math.round(10 + Math.abs(x) / 100 * 50);
    const left = x < 0;
    parts.push('<rect x="' + (left ? 0 : W - w) + '" width="' + w + '" height="100" fill="' + band + '"/>');
    open = left ? [w, W] : [0, W - w];
    legend.push(L.flagBand(x, eco ? L.dims[eco.d] : null, eco ? eco.v : null));
  }
  legend.push(fieldLine);   /* read as the eye does: the band, then the field */

  /* the symbol: the class reading, centred in what the band leaves */
  if (cls !== null) {
    const cx = (open[0] + open[1]) / 2, cy = 50, r = Math.round(6 + Math.abs(cls) / 100 * 16);
    if (cls >= 20) parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#ffffff" fill-opacity="0.88"/>');
    else if (cls <= -20) parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#ffffff" stroke-opacity="0.9" stroke-width="4"/>');
    else parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="#ffffff" fill-opacity="0.8"/>');
    legend.push(L.flagSymbol(cls));
  }

  /* the border: protectionism, when marked */
  if (prot !== null && prot >= 34) {
    parts.push('<rect x="3" y="3" width="144" height="94" fill="none" stroke="' + FLAG_INK + '" stroke-width="6"/>');
    legend.push(L.flagBorder(prot));
  }

  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W
    + '" height="' + H + '">' + parts.join("") + "</svg>";
  return { url: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg), legend };
}

/* Which flag the page shows: PolitiScales's when there is one, or Politiskel's
   for every profile. A viewer's preference, kept in this browser. */
let flagMode = "politiscales";
try { flagMode = localStorage.getItem(FLAG_KEY) === "politiskel" ? "politiskel" : "politiscales"; }
catch (_) { /* private browsing */ }

/* The flag and its legend, for the distance panel: shown whatever the mode,
   so both flags can be seen side by side there. */
function flagFigure(p) {
  const f = politiskelFlag(coords(p));
  if (!f) return null;
  const img = document.createElement("img");
  img.className = "flag lg";
  img.src = f.url;
  img.alt = L.flagGeneratedAlt(p.alias);
  const ul = document.createElement("ul");
  ul.className = "flag-legend";
  for (const line of f.legend) {
    const li = document.createElement("li");
    li.textContent = line;
    ul.appendChild(li);
  }
  const box = document.createElement("div");
  box.className = "flag-figure";
  const cap = document.createElement("p");
  cap.className = "hint";
  cap.textContent = L.flagFigureTitle;
  box.append(cap, img, ul);
  return box;
}
