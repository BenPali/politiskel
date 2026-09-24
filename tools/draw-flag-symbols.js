#!/usr/bin/env node
/* The flag symbols drawn for Politiskel, where game-icons.net's did not read
   at flag size: the broken chain, the globe, the Phrygian cap, the croix de
   guerre, the crown and the column. Each is built here from plain shapes in
   the 512 × 512 box the other symbols use, and written into
   web/flag-icons.js in place of its previous entry:

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

if (require.main === module) {
  const file = path.join(__dirname, "..", "web", "flag-icons.js");
  let src = fs.readFileSync(file, "utf8");
  for (const [k, v] of Object.entries(ICONS)) {
    const re = new RegExp("\\n  " + k + ": \\[[^\\n]*\\],?(?=\\n)");
    if (!re.test(src)) throw new Error("no entry for " + k + " in web/flag-icons.js");
    src = src.replace(re, m => "\n  " + k + ": " + JSON.stringify(v) + (m.endsWith(",") ? "," : ""));
  }
  fs.writeFileSync(file, src);
  console.log("drew " + Object.keys(ICONS).join(", "));
}

module.exports = { ICONS };
