/* ---------- set E: institutions and the journey badges ---------- */
const lorraine = (cx, top, h, col, w = 1) => {
  const bw = h * 0.1 * w;
  return `<g fill="${col}"><rect x="${cx - bw / 2}" y="${top}" width="${bw}" height="${h}"/>
    <rect x="${cx - h * 0.2}" y="${top + h * 0.18}" width="${h * 0.4}" height="${bw * 0.9}"/>
    <rect x="${cx - h * 0.3}" y="${top + h * 0.38}" width="${h * 0.6}" height="${bw * 0.9}"/></g>`;
};

ART.executive = {
  rim: "#7b2d3a", ink: "#3a0f18",
  art: (id, t = 2) => {
    const drape = `<path d="M0 0 H200 V40 Q170 60 150 30 Q130 62 100 34 Q70 62 50 30 Q30 60 0 40 Z" fill="#8a1c2a"/>
      <path d="M0 40 Q30 60 50 30 Q70 62 100 34 Q130 62 150 30 Q170 60 200 40" stroke="#e3b33a" stroke-width="2" fill="none"/>`;
    if (t === 1) return sky(id, ["#efe6d6", "#d9ccb4"]) + `
      <rect x="0" y="0" width="200" height="200" fill="#e8dcc6"/>
      ${[30, 70, 130, 170].map(x => `<rect x="${x - 3}" y="30" width="6" height="130" fill="#d6c7ac"/>`).join("")}
      ${drape}
      <rect x="76" y="54" width="48" height="60" fill="#f3ecde" stroke="#b9a882"/>
      <path d="M76 54 h16 v60 h-16 Z" fill="#2a4a9a"/><path d="M108 54 h16 v60 h-16 Z" fill="#c8302c"/>
      <path d="M72 112 H128 L120 160 H80 Z" fill="#6b4428"/><path d="M72 112 H128 V120 H72 Z" fill="#8a5a36"/>
      <circle cx="100" cy="136" r="8" fill="#e3b33a" stroke="#8a5a10"/><circle cx="100" cy="136" r="4" fill="#c99a26"/>
      <path d="M100 112 V98" stroke="#333" stroke-width="2"/><rect x="96" y="92" width="8" height="8" rx="3" fill="#222"/>
      <rect x="0" y="152" width="200" height="48" fill="#7a2230"/>`;
    if (t === 2) return sky(id, ["#9cc3e6", "#f2e7d2"]) + `
      <path d="M0 60 H200 V200 H0 Z" fill="#e2d4b8"/>
      ${[20, 50, 150, 180].map(x => `<rect x="${x - 8}" y="60" width="16" height="30" fill="#bfae8c"/><path d="M${x - 8} 60 a8 8 0 0 1 16 0" fill="#bfae8c"/>`).join("")}
      <rect x="60" y="40" width="80" height="60" fill="#d6c6a4"/><path d="M56 40 L100 18 L144 40 Z" fill="#c4b28e"/>
      <rect x="84" y="56" width="32" height="34" fill="#4a3a2a"/><path d="M84 56 a16 12 0 0 1 32 0" fill="#4a3a2a"/>
      ${person(100, 90, 1, "#1c1c22")}
      <path d="M64 100 H136 V106 H64 Z" fill="#9a8a6a"/>${[68, 76, 84, 92, 100, 108, 116, 124, 132].map(x => `<rect x="${x}" y="100" width="3" height="10" fill="#8a7a5a"/>`).join("")}
      <path d="M100 18 V4" stroke="#555" stroke-width="1.5"/><path d="M101 4 h14 v8 h-14 Z" fill="#2a4a9a"/><path d="M105.7 4 h4.6 v8 h-4.6 Z" fill="#fff"/><path d="M110.3 4 h4.7 v8 h-4.7 Z" fill="#c8302c"/>
      ${[[50, 108], [150, 108]].map(([x, y]) => `<path d="M${x - 10} ${y} h20 v40 l-10 -6 l-10 6 Z" fill="#8a1c2a"/><circle cx="${x}" cy="${y + 16}" r="5" fill="#e3b33a"/>`).join("")}
      <rect x="0" y="130" width="200" height="70" fill="#8a7f70"/>
      ${Array.from({ length: 30 }, (_, i) => person(12 + (i % 10) * 20 + (Math.floor(i / 10) % 2) * 10, 148 + Math.floor(i / 10) * 11, 1.05, i % 3 ? "#2a2630" : "#3a3440")).join("")}
      ${[[30, 136], [70, 134], [130, 134], [170, 136]].map(([x, y]) => `<path d="M${x} ${y} l-3 -9 M${x} ${y} l3 -10" stroke="#2a2630" stroke-width="2" stroke-linecap="round"/>`).join("")}`;
    /* level 3: Bonapartiste */
    return sky(id, ["#5a1a2a", "#d2502a", "#ffcf6a"]) + `
      <defs><radialGradient id="${id}sun" cx=".5" cy=".5"><stop offset="0" stop-color="#fff6c8"/><stop offset=".5" stop-color="#ffd35a"/><stop offset="1" stop-color="#ffb13a" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}hat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a44"/><stop offset="1" stop-color="#101016"/></linearGradient></defs>
      <g opacity=".6">${Array.from({ length: 20 }, (_, i) => { const a = (180 + i * 9) * Math.PI / 180, b = a + 0.06; return `<path d="M100 132 L${100 + 160 * Math.cos(a)} ${132 + 160 * Math.sin(a)} L${100 + 160 * Math.cos(b)} ${132 + 160 * Math.sin(b)} Z" fill="#fff2b0"/>`; }).join("")}</g>
      <circle cx="100" cy="132" r="44" fill="url(#${id}sun)"/>
      <path d="M0 140 Q60 128 100 134 T200 132 V200 H0 Z" fill="#6a3a2a"/>
      <g fill="#3a1a14" transform="translate(100 150)"><path d="M-30 0 V-26 H30 V0 H16 V-12 a16 14 0 0 0 -32 0 V0 Z"/><rect x="-33" y="-30" width="66" height="5"/></g>
      ${[-1, 1].map(sd => Array.from({ length: 9 }, (_, i) => { const deg = 100 + i * 13, a = deg * Math.PI / 180, x = 100 + sd * 56 * Math.cos(a) * -1 * -1, y = 92 + 50 * Math.sin(a);
        const xx = sd < 0 ? 100 + 56 * Math.cos(a) : 100 - 56 * Math.cos(a);
        return `<ellipse cx="${xx.toFixed(1)}" cy="${y.toFixed(1)}" rx="3" ry="7.5" fill="#e3b33a" stroke="#8a5a10" stroke-width=".8" transform="rotate(${(sd < 0 ? deg + 90 + 25 : -(deg + 90 + 25)).toFixed(0)} ${xx.toFixed(1)} ${y.toFixed(1)})"/>`; }).join("")).join("")}
      <path d="M${100 + 56 * Math.cos(100 * Math.PI / 180)} ${92 + 50 * Math.sin(100 * Math.PI / 180)} A56 50 0 0 1 ${100 + 56 * Math.cos(204 * Math.PI / 180)} ${92 + 50 * Math.sin(204 * Math.PI / 180)}" stroke="#8a5a10" stroke-width="1.5" fill="none"/>
      <path d="M${100 - 56 * Math.cos(100 * Math.PI / 180)} ${92 + 50 * Math.sin(100 * Math.PI / 180)} A56 50 0 0 0 ${100 - 56 * Math.cos(204 * Math.PI / 180)} ${92 + 50 * Math.sin(204 * Math.PI / 180)}" stroke="#8a5a10" stroke-width="1.5" fill="none"/>
      <path d="M40 92 C52 60 76 52 100 52 C124 52 148 60 160 92 C144 86 124 84 100 84 C76 84 56 86 40 92 Z" fill="url(#${id}hat)" stroke="#000" stroke-width="1"/>
      <path d="M44 90 C60 84 80 82 100 82 C120 82 140 84 156 90" stroke="#e3b33a" stroke-width="2" fill="none"/>
      <circle cx="100" cy="66" r="9" fill="#2a4a9a"/><circle cx="100" cy="66" r="6" fill="#fff"/><circle cx="100" cy="66" r="3" fill="#c8302c"/>
      <path d="M96 57 L100 44 L104 57 Z" fill="#e3b33a"/>
      ${[[30, 60], [170, 60], [46, 40], [154, 40], [100, 30]].map(([x, y]) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="2.2" ry="3.2" fill="#ffd35a"/><path d="M-2 -1 q-5 -4 -6 1 q3 2 6 0 M2 -1 q5 -4 6 1 q-3 2 -6 0" fill="#fff6c8" opacity=".9"/></g>`).join("")}`;
  }
};

ART.hemicycle = {
  rim: "#a33b5c", ink: "#4a1026",
  art: (id, t = 2) => {
    const seats = (fade) => Array.from({ length: 5 }, (_, r) => {
      const R = 26 + r * 11, n = 7 + r * 3;
      return Array.from({ length: n }, (_, i) => {
        const a = Math.PI + (i + 0.5) * Math.PI / n, x = 100 + R * Math.cos(a), y = 146 + R * Math.sin(a) * 0.82;
        const hue = Math.round(i / (n - 1) * 100);
        const col = fade ? "#b89a74" : `hsl(${hue < 50 ? 4 : 218}, ${40 + Math.abs(hue - 50)}%, ${46 + (50 - Math.abs(hue - 50)) / 3}%)`;
        return `<rect x="${(x - 3.2).toFixed(1)}" y="${(y - 2.6).toFixed(1)}" width="6.4" height="5.2" rx="1.2" fill="${col}" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      }).join("");
    }).join("");
    const arcs = (col) => Array.from({ length: 6 }, (_, r) => { const R = 20 + r * 11; return `<path d="M${100 - R} 146 A${R} ${R * 0.82} 0 0 1 ${100 + R} 146" fill="none" stroke="${col}" stroke-width="1.2"/>`; }).join("");
    const room = `<rect width="200" height="200" fill="#6a2a2a"/>
      ${[20, 50, 80, 120, 150, 180].map(x => `<rect x="${x - 6}" y="0" width="12" height="110" fill="#7e3434"/>`).join("")}
      <path d="M0 0 H200 V26 H0 Z" fill="#4a1a1a"/><path d="M0 26 H200" stroke="#e3b33a" stroke-width="2"/>`;
    const tribune = `<rect x="86" y="130" width="28" height="18" fill="#8a5a36"/><rect x="80" y="126" width="40" height="5" fill="#a87044"/>
      <rect x="92" y="112" width="16" height="14" fill="#6b4428"/>${person(100, 112, 0.7, "#222")}`;
    if (t === 1) return room + `
      <path d="M20 146 A80 66 0 0 1 180 146 V200 H20 Z" fill="#8a5a36" opacity=".35"/>
      ${arcs("#c9a070")}
      <g transform="translate(100 132)"><path d="M-28 0 H28 L24 18 H-24 Z" fill="#8a5a36"/><path d="M-30 -4 H30 V2 H-30 Z" fill="#a87044"/>
        <path d="M-14 -40 V-4 M14 -40 V-4" stroke="#6b4428" stroke-width="3"/><path d="M-18 -44 H18 V-34 H-18 Z" fill="#b5462f"/>
        <path d="M12 -4 V-20" stroke="#aaa" stroke-width="1.2"/><path d="M8 -26 L18 -20 L10 -18 Z" fill="#2e7d4a"/><circle cx="12" cy="-21" r="4" fill="#ffe9a8" opacity=".6"/>
        <rect x="-20" y="-10" width="16" height="6" fill="#f4efe2" transform="rotate(-6)"/></g>
      <rect x="0" y="150" width="200" height="50" fill="#4a1a1a"/>`;
    if (t === 2) return room + `
      <path d="M100 30 L106 42 H94 Z" fill="#e3b33a"/><circle cx="100" cy="46" r="8" fill="none" stroke="#e3b33a" stroke-width="1.5"/>
      <path d="M14 146 A86 70 0 0 1 186 146 V200 H14 Z" fill="#8a5a36"/>
      ${arcs("#6b4428")}${seats(false)}${tribune}
      <path d="M0 150 H200 V200 H0 Z" fill="#4a1a1a"/>`;
    /* level 3: Nostalgique de la IVe, an old photograph where governments come and go */
    return `<defs><radialGradient id="${id}v" cx=".5" cy=".5"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2a1a08" stop-opacity=".7"/></radialGradient>
      <filter id="${id}sep"><feColorMatrix type="matrix" values=".39 .77 .19 0 0  .35 .69 .17 0 0  .27 .53 .13 0 0  0 0 0 1 0"/></filter></defs>
      <g filter="url(#${id}sep)">${room}
      <path d="M14 146 A86 70 0 0 1 186 146 V200 H14 Z" fill="#8a5a36"/>${arcs("#6b4428")}${seats(false)}${tribune}
      <path d="M0 150 H200 V200 H0 Z" fill="#4a1a1a"/>
      ${(() => {
        /* a portrait card: frame, oval, a bust in a frock coat, one of several faces */
        const card = (k) => `<rect x="-13" y="-19" width="26" height="36" rx="2.5" fill="#fbf4e0" stroke="#5a4a2a" stroke-width="1"/>
          <rect x="-10.5" y="-16.5" width="21" height="31" rx="1.5" fill="none" stroke="#a88a5a" stroke-width=".7"/>
          <ellipse cx="0" cy="-3" rx="8" ry="10" fill="#d9c7a0"/>
          <path d="M-8 9 Q-8 1 0 1 Q8 1 8 9 Z" fill="#2a2016"/><path d="M-2 1 L0 6 L2 1 Z" fill="#fbf4e0"/>
          <circle cx="0" cy="-5" r="4.2" fill="#e7cfa0"/>
          ${k % 3 === 0 ? `<path d="M-3 -3 q3 1.6 6 0" stroke="#3a2a18" stroke-width="1.2" fill="none"/>` : ""}
          ${k % 2 === 0 ? `<path d="M-4.2 -7 a4.2 3 0 0 1 8.4 0 Z" fill="#3a2a18"/>` : `<path d="M-4.4 -6.4 h8.8" stroke="#3a2a18" stroke-width="1.4"/>`}
          ${k % 4 === 1 ? `<circle cx="-1.6" cy="-5" r="1.3" fill="none" stroke="#3a2a18" stroke-width=".6"/><circle cx="1.6" cy="-5" r="1.3" fill="none" stroke="#3a2a18" stroke-width=".6"/>` : ""}
          <path d="M-8 13 h16" stroke="#b9a67f" stroke-width="1.4"/>`;
        const fan = [-48, -32, -16, 0, 16, 32, 48].map((r, k) => `<g transform="translate(100 120) rotate(${r}) translate(0 -46)">${card(k)}</g>`).join("");
        const flying = [[42, 104, -34, 7], [158, 102, 30, 8], [104, 38, 14, 9]].map(([x, y, r, k]) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(.8)">${card(k)}</g>`).join("");
        return `<g filter="url(#${id}sep)">${fan}${flying}</g>
          <g fill="none" stroke="#f2e6c8" stroke-width="1.6" stroke-linecap="round" opacity=".85">
            <path d="M40 88 q-4 -6 -10 -8"/><path d="M160 86 q4 -6 10 -8"/><path d="M118 34 q6 -3 10 -8"/></g>`;
      })()}
      <rect width="200" height="200" fill="url(#${id}v)"/>
      <rect x="0" y="0" width="200" height="200" fill="#c8a060" opacity=".12"/>`;
  }
};

ART.colombey = {
  rim: "#1f3b6e", ink: "#0a1a38",
  art: (id, t = 2) => {
    if (t === 1) return sky(id, ["#bcd6ee", "#f4eedc"]) + `
      ${cloud(40, 60, 0.9, 0.8)}${cloud(130, 48, 0.7, 0.7)}
      <path d="M0 140 Q70 112 110 124 T200 130 V200 H0 Z" fill="#9ab86a"/>
      <path d="M0 156 Q80 138 200 150 V200 H0 Z" fill="#7a9e4e"/>
      ${lorraine(100, 70, 58, "#e9e4d8")}
      <g opacity=".25">${lorraine(103, 72, 58, "#000")}</g>${lorraine(100, 70, 58, "#e9e4d8")}
      <path d="M92 128 H108 L110 134 H90 Z" fill="#b9b2a2"/>`;
    if (t === 2) return sky(id, ["#6f9fd4", "#f2e7cc"]) + `
      ${cloud(26, 64, 0.8, 0.9)}${cloud(150, 40, 1, 0.9)}
      <path d="M0 150 Q40 120 90 118 Q140 116 200 140 V200 H0 Z" fill="#8fb05e"/>
      <path d="M72 120 L100 36 L128 120 Z" fill="none"/>
      <g><defs><linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#f4f0e6"/><stop offset=".6" stop-color="#d9d2c2"/><stop offset="1" stop-color="#a9a292"/></linearGradient></defs>
      <rect x="95" y="34" width="10" height="84" fill="url(#${id}g)"/><rect x="84" y="46" width="32" height="8" fill="url(#${id}g)"/><rect x="76" y="62" width="48" height="8" fill="url(#${id}g)"/>
      <path d="M86 118 H114 L118 126 H82 Z" fill="#9a9384"/></g>
      <g transform="translate(40 140)"><rect x="-14" y="-14" width="26" height="16" fill="#e9dcc2"/><path d="M-16 -14 L-1 -24 L14 -14 Z" fill="#8a4a36"/>
        <rect x="6" y="-34" width="6" height="20" fill="#e9dcc2"/><path d="M5 -34 L9 -42 L13 -34 Z" fill="#6a5a6a"/><rect x="-8" y="-8" width="4" height="10" fill="#6b4428"/></g>
      <g transform="translate(154 146)"><rect x="-18" y="-14" width="36" height="16" fill="#efe4cc"/><path d="M-20 -14 L0 -24 L20 -14 Z" fill="#6a4a3a"/>
        <rect x="-4" y="-26" width="8" height="14" fill="#efe4cc"/><path d="M-5 -26 h10 l-5 -6 Z" fill="#6a4a3a"/>
        ${[-12, -2, 8].map(x => `<rect x="${x}" y="-10" width="4" height="5" fill="#6f8fa8"/>`).join("")}</g>
      ${[[20, 150], [70, 148], [120, 150], [184, 150]].map(([x, y]) => `<circle cx="${x}" cy="${y - 10}" r="8" fill="#4f7a3a"/><rect x="${x - 1}" y="${y - 4}" width="2" height="6" fill="#5a3b1c"/>`).join("")}
      <path d="M0 158 Q100 148 200 158 V200 H0 Z" fill="#6a8e44"/>`;
    /* level 3: the call of 18 June, a BBC studio at night, the speech on the table */
    return `<defs>
      <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1c16"/><stop offset="1" stop-color="#4a3022"/></linearGradient>
      <linearGradient id="${id}n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060a1c"/><stop offset="1" stop-color="#23305e"/></linearGradient>
      <linearGradient id="${id}m" x1="0" x2="1"><stop offset="0" stop-color="#5a5a64"/><stop offset=".45" stop-color="#f4f4f8"/><stop offset="1" stop-color="#4a4a54"/></linearGradient>
      <linearGradient id="${id}tb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a36"/><stop offset="1" stop-color="#4a2a18"/></linearGradient>
      <radialGradient id="${id}lamp" cx=".5" cy="0"><stop offset="0" stop-color="#ffe7a0" stop-opacity=".75"/><stop offset="1" stop-color="#ffe7a0" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}glow"><stop offset="0" stop-color="#fff6d0" stop-opacity=".9"/><stop offset="1" stop-color="#fff6d0" stop-opacity="0"/></radialGradient>
      <clipPath id="${id}win"><rect x="30" y="40" width="44" height="58"/></clipPath></defs>
      <rect width="200" height="200" fill="url(#${id}w)"/>
      ${[20, 60, 100, 140, 180].map(x => `<path d="M${x} 0 V140" stroke="#1c120c" stroke-width="1.2" opacity=".6"/>`).join("")}
      <path d="M0 30 H200" stroke="#6b4428" stroke-width="2"/>
      <g clip-path="url(#${id}win)">
        <rect x="30" y="40" width="44" height="58" fill="url(#${id}n)"/>
        ${[[36, 48], [58, 44], [66, 56], [44, 58], [70, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".8" fill="#fff"/>`).join("")}
        <path d="M34 98 L48 40 L52 40 Z" fill="#dde8ff" opacity=".35"/><path d="M72 98 L60 40 L64 40 Z" fill="#dde8ff" opacity=".28"/>
        <g fill="#05070f"><path d="M30 98 V84 H38 V78 H44 V88 H48 V98 Z"/><path d="M50 98 V70 L53 64 L56 70 V98 Z"/><rect x="51" y="72" width="4" height="4" fill="#f2d68a"/>
          <path d="M58 98 V86 a6 6 0 0 1 12 0 V98 Z"/><rect x="63" y="76" width="2" height="6"/><path d="M70 98 V88 H74 V98 Z"/></g>
        ${[[34, 88], [41, 84], [60, 90], [66, 92]].map(([x, y]) => `<rect x="${x}" y="${y}" width="1.6" height="2" fill="#f2d68a"/>`).join("")}</g>
      <rect x="30" y="40" width="44" height="58" fill="none" stroke="#6b4428" stroke-width="3"/>
      <path d="M52 40 V98 M30 69 H74" stroke="#6b4428" stroke-width="2"/>
      <path d="M26 98 H78 V102 H26 Z" fill="#8a5a36"/>
      <g transform="translate(146 64) rotate(-6)">
        <circle r="18" fill="url(#${id}glow)" opacity=".5"/>
        <path d="M-17 -4 L-8 -6 L-5 -12 L3 -15 L13 -10 L11 -2 L14 5 L9 12 L1 10 L-6 15 L-9 5 L-10 -1 Z" fill="#dfe8ff" stroke="#9fb8f0" stroke-width="1" stroke-linejoin="round"/>
        <ellipse cx="16" cy="14" rx="1.6" ry="3" fill="#dfe8ff"/></g>
      <g fill="none" stroke="#cfe0ff" stroke-linecap="round">${[44, 54, 64].map((r, k) => { const a0 = -78 * Math.PI / 180, a1 = -18 * Math.PI / 180;
        return `<path d="M${100 + r * Math.cos(a0)} ${100 + r * Math.sin(a0)} A${r} ${r} 0 0 1 ${100 + r * Math.cos(a1)} ${100 + r * Math.sin(a1)}" stroke-width="${2.6 - k * 0.6}" opacity="${0.95 - k * 0.2}"/>`; }).join("")}</g>
      <g transform="translate(158 104)"><circle r="16" fill="url(#${id}glow)" opacity=".7"/>${lorraine(0, -14, 28, "#fffbe8")}</g>
      <path d="M0 134 H200 V160 H0 Z" fill="url(#${id}tb)"/><path d="M0 132 H200 V136 H0 Z" fill="#a87044"/>
      <g transform="translate(42 132)">
        <path d="M-10 0 H10 L8 -3 H-8 Z" fill="#2a2a33"/><path d="M0 -3 L-6 -22 L6 -30" stroke="#3a3a44" stroke-width="2.2" fill="none"/>
        <path d="M-2 -38 L18 -30 L12 -20 L-6 -28 Z" fill="#2e5a3a"/>
        <path d="M-6 -28 L12 -20 L40 20 L-30 20 Z" fill="url(#${id}lamp)" opacity=".8"/>
        <ellipse cx="3" cy="-24" rx="6" ry="2.2" fill="#fff2b0" transform="rotate(22 3 -24)"/></g>
      <g transform="translate(144 134) rotate(-8)">
        ${[[-4, 2, 6], [0, 0, -2], [4, -2, 3]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-14" y="-5" width="28" height="12" fill="#fbf6e8" stroke="#b9ab8a" stroke-width=".6"/>
          ${[0, 1, 2].map(l => `<path d="M-11 ${-2 + l * 3} H${8 - l * 3}" stroke="#8a8272" stroke-width=".8"/>`).join("")}</g>`).join("")}
        <path d="M14 -8 L22 -2" stroke="#222" stroke-width="2" stroke-linecap="round"/></g>
      <g transform="translate(100 98)">
        <circle r="46" fill="url(#${id}glow)" opacity=".18"/>
        <path d="M-12 36 H12 L16 36 V34 H-16 V36 Z" fill="#2a2a33"/><rect x="-18" y="34" width="36" height="4" rx="1.5" fill="#1c1c24"/>
        <rect x="-4" y="28" width="8" height="7" fill="url(#${id}m)"/>
        <circle r="30" fill="none" stroke="#14141a" stroke-width="7"/><circle r="30" fill="none" stroke="url(#${id}m)" stroke-width="4.4"/>
        ${[[-16, -20, 0, -28], [16, -20, 0, -28], [-16, 20, 0, 28], [16, 20, 0, 28], [-16, -20, -26, -10], [-16, 20, -26, 10], [16, -20, 26, -10], [16, 20, 26, 10]].map(([x1, y1, x2, y2]) => {
          const n = 6, dx = (x2 - x1) / n, dy = (y2 - y1) / n, len = Math.hypot(dx, dy), px = -dy / len * 2, py = dx / len * 2;
          let d = `M${x1} ${y1}`; for (let k = 1; k <= n; k++) d += ` L${(x1 + dx * k + (k < n ? (k % 2 ? px : -px) : 0)).toFixed(1)} ${(y1 + dy * k + (k < n ? (k % 2 ? py : -py) : 0)).toFixed(1)}`;
          return `<path d="${d}" fill="none" stroke="#d6d9e2" stroke-width="1.1"/>`; }).join("")}
        <rect x="-16" y="-21" width="32" height="42" rx="3" fill="url(#${id}m)" stroke="#1c1c24" stroke-width="1.5"/>
        <rect x="-12" y="-17" width="24" height="34" rx="1.2" fill="#24242c"/>
        ${Array.from({ length: 8 }, (_, k) => `<path d="M${-10.5 + k * 3} -16 V16" stroke="#9a9aa6" stroke-width=".9"/>`).join("")}
        ${Array.from({ length: 11 }, (_, k) => `<path d="M-11 ${-15 + k * 3} H11" stroke="#9a9aa6" stroke-width=".6"/>`).join("")}
        <path d="M-.8 -17 V17 M.8 -17 V17" stroke="#e3b33a" stroke-width=".6" opacity=".85"/>
        <path d="M-14 -19 l7 4" stroke="#fff" stroke-width="1.4" opacity=".6"/>
        <path d="M-3 38 C-10 44 -30 42 -44 40" stroke="#1c1c24" stroke-width="1.6" fill="none"/></g>`;
  }
};

ART.firststep = {
  rim: "#e07a5f", ink: "#6b2a1a",
  art: id => sky(id, ["#f4e3c0", "#e7cf9c"]) + `
    <defs><linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4d88a"/><stop offset=".5" stop-color="#c99a26"/><stop offset="1" stop-color="#8a6212"/></linearGradient></defs>
    <g stroke="#c9a86a" stroke-width=".8" opacity=".7">${[50, 80, 110, 140, 170].map(v => `<path d="M${v} 0 V200 M0 ${v} H200"/>`).join("")}</g>
    <path d="M30 120 C50 100 40 70 70 60 C90 54 96 76 120 70" stroke="#b5462f" stroke-width="2" stroke-dasharray="4 4" fill="none"/>
    ${[[34, 132, -30], [42, 124, -10], [50, 112, -40]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="5" fill="#6b4428" transform="rotate(${r} ${x} ${y})"/>`).join("")}
    <g transform="translate(28 134)"><path d="M0 0 V-22" stroke="#6b4428" stroke-width="2"/><path d="M1 -22 h14 l-4 5 l4 5 h-14 Z" fill="#e07a5f"/></g>
    <g transform="translate(118 108)">
      <circle r="36" fill="#6b4428"/><circle r="32" fill="url(#${id}c)"/><circle r="26" fill="#fbf6e8" stroke="#8a6212"/>
      ${Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8; const l = i % 4 ? 22 : 18; return `<path d="M${l * Math.cos(a)} ${l * Math.sin(a)} L${25 * Math.cos(a)} ${25 * Math.sin(a)}" stroke="#8a6212" stroke-width="${i % 4 ? 1 : 2}"/>`; }).join("")}
      <path d="${star(0, 0, 22, 5, 4, -90)}" fill="#e9dcc2" stroke="#b9a882" stroke-width=".6" transform="rotate(45)"/>
      <g transform="rotate(-28)"><path d="M0 -22 L5 0 L0 4 L-5 0 Z" fill="#c8302c"/><path d="M0 22 L5 0 L0 -4 L-5 0 Z" fill="#3a3a44"/></g>
      <circle r="3" fill="#e3b33a" stroke="#8a6212"/>
      <rect x="-5" y="-42" width="10" height="7" rx="2" fill="url(#${id}c)" stroke="#6b4428"/><circle cy="-45" r="4" fill="none" stroke="#8a6212" stroke-width="2"/></g>
    <path d="M150 46 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 Z" fill="#ffd35a" opacity=".9"/>`
};

ART.explorer = {
  rim: "#7a6a2e", ink: "#3a3010",
  art: id => sky(id, ["#9fd0ea", "#e6f3f8"]) + `
    <defs><linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2e2b4"/><stop offset="1" stop-color="#c9ad6a"/></linearGradient></defs>
    <path d="M22 70 L70 58 L120 70 L178 58 V150 L120 162 L70 150 L22 162 Z" fill="#f4ead0" stroke="#a89060" stroke-width="1.5"/>
    <path d="M70 58 V150 M120 70 V162" stroke="#c9b27e" stroke-width="1.2"/>
    ${[["#e07a5f", "M34 84 L62 78 L66 102 L40 108 Z"], ["#6f9a3c", "M76 76 L110 82 L106 110 L80 104 Z"], ["#2c4fa3", "M128 86 L168 78 L164 104 L132 110 Z"],
       ["#7157b8", "M32 118 L60 114 L64 140 L36 146 Z"], ["#e0a526", "M78 116 L110 120 L108 146 L76 140 Z"], ["#c0392b", "M128 122 L164 116 L166 140 L130 148 Z"]]
      .map(([c, d]) => `<path d="${d}" fill="${c}" opacity=".78" stroke="#fff" stroke-width="1"/>`).join("")}
    ${[[50, 94], [93, 94], [148, 94], [48, 130], [93, 131], [147, 132]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#fff"/><path d="M${x - 3} ${y} l2 2.4 l4 -5" stroke="#2e7d4a" stroke-width="1.8" fill="none"/>`).join("")}
    <g transform="translate(150 60)"><path d="M0 0 V-30" stroke="#6b4428" stroke-width="2"/><path d="M1 -30 c6 -3 10 3 18 0 v12 c-8 3 -12 -3 -18 0 Z" fill="#e07a5f"/></g>
    <g transform="translate(60 44)"><ellipse cx="0" cy="10" rx="30" ry="7" fill="url(#${id}h)" stroke="#8a7240"/><path d="M-18 10 C-18 -8 18 -8 18 10 Z" fill="url(#${id}h)" stroke="#8a7240"/>
      <path d="M-18 6 H18" stroke="#6b4428" stroke-width="3"/></g>
    <g transform="translate(110 150) rotate(-18)"><rect x="-16" y="-8" width="12" height="18" rx="3" fill="#3a3a44"/><rect x="4" y="-8" width="12" height="18" rx="3" fill="#3a3a44"/>
      <rect x="-4" y="-2" width="8" height="6" fill="#555"/><circle cx="-10" cy="-8" r="5" fill="#6fa8d4" stroke="#222"/><circle cx="10" cy="-8" r="5" fill="#6fa8d4" stroke="#222"/></g>`
};

ART.diligent = {
  rim: "#4a4a8a", ink: "#1c1c48",
  art: id => sky(id, ["#dfe4f6", "#f6f3ea"]) + `
    <defs><radialGradient id="${id}lens" cx=".4" cy=".35"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset="1" stop-color="#bcd8ff" stop-opacity=".35"/></radialGradient></defs>
    <rect x="0" y="138" width="200" height="62" fill="#9a7a56"/><rect x="0" y="138" width="200" height="4" fill="#b08a62"/>
    <g transform="rotate(-6 92 96)">
      <rect x="50" y="42" width="84" height="108" rx="5" fill="#8a5a36"/>
      <rect x="56" y="52" width="72" height="92" fill="#fbf8ef"/>
      <rect x="78" y="36" width="28" height="12" rx="3" fill="#b9bcc6" stroke="#6d6f7a"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="62" y="${60 + i * 13}" width="9" height="9" rx="1.5" fill="#fff" stroke="#6d6f7a"/>
        <path d="M63.5 ${64.5 + i * 13} l2.6 3 l5 -7" stroke="#2e7d4a" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M76 ${64.5 + i * 13} H${112 - (i % 3) * 8}" stroke="#b7b9c6" stroke-width="2.2" stroke-linecap="round"/>`).join("")}</g>
    <g transform="translate(140 108) rotate(35)"><rect x="-3" y="-6" width="6" height="52" fill="#e0a526"/><path d="M-3 46 L0 56 L3 46 Z" fill="#e7c89a"/><path d="M-1 53 L0 56 L1 53 Z" fill="#333"/><rect x="-3" y="-12" width="6" height="6" fill="#e07a9a"/></g>
    <g transform="translate(120 84)">
      <path d="M14 14 L36 36" stroke="#5a3b1c" stroke-width="8" stroke-linecap="round"/>
      <circle r="20" fill="url(#${id}lens)" stroke="#3a3a44" stroke-width="4"/>
      <path d="M-10 -6 a12 12 0 0 1 8 -8" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>
    <path d="${star(40, 60, 6, 2.4)}" fill="#ffd35a"/><path d="${star(160, 50, 4, 1.6)}" fill="#ffd35a"/>`
};

/* ---------- profile badges, one level ---------- */
const qmark = (x, y, k, col) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-5 -7 a5.5 5.5 0 1 1 8 5 q-3 1.6 -3 5 v1.5" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="9" r="1.9" fill="${col}"/></g>`;
const compass = (cx, cy, r, rot, id) => `<g transform="translate(${cx} ${cy})">
  <circle r="${r + 4}" fill="#6b4428"/><circle r="${r + 1.5}" fill="url(#${id}br)"/><circle r="${r - 3}" fill="#fbf6e8" stroke="#8a6212"/>
  ${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${(r - 7) * Math.cos(a)} ${(r - 7) * Math.sin(a)} L${(r - 4) * Math.cos(a)} ${(r - 4) * Math.sin(a)}" stroke="#8a6212" stroke-width="${i % 3 ? 0.8 : 1.6}"/>`; }).join("")}
  <g transform="rotate(${rot})"><path d="M0 ${-(r - 6)} L4 0 L0 3 L-4 0 Z" fill="#c8302c"/><path d="M0 ${r - 6} L4 0 L0 -3 L-4 0 Z" fill="#3a3a44"/></g>
  <circle r="2.4" fill="#e3b33a" stroke="#8a6212"/></g>`;

ART.orphan = {
  rim: "#5a7a8a", ink: "#1f3440",
  art: id => sky(id, ["#3a3f6a", "#c87a7a", "#f2c08a"]) + `
    <defs><linearGradient id="${id}sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a6a8a"/><stop offset="1" stop-color="#1f3450"/></linearGradient></defs>
    <circle cx="100" cy="104" r="18" fill="#ffd08a" opacity=".85"/>
    <rect x="0" y="104" width="200" height="96" fill="url(#${id}sea)"/>
    <path d="M70 108 H130" stroke="#ffd08a" stroke-width="2" opacity=".6"/><path d="M80 114 H120 M88 120 H112" stroke="#ffd08a" stroke-width="1.4" opacity=".4"/>
    ${[[34, 104, "#d23a2e"], [62, 105, "#e0457a"], [140, 104, "#2c4fa3"], [168, 105, "#1a1a2a"]].map(([x, y, c]) => `<path d="M${x - 10} ${y} Q${x} ${y - 7} ${x + 10} ${y} Z" fill="#2a3a4a" opacity=".8"/><path d="M${x} ${y - 5} V${y - 13}" stroke="#2a3a4a" stroke-width=".8"/><path d="M${x} ${y - 13} h5 v3 h-5 Z" fill="${c}"/>`).join("")}
    <path d="M40 150 Q100 126 160 150 Z" fill="#e9d29a"/><path d="M40 150 Q100 132 160 150" stroke="#fff" stroke-width="1.5" opacity=".5" fill="none"/>
    <path d="M122 140 Q118 110 126 92" stroke="#6b4428" stroke-width="3" fill="none"/>
    ${[[-50, 10], [-10, 16], [30, 10], [70, 20], [110, 12]].map(([r, l]) => `<path d="M126 92 q${l * Math.cos(r * Math.PI / 180) * 0.7} ${-8 + l * Math.sin(r * Math.PI / 180) * 0.3} ${l * Math.cos(r * Math.PI / 180) * 1.4} ${l * Math.sin(r * Math.PI / 180) * 0.9 + 4}" stroke="#2f6b3a" stroke-width="4" fill="none" stroke-linecap="round"/>`).join("")}
    <g transform="translate(86 140)"><circle cx="0" cy="-18" r="4.4" fill="#2a2030"/><path d="M-6 -12 Q0 -15 6 -12 L5 0 H-5 Z" fill="#2a2030"/><path d="M5 -2 L16 0 L17 4" stroke="#2a2030" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-3 -8 L6 -2" stroke="#2a2030" stroke-width="2.4" stroke-linecap="round"/></g>
    <g transform="translate(58 136) rotate(-30)"><rect x="-3" y="-8" width="6" height="12" rx="2" fill="#6fae8a" opacity=".85"/><rect x="-1.5" y="-12" width="3" height="4" fill="#6fae8a"/><rect x="-1" y="-5" width="2" height="6" fill="#fbf6e8"/></g>
    ${[[30, 30], [160, 40], [120, 24]].map(([x, y]) => `<path d="M${x} ${y} q3 -3 6 0 q3 -3 6 0" stroke="#2a2a3a" stroke-width="1.2" fill="none"/>`).join("")}`
};

ART.loyal = {
  rim: "#b05a2a", ink: "#4a1e08",
  art: id => sky(id, ["#fbe0b0", "#f2c890"]) + `
    <defs><radialGradient id="${id}fur" cx=".4" cy=".3"><stop offset="0" stop-color="#e8b878"/><stop offset="1" stop-color="#a8682e"/></radialGradient></defs>
    <rect x="0" y="0" width="200" height="200" fill="#f0d8a8"/>
    ${[30, 70, 110, 150, 190].map(x => `<path d="M${x} 0 V130" stroke="#e3c690" stroke-width="10"/>`).join("")}
    <g transform="translate(46 70)"><rect x="-18" y="-22" width="36" height="44" rx="2" fill="#8a5a36"/><rect x="-14" y="-18" width="28" height="36" fill="#fbf6e8"/>
      <rect x="-14" y="-18" width="28" height="9" fill="#d23a2e"/><circle cx="-5" cy="2" r="5" fill="#d6cdb8"/><path d="M2 -2 h9 M2 3 h7 M-10 12 h20" stroke="#b7ab90" stroke-width="1.5"/>
      <path d="M-4 -24 L0 -32 L4 -24" stroke="#6b4428" stroke-width="1.2" fill="none"/></g>
    <rect x="0" y="128" width="200" height="72" fill="#b98a5a"/><rect x="0" y="128" width="200" height="4" fill="#d2a472"/>
    <ellipse cx="112" cy="152" rx="44" ry="6" fill="#000" opacity=".15"/>
    <path d="M86 150 C80 120 90 100 110 98 C132 96 142 116 138 150 Z" fill="url(#${id}fur)"/>
    <path d="M132 146 C150 150 160 138 156 124" stroke="#a8682e" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M92 152 V132 M104 152 V134" stroke="#8a5424" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="108" cy="80" rx="22" ry="20" fill="url(#${id}fur)"/>
    <path d="M88 70 C80 76 80 94 88 98 C92 88 92 78 88 70 Z" fill="#7a4a1e"/><path d="M128 70 C136 76 136 94 128 98 C124 88 124 78 128 70 Z" fill="#7a4a1e"/>
    <ellipse cx="108" cy="90" rx="11" ry="8" fill="#f2d2a0"/><ellipse cx="108" cy="85" rx="4" ry="3" fill="#2a1a10"/>
    <circle cx="100" cy="76" r="2.4" fill="#2a1a10"/><circle cx="116" cy="76" r="2.4" fill="#2a1a10"/><circle cx="100.8" cy="75.2" r=".8" fill="#fff"/><circle cx="116.8" cy="75.2" r=".8" fill="#fff"/>
    <path d="M92 102 Q108 110 124 102" stroke="#d23a2e" stroke-width="4" fill="none"/><circle cx="108" cy="110" r="4" fill="#e3b33a" stroke="#8a5a10"/>
    <path d="M100 94 L150 84" stroke="#6b4428" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M150 84 L148 56 L176 70 Z" fill="#d23a2e"/><path d="M149 70 L168 71" stroke="#fff" stroke-width="1.4" opacity=".6"/>`
};

