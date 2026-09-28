import { ART } from './base.js';
import { star, person, cloud, blade, turbine, sky, starfield, tower } from '../draw.js';

/* Level-dependent scenes: robin, hand, camarade, customs, factory, hussard. t is 1, 2 or 3. */
(() => {
const coin = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse rx="7" ry="4" fill="#f2c230" stroke="#a87a10"/><ellipse cy="-1" rx="4" ry="1.8" fill="#ffe27a"/></g>`;
const smoke = (pts, fill, o = 0.9) => `<g fill="${fill}" opacity="${o}">${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`;
const wheatSheaves = () => [-1, 1].map(s => `<g transform="translate(100 0) scale(${s} 1)">` + Array.from({length: 7}, (_, i) => `<ellipse cx="${30 + i * 2}" cy="${150 - i * 13}" rx="4" ry="9" fill="#f2c230" stroke="#a87a10" stroke-width=".8" transform="rotate(${30 - i * 6} ${30 + i * 2} ${150 - i * 13})"/>`).join("") + `<path d="M26 160 Q20 110 44 66" stroke="#a87a10" stroke-width="2" fill="none"/></g>`).join("");
const rays = (cx, cy, n, fill, o) => `<g opacity="${o}" fill="${fill}">${Array.from({length: n}, (_, i) => { const a = i * 2 * Math.PI / n, b = a + Math.PI / n * 0.8; return `<path d="M${cx} ${cy} L${cx + 160 * Math.cos(a)} ${cy + 160 * Math.sin(a)} L${cx + 160 * Math.cos(b)} ${cy + 160 * Math.sin(b)} Z"/>`; }).join("")}</g>`;
const house = (x, y, s, wall, roof, lit) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-8" y="-10" width="16" height="10" fill="${wall}"/><path d="M-10 -10 L0 -18 L10 -10 Z" fill="${roof}"/><rect x="-5" y="-7" width="4" height="4" fill="${lit}"/><rect x="2" y="-6" width="3.5" height="6" fill="#5a3b1c"/></g>`;

/* ---------- Redistribution ---------- */
ART.robin.art = (id, t = 2) => {
  if (t === 1) return sky(id, ["#cfe8f6", "#f7f0d8"]) + `
    <defs><pattern id="${id}ck" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#fbf6ea"/><rect width="5" height="5" fill="#d8574a"/><rect x="5" y="5" width="5" height="5" fill="#d8574a"/></pattern></defs>
    <circle cx="150" cy="58" r="11" fill="#ffd66b"/>${cloud(40, 62, 0.9, 0.9)}
    <path d="M0 124 Q60 110 120 120 T200 116 V200 H0 Z" fill="#a9cf7c"/>
    <g transform="translate(0 -12)"><path d="M36 158 L58 122 H142 L164 158 Z" fill="url(#${id}ck)" stroke="#b5462f" stroke-width="1"/>
    <ellipse cx="62" cy="142" rx="13" ry="4.5" fill="#fff" stroke="#c9c2b0"/><ellipse cx="140" cy="146" rx="13" ry="4.5" fill="#fff" stroke="#c9c2b0"/>
    <ellipse cx="100" cy="128" rx="30" ry="10" fill="#c98a3a"/><ellipse cx="100" cy="126" rx="26" ry="8" fill="#e4573a"/>
    <g stroke="#9a5a1e" stroke-width="1.3">${[0, 60, 120].map(a => { const r = a * Math.PI / 180; return `<path d="M${100 - 26 * Math.cos(r)} ${126 - 8 * Math.sin(r)} L${100 + 26 * Math.cos(r)} ${126 + 8 * Math.sin(r)}"/>`; }).join("")}</g>
    ${[[92,124],[106,127],[98,130],[112,123],[86,128]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#ff9a8a"/>`).join("")}
    <path d="M132 144 L150 140 L149 147 Z" fill="#e4573a" stroke="#c98a3a" stroke-width="2" stroke-linejoin="round"/>
    <path d="M58 142 L66 139 L65 145 Z" fill="#e4573a" stroke="#c98a3a" stroke-width="2" stroke-linejoin="round"/></g>`;
  if (t === 2) return sky(id, ["#e7d8a8", "#b9cf8c"]) + `
    ${[[20,160,26],[48,150,34],[152,152,32],[182,160,26],[76,160,22],[124,160,22]].map(([x,b,h]) => `<rect x="${x - 2}" y="${b - 8}" width="4" height="12" fill="#5a3b1c"/><path d="M${x} ${b - h - 30} L${x + h * 0.55} ${b - 6} H${x - h * 0.55} Z" fill="#2f5f2c"/><path d="M${x} ${b - h - 30} L${x + h * 0.4} ${b - 26} H${x - h * 0.4} Z" fill="#3c7437"/>`).join("")}
    <path d="M0 156 H200 V200 H0 Z" fill="#5f7e3a"/>
    <path d="M44 106 C60 98 80 70 104 62 C122 56 138 64 150 76 C140 80 132 90 128 104 Z" fill="#3b7a34" stroke="#244d20" stroke-width="1.5"/>
    <path d="M104 62 C112 74 116 88 118 104" stroke="#2c5e27" stroke-width="1.2" fill="none"/>
    <path d="M40 106 C70 100 120 98 156 104 C158 110 152 114 144 112 C110 106 76 108 48 114 C40 115 36 110 40 106 Z" fill="#2f6429" stroke="#244d20" stroke-width="1.2"/>
    <path d="M124 92 C134 60 156 40 180 30 C172 52 156 74 134 96 Z" fill="#c9302c"/><path d="M128 94 L176 34" stroke="#8d1f1b" stroke-width="1.2"/>
    ${[0,1,2,3,4].map(i => `<path d="M${136 + i * 8} ${80 - i * 10} l-6 -2" stroke="#8d1f1b" stroke-width=".9"/>`).join("")}
    <path d="M40 142 L160 120" stroke="#6b4a2e" stroke-width="3"/><path d="M160 120 l-10 -4 l3 6 l-4 5 Z" fill="#aaa"/>
    <path d="M40 142 l-6 -8 M40 142 l-9 -2 M44 141 l-6 -8 M44 141 l-9 -2" stroke="#c9302c" stroke-width="2"/>
    ${[[70,150],[90,152],[112,150],[132,153]].map(([x,y]) => coin(x, y)).join("")}`;
  /* level 3: the billionaire's bag pierced by arrows, its gold pouring out onto the village */
  const arrow = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0 H38" stroke="#3a2412" stroke-width="3"/><path d="M-2 0 l9 -4 v8 Z" fill="#c9ccd2" stroke="#6a6a70" stroke-width=".6"/><path d="M32 0 l8 -6 M32 0 l8 6 M36 0 l8 -6 M36 0 l8 6" stroke="#c9302c" stroke-width="2"/></g>`;
  return sky(id, ["#2e1838", "#a8403a", "#ffb45a"]) + `
    <defs><radialGradient id="${id}bg" cx=".38" cy=".35"><stop offset="0" stop-color="#f0d38a"/><stop offset="1" stop-color="#9a7430"/></radialGradient>
    <radialGradient id="${id}gl"><stop offset="0" stop-color="#ffe27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/></radialGradient></defs>
    ${starfield(8, 5)}
    <path d="M0 118 Q50 100 100 112 T200 106 V200 H0 Z" fill="#6a3444"/>
    <g fill="#3a1e2c">
      <path d="M18 116 V80 h4 v-4 h3 v4 h3 v-4 h3 v4 h4 V116 Z"/><path d="M44 114 V70 h4 v-4 h3 v4 h3 v-4 h3 v4 h4 V114 Z"/>
      <rect x="30" y="92" width="18" height="24"/><path d="M43 70 L52.5 54 L62 70 Z"/></g>
    <g fill="#ffd35a">${[[23,86],[23,98],[50,78],[56,90],[37,100]].map(([x,y]) => `<rect x="${x}" y="${y}" width="3" height="4.5"/>`).join("")}</g>
    <path d="M0 134 Q60 124 120 132 T200 128 V200 H0 Z" fill="#5f7e3a"/>
    <path d="M0 146 Q80 140 200 146 V200 H0 Z" fill="#4c6a2e"/>
    ${[[24,142,1.1,"#f4e2c0"],[46,140,1,"#efd8b0"],[68,144,1.1,"#f4e2c0"]].map(([x,y,s,w]) => house(x, y, s, w, "#b5462f", "#ffd35a")).join("")}
<g transform="translate(-22 0)">    <circle cx="140" cy="110" r="46" fill="url(#${id}gl)"/>
    <ellipse cx="142" cy="150" rx="30" ry="5" fill="#2e3f1a" opacity=".6"/>
    <path d="M128 70 C104 84 104 150 142 150 C180 150 180 84 156 70 Z" fill="url(#${id}bg)" stroke="#6b4a1a" stroke-width="1.5"/>
    <path d="M126 70 C124 62 132 58 142 60 C152 58 160 62 158 70 Q142 76 126 70 Z" fill="#b08a44" stroke="#6b4a1a" stroke-width="1.2"/>
    <path d="M127 70 Q142 78 157 70" stroke="#c9302c" stroke-width="4" fill="none"/>
    <circle cx="142" cy="112" r="12" fill="#f2c230" stroke="#a87a10" stroke-width="1.5"/><path d="${star(142, 112, 7, 3)}" fill="#a87a10"/>
    <path d="M110 126 q-4 4 0 8 q4 -2 3 -8 Z" fill="#3a2410"/>
    ${[[108,130,0.9],[100,134,0.85],[92,137,0.8],[84,140,0.8],[96,142,0.75],[88,146,0.8],[80,148,0.85],[104,146,0.75]].map(([x,y,s]) => coin(x, y, s)).join("")}
    ${[[74,150],[82,151],[78,147],[90,152]].map(([x,y]) => coin(x, y, 0.85)).join("")}
    ${arrow(154, 94, -18)}${arrow(160, 120, 10)}${arrow(150, 136, 30)}
</g>
    <g transform="translate(168 48) rotate(24)"><rect x="-9" y="-17" width="18" height="17" fill="#1a1a1a"/><rect x="-9" y="-6" width="18" height="3" fill="#c9a24a"/><ellipse cx="0" cy="0" rx="15" ry="3.4" fill="#1a1a1a"/></g>
    <path d="M160 58 q-6 -4 -10 -2 M156 64 q-5 -1 -8 1" stroke="#fff" stroke-width="1" opacity=".6" fill="none"/>`;
};

/* ---------- Dérégulation ---------- */
ART.hand.art = (id, t = 2) => {
  if (t === 1) {
    const sheets = Array.from({length: 16}, (_, i) => `<rect x="${60 + ((i * 37) % 7) - 3}" y="${140 - (i + 1) * 4.6}" width="56" height="4.6" fill="${i % 2 ? '#fff' : '#f1ede4'}" stroke="#cfc8b8" stroke-width=".5"/>`).join("");
    return sky(id, ["#e3ecf2", "#f7f4ec"]) + `
      <rect x="0" y="0" width="200" height="140" fill="#e8eef0" opacity=".4"/>
      <rect x="126" y="44" width="40" height="30" fill="#fff" stroke="#b8c2c8"/><path d="M130 52 h32 M130 58 h24 M130 64 h28" stroke="#c8d0d6" stroke-width="1.5"/>
      <rect x="0" y="140" width="200" height="60" fill="#a8764a"/><rect x="0" y="140" width="200" height="4" fill="#c08a58"/>
      ${sheets}
      <path d="M60 104 h56 M60 118 h56" stroke="#c0392b" stroke-width="2.2"/>
      <g transform="translate(144 124)"><circle cx="0" cy="-20" r="6" fill="#5a3a22"/><rect x="-2.5" y="-15" width="5" height="10" fill="#6b4428"/><rect x="-10" y="-6" width="20" height="8" rx="2" fill="#3a3a3a"/><rect x="-10" y="1" width="20" height="2" fill="#c0392b"/></g>
      <g transform="translate(150 140) rotate(-6)"><rect x="-18" y="-6" width="32" height="10" fill="#fff" stroke="#cfc8b8"/><circle cx="0" cy="-1" r="3.6" fill="none" stroke="#c0392b" stroke-width="1.2"/></g>
      <path d="M36 150 L64 144" stroke="#1d3f73" stroke-width="3" stroke-linecap="round"/><path d="M64 144 l4 -1" stroke="#d9a21c" stroke-width="3"/>`;
  }
  if (t === 2) return `
    <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e2a24"/><stop offset="1" stop-color="#18453a"/></linearGradient>
    <radialGradient id="${id}c" cx=".4" cy=".35"><stop offset="0" stop-color="#fff2a8"/><stop offset="1" stop-color="#d9a21c"/></radialGradient></defs>
    <rect width="200" height="200" fill="url(#${id}s)"/>
    <g stroke="#2d6b5a" stroke-width=".8">${[40,60,80,100,120,140,160].map(v => `<path d="M${v} 0 V200 M0 ${v} H200"/>`).join("")}</g>
    ${[[40,150,20,30],[56,138,20,18],[72,146,20,28],[88,124,20,14],[104,130,20,24],[120,110,20,12],[136,116,20,20],[152,92,20,14]].map(([x,y,w,h],i) => `<path d="M${x + 10} ${y - 8} V${y + h + 8}" stroke="${i % 2 ? '#e05b4b' : '#3fd28e'}" stroke-width="1.5"/><rect x="${x + 5}" y="${y}" width="10" height="${h}" fill="${i % 2 ? '#e05b4b' : '#3fd28e'}"/>`).join("")}
    <path d="M36 150 L60 138 L82 142 L100 124 L126 112 L146 104 L170 80" fill="none" stroke="#bff5d8" stroke-width="2.5"/>
    <path d="M52 124 C52 110 60 104 72 104 L118 104 C126 104 130 110 126 114 L102 116 L140 116 C148 116 150 124 142 126 L110 128 L144 130 C152 131 152 139 144 140 L110 142 L136 144 C144 145 144 152 136 153 L96 156 C74 158 60 150 56 140 Z"
      fill="none" stroke="#e7fff2" stroke-width="2.2" stroke-dasharray="5 4" stroke-linejoin="round"/>
    <circle cx="98" cy="88" r="16" fill="url(#${id}c)" stroke="#a87a10" stroke-width="1.5"/>
    <circle cx="98" cy="88" r="11" fill="none" stroke="#b88a1a" stroke-width="1"/>
    <path d="${star(98, 88, 7, 3)}" fill="#8a620c"/>`;
  /* level 3: a chainsaw through the paperwork, shreds everywhere */
  let s = 17, shreds = "";
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 34; i++) { const x = 40 + r() * 130, y = 30 + r() * 100; shreds += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(4 + r() * 7).toFixed(1)}" height="${(3 + r() * 4).toFixed(1)}" fill="${r() > 0.3 ? '#fff' : '#f1ede4'}" stroke="#cfc8b8" stroke-width=".4" transform="rotate(${(r() * 360).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }
  const teeth = Array.from({length: 14}, (_, i) => `<path d="M${4 + i * 5} -6 l2.5 -3 l2.5 3 M${4 + i * 5} 6 l2.5 3 l2.5 -3" fill="#333" stroke="#333" stroke-width=".8"/>`).join("");
  return sky(id, ["#1a1030", "#6a1f4a", "#ff7a3a"]) + `
    <defs><linearGradient id="${id}bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1f4"/><stop offset="1" stop-color="#8a939c"/></linearGradient>
    <linearGradient id="${id}or" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb04a"/><stop offset="1" stop-color="#d9601a"/></linearGradient></defs>
    <path d="M30 140 L70 118 L96 124 L126 92 L150 96 L178 52" fill="none" stroke="#3fd28e" stroke-width="3" opacity=".8"/><path d="M178 52 l-11 3 l7 7 Z" fill="#3fd28e" opacity=".8"/>
    ${[[40,60],[160,120],[60,40],[150,40]].map(([x,y]) => coin(x, y, 0.8)).join("")}
    <g>${Array.from({length: 9}, (_, i) => `<rect x="${124 + (i % 3) - 1}" y="${152 - (i + 1) * 5}" width="46" height="5" fill="${i % 2 ? '#fff' : '#f1ede4'}" stroke="#cfc8b8" stroke-width=".5" transform="rotate(${i > 5 ? 8 : 0} 147 120)"/>`).join("")}</g>
    <g transform="rotate(-10 150 140)">${Array.from({length: 6}, (_, i) => `<rect x="${118 - i}" y="${150 - (i + 1) * 5 + 30}" width="46" height="5" fill="${i % 2 ? '#fff' : '#f1ede4'}" stroke="#cfc8b8" stroke-width=".5"/>`).join("")}</g>
    ${shreds}
    <g transform="translate(96 112) rotate(-8)">
      <rect x="0" y="-7" width="76" height="14" rx="7" fill="url(#${id}bar)" stroke="#555" stroke-width="1"/>${teeth}
      <rect x="-50" y="-18" width="54" height="34" rx="8" fill="url(#${id}or)" stroke="#8a3a0a" stroke-width="1.5"/>
      <path d="M-46 -18 C-46 -36 -10 -36 -10 -18" fill="none" stroke="#2a2a2a" stroke-width="5" stroke-linecap="round"/>
      <rect x="-40" y="-10" width="20" height="4" rx="2" fill="#2a2a2a"/><rect x="-40" y="-2" width="20" height="4" rx="2" fill="#2a2a2a"/><rect x="-40" y="6" width="20" height="4" rx="2" fill="#2a2a2a"/>
      <circle cx="-4" cy="0" r="6" fill="#2a2a2a"/><circle cx="-4" cy="0" r="2.5" fill="#888"/>
      <path d="M-50 10 C-62 8 -66 16 -60 22" stroke="#555" stroke-width="3" fill="none"/></g>
    <g stroke="#ffe27a" stroke-width="1.6" stroke-linecap="round">${[[118,100,112,86],[124,100,128,84],[130,104,142,94],[116,106,104,98],[126,108,138,112]].map(([a,b,c,d]) => `<path d="M${a} ${b} L${c} ${d}"/>`).join("")}</g>
    ${smoke([[40,98,6],[32,92,5],[26,86,4]], "#cfc3e8", 0.7)}`;
};

