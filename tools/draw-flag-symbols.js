#!/usr/bin/env node
/* The flag symbols drawn for Politiskel: those of game-icons.net that did
   not read at flag size (the broken chain, the globe, the Phrygian cap, the
   croix de guerre, the crown, the column, the tower, the torch), and those
   redrawn to share their look (the shield, the book, the factory): plain
   solid silhouettes, few details, cut-outs wide enough to survive 24px.
   Each is built here from plain shapes in
   the 512 × 512 box the other symbols use, and written into
   site/src/lib/flag/icons.js in place of its previous entry:

     node tools/draw-flag-symbols.js

   An entry is a path string (filled, nonzero), or an object: { d, rule:
   "evenodd" } for a shape with holes, { d, knock: 1 } for a shape painted in
   the field's colour, to part two shapes that would otherwise merge. */
"use strict";
const fs = require("fs");
const path = require("path");

const f = v => String(Math.round(v * 10) / 10);
const P = (...pts) => "M" + pts.map(([x, y]) => f(x) + "," + f(y)).join(" L") + " Z";
const circle = (cx, cy, r) =>
  `M${f(cx - r)},${f(cy)} A${f(r)},${f(r)} 0 1 0 ${f(cx + r)},${f(cy)} A${f(r)},${f(r)} 0 1 0 ${f(cx - r)},${f(cy)} Z`;
const ellipse = (cx, cy, rx, ry) =>
  `M${f(cx)},${f(cy - ry)} A${f(rx)},${f(ry)} 0 1 0 ${f(cx)},${f(cy + ry)} A${f(rx)},${f(ry)} 0 1 0 ${f(cx)},${f(cy - ry)} Z`;
const rrect = (x0, y0, x1, y1, r) => r
  ? `M${f(x0 + r)},${f(y0)} L${f(x1 - r)},${f(y0)} A${f(r)},${f(r)} 0 0 1 ${f(x1)},${f(y0 + r)} `
    + `L${f(x1)},${f(y1 - r)} A${f(r)},${f(r)} 0 0 1 ${f(x1 - r)},${f(y1)} L${f(x0 + r)},${f(y1)} `
    + `A${f(r)},${f(r)} 0 0 1 ${f(x0)},${f(y1 - r)} L${f(x0)},${f(y0 + r)} A${f(r)},${f(r)} 0 0 1 ${f(x0 + r)},${f(y0)} Z`
  : P([x0, y0], [x1, y0], [x1, y1], [x0, y1]);
const rot = (pts, deg) => {
  const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => [256 + (x - 256) * c - (y - 256) * s, 256 + (x - 256) * s + (y - 256) * c]);
};
const EO = (...parts) => ({ d: parts.join(" "), rule: "evenodd" });

/* A stadium along angle deg: half straight length L, radius r. */
function stadium(cx, cy, L, r, deg) {
  const a = deg * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  const p = (s, t) => [cx + ux * s + nx * t, cy + uy * s + ny * t];
  const [A, B, C, D] = [p(L, r), p(-L, r), p(-L, -r), p(L, -r)];
  return `M${f(A[0])},${f(A[1])} L${f(B[0])},${f(B[1])} A${f(r)},${f(r)} 0 0 1 ${f(C[0])},${f(C[1])} `
    + `L${f(D[0])},${f(D[1])} A${f(r)},${f(r)} 0 0 1 ${f(A[0])},${f(A[1])} Z`;
}
const link = (cx, cy, L, R, w, deg) => EO(stadium(cx, cy, L, R, deg), stadium(cx, cy, L, R - w, deg));
/* Half a link: a thick U, closed at the far end, open towards `side`. */
function openLink(cx, cy, L, R, w, deg, side) {
  const a = deg * Math.PI / 180, ux = Math.cos(a) * side, uy = Math.sin(a) * side, nx = -uy, ny = ux;
  const p = (s, t) => [cx + ux * s + nx * t, cy + uy * s + ny * t];
  const r = R - w;
  const q = [p(0, R), p(-L, R), p(-L, -R), p(0, -R), p(0, -r), p(-L, -r), p(-L, r), p(0, r)].map(([x, y]) => f(x) + "," + f(y));
  return `M${q[0]} L${q[1]} A${f(R)},${f(R)} 0 0 1 ${q[2]} L${q[3]} L${q[4]} L${q[5]} A${f(r)},${f(r)} 0 0 0 ${q[6]} L${q[7]} Z`;
}

