/* Drawing a badge: the helpers every scene shares, and the frame around a
   scene. A scene is { rim, ink, art(id, level) }, drawn in a 200 box and
   clipped to a disc of radius 68; level is 1, 2 or 3 (60, 75, 90), and the
   frame grows with it: a plain ring, a studded ring, a scalloped rosette.
   Everything is SVG as a string, so a badge is drawn with {@html}. Every
   gradient id is prefixed with the badge's own id, so that badges on the
   same page never share one; the frame's own ids take a hyphen, which no
   scene uses, so that they never meet a scene's. */

let uid = 0;
export const star = (cx, cy, r1, r2, n = 5, rot = -90) => {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1, a = (rot + i * 180 / n) * Math.PI / 180;
    d += (i ? "L" : "M") + (cx + r * Math.cos(a)).toFixed(1) + " " + (cy + r * Math.sin(a)).toFixed(1);
  }
  return d + "Z";
};
export const person = (x, y, s = 1, fill = "#2b2b2b") =>
  `<g fill="${fill}" transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-17" r="5"/><path d="M-7 0 Q-7 -11 0 -11 Q7 -11 7 0 Z"/></g>`;
export const cloud = (x, y, s = 1, o = 0.95) =>
  `<g fill="#fff" opacity="${o}" transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="0" r="7"/><circle cx="9" cy="-4" r="9"/><circle cx="19" cy="0" r="7"/><rect x="0" y="0" width="19" height="7"/></g>`;
export const blade = (cx, cy, len, rot, col) =>
  [0, 120, 240].map(a => `<path d="M${cx} ${cy} q2 ${-len * 0.5} 0 ${-len} q-3 ${len * 0.45} 0 ${len}" fill="${col}" transform="rotate(${rot + a} ${cx} ${cy})"/>`).join("");
export const turbine = (x, base, h, rot, s = 1) =>
  `<g><path d="M${x - 1.6 * s} ${base} L${x - 0.7 * s} ${base - h} L${x + 0.7 * s} ${base - h} L${x + 1.6 * s} ${base} Z" fill="#f4f6f8"/>` +
  blade(x, base - h, h * 0.55, rot, "#fbfcfd") + `<circle cx="${x}" cy="${base - h}" r="${2.2 * s}" fill="#d6dde3"/></g>`;

export const sky = (id, stops) => `<defs><linearGradient id="${id}k" x1="0" y1="0" x2="0" y2="1">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join("")}</linearGradient></defs><rect width="200" height="200" fill="url(#${id}k)"/>`;
export const starfield = (n, seed = 7) => { let s = seed, out = ""; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) out += `<circle cx="${(30 + r() * 140).toFixed(1)}" cy="${(30 + r() * 80).toFixed(1)}" r="${(0.6 + r() * 1.1).toFixed(1)}" fill="#fff" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`; return out; };
export const tower = (x, top, w, id) => `<path d="M${x - w * 0.55} 160 Q${x - w * 0.2} ${top + (160 - top) * 0.45} ${x - w * 0.5} ${top} L${x + w * 0.5} ${top} Q${x + w * 0.2} ${top + (160 - top) * 0.45} ${x + w * 0.55} 160 Z" fill="url(#${id}t)"/><path d="M${x - w * 0.5} ${top} H${x + w * 0.5} l-.6 3.5 H${x - w * 0.5 + 0.6} Z" fill="#6b747c"/>`;