/* ---------- Communisme ---------- */
ART.camarade.art = (id, t = 2) => {
  if (t === 1) return sky(id, ["#ffd9a0", "#fff0d2"]) + `
    <circle cx="112" cy="132" r="28" fill="#ffb14a"/><circle cx="112" cy="132" r="38" fill="#ffb14a" opacity=".25"/>
    ${cloud(34, 70, 0.9, 0.85)}
    <path d="M0 132 H200 V200 H0 Z" fill="#e2b64a"/>
    <g stroke="#b88a1a" stroke-width="1.2">${Array.from({length: 22}, (_, i) => `<path d="M${6 + i * 9} 158 V${138 + (i % 3) * 2}"/><ellipse cx="${6 + i * 9}" cy="${136 + (i % 3) * 2}" rx="1.8" ry="4" fill="#f2c230"/>`).join("")}</g>
    <path d="M70 156 V58" stroke="#6b4a2e" stroke-width="3"/><circle cx="70" cy="57" r="3" fill="#d9a21c"/>
    <path d="M71 60 C88 54 100 68 122 60 V92 C100 100 88 86 71 92 Z" fill="#b3261e"/>
    <path d="${star(84, 70, 6, 2.5)}" fill="#ffd35a"/>`;
  if (t === 2) return `
    <defs><radialGradient id="${id}s" cx=".5" cy=".3"><stop offset="0" stop-color="#ffcf6a"/><stop offset="1" stop-color="#e2582f"/></radialGradient>
    <linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a3a"/><stop offset="1" stop-color="#0e0e0e"/></linearGradient></defs>
    <rect width="200" height="200" fill="url(#${id}s)"/>
    ${rays(100, 96, 16, "#fff", 0.22)}
    ${wheatSheaves()}
    <ellipse cx="100" cy="82" rx="44" ry="15" fill="#6b7a44" stroke="#3f4a24" stroke-width="1.2"/>
    <path d="M60 84 Q100 74 140 84 L134 106 Q100 112 66 106 Z" fill="#56643a"/>
    <path d="M66 104 Q100 110 134 104 L133 116 Q100 122 67 116 Z" fill="#b3261e" stroke="#6e140e" stroke-width="1"/>
    <path d="M66 116 Q100 124 134 116 Q130 132 100 134 Q70 132 66 116 Z" fill="url(#${id}v)"/>
    <path d="M78 122 Q100 128 122 122" stroke="#666" stroke-width="1.2" fill="none"/>
    <circle cx="100" cy="100" r="9" fill="#ffd35a" stroke="#8a5a10" stroke-width="1"/><path d="${star(100, 100, 7, 2.9)}" fill="#b3261e"/>
    <path d="M0 150 H200 V200 H0 Z" fill="#8e1c15"/>`;
  /* level 3: a five-year-plan poster: the dam, the tractors, two heroes facing the dawn */
  const tractor = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-10" y="-9" width="14" height="7" rx="1" fill="#b3261e"/><rect x="-2" y="-16" width="8" height="8" fill="#8e1c15"/><rect x="0" y="-14" width="4" height="4" fill="#ffe7a0"/>
    <path d="M-8 -9 v-6" stroke="#333" stroke-width="1.6"/><circle cx="-7" cy="0" r="4" fill="#2a1a14"/><circle cx="-7" cy="0" r="1.6" fill="#ffd35a"/><circle cx="4" cy="-2" r="6" fill="#2a1a14"/><circle cx="4" cy="-2" r="2.4" fill="#ffd35a"/></g>`;
  return sky(id, ["#9e1a12", "#e2582f", "#ffcf6a"]) + `
    <defs><linearGradient id="${id}dm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9c6a8"/><stop offset="1" stop-color="#8a7866"/></linearGradient>
    <linearGradient id="${id}sk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b87a54"/><stop offset="1" stop-color="#f2c69a"/></linearGradient>
    <linearGradient id="${id}wt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f4ff"/><stop offset="1" stop-color="#7ab0d8"/></linearGradient></defs>
    <g opacity=".35">${Array.from({length: 18}, (_, i) => { const a = (-180 + i * 10) * Math.PI / 180, b = a + 0.09; return `<path d="M128 52 L${128 + 220 * Math.cos(a)} ${52 + 220 * Math.sin(a)} L${128 + 220 * Math.cos(b)} ${52 + 220 * Math.sin(b)} Z" fill="${i % 2 ? '#ffe27a' : '#b3261e'}"/>`; }).join("")}${Array.from({length: 18}, (_, i) => { const a = (i * 10) * Math.PI / 180, b = a + 0.09; return `<path d="M128 52 L${128 + 220 * Math.cos(a)} ${52 + 220 * Math.sin(a)} L${128 + 220 * Math.cos(b)} ${52 + 220 * Math.sin(b)} Z" fill="${i % 2 ? '#ffe27a' : '#b3261e'}"/>`; }).join("")}</g>
    <circle cx="128" cy="52" r="18" fill="#fff2a0" opacity=".6"/>
    <path d="${star(128, 52, 15, 6.2)}" fill="#b3261e" stroke="#ffd35a" stroke-width="1.8"/>
    <path d="M90 60 L96 58 L104 128 H94 Z M190 56 L196 58 L200 128 H188 Z" fill="#5e110a" opacity=".0"/>
    <path d="M96 76 Q146 66 200 72 V124 Q146 116 100 124 Z" fill="url(#${id}dm)" stroke="#5a4a3a" stroke-width="1"/>
    <g stroke="#6a5a48" stroke-width=".8" opacity=".7">${[112,128,144,160,176,192].map(x => `<path d="M${x} ${73 - (x - 100) * 0.02} V${122 - (x - 100) * 0.05}"/>`).join("")}</g>
    <path d="M96 76 Q146 66 200 72 V78 Q146 72 97 82 Z" fill="#ece0c8"/>
    ${[124,146,168].map(x => `<rect x="${x - 5}" y="${90}" width="10" height="34" fill="url(#${id}wt)" opacity=".95"/><path d="M${x - 5} 124 q5 6 10 0" fill="#fff"/>`).join("")}
    <path d="M96 124 Q146 116 200 122 V138 H96 Z" fill="#7ab0d8"/>
    <path d="M104 130 q10 -3 20 0 M140 128 q12 -3 24 0 M176 131 q10 -3 20 0" stroke="#e8f4ff" stroke-width="1.2" fill="none"/>
    <g stroke="#5e110a" stroke-width="1.4" fill="none"><path d="M186 72 L190 44 L194 72 M187 62 H193 M188 52 H192"/></g>
    <path d="M0 138 H200 V200 H0 Z" fill="#c9a24a"/>
    <path d="M96 150 L200 142 V150 L100 158 Z" fill="#8a6a2e"/>
    ${tractor(178, 146, 0.9)}${tractor(156, 148, 0.95)}${tractor(132, 151, 1)}
    <g stroke="#a87a10" stroke-width="1">${Array.from({length: 11}, (_, i) => `<path d="M${6 + i * 9} 158 V${142 + (i % 3) * 2}"/>`).join("")}</g>
    <g transform="translate(44 2)">
      <path d="M38 160 C38 128 46 112 62 110 C80 112 86 128 86 160 Z" fill="#6e140e"/>
      <path d="M62 110 C74 112 84 124 86 160 H70 C72 134 68 118 62 110 Z" fill="#8e1c15"/>
      <path d="M55 102 V112 H66 V102 Z" fill="url(#${id}sk)"/>
      <path d="M52 94 C52 84 58 80 64 80 C70 80 74 86 72 96 C71 102 67 106 62 106 C57 106 53 101 52 94 Z" fill="url(#${id}sk)"/>
      <path d="M71 92 l3 2 l-3 1" fill="#c88a60"/>
      <path d="M50 88 C50 78 58 74 66 76 C72 77 76 82 76 86 L82 88 L74 90 C66 88 58 88 50 90 Z" fill="#3a3a3a"/>
      <path d="M78 116 L84 120 L102 70" stroke="#5a3b1c" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      <path d="M93 64 L110 70 L108 77 L91 71 Z" fill="#8a939c" stroke="#3a3f44"/>
      <path d="M76 116 C80 114 86 116 86 122 C86 126 80 128 76 124 Z" fill="url(#${id}sk)"/></g>
    <g transform="translate(24 6)">
      <path d="M8 160 C8 132 16 120 30 118 C44 120 52 132 52 160 Z" fill="#b3261e"/>
      <path d="M30 118 C42 120 50 132 52 160 H40 C42 140 38 126 30 118 Z" fill="#d23a2e"/>
      <path d="M24 110 V120 H34 V110 Z" fill="url(#${id}sk)"/>
      <path d="M21 104 C21 95 26 91 31 91 C37 91 41 97 39 105 C38 111 35 114 30 114 C25 114 22 110 21 104 Z" fill="url(#${id}sk)"/>
      <path d="M38 101 l3 2 l-3 1" fill="#c88a60"/>
      <path d="M18 106 C16 92 24 86 32 86 C40 86 44 92 42 98 C36 94 28 94 24 100 C22 106 22 114 18 118 C14 116 16 110 18 106 Z" fill="#e0321e"/>
      <path d="M18 116 L10 124 L20 122 Z" fill="#e0321e"/>
      <g transform="translate(48 118) rotate(-24)">${Array.from({length: 6}, (_, i) => `<ellipse cx="${-5 + (i % 3) * 5}" cy="${-30 + Math.floor(i / 3) * 8}" rx="3" ry="7" fill="#f2c230" stroke="#a87a10" stroke-width=".7"/>`).join("")}
        <path d="M-6 -24 L-2 10 M0 -24 L0 10 M6 -24 L2 10" stroke="#a87a10" stroke-width="1.4"/><path d="M-4 -4 H4" stroke="#b3261e" stroke-width="2.5"/></g>
      <path d="M44 124 C48 120 54 122 54 128 C52 132 46 132 44 128 Z" fill="url(#${id}sk)"/></g>`;
};

/* ---------- Protectionnisme ---------- */
ART.customs.art = (id, t = 2) => {
  if (t === 1) {
    const crate = (x, fruit) => `<rect x="${x}" y="112" width="30" height="14" fill="#c8995a" stroke="#7a5230"/><path d="M${x} 119 h30" stroke="#7a5230" stroke-width=".8"/>${fruit(x)}`;
    return sky(id, ["#cde9f7", "#fbf4e2"]) + `
      <circle cx="40" cy="56" r="10" fill="#ffd66b"/>
      <path d="M0 140 H200 V200 H0 Z" fill="#cdbb9a"/>
      <g stroke="#b3a27f" stroke-width="1">${[146,152].map(y => `<path d="M0 ${y} H200"/>`).join("")}${Array.from({length: 14}, (_, i) => `<path d="M${i * 15 + (i % 2) * 7} 140 v6 M${i * 15} 146 v6"/>`).join("")}</g>
      <path d="M48 150 V80 M152 150 V80" stroke="#7a5230" stroke-width="3"/>
      ${Array.from({length: 10}, (_, i) => `<rect x="${40 + i * 12}" y="70" width="12" height="16" fill="${i % 2 ? '#fff' : '#3f8a4a'}"/>`).join("")}
      <path d="M40 86 ${Array.from({length: 10}, (_, i) => `a6 6 0 0 0 12 0`).join(" ")}" fill="${'#3f8a4a'}" stroke="#2f6b33" stroke-width=".8"/>
      <path d="M40 70 H160" stroke="#2f6b33" stroke-width="2"/>
      <rect x="44" y="126" width="112" height="24" fill="#a8764a"/><rect x="44" y="124" width="112" height="4" fill="#c08a58"/>
      ${crate(48, x => [0,1,2,3,4].map(i => `<circle cx="${x + 5 + i * 5}" cy="${110 - (i % 2) * 2}" r="4" fill="#d9362a"/>`).join(""))}
      ${crate(85, x => [0,1,2,3].map(i => `<path d="M${x + 4 + i * 7} 112 l3 -12 l3 12 Z" fill="#f08a24"/><path d="M${x + 7 + i * 7} 100 l-2 -4 M${x + 7 + i * 7} 100 l2 -4" stroke="#3f8a4a" stroke-width="1.4"/>`).join(""))}
      ${crate(122, x => [0,1,2,3,4].map(i => `<circle cx="${x + 5 + i * 5}" cy="${110 - (i % 2) * 2}" r="4" fill="#8cc63f"/>`).join(""))}
      <g transform="translate(166 150)"><path d="M-12 -12 H12 L9 0 H-9 Z" fill="#b98a4a" stroke="#7a5230"/><path d="M-10 -12 Q0 -26 10 -12" stroke="#7a5230" stroke-width="2" fill="none"/><circle cx="-4" cy="-14" r="3.5" fill="#d9362a"/><circle cx="3" cy="-15" r="3.5" fill="#8cc63f"/></g>`;
  }
  const containers = (list) => list.map(([x,y,c]) => `<rect x="${x}" y="${y}" width="44" height="20" fill="${c}" stroke="#1f2a30" stroke-width="1"/>` + [1,2,3,4,5,6,7].map(i => `<path d="M${x + i * 5.5} ${y + 2} V${y + 18}" stroke="#000" stroke-opacity=".22"/>`).join("")).join("");
  const barrier = (x, y, w, rot) => `<g transform="rotate(${rot} ${x + w} ${y + 3})"><rect x="${x}" y="${y}" width="${w}" height="6" fill="#fff" stroke="#333" stroke-width=".8"/>${Array.from({length: Math.floor(w / 16)}, (_, i) => `<rect x="${x + 4 + i * 16}" y="${y}" width="8" height="6" fill="#d23a2e"/>`).join("")}</g>`;
  if (t === 2) return sky(id, ["#9bd0ea", "#e6f3f8"]) + `
    <path d="M0 132 H200 V200 H0 Z" fill="#7d8d98"/>
    ${containers([[20,92,"#c0392b"],[20,112,"#2d6f8e"],[64,112,"#e0a526"],[64,92,"#3f7a3a"],[42,72,"#8e44ad"]])}
    <rect x="120" y="84" width="46" height="48" fill="#f3efe4" stroke="#39434a" stroke-width="1.5"/>
    <path d="M114 84 H172 L166 74 H120 Z" fill="#2d6f8e"/>
    <rect x="120" y="76" width="46" height="8" fill="#0e3345"/><path d="${star(143, 80, 3.2, 1.3)}" fill="#ffd35a"/>
    <rect x="126" y="92" width="34" height="18" fill="#a9d4ea" stroke="#39434a"/>
    <g transform="translate(143 108)"><path d="M-8 0 Q-8 -8 0 -8 Q8 -8 8 0 Z" fill="#1c3a5a"/><rect x="-9" y="-12" width="18" height="5" rx="1" fill="#0e2438"/><rect x="-10" y="-8" width="20" height="2" fill="#111"/><circle cx="0" cy="-3" r="3.5" fill="#e7b58c"/></g>
    <rect x="112" y="118" width="6" height="22" fill="#39434a"/>
    ${barrier(18, 116, 96, -4)}
    <path d="M100 200 L104 132 H112 L140 200 Z" fill="#646f78"/>`;
  /* level 3: a wall around the whole market */
  const crenels = (x0, x1, y) => Array.from({length: Math.floor((x1 - x0) / 10)}, (_, i) => `<rect x="${x0 + i * 10}" y="${y - 6}" width="6" height="6"/>`).join("");
  const bricks = Array.from({length: 7}, (_, r) => Array.from({length: 12}, (_, i) => `<rect x="${i * 18 + (r % 2) * 9 - 9}" y="${96 + r * 8}" width="18" height="8" fill="none" stroke="#7a6f62" stroke-width=".7"/>`).join("")).join("");
  const tower2 = (x) => `<rect x="${x - 14}" y="62" width="28" height="92" fill="#a39888" stroke="#6b6154"/><path d="M${x - 17} 62 L${x} 38 L${x + 17} 62 Z" fill="#b5462f" stroke="#7a2a1a"/>
    <path d="M${x} 38 V24" stroke="#555" stroke-width="1.5"/><path d="M${x + 1} 25 h12 l-3 4 l3 4 h-12 Z" fill="#2d6f8e"/><rect x="${x - 4}" y="76" width="8" height="12" rx="4" fill="#2a2a33"/>
    <rect x="${x - 4}" y="104" width="8" height="12" rx="4" fill="#2a2a33"/>`;
  return sky(id, ["#46607a", "#9fb4c4", "#d9e2e6"]) + `
    ${smoke([[30,40,10],[46,34,12],[64,42,9],[140,36,10],[158,30,12],[176,40,9]], "#6f7f8e", 0.6)}
    <g fill="#8f8474">${crenels(0, 200, 96)}</g>
    <rect x="0" y="96" width="200" height="60" fill="#9a8f80"/>
    ${bricks}
    ${tower2(34)}${tower2(166)}
    <path d="M78 156 V118 Q100 96 122 118 V156 Z" fill="#3a3028"/>
    <g stroke="#1a1512" stroke-width="2">${[84,92,100,108,116].map(x => `<path d="M${x} 112 V156"/>`).join("")}${[122,132,142,152].map(y => `<path d="M78 ${y} H122"/>`).join("")}</g>
    <g transform="translate(100 134)"><path d="M-8 -6 V-12 a8 8 0 0 1 16 0 V-6" fill="none" stroke="#c9ccd6" stroke-width="3.5"/><rect x="-12" y="-7" width="24" height="18" rx="3" fill="#e0a526" stroke="#8a5a10"/><circle cx="0" cy="1" r="2.4" fill="#5a3a10"/><path d="M0 2 v5" stroke="#5a3a10" stroke-width="1.6"/></g>
    ${containers([[4,130,"#c0392b"],[4,112,"#e0a526"],[146,132,"#3f7a3a"],[150,114,"#8e44ad"]].map(([x,y,c]) => [x, y, c]))}
    ${barrier(52, 146, 96, 0)}
    <path d="M52 146 v12 M148 146 v12" stroke="#39434a" stroke-width="3"/>
    <g stroke="#fff6b0" opacity=".35"><path d="M34 74 L0 20 L20 10 Z" fill="#fff6b0"/><path d="M166 74 L200 20 L180 10 Z" fill="#fff6b0"/></g>`;
};

/* ---------- Productivisme ---------- */
ART.factory.art = (id, t = 2) => {
  if (t === 1) return sky(id, ["#bfe0f4", "#eef6f0"]) + `
    <circle cx="44" cy="54" r="11" fill="#ffd66b"/>${cloud(60, 70, 0.8, 0.8)}
    <path d="M0 146 Q100 138 200 146 V200 H0 Z" fill="#8cc68a"/>
    <rect x="124" y="70" width="10" height="44" fill="#a4432e"/><rect x="124" y="78" width="10" height="4" fill="#f1ece2"/>
    ${smoke([[132,62,5],[138,54,6],[146,48,5]], "#e4e6e8", 0.9)}
    <path d="M50 148 V118 L70 106 V118 L90 106 V118 L110 106 V118 L130 106 V118 L150 108 V148 Z" fill="#c87a52"/>
    ${[0,1,2,3].map(i => `<path d="M${70 + i * 20} 106 V118 L${50 + i * 20} 118 Z" fill="#8fb4c9" opacity=".7"/>`).join("")}
    <g fill="#f6e3a8">${[0,1,2,3,4].map(i => `<rect x="${56 + i * 18}" y="126" width="9" height="10"/>`).join("")}</g>
    <path d="${star(100, 141, 6, 4.4, 8)}" fill="#6b5a4a"/><circle cx="100" cy="141" r="2" fill="#c87a52"/>
    <g transform="translate(166 150)"><rect x="-2" y="-16" width="4" height="16" fill="#6b4a2e"/><circle cx="0" cy="-22" r="11" fill="#5da35c"/><circle cx="-6" cy="-18" r="7" fill="#4f9150"/></g>`;
  if (t === 2) return sky(id, ["#a7a39a", "#e9d9b8"]) + `
    <circle cx="150" cy="62" r="14" fill="#f2c56b" opacity=".6"/>
    ${smoke([[64,40,14],[80,30,17],[98,38,13],[112,26,15],[128,34,12]], "#6e6a64")}
    ${smoke([[70,56,11],[82,48,12],[104,52,10],[116,46,11]], "#8d8880")}
    ${[[66,60,12],[90,50,12],[114,62,12]].map(([x,top,w]) => `<rect x="${x}" y="${top}" width="${w}" height="${150 - top}" fill="#a4432e"/>` + [0,1,2].map(i => `<rect x="${x}" y="${top + 8 + i * 22}" width="${w}" height="6" fill="#f1ece2"/>`).join("")).join("")}
    <path d="M30 150 V116 L50 104 V116 L70 104 V116 L90 104 V116 L110 104 V116 L130 104 V116 L150 104 V116 L170 104 V150 Z" fill="#5b5046"/>
    ${[0,1,2,3,4,5,6].map(i => `<path d="M${50 + i * 20} 104 V116 L${30 + i * 20} 116 Z" fill="#8fb4c9" opacity=".6"/>`).join("")}
    <g fill="#f6c96a">${[0,1,2,3,4,5,6].map(i => `<rect x="${36 + i * 19}" y="124" width="9" height="11"/>`).join("")}</g>
    <rect x="0" y="150" width="200" height="50" fill="#3d3833"/>`;
  /* level 3: the coal mine, black smoke as far as the eye sees */
  const cart = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-14 -12 H14 L11 0 H-11 Z" fill="#6b4a2e" stroke="#3a2a1a"/><path d="M-14 -12 Q-8 -22 0 -18 Q8 -24 14 -12 Z" fill="#1a1a1a"/>
    <path d="M-6 -17 l2 -2 M4 -19 l2 -1" stroke="#888" stroke-width="1"/><circle cx="-7" cy="2" r="3" fill="#222"/><circle cx="7" cy="2" r="3" fill="#222"/></g>`;
  return sky(id, ["#1e120e", "#5a2e1c", "#c0703a"]) + `
    <circle cx="150" cy="70" r="16" fill="#ff8a3a" opacity=".75"/>
    ${smoke([[20,40,14],[40,30,18],[62,40,14],[90,26,16],[116,36,15],[140,24,14],[168,34,16],[186,46,12]], "#1a1412", 0.85)}
    ${smoke([[30,60,10],[56,58,12],[104,56,10],[132,52,12],[176,60,10]], "#2e2420", 0.8)}
    ${[[96,58,10],[114,50,10],[132,62,9],[150,56,9]].map(([x,top,w]) => `<rect x="${x}" y="${top}" width="${w}" height="${146 - top}" fill="#6a2a1a"/><rect x="${x}" y="${top + 10}" width="${w}" height="4" fill="#caa98a"/>`).join("")}
    <g stroke="#1a1412" stroke-width="3" fill="none"><path d="M34 146 L52 70 M78 146 L60 70"/></g>
    <g stroke="#1a1412" stroke-width="1.6">${[84,100,116,132].map((y, i) => `<path d="M${50 - (y - 70) * 0.2 + 6} ${y} L${62 + (y - 70) * 0.2 - 6} ${y + 14} M${62 + (y - 70) * 0.2 - 6} ${y} L${50 - (y - 70) * 0.2 + 6} ${y + 14}"/>`).join("")}</g>
    <circle cx="56" cy="66" r="13" fill="none" stroke="#1a1412" stroke-width="3"/><g stroke="#1a1412" stroke-width="1.4">${[0,45,90,135].map(a => `<path d="M${56 - 13 * Math.cos(a * Math.PI / 180)} ${66 - 13 * Math.sin(a * Math.PI / 180)} L${56 + 13 * Math.cos(a * Math.PI / 180)} ${66 + 13 * Math.sin(a * Math.PI / 180)}"/>`).join("")}</g>
    <path d="M56 66 L110 146" stroke="#1a1412" stroke-width="1"/>
    <path d="M150 146 Q170 104 200 112 V146 Z" fill="#0e0c0b"/><path d="M160 130 l4 -3 M176 118 l4 -2 M186 126 l3 -2" stroke="#6a6a70" stroke-width="1.2"/>
    <rect x="0" y="146" width="200" height="54" fill="#2a1e18"/>
    <path d="M0 154 H200" stroke="#6d665e" stroke-width="2"/>${Array.from({length: 20}, (_, i) => `<path d="M${i * 10 + 3} 150 v8" stroke="#4a3a2a" stroke-width="2"/>`).join("")}
    ${cart(96, 150)}${cart(128, 150)}${cart(160, 150)}
    ${[[34,120],[80,118]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#ffd35a" opacity=".25"/><circle cx="${x}" cy="${y}" r="2.5" fill="#ffe27a"/>`).join("")}`;
};

/* ---------- Laïcité ---------- */
ART.hussard.art = (id, t = 2) => {
  if (t === 1) return sky(id, ["#bcdcf2", "#f4efe2"]) + `
    ${cloud(140, 50, 0.8, 0.8)}
    <path d="M0 148 H200 V200 H0 Z" fill="#b9c79a"/><path d="M84 200 L92 148 H108 L116 200 Z" fill="#d8cdb4"/>
    <path d="M100 58 V42" stroke="#555" stroke-width="1.5"/><rect x="101" y="42" width="6" height="10" fill="#1d4f9a"/><rect x="107" y="42" width="6" height="10" fill="#fff"/><rect x="113" y="42" width="6" height="10" fill="#d23a2e"/>
    <path d="M48 84 L100 58 L152 84 Z" fill="#e8dcc4" stroke="#9e8a62" stroke-width="1.2"/>
    <circle cx="100" cy="74" r="7" fill="#fff" stroke="#6b5a42" stroke-width="1.2"/><path d="M100 74 V69 M100 74 L103 76" stroke="#333" stroke-width="1"/>
    <rect x="50" y="84" width="100" height="64" fill="#efe6d2" stroke="#9e8a62" stroke-width="1.2"/>
    ${[60,78,122,140].map(x => `<rect x="${x - 3}" y="88" width="6" height="60" fill="#f7f1e2" stroke="#c8b894" stroke-width=".8"/>`).join("")}
    <path d="M90 148 V118 Q100 106 110 118 V148 Z" fill="#6b4a2e"/>
    ${[66,130].map(x => `<rect x="${x - 3}" y="100" width="10" height="16" fill="#9fc3dd" stroke="#8a7a5a"/>`).join("")}
    <g transform="translate(30 148)"><rect x="-2" y="-18" width="4" height="18" fill="#6b4a2e"/><circle cx="0" cy="-26" r="13" fill="#5da35c"/><circle cx="6" cy="-20" r="8" fill="#4f9150"/></g>`;
  if (t === 2) return `
    <rect width="200" height="200" fill="#e9dcc2"/>
    <rect x="30" y="44" width="140" height="84" rx="3" fill="#8a5e36"/>
    <rect x="36" y="50" width="128" height="72" fill="#2f4a3a"/>
    <g stroke="#eef2e6" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9">
      <path d="M46 66 q4 -5 8 0 t8 0 t8 0 t8 0 t8 0 t8 0"/><path d="M46 80 q4 -5 8 0 t8 0 t8 0 t8 0"/><path d="M46 94 q4 -5 8 0 t8 0 t8 0 t8 0 t8 0"/></g>
    <g stroke="#eef2e6" stroke-width="1.4" fill="none" opacity=".9"><path d="M134 62 V100 M122 66 H146"/><path d="M122 66 l-6 14 h12 Z M146 66 l-6 14 h12 Z"/><path d="M126 100 h16"/></g>
    <rect x="36" y="122" width="128" height="5" fill="#6f4a28"/><rect x="70" y="120" width="12" height="3" fill="#f4f1e6"/>
    <rect x="0" y="146" width="200" height="54" fill="#7a5230"/><rect x="0" y="146" width="200" height="5" fill="#946640"/>
    <rect x="54" y="136" width="54" height="22" rx="2" fill="#f4ecd8" stroke="#9e8a62" transform="rotate(-6 80 147)"/>
    <path d="M60 142 h40 M60 147 h34 M60 152 h38" stroke="#b7a57e" stroke-width="1" transform="rotate(-6 80 147)"/>
    <path d="M126 138 h22 v14 a11 6 0 0 1 -22 0 Z" fill="#222"/><ellipse cx="137" cy="138" rx="11" ry="3.5" fill="#444"/>
    <path d="M137 138 C144 114 156 96 172 84 C164 102 152 118 139 138 Z" fill="#f7f3e8" stroke="#bfb49a"/>
    <path d="M139 138 L168 88" stroke="#bfb49a" stroke-width=".8"/>`;
  /* level 3: a priest's biretta, served on a plate */
  return sky(id, ["#4a1e1e", "#7e3426", "#a85a36"]) + `
    <defs><linearGradient id="${id}pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9d4c8"/></linearGradient>
    <linearGradient id="${id}bk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a1a1e"/><stop offset=".45" stop-color="#3a3a42"/><stop offset="1" stop-color="#121216"/></linearGradient>
    <radialGradient id="${id}cg"><stop offset="0" stop-color="#ffd35a" stop-opacity=".5"/><stop offset="1" stop-color="#ffd35a" stop-opacity="0"/></radialGradient></defs>
    <g stroke="#6a2a1e" stroke-width="1" opacity=".6">${Array.from({length: 10}, (_, i) => `<path d="M${i * 20 + 10} 0 V96"/>`).join("")}</g>
    <path d="M0 96 H200 V200 H0 Z" fill="#f2ece0"/><path d="M0 96 H200" stroke="#d2c8b4" stroke-width="2"/>
    <circle cx="32" cy="84" r="16" fill="url(#${id}cg)"/><rect x="29.5" y="86" width="5" height="16" fill="#f4efe2"/><path d="M32 85 q-3 -5 0 -9 q3 4 0 9" fill="#ffb13a"/>
    <g stroke="#b9bec4" stroke-width="2.4" stroke-linecap="round"><path d="M34 150 L42 118"/><path d="M166 150 L158 118"/></g>
    <path d="M40 120 l-1.5 -6 M42.5 120.5 l0 -6 M45 121 l1.5 -6" stroke="#b9bec4" stroke-width="1.2"/>
    <ellipse cx="100" cy="132" rx="58" ry="20" fill="#cfc8b8" opacity=".6" transform="translate(0 3)"/>
    <ellipse cx="100" cy="130" rx="58" ry="20" fill="url(#${id}pl)" stroke="#bdb6a6"/>
    <ellipse cx="100" cy="129" rx="44" ry="14" fill="#f7f4ee" stroke="#c9a24a" stroke-width="1"/>
    ${[[64,134],[72,139],[130,138],[137,132]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#4f9a3a"/><circle cx="${x + 2}" cy="${y - 1.5}" r="2.3" fill="#6fbf4a"/>`).join("")}
    <path d="M62 132 L66 102 Q100 94 134 102 L138 132 Q100 141 62 132 Z" fill="url(#${id}bk)" stroke="#000" stroke-width="1"/>
    <path d="M66 102 Q100 110 134 102" stroke="#4a4a54" stroke-width="1.2" fill="none"/>
    <path d="M100 106 V137" stroke="#000" stroke-width=".8" opacity=".5"/>
    ${[[80,104,15,18],[120,104,15,18],[100,101,16,22]].map(([x,b,w,h]) => `<path d="M${x - w} ${b + 2} C${x - w} ${b - h} ${x + w} ${b - h} ${x + w} ${b + 2} Q${x} ${b + 5} ${x - w} ${b + 2} Z" fill="#26262c" stroke="#000" stroke-width="1"/><path d="M${x - w + 4} ${b - 1} C${x - w + 4} ${b - h + 6} ${x - 2} ${b - h + 3} ${x + 2} ${b - h + 3}" stroke="#6a6a76" stroke-width="1.6" fill="none" stroke-linecap="round"/>`).join("")}
    ${Array.from({length: 10}, (_, i) => { const a = i * 36 * Math.PI / 180; return `<circle cx="${(100 + 6 * Math.cos(a)).toFixed(1)}" cy="${(84 + 6 * Math.sin(a)).toFixed(1)}" r="4" fill="#1c1c20"/>`; }).join("")}
    <circle cx="100" cy="84" r="7" fill="#232328"/>
    <circle cx="97" cy="81" r="2.4" fill="#4a4a54"/>
    <path d="M64 124 Q100 132 136 124" stroke="#000" stroke-width="1" opacity=".5" fill="none"/>`;
};
})();