const ICONS = {};

/* Liberty: a chain whose middle link has burst open. */
{
  const ang = -30, ux = Math.cos(ang * Math.PI / 180), uy = Math.sin(ang * Math.PI / 180);
  const at = s => [256 + ux * s, 256 + uy * s];
  const sparks = [[-90, 64, 128], [-58, 72, 120], [-122, 72, 120], [90, 64, 128], [58, 72, 120], [122, 72, 120]]
    .map(([a, r0, r1]) => {
      const t = (ang + a) * Math.PI / 180, w = 11, nx = -Math.sin(t) * w, ny = Math.cos(t) * w;
      const x0 = 256 + Math.cos(t) * r0, y0 = 256 + Math.sin(t) * r0;
      const x1 = 256 + Math.cos(t) * r1, y1 = 256 + Math.sin(t) * r1;
      return P([x0 + nx, y0 + ny], [x1 + nx * 0.4, y1 + ny * 0.4], [x1 - nx * 0.4, y1 - ny * 0.4], [x0 - nx, y0 - ny]);
    });
  ICONS.liberty = [
    link(...at(-150), 38, 50, 24, ang),
    openLink(...at(-40), 36, 50, 24, ang, 1),
    openLink(...at(40), 36, 50, 24, ang, -1),
    link(...at(150), 38, 50, 24, ang),
    sparks.join(" ")
  ];
}

/* Globe: rim, meridian, axis, equator, two parallels. */
ICONS.globe = [
  EO(circle(256, 256, 214), circle(256, 256, 184)),
  EO(ellipse(256, 256, 100, 199), ellipse(256, 256, 74, 199)),
  rrect(243, 56, 269, 456, 0),
  rrect(50, 243, 462, 269, 0),
  ...[150, 362].map(y => { const h = Math.sqrt(199 ** 2 - (y - 256) ** 2); return rrect(256 - h, y - 11, 256 + h, y + 11, 0); })
];

/* Phrygian cap: the tip hangs forward over the brow; a band; a cockade. */
ICONS.phrygian = [
  EO("M164,398 C154,338 166,280 206,238 C176,242 142,264 120,294 C108,310 84,304 86,284 "
     + "C92,188 160,110 252,102 C344,94 392,160 392,250 C392,318 388,362 390,398 Z", circle(306, 300, 44)),
  circle(306, 300, 20),
  rrect(142, 388, 412, 440, 18)
];

/* Croix de guerre: a small cross pattée over two long crossed swords, with
   the central medallion. Both matter: a bare cross pattée in black is the
   Iron Cross, which this flag never draws. The halo, in the field's colour,
   parts cross and medallion from the swords. */
{
  const sword = deg => [
    P(...rot([[256, 22], [276, 62], [276, 336], [236, 336], [236, 62]], deg)),
    P(...rot([[180, 336], [332, 336], [332, 366], [180, 366]], deg)),
    P(...rot([[244, 366], [268, 366], [268, 424], [244, 424]], deg)),
    circle(...rot([[256, 444]], deg)[0], 24)
  ];
  const arms = (inner, outer, y) => [0, 90, 180, 270]
    .map(deg => P(...rot([[256 - inner, 256], [256 - outer, y], [256 + outer, y], [256 + inner, 256]], deg))).join(" ");
  ICONS.croix = [...sword(-45), ...sword(45),
    { d: arms(34, 70, 112), knock: 1 }, arms(20, 54, 128),
    { d: circle(256, 256, 60), knock: 1 }, circle(256, 256, 46)];
}

