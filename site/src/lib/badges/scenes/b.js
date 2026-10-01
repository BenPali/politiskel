import { ART } from './base.js';
import { star, person, cloud, blade, turbine, sky, starfield, tower } from '../draw.js';

/* Level-dependent scenes: Centre, Transition, European federalism,
   Sovereignty, Direct democracy, Populism. t is 1, 2 or 3. */

/* ---------- Centre: Modéré / Funambule du centre / En même temps ---------- */
ART.tightrope.art = (id, t = 2) => {
  const walker = (x, y, rot) => `<g transform="rotate(${rot} ${x} ${y}) translate(${x - 100} ${y - 112})">
    <circle cx="100" cy="62" r="6" fill="#e7b58c"/><path d="M94 57 Q100 50 106 57 Z" fill="#333"/>
    <path d="M94 70 H106 L104 94 H96 Z" fill="#fff" stroke="#333"/>
    <path d="M94 70 L104 94 M100 70 L106 86" stroke="#c46aa0" stroke-width="2"/>
    <path d="M97 94 L96 116 M103 94 L106 116" stroke="#333" stroke-width="2.4" stroke-linecap="round"/></g>`;
  if (t === 1) return sky(id, ["#e8f2fb", "#fdf6ea"]) + `
    ${cloud(40, 60, 0.9, 0.8)}${cloud(130, 48, 0.7, 0.7)}
    <path d="M0 140 Q100 128 200 140 V200 H0 Z" fill="#a9cf8a"/><path d="M0 152 Q100 144 200 152 V200 H0 Z" fill="#8cbd6e"/>
    <rect x="40" y="112" width="5" height="34" fill="#8a6a4a"/><rect x="155" y="112" width="5" height="34" fill="#8a6a4a"/>
    <path d="M42 116 Q100 122 158 116" stroke="#555" stroke-width="1.4" fill="none"/>
    ${walker(100, 115, 0)}
    <path d="M95 77 L80 86 M105 77 L120 86" stroke="#333" stroke-width="2.2" stroke-linecap="round"/>`;
  if (t === 2) return sky(id, ["#ffd7e8", "#bfe2ff"]) + `
    ${cloud(20, 150, 1.4)}${cloud(120, 160, 1.6)}${cloud(70, 176, 1.2, 0.9)}${cloud(150, 40, 0.8, 0.8)}
    <rect x="16" y="104" width="8" height="96" fill="#b04a3a"/><rect x="176" y="104" width="8" height="96" fill="#2d6f8e"/>
    <path d="M20 106 Q100 118 180 106" stroke="#333" stroke-width="1.6" fill="none"/>
    <g transform="rotate(-7 100 112)">
      <path d="M40 80 Q100 88 160 80" stroke="#6b4a2e" stroke-width="2.4" fill="none"/>
      <circle cx="40" cy="80" r="3" fill="#d23a2e"/><circle cx="160" cy="80" r="3" fill="#2d6f8e"/>
      <path d="M95 74 L70 84 M105 74 L130 84" stroke="#333" stroke-width="2.2" stroke-linecap="round"/>
      ${walker(100, 112, 0)}</g>`;
  /* level 3: on a unicycle, above the clouds, juggling both sides at once */
  const balls = [["#d23a2e", 84, 44], ["#2d6f8e", 92, 38], ["#fff", 100, 36], ["#d23a2e", 108, 38], ["#2d6f8e", 116, 44]];
  return sky(id, ["#2b1a4a", "#8a4a8e", "#f2a2b8"]) + `
    ${starfield(16, 5)}
    ${cloud(8, 150, 1.6)}${cloud(62, 160, 1.8)}${cloud(126, 152, 1.7)}
    <rect x="12" y="126" width="8" height="74" fill="#b04a3a"/><rect x="180" y="126" width="8" height="74" fill="#2d6f8e"/>
    <path d="M10 124 h12 l-6 -8 Z" fill="#d23a2e"/><path d="M178 124 h12 l-6 -8 Z" fill="#3b7bff"/>
    <path d="M16 128 Q100 146 184 128" stroke="#333" stroke-width="1.6" fill="none"/>
    <g transform="rotate(4 100 137)">
      <circle cx="100" cy="129" r="8" fill="none" stroke="#333" stroke-width="2"/><path d="M100 121 V137 M92 129 H108" stroke="#777" stroke-width="1"/>
      <path d="M100 121 V111" stroke="#333" stroke-width="2"/><rect x="95" y="108" width="10" height="3" rx="1.5" fill="#333"/>
      <g transform="translate(0 -5)">
        <circle cx="100" cy="62" r="6" fill="#e7b58c"/><path d="M94 57 Q100 50 106 57 Z" fill="#333"/>
        <path d="M94 70 H106 L104 94 H96 Z" fill="#fff" stroke="#333"/>
        <path d="M94 70 L104 94 M100 70 L106 86" stroke="#c46aa0" stroke-width="2"/>
        <path d="M97 94 L100 116 M103 94 L100 112" stroke="#333" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M95 74 L80 64 M105 74 L120 64" stroke="#333" stroke-width="2.2" stroke-linecap="round"/>
      </g>
      <path d="M44 62 Q100 52 156 62" stroke="#6b4a2e" stroke-width="2.4" fill="none"/>
      <path d="M40 56 h8 l-4 12 Z" fill="#d23a2e"/><path d="M152 56 h8 l-4 12 Z" fill="#3b7bff"/>
    </g>
    <path d="M84 50 Q100 26 116 50" stroke="#fff" stroke-opacity=".35" stroke-width="1" stroke-dasharray="2 3" fill="none"/>
    ${balls.map(([c, x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="${c}" stroke="#333" stroke-width=".8"/>`).join("")}
    ${[[30, 70], [170, 64], [56, 90], [150, 88]].map(([x, y]) => `<path d="${star(x, y, 4, 1.4, 4)}" fill="#ffe7a0"/>`).join("")}`;
};

/* ---------- Transition: Ami des éoliennes / Électrifié / Tout renouvelable ---------- */
ART.turbines.art = (id, t = 2) => {
  if (t === 1) return sky(id, ["#a8dcf2", "#eaf7fc"]) + `
    <circle cx="140" cy="62" r="11" fill="#fff3b0"/>${cloud(40, 70, 0.8, 0.8)}
    <path d="M0 140 Q60 116 110 130 T200 124 V200 H0 Z" fill="#9dcf93"/>
    ${turbine(92, 134, 56, 10, 1.1)}
    <path d="M0 160 Q70 144 140 156 T200 152 V200 H0 Z" fill="#6fae6a"/>`;
  if (t === 2) return sky(id, ["#6ec3e8", "#d9f1fb"]) + `
    <circle cx="58" cy="60" r="13" fill="#fff3b0"/>${cloud(120, 58, 1.1)}${cloud(150, 80, 0.7, 0.8)}
    <path d="M0 132 Q50 108 100 124 T200 116 V200 H0 Z" fill="#8cc68a"/>
    ${turbine(72, 128, 52, 20, 1.1)}${turbine(122, 124, 40, 75, 0.9)}${turbine(154, 120, 28, 40, 0.7)}
    <path d="M0 152 Q60 132 120 148 T200 142 V200 H0 Z" fill="#5da35c"/>
    <path d="M0 172 Q70 158 140 170 T200 168 V200 H0 Z" fill="#3f8342"/>`;
  /* level 3: every source at once, under a triumphant sun */
  const panel = (x, y) => `<g transform="translate(${x} ${y})"><path d="M0 0 L22 0 L28 10 L6 10 Z" fill="#244f8a" stroke="#cfe3ff" stroke-width=".8"/>
    <path d="M7.3 0 L13.3 10 M14.6 0 L20.6 10 M3 5 L25 5" stroke="#cfe3ff" stroke-width=".6"/><path d="M14 10 V15" stroke="#555" stroke-width="1.4"/></g>`;
  return sky(id, ["#3fb1e6", "#aee3f6", "#fff4c8"]) + `
    <g opacity=".55">${Array.from({length: 16}, (_, i) => { const a = i * 22.5 * Math.PI / 180; return `<path d="M52 56 L${52 + 70 * Math.cos(a)} ${56 + 70 * Math.sin(a)} L${52 + 70 * Math.cos(a + 0.1)} ${56 + 70 * Math.sin(a + 0.1)} Z" fill="#fff6b0"/>`; }).join("")}</g>
    <circle cx="52" cy="56" r="15" fill="#ffe46b"/><circle cx="52" cy="56" r="21" fill="#ffe46b" opacity=".35"/>
    <path d="M110 60 Q128 42 150 58 Q165 50 172 62" stroke="#ff8fb2" stroke-width="3" fill="none" opacity=".0"/>
    ${[["#e0453a", 0], ["#f39c2a", 3], ["#f4d23a", 6], ["#4bb04a", 9], ["#3a86d9", 12], ["#7a4bc2", 15]].map(([c, o]) => `<path d="M104 ${112} A${50 - o} ${50 - o} 0 0 1 ${204 - o * 2} 112" stroke="${c}" stroke-width="3" fill="none" opacity=".55"/>`).join("")}
    <path d="M0 116 H200 V134 H0 Z" fill="#3d86b8"/>
    <path d="M0 118 h200 M0 124 h200" stroke="#9fd0ea" stroke-width=".8" stroke-dasharray="6 5" opacity=".7"/>
    ${turbine(150, 120, 26, 30, 0.6)}${turbine(170, 120, 22, 80, 0.5)}${turbine(186, 120, 18, 10, 0.45)}
    <path d="M0 126 Q40 104 80 118 T150 120 L150 200 H0 Z" fill="#8cc68a"/>
    ${turbine(30, 118, 44, 5, 0.9)}${turbine(64, 116, 40, 55, 0.85)}${turbine(104, 124, 34, 95, 0.75)}
    <path d="M0 140 Q60 128 120 138 T200 136 V200 H0 Z" fill="#5da35c"/>
    ${[[18, 138], [46, 136], [74, 138], [120, 140], [148, 138]].map(([x, y]) => panel(x, y)).join("")}
    <path d="M0 154 Q70 146 140 152 T200 150 V200 H0 Z" fill="#3f8342"/>
    <g transform="translate(160 146)"><path d="M0 0 H22 L20 -6 H6 Z" fill="#2fb27a"/><rect x="-2" y="0" width="26" height="6" rx="3" fill="#29a06e"/>
      <circle cx="4" cy="7" r="2.6" fill="#222"/><circle cx="19" cy="7" r="2.6" fill="#222"/><path d="M8 -5 H18 L19 -1 H7 Z" fill="#bfe7f6"/></g>
    <path d="M160 150 Q150 150 146 144" stroke="#222" stroke-width="1.2" fill="none"/>