ART.oddball = {
  rim: "#8a4ab0", ink: "#3a1450",
  art: id => sky(id, ["#e8e0f8", "#fdf6e8"]) + `
    <defs><pattern id="${id}p1" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#2c4fa3"/><circle cx="3" cy="3" r="1.4" fill="#fff" opacity=".6"/></pattern>
    <pattern id="${id}p2" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#e0a526"/><rect width="3" height="6" fill="#c0392b"/></pattern></defs>
    ${(() => {
      const piece = (x, y, fill, knobs) => { const k = knobs; const s = 26;
        return `<g transform="translate(${x} ${y})"><path d="M0 0 H${s * .38} ${k[0] ? `a5 5 0 1 1 ${s * .24} 0` : `a5 5 0 1 0 ${s * .24} 0`} H${s} V${s * .38} ${k[1] ? `a5 5 0 1 1 0 ${s * .24}` : `a5 5 0 1 0 0 ${s * .24}`} V${s} H0 Z" fill="${fill}" stroke="#3a2a4a" stroke-width="1.4" stroke-linejoin="round"/></g>`; };
      const P = [["#6f9a3c", [1, 0]], [`url(#${id}p1)`, [0, 1]], ["#e07a5f", [1, 1]], ["#f2c230", [0, 0]], ["#fbf6e8", [1, 0]], [`url(#${id}p2)`, [0, 1]], ["#2f9b8f", [1, 1]], ["#c46aa0", [0, 1]], ["#3a3a44", [1, 0]]];
      return P.map(([f, k], i) => i === 4 ? "" : piece(61 + (i % 3) * 26, 52 + Math.floor(i / 3) * 26, f, k)).join("");
    })()}
    <g transform="translate(96 30) rotate(24)"><path d="M0 0 H10 a5 5 0 1 1 8 0 H26 V26 H0 Z" fill="#fbf6e8" stroke="#3a2a4a" stroke-width="1.4"/>
      <path d="M-2 26 L-8 34 M12 26 v10 M28 20 l8 4" stroke="#3a2a4a" stroke-width="1.4"/>
      <circle cx="8" cy="12" r="2" fill="#3a2a4a"/><circle cx="18" cy="12" r="2" fill="#3a2a4a"/><path d="M8 19 q5 4 10 0" stroke="#3a2a4a" stroke-width="1.4" fill="none"/></g>
    <rect x="87" y="78" width="26" height="26" fill="#3a2a4a" opacity=".12"/>
    ${[[50, 44], [150, 46], [44, 128], [156, 126]].map(([x, y]) => `<path d="${star(x, y, 4, 1.6)}" fill="#8a4ab0" opacity=".6"/>`).join("")}
    <path d="M0 138 H200 V200 H0 Z" fill="#d8cce8"/>`
};

ART.undecided = {
  rim: "#7a8a9a", ink: "#2a3440",
  art: id => sky(id, ["#d8e4ee", "#f4f1ea"]) + `
    <defs><linearGradient id="${id}coin" x1="0" x2="1"><stop offset="0" stop-color="#a8761a"/><stop offset=".5" stop-color="#ffe27a"/><stop offset="1" stop-color="#a8761a"/></linearGradient></defs>
    ${qmark(68, 60, 1.3, "#5a6a7a")}${qmark(134, 56, 1.6, "#4a5a6a")}${qmark(52, 106, 1, "#7a8a9a")}${qmark(150, 110, 1.1, "#7a8a9a")}
    <g transform="translate(100 40)"><ellipse rx="10" ry="3.2" fill="url(#${id}coin)" stroke="#8a620c"/><path d="M-14 8 q14 -6 28 0" stroke="#bbb" stroke-width="1" fill="none" stroke-dasharray="2 2"/></g>
    <path d="M100 48 L100 64" stroke="#bbb" stroke-width="1" stroke-dasharray="2 3"/>
    <path d="M0 146 H200 V200 H0 Z" fill="#c9c2b2"/>
    <g transform="translate(100 146)">
      <path d="M-18 0 L-14 -44 Q0 -50 14 -44 L18 0 Z" fill="#6f8fb0"/>
      <path d="M-14 -42 L-32 -52 L-40 -62" stroke="#6f8fb0" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14 -42 L32 -52 L40 -62" stroke="#6f8fb0" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <ellipse cx="-42" cy="-64" rx="5" ry="3" fill="#e7b58c"/><ellipse cx="42" cy="-64" rx="5" ry="3" fill="#e7b58c"/>
      <circle cx="0" cy="-58" r="12" fill="#e7b58c"/>
      <path d="M-6 -60 q2 -2 4 0 M2 -60 q2 -2 4 0" stroke="#3a2a18" stroke-width="1.4" fill="none"/>
      <path d="M-5 -51 q5 -3 10 0" stroke="#3a2a18" stroke-width="1.4" fill="none"/>
      <path d="M-12 -62 Q0 -76 12 -62 Q6 -68 0 -68 Q-6 -68 -12 -62 Z" fill="#5a3b1c"/>
      <path d="M-8 0 V-10 M8 0 V-10" stroke="#3a4a5a" stroke-width="5"/></g>`
};

ART.weathervane = {
  rim: "#3a8ab0", ink: "#0e3a50",
  art: id => sky(id, ["#6aa8d8", "#c8e2f2"]) + `
    <defs><linearGradient id="${id}cu" x1="0" x2="1"><stop offset="0" stop-color="#2a1a0a"/><stop offset=".5" stop-color="#5a3a18"/><stop offset="1" stop-color="#1a1008"/></linearGradient></defs>
    <g fill="none" stroke="#fff" stroke-linecap="round" opacity=".8">
      <path d="M20 70 C50 50 80 90 110 64 C130 48 150 60 146 76 C142 90 124 86 128 74" stroke-width="2.4"/>
      <path d="M30 104 C60 90 90 118 130 98 C150 88 172 96 170 110" stroke-width="2"/>
      <path d="M50 40 C80 30 110 44 140 30" stroke-width="1.6"/>
      <path d="M150 124 C130 132 120 120 104 128" stroke-width="1.6"/></g>
    ${[[40, 60, 20, "#e0a526"], [160, 90, -40, "#c0392b"], [60, 118, 60, "#6f9a3c"], [138, 40, 10, "#e07a5f"], [30, 92, -70, "#6f9a3c"]].map(([x, y, r, c]) => `<path d="M${x} ${y} q5 -6 10 0 q-5 6 -10 0" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`).join("")}
    <path d="M40 200 L100 128 L160 200 Z" fill="#8a3a2a"/>${[0, 1, 2, 3, 4, 5].map(k => `<path d="M${88 - k * 10} ${142 + k * 12} H${112 + k * 10}" stroke="#6b2a1e" stroke-width="1.4"/>`).join("")}
    <path d="M100 128 V80" stroke="#2a1a0a" stroke-width="3"/><circle cx="100" cy="126" r="3.4" fill="#2a1a0a"/>
    <g transform="translate(100 104)" stroke="#2a1a0a" stroke-width="2" stroke-linecap="round"><path d="M-22 0 H22 M0 -6 V6"/>
      <path d="M22 0 l-5 -3 v6 Z M-22 0 l5 -3 v6 Z" fill="#2a1a0a"/></g>
    <circle cx="100" cy="104" r="2.6" fill="#2a1a0a"/>
    <g transform="translate(100 78) rotate(-14) scale(.72)">
      <path d="M-28 6 H24 L30 2 L24 -2 H-8" fill="none" stroke="#2a1a0a" stroke-width="2.4"/>
      <path d="M-8 -2 C-10 -14 -2 -24 8 -24 C12 -24 14 -28 18 -28 L22 -24 L18 -20 C20 -16 20 -10 14 -4 C22 -8 30 -14 30 -26 C38 -16 34 0 20 4 L-6 4 Z" fill="url(#${id}cu)"/>
      <path d="M-6 4 C-18 2 -28 -8 -30 -22 C-22 -14 -14 -12 -8 -12 C-16 -18 -20 -26 -20 -34 C-12 -24 -4 -20 2 -18 Z" fill="url(#${id}cu)"/>
      <path d="M16 -30 l2 -6 l2 5 l2 -5 l1 6 Z" fill="#c0392b"/><circle cx="16" cy="-23" r="1.2" fill="#ffe27a"/>
      <path d="M2 4 v6 l-3 2 M8 4 v6 l3 2" stroke="#2a1a0a" stroke-width="1.6" fill="none"/></g>`
};

ART.soulmate = {
  rim: "#d0508a", ink: "#5a1030",
  art: id => sky(id, ["#fbd8e4", "#fdf0e0"]) + `
    <defs><linearGradient id="${id}br" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4d88a"/><stop offset=".5" stop-color="#c99a26"/><stop offset="1" stop-color="#8a6212"/></linearGradient>
    <radialGradient id="${id}h"><stop offset="0" stop-color="#ff6a9a" stop-opacity=".5"/><stop offset="1" stop-color="#ff6a9a" stop-opacity="0"/></radialGradient></defs>
    ${[[40, 50], [160, 44], [30, 110], [172, 112], [100, 34]].map(([x, y]) => `<path d="M${x} ${y + 3} c-3 -3 -6 -6 -3 -8 c1.6 -1 3 0 3 1 c0 -1 1.4 -2 3 -1 c3 2 0 5 -3 8 Z" fill="#e0457a" opacity=".45"/>`).join("")}
    <path d="M0 140 Q100 128 200 140 V200 H0 Z" fill="#e8b8c8"/>
    <path d="M76 98 C82 110 118 110 124 98" stroke="#8a6212" stroke-width="1.6" fill="none" stroke-dasharray="3 3"/>
    ${compass(70, 96, 26, 34, id)}${compass(130, 96, 26, 34, id)}
    <circle cx="100" cy="60" r="16" fill="url(#${id}h)"/>
    <path d="M100 70 c-8 -7 -14 -12 -8 -17 c3 -2.6 7 -1 8 2 c1 -3 5 -4.6 8 -2 c6 5 0 10 -8 17 Z" fill="#e0457a" stroke="#a02a5a" stroke-width="1"/>
    <path d="M70 70 L${70 + 60 * Math.sin(34 * Math.PI / 180)} ${96 - 60 * Math.cos(34 * Math.PI / 180)}" stroke="#c8302c" stroke-width="1" stroke-dasharray="2 3" opacity=".6"/>
    <path d="M130 70 L${130 + 30 * Math.sin(34 * Math.PI / 180)} ${96 - 60 * Math.cos(34 * Math.PI / 180)}" stroke="#c8302c" stroke-width="1" stroke-dasharray="2 3" opacity=".6"/>`
};