/* Crown: five points with pearls over a jewelled band. */
ICONS.crown = [
  P([118, 330], [92, 168], [182, 248], [256, 124], [330, 248], [420, 168], [394, 330]),
  EO(rrect(108, 336, 404, 396, 10), circle(180, 366, 14), circle(256, 366, 14), circle(332, 366, 14)),
  circle(92, 150, 24), circle(256, 104, 26), circle(420, 150, 24),
  circle(182, 240, 13), circle(330, 240, 13)
];

/* Column: a plain Doric column — abacus, echinus, fluted shaft, stepped base. */
ICONS.column = [
  rrect(124, 62, 388, 100, 4),
  P([150, 100], [362, 100], [340, 132], [172, 132]),
  EO(P([178, 138], [334, 138], [326, 398], [186, 398]), ...[205, 249, 293].map(x => rrect(x, 150, x + 14, 386, 7))),
  rrect(158, 404, 354, 428, 3),
  rrect(128, 434, 384, 460, 3)
];

/* Tower: a keep with three merlons, two arrow slits and an arched door. */
ICONS.tower = [
  EO(P([164, 150], [348, 150], [362, 440], [150, 440]),
     rrect(241, 194, 271, 264, 10),
     "M216,440 L216,384 A40,40 0 0 1 296,384 L296,440 Z"),
  rrect(136, 114, 376, 162, 6),
  rrect(136, 58, 194, 122, 6), rrect(227, 58, 285, 122, 6), rrect(318, 58, 376, 122, 6),
  rrect(118, 436, 394, 464, 6)
];

/* Torch: an upright flame with its heart cut out, a cup, a tapering handle. */
ICONS.torch = [
  EO("M256,34 C312,98 348,146 348,200 C348,250 306,284 256,284 C206,284 164,250 164,200 "
     + "C164,160 188,132 210,100 C220,132 232,150 246,160 C242,118 244,78 256,34 Z",
     "M258,150 C284,186 300,206 300,230 C300,254 280,266 258,266 C236,266 216,254 216,230 "
     + "C216,206 236,186 258,150 Z"),
  rrect(168, 290, 344, 318, 8),
  P([186, 318], [326, 318], [300, 362], [212, 362]),
  "M224,370 L288,370 L270,466 A14,14 0 0 1 242,466 Z"
];

/* Shield: a heater shield — straight top, rounded point — in outline, per
   pale: its left half solid. `inset` draws the same outline further in. */
{
  const shield = i => `M${f(84 + i)},${f(64 + i)} L${f(428 - i)},${f(64 + i)} L${f(428 - i)},230 `
    + `C${f(428 - i)},${f(352 - i * 0.5)} ${f(356 - i * 0.6)},${f(428 - i * 0.9)} 256,${f(474 - i * 1.3)} `
    + `C${f(156 + i * 0.6)},${f(428 - i * 0.9)} ${f(84 + i)},${f(352 - i * 0.5)} ${f(84 + i)},230 Z`;
  const i = 54;
  ICONS.shield = [
    EO(shield(0), shield(30)),
    `M${f(84 + i)},${f(64 + i)} L246,${f(64 + i)} L246,${f(474 - i * 1.3 - 8)} `
      + `C${f(160 + i * 0.6)},${f(426 - i * 0.9)} ${f(84 + i)},${f(352 - i * 0.5)} ${f(84 + i)},230 Z`
  ];
}

