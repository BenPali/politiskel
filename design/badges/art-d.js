/* Badges, set D: multiculturalism, feminism, LGBT rights, reform, revolution, ecology, defence.
   Each scene grows with the level t (1, 2, 3). */
(() => {
  const seeded = (seed) => { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };
  const RAINBOW = ["#e40303", "#ff8c00", "#ffed00", "#008026", "#004dff", "#750787"];
  const SKIN = ["#f1c9a5", "#d9a47a", "#a8703f", "#6e4424", "#e8b98f", "#8a5a34"];
  const ground = (y, c1, c2) => `<path d="M0 ${y} Q60 ${y - 8} 100 ${y - 2} T200 ${y - 4} V200 H0 Z" fill="${c1}"/><path d="M0 ${y + 10} Q50 ${y + 4} 110 ${y + 10} T200 ${y + 8} V200 H0 Z" fill="${c2}"/>`;
  const venus = (x, y, r, col, w = 2) => `<g fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"><circle cx="${x}" cy="${y}" r="${r}"/><path d="M${x} ${y + r} v${r * 0.9} M${x - r * 0.45} ${y + r * 1.45} h${r * 0.9}"/></g>`;

  /* ---------------- multiculturalism ---------------- */
  ART.mosaic = {
    rim: "#d9822b", ink: "#6b3508",
    art: (id, t = 2) => {
      if (t === 1) return sky(id, ["#bfe3f2", "#fff4dc"]) + `
        <circle cx="146" cy="56" r="10" fill="#ffd66b"/>${cloud(40, 62, 0.8, 0.8)}
        ${ground(148, "#a9c97a", "#8ab35d")}
        <rect x="46" y="104" width="38" height="46" fill="#fbf7ee" stroke="#8a7a66"/><path d="M42 106 L65 84 L88 106 Z" fill="#c8553a"/>
        <rect x="60" y="126" width="10" height="24" fill="#7a4a2a"/><rect x="50" y="112" width="8" height="8" fill="#9fc3dd"/><rect x="72" y="112" width="8" height="8" fill="#9fc3dd"/>
        <rect x="112" y="110" width="40" height="40" fill="#f0dcb0" stroke="#9a7a4a"/><path d="M114 110 a18 18 0 0 1 36 0 Z" fill="#2f9b8f"/>
        <circle cx="132" cy="90" r="2" fill="#e0a526"/>
        <path d="M126 150 v-14 a6 6 0 0 1 12 0 v14 Z" fill="#6b4a2e"/><path d="M116 120 v-4 a3 3 0 0 1 6 0 v4 Z M142 120 v-4 a3 3 0 0 1 6 0 v4 Z" fill="#2d6f8e"/>
        <rect x="97" y="126" width="4" height="24" fill="#6b4a2e"/><circle cx="99" cy="120" r="10" fill="#5d9a3a"/>`;
      if (t === 2) {
        const r = seeded(5), pal = ["#e0a526", "#2f9b8f", "#c8553a", "#3a64c8", "#8e44ad", "#5d9a3a", "#f2c56b", "#d6457a"];
        let tiles = "";
        for (let y = 20; y < 180; y += 12) for (let x = 20; x < 180; x += 12)
          tiles += `<rect x="${x + 0.8}" y="${y + 0.8}" width="10.4" height="10.4" rx="1.5" fill="${pal[Math.floor(r() * pal.length)]}" opacity="${(0.55 + r() * 0.35).toFixed(2)}"/>`;
        const doors = [
          [44, "#c8553a", (x) => `M${x - 10} 150 V120 a10 10 0 0 1 20 0 V150 Z`],
          [78, "#2f9b8f", (x) => `M${x - 10} 150 V122 Q${x} 100 ${x + 10} 122 V150 Z`],
          [112, "#3a64c8", (x) => `M${x - 10} 150 V118 H${x + 10} V150 Z`],
          [146, "#8e44ad", (x) => `M${x - 10} 150 V124 a12 12 0 1 1 20 0 V150 Z`]];
        return `<rect width="200" height="200" fill="#f4ead6"/>${tiles}
          <rect x="20" y="100" width="160" height="56" fill="#efe2c6"/>
          <path d="M20 100 H180" stroke="#b08a5a" stroke-width="2"/>
          ${doors.map(([x, c, d]) => `<path d="${d(x)}" fill="${c}" stroke="#6b3508" stroke-width="1.4"/><circle cx="${x + 5}" cy="138" r="1.4" fill="#ffe7a0"/>`).join("")}
          ${[[36, 158, 0], [62, 160, 1], [94, 158, 2], [128, 160, 3], [160, 158, 4]].map(([x, y, i]) => `<g transform="translate(${x} ${y}) scale(1.35)"><circle cx="0" cy="-17" r="5" fill="${SKIN[i]}"/><path d="M-7 0 Q-7 -11 0 -11 Q7 -11 7 0 Z" fill="${pal[(i * 3 + 1) % pal.length]}"/></g>`).join("")}`;
      }
      const r = seeded(9), pal = ["#e0a526", "#2f9b8f", "#c8553a", "#3a64c8", "#8e44ad", "#5d9a3a", "#d6457a"];
      const tiers = [[112, 16], [94, 16], [76, 15], [58, 14], [40, 13], [24, 12]];
      let y = 152, tw = "";
      tiers.forEach(([w, h], i) => {
        y -= h;
        tw += `<rect x="${100 - w / 2}" y="${y}" width="${w}" height="${h}" fill="${pal[i]}" stroke="#5a3a1a" stroke-width="1"/>`
          + Array.from({ length: Math.floor(w / 12) }, (_, k) => `<path d="M${100 - w / 2 + 6 + k * 12} ${y + h - 2} v-${h - 7} a3 3 0 0 1 6 0 v${h - 7}" fill="#2a1a0a" opacity=".55"/>`).join("")
          + `<path d="M${100 - w / 2} ${y + h} L${100 + w / 2} ${y}" stroke="#fff3d0" stroke-width="1.4" opacity=".6"/>`;
      });
      const flags = [[62, 136], [138, 136], [70, 120], [130, 120], [79, 105], [121, 105], [88, 91], [112, 91], [100, 72]];
      const bubbles = [[40, 62, 13], [150, 54, 12], [34, 98, 9], [166, 92, 10], [120, 40, 8], [70, 42, 9]];
      return sky(id, ["#ffcf8a", "#ffe6b8", "#cfe8f5"]) + `
        <g opacity=".35" fill="#fff">${Array.from({ length: 12 }, (_, i) => { const a = i * 30 * Math.PI / 180; return `<path d="M100 60 L${100 + 140 * Math.cos(a)} ${60 + 140 * Math.sin(a)} L${100 + 140 * Math.cos(a + 0.14)} ${60 + 140 * Math.sin(a + 0.14)} Z"/>`; }).join("")}</g>
        ${bubbles.map(([x, y, s], i) => `<g><ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s * 0.72}" fill="#fff" stroke="${pal[i]}" stroke-width="1.4"/><path d="M${x - 3} ${y + s * 0.6} l-4 7 l8 -5 Z" fill="#fff" stroke="${pal[i]}" stroke-width="1"/>${[-1, 0, 1].map(k => `<circle cx="${x + k * s * 0.35}" cy="${y}" r="1.3" fill="${pal[i]}"/>`).join("")}</g>`).join("")}
        ${ground(150, "#c8a46a", "#a9854e")}
        ${tw}
        ${flags.map(([x, fy], i) => `<path d="M${x} ${fy} v-12" stroke="#5a3a1a" stroke-width="1"/><path d="M${x} ${fy - 12} h${i % 2 ? -9 : 9} l${i % 2 ? 2 : -2} 3 l${i % 2 ? -2 : 2} 3 h${i % 2 ? 9 : -9} Z" fill="${pal[(i + 2) % pal.length]}"/>`).join("")}
        ${[[30, 150, 0], [48, 154, 2], [158, 152, 3], [174, 150, 5]].map(([x, yy, i]) => `<g transform="translate(${x} ${yy}) scale(1.2)"><circle cx="0" cy="-17" r="5" fill="${SKIN[i]}"/><path d="M-7 0 Q-7 -11 0 -11 Q7 -11 7 0 Z" fill="${pal[i]}"/></g>`).join("")}
        ${Array.from({ length: 6 }, () => { const x = 20 + r() * 160, yy = 20 + r() * 50; return `<path d="M${x - 4} ${yy} q2 -3 4 0 q2 -3 4 0" stroke="#5a3a1a" stroke-width="1" fill="none"/>`; }).join("")}`;
    }
  };

  /* ---------------- feminism ---------------- */
  ART.feminism = {
    rim: "#7b3fa0", ink: "#3a1450",
    art: (id, t = 2) => {
      if (t === 1) return sky(id, ["#e8dcf5", "#fbf6ff"]) + `
        ${cloud(36, 60, 0.8, 0.9)}${cloud(140, 50, 0.7, 0.8)}
        ${ground(150, "#d6c8e8", "#c4b2dc")}
        <path d="M100 76 V148" stroke="#7a5a2a" stroke-width="4"/><path d="M82 150 H118 L112 142 H88 Z" fill="#8a6a3a"/>
        <path d="M60 80 H140" stroke="#a8761a" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="78" r="5" fill="#e3b33a"/>
        ${[62, 138].map(x => `<path d="M${x} 82 L${x - 16} 114 M${x} 82 L${x + 16} 114" stroke="#a8761a" stroke-width="1.2"/><path d="M${x - 20} 114 H${x + 20} Q${x} 130 ${x - 20} 114 Z" fill="#e3b33a" stroke="#a8761a"/>`).join("")}
        ${venus(62, 102, 5, "#7b3fa0", 1.8)}<g stroke="#3a64c8" stroke-width="1.8" fill="none"><circle cx="138" cy="104" r="5"/><path d="M141.5 100.5 l6 -6 m-5 0 h5 v5"/></g>`;
      if (t === 2) return sky(id, ["#b58ad8", "#f3d9f0"]) + `
        ${venus(100, 72, 34, "#fff", 5).replace('<g ', '<g opacity=".45" ')}
        <path d="M86 160 L90 96 H112 L116 160 Z" fill="#7b3fa0"/><path d="M88 110 H114" stroke="#5a2a78" stroke-width="2"/>
        <g transform="translate(101 80)"><rect x="-15" y="-20" width="30" height="30" rx="9" fill="#d9a47a" stroke="#8a5a34" stroke-width="1.4"/>
          <path d="M-15 -8 H15 M-5 -20 V-8 M5 -20 V-8" stroke="#8a5a34" stroke-width="1.2"/><path d="M-15 0 q-6 -6 -2 -14 q6 -2 6 6" fill="#d9a47a" stroke="#8a5a34" stroke-width="1.2"/></g>
        ${[[40, 118, -8, "#e0457a"], [160, 116, 8, "#fff"], [132, 128, -4, "#c9a0e8"], [66, 130, 6, "#fff"]].map(([x, y, r, c]) => `<g transform="rotate(${r} ${x} ${y})"><path d="M${x} ${y} v30" stroke="#6b4a2e" stroke-width="2"/><rect x="${x - 13}" y="${y - 18}" width="26" height="18" rx="2" fill="${c}" stroke="#5a2a78" stroke-width="1.2"/>${venus(x, y - 11, 3.5, "#5a2a78", 1.4)}</g>`).join("")}
        ${[[24, 162, 0], [44, 166, 2], [150, 164, 3], [172, 162, 5], [120, 168, 1], [72, 168, 4]].map(([x, y, i]) => `<g transform="translate(${x} ${y}) scale(1.5)"><circle cx="0" cy="-17" r="5" fill="#3a1450"/><path d="M-7 0 Q-7 -11 0 -11 Q7 -11 7 0 Z" fill="#3a1450"/></g>`).join("")}`;
      return sky(id, ["#1a0f33", "#4a1f6a", "#8a3f9a"]) + `
        <defs><radialGradient id="${id}m"><stop offset=".7" stop-color="#fff3d0"/><stop offset="1" stop-color="#ffe7a0" stop-opacity="0"/></radialGradient>
        <radialGradient id="${id}c" cx=".5" cy=".3"><stop offset="0" stop-color="#d8ff8a"/><stop offset="1" stop-color="#6fd04a"/></radialGradient></defs>
        ${starfield(24, 17)}
        ${[[40, 44], [160, 60], [146, 30]].map(([x, y]) => venus(x, y, 3.5, "#ffe7a0", 1.2)).join("")}
        <circle cx="116" cy="76" r="42" fill="url(#${id}m)"/><circle cx="116" cy="76" r="32" fill="#fff5d8"/>
        <circle cx="106" cy="70" r="5" fill="#f0e2b8"/><circle cx="126" cy="86" r="3.5" fill="#f0e2b8"/>
        <g transform="rotate(-16 110 82)">
          <path d="M52 88 H160" stroke="#6b4a2e" stroke-width="3" stroke-linecap="round"/>
          <path d="M52 88 L34 80 M52 88 L32 86 M52 88 L33 92 M52 88 L36 97 M52 88 L38 76" stroke="#c9a04a" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M100 88 Q96 66 108 58 Q118 66 116 88 Z" fill="#2a1040"/>
          <path d="M104 62 Q82 70 76 86 Q92 78 104 76 Z" fill="#6a2a8a"/>
          <circle cx="110" cy="54" r="5.5" fill="#d9a47a"/>
          <path d="M98 50 H124 L113 47 L114 28 L106 46 Z" fill="#2a1040"/><path d="M104 47 H118" stroke="#9b59d0" stroke-width="2"/>
          <path d="M113 70 L126 82" stroke="#d9a47a" stroke-width="2.4" stroke-linecap="round"/></g>
        <path d="M0 148 Q100 136 200 148 V200 H0 Z" fill="#2a1040"/>
        <g transform="translate(52 150)"><circle cx="0" cy="-28" r="16" fill="#8fe06a" opacity=".2"/>
          <path d="M-16 -16 H16 Q18 4 0 6 Q-18 4 -16 -16 Z" fill="#1a1a22"/><ellipse cx="0" cy="-16" rx="16" ry="4" fill="url(#${id}c)"/>
          ${[[-5, -22, 3], [4, -26, 2.2], [0, -32, 1.6], [8, -20, 2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#b8ff8a" opacity=".85"/>`).join("")}
          <path d="M-10 6 l-3 6 M10 6 l3 6" stroke="#1a1a22" stroke-width="2"/><path d="M-8 8 q8 -8 16 0" fill="#ff8a2a"/></g>
        <g fill="#140a22">${[[150, 150], [172, 152]].map(([x, y]) => `<path d="M${x - 8} ${y} Q${x} ${y - 30} ${x + 8} ${y} Z"/><circle cx="${x}" cy="${y - 26}" r="2" fill="#ffe27a"/>`).join("")}</g>
        ${[[70, 40], [84, 30]].map(([x, y]) => `<path d="M${x - 6} ${y} q3 -4 6 0 q3 -4 6 0" stroke="#140a22" stroke-width="1.6" fill="none"/>`).join("")}`;
    }
  };

  /* ---------------- LGBT rights ---------------- */
  ART.pride = {
    rim: "#d6457a", ink: "#6a1238",
    art: (id, t = 2) => {
      if (t === 1) return sky(id, ["#fde8f0", "#eaf4ff"]) + `
        <defs><clipPath id="${id}h"><path d="M100 136 C58 108 56 72 82 70 C94 69 100 78 100 86 C100 78 106 69 118 70 C144 72 142 108 100 136 Z"/></clipPath></defs>
        ${cloud(34, 58, 0.8, 0.9)}${cloud(144, 132, 0.9, 0.8)}
        <g clip-path="url(#${id}h)">${RAINBOW.map((c, i) => `<rect x="50" y="${68 + i * 11.5}" width="100" height="12" fill="${c}"/>`).join("")}</g>
        <path d="M100 136 C58 108 56 72 82 70 C94 69 100 78 100 86 C100 78 106 69 118 70 C144 72 142 108 100 136 Z" fill="none" stroke="#6a1238" stroke-width="2"/>
        <path d="M74 80 q6 -6 12 -4" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6" fill="none"/>`;
      if (t === 2) return sky(id, ["#7ec8f0", "#e2f4ff"]) + `
        ${RAINBOW.map((c, i) => `<path d="M${16 + i * 7} 150 A${84 - i * 7} ${84 - i * 7} 0 0 1 ${184 - i * 7} 150" fill="none" stroke="${c}" stroke-width="7.4"/>`).join("")}
        ${cloud(12, 146, 1.4)}${cloud(160, 146, 1.4)}
        <g fill="#5a6b80">${[[44, 118, 14], [60, 104, 12], [74, 124, 16], [96, 96, 14], [112, 114, 12], [126, 100, 14], [142, 120, 16]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${160 - y}"/>`).join("")}</g>
        <g fill="#ffe7a0" opacity=".8">${[[48, 124], [64, 110], [100, 102], [100, 114], [130, 106], [146, 126], [78, 130]].map(([x, y]) => `<rect x="${x}" y="${y}" width="3" height="4"/>`).join("")}</g>
        ${[[30, 164, 0], [54, 162, 2], [82, 166, 4], [118, 164, 1], [146, 166, 3], [170, 162, 5]].map(([x, y, i]) => `<g transform="translate(${x} ${y}) scale(1.5)"><circle cx="0" cy="-17" r="5" fill="${SKIN[i]}"/><path d="M-7 0 Q-7 -11 0 -11 Q7 -11 7 0 Z" fill="${RAINBOW[i]}"/></g>`).join("")}
        ${[[42, 140], [100, 138], [158, 140]].map(([x, y]) => `<path d="M${x} ${y + 12} V${y - 12}" stroke="#6b4a2e" stroke-width="1.5"/>${RAINBOW.map((c, i) => `<rect x="${x}" y="${y - 12 + i * 2}" width="14" height="2" fill="${c}"/>`).join("")}`).join("")}`;
      const r = seeded(21);
      return sky(id, ["#3a0f4a", "#a02a78", "#ff7aa8"]) + `
        <defs><radialGradient id="${id}d" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#c9ccd6"/><stop offset="1" stop-color="#6a6d7a"/></radialGradient></defs>
        <g opacity=".35">${RAINBOW.map((c, i) => `<path d="M100 56 L${10 + i * 34} 200 L${34 + i * 34} 200 Z" fill="${c}"/>`).join("")}</g>
        <path d="M100 24 V42" stroke="#ccc" stroke-width="1"/>
        <circle cx="100" cy="54" r="13" fill="url(#${id}d)"/>
        <g stroke="#555a66" stroke-width=".6" opacity=".6"><path d="M87 54 H113 M89 48 H111 M89 60 H111 M100 41 V67 M93 42 Q89 54 93 66 M107 42 Q111 54 107 66"/></g>
        ${[[40, 60, "#e40303"], [56, 44, "#ffed00"], [150, 50, "#004dff"], [164, 70, "#ff8c00"], [30, 88, "#750787"], [172, 96, "#008026"]].map(([x, y, c]) => `<path d="M${x} ${y + 12} q-3 16 2 30" stroke="#fff" stroke-width=".7" fill="none" opacity=".7"/><ellipse cx="${x}" cy="${y}" rx="8" ry="10" fill="${c}"/><ellipse cx="${x - 2.5}" cy="${y - 3}" rx="2" ry="3" fill="#fff" opacity=".45"/>`).join("")}
        ${Array.from({ length: 40 }, () => `<rect x="${(24 + r() * 152).toFixed(1)}" y="${(30 + r() * 100).toFixed(1)}" width="3" height="1.6" fill="${RAINBOW[Math.floor(r() * 6)]}" transform="rotate(${Math.floor(r() * 180)} 100 100)"/>`).join("")}
        <path d="M34 128 H166 V146 H34 Z" fill="#fff"/>
        ${RAINBOW.map((c, i) => `<rect x="34" y="${128 + i * 3}" width="132" height="3" fill="${c}"/>`).join("")}
        <path d="M34 146 H166 V156 H34 Z" fill="#2a1a3a"/><path d="M150 128 V112 H172 L178 128 Z" fill="#e0457a"/><rect x="156" y="116" width="10" height="7" fill="#bfe6ff"/>
        ${[48, 76, 104, 132, 160].map(x => `<circle cx="${x}" cy="157" r="6" fill="#1a1a22"/><circle cx="${x}" cy="157" r="2.4" fill="#aaa"/>`).join("")}
        ${[[58, 128, 0, -1], [82, 128, 3, 1], [106, 128, 5, -1], [130, 128, 2, 1]].map(([x, y, i, s]) => `<g transform="translate(${x} ${y}) scale(1.3)"><circle cx="0" cy="-17" r="5" fill="${SKIN[i]}"/><path d="M-7 0 Q-7 -11 0 -11 Q7 -11 7 0 Z" fill="${RAINBOW[(i + 2) % 6]}"/><path d="M${s * 5} -8 l${s * 7} -12" stroke="${SKIN[i]}" stroke-width="2.4" stroke-linecap="round"/></g>`).join("")}
        <path d="M120 106 V84" stroke="#6b4a2e" stroke-width="1.5"/>${RAINBOW.map((c, i) => `<rect x="120" y="${84 + i * 2.4}" width="18" height="2.4" fill="${c}"/>`).join("")}`;
    }
  };

  /* ---------------- reform ---------------- */
  ART.reform = {
    rim: "#5f86ad", ink: "#1f3550",
    art: (id, t = 2) => {
      if (t === 1) return sky(id, ["#d6e6f3", "#f7f3ea"]) + `
        ${cloud(30, 56, 0.8, 0.9)}<circle cx="152" cy="52" r="10" fill="#ffd66b"/>
        ${ground(152, "#b9cfa0", "#a3bd88")}
        ${Array.from({ length: 6 }, (_, i) => `<rect x="${36 + i * 20}" y="${150 - (i + 1) * 12}" width="${130 - i * 20}" height="12" fill="${i % 2 ? '#c8c0b0' : '#d6cfc0'}" stroke="#8a8272" stroke-width=".8"/>`).join("")}
        ${[0, 1, 2, 3].map(i => `<g fill="#6b5a42" opacity=".75"><ellipse cx="${44 + i * 20}" cy="${145 - (i + 1) * 12 + 9}" rx="2.4" ry="1.3"/><ellipse cx="${50 + i * 20}" cy="${145 - (i + 1) * 12 + 11}" rx="2.4" ry="1.3"/></g>`).join("")}
        <path d="M150 78 V56" stroke="#6b4a2e" stroke-width="1.5"/><path d="M151 57 h14 l-3 4 l3 4 h-14 Z" fill="#5f86ad"/>`;
      if (t === 2) return sky(id, ["#9fc0e0", "#eef3f8"]) + `
        <g opacity=".35" stroke="#1f3550" stroke-width="2" fill="none"><path d="M100 40 V70 M68 46 H132"/><path d="M70 46 L60 66 H80 Z M130 46 L120 66 H140 Z"/></g>
        <path d="M20 128 H180 L170 150 H30 Z" fill="#8a5e36"/><path d="M20 128 H180" stroke="#a87448" stroke-width="3"/>
        <rect x="46" y="130" width="30" height="14" fill="#fbf7ee" transform="rotate(-6 60 136)"/><rect x="120" y="131" width="30" height="14" fill="#fbf7ee" transform="rotate(5 134 138)"/>
        <path d="M50 134 h20 M50 138 h16 M124 136 h20 M124 140 h16" stroke="#b7ab90" stroke-width="1"/>
        <path d="M24 124 L88 100" stroke="#3a64c8" stroke-width="18" stroke-linecap="round"/>
        <path d="M176 124 L112 100" stroke="#c8553a" stroke-width="18" stroke-linecap="round"/>
        <path d="M24 124 L40 118" stroke="#fff" stroke-width="18" opacity=".15"/>
        <ellipse cx="100" cy="98" rx="18" ry="12" fill="#e7b58c" stroke="#9a6a44" stroke-width="1.4"/>
        <path d="M88 92 q6 4 12 2 M92 100 q8 3 16 -1 M96 106 q6 1 10 -2" stroke="#9a6a44" stroke-width="1.2" fill="none"/>
        <path d="M104 88 q8 -2 12 4" stroke="#9a6a44" stroke-width="1.2" fill="none"/>
        ${[[72, 70], [128, 70], [100, 58]].map(([x, y]) => `<path d="${star(x, y, 4, 1.6)}" fill="#ffd35a"/>`).join("")}`;
      return sky(id, ["#b8cbe0", "#e8e3d8"]) + `
        <defs><linearGradient id="${id}q" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="36"><stop offset="0" stop-color="#2f7fe0"/><stop offset=".5" stop-color="#9a6aa8"/><stop offset="1" stop-color="#e23a26"/></linearGradient>
        <linearGradient id="${id}v" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#eef4fa" stop-opacity=".7"/><stop offset="1" stop-color="#c9d6e2" stop-opacity=".9"/></linearGradient></defs>
        <circle cx="160" cy="56" r="11" fill="#ffd66b"/>${cloud(142, 64, 0.9, 0.9)}${cloud(34, 70, 0.8, 0.85)}
        <rect x="84" y="38" width="4.5" height="38" rx="2" fill="url(#${id}q)" stroke="#5a6a7a" stroke-width=".8"/>
        <path d="M94.5 36 V72 a5.5 5.5 0 0 0 11 0 V36 a5.5 5.5 0 0 0 -11 0 Z" fill="url(#${id}v)" stroke="#5a6a7a" stroke-width="1.3"/>
        <circle cx="100" cy="77.5" r="6.8" fill="url(#${id}q)" stroke="#5a6a7a" stroke-width="1.3"/>
        <rect x="96.8" y="56" width="6.4" height="20" fill="url(#${id}q)"/>
        <path d="M96.8 56 h6.4" stroke="#5a3a6a" stroke-width="1.4"/>
        ${[38, 42.5, 47, 51.5, 56, 60.5, 65, 69.5, 74].map((y, i) => `<path d="M106 ${y} h${i % 2 ? 3 : 6}" stroke="#34404c" stroke-width="${i === 4 ? 1.8 : 1}"/>`).join("")}
        <path d="M90.5 56 h3" stroke="#34404c" stroke-width="1.8"/>
        <path d="M96.6 39 V54" stroke="#fff" stroke-width="1.3" opacity=".9" stroke-linecap="round"/>
        <circle cx="97.4" cy="75.5" r="1.8" fill="#fff" opacity=".7"/>
        <path d="M0 150 H200 V200 H0 Z" fill="#b9a67f"/><path d="M0 150 H200" stroke="#9a8866" stroke-width="2"/>
        ${[[48, "#d0543a", "#8a2a1a", "#e87a5a"], [110, "#3a6ad0", "#1f3a8a", "#6a92e8"]].map(([x0, c, dk, lt]) => `
          <path d="M${x0 + 10} 112 V144 M${x0 + 42} 112 V144" stroke="${dk}" stroke-width="3.2" stroke-linecap="round"/>
          <path d="M${x0 + 8} 110 V84 M${x0 + 44} 110 V84" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/>
          <rect x="${x0 + 6}" y="83" width="40" height="6" rx="2" fill="${c}" stroke="${dk}" stroke-width=".8"/>
          <path d="M${x0 + 8} 104 H${x0 + 44}" stroke="${c}" stroke-width="2.6"/>
          ${[17, 26, 35].map(dx => `<path d="M${x0 + dx} 89 V104" stroke="${c}" stroke-width="2.6"/>`).join("")}
          <path d="M${x0} 116 H${x0 + 36} L${x0 + 44} 110 H${x0 + 8} Z" fill="${lt}" stroke="${dk}" stroke-width="1"/>
          <rect x="${x0}" y="116" width="36" height="4" fill="${c}" stroke="${dk}" stroke-width=".8"/>
          <path d="M${x0 + 2.5} 120 V150 M${x0 + 33.5} 120 V150" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/>`).join("")}
        <g>
          <path d="M88 124 L86 146 M112 124 L114 146" stroke="#5a6a7a" stroke-width="6" stroke-linecap="round"/>
          <path d="M80 147 h10 M110 147 h10" stroke="#2a2a2a" stroke-width="4" stroke-linecap="round"/>
          <path d="M80 112 H120 Q121 122 112 124 Q100 130 88 124 Q79 122 80 112 Z" fill="#7a8a9a" stroke="#4a5a6a" stroke-width="1"/>
          <path d="M91 114 L90 97 H110 L109 114 Z" fill="#e2d9c6" stroke="#8a8272" stroke-width="1"/>
          <circle cx="100" cy="91" r="6.5" fill="#e7b58c"/><path d="M96 90.5 h2.5 M101.5 90.5 h2.5 M97 94.5 h6" stroke="#5a3a22" stroke-width="1.1"/>
          <path d="M91 100 L80 110" stroke="#e2d9c6" stroke-width="3.6" stroke-linecap="round"/>
          <path d="M109 100 L118 106" stroke="#e2d9c6" stroke-width="3.6" stroke-linecap="round"/></g>
        <g transform="translate(123 101) scale(.72)"><path d="M-6 0 H6 L5 11 Q0 13 -5 11 Z" fill="#fbf7ee" stroke="#6a6252" stroke-width="1"/><ellipse cx="0" cy="0" rx="6" ry="1.8" fill="#a8744a" stroke="#6a6252" stroke-width=".8"/>
          <path d="M6 3 q5 0 5 3.5 q0 3.5 -5 3.5" fill="none" stroke="#6a6252" stroke-width="1.4"/><path d="M-4 5 h8" stroke="#c9302c" stroke-width="1.2" opacity=".6"/>
          <g stroke="#8a95a2" stroke-width=".9" fill="none" opacity=".28" stroke-linecap="round"><path d="M-2 -3 q-2.5 -3 0 -6 q2.5 -3 0 -6"/><path d="M2 -3 q2.5 -3 0 -6 q-2.5 -3 0 -5"/></g></g>`;
    }
  };

  /* ---------------- revolution ---------------- */
  ART.barricade = {
    rim: "#a1273f", ink: "#45091c",
    art: (id, t = 2) => {
      const cap = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-9 0 Q-10 -14 2 -16 Q12 -16 12 -6 Q14 -2 10 2 Q8 -6 4 -6 L9 0 Z" fill="#d22a2a" stroke="#6a0a0a" stroke-width="1"/><path d="M-9 0 H9" stroke="#fff" stroke-width="2"/><circle cx="-2" cy="-5" r="1.8" fill="#fff"/></g>`;
      if (t === 1) return sky(id, ["#f6d7c0", "#fff4e2"]) + `
        <circle cx="100" cy="150" r="30" fill="#ffc57a" opacity=".6"/>
        ${ground(150, "#c8b89a", "#b3a484")}
        <g transform="translate(100 104)">
          <rect x="-26" y="-44" width="52" height="7" rx="2" fill="#8a5e36"/><rect x="-26" y="37" width="52" height="7" rx="2" fill="#8a5e36"/>
          <path d="M-22 -37 V37 M22 -37 V37" stroke="#8a5e36" stroke-width="3"/>
          <path d="M-18 -37 H18 Q18 -8 2 0 Q18 8 18 37 H-18 Q-18 8 -2 0 Q-18 -8 -18 -37 Z" fill="#dff0fa" fill-opacity=".7" stroke="#8aa8c0" stroke-width="1.4"/>
          <path d="M-8 -26 H8 Q6 -16 0 -8 Q-6 -16 -8 -26 Z" fill="#e8b85a"/><path d="M0 -6 V30" stroke="#e8b85a" stroke-width="1.2" stroke-dasharray="2 2"/>
          <path d="M-16 37 Q0 18 16 37 Z" fill="#e8b85a"/></g>
        <g transform="translate(152 150)"><path d="M-8 0 h14 q4 0 4 -4 v-2 h-18 Z" fill="#3a2a22"/><path d="M-2 -6 v-12" stroke="#3a2a22" stroke-width="5" stroke-linecap="round"/></g>
        <path d="M140 132 l-4 -4 M144 128 l-2 -6" stroke="#6a5a4a" stroke-width="1.2"/>`;
      if (t === 2) return sky(id, ["#5a2a4a", "#e06a3a", "#ffc36a"]) + `
        <circle cx="100" cy="132" r="26" fill="#ffe38a"/>
        <g opacity=".4" fill="#fff">${Array.from({ length: 10 }, (_, i) => { const a = Math.PI + i * Math.PI / 9; return `<path d="M100 132 L${100 + 120 * Math.cos(a)} ${132 + 120 * Math.sin(a)} L${100 + 120 * Math.cos(a + 0.08)} ${132 + 120 * Math.sin(a + 0.08)} Z"/>`; }).join("")}</g>
        <path d="M0 140 Q60 110 110 128 T200 122 V200 H0 Z" fill="#6a2a34"/>
        <path d="M112 128 V46" stroke="#4a2a1a" stroke-width="3"/>
        <path d="M113 50 C130 44 142 58 166 50 V84 C142 92 130 78 113 84 Z" fill="#d22a2a"/>
        <path d="M113 50 C130 44 142 58 166 50" stroke="#ff7a6a" stroke-width="1.5" fill="none"/>
        ${cap(112, 44, 0.9)}
        <g>${Array.from({ length: 22 }, (_, i) => { const row = Math.floor(i / 8), x = 12 + (i % 8) * 24 + (row % 2) * 12, y = 146 + row * 10; return `<rect x="${x}" y="${y}" width="21" height="9" rx="3" fill="${['#6a6a72', '#7a7a82', '#5a5a62'][i % 3]}" stroke="#3a3a42" stroke-width=".8"/>`; }).join("")}</g>
        ${person(66, 146, 1.4, "#2a0a14")}${person(86, 148, 1.3, "#2a0a14")}<path d="M72 132 l6 -12" stroke="#2a0a14" stroke-width="2.6" stroke-linecap="round"/>`;
      return sky(id, ["#2a1a22", "#8a3a2a", "#f0a050"]) + `
        <g fill="#5a4a4a" opacity=".75">${[[40, 56, 18], [60, 44, 16], [150, 50, 20], [170, 70, 14], [120, 36, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>
        <g fill="#8a7070" opacity=".6">${[[48, 70, 12], [158, 64, 13], [132, 48, 10]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>
        <circle cx="100" cy="120" r="50" fill="#ffb35a" opacity=".25"/>
        <path d="M0 160 H200 V200 H0 Z" fill="#2a1a1a"/>
        <path d="M14 160 L40 124 L62 132 L84 110 L118 112 L140 128 L164 120 L188 160 Z" fill="#3a2a2a"/>
        ${Array.from({ length: 30 }, (_, i) => { const r = seeded(i + 3); const x = 22 + r() * 156, y = 128 + r() * 30; return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="11" height="7" rx="2" fill="${['#6a6a72', '#7e7e86', '#5a5a62'][i % 3]}" stroke="#2a2a32" stroke-width=".6"/>`; }).join("")}
        <g transform="translate(56 124) rotate(-24)"><rect x="-20" y="-8" width="40" height="12" fill="#7a4a2a" stroke="#3a2010"/><circle cx="-12" cy="10" r="10" fill="none" stroke="#5a3a1a" stroke-width="3"/>${[0, 45, 90, 135].map(a => `<path d="M-22 10 H-2" stroke="#5a3a1a" stroke-width="1.5" transform="rotate(${a} -12 10)"/>`).join("")}</g>
        <g transform="translate(146 128) rotate(18)"><rect x="-10" y="-14" width="20" height="4" fill="#8a5e36"/><path d="M-8 -10 v16 M8 -10 v16 M-8 -16 v-12 M8 -16 v-12 M-8 -24 h16" stroke="#8a5e36" stroke-width="2.4"/></g>
        <g transform="translate(118 110)"><rect x="-8" y="-2" width="16" height="20" rx="3" fill="#6a4a3a"/><path d="M-8 4 h16 M-8 12 h16" stroke="#3a2a1a" stroke-width="1.5"/></g>
        <path d="M100 110 V36" stroke="#3a2010" stroke-width="3"/>
        <path d="M101 38 C118 30 130 46 158 36 V70 C130 80 118 64 101 72 Z" fill="#d22a2a"/>
        <path d="M101 38 C118 30 130 46 158 36" stroke="#ff7a6a" stroke-width="1.5" fill="none"/>
        <g fill="#140608">
          <circle cx="90" cy="84" r="5"/><path d="M82 110 Q82 90 90 90 Q98 90 98 110 Z"/><path d="M96 94 L101 76" stroke="#140608" stroke-width="3" stroke-linecap="round"/><path d="M84 94 L74 86" stroke="#140608" stroke-width="3" stroke-linecap="round"/></g>
        ${cap(90, 80, 0.7)}
        ${[[40, 126, 1.3], [68, 124, 1.2], [140, 126, 1.2], [168, 130, 1.3]].map(([x, y, s]) => person(x, y, s, "#140608")).join("")}
        ${[[40, 104, -1], [140, 104, 1], [168, 108, -1]].map(([x, y, s]) => `<path d="M${x} ${y + 4} l${s * 4} -10" stroke="#140608" stroke-width="2.6" stroke-linecap="round"/>`).join("")}
        ${[[30, 150], [176, 148], [120, 150]].map(([x, y]) => `<path d="M${x - 5} ${y} C${x - 7} ${y - 8} ${x} ${y - 10} ${x - 1} ${y - 18} C${x + 6} ${y - 10} ${x + 7} ${y - 6} ${x + 5} ${y} Z" fill="#ff9a2a"/><path d="M${x - 2} ${y} q-1 -5 1 -8 q3 4 2 8 Z" fill="#ffe27a"/>`).join("")}`;
    }
  };

  /* ---------------- ecology ---------------- */
  ART.forest = {
    rim: "#2e7d4f", ink: "#0f3a22",
    art: (id, t = 2) => {
      const oak = (x, base, k, c1 = "#3f8a3a", c2 = "#5da84a") => `<g transform="translate(${x} ${base}) scale(${k})"><path d="M-5 0 L-3 -30 Q-12 -40 -16 -44 M3 -30 L5 0 M-3 -30 H3" fill="#6b4a2e"/><rect x="-4" y="-34" width="8" height="34" fill="#6b4a2e"/>
        <circle cx="0" cy="-48" r="20" fill="${c1}"/><circle cx="-16" cy="-38" r="14" fill="${c1}"/><circle cx="16" cy="-38" r="14" fill="${c1}"/><circle cx="-6" cy="-54" r="11" fill="${c2}"/><circle cx="10" cy="-46" r="9" fill="${c2}"/></g>`;
      const pine = (x, base, h, c = "#2f6a3a") => `<rect x="${x - 1.5}" y="${base - 8}" width="3" height="8" fill="#5a3b1c"/><path d="M${x} ${base - h} L${x + h * 0.32} ${base - 6} H${x - h * 0.32} Z" fill="${c}"/>`;
      if (t === 1) return sky(id, ["#dff3e6", "#fbf8ea"]) + `
        <circle cx="150" cy="54" r="10" fill="#ffd66b"/>
        <path d="M0 150 H200 V200 H0 Z" fill="#c8b89a"/><path d="M0 150 H200" stroke="#a8987a" stroke-width="2"/>
        <path d="M80 150 L74 116 H126 L120 150 Z" fill="#c8693a"/><rect x="72" y="110" width="56" height="8" rx="2" fill="#b0582e"/>
        <path d="M100 112 V86" stroke="#4f8a2e" stroke-width="3"/>
        <path d="M100 96 C88 92 82 82 84 74 C94 76 100 84 100 96 Z" fill="#6fb24a"/><path d="M100 90 C112 86 118 76 116 68 C106 70 100 78 100 90 Z" fill="#7fc25a"/>
        <g transform="translate(142 70) rotate(-24)"><path d="M-16 0 H14 V20 Q0 26 -16 20 Z" fill="#5f9ec8" stroke="#2d6f8e" stroke-width="1.4"/><path d="M14 4 L36 -8 L38 -4 L16 10" fill="#5f9ec8" stroke="#2d6f8e" stroke-width="1.2"/><path d="M-16 4 Q-26 10 -16 18" fill="none" stroke="#2d6f8e" stroke-width="2.4"/></g>
        ${[[116, 76], [112, 84], [120, 88], [108, 92], [116, 96]].map(([x, y]) => `<path d="M${x} ${y} q-1.6 3 0 4 q1.6 -1 0 -4" fill="#8ec8f0"/>`).join("")}`;
      if (t === 2) return sky(id, ["#9fd6f0", "#e8f6e0"]) + `
        <circle cx="152" cy="52" r="12" fill="#ffe27a"/>${cloud(40, 50, 0.8, 0.8)}
        <path d="M0 116 Q50 100 100 112 T200 108 V200 H0 Z" fill="#8cc68a"/>
        ${pine(30, 120, 34)}${pine(48, 116, 40, "#3a7a44")}${pine(160, 118, 38)}${pine(178, 122, 30, "#3a7a44")}
        <path d="M0 132 Q60 122 120 132 T200 128 V200 H0 Z" fill="#5da35c"/>
        ${oak(100, 140, 1.25)}
        <path d="M0 154 C40 142 80 160 120 148 S180 140 200 146 V160 H0 Z" fill="#6fb0e0"/><path d="M20 152 q10 -3 20 0 M90 152 q10 -3 20 0 M150 146 q8 -2 16 0" stroke="#fff" stroke-width="1.2" fill="none" opacity=".7"/>
        ${[[60, 60], [70, 66], [132, 72]].map(([x, y]) => `<path d="M${x - 5} ${y} q2.5 -3 5 0 q2.5 -3 5 0" stroke="#2a3a2a" stroke-width="1.3" fill="none"/>`).join("")}
        <g transform="translate(138 132)"><ellipse cx="0" cy="0" rx="6" ry="4" fill="#b5462f"/><circle cx="5" cy="-3" r="2.6" fill="#b5462f"/><path d="M-6 0 l-6 -4 l1 6 Z" fill="#b5462f"/></g>`;
      return sky(id, ["#f7a86a", "#ffd9a0", "#e8f0d0"]) + `
        <circle cx="160" cy="64" r="14" fill="#ffe8a0"/>
        ${pine(22, 140, 44)}${pine(40, 136, 52, "#3a7a44")}${pine(182, 140, 46)}
        <path d="M0 140 Q60 128 120 138 T200 134 V200 H0 Z" fill="#6a9a4a"/>
        <g transform="translate(102 150)">
          <rect x="-9" y="-70" width="18" height="70" fill="#6b4a2e"/><path d="M-9 -40 L-40 -58 M9 -50 L38 -66" stroke="#6b4a2e" stroke-width="6" stroke-linecap="round"/>
          <circle cx="0" cy="-92" r="30" fill="#3f8a3a"/><circle cx="-30" cy="-72" r="20" fill="#3f8a3a"/><circle cx="32" cy="-78" r="20" fill="#3f8a3a"/><circle cx="-10" cy="-104" r="16" fill="#5da84a"/><circle cx="18" cy="-96" r="14" fill="#5da84a"/>
          <rect x="-20" y="-68" width="32" height="20" fill="#a8743a" stroke="#5a3a1a" stroke-width="1.2"/><path d="M-24 -68 L-4 -82 L16 -68 Z" fill="#8a5a2a" stroke="#5a3a1a" stroke-width="1.2"/>
          <rect x="-14" y="-62" width="8" height="7" fill="#ffd35a"/><path d="M-20 -58 h32 M-20 -52 h32" stroke="#6a4a22" stroke-width=".8"/>
          <path d="M6 -48 V-4 M14 -48 V-4" stroke="#c8a46a" stroke-width="1.2"/>${[-40, -32, -24, -16, -8].map(y => `<path d="M6 ${y} H14" stroke="#c8a46a" stroke-width="1.4"/>`).join("")}
          <path d="M-40 -58 Q-54 -44 -62 -52" stroke="#c8a46a" stroke-width="1" fill="none"/>
          <path d="M-9 -20 q-6 2 -8 8" stroke="#c9302c" stroke-width="3" stroke-linecap="round" fill="none"/>
          <g transform="translate(-14 -2) scale(1.3)"><circle cx="0" cy="-17" r="5" fill="#d9a47a"/><path d="M-7 0 Q-7 -11 0 -11 Q7 -11 7 0 Z" fill="#6a8a3a"/><path d="M4 -10 l6 -2" stroke="#d9a47a" stroke-width="2.4" stroke-linecap="round"/></g></g>
        <path d="M44 104 Q60 116 76 102" fill="#e0a526" stroke="#8a5a1a" stroke-width="1" opacity=".95"/>
        <path d="M44 104 V124 M76 102 V122" stroke="#6b4a2e" stroke-width="1"/>
        ${[[16, 108, "#e0457a"], [150, 104, "#fff"]].map(([x, y, c], i) => `<path d="M${x} ${y} h24 v14 h-24 Z" fill="${c}" stroke="#5a3a1a" stroke-width=".8" transform="rotate(${i ? 6 : -6} ${x + 12} ${y + 7})"/><path d="M${x + 6} ${y + 5} q6 -4 12 0 q-6 4 -12 0" fill="#3f8a3a" transform="rotate(${i ? 6 : -6} ${x + 12} ${y + 7})"/>`).join("")}
        <g transform="translate(158 152)"><path d="M-18 0 L0 -26 L18 0 Z" fill="#c9a04a" stroke="#6a4a1a" stroke-width="1.2"/><path d="M0 -26 L-4 0 H4 Z" fill="#3a2a1a"/>${[[-12, -6, "#e0457a"], [8, -10, "#2f9b8f"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${c}"/>`).join("")}</g>
        <g transform="translate(54 154)"><path d="M-8 0 L8 -4 M-8 -4 L8 0" stroke="#6b4a2e" stroke-width="2.4"/><path d="M-5 -3 C-6 -12 0 -14 -1 -20 C4 -14 6 -10 5 -3 Z" fill="#ff9a2a"/><path d="M-2 -3 q-1 -4 1 -7 q2 3 1 7 Z" fill="#ffe27a"/></g>`;
    }
  };

  /* ---------------- defence ---------------- */
  ART.defence = {
    rim: "#6a7a3a", ink: "#262e12",
    art: (id, t = 2) => {
      const helmet = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-20 0 Q-20 -24 0 -24 Q20 -24 20 0 Z" fill="#5a6b3a"/><path d="M-24 0 H24 V3 H-24 Z" fill="#4a5a2e"/><path d="M-14 -10 q4 -8 12 -10" stroke="#8a9a5a" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M-10 -16 h4 M2 -8 h5 M8 -18 h3" stroke="#3a4a1e" stroke-width="1.4"/></g>`;
      if (t === 1) return sky(id, ["#d8e6f0", "#f6f2e2"]) + `
        ${cloud(30, 60, 0.8, 0.9)}<circle cx="152" cy="54" r="10" fill="#ffe27a"/>
        ${ground(150, "#a9c07a", "#93ad62")}
        <rect x="60" y="116" width="60" height="36" fill="#b08a54" stroke="#6a4a22" stroke-width="1.4"/>
        <path d="M60 128 H120 M60 140 H120 M72 116 V152 M108 116 V152" stroke="#8a6a3a" stroke-width="1.2"/>
        ${helmet(90, 116, 1)}
        <g transform="translate(142 152)"><path d="M-12 0 V-22 H0 V-8 H10 Q14 -8 14 -3 V0 Z" fill="#2a2a22"/><path d="M4 0 V-22 H16 V-8 H26 Q30 -8 30 -3 V0 Z" fill="#3a3a30"/><path d="M-12 -18 H0 M4 -18 H16" stroke="#6a6a5a" stroke-width="1"/></g>`;
      if (t === 2) return `<rect width="200" height="200" fill="#e8dcc0"/>
        <rect x="0" y="0" width="200" height="110" fill="#d8c8a4"/>${[20, 60, 100, 140, 180].map(x => `<path d="M${x} 0 V110" stroke="#cbb994" stroke-width="10"/>`).join("")}
        <rect x="120" y="36" width="44" height="32" fill="#f4ecd8" stroke="#8a6a3a" stroke-width="3"/><path d="M126 62 L136 48 L144 56 L152 44 L158 62 Z" fill="#8aa06a"/>
        <path d="M0 110 H200 V200 H0 Z" fill="#9a6a44"/>
        <path d="M24 146 L50 104 H170 L184 146 Z" fill="#6b4a2e"/>
        <path d="M34 140 L56 108 H164 L174 140 Z" fill="#cfe0b0" stroke="#5a6b3a" stroke-width="1"/>
        <path d="M60 112 C90 110 96 126 120 118 C140 112 150 124 166 120 L172 140 H40 Z" fill="#a8c888"/>
        <path d="M34 140 L56 108 H90 C80 118 70 124 62 140 Z" fill="#8ec0e0"/>
        <path d="M74 132 C90 118 110 122 124 114" stroke="#c0392b" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M124 114 l-8 -1 l4 7 Z" fill="#c0392b"/>
        <path d="M150 134 C140 126 132 132 120 128" stroke="#2d5ab0" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M120 128 l7 -4 l0 8 Z" fill="#2d5ab0"/>
        ${[[98, 124, "#c0392b"], [108, 130, "#c0392b"], [146, 122, "#2d5ab0"], [158, 128, "#2d5ab0"]].map(([x, y, c]) => `<path d="M${x} ${y} v-8" stroke="#333" stroke-width="1"/><path d="M${x} ${y - 8} h6 l-2 2 l2 2 h-6 Z" fill="${c}"/>`).join("")}
        <g transform="translate(58 130)"><path d="M-5 0 H5 L4 -10 H-4 Z" fill="#fff" stroke="#8a8272"/><path d="M5 -8 q4 0 4 3 q0 3 -4 3" fill="none" stroke="#8a8272"/><path d="M0 -12 q-3 -4 0 -8" stroke="#bbb" stroke-width="1.2" fill="none"/></g>
        <g transform="translate(24 150)"><path d="M-10 0 V-40 Q-10 -48 0 -48 H20 V0 Z" fill="#8a2a2a"/><path d="M-14 0 V-24 H30 V0" fill="#a83a3a"/><rect x="-16" y="-28" width="8" height="28" rx="3" fill="#7a2020"/></g>
        ${[[132, 136], [140, 138]].map(([x, y]) => `<g transform="translate(${x} ${y})"><circle cx="0" cy="-8" r="2" fill="#4a5a2e"/><rect x="-2" y="-6" width="4" height="6" fill="#4a5a2e"/></g>`).join("")}`;
      return sky(id, ["#6a8ab0", "#d0a870", "#f0d8a0"]) + `
        ${[[50, 56, 14, "#ffcf4a"], [150, 72, 11, "#ff8a3a"], [120, 40, 8, "#ffe27a"]].map(([x, y, r, c]) => `<path d="${star(x, y, r, r * 0.45, 8)}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="#fff6c0"/>`).join("")}
        <path d="M20 96 Q80 70 170 40" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/><path d="M30 108 Q90 84 178 60" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>
        ${[[170, 40, -18], [178, 60, -15]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-14 0 L10 -2 L14 0 L10 2 Z" fill="#6a7a8a"/><path d="M-2 0 L-8 -9 L-4 -9 L4 0 L-4 9 L-8 9 Z" fill="#5a6a7a"/><path d="M-14 0 L-18 -5 L-14 -4 Z" fill="#5a6a7a"/></g>`).join("")}
        <path d="M0 140 Q100 128 200 140 V200 H0 Z" fill="#8a7a4a"/>
        <g transform="translate(104 142)">
          <rect x="-40" y="-6" width="80" height="14" rx="7" fill="#3a4222"/>${[-32, -16, 0, 16, 32].map(x => `<circle cx="${x}" cy="1" r="4.6" fill="#22280f"/><circle cx="${x}" cy="1" r="1.6" fill="#6a6a5a"/>`).join("")}
          <path d="M-36 -6 L-28 -18 H30 L38 -6 Z" fill="#5a6b3a"/><path d="M-12 -18 Q-6 -32 10 -32 Q20 -30 22 -18 Z" fill="#4e5e30"/>
          <rect x="16" y="-30" width="40" height="5" fill="#4e5e30" transform="rotate(-14 16 -28)"/>
          ${[[64, -48, 9], [72, -52, 6], [58, -54, 6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".85"/>`).join("")}<path d="${star(60, -44, 7, 3, 7)}" fill="#ffb13a"/>
          <path d="M0 -32 V-58" stroke="#5a3a1a" stroke-width="1.6"/><path d="M1 -58 h18 l-4 5 l4 5 h-18 Z" fill="#c0392b"/>
          <g transform="translate(-4 -34) scale(1.1)"><circle cx="0" cy="-10" r="4.5" fill="#e7b58c"/><path d="M-5 -12 Q0 -18 5 -12 Z" fill="#4a5a2e"/><path d="M-6 0 Q-6 -6 0 -6 Q6 -6 6 0 Z" fill="#5a6b3a"/><path d="M-5 -4 L-12 -12" stroke="#e7b58c" stroke-width="2.4" stroke-linecap="round"/></g></g>
        <g transform="translate(22 104) rotate(-18)"><path d="M0 -3 H26 L40 -12 V12 L26 3 H0 Z" fill="#e3b33a" stroke="#a8761a" stroke-width="1"/><path d="M8 3 Q10 14 20 14 H24" stroke="#e3b33a" stroke-width="2.4" fill="none"/><ellipse cx="40" cy="0" rx="3" ry="12" fill="#c8961a"/><path d="M46 -8 q6 8 0 16 M52 -12 q9 12 0 24" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></g>
        ${[[40, 146, "#2d5ab0"], [168, 146, "#c0392b"]].map(([x, y, c]) => `<path d="M${x} ${y} V${y - 26}" stroke="#5a3a1a" stroke-width="1.4"/><path d="M${x + 1} ${y - 26} h14 v9 h-14 Z" fill="${c}"/>`).join("")}`;
    }
  };
})();
