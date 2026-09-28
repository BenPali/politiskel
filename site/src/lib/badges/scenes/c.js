import { ART } from './base.js';
import { star, person, cloud, blade, turbine, sky, starfield, tower } from '../draw.js';

/* Badges, set C: class struggle, social democracy, market, liberties,
   tradition, nation, cosmopolitanism. Wrapped so its helpers never clash
   with the other art files. */
(() => {
  const range = n => Array.from({ length: n }, (_, i) => i);
  const worker = (x, y, r = 0, s = 1, over = "#2f5a9a") => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">
    <path d="M-5 0 L-8 -18 M5 0 L7 -18" stroke="#2a2a33" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M-9 -18 L-8 -40 H8 L9 -18 Z" fill="${over}"/><path d="M-4 -40 V-30 M4 -40 V-30" stroke="#1d3a66" stroke-width="1.4"/>
    <circle cx="0" cy="-47" r="6.5" fill="#e7b58c"/>
    <path d="M-7 -49 Q0 -58 7 -49 L11 -48 L11 -46.5 H-7 Z" fill="#3a3a44"/></g>`;
  const boss = (x, y, r = 0, s = 1) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">
    <path d="M-5 0 L-6 -16 M5 0 L6 -16" stroke="#222" stroke-width="4.5" stroke-linecap="round"/>
    <ellipse cx="0" cy="-26" rx="12" ry="13" fill="#2b2b36"/><path d="M-3 -38 L0 -22 L3 -38 Z" fill="#fff"/><path d="M-1.4 -35 L0 -24 L1.4 -35 Z" fill="#c0392b"/>
    <circle cx="0" cy="-45" r="6.5" fill="#f0c8a4"/><circle cx="2.5" cy="-45.5" r="2" fill="none" stroke="#c9a23a" stroke-width=".8"/>
    <rect x="-7" y="-64" width="14" height="13" fill="#15151a"/><rect x="-10" y="-52" width="20" height="2.6" rx="1" fill="#15151a"/><rect x="-7" y="-55" width="14" height="2" fill="#8a1c1c"/></g>`;
  const rose = (x, y, k = 1, stem = 0) => `<g transform="translate(${x} ${y}) scale(${k})">
    ${stem ? `<path d="M0 4 Q-3 ${stem * 0.5} 1 ${stem}" stroke="#3f7a2e" stroke-width="2.4" fill="none"/>
    <path d="M0 ${stem * 0.4} q-12 -2 -14 -10 q10 0 14 10" fill="#5d9a3a"/><path d="M0 ${stem * 0.6} q12 -3 13 -11 q-10 1 -13 11" fill="#5d9a3a"/>` : ""}
    <path d="M0 6 C-13 4 -15 -10 -7 -15 C-3 -22 7 -21 10 -13 C15 -5 10 6 0 6 Z" fill="#d62b4a"/>
    <path d="M-6 -6 C-6 -14 4 -16 6 -9 C8 -3 0 1 -6 -6 Z" fill="#a8163a"/>
    <path d="M-2 -9 C0 -13 4 -12 3 -8" stroke="#ff8aa2" stroke-width="1.2" fill="none"/>
    <path d="M-12 -2 C-8 2 -2 3 4 1" stroke="#ff8aa2" stroke-width="1" fill="none" opacity=".7"/></g>`;
  const torch = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 V-22" stroke="#6b4a2e" stroke-width="2"/>
    <circle cx="0" cy="-26" r="7" fill="#ffb347" opacity=".3"/><path d="M-3 -22 C-5 -28 -1 -30 0 -35 C3 -30 5 -27 3 -22 Z" fill="#ffcf5a"/></g>`;
  const tricolore = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w / 3}" height="${h}" fill="#1f4aa8"/><rect x="${x + w / 3}" y="${y}" width="${w / 3}" height="${h}" fill="#fff"/><rect x="${x + 2 * w / 3}" y="${y}" width="${w / 3}" height="${h}" fill="#e0322e"/>`;
  const cocardeMark = (x, y, r) => `<g transform="translate(${x} ${y})">
    <path d="M${-r * 0.5} ${r * 0.6} L${-r * 0.9} ${r * 2.1} L${-r * 0.35} ${r * 1.7} L${-r * 0.1} ${r * 2.2} L${r * 0.1} ${r * 0.7} Z" fill="#1f4aa8"/>
    <path d="M${r * 0.5} ${r * 0.6} L${r * 0.9} ${r * 2.1} L${r * 0.35} ${r * 1.7} L${r * 0.1} ${r * 2.2} L${-r * 0.1} ${r * 0.7} Z" fill="#e0322e"/>
    <circle r="${r}" fill="#e0322e"/><circle r="${r * 0.68}" fill="#fff"/><circle r="${r * 0.38}" fill="#1f4aa8"/>
    ${range(16).map(i => `<path d="M0 0 L${r * Math.cos(i * Math.PI / 8)} ${r * Math.sin(i * Math.PI / 8)}" stroke="#000" stroke-opacity=".12" stroke-width=".8"/>`).join("")}</g>`;
  const rooster = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M14 -30 C34 -52 44 -40 40 -20 C36 -8 26 -2 18 -4" fill="#1f4a3a"/>
    <path d="M16 -28 C30 -58 46 -54 44 -30" fill="none" stroke="#2a6ab0" stroke-width="5" stroke-linecap="round"/>
    <path d="M18 -26 C38 -46 50 -34 42 -14" fill="none" stroke="#1f3a6a" stroke-width="4" stroke-linecap="round"/>
    <path d="M-18 -30 C-22 -10 -10 4 8 2 C22 0 28 -14 20 -28 C12 -40 -10 -44 -18 -30 Z" fill="#c8552a"/>
    <path d="M-10 -26 C-6 -12 6 -8 16 -14" stroke="#a03a1a" stroke-width="2" fill="none"/>
    <path d="M-16 -32 C-20 -46 -14 -58 -4 -58 C4 -58 6 -48 2 -40 Z" fill="#e0a13a"/>
    <path d="M-12 -58 q2 -8 5 -2 q2 -8 5 -1 q3 -6 4 1 q-6 4 -14 2 Z" fill="#e0322e"/>
    <path d="M-16 -50 L-26 -48 L-16 -45 Z" fill="#f2c230"/><path d="M-15 -44 q-4 6 0 9 q4 -3 0 -9" fill="#e0322e"/>
    <circle cx="-9" cy="-51" r="1.8" fill="#1a1a1a"/>
    <path d="M-4 2 V16 M6 2 V16 M-4 16 l-5 3 M-4 16 l4 3 M6 16 l-5 3 M6 16 l4 3" stroke="#d9a21c" stroke-width="2.2" stroke-linecap="round"/></g>`;
  const burst = (x, y, r, col) => `<g stroke="${col}" stroke-width="1.8" stroke-linecap="round">${range(12).map(i => { const a = i * Math.PI / 6; return `<path d="M${x + r * 0.35 * Math.cos(a)} ${y + r * 0.35 * Math.sin(a)} L${x + r * Math.cos(a)} ${y + r * Math.sin(a)}"/>`; }).join("")}</g><circle cx="${x}" cy="${y}" r="2" fill="${col}"/>`;
  const plane = (x, y, r = 0, s = 1, col = "#fff") => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})" fill="${col}">
    <path d="M-10 0 Q0 -2.4 12 0 Q0 2.4 -10 0 Z"/><path d="M-2 0 L-6 -9 L-2 -9 L4 0 Z"/><path d="M-2 0 L-6 9 L-2 9 L4 0 Z"/><path d="M-9 0 L-12 -4 L-10 -4 L-7 0 Z"/></g>`;

  /* ---------------- Lutte des classes ---------------- */
  ART.classstruggle = {
    rim: "#a3241c", ink: "#4a0d08",
    art: (id, t = 2) => {
      if (t === 1) return sky(id, ["#f3c7a4", "#fbead4"]) + `
        <g fill="#b9a79a">${[[40, 90, 10], [58, 84, 8]].map(([x, top, w]) => `<rect x="${x}" y="${top}" width="${w}" height="${130 - top}"/>`).join("")}
        <path d="M30 130 V110 L50 100 V110 L70 100 V110 L90 100 V130 Z"/></g>
        ${cloud(46, 80, 0.7, 0.7)}
        <path d="M0 128 Q60 122 120 128 T200 126 V200 H0 Z" fill="#9c8a6a"/>
        <path d="M0 142 Q80 134 200 142 V200 H0 Z" fill="#7d6d52"/>
        <g transform="translate(128 150)">
          <rect x="-24" y="-12" width="48" height="6" rx="2" fill="#6b4a2e"/><rect x="-20" y="-6" width="4" height="12" fill="#5a3b1c"/><rect x="16" y="-6" width="4" height="12" fill="#5a3b1c"/>
          <path d="M-6 -12 L-8 -30 H6 L8 -12 Z" fill="#2f5a9a"/>
          <circle cx="-1" cy="-37" r="6.5" fill="#e7b58c"/><path d="M-8 -39 Q-1 -48 6 -39 L10 -38 V-36.5 H-8 Z" fill="#3a3a44"/>
          <path d="M-18 -24 L-4 -20 L-4 -30 L-18 -32 Z" fill="#c0392b"/><path d="M-4 -20 L10 -24 L10 -32 L-4 -30 Z" fill="#a52a20"/>
          <path d="M-15 -28 h8 M-15 -25 h8 M0 -27 h7" stroke="#f3d2c6" stroke-width=".8"/>
          <path d="M-6 -22 L-12 -24 M6 -22 L8 -26" stroke="#2f5a9a" stroke-width="3" stroke-linecap="round"/></g>
        <circle cx="152" cy="62" r="11" fill="#ffd66b"/>`;
      if (t === 2) return sky(id, ["#ffc98f", "#ffe8c8"]) + `
        <circle cx="100" cy="72" r="26" fill="#fff0c0" opacity=".7"/>
        <path d="M0 136 Q100 128 200 136 V200 H0 Z" fill="#b98a5a"/>
        <ellipse cx="100" cy="146" rx="30" ry="6" fill="#8a5e36"/>
        <path d="M100 150 V120" stroke="#fff" stroke-width="2" stroke-dasharray="4 3"/>
        <path d="M64 112 Q100 122 136 110" stroke="#c9a36a" stroke-width="3.2" fill="none"/>
        <path d="M100 119 l-4 10 l8 0 Z" fill="#d23a2e"/>
        ${worker(64, 148, -18, 1.1)}
        <path d="M58 112 L72 108 M54 116 L68 116" stroke="#e7b58c" stroke-width="3.4" stroke-linecap="round"/>
        ${boss(138, 146, 18, 1.1)}
        <path d="M140 110 L128 108 M144 112 L130 114" stroke="#f0c8a4" stroke-width="3.4" stroke-linecap="round"/>
        ${[[118, 142], [124, 150], [112, 152]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.4" fill="#f2c230" stroke="#a87a10" stroke-width=".8"/>`).join("")}
        ${[[30, 150], [70, 150]].map(([x, y]) => `<path d="M${x} ${y} q4 -4 8 0" stroke="#6b4a2e" fill="none"/>`).join("")}`;
      return sky(id, ["#1a0610", "#6a0f18", "#d2402a"]) + `
        <defs><radialGradient id="${id}gs"><stop offset="0" stop-color="#ffd35a" stop-opacity=".9"/><stop offset="1" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient></defs>
        ${starfield(10, 5)}
        <circle cx="100" cy="66" r="48" fill="url(#${id}gs)"/>
        <g opacity=".35" stroke="#ffd35a" stroke-width="2">${range(16).map(i => { const a = i * Math.PI / 8; return `<path d="M${100 + 30 * Math.cos(a)} ${66 + 30 * Math.sin(a)} L${100 + 60 * Math.cos(a)} ${66 + 60 * Math.sin(a)}"/>`; }).join("")}</g>
        <path d="${star(100, 66, 24, 10)}" fill="#e0231c" stroke="#ffd35a" stroke-width="2"/>
        <g fill="#2a0a0c"><rect x="136" y="98" width="48" height="6"/><path d="M134 98 L160 84 L186 98 Z"/>
        ${[140, 150, 160, 170, 180].map(x => `<rect x="${x - 2}" y="104" width="4" height="34"/>`).join("")}<rect x="134" y="136" width="52" height="6"/></g>
        <path d="M0 140 Q100 132 200 140 V200 H0 Z" fill="#240608"/>
        ${[[34, 76, 22], [66, 66, 26], [156, 70, 22]].map(([x, top, w]) => `<path d="M${x} 150 V${top}" stroke="#6b4a2e" stroke-width="2.4"/><path d="M${x + 1} ${top + 2} c${w * 0.35} -4 ${w * 0.6} 6 ${w} 0 v${w * 0.7} c-${w * 0.4} 6 -${w * 0.65} -4 -${w} 0 Z" fill="#e0231c"/>`).join("")}
        ${[[24, 150], [48, 146], [88, 150], [112, 146], [132, 150], [176, 148]].map(([x, y]) => torch(x, y - 26, 1)).join("")}
        ${[[20, 162, 1.5], [38, 158, 1.4], [56, 162, 1.6], [76, 156, 1.4], [96, 162, 1.6], [116, 158, 1.4], [136, 162, 1.6], [156, 158, 1.4], [178, 162, 1.5]].map(([x, y, s]) => person(x, y, s, "#120406")).join("")}
        ${[[66, 136], [126, 136]].map(([x, y]) => `<path d="M${x} ${y} l-3 -10" stroke="#120406" stroke-width="2.6" stroke-linecap="round"/><circle cx="${x - 3.4}" cy="${y - 12}" r="3" fill="#120406"/>`).join("")}`;
    }
  };

  /* ---------------- Social-démocratie ---------------- */
  ART.rose = {
    rim: "#d9477a", ink: "#6a1030",
    art: (id, t = 2) => {
      if (t === 1) return sky(id, ["#fbe3ea", "#fff8f0"]) + `
        <rect x="0" y="120" width="200" height="80" fill="#e8d2b8"/><rect x="0" y="120" width="200" height="4" fill="#d6bb9a"/>
        <path d="M150 40 h30 v60 h-30 Z" fill="#fff" opacity=".6"/><path d="M165 40 v60 M150 70 h30" stroke="#e8c8d0" stroke-width="2"/>
        <path d="M84 126 Q80 104 88 92 H112 Q120 104 116 126 Z" fill="#cfe6f0" fill-opacity=".7" stroke="#8fb0c4" stroke-width="1.4"/>
        <path d="M88 110 Q100 114 112 110 V124 H88 Z" fill="#a9d0e4" opacity=".6"/>
        ${rose(100, 62, 1, 40)}
        <ellipse cx="100" cy="128" rx="20" ry="3" fill="#000" opacity=".12"/>
        <path d="M40 132 h28" stroke="#c7aa86" stroke-width="2"/><rect x="42" y="118" width="22" height="10" rx="2" fill="#f4efe2" stroke="#c7aa86"/>`;
      if (t === 2) return `<defs><radialGradient id="${id}bg" cx=".5" cy=".4"><stop offset="0" stop-color="#ffd0dc"/><stop offset="1" stop-color="#e2587e"/></radialGradient></defs>
        <rect width="200" height="200" fill="url(#${id}bg)"/>
        <g opacity=".25" fill="#fff">${range(12).map(i => { const a = i * Math.PI / 6; return `<path d="M100 70 L${100 + 140 * Math.cos(a)} ${70 + 140 * Math.sin(a)} L${100 + 140 * Math.cos(a + 0.18)} ${70 + 140 * Math.sin(a + 0.18)} Z"/>`; }).join("")}</g>
        ${rose(100, 58, 1.7, 0)}
        <path d="M100 68 V112" stroke="#3f7a2e" stroke-width="3.4"/>
        <path d="M100 80 q-16 -2 -20 -14 q14 0 20 14" fill="#5d9a3a"/><path d="M100 92 q16 -3 18 -15 q-14 1 -18 15" fill="#5d9a3a"/>
        <path d="M80 108 C80 100 88 98 96 100 L118 100 C126 100 128 108 124 112 L124 130 C124 140 116 146 106 146 L92 146 C84 146 78 140 78 132 Z" fill="#e7b58c" stroke="#9a6a44" stroke-width="1.4"/>
        <path d="M84 110 H122 M84 118 H122 M85 126 H120" stroke="#9a6a44" stroke-width="1.2"/>
        <path d="M80 112 C74 114 72 124 78 128" stroke="#9a6a44" stroke-width="1.2" fill="#e7b58c"/>
        <path d="M84 146 L82 170 H116 L114 146 Z" fill="#d6d1c8"/><path d="M82 150 H116" stroke="#b9b2a6" stroke-width="2"/>`;
      return sky(id, ["#ffd3e0", "#fff2ec"]) + `
        <g opacity=".3" fill="#fff">${range(12).map(i => { const a = -Math.PI + i * Math.PI / 11; return `<path d="M100 150 L${100 + 170 * Math.cos(a)} ${150 + 170 * Math.sin(a)} L${100 + 170 * Math.cos(a + 0.1)} ${150 + 170 * Math.sin(a + 0.1)} Z"/>`; }).join("")}</g>
        <rect x="24" y="136" width="152" height="10" fill="#e0587e"/><rect x="18" y="146" width="164" height="16" fill="#b9304e"/>
        <path d="M18 146 H182" stroke="#8a1a36" stroke-width="2"/>
        <g transform="translate(116 137) scale(.9)">
          <rect x="-30" y="-24" width="13" height="24" rx="4" fill="#8e96a0"/><rect x="-10" y="-24" width="13" height="24" rx="4" fill="#9aa2ac"/>
          <rect x="12" y="-24" width="13" height="24" rx="4" fill="#8e96a0"/><rect x="30" y="-24" width="13" height="24" rx="4" fill="#9aa2ac"/>
          <ellipse cx="8" cy="-36" rx="40" ry="22" fill="#a4acb6"/>
          <path d="M47 -40 q10 6 6 18" stroke="#8e96a0" stroke-width="3" fill="none" stroke-linecap="round"/>
          <circle cx="-34" cy="-44" r="19" fill="#b2bac4"/>
          <path d="M-26 -62 C-2 -66 4 -36 -8 -24 C-14 -18 -24 -22 -26 -30 Z" fill="#b8c0ca" stroke="#8e96a0" stroke-width="1.4"/>
          <path d="M-20 -56 C-6 -56 -4 -38 -12 -30" stroke="#e8a6b6" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>
          <circle cx="-40" cy="-50" r="2.8" fill="#222"/><circle cx="-39" cy="-51" r=".9" fill="#fff"/>
          <path d="M-46 -40 C-58 -40 -64 -52 -62 -66 C-61 -72 -54 -72 -54 -66 C-55 -58 -52 -52 -44 -52 Z" fill="#a4acb6" stroke="#8e96a0" stroke-width="1.2"/>
          <path d="M-44 -34 C-50 -30 -56 -32 -58 -38" stroke="#f7f1e2" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M-58 -68 V-76" stroke="#3f7a2e" stroke-width="2.4"/>
          <path d="M-58 -72 q8 -1 9 -7 q-7 0 -9 7" fill="#5d9a3a"/>
          ${rose(-58, -80, 1.1, 0)}</g>
        <g transform="translate(46 150)">${[0, 1, 2].map(i => `<path d="${star(i * 54, 4, 5, 2)}" fill="#ffe7a0"/>`).join("")}</g>`;
    }
  };

  /* ---------------- Marché ---------------- */
  ART.market = {
    rim: "#1f6fb2", ink: "#0b2e52",
    art: (id, t = 2) => {
      if (t === 1) return sky(id, ["#cfe8f8", "#fbf5e6"]) + `
        <rect x="0" y="136" width="200" height="64" fill="#cbb89a"/><rect x="0" y="136" width="200" height="3" fill="#b3a07e"/>
        <rect x="44" y="76" width="4" height="64" fill="#6b4a2e"/><rect x="152" y="76" width="4" height="64" fill="#6b4a2e"/>
        ${range(8).map(i => `<rect x="${40 + i * 15}" y="62" width="15" height="18" fill="${i % 2 ? '#fff' : '#2f7ac0'}"/><path d="M${40 + i * 15} 80 a7.5 7.5 0 0 0 15 0 Z" fill="${i % 2 ? '#fff' : '#2f7ac0'}"/>`).join("")}
        <path d="M38 62 H162 L156 54 H44 Z" fill="#1f5a96"/>
        <rect x="40" y="116" width="120" height="24" fill="#a0724a"/><path d="M40 122 H160 M40 130 H160" stroke="#855a36" stroke-width="1.4"/>
        ${[[56, "#f28b2a"], [66, "#f28b2a"], [61, "#f5a04a"], [88, "#d23a2e"], [98, "#e0463a"], [93, "#c0302a"], [122, "#7fb24f"], [132, "#6aa03c"], [127, "#8fc460"], [148, "#f2c230"]].map(([x, c], i) => `<circle cx="${x}" cy="${i % 3 === 2 ? 106 : 112}" r="6" fill="${c}"/><path d="M${x} ${(i % 3 === 2 ? 106 : 112) - 6} l1 -3" stroke="#3f6e2a" stroke-width="1.2"/>`).join("")}
        <path d="M144 118 l6 -12 l6 12 Z" fill="#fff" stroke="#999" stroke-width=".6"/>`;
      if (t === 2) return sky(id, ["#8fcaf0", "#e8f6fb"]) + `
        <g fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="4 4" opacity=".9"><path d="M20 76 Q100 20 180 70"/><path d="M26 100 Q110 60 186 96"/></g>
        ${plane(150, 44, 22, 0.8)}
        <path d="M60 38 q4 -3 8 0 q4 -3 8 0" stroke="#445" stroke-width="1.2" fill="none"/>
        <path d="M0 118 H200 V200 H0 Z" fill="#2e7ab0"/><path d="M0 126 q20 -3 40 0 t40 0 t40 0 t40 0 t40 0" stroke="#8fc6e8" stroke-width="1.4" fill="none"/>
        <g stroke="#e0a526" stroke-width="3" fill="none"><path d="M26 118 V56 H72 M34 56 L26 66 M60 56 V78"/></g><path d="M58 78 h4 v8 h-4 Z" fill="#555"/>
        <path d="M62 142 L70 120 H182 L176 142 Z" fill="#1f3a52"/><path d="M66 132 H180" stroke="#c0392b" stroke-width="3"/>
        <rect x="160" y="96" width="14" height="24" fill="#f4efe2"/><rect x="162" y="100" width="10" height="4" fill="#8fc6e8"/><rect x="164" y="88" width="4" height="8" fill="#555"/>
        ${[[76, 106, "#c0392b"], [98, 106, "#e0a526"], [120, 106, "#2f7ac0"], [142, 106, "#3f7a3a"], [86, 92, "#8e44ad"], [108, 92, "#d35400"], [130, 92, "#16a085"]].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="22" height="14" fill="${c}" stroke="#1f2a30" stroke-width=".8"/>` + [1, 2, 3].map(i => `<path d="M${x + i * 5.5} ${y + 2} V${y + 12}" stroke="#000" stroke-opacity=".22"/>`).join("")).join("")}`;
      return sky(id, ["#070b1c", "#15234a", "#2a3a6a"]) + `
        <defs><linearGradient id="${id}ar" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2ad18a"/><stop offset="1" stop-color="#b8ffda"/></linearGradient></defs>
        ${starfield(8, 17)}
        <g fill="#0e1630">${[[30, 60, 22], [52, 40, 20], [74, 70, 18], [126, 50, 20], [148, 30, 22], [170, 64, 20]].map(([x, top, w]) => `<rect x="${x}" y="${top}" width="${w}" height="${160 - top}"/>`).join("")}</g>
        <g fill="#ffd96a" opacity=".8">${range(40).map(i => { const cols = [[30, 60, 22], [52, 40, 20], [74, 70, 18], [126, 50, 20], [148, 30, 22], [170, 64, 20]], b = cols[i % 6]; return `<rect x="${b[0] + 3 + (i * 7) % (b[2] - 6)}" y="${b[1] + 6 + ((i * 11) % 80)}" width="3" height="3"/>`; }).join("")}</g>
        <path d="M20 120 L50 108 L68 114 L96 88 L118 96 L150 58 L176 40" fill="none" stroke="url(#${id}ar)" stroke-width="5" stroke-linejoin="round"/>
        <path d="M176 40 L162 40 L178 26 L180 46 Z" fill="#b8ffda"/>
        ${[[40, 72], [150, 90], [62, 50], [132, 118], [168, 108], [36, 104]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#f2c230" stroke="#a87a10" stroke-width=".8"/>`).join("")}
        <g transform="translate(96 160)">
          <path d="M-30 0 C-30 -26 -20 -36 0 -36 C20 -36 30 -26 30 0 Z" fill="#1c2a4a"/>
          <path d="M-8 -36 L0 -12 L8 -36 Z" fill="#fff"/><path d="M-2.4 -34 L0 -16 L2.4 -34 Z" fill="#c0392b"/>
          <path d="M-8 -36 L-16 -20 L-4 -24 Z M8 -36 L16 -20 L4 -24 Z" fill="#26375e"/>
          <path d="M-18 -44 L-22 -74 L-8 -58 Z M18 -44 L22 -74 L8 -58 Z" fill="#6f747e"/><path d="M-16 -50 L-19 -68 L-11 -58 Z M16 -50 L19 -68 L11 -58 Z" fill="#c9a0a0"/>
          <path d="M-20 -46 C-20 -64 20 -64 20 -46 C20 -40 14 -36 0 -36 C-14 -36 -20 -40 -20 -46 Z" fill="#8a909a"/>
          <path d="M-10 -46 C-8 -38 8 -38 10 -46 L24 -40 C20 -32 -20 -30 -24 -40 Z" fill="#b8bcc4"/>
          <path d="M-12 -41 Q0 -34 12 -41" stroke="#fff" stroke-width="2" fill="none"/>
          ${[-8, -4, 0, 4, 8].map(x => `<path d="M${x - 1.2} -40 L${x} -37 L${x + 1.2} -40 Z" fill="#fff"/>`).join("")}
          <path d="M-22 -40 L-26 -38 L-22 -36 Z" fill="#222"/>
          <circle cx="-8" cy="-50" r="3" fill="#ffd35a"/><circle cx="8" cy="-50" r="3" fill="#ffd35a"/><circle cx="-7.5" cy="-50" r="1.2" fill="#111"/><circle cx="8.5" cy="-50" r="1.2" fill="#111"/>
          <path d="M-13 -55 L-4 -53 M13 -55 L4 -53" stroke="#555" stroke-width="1.4"/>
          <rect x="18" y="-40" width="18" height="3.4" rx="1.2" fill="#6b4a2e" transform="rotate(-10 18 -40)"/><circle cx="36" cy="-44" r="1.8" fill="#ff7a2a"/>
          <path d="M38 -48 q3 -6 0 -10 q4 -4 1 -9" stroke="#ccc" stroke-width="1" fill="none" opacity=".6"/></g>`;
    }
  };

  /* ---------------- Libertés publiques ---------------- */
  ART.liberties = {
    rim: "#6a4fb0", ink: "#2c1c5e",
    art: (id, t = 2) => {
      const gown = (x, y, s = 1, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">
        <path d="M-18 0 L-12 -40 Q0 -46 12 -40 L18 0 Z" fill="#1c1c24"/><path d="M-12 -40 L-20 -18 L-14 -16 Z M12 -40 L20 -18 L14 -16 Z" fill="#26262f"/>
        <path d="M-3 -42 L-4 -26 L0 -28 L4 -26 L3 -42 Z" fill="#fff"/><path d="M0 -42 V-28" stroke="#ccc" stroke-width=".8"/>
        <path d="M-12 -38 q-4 10 0 20" stroke="#3a3a46" stroke-width="1" fill="none"/></g>`;
      if (t === 1) return sky(id, ["#2a2a5a", "#6a5a9a", "#c8a6c8"]) + `
        ${starfield(12, 21)}<circle cx="146" cy="52" r="12" fill="#fff6d8"/><circle cx="150" cy="49" r="11" fill="#6a5a9a" opacity=".0"/>
        <path d="M20 128 Q70 118 120 124 T190 118" stroke="#4a3322" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M150 120 q14 -6 22 -18" stroke="#4a3322" stroke-width="4" fill="none"/>
        ${[[166, 100], [174, 110], [40, 120]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="3.2" fill="#4f7a3a" transform="rotate(-30 ${x} ${y})"/>`).join("")}
        <g transform="translate(92 118)">
          <ellipse cx="0" cy="-20" rx="18" ry="24" fill="#8a6440"/>
          <path d="M-12 -12 q12 16 24 0 q-4 18 -12 20 q-8 -2 -12 -20" fill="#c8a47a" opacity=".6"/>
          ${range(6).map(i => `<path d="M${-8 + (i % 3) * 8} ${-12 + Math.floor(i / 3) * 7} q2 3 4 0" stroke="#5a3f24" stroke-width="1" fill="none"/>`).join("")}
          <circle cx="0" cy="-38" r="16" fill="#a47a4e"/>
          <path d="M-14 -48 L-12 -60 L-5 -50 Z M14 -48 L12 -60 L5 -50 Z" fill="#8a6440"/>
          <circle cx="-7" cy="-38" r="7" fill="#f4e8c8"/><circle cx="7" cy="-38" r="7" fill="#f4e8c8"/>
          <circle cx="-7" cy="-38" r="4.6" fill="#f2b21a"/><circle cx="7" cy="-38" r="4.6" fill="#f2b21a"/>
          <circle cx="-7" cy="-38" r="2.4" fill="#111"/><circle cx="7" cy="-38" r="2.4" fill="#111"/>
          <circle cx="-6" cy="-39" r=".8" fill="#fff"/><circle cx="8" cy="-39" r=".8" fill="#fff"/>
          <path d="M-2 -32 L0 -27 L2 -32 Z" fill="#e0a13a"/>
          <path d="M-6 4 v4 M-2 4 v4 M2 4 v4 M6 4 v4" stroke="#e0a13a" stroke-width="1.6"/></g>`;
      if (t === 2) return sky(id, ["#d9d0f2", "#f7f3ea"]) + `
        <rect x="0" y="132" width="200" height="68" fill="#7a5a3a"/><rect x="0" y="132" width="200" height="4" fill="#94704a"/>
        <path d="M63 52 H69 V56 H63 Z" fill="#888"/><path d="M66 56 L49 68 H83 Z" fill="none" stroke="#888" stroke-width="1.6"/>
        ${gown(66, 124, 1.2)}
        <path d="M96 130 L100 104 Q122 98 144 106 L144 132 Q122 126 100 132 Z" fill="#f7f1e2" stroke="#9e8a62"/>
        <path d="M144 106 Q166 98 186 104 L186 130 Q166 126 144 132 Z" fill="#fbf6ea" stroke="#9e8a62"/>
        ${[0, 1, 2, 3].map(i => `<path d="M${106} ${110 + i * 5} q16 -3 32 0 M${150} ${110 + i * 5} q16 -3 30 0" stroke="#c9b894" stroke-width="1"/>`).join("")}
        <g fill="none" stroke="#8a8a96" stroke-width="3">
          <ellipse cx="118" cy="80" rx="7" ry="5" transform="rotate(-20 118 80)"/><ellipse cx="130" cy="74" rx="7" ry="5" transform="rotate(-20 130 74)"/>
          <path d="M136 72 a7 5 -20 0 1 8 -8" /><path d="M150 60 a7 5 -20 0 1 8 4"/><ellipse cx="164" cy="60" rx="7" ry="5" transform="rotate(20 164 60)"/></g>
        <path d="M144 66 l3 -4 M146 70 l5 -2 M148 64 l2 -6" stroke="#ffd35a" stroke-width="1.6" stroke-linecap="round"/>
        <g transform="translate(160 146) rotate(-24)"><rect x="-16" y="-6" width="20" height="12" rx="3" fill="#6b4a2e"/><rect x="2" y="-2" width="26" height="4" fill="#8a5e36"/></g>`;
      return sky(id, ["#fff1b8", "#e8dcff", "#b9a6f0"]) + `
        <g opacity=".45" fill="#fff">${range(14).map(i => { const a = -Math.PI + i * Math.PI / 13; return `<path d="M100 150 L${100 + 170 * Math.cos(a)} ${150 + 170 * Math.sin(a)} L${100 + 170 * Math.cos(a + 0.09)} ${150 + 170 * Math.sin(a + 0.09)} Z"/>`; }).join("")}</g>
        <g stroke="#5a5a66" stroke-width="4" stroke-linecap="round" fill="none">
          <path d="M140 150 V66"/><path d="M152 150 V90 Q152 74 168 68"/><path d="M164 150 V110 Q166 92 184 92"/><path d="M176 150 V124"/><path d="M134 66 H182"/></g>
        ${[[40, 58, 0.9], [66, 40, 0.7], [30, 90, 0.6]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-12 0 C-4 -6 4 -6 8 -2 C12 -12 20 -16 28 -16 C22 -8 20 -2 18 2 C10 8 -2 8 -12 0 Z" fill="#fff" stroke="#b9cde3"/><path d="M-12 0 L-17 1 L-12 2 Z" fill="#f0a64a"/></g>`).join("")}
        <path d="M0 150 Q100 142 200 150 V200 H0 Z" fill="#8a7a6a"/>
        <g transform="translate(84 152)">
          <path d="M-6 -2 L-14 12 M6 -2 L18 10" stroke="#1c1c24" stroke-width="5" stroke-linecap="round"/>
          <path d="M-16 0 L-12 -40 Q0 -46 12 -40 L20 -2 Z" fill="#1c1c24"/>
          <path d="M12 -40 C26 -36 32 -24 38 -12 L30 -10 C26 -20 20 -28 14 -30 Z" fill="#26262f"/>
          <path d="M-3 -42 L-4 -28 L0 -30 L4 -28 L3 -42 Z" fill="#fff"/>
          <circle cx="0" cy="-50" r="7" fill="#e7b58c"/><path d="M-7 -52 Q0 -62 7 -52 Q6 -56 0 -57 Q-6 -56 -7 -52 Z" fill="#dcdcdc"/>
          <path d="M-12 -38 L-26 -60" stroke="#1c1c24" stroke-width="5" stroke-linecap="round"/>
          <g transform="translate(-30 -64) rotate(-8)">${range(5).map(i => `<rect x="${-14 + (i % 2) * 2}" y="${-i * 8}" width="${26 - (i % 3) * 3}" height="7" rx="1" fill="${["#8a2a2a", "#2a4a8a", "#3f6a3a", "#6a3a8a", "#8a6a2a"][i]}" stroke="#222" stroke-width=".6"/>`).join("")}
            <path d="M-12 -38 q10 -10 22 -2 q-6 4 -2 10" fill="#f7f1e2" stroke="#9e8a62"/></g>
          <path d="M30 -10 q6 2 10 -2" stroke="#8a8a96" stroke-width="2.4" fill="none"/>
          <g fill="none" stroke="#8a8a96" stroke-width="2.4"><ellipse cx="44" cy="-14" rx="4" ry="3"/><ellipse cx="50" cy="-19" rx="4" ry="3"/></g>
          <path d="M52 -24 l5 -5 M55 -20 l6 -2" stroke="#ffd35a" stroke-width="1.6" stroke-linecap="round"/></g>
        ${range(6).map(i => `<path d="M${20 + i * 12} ${146 + (i % 2) * 2} q2 -3 4 0" stroke="#6a5a4a" fill="none"/>`).join("")}`;
    }
  };

  /* ---------------- Tradition ---------------- */
  ART.temple = {
    rim: "#b08a3a", ink: "#4d3810",
    art: (id, t = 2) => {
      if (t === 1) return sky(id, ["#cfe6f2", "#f4efdc"]) + `
        <path d="M0 112 Q100 104 200 112 V200 H0 Z" fill="#7fb04f"/>
        <rect x="0" y="118" width="200" height="82" fill="#8a6440"/>
        ${[128, 140, 152].map(y => `<path d="M0 ${y} Q100 ${y - 4} 200 ${y}" stroke="#7a5534" stroke-width="1" fill="none" opacity=".6"/>`).join("")}
        ${[[60, 150], [150, 138], [36, 140], [120, 156]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.6" fill="#a0805a"/>`).join("")}
        <g stroke="#5a3b1c" fill="none" stroke-linecap="round">
          <path d="M100 118 Q90 132 70 138 Q56 142 44 156" stroke-width="4"/><path d="M100 118 Q112 134 132 140 Q148 146 158 160" stroke-width="4"/>
          <path d="M100 120 Q98 140 102 162" stroke-width="4"/><path d="M70 138 Q64 150 66 162" stroke-width="2"/><path d="M132 140 Q140 152 136 164" stroke-width="2"/>
          <path d="M86 128 Q76 140 80 156" stroke-width="2"/><path d="M114 130 Q124 142 118 158" stroke-width="2"/></g>
        <path d="M92 118 C94 100 92 88 90 76 H110 C108 88 106 100 108 118 Z" fill="#6b4a2e"/>
        <path d="M96 116 C98 100 96 90 95 80" stroke="#503420" stroke-width="1.4" fill="none"/>
        ${[[100, 58, 32], [74, 70, 22], [126, 70, 22], [86, 48, 20], [116, 48, 20], [100, 38, 18]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#4f8a3a"/>`).join("")}
        ${[[88, 50, 10], [112, 44, 9], [100, 64, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#6aa84c" opacity=".7"/>`).join("")}
        ${[[80, 70], [118, 62], [102, 50]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="3.2" fill="#a07a3a"/>`).join("")}`;
      if (t === 2) return sky(id, ["#f0a86a", "#ffd9a0", "#fff1d0"]) + `
        <circle cx="100" cy="92" r="40" fill="#fff4c0" opacity=".6"/>
        <path d="M0 140 H200 V200 H0 Z" fill="#c9b08a"/>
        <path d="M44 138 H156 V144 H44 Z M38 144 H162 V150 H38 Z" fill="#e8dcc2" stroke="#b39a70" stroke-width=".8"/>
        <path d="M48 70 L100 44 L152 70 Z" fill="#efe4cc" stroke="#b39a70" stroke-width="1"/><path d="M60 67 L100 49 L140 67 Z" fill="#dcccaa"/>
        <rect x="46" y="70" width="108" height="9" fill="#e8dcc2" stroke="#b39a70" stroke-width=".8"/>
        ${range(8).map(i => `<rect x="${50 + i * 13.5}" y="72" width="4" height="4" fill="#cdbb94"/>`).join("")}
        ${[56, 76, 96, 116, 136].map(x => `<rect x="${x}" y="79" width="10" height="59" fill="#f4ecd8"/><path d="M${x + 2.5} 81 V136 M${x + 5} 81 V136 M${x + 7.5} 81 V136" stroke="#d6c7a4" stroke-width=".8"/><rect x="${x - 2}" y="79" width="14" height="4" fill="#e0d2b0"/>`).join("")}
        <g transform="translate(100 146) rotate(-8)"><circle cx="-24" cy="0" r="9" fill="none" stroke="#c9961a" stroke-width="4"/><circle cx="-24" cy="0" r="3" fill="#8a6a14"/>
          <rect x="-15" y="-2.4" width="40" height="4.8" fill="#d9a21c"/><rect x="16" y="2" width="4" height="8" fill="#d9a21c"/><rect x="22" y="2" width="4" height="6" fill="#d9a21c"/></g>`;
      return sky(id, ["#6a2a3a", "#d06a3a", "#ffc870"]) + `
        <defs><linearGradient id="${id}ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6e8ee"/><stop offset="1" stop-color="#8a909c"/></linearGradient></defs>
        <g opacity=".35" fill="#ffe7a0">${range(10).map(i => { const a = -Math.PI + i * Math.PI / 9; return `<path d="M100 110 L${100 + 160 * Math.cos(a)} ${110 + 160 * Math.sin(a)} L${100 + 160 * Math.cos(a + 0.12)} ${110 + 160 * Math.sin(a + 0.12)} Z"/>`; }).join("")}</g>
        <g fill="#3a1a24"><path d="M30 140 V80 L40 64 L50 80 V140 Z M150 140 V80 L160 64 L170 80 V140 Z"/><path d="M50 140 V96 H150 V140 Z"/><path d="M66 96 L100 70 L134 96 Z"/></g>
        <circle cx="100" cy="96" r="8" fill="#ffcf6a" opacity=".85"/><path d="M100 88 V104 M92 96 H108 M94 90 L106 102 M106 90 L94 102" stroke="#3a1a24" stroke-width="1.2"/>
        ${[[40, 70], [160, 70]].map(([x, y]) => `<path d="M${x} ${y} V${y - 16}" stroke="#3a1a24" stroke-width="1.6"/><path d="M${x} ${y - 16} l12 3 l-12 4 Z" fill="#e8e0d0"/><path d="M${x + 3} ${y - 14.5} v4 M${x + 1.5} ${y - 12.5} h3" stroke="#c0392b" stroke-width="1"/>`).join("")}
        <path d="M0 146 Q100 138 200 146 V200 H0 Z" fill="#5a3a2a"/>
        <g transform="translate(96 158)">
          <path d="M-14 -40 C-30 -30 -34 -6 -30 2 L-16 -2 Z" fill="#b01f24"/>
          <path d="M-6 -4 L-8 8 M6 -4 L8 8" stroke="#8a909c" stroke-width="5" stroke-linecap="round"/>
          <path d="M-14 -4 L-12 -44 H12 L14 -4 Z" fill="#f4efe6" stroke="#b9b2a6"/>
          <path d="M-2.5 -40 H2.5 V-8 H-2.5 Z M-10 -30 H10 V-25 H-10 Z" fill="#c0282a"/>
          <path d="M-12 -44 L-18 -24 M12 -44 L22 -58" stroke="url(#${id}ar)" stroke-width="5" stroke-linecap="round"/>
          <rect x="-9" y="-62" width="18" height="18" rx="2" fill="url(#${id}ar)" stroke="#6a707c"/><path d="M-9 -54 H9" stroke="#222" stroke-width="2"/><path d="M0 -50 V-44" stroke="#6a707c" stroke-width="1"/>
          <path d="M0 -62 q6 -10 14 -8" stroke="#c0282a" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M22 -58 L34 -94" stroke="url(#${id}ar)" stroke-width="3.4" stroke-linecap="round"/><path d="M17 -60 L28 -56" stroke="#8a6a14" stroke-width="3" stroke-linecap="round"/>
          <path d="M34 -94 l1 -6" stroke="#fff" stroke-width="1.4" opacity=".8"/>
          <path d="M-34 -32 H-14 V-10 Q-24 2 -34 -10 Z" fill="#f4efe6" stroke="#8a6a14" stroke-width="1.6"/><path d="M-26 -30 V-6 M-33 -22 H-15" stroke="#c0282a" stroke-width="3.4"/></g>`;
    }
  };

  /* ---------------- Nation ---------------- */
  ART.cocarde = {
    rim: "#2a4ea0", ink: "#10214f",
    art: (id, t = 2) => {
      if (t === 1) return sky(id, ["#bfe0f4", "#f6f1e0"]) + `
        ${cloud(40, 54, 0.9, 0.9)}${cloud(130, 44, 0.7, 0.8)}
        <path d="M0 118 Q60 100 110 114 T200 108 V200 H0 Z" fill="#8cc06a"/>
        <path d="M0 134 Q80 120 200 132 V200 H0 Z" fill="#6aa04a"/>
        <rect x="118" y="90" width="18" height="34" fill="#efe6d2"/><path d="M114 90 L127 60 L140 90 Z" fill="#6a6a7a"/><path d="M127 60 V50 M123 54 H131" stroke="#555" stroke-width="1.4"/>
        <rect x="123" y="104" width="8" height="12" rx="4" fill="#6b4a2e"/>
        ${[[50, 110, 30, "#f4ead6", "#b5462f"], [84, 114, 26, "#efe2c8", "#9a3a28"], [148, 116, 26, "#f4ead6", "#b5462f"]].map(([x, y, w, c, r]) => `<rect x="${x}" y="${y}" width="${w}" height="${128 - y + 6}" fill="${c}"/><path d="M${x - 3} ${y} L${x + w / 2} ${y - 12} L${x + w + 3} ${y} Z" fill="${r}"/><rect x="${x + 5}" y="${y + 6}" width="6" height="6" fill="#9fc3dd"/>`).join("")}
        <rect x="62" y="84" width="1.6" height="26" fill="#666"/>${tricolore(63.6, 85, 16, 10)}
        <path d="M30 140 q30 -6 60 0" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>`;
      if (t === 2) return `<defs><radialGradient id="${id}bg" cx=".5" cy=".45"><stop offset="0" stop-color="#f4f0ff"/><stop offset="1" stop-color="#b8c8ea"/></radialGradient></defs>
        <rect width="200" height="200" fill="url(#${id}bg)"/>
        <g opacity=".22">${tricolore(0, 0, 200, 200)}</g>
        <path d="M0 146 Q100 138 200 146 V200 H0 Z" fill="#9a7a52"/>
        ${range(8).map(i => `<ellipse cx="${30 + i * 20}" cy="${150 + (i % 2) * 3}" rx="3" ry="1.6" fill="#e0c070"/>`).join("")}
        ${rooster(96, 142, 1.35)}
        ${cocardeMark(92, 110, 9)}`;
      return sky(id, ["#081030", "#1a2a6a", "#3a3a8a"]) + `
        <defs><radialGradient id="${id}sp"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id}cup" x1="0" x2="1"><stop offset="0" stop-color="#a8761a"/><stop offset=".45" stop-color="#ffe27a"/><stop offset="1" stop-color="#b8841a"/></linearGradient></defs>
        ${burst(44, 50, 16, "#6a9aff")}${burst(156, 44, 18, "#ff5a5a")}${burst(100, 32, 14, "#ffffff")}${burst(170, 86, 10, "#ffffff")}${burst(30, 88, 10, "#ff5a5a")}
        <path d="M0 104 Q100 84 200 104 V120 H0 Z" fill="#141a3a"/>
        ${range(60).map(i => `<circle cx="${4 + (i * 13) % 196}" cy="${100 + (i % 3) * 5 - Math.sin(((i * 13) % 196) / 64) * 6}" r="1.6" fill="${["#3b6bff", "#fff", "#ff4a4a"][i % 3]}"/>`).join("")}
        <ellipse cx="100" cy="150" rx="70" ry="16" fill="url(#${id}sp)"/>
        <path d="M0 146 Q100 138 200 146 V200 H0 Z" fill="#2f7a3a"/>
        <path d="M70 146 H130 V160 H70 Z" fill="#f4efe6"/><path d="M70 146 H130" stroke="#d6cfc0" stroke-width="2"/>
        ${range(30).map(i => `<rect x="${(i * 41) % 190 + 5}" y="${(i * 29) % 110 + 20}" width="3.4" height="5" fill="${["#3b6bff", "#fff", "#ff4a4a"][i % 3]}" transform="rotate(${i * 37} ${(i * 41) % 190 + 6} ${(i * 29) % 110 + 22})"/>`).join("")}
        ${rooster(96, 130, 1.1)}
        <path d="M78 76 q-6 -2 -4 -10" stroke="#e0a13a" stroke-width="3" fill="none"/>
        <g transform="translate(66 60)"><path d="M-10 -12 H10 C10 0 6 6 0 6 C-6 6 -10 0 -10 -12 Z" fill="url(#${id}cup)" stroke="#8a5a10"/>
          <path d="M-10 -9 C-18 -9 -18 0 -9 0 M10 -9 C18 -9 18 0 9 0" stroke="#d9a21c" stroke-width="2" fill="none"/>
          <rect x="-2" y="6" width="4" height="5" fill="#d9a21c"/><rect x="-7" y="11" width="14" height="4" rx="1" fill="#b8841a"/>
          <path d="${star(0, -4, 3.4, 1.4)}" fill="#fff6c0"/></g>
        <path d="M82 96 C88 102 100 102 106 94 L108 100 C100 108 88 108 80 102 Z" fill="#1f4aa8"/><path d="M86 100 C92 104 100 104 104 98" stroke="#fff" stroke-width="2" fill="none"/><path d="M80 102 L74 116 L82 110 Z" fill="#e0322e"/>`;
    }
  };

  /* ---------------- Cosmopolitisme ---------------- */
  ART.globe = {
    rim: "#1f9aa8", ink: "#0b4148",
    art: (id, t = 2) => {
      if (t === 1) return sky(id, ["#9fd6f0", "#f4f8f0"]) + `
        <path d="M40 72 Q90 52 138 58" stroke="#fff" stroke-width="2.4" fill="none" opacity=".9"/>${plane(140, 58, -8, 0.9)}
        ${cloud(40, 90, 0.8, 0.8)}
        <path d="M0 126 Q70 112 130 122 T200 118 V200 H0 Z" fill="#9cc56a"/><path d="M0 142 Q90 130 200 140 V200 H0 Z" fill="#7aaa4a"/>
        <g transform="translate(76 142)">
          <path d="M-16 0 V-30 C-16 -44 16 -44 16 -30 V0 Z" fill="#c0592a"/><path d="M-16 -26 H16" stroke="#8a3a1a" stroke-width="1.6"/>
          <rect x="-11" y="-20" width="22" height="14" rx="3" fill="#a8461e"/><path d="M-6 -44 C-6 -52 6 -52 6 -44" stroke="#6b3a14" stroke-width="3" fill="none"/>
          <ellipse cx="0" cy="2" rx="18" ry="5" fill="#8a3a1a"/><path d="M-18 -8 H18" stroke="#6a8aa8" stroke-width="4"/></g>
        <g transform="translate(130 140) rotate(-10)">
          <path d="M-24 -14 L-8 -18 L8 -14 L24 -18 V6 L8 10 L-8 6 L-24 10 Z" fill="#f4ecd8" stroke="#b7a57e"/>
          <path d="M-8 -18 V6 M8 -14 V10" stroke="#d6c7a4"/>
          <path d="M-20 -4 Q-10 -12 0 -2 T18 -8" stroke="#c0392b" stroke-width="1.4" fill="none" stroke-dasharray="2 2"/>
          <path d="M-16 0 q4 -4 8 0 M6 -10 q5 -3 8 1" stroke="#7aaa4a" stroke-width="2" fill="none"/><circle cx="18" cy="-8" r="2" fill="#c0392b"/></g>`;
      if (t === 2) return `<defs><radialGradient id="${id}bg" cx=".5" cy=".5"><stop offset="0" stop-color="#1a3a6a"/><stop offset="1" stop-color="#081830"/></radialGradient>
        <radialGradient id="${id}oc" cx=".38" cy=".32"><stop offset="0" stop-color="#7ad0f0"/><stop offset=".7" stop-color="#2a7ab8"/><stop offset="1" stop-color="#15487a"/></radialGradient></defs>
        <rect width="200" height="200" fill="url(#${id}bg)"/>${starfield(24, 9)}
        <circle cx="100" cy="122" r="46" fill="url(#${id}oc)"/>
        <g fill="#6ab04a"><path d="M66 106 C74 92 94 94 96 104 C100 114 88 120 90 132 C84 140 72 130 70 120 C64 116 62 110 66 106 Z"/>
          <path d="M108 92 C120 88 136 96 138 108 C130 112 124 106 118 112 C112 108 104 100 108 92 Z"/>
          <path d="M112 128 C122 124 134 128 132 140 C128 150 116 152 112 144 C108 138 108 132 112 128 Z"/></g>
        <path d="M58 118 Q100 128 142 116" stroke="#fff" stroke-opacity=".25" fill="none"/><ellipse cx="84" cy="104" rx="14" ry="8" fill="#fff" opacity=".15"/>
        <g fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="4 4" opacity=".85"><ellipse cx="100" cy="116" rx="68" ry="20" transform="rotate(-16 100 116)"/><ellipse cx="100" cy="116" rx="64" ry="24" transform="rotate(24 100 116)"/></g>
        ${plane(38, 124, 70, 0.8)}${plane(162, 96, -110, 0.8)}${plane(150, 142, 150, 0.7)}
        <g transform="translate(100 78)"><path d="M-4 0 L-6 -14 M4 0 L6 -14" stroke="#2a2a33" stroke-width="3.4" stroke-linecap="round"/>
          <path d="M-7 -14 L-6 -30 H6 L7 -14 Z" fill="#f2c230"/><circle cx="0" cy="-36" r="5.4" fill="#c8946a"/>
          <path d="M-6 -28 L-18 -40 M6 -28 L18 -40" stroke="#f2c230" stroke-width="3.4" stroke-linecap="round"/></g>`;
      const pennant = (x, y, r, c1, c2) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="0" y="0" width="12" height="8" fill="${c1}"/><rect x="0" y="0" width="12" height="3" fill="${c2}"/></g>`;
      return sky(id, ["#ffcf9a", "#ffe9d0", "#bfe6ff"]) + `
        <circle cx="160" cy="44" r="14" fill="#fff2a8"/>
        <path d="M18 60 Q40 50 60 58" stroke="#445" fill="none"/><path d="M150 76 q3 -3 6 0 q3 -3 6 0" stroke="#445" fill="none"/>
        <g fill="#fff">${cloud(20, 140, 1.6)}${cloud(84, 148, 1.8)}${cloud(146, 136, 1.6)}${cloud(50, 158, 1.4)}${cloud(120, 160, 1.5)}</g>
        <g>${range(6).map(i => `<path d="M${60 + i * 16} 34 C${58 + i * 16} 60 ${70 + i * 10} 96 ${80 + i * 8} 108" fill="none" stroke="#000" stroke-opacity=".08"/>`).join("")}</g>
        <path d="M100 18 C132 18 150 40 146 66 C142 88 118 100 108 108 H92 C82 100 58 88 54 66 C50 40 68 18 100 18 Z" fill="#e0322e"/>
        ${[["#f2c230", 0.78], ["#1f9aa8", 0.52], ["#fff", 0.26]].map(([c, k]) => `<path d="M100 18 C${100 + 32 * k} 18 ${100 + 50 * k} 40 ${100 + 46 * k} 66 C${100 + 42 * k} 88 ${100 + 18 * k} 100 ${100 + 8 * k} 108 H${100 - 8 * k} C${100 - 18 * k} 100 ${100 - 42 * k} 88 ${100 - 46 * k} 66 C${100 - 50 * k} 40 ${100 - 32 * k} 18 100 18 Z" fill="${c}"/>`).join("")}
        <path d="M100 18 C104 40 104 80 100 108" stroke="#e0322e" stroke-width="3" fill="none"/>
        <path d="M58 60 Q100 70 142 60" stroke="#8a3a1a" stroke-width="2.4" fill="none"/>
        ${[[64, 62, 12, "#2a6ab0", "#fff"], [80, 66, 6, "#3f7a3a", "#f2c230"], [96, 68, 0, "#c0392b", "#fff"], [112, 67, -6, "#f2c230", "#2a2a2a"], [128, 63, -12, "#8e44ad", "#fff"]].map(a => pennant(...a)).join("")}
        <path d="M92 108 L90 118 M108 108 L110 118 M96 108 L96 118 M104 108 L104 118" stroke="#6b4a2e" stroke-width="1"/>
        <path d="M86 118 H114 L112 134 H88 Z" fill="#a0724a" stroke="#6b4a2e"/><path d="M87 124 H113 M88 129 H112" stroke="#855a36" stroke-width="1"/>
        <circle cx="96" cy="112" r="4" fill="#c8946a"/><path d="M92 116 L84 106" stroke="#c8946a" stroke-width="2.4" stroke-linecap="round"/><path d="M83 104 l-2 -4 l4 1 Z" fill="#fff"/>
        <g transform="translate(116 132) rotate(8)"><rect x="0" y="0" width="22" height="16" rx="2" fill="#6a4a8a" stroke="#3a2a4a"/><path d="M7 0 v-3 h8 v3" stroke="#3a2a4a" fill="none" stroke-width="1.4"/>
          <circle cx="6" cy="6" r="3" fill="#f2c230"/><rect x="11" y="8" width="7" height="5" fill="#1f9aa8"/><circle cx="16" cy="4" r="2" fill="#e0322e"/></g>
        <path d="M114 124 L118 132" stroke="#6b4a2e" stroke-width="1"/>`;
    }
  };

  /* ---------------- Fermeté face à la Russie ---------------- */
  const birch = (x, base, h, s = 1) => `<g transform="translate(${x} ${base}) scale(${s})"><rect x="-3" y="${-h}" width="6" height="${h}" fill="#f4f1ea"/>
    ${range(Math.floor(h / 9)).map(i => `<rect x="${i % 2 ? -3 : -1}" y="${-h + 4 + i * 9}" width="${i % 2 ? 3 : 4}" height="1.8" fill="#2a2a2a"/>`).join("")}
    ${[[-10, -h + 4, 12], [8, -h + 10, 10], [-4, -h - 4, 11], [10, -h - 2, 8]].map(([a, b, r]) => `<circle cx="${a}" cy="${b}" r="${r}" fill="#9cc06a" opacity=".9"/>`).join("")}</g>`;
  ART.ironcurtain = {
    rim: "#4f5f74", ink: "#1c2432",
    art: (id, t = 2) => {
      if (t === 1) return sky(id, ["#26345a", "#8a7aa0", "#ffc98a"]) + `
        <circle cx="160" cy="112" r="18" fill="#ffe0a0"/><circle cx="160" cy="112" r="30" fill="#ffe0a0" opacity=".25"/>
        <path d="M0 118 H200 V200 H0 Z" fill="#5a6a7a"/>
        <path d="M0 120 L20 108 L40 120 Z M26 120 L50 104 L74 120 Z" fill="#3a4658"/>
        <rect x="30" y="118" width="96" height="42" fill="#8a8e96"/>${range(6).map(i => `<path d="M${30 + i * 16} 118 V160" stroke="#6a6e76" stroke-width="1"/>`).join("")}<path d="M30 130 H126 M30 144 H126" stroke="#6a6e76"/>
        <g transform="translate(80 112)"><rect x="-12" y="-6" width="10" height="12" rx="3" fill="#2a2e38"/><rect x="2" y="-6" width="10" height="12" rx="3" fill="#2a2e38"/><rect x="-3" y="-3" width="6" height="5" fill="#3a3e48"/>
          <circle cx="-7" cy="-6" r="4.4" fill="#7ab8e8" stroke="#1a1e28" stroke-width="1.6"/><circle cx="7" cy="-6" r="4.4" fill="#7ab8e8" stroke="#1a1e28" stroke-width="1.6"/>
          <path d="M-9 -8 l2 -1 M5 -8 l2 -1" stroke="#fff" stroke-width="1"/></g>
        <path d="M92 108 L150 104 L150 120 Z" fill="#ffe0a0" opacity=".15"/>`;
      if (t === 2) return `<defs><linearGradient id="${id}ir" x1="0" x2="1"><stop offset="0" stop-color="#5a6270"/><stop offset=".5" stop-color="#a8b0bc"/><stop offset="1" stop-color="#5a6270"/></linearGradient></defs>
        <rect width="200" height="200" fill="#2a1a22"/>
        <path d="M0 150 H200 V200 H0 Z" fill="#6a4a2e"/><path d="M0 150 H200" stroke="#8a6440" stroke-width="3"/>
        <rect x="0" y="24" width="200" height="14" fill="#7a1a24"/>${range(10).map(i => `<path d="M${i * 20} 38 q10 10 20 0" fill="#7a1a24"/>`).join("")}
        ${range(9).map(i => `<path d="M${22 + i * 12} 44 V150 H${34 + i * 12} V44 Z" fill="url(#${id}ir)"/><path d="M${28 + i * 12} 44 V150" stroke="#3a4250" stroke-width=".8"/>` + range(8).map(j => `<circle cx="${25 + i * 12}" cy="${52 + j * 13}" r="1.2" fill="#2a303a"/><circle cx="${31 + i * 12}" cy="${52 + j * 13}" r="1.2" fill="#2a303a"/>`).join("")).join("")}
        <path d="M130 44 C150 70 146 110 160 150 H200 V44 Z" fill="#8a1a24"/><path d="M146 60 C156 90 156 120 170 150" stroke="#5a1018" stroke-width="2" fill="none"/>
        <path d="M150 96 q14 -4 20 6" stroke="#e0b040" stroke-width="3" fill="none"/><circle cx="171" cy="104" r="3.4" fill="#e0b040"/>
        <path d="M22 44 H130" stroke="#3a4250" stroke-width="4"/>`;
      return sky(id, ["#0a1024", "#1a2a4a", "#3a5a7a"]) + `
        <defs><linearGradient id="${id}ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf6ff"/><stop offset="1" stop-color="#9ac6e6"/></linearGradient></defs>
        ${starfield(16, 13)}
        ${range(18).map(i => `<circle cx="${(i * 47) % 190 + 5}" cy="${(i * 31) % 120 + 20}" r="${1 + (i % 3) * .5}" fill="#fff" opacity=".85"/>`).join("")}
        <g transform="translate(150 50) rotate(-20)"><rect x="-5" y="-4" width="10" height="8" fill="#c9ccd6"/><rect x="-20" y="-3" width="13" height="6" fill="#3a6ab0"/><rect x="7" y="-3" width="13" height="6" fill="#3a6ab0"/><path d="M0 -4 V-10" stroke="#c9ccd6"/><circle cx="0" cy="-11" r="1.6" fill="#ff5a5a"/></g>
        <path d="M150 50 m-26 -8 a30 12 -20 0 0 52 16" stroke="#8ab0e0" stroke-dasharray="2 3" fill="none"/>
        <g transform="translate(46 96)"><path d="M-16 0 A18 18 0 0 1 16 -12 Z" fill="#dfe6ee" stroke="#7a8898"/><path d="M0 -6 L10 -18" stroke="#7a8898" stroke-width="1.6"/><circle cx="10" cy="-18" r="2" fill="#ff5a5a"/>
          <rect x="-2" y="-2" width="4" height="30" fill="#7a8898"/>${[0, 1, 2].map(i => `<path d="M${14 + i * 6} ${-22 - i * 5} a${6 + i * 5} ${6 + i * 5} 0 0 1 ${4 + i * 3} ${6 + i * 3}" stroke="#8ab0e0" fill="none" opacity="${.8 - i * .2}"/>`).join("")}</g>
        <path d="M0 132 Q100 124 200 132 V200 H0 Z" fill="url(#${id}ice)"/>
        <g transform="translate(100 140) scale(1 .42)">${range(6).map(r => range(6).map(c => `<rect x="${-48 + c * 16}" y="${-48 + r * 16}" width="16" height="16" fill="${(r + c) % 2 ? '#2a3a5a' : '#dde8f2'}"/>`).join("")).join("")}<rect x="-48" y="-48" width="96" height="96" fill="none" stroke="#1a2438" stroke-width="3"/></g>
        ${[[76, "#f4f6fa", "#8a98aa"], [124, "#2a3448", "#0e1420"]].map(([x, c, e]) => `<g transform="translate(${x} 142)">
          <path d="M-10 0 H10 L7 -6 H-7 Z" fill="${c}" stroke="${e}"/><path d="M-6 -6 C-8 -18 -4 -26 -6 -30 H6 C4 -26 8 -18 6 -6 Z" fill="${c}" stroke="${e}"/>
          <rect x="-8" y="-34" width="16" height="5" rx="1" fill="${c}" stroke="${e}"/><path d="M0 -34 V-44 M-4 -40 H4" stroke="${e}" stroke-width="2.4"/></g>`).join("")}
        <path d="M60 128 l3 10 l3 -10 M92 126 l2 8 l2 -8 M130 128 l3 10 l3 -10" fill="#dff2ff"/>`;
    }
  };

  /* ---------------- Conciliation avec la Russie ---------------- */
  const samovar = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><defs></defs>
    <path d="M-10 0 H10 L7 -5 H-7 Z" fill="#a8761a"/><path d="M-12 -5 C-16 -18 -12 -28 0 -30 C12 -28 16 -18 12 -5 Z" fill="#e3b33a" stroke="#8a5a10"/>
    <path d="M-8 -20 C-6 -26 -2 -27 2 -27" stroke="#fff6c0" stroke-width="2" fill="none" opacity=".8"/>
    <path d="M-12 -18 h-6 v4 h6 M12 -18 h6 v4 h-6" fill="none" stroke="#8a5a10" stroke-width="2"/><path d="M-4 -30 V-36 H4 V-30" fill="#a8761a"/>
    <path d="M0 -38 q-4 -6 0 -12 q4 -6 0 -12" stroke="#fff" stroke-width="1.6" fill="none" opacity=".7"/></g>`;
  ART.datcha = {
    rim: "#a8643a", ink: "#4a2410",
    art: (id, t = 2) => {
      if (t === 1) return sky(id, ["#d6ecf6", "#f8f2e0"]) + `
        <path d="M0 126 Q100 118 200 126 V200 H0 Z" fill="#9cc56a"/>
        ${birch(34, 128, 56, .9)}${birch(170, 126, 50, .8)}
        <ellipse cx="100" cy="126" rx="30" ry="6" fill="#8a5e36"/><rect x="97" y="126" width="6" height="22" fill="#6b4a2e"/><rect x="84" y="146" width="32" height="4" rx="2" fill="#6b4a2e"/>
        <g transform="translate(100 118)"><path d="M-8 0 C-10 -8 -6 -12 0 -12 C6 -12 10 -8 8 0 Z" fill="#f4efe2" stroke="#b09878"/><path d="M8 -6 q6 -2 6 -6" stroke="#b09878" stroke-width="2" fill="none"/><path d="M-8 -6 h-4" stroke="#b09878" stroke-width="2"/>
          <path d="M0 -14 q-3 -4 0 -8" stroke="#bbb" fill="none" opacity=".8"/></g>
        ${[[-1, 58], [1, 142]].map(([d, x]) => `<g transform="translate(${x} 150) scale(${d} 1)"><path d="M-8 0 V-26 M-8 -26 H8 V0 M-8 -12 H8" stroke="#6b4a2e" stroke-width="3" fill="none"/><rect x="-10" y="-14" width="20" height="4" fill="#8a5e36"/></g>`).join("")}
        <circle cx="122" cy="120" r="3" fill="#f4efe2" stroke="#b09878"/><circle cx="78" cy="120" r="3" fill="#f4efe2" stroke="#b09878"/>`;
      if (t === 2) return `<rect width="200" height="200" fill="#e8dcc0"/>
        <rect x="0" y="0" width="200" height="110" fill="#a8b89a"/>${range(9).map(i => `<path d="M${i * 24} 0 V110" stroke="#98a88a" stroke-width="8"/>`).join("")}
        <rect x="50" y="36" width="100" height="56" fill="#f4ecd8" stroke="#8a6a40" stroke-width="3"/>
        <path d="M60 50 C70 44 86 48 90 58 C84 70 70 72 62 66 Z M100 46 C116 40 138 46 140 60 C132 70 120 66 112 74 C104 68 98 56 100 46 Z M76 76 C84 74 90 80 88 86 C82 88 76 84 76 76 Z" fill="#c9d6a8" stroke="#8a9a6a"/>
        <path d="M60 64 L140 64 M100 40 V90" stroke="#b8a888" stroke-width=".8" stroke-dasharray="2 2"/>
        <g transform="translate(100 20)"><path d="M0 0 V10" stroke="#8a6a40"/>${[-16, -8, 0, 8, 16].map(x => `<path d="M0 10 Q${x} 14 ${x * 1.2} 22" stroke="#d9a21c" fill="none"/><circle cx="${x * 1.2}" cy="24" r="2.6" fill="#fff6c0" stroke="#d9a21c"/>`).join("")}</g>
        <path d="M20 128 H180 L170 110 H30 Z" fill="#6b3a1e"/><path d="M20 128 H180 V134 H20 Z" fill="#4a2410"/>
        <rect x="40" y="134" width="6" height="30" fill="#4a2410"/><rect x="154" y="134" width="6" height="30" fill="#4a2410"/>
        ${[[64, 116, -8], [128, 114, 6]].map(([x, y, r]) => `<rect x="${x}" y="${y}" width="22" height="14" fill="#fbf7ee" stroke="#b7ab90" transform="rotate(${r} ${x} ${y})"/>`).join("")}
        <path d="M94 118 L108 110" stroke="#1a1a2a" stroke-width="2.4" stroke-linecap="round"/><path d="M108 110 l2 -1.2" stroke="#d9a21c" stroke-width="2.4"/>
        ${[[30, "#3a5a8a"], [170, "#8a3a2a"]].map(([x, c]) => `<g transform="translate(${x} 128)"><rect x="-12" y="-44" width="24" height="44" rx="4" fill="${c}"/><rect x="-12" y="-10" width="24" height="6" fill="#000" opacity=".2"/></g>`).join("")}`;
      return sky(id, ["#9ac6e6", "#e6f2fa"]) + `
        ${cloud(30, 50, .8, .8)}
        <path d="M0 120 Q100 110 200 120 V200 H0 Z" fill="#f4f8fc"/><path d="M0 138 Q100 128 200 138" stroke="#d6e4f0" stroke-width="3" fill="none"/>
        ${birch(24, 128, 70, 1)}${birch(42, 132, 58, .8)}${birch(172, 126, 72, 1)}${birch(186, 132, 56, .8)}
        <g transform="translate(104 132)">
          <rect x="-40" y="-40" width="80" height="40" fill="#b8703a"/>${range(7).map(i => `<path d="M-40 ${-36 + i * 6} H40" stroke="#8a4a22" stroke-width="1.4"/>`).join("")}
          <path d="M-48 -40 L0 -74 L48 -40 Z" fill="#3a7a5a"/><path d="M-48 -40 L0 -74 L48 -40" fill="none" stroke="#f4f8fc" stroke-width="4"/>
          <path d="M-30 -46 L0 -68 L30 -46" fill="none" stroke="#f2c230" stroke-width="1.6" stroke-dasharray="3 2"/>
          <rect x="22" y="-80" width="8" height="18" fill="#8a4a22"/><path d="M26 -84 q-6 -8 2 -14 q8 -6 0 -14" stroke="#e8eef4" stroke-width="3" fill="none" opacity=".9"/>
          ${[[-28, -30], [12, -30]].map(([x, y]) => `<rect x="${x}" y="${y}" width="16" height="16" fill="#ffd96a"/><path d="M${x + 8} ${y} V${y + 16} M${x} ${y + 8} H${x + 16}" stroke="#8a4a22" stroke-width="1.4"/><path d="M${x - 3} ${y} L${x + 8} ${y - 8} L${x + 19} ${y} Z" fill="#f4efe2"/><path d="M${x - 2} ${y + 17} H${x + 18}" stroke="#f4efe2" stroke-width="2.4"/>`).join("")}
          <rect x="-6" y="-26" width="12" height="26" fill="#6b3a1e"/><circle cx="3" cy="-12" r="1.2" fill="#f2c230"/>
          <path d="M-50 0 H50 V4 H-50 Z" fill="#8a4a22"/></g>
        ${samovar(152, 138, 1)}
        <rect x="136" y="138" width="34" height="3" fill="#8a4a22"/>
        <g transform="translate(62 140)"><path d="M-10 0 V-14 H10 V0" stroke="#8a4a22" stroke-width="2.4" fill="none"/><path d="M-12 -14 H12" stroke="#8a4a22" stroke-width="3"/>
          <path d="M-6 -16 C-10 -26 -4 -30 0 -26 C4 -30 10 -26 6 -16 Z" fill="#e0322e"/><path d="M-6 -16 h12" stroke="#fff" stroke-width="1"/></g>
        ${range(10).map(i => `<circle cx="${(i * 37) % 180 + 10}" cy="${(i * 23) % 70 + 30}" r="1.4" fill="#fff"/>`).join("")}`;
    }
  };

  /* ---------------- Autorité internationale ---------------- */
  const FLAGS = [["#c0392b", "#fff"], ["#2a6ab0", "#f2c230"], ["#3f7a3a", "#fff"], ["#f2c230", "#2a2a2a"], ["#8e44ad", "#fff"], ["#16a085", "#e0322e"], ["#d35400", "#2a6ab0"], ["#2c3e50", "#e0322e"]];
  const flagPole = (x, top, base, [a, b], w = 14) => `<path d="M${x} ${base} V${top}" stroke="#8a8a96" stroke-width="1.6"/><rect x="${x + .8}" y="${top}" width="${w}" height="${w * .66}" fill="${a}"/><rect x="${x + .8}" y="${top + w * .22}" width="${w}" height="${w * .22}" fill="${b}"/>`;
  ART.bluehelmet = {
    rim: "#3a8ad6", ink: "#123a66",
    art: (id, t = 2) => {
      if (t === 1) return `<defs><radialGradient id="${id}bg" cx=".5" cy=".5"><stop offset="0" stop-color="#eef6ff"/><stop offset="1" stop-color="#b8d6f2"/></radialGradient></defs>
        <rect width="200" height="200" fill="url(#${id}bg)"/>
        <ellipse cx="100" cy="100" rx="46" ry="46" fill="#c49a6a" stroke="#8a6440" stroke-width="3"/><ellipse cx="100" cy="100" rx="30" ry="30" fill="none" stroke="#a8804e" stroke-width="1.4"/>
        ${range(8).map(i => { const a = i * Math.PI / 4, x = 100 + 58 * Math.cos(a), y = 100 + 58 * Math.sin(a); return `<g transform="translate(${x} ${y}) rotate(${i * 45 + 90})"><rect x="-8" y="-6" width="16" height="12" rx="3" fill="${FLAGS[i][0]}"/><rect x="-8" y="3" width="16" height="3" rx="1" fill="#000" opacity=".2"/></g>`; }).join("")}
        ${range(8).map(i => { const a = i * Math.PI / 4, x = 100 + 36 * Math.cos(a), y = 100 + 36 * Math.sin(a); return `<rect x="${x - 5}" y="${y - 3.5}" width="10" height="7" fill="#fbf7ee" stroke="#b7ab90" transform="rotate(${i * 45} ${x} ${y})"/>`; }).join("")}
        <g transform="translate(100 100)"><circle r="13" fill="#4a9ae8" stroke="#1e5ea8" stroke-width="1.4"/><path d="M-9 -4 C-6 -10 2 -9 2 -4 C0 1 -6 2 -8 0 Z M3 2 C7 0 10 4 8 8 C5 9 2 6 3 2 Z" fill="#7ac05a"/><ellipse cx="-4" cy="-6" rx="4" ry="2" fill="#fff" opacity=".3"/></g>`;
      if (t === 2) return sky(id, ["#9fd0f4", "#f4ead0"]) + `
        <path d="M0 132 Q100 122 200 132 V200 H0 Z" fill="#d6c090"/>
        ${range(3).map(r => range(5 - r).map(c => `<ellipse cx="${56 + c * 22 + r * 11}" cy="${150 - r * 10}" rx="12" ry="6" fill="#b8a070" stroke="#8a7448"/>`).join("")).join("")}
        <defs><radialGradient id="${id}h" cx=".35" cy=".3"><stop offset="0" stop-color="#bfe2ff"/><stop offset=".6" stop-color="#4a9ae8"/><stop offset="1" stop-color="#1e5ea8"/></radialGradient></defs>
        <path d="M58 118 C58 80 142 80 142 118 Z" fill="url(#${id}h)"/>
        <path d="M50 118 H150 C150 124 146 126 140 126 H60 C54 126 50 124 50 118 Z" fill="#2a6ab8"/>
        <path d="M70 100 C74 88 90 84 100 84" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>
        <g transform="translate(100 104)"><circle r="9" fill="#fff"/><circle r="6" fill="none" stroke="#4a9ae8" stroke-width="1.2"/><path d="M-6 0 H6 M0 -6 V6" stroke="#4a9ae8" stroke-width="1"/></g>
        <g transform="translate(124 58) scale(.85)"><path d="M-12 0 C-4 -6 4 -6 8 -2 C12 -12 20 -16 28 -16 C22 -8 20 -2 18 2 C10 8 -2 8 -12 0 Z" fill="#fff" stroke="#b9cde3"/><path d="M-12 0 L-17 1 L-12 2 Z" fill="#f0a64a"/>
          <path d="M-16 2 C-22 6 -24 12 -26 16" stroke="#5c7a2e" stroke-width="1.4" fill="none"/>${[[-20, 6], [-23, 11]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="1.8" fill="#78a03a" transform="rotate(-30 ${x} ${y})"/>`).join("")}</g>`;
      return `<defs><radialGradient id="${id}bg" cx=".5" cy=".5"><stop offset="0" stop-color="#1a3a6a"/><stop offset="1" stop-color="#060e22"/></radialGradient>
        <radialGradient id="${id}oc" cx=".38" cy=".32"><stop offset="0" stop-color="#8ad6f6"/><stop offset=".7" stop-color="#2a7ab8"/><stop offset="1" stop-color="#15487a"/></radialGradient>
        <linearGradient id="${id}gl" x1="0" x2="1"><stop offset="0" stop-color="#7ab8e8"/><stop offset=".5" stop-color="#e6f4ff"/><stop offset="1" stop-color="#5a98d0"/></linearGradient></defs>
        <rect width="200" height="200" fill="url(#${id}bg)"/>${starfield(22, 29)}
        <circle cx="100" cy="150" r="54" fill="url(#${id}oc)"/>
        <g fill="#6ab04a" opacity=".9"><path d="M60 128 C70 116 88 118 92 128 C86 136 74 140 64 138 Z"/><path d="M110 112 C124 108 140 118 142 128 C132 130 120 126 112 122 Z"/></g>
        <path d="M86 104 L90 40 H110 L114 104 Z" fill="url(#${id}gl)" stroke="#3a6a9a"/>
        ${range(10).map(i => `<path d="M${89.5 + i * .02} ${46 + i * 6} H${110.5}" stroke="#3a6a9a" stroke-width=".8"/>`).join("")}
        <path d="M90 40 L100 26 L110 40 Z" fill="#cfe8ff" stroke="#3a6a9a"/><path d="M100 26 V16" stroke="#cfe8ff" stroke-width="1.6"/><circle cx="100" cy="15" r="2.4" fill="#ffe27a"/><circle cx="100" cy="15" r="7" fill="#ffe27a" opacity=".25"/>
        ${range(8).map(i => { const a = Math.PI + i * Math.PI / 7; const x = 100 + 62 * Math.cos(a), y = 104 + 30 * Math.sin(a); return flagPole(x, y - 18, y, FLAGS[i], 11); }).join("")}
        <g fill="none" stroke="#ffe27a" stroke-width="2.4"><path d="M58 150 C50 128 58 110 74 100"/><path d="M142 150 C150 128 142 110 126 100"/></g>
        ${range(6).map(i => `<ellipse cx="${60 - i * 1.2}" cy="${142 - i * 8}" rx="5" ry="2.4" fill="#ffe27a" transform="rotate(${-60 + i * 10} ${60 - i * 1.2} ${142 - i * 8})"/><ellipse cx="${140 + i * 1.2}" cy="${142 - i * 8}" rx="5" ry="2.4" fill="#ffe27a" transform="rotate(${60 - i * 10} ${140 + i * 1.2} ${142 - i * 8})"/>`).join("")}
        <g transform="translate(154 54) rotate(24)"><rect x="-4" y="-3" width="8" height="6" fill="#c9ccd6"/><rect x="-16" y="-2.4" width="10" height="4.8" fill="#3a6ab0"/><rect x="6" y="-2.4" width="10" height="4.8" fill="#3a6ab0"/></g>
        <g transform="translate(46 60) rotate(-18)"><rect x="-4" y="-3" width="8" height="6" fill="#c9ccd6"/><rect x="-16" y="-2.4" width="10" height="4.8" fill="#3a6ab0"/><rect x="6" y="-2.4" width="10" height="4.8" fill="#3a6ab0"/></g>`;
    }
  };
})();