/* Book: an open book, two pages on a cover, three lines cut in each. */
{
  const lines = side => [0, 1, 2].map(i => {
    const y = 170 + i * 58;
    return side < 0 ? rrect(118, y, 222, y + 20, 10) : rrect(290, y, 394, y + 20, 10);
  });
  ICONS.book = [
    EO("M244,128 C200,100 140,92 84,104 L84,396 C140,384 200,392 244,420 Z", ...lines(-1)),
    EO("M268,128 C312,100 372,92 428,104 L428,396 C372,384 312,392 268,420 Z", ...lines(1)),
    "M56,136 L72,136 L72,412 C140,398 206,406 256,436 C306,406 372,398 440,412 L440,136 L456,136 "
      + "L456,440 C380,426 312,432 256,462 C200,432 132,426 56,440 Z"
  ];
}

/* Factory: a sawtooth roof, a chimney, a row of windows. */
ICONS.factory = [
  EO(P([62, 444], [62, 206], [162, 270], [162, 206], [262, 270], [262, 206], [362, 270], [362, 444]),
     rrect(98, 322, 140, 382, 6), rrect(184, 322, 226, 382, 6), rrect(270, 322, 312, 382, 6)),
  P([378, 444], [382, 96], [438, 96], [450, 444]),
  rrect(372, 74, 448, 102, 6)
];

/* Equality: an equals sign in a ring — equal rights for everyone, rather
   than one cause among others. */
ICONS.equality = [
  EO(circle(256, 256, 214), circle(256, 256, 184)),
  rrect(144, 190, 368, 236, 12),
  rrect(144, 276, 368, 322, 12)
];

/* Cross of Lorraine: a bar, and two crossbars, the upper one shorter —
   Free France's, and the Gaullist tradition's since. */
ICONS.lorraine = [
  rrect(228, 40, 284, 472, 8),
  rrect(152, 132, 360, 180, 8),
  rrect(100, 236, 412, 284, 8)
];

/* Circle of stars: twelve five-pointed stars on a ring, as on the European
   flag, drawn large enough to stay stars at 24px. */
{
  const star = (cx, cy, R) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.42 : R;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return P(...pts);
  };
  ICONS.eustars = Array.from({ length: 12 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 6;
    return star(256 + 180 * Math.cos(a), 256 + 180 * Math.sin(a), 46);
  });
}

/* Wind turbine: a tapering mast, a hub, three broad blades — the energy
   transition. */
{
  const blade = deg => {
    const pts = [[256, 196], [240, 186], [248, 60], [262, 44], [274, 186]];
    return P(...rot(pts.map(([x, y]) => [x, y + 60]), deg).map(([x, y]) => [x, y - 60]));
  };
  ICONS.turbine = [
    P([244, 214], [268, 214], [284, 472], [228, 472]),
    rrect(176, 452, 336, 476, 8),
    blade(0), blade(120), blade(240),
    circle(256, 196, 26)
  ];
}

if (require.main === module) {
  const file = path.join(__dirname, "..", "site", "src", "lib", "flag", "icons.js");
  let src = fs.readFileSync(file, "utf8");
  for (const [k, v] of Object.entries(ICONS)) {
    const re = new RegExp("\\n  " + k + ": \\[[^\\n]*\\],?(?=\\n)");
    if (re.test(src)) {
      src = src.replace(re, m => "\n  " + k + ": " + JSON.stringify(v) + (m.endsWith(",") ? "," : ""));
    } else {
      /* a new symbol: appended to FLAG_ICONS, credited as drawn */
      src = src.replace(/(\n  [a-z]+: \[[^\n]*\])\n};/, (m, last) => last + ",\n  " + k + ": " + JSON.stringify(v) + "\n};");
      src = src.replace(/(const FLAG_ICON_CREDITS = \{[^\n]*)\};/, (m, head) => head + ", " + JSON.stringify(k) + ": \"Politiskel (drawn)\"};");
      if (!src.includes("\n  " + k + ": ")) throw new Error("could not add " + k + " to site/src/lib/flag/icons.js");
    }
  }
  fs.writeFileSync(file, src);
  console.log("drew " + Object.keys(ICONS).join(", "));
}

module.exports = { ICONS };