/* ---------- frames by tier ---------- */
export function drawBadge(a, tier, label, size = 200) {
  const id = "b" + (uid++), c = a.rim, ink = a.ink;
  const clip = `<clipPath id="${id}-clip"><circle cx="100" cy="100" r="68"/></clipPath>`;
  let back = "", ring = "", front = "";
  if (tier === 1) {
    ring = `<circle cx="100" cy="100" r="80" fill="#fbf8f1"/><circle cx="100" cy="100" r="80" fill="none" stroke="${c}" stroke-width="3"/>
            <circle cx="100" cy="100" r="70" fill="none" stroke="${c}" stroke-width="3" opacity=".9"/>`;
  } else if (tier === 2) {
    ring = `<circle cx="100" cy="100" r="84" fill="${c}"/><circle cx="100" cy="100" r="84" fill="none" stroke="${ink}" stroke-width="2"/>
            <circle cx="100" cy="100" r="70" fill="none" stroke="#fff" stroke-width="3"/>` +
      Array.from({length: 24}, (_, i) => { const t = i * 15 * Math.PI / 180; return `<circle cx="${100 + 77 * Math.cos(t)}" cy="${100 + 77 * Math.sin(t)}" r="1.9" fill="#fff" opacity=".85"/>`; }).join("");
  } else {
    back = `<g opacity=".9">${Array.from({length: 24}, (_, i) => `<path d="M100 100 L${100 + 99 * Math.cos((i * 15 - 3) * Math.PI / 180)} ${100 + 99 * Math.sin((i * 15 - 3) * Math.PI / 180)} L${100 + 99 * Math.cos((i * 15 + 3) * Math.PI / 180)} ${100 + 99 * Math.sin((i * 15 + 3) * Math.PI / 180)} Z" fill="${c}" opacity="${i % 2 ? .45 : .8}"/>`).join("")}</g>`;
    let d = "";
    for (let i = 0; i < 36; i++) {
      const t0 = i * 10 * Math.PI / 180, t1 = (i * 10 + 5) * Math.PI / 180;
      d += (i ? "L" : "M") + (100 + 86 * Math.cos(t0)).toFixed(1) + " " + (100 + 86 * Math.sin(t0)).toFixed(1)
        + "L" + (100 + 80 * Math.cos(t1)).toFixed(1) + " " + (100 + 80 * Math.sin(t1)).toFixed(1);
    }
    ring = `<path d="${d}Z" fill="${ink}"/><circle cx="100" cy="100" r="78" fill="${c}"/>
            <circle cx="100" cy="100" r="74" fill="none" stroke="#ffe7a0" stroke-width="1.5"/>
            <circle cx="100" cy="100" r="70" fill="none" stroke="#fff" stroke-width="3"/>` +
      [-90, -60, -120].map(deg => { const t = deg * Math.PI / 180; return `<path d="${star(100 + 76 * Math.cos(t), 100 + 76 * Math.sin(t), deg === -90 ? 7 : 4.5, deg === -90 ? 2.8 : 1.8)}" fill="#ffe7a0"/>`; }).join("");
  }
  return `<svg viewBox="-4 -4 208 208" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><defs>${clip}</defs>
    ${back}${ring}<g clip-path="url(#${id}-clip)">${a.art(id, tier)}</g>
    <circle cx="100" cy="100" r="68" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="1"/>
    <path d="M44 62 A66 66 0 0 1 120 34" stroke="#fff" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${front}${ribbon(c, ink, tier, label, id)}</svg>`;
}
function ribbon(c, ink, tier, label, id) {
  const x1 = [50, 44, 38][tier - 1], x2 = 200 - x1, y = 160, h = [13, 15, 18][tier - 1], tail = [10, 12, 14][tier - 1];
  const mid = y + h / 2 + 5;
  const fs = Math.min([9.5, 10.5, 11.5][tier - 1], (x2 - x1 - 16) / (label.length * 0.56));
  return `<path d="M${x1 - tail} ${y + 4} L${x1 + 2} ${y + 4} L${x1 + 2} ${y + h + 4} L${x1 - tail} ${y + h + 4} L${x1 - tail + 6} ${y + h / 2 + 4} Z" fill="${ink}"/>
    <path d="M${x2 + tail} ${y + 4} L${x2 - 2} ${y + 4} L${x2 - 2} ${y + h + 4} L${x2 + tail} ${y + h + 4} L${x2 + tail - 6} ${y + h / 2 + 4} Z" fill="${ink}"/>
    <path d="M${x1} ${y} Q100 ${y + 10} ${x2} ${y} L${x2} ${y + h} Q100 ${y + h + 10} ${x1} ${y + h} Z" fill="${tier === 1 ? '#fbf8f1' : c}" stroke="${ink}" stroke-width="${tier === 1 ? 1.2 : 1.5}"/>
    <path id="${id}-ribbon" d="M${x1} ${mid - 5 + fs * 0.36} Q100 ${mid + 5 + fs * 0.36} ${x2} ${mid - 5 + fs * 0.36}" fill="none"/>
    <text font-family="Geist, sans-serif" font-weight="700" font-size="${fs.toFixed(1)}" fill="${tier === 1 ? ink : '#fff'}" text-anchor="middle"><textPath href="#${id}-ribbon" startOffset="50%">${label}</textPath></text>
    ${tier === 3 ? `<path d="${star(x1 - tail + 12, y + h / 2 + 4, 3.2, 1.3)}" fill="#ffe7a0"/><path d="${star(x2 + tail - 12, y + h / 2 + 4, 3.2, 1.3)}" fill="#ffe7a0"/>` : ""}`;
}