`;
};

/* ---------- Fédéralisme européen: Européen convaincu / Citoyen des douze étoiles / États-Unis d'Europe ---------- */
ART.eustars.art = (id, t = 2) => {
  const ring = (r, s1, s2, col = "#ffd83a") => Array.from({length: 12}, (_, i) => { const a = (i * 30 - 90) * Math.PI / 180; return `<path d="${star(100 + r * Math.cos(a), 100 + r * Math.sin(a), s1, s2)}" fill="${col}"/>`; }).join("");
  const bg = `<defs><radialGradient id="${id}e" cx=".5" cy=".45"><stop offset="0" stop-color="${t === 3 ? '#2d4fb0' : '#3a64c8'}"/><stop offset="1" stop-color="${t === 3 ? '#07113e' : '#0f2a78'}"/></radialGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#d9a21c"/></linearGradient></defs>
    <rect width="200" height="200" fill="url(#${id}e)"/>`;
  if (t === 1) return bg + ring(46, 6, 2.5) + `<circle cx="100" cy="100" r="18" fill="#fff" opacity=".06"/>`;
  if (t === 2) return bg + ring(48, 6.5, 2.7) + `
    <path d="M70 118 Q100 82 130 118" fill="none" stroke="url(#${id}b)" stroke-width="7"/>
    <path d="M62 118 H138 V124 H62 Z" fill="url(#${id}b)"/>
    ${[76, 88, 100, 112, 124].map(x => `<path d="M${x} 118 V${118 - 22 * Math.sin(Math.PI * (x - 70) / 60) + 2}" stroke="#e8b83a" stroke-width="2"/>`).join("")}
    <path d="M62 124 Q100 140 138 124" fill="none" stroke="#8fb0ff" stroke-width="1.5" opacity=".7"/>
    <path d="M58 132 Q100 146 142 132" fill="none" stroke="#8fb0ff" stroke-width="1.5" opacity=".45"/>`;
  /* level 3: a federal capitol under fireworks, the stars as its crown */
  const burst = (x, y, r, c) => `<g stroke="${c}" stroke-width="1.4" stroke-linecap="round">${Array.from({length: 12}, (_, i) => { const a = i * 30 * Math.PI / 180; return `<path d="M${x + r * 0.35 * Math.cos(a)} ${y + r * 0.35 * Math.sin(a)} L${x + r * Math.cos(a)} ${y + r * Math.sin(a)}"/>`; }).join("")}</g><circle cx="${x}" cy="${y}" r="1.6" fill="${c}"/>`;
  return bg + starfield(14, 21) + burst(52, 52, 14, "#ffd83a") + burst(150, 46, 12, "#9fc0ff") + burst(160, 84, 8, "#ffd83a") + burst(40, 88, 8, "#9fc0ff") + `
    <circle cx="100" cy="72" r="46" fill="#ffd83a" opacity=".08"/>
    ${Array.from({length: 12}, (_, i) => { const a = (i * 30 - 90) * Math.PI / 180, x = 100 + 30 * Math.cos(a), y = 72 + 30 * Math.sin(a); return `<circle cx="${x}" cy="${y}" r="7" fill="#ffd83a" opacity=".25"/><path d="${star(x, y, 5.5, 2.2)}" fill="#ffe46b"/>`; }).join("")}
    <path d="M78 104 Q78 82 100 80 Q122 82 122 104 Z" fill="url(#${id}b)"/>
    <path d="M86 104 Q86 88 100 86 M114 104 Q114 88 100 86 M100 80 V104" stroke="#b88a1a" stroke-width="1" fill="none"/>
    <path d="M98 80 V72 H102 V80 Z" fill="#e8b83a"/><path d="${star(100, 69, 4, 1.6)}" fill="#fff4b0"/>
    <rect x="70" y="104" width="60" height="6" fill="#f2e8cc"/>
    <path d="M58 112 H142 L100 102 Z" fill="#f7efd8" opacity=".0"/>
    <path d="M60 110 H140 L132 104 H68 Z" fill="#e8dcb8"/>
    <rect x="60" y="110" width="80" height="34" fill="#f4ecd4"/>
    ${[64, 74, 84, 94, 104, 114, 124, 134].map(x => `<rect x="${x}" y="114" width="4" height="26" fill="#d9ccaa"/>`).join("")}
    <rect x="56" y="144" width="88" height="5" fill="#d9ccaa"/><rect x="50" y="149" width="100" height="5" fill="#cbbd98"/>
    <path d="M40 160 Q100 150 160 160" stroke="#ffd83a" stroke-width="2" fill="none" opacity=".5"/>
    ${[[30, 140], [170, 140]].map(([x, y]) => `<path d="M${x} ${y + 16} V${y - 14}" stroke="#ccc" stroke-width="1.4"/><path d="M${x + 1} ${y - 14} h16 v10 h-16 Z" fill="#1f3fa0"/>${Array.from({length: 6}, (_, i) => { const a = i * 60 * Math.PI / 180; return `<circle cx="${x + 9 + 3.2 * Math.cos(a)}" cy="${y - 9 + 3.2 * Math.sin(a)}" r=".9" fill="#ffd83a"/>`; }).join("")}`).join("")}`;
};

/* ---------- Souveraineté: Eurosceptique / Gardien des frontières / Frexiteur ---------- */
ART.border.art = (id, t = 2) => {
  const mountains = `<path d="M0 120 L40 76 L66 100 L96 62 L132 104 L156 84 L200 120 Z" fill="#8a9bb0"/>
    <path d="M96 62 L86 76 L94 74 L100 80 L106 72 L112 78 Z M40 76 L33 84 L41 83 L46 88 Z" fill="#fff"/>`;
  const road = `<path d="M0 120 H200 V200 H0 Z" fill="#b9a67f"/><path d="M84 200 L96 120 H104 L116 200 Z" fill="#6f6a64"/>
    <path d="M99.5 128 v6 M99 144 v8 M98.5 162 v10" stroke="#f2e7b5" stroke-width="1.6"/>`;
  const boom = rot => `<rect x="54" y="118" width="6" height="26" fill="#555"/>
    <g transform="rotate(${rot} 57 122)"><rect x="57" y="118" width="80" height="6" fill="#fff" stroke="#333" stroke-width=".8"/>
    ${[0, 1, 2, 3, 4].map(i => `<rect x="${61 + i * 16}" y="118" width="8" height="6" fill="#d23a2e"/>`).join("")}</g><path d="M40 146 h34" stroke="#333" stroke-width="3"/>`;
  if (t === 1) return sky(id, ["#cfe4f2", "#f6efe0"]) + mountains + road + boom(-58) + `
    ${cloud(130, 50, 0.8, 0.8)}
    <g transform="translate(144 140)"><path d="M-10 0 V-26 H10 V0" fill="#e9e1cf" stroke="#6b5a42"/><path d="M-13 -26 L0 -34 L13 -26 Z" fill="#8a9bb0"/><rect x="-5" y="-20" width="10" height="7" fill="#9fc3dd"/></g>`;
  if (t === 2) return sky(id, ["#bcd7ec", "#f3ead8"]) + mountains + road + `
    <rect x="118" y="100" width="30" height="40" fill="#e9e1cf" stroke="#6b5a42" stroke-width="1.5"/>
    <path d="M114 100 L133 88 L152 100 Z" fill="#b5462f"/>
    <rect x="123" y="108" width="20" height="12" fill="#9fc3dd" stroke="#6b5a42"/>` + boom(-8) + `
    <rect x="150" y="128" width="4" height="30" fill="#555"/><rect x="142" y="120" width="20" height="12" rx="2" fill="#d23a2e"/><rect x="146" y="124" width="12" height="4" fill="#fff"/>`;
  /* level 3: a castle wall with a drawbridge up; one star leaves the ring */
  const merlons = (x0, x1, y) => { let d = ""; for (let x = x0; x < x1; x += 10) d += `<rect x="${x}" y="${y - 7}" width="6" height="7"/>`; return d; };
  return sky(id, ["#7fa9d6", "#d8e6f2", "#f6e7c8"]) + `
    ${Array.from({length: 11}, (_, i) => { const a = (i * 30 - 60) * Math.PI / 180; return `<path d="${star(76 + 17 * Math.cos(a), 58 + 17 * Math.sin(a), 3.4, 1.4)}" fill="#ffd83a"/>`; }).join("")}
    <path d="${star(122, 46, 5.5, 2.2)}" fill="#ffd83a"/>
    <path d="M96 52 Q106 46 114 46 M94 58 Q106 52 114 51" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    ${mountains.replace('fill="#8a9bb0"', 'fill="#9aa9bb"')}
    <path d="M0 150 H200 V200 H0 Z" fill="#3d7aa8"/>
    <path d="M0 152 h200" stroke="#9fd0ea" stroke-width="1" stroke-dasharray="7 5"/>
    <g fill="#b3a58c">${merlons(0, 200, 110)}</g>
    <rect x="0" y="110" width="200" height="42" fill="#b3a58c"/>
    <g stroke="#8f8168" stroke-width=".8">${[118, 126, 134, 142].map(y => `<path d="M0 ${y} H200"/>`).join("")}
    ${Array.from({length: 40}, (_, i) => `<path d="M${(i % 10) * 20 + ((Math.floor(i / 10)) % 2) * 10} ${110 + Math.floor(i / 10) * 8} v8"/>`).join("")}</g>
    <path d="M84 152 V128 Q100 114 116 128 V152 Z" fill="#2c2419"/>
    <g stroke="#555" stroke-width="1.2">${[88, 94, 100, 106, 112].map(x => `<path d="M${x} 124 V152"/>`).join("")}<path d="M84 134 H116 M84 142 H116"/></g>
    <rect x="124" y="80" width="24" height="72" fill="#a89a80"/><g fill="#a89a80">${merlons(122, 150, 80)}</g>
    <rect x="133" y="92" width="6" height="10" rx="3" fill="#2c2419"/>
    <path d="M136 73 V58" stroke="#555" stroke-width="1.4"/><rect x="137" y="58" width="5" height="8" fill="#1f3fa0"/><rect x="142" y="58" width="5" height="8" fill="#fff"/><rect x="147" y="58" width="5" height="8" fill="#d23a2e"/>
    ${person(50, 104, 0.9, "#4a3d2a")}${person(66, 104, 0.9, "#4a3d2a")}
    <path d="M54 90 v-12 M70 90 v-12" stroke="#4a3d2a" stroke-width="1"/>`;
};

/* ---------- Démocratie directe: Consulté / Accro au référendum / RIC en toutes matières ---------- */
ART.ballot.art = (id, t = 2) => {
  const box = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})">
    <rect x="-40" y="0" width="80" height="62" rx="3" fill="#dcecf6" fill-opacity=".85" stroke="#4f7090" stroke-width="2.4"/>
    <path d="M-40 0 L-28 -8 H52 L40 0 Z" fill="#c8dbe8" stroke="#6c8ca8" stroke-width="2"/>
    <path d="M40 0 L52 -8 V54 L40 62 Z" fill="#b8cee0" fill-opacity=".8" stroke="#6c8ca8" stroke-width="2"/>
    <rect x="-12" y="-5.5" width="30" height="3" rx="1.5" fill="#34506a"/></g>`;
  const env = (x, y, r, w = 18, h = 12) => `<g transform="rotate(${r} ${x} ${y})"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" fill="#fff" stroke="#a89f86" stroke-width=".8"/><path d="M${x - w / 2} ${y - h / 2} L${x} ${y + 1} L${x + w / 2} ${y - h / 2}" fill="none" stroke="#a89f86" stroke-width=".8"/></g>`;
  const floor = `<rect x="0" y="146" width="200" height="54" fill="#cfc4a8"/><rect x="0" y="146" width="200" height="4" fill="#b3a684"/>`;
  const inside = [[-30, 50, -10], [-12, 54, 8], [4, 48, -4], [18, 54, 14], [-20, 38, 20], [10, 38, -16]];
  if (t === 1) return sky(id, ["#efeafb", "#fdfbf5"]) + floor + box(100, 92) + `
    ${env(80, 136, -8)}${env(112, 138, 10)}
    <g><rect x="94" y="72" width="18" height="16" fill="#fff" stroke="#a89f86" stroke-width=".8"/><path d="M94 72 L103 79 L112 72" fill="none" stroke="#a89f86" stroke-width=".8"/></g>
    <rect x="86" y="86.5" width="34" height="3" fill="#34506a"/>`;
  /* hand from the top right: sleeve, cuff, palm, fingers pinching the envelope's top */
  const hand = (x, y, k = 1, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${k})">
    <path d="M14 -30 L44 -58 L58 -44 L28 -16 Z" fill="#6b4fc2"/>
    <path d="M10 -26 L24 -12 L30 -18 L16 -32 Z" fill="#fff" stroke="#d8d0ee" stroke-width=".6"/>
    <ellipse cx="8" cy="-16" rx="13" ry="10" transform="rotate(-38 8 -16)" fill="#e7b58c" stroke="#b67f55" stroke-width="1"/>
    <path d="M-2 -24 C-10 -24 -14 -18 -10 -14" fill="none" stroke="#b67f55" stroke-width="1"/>
    <rect x="-12" y="-8" width="20" height="6" rx="3" fill="#e7b58c" stroke="#b67f55" stroke-width="1"/>
    <rect x="-11" y="-2.5" width="18" height="6" rx="3" fill="#e7b58c" stroke="#b67f55" stroke-width="1"/>
    <path d="M-8 -8 v-1.5 M-3 -8 v-1.5 M2 -8 v-1.5" stroke="#b67f55" stroke-width=".8"/></g>`;
  const heldEnvelope = (x, y) => `<rect x="${x}" y="${y}" width="20" height="26" fill="#fff" stroke="#8e8468" stroke-width="1"/><path d="M${x} ${y} L${x + 10} ${y + 8} L${x + 20} ${y}" fill="none" stroke="#8e8468" stroke-width="1"/>
    <path d="M${x + 5} ${y + 16} l3 3 l6 -7" stroke="#6b4fc2" stroke-width="2" fill="none"/>`;
  if (t === 2) return sky(id, ["#e9e2fb", "#fdfbf5"]) + floor + box(100, 92) + `
    ${inside.map(([dx, dy, r]) => env(100 + dx, 92 + dy, r)).join("")}
    <clipPath id="${id}cl"><rect x="0" y="0" width="200" height="88"/></clipPath>
    <g clip-path="url(#${id}cl)">${heldEnvelope(94, 64)}</g>
    <rect x="86" y="86.5" width="34" height="3" fill="#34506a"/>
    ${hand(106, 68, 1, 0)}`;
  /* level 3: ballots raining on three overflowing boxes, a hand on every slot */
  return sky(id, ["#cbb9f5", "#efe8ff", "#fdfbf5"]) + `
    ${Array.from({length: 11}, (_, i) => { const x = 30 + (i * 37) % 140, y = 30 + (i * 23) % 70, r = (i * 47) % 60 - 30; return env(x, y, r, 12, 8); }).join("")}
    ${floor}
    ${box(52, 112, 0.62)}${box(148, 112, 0.62)}${box(100, 102, 0.8)}
    ${[[40, 114], [52, 110], [64, 114], [136, 114], [148, 110], [160, 114]].map(([x, y], i) => env(x, y, (i % 2 ? 14 : -12), 13, 9)).join("")}
    ${[[88, 104], [100, 99], [112, 104], [94, 96], [106, 94]].map(([x, y], i) => env(x, y, (i % 2 ? 18 : -14), 15, 10)).join("")}
    ${[[-20, 142, -10], [0, 146, 8], [24, 140, -6], [60, 148, 12], [150, 146, -8], [176, 142, 10], [196, 148, -4]].map(([x, y, r]) => env(x, y, r, 16, 10)).join("")}
    ${hand(112, 76, 0.8, -6)}
    <path d="M100 48 l3 6 l6 1 l-4.5 4 l1 6 l-5.5 -3 l-5.5 3 l1 -6 l-4.5 -4 l6 -1 Z" fill="#ffd35a" opacity=".0"/>
    ${[[70, 60], [132, 58], [30, 90], [172, 88]].map(([x, y]) => `<path d="${star(x, y, 4, 1.4, 4)}" fill="#6b4fc2" opacity=".7"/>`).join("")}`;
};

/* ---------- Populisme: Méfiant des élites / Porte-voix du peuple / Tribun de la plèbe ---------- */
ART.megaphone.art = (id, t = 2) => {
  const cone = (x, y, k, r) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${k})">
    <path d="M-38 -6 L18 -32 L18 32 L-38 6 Z" fill="url(#${id}m)" stroke="#6d6d6d" stroke-width="1.5"/>
    <ellipse cx="18" cy="0" rx="7" ry="32" fill="#d9d9d9" stroke="#6d6d6d" stroke-width="1.5"/>
    <ellipse cx="18" cy="0" rx="4" ry="26" fill="#5a5a5a"/>
    <rect x="-52" y="-8" width="16" height="16" rx="3" fill="#d23a2e"/>
    <path d="M-32 8 L-24 28 L-16 26 L-22 10 Z" fill="#444"/></g>`;
  const defs = `<defs><linearGradient id="${id}m" x1="0" x2="1"><stop offset="0" stop-color="#e8e8e8"/><stop offset="1" stop-color="#a9a9a9"/></linearGradient></defs>`;
  if (t === 1) return sky(id, ["#ffe6c4", "#ffd0a8"]) + defs + `
    ${cloud(40, 50, 0.8, 0.8)}
    <path d="M0 150 Q100 136 200 150 V200 H0 Z" fill="#d99a6a"/>
    <path d="M110 150 Q126 138 150 140 Q170 142 190 150 Z" fill="#c88a5a"/>
    <path d="M136 142 L140 60 H160 L164 142 Z" fill="#fbf7ee" stroke="#c9bfa6"/>
    <path d="M134 60 H166 V52 H134 Z" fill="#fbf7ee" stroke="#c9bfa6"/>
    ${[134, 142, 150, 158].map(x => `<rect x="${x}" y="46" width="5" height="6" fill="#fbf7ee" stroke="#c9bfa6"/>`).join("")}
    ${[72, 100].map(y => `<rect x="146" y="${y}" width="8" height="10" rx="4" fill="#ffd35a"/><path d="M148 ${y + 6} h4 v-4 h-4 Z M147 ${y + 6} h6" stroke="#2a1a10" stroke-width="1" fill="#2a1a10"/>`).join("")}
    <g transform="translate(74 152) scale(1.45)">
      <circle cx="0" cy="-34" r="7" fill="#e7b58c"/><path d="M-7 -37 Q0 -45 7 -37 Q3 -40 0 -40 Q-3 -40 -7 -37 Z" fill="#5a2412"/>
      <path d="M-4.5 -36.5 l3 -1 M1.5 -38.5 l4 1.6" stroke="#5a2412" stroke-width="1.1" stroke-linecap="round"/>
      <circle cx="-2.6" cy="-34" r=".9" fill="#222"/><circle cx="3" cy="-34" r=".9" fill="#222"/>
      <path d="M-2 -30 h4" stroke="#8a4a2a" stroke-width=".9"/>
      <path d="M-9 0 L-8 -24 Q0 -28 8 -24 L9 0 Z" fill="#7a3a1c"/>
      <path d="M-8 -17 Q0 -12 8 -17" stroke="#e7b58c" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M-8 -15 Q0 -19 8 -15" stroke="#6a2e14" stroke-width="3" fill="none" stroke-linecap="round"/>    <path d="M-8 -16 H8" stroke="#e7b58c" stroke-width="3" stroke-linecap="round"/></g>`;
  if (t === 2) return sky(id, ["#ffcf8a", "#ff9a6a"]) + defs + `
    <g stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".9">
      <path d="M134 56 Q146 76 134 96"/><path d="M146 46 Q164 76 146 106"/><path d="M158 36 Q182 76 158 116"/></g>
    ${cone(100, 76, 1, 0)}
    ${[[30, 154, 1.2], [52, 150, 1.3], [76, 156, 1.2], [100, 150, 1.35], [124, 156, 1.2], [148, 150, 1.3], [172, 154, 1.2], [40, 170, 1.5], [88, 170, 1.5], [136, 170, 1.5], [182, 170, 1.4]].map(([x, y, s]) => person(x, y, s, "#5a2412")).join("")}
    ${[[64, 132], [112, 128], [160, 134]].map(([x, y]) => `<path d="M${x} ${y} v-18" stroke="#5a2412" stroke-width="2"/><rect x="${x - 10}" y="${y - 30}" width="20" height="13" fill="#fff" stroke="#5a2412"/>`).join("")}`;
  /* level 3: a Roman tribune, spotlights, confetti and a sea of heads */
  return sky(id, ["#5a1a2a", "#c2452a", "#ffb35a"]) + defs + `
    <path d="M30 0 L96 90 L110 84 Z" fill="#fff4c8" opacity=".25"/><path d="M178 0 L104 90 L92 84 Z" fill="#fff4c8" opacity=".25"/>
    ${Array.from({length: 26}, (_, i) => { const x = 24 + (i * 41) % 156, y = 24 + (i * 29) % 70, c = ["#ffd35a", "#fff", "#4ac0ff", "#ff6ab0"][i % 4]; return `<rect x="${x}" y="${y}" width="4" height="2.4" fill="${c}" transform="rotate(${(i * 37) % 90} ${x} ${y})"/>`; }).join("")}
    <path d="M60 116 H140 L146 124 H54 Z" fill="#f4ecd8"/>
    <rect x="58" y="124" width="84" height="20" fill="#e9dfc6"/>
    ${[62, 76, 90, 104, 118, 132].map(x => `<rect x="${x}" y="126" width="6" height="18" fill="#d6c9a8"/>`).join("")}
    <path d="M48 144 H152 V150 H48 Z" fill="#cbbd98"/>
    <path d="M70 116 C74 104 86 104 90 116 M110 116 C114 104 126 104 130 116" fill="none" stroke="#6b8a3a" stroke-width="2"/>
    ${[74, 80, 86, 114, 120, 126].map((x, i) => `<ellipse cx="${x}" cy="${107 + (i % 3 === 1 ? -2 : 1)}" rx="3" ry="1.6" fill="#78a03a" transform="rotate(${i < 3 ? -30 : 30} ${x} 107)"/>`).join("")}
    <g transform="translate(100 116)">
      <path d="M-10 0 L-8 -26 Q0 -30 8 -26 L10 0 Z" fill="#fbf7ee" stroke="#b7a57e"/>
      <path d="M-8 -26 Q-2 -14 10 -8" stroke="#b5462f" stroke-width="3" fill="none"/>
      <circle cx="0" cy="-34" r="7" fill="#e7b58c"/>
      <path d="M-7 -37 Q0 -44 7 -37" stroke="#78a03a" stroke-width="2.4" fill="none"/>
      <path d="M-7 -24 L-18 -44" stroke="#e7b58c" stroke-width="4" stroke-linecap="round"/>
      <path d="M7 -24 L14 -30" stroke="#e7b58c" stroke-width="4" stroke-linecap="round"/></g>
    ${cone(128, 84, 0.42, -18)}
    <g stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9">
      <path d="M142 66 Q152 78 146 92"/><path d="M152 58 Q166 78 158 100"/><path d="M162 50 Q180 78 170 108"/></g>
    ${[[16, 150], [32, 146], [48, 152], [152, 152], [168, 146], [184, 150], [24, 164], [44, 166], [64, 162], [84, 166], [116, 166], [136, 162], [156, 166], [176, 164]].map(([x, y]) => person(x, y, 1.15, "#3a0e0a")).join("")}
    ${[[20, 132], [184, 134], [40, 146], [164, 144]].map(([x, y]) => `<path d="M${x} ${y} l-3 -10 M${x} ${y} l3 -10" stroke="#3a0e0a" stroke-width="2" stroke-linecap="round"/>`).join("")}`;
};
