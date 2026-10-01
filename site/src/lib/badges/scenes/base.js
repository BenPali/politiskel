/* The first scenes: the ones drawn with the sheet, and their levels. */
import { star, person, cloud, blade, turbine, sky, starfield, tower } from '../draw.js';

export const ART = {
  atom: {
    rim: "#e0a526", ink: "#7a5200",
    art: id => `
      <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a4f7a"/><stop offset=".6" stop-color="#e98f5f"/><stop offset="1" stop-color="#ffd59a"/></linearGradient>
      <radialGradient id="${id}g"><stop offset="0" stop-color="#fff7c2"/><stop offset=".4" stop-color="#ffe066" stop-opacity=".8"/><stop offset="1" stop-color="#ffe066" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}t" x1="0" x2="1"><stop offset="0" stop-color="#9aa4ad"/><stop offset=".45" stop-color="#e7ebee"/><stop offset="1" stop-color="#7d8790"/></linearGradient></defs>
      <rect x="0" y="0" width="200" height="200" fill="url(#${id}s)"/>
      <circle cx="128" cy="68" r="30" fill="url(#${id}g)"/>
      <g fill="none" stroke="#fff4c4" stroke-width="2">
        <ellipse cx="128" cy="68" rx="24" ry="8"/><ellipse cx="128" cy="68" rx="24" ry="8" transform="rotate(60 128 68)"/><ellipse cx="128" cy="68" rx="24" ry="8" transform="rotate(-60 128 68)"/></g>
      <circle cx="128" cy="68" r="4.5" fill="#fff"/>
      <circle cx="152" cy="68" r="2.4" fill="#fff"/><circle cx="116" cy="47.2" r="2.4" fill="#fff"/><circle cx="116" cy="88.8" r="2.4" fill="#fff"/>
      <g opacity=".95">${cloud(52, 86, 1.1)}${cloud(40, 76, 0.8, 0.8)}${cloud(84, 94, 0.9, 0.85)}</g>
      <path d="M48 160 Q58 125 50 98 L78 98 Q70 125 80 160 Z" fill="url(#${id}t)"/>
      <path d="M50 98 L78 98 L77 102 L51 102 Z" fill="#6b747c"/>
      <path d="M84 160 Q92 132 86 110 L106 110 Q100 132 108 160 Z" fill="url(#${id}t)"/>
      <path d="M86 110 L106 110 L105.5 113 L86.5 113 Z" fill="#6b747c"/>
      <rect x="112" y="136" width="44" height="24" fill="#c9d0d6"/><path d="M112 136 L134 124 L156 136 Z" fill="#aeb7bf"/>
      <g fill="#ffe9a8">${[0,1,2,3].map(i => `<rect x="${116 + i * 10}" y="143" width="5" height="6"/>`).join("")}</g>
      <path d="M0 158 Q60 150 100 156 T200 154 V200 H0 Z" fill="#4f6b3e"/>
      <path d="M0 168 Q50 162 110 168 T200 166 V200 H0 Z" fill="#3c5530"/>`
  },
  snail: {
    rim: "#6f9a3c", ink: "#35521a",
    art: id => `
      <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe9f5"/><stop offset="1" stop-color="#f6f1d8"/></linearGradient>
      <radialGradient id="${id}sh" cx=".4" cy=".35"><stop offset="0" stop-color="#f7c982"/><stop offset=".7" stop-color="#c8793a"/><stop offset="1" stop-color="#8d4d1f"/></radialGradient></defs>
      <rect width="200" height="200" fill="url(#${id}s)"/>
      <circle cx="150" cy="58" r="12" fill="#ffd66b"/>
      <path d="M0 140 Q40 128 90 136 T200 132 V200 H0 Z" fill="#9cc56a"/>
      <path d="M30 172 C60 120 130 110 176 142 C140 150 90 176 30 172 Z" fill="#5d9a3a"/>
      <path d="M36 170 C80 150 120 140 172 143" stroke="#3f7424" stroke-width="2" fill="none"/>
      ${[0,1,2,3,4].map(i => `<path d="M${60 + i * 22} ${160 - i * 4.5} q6 -8 14 -10" stroke="#3f7424" stroke-width="1.4" fill="none"/>`).join("")}
      <path d="M48 150 C60 146 120 146 140 150 C150 138 154 124 150 118 L144 118 C142 132 132 140 120 140 L60 142 C52 142 46 146 48 150 Z" fill="#c7b89a"/>
      <path d="M140 124 L150 100 M146 124 L160 104" stroke="#a89878" stroke-width="3" stroke-linecap="round"/>
      <circle cx="150" cy="99" r="3" fill="#3a3024"/><circle cx="160.5" cy="103" r="3" fill="#3a3024"/>
      <circle cx="96" cy="112" r="30" fill="url(#${id}sh)"/>
      <path d="M96 112 m-2 0 a4 4 0 1 1 6 3 a9 9 0 1 1 -14 -8 a15 15 0 1 1 20 20 a22 22 0 1 1 -30 -26" fill="none" stroke="#6b3a14" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M36 152 h-12 M20 152 h-6" stroke="#bfe0f0" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="3 5" opacity=".9"/>
      <g transform="translate(104 64) rotate(12)"><rect x="-10" y="-4" width="20" height="16" fill="#f4efe2" stroke="#6b3a14" stroke-width="1.2"/><path d="M-13 -4 L0 -14 L13 -4 Z" fill="#b5462f"/><rect x="-3" y="4" width="6" height="8" fill="#6b3a14"/></g>`
  },
  turbines: {
    rim: "#2f9b8f", ink: "#0f4c46",
    art: id => `
      <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ec3e8"/><stop offset="1" stop-color="#d9f1fb"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#${id}s)"/>
      <circle cx="58" cy="60" r="13" fill="#fff3b0"/>${cloud(120, 58, 1.1)}${cloud(150, 80, 0.7, 0.8)}
      <path d="M0 132 Q50 108 100 124 T200 116 V200 H0 Z" fill="#8cc68a"/>
      ${turbine(72, 128, 52, 20, 1.1)}${turbine(122, 124, 40, 75, 0.9)}${turbine(154, 120, 28, 40, 0.7)}
      <path d="M0 152 Q60 132 120 148 T200 142 V200 H0 Z" fill="#5da35c"/>
      <path d="M0 172 Q70 158 140 170 T200 168 V200 H0 Z" fill="#3f8342"/>
      <g stroke="#2f6b33" stroke-width="1.5">${[40, 52, 64, 76, 88].map(x => `<path d="M${x} 176 v-6 M${x - 2} 172 l2 -2 l2 2"/>`).join("")}</g>`
  },
  dove: {
    rim: "#5b8fd6", ink: "#1d3f73",
    art: id => `
      <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fcaf5"/><stop offset="1" stop-color="#eef6ff"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#${id}s)"/>
      ${cloud(40, 70, 1)}${cloud(140, 140, 1.2, 0.9)}
      <path d="M58 104 C70 88 92 86 106 94 C114 70 132 54 160 50 C146 66 142 80 138 92 C150 90 158 94 164 100 C150 102 140 108 132 116 C122 128 100 132 86 126 L66 136 L72 122 C64 118 58 112 58 104 Z" fill="#fff" stroke="#b9cde3" stroke-width="1.2"/>
      <path d="M106 94 C114 84 124 78 134 76 M112 100 C122 92 134 88 146 86" stroke="#c7d7ea" stroke-width="1.4" fill="none"/>
      <circle cx="72" cy="101" r="1.8" fill="#223"/>
      <path d="M58 104 L50 106 L58 108 Z" fill="#f0a64a"/>
      <path d="M50 107 C42 112 36 120 34 128" stroke="#5c7a2e" stroke-width="1.8" fill="none"/>
      ${[[46,110,-30],[41,116,20],[38,122,-40],[36,127,15]].map(([x,y,r]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="2.2" fill="#78a03a" transform="rotate(${r} ${x} ${y})"/>`).join("")}
      <g transform="rotate(-18 100 162)"><rect x="46" y="158" width="46" height="7" rx="2" fill="#6b4a2e"/><rect x="92" y="159" width="20" height="4" fill="#555"/></g>
      <g transform="rotate(22 132 170)"><rect x="118" y="167" width="28" height="4" fill="#555"/><rect x="146" y="165" width="10" height="7" rx="1" fill="#6b4a2e"/></g>
      <path d="M112 158 l4 4 l-3 3 l5 3" stroke="#555" stroke-width="1.2" fill="none"/>`
  },
  eustars: {
    rim: "#2c4fa3", ink: "#0f2562",
    art: id => `
      <defs><radialGradient id="${id}s" cx=".5" cy=".45"><stop offset="0" stop-color="#3a64c8"/><stop offset="1" stop-color="#0f2a78"/></radialGradient>
      <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#d9a21c"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#${id}s)"/>
      ${Array.from({length: 12}, (_, i) => { const a = (i * 30 - 90) * Math.PI / 180; return `<path d="${star(100 + 48 * Math.cos(a), 100 + 48 * Math.sin(a), 6.5, 2.7)}" fill="#ffd83a"/>`; }).join("")}
      <path d="M70 118 Q100 82 130 118" fill="none" stroke="url(#${id}b)" stroke-width="7"/>
      <path d="M62 118 H138 V124 H62 Z" fill="url(#${id}b)"/>
      ${[76, 88, 100, 112, 124].map(x => `<path d="M${x} 118 V${118 - 22 * Math.sin(Math.PI * (x - 70) / 60) + 2}" stroke="#e8b83a" stroke-width="2"/>`).join("")}
      <path d="M62 124 Q100 140 138 124" fill="none" stroke="#8fb0ff" stroke-width="1.5" opacity=".7"/>
      <path d="M58 132 Q100 146 142 132" fill="none" stroke="#8fb0ff" stroke-width="1.5" opacity=".45"/>`
  },
  border: {
    rim: "#8a6d4b", ink: "#3f2e1a",
    art: id => `
      <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd7ec"/><stop offset="1" stop-color="#f3ead8"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#${id}s)"/>
      <path d="M0 120 L40 76 L66 100 L96 62 L132 104 L156 84 L200 120 Z" fill="#8a9bb0"/>
      <path d="M96 62 L86 76 L94 74 L100 80 L106 72 L112 78 Z M40 76 L33 84 L41 83 L46 88 Z" fill="#fff"/>
      <path d="M0 120 H200 V200 H0 Z" fill="#b9a67f"/>
      <path d="M84 200 L96 120 H104 L116 200 Z" fill="#6f6a64"/>
      <path d="M99.5 128 v6 M99 144 v8 M98.5 162 v10 M98 184 v12" stroke="#f2e7b5" stroke-width="1.6"/>
      <rect x="118" y="100" width="30" height="40" fill="#e9e1cf" stroke="#6b5a42" stroke-width="1.5"/>
      <path d="M114 100 L133 88 L152 100 Z" fill="#b5462f"/>
      <rect x="123" y="108" width="20" height="12" fill="#9fc3dd" stroke="#6b5a42"/>
      <rect x="54" y="118" width="6" height="26" fill="#555"/>
      <g transform="rotate(-8 57 122)"><rect x="57" y="118" width="80" height="6" fill="#fff" stroke="#333" stroke-width=".8"/>
      ${[0,1,2,3,4].map(i => `<rect x="${61 + i * 16}" y="118" width="8" height="6" fill="#d23a2e"/>`).join("")}</g>
      <path d="M40 146 h34" stroke="#333" stroke-width="3"/>
      <rect x="150" y="128" width="4" height="30" fill="#555"/><rect x="142" y="120" width="20" height="12" rx="2" fill="#d23a2e"/><rect x="146" y="124" width="12" height="4" fill="#fff"/>`
  },
  ballot: {
    rim: "#7157b8", ink: "#34236e",
    art: id => `
      <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9e2fb"/><stop offset="1" stop-color="#fdfbf5"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#${id}s)"/>
      <rect x="0" y="146" width="200" height="54" fill="#cfc4a8"/><rect x="0" y="146" width="200" height="4" fill="#b3a684"/>
      <rect x="60" y="92" width="80" height="62" rx="3" fill="#dcecf6" fill-opacity=".7" stroke="#6c8ca8" stroke-width="2"/>
      <path d="M60 92 L72 84 H152 L140 92 Z" fill="#c8dbe8" stroke="#6c8ca8" stroke-width="2"/>
      <path d="M140 92 L152 84 V146 L140 154 Z" fill="#b8cee0" fill-opacity=".8" stroke="#6c8ca8" stroke-width="2"/>
      <rect x="88" y="86.5" width="30" height="3" rx="1.5" fill="#34506a"/>
      ${[[70,136,-10],[88,140,8],[104,134,-4],[118,140,14],[80,124,20],[110,124,-16]].map(([x,y,r]) => `<rect x="${x}" y="${y}" width="18" height="11" fill="#fff" stroke="#b0a58a" stroke-width=".8" transform="rotate(${r} ${x} ${y})"/>`).join("")}
      <rect x="92" y="54" width="22" height="30" fill="#fff" stroke="#8e8468" stroke-width="1"/>
      <path d="M96 62 h14 M96 67 h10 M96 72 h12" stroke="#b9b09a" stroke-width="1.4"/>
      <path d="M99 76 l3 3 l6 -7" stroke="#6b4fc2" stroke-width="2" fill="none"/>
      <path d="M106 34 C118 36 124 44 124 54 L124 66 C124 70 118 72 114 70 L114 56 L104 56 C98 56 94 50 96 44 C98 38 100 34 106 34 Z" fill="#e7b58c" stroke="#b67f55" stroke-width="1"/>
      <path d="M112 36 L126 30 L136 52 L124 58 Z" fill="#6b4fc2"/><path d="M126 30 L150 20 L160 42 L136 52 Z" fill="#5a3fae"/>`
  },
  megaphone: {
    rim: "#d9572b", ink: "#6b1f06",
    art: id => `
      <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf8a"/><stop offset="1" stop-color="#ff9a6a"/></linearGradient>
      <linearGradient id="${id}m" x1="0" x2="1"><stop offset="0" stop-color="#e8e8e8"/><stop offset="1" stop-color="#a9a9a9"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#${id}s)"/>
      <g stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".9">
        <path d="M134 56 Q146 76 134 96"/><path d="M146 46 Q164 76 146 106"/><path d="M158 36 Q182 76 158 116"/></g>
      <path d="M62 70 L118 44 L118 108 L62 82 Z" fill="url(#${id}m)" stroke="#6d6d6d" stroke-width="1.5"/>
      <ellipse cx="118" cy="76" rx="7" ry="32" fill="#d9d9d9" stroke="#6d6d6d" stroke-width="1.5"/>
      <ellipse cx="118" cy="76" rx="4" ry="26" fill="#5a5a5a"/>
      <rect x="48" y="68" width="16" height="16" rx="3" fill="#d23a2e"/>
      <path d="M70 84 L78 104 L86 102 L80 86 Z" fill="#444"/>
      <g>${[[30,154,1.2],[52,150,1.3],[76,156,1.2],[100,150,1.35],[124,156,1.2],[148,150,1.3],[172,154,1.2],[40,170,1.5],[88,170,1.5],[136,170,1.5],[182,170,1.4]].map(([x,y,s]) => person(x, y, s, "#5a2412")).join("")}</g>
      ${[[64,132],[112,128],[160,134]].map(([x,y]) => `<path d="M${x} ${y} v-18" stroke="#5a2412" stroke-width="2"/><rect x="${x - 10}" y="${y - 30}" width="20" height="13" fill="#fff" stroke="#5a2412"/>`).join("")}`
  },
  robin: {
    rim: "#3f7a3a", ink: "#1b3d18",
    art: id => `
      <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7d8a8"/><stop offset="1" stop-color="#b9cf8c"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#${id}s)"/>
      ${[[20,160,26],[48,150,34],[152,152,32],[182,160,26],[76,160,22],[124,160,22]].map(([x,b,h]) => `<rect x="${x - 2}" y="${b - 8}" width="4" height="12" fill="#5a3b1c"/><path d="M${x} ${b - h - 30} L${x + h * 0.55} ${b - 6} H${x - h * 0.55} Z" fill="#2f5f2c"/><path d="M${x} ${b - h - 30} L${x + h * 0.4} ${b - 26} H${x - h * 0.4} Z" fill="#3c7437"/>`).join("")}
      <path d="M0 156 H200 V200 H0 Z" fill="#5f7e3a"/>
      <path d="M44 106 C60 98 80 70 104 62 C122 56 138 64 150 76 C140 80 132 90 128 104 Z" fill="#3b7a34" stroke="#244d20" stroke-width="1.5"/>
      <path d="M104 62 C112 74 116 88 118 104" stroke="#2c5e27" stroke-width="1.2" fill="none"/>
      <path d="M40 106 C70 100 120 98 156 104 C158 110 152 114 144 112 C110 106 76 108 48 114 C40 115 36 110 40 106 Z" fill="#2f6429" stroke="#244d20" stroke-width="1.2"/>
      <path d="M124 92 C134 60 156 40 180 30 C172 52 156 74 134 96 Z" fill="#c9302c"/>
      <path d="M128 94 L176 34" stroke="#8d1f1b" stroke-width="1.2"/>
      ${[0,1,2,3,4].map(i => `<path d="M${136 + i * 8} ${80 - i * 10} l-6 -2" stroke="#8d1f1b" stroke-width=".9"/>`).join("")}
      <path d="M40 142 L160 120" stroke="#6b4a2e" stroke-width="3"/><path d="M160 120 l-10 -4 l3 6 l-4 5 Z" fill="#aaa"/>
      <path d="M40 142 l-6 -8 M40 142 l-9 -2 M44 141 l-6 -8 M44 141 l-9 -2" stroke="#c9302c" stroke-width="2"/>
      ${[[70,166],[90,176],[112,168],[132,178],[100,186]].map(([x,y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4" fill="#f2c230" stroke="#a87a10"/><ellipse cx="${x}" cy="${y - 1}" rx="4" ry="1.8" fill="#ffe27a"/>`).join("")}`
  },
  hand: {
    rim: "#1f8a5b", ink: "#0b3d27",
    art: id => `
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
      <path d="M94 82 C94 79 102 79 102 82 C102 86 94 86 94 90 C94 93 102 93 102 90 M98 77 V95" stroke="#8a620c" stroke-width="1.6" fill="none"/>`
  },
  sheriff: {
    rim: "#b8742a", ink: "#5a3108",
    art: id => `
      <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f28b4a"/><stop offset=".55" stop-color="#ffc56b"/><stop offset="1" stop-color="#ffe0a0"/></linearGradient>
      <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#e3b33a"/><stop offset="1" stop-color="#a8761a"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#${id}s)"/>
      <circle cx="100" cy="120" r="36" fill="#ffdf7a" opacity=".7"/>
      <path d="M0 132 L30 118 L44 124 L60 106 L78 120 H200 V200 H0 Z" fill="#c8693a"/>
      <path d="M0 150 Q100 140 200 150 V200 H0 Z" fill="#d99155"/>
      <g fill="#3f6e3a"><rect x="152" y="112" width="9" height="46" rx="4.5"/><path d="M152 132 h-8 a4 4 0 0 1 -4 -4 v-12 a4 4 0 0 1 8 0 v8 h4 Z"/><path d="M161 126 h7 v-10 a4 4 0 0 1 8 0 v10 a8 8 0 0 1 -8 8 h-7 Z"/></g>
      <path d="${star(90, 104, 38, 18, 6)}" fill="url(#${id}g)" stroke="#8a5a10" stroke-width="1.5"/>
      ${Array.from({length: 6}, (_, i) => { const a = (-90 + i * 60) * Math.PI / 180; return `<circle cx="${90 + 38 * Math.cos(a)}" cy="${104 + 38 * Math.sin(a)}" r="5" fill="url(#${id}g)" stroke="#8a5a10" stroke-width="1.2"/>`; }).join("")}
      <circle cx="90" cy="104" r="15" fill="none" stroke="#8a5a10" stroke-width="1.5"/>
      <path d="${star(90, 104, 9, 4)}" fill="#8a5a10"/>`
  },
  hussard: {
    rim: "#3a5a8a", ink: "#15294a",
    art: id => `
      <rect width="200" height="200" fill="#e9dcc2"/>
      <rect x="0" y="0" width="200" height="200" fill="url(#${id}p)" opacity=".3"/>
      <rect x="30" y="44" width="140" height="84" rx="3" fill="#8a5e36"/>
      <rect x="36" y="50" width="128" height="72" fill="#2f4a3a"/>
      <g fill="#eef2e6" font-family="Georgia, serif" font-style="italic" text-anchor="middle">
        <text x="100" y="72" font-size="12">Liberté, égalité,</text><text x="100" y="88" font-size="12">fraternité</text>
        <text x="100" y="110" font-size="9" opacity=".75">Loi du 9 décembre 1905</text></g>
      <path d="M44 116 q20 -3 40 0" stroke="#eef2e6" stroke-width=".8" fill="none" opacity=".5"/>
      <rect x="36" y="122" width="128" height="5" fill="#6f4a28"/><rect x="70" y="120" width="12" height="3" fill="#f4f1e6"/>
      <rect x="0" y="146" width="200" height="54" fill="#7a5230"/><rect x="0" y="146" width="200" height="5" fill="#946640"/>
      <rect x="54" y="150" width="54" height="30" rx="2" fill="#f4ecd8" stroke="#9e8a62" transform="rotate(-6 80 165)"/>
      <path d="M60 158 h40 M60 164 h34 M60 170 h38" stroke="#b7a57e" stroke-width="1" transform="rotate(-6 80 165)"/>
      <path d="M126 150 h22 v14 a11 6 0 0 1 -22 0 Z" fill="#222" /><ellipse cx="137" cy="150" rx="11" ry="3.5" fill="#444"/>
      <path d="M137 150 C144 124 156 104 172 92 C164 110 152 128 139 150 Z" fill="#f7f3e8" stroke="#bfb49a"/>
      <path d="M139 150 L168 96" stroke="#bfb49a" stroke-width=".8"/>`
  },
  picket: {
    rim: "#c0392b", ink: "#5e110a",
    art: id => `
      <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2340"/><stop offset="1" stop-color="#48355a"/></linearGradient>
      <radialGradient id="${id}f" cx=".5" cy=".8"><stop offset="0" stop-color="#fff2a0"/><stop offset=".5" stop-color="#ff9a2a"/><stop offset="1" stop-color="#e0401e"/></radialGradient>
      <radialGradient id="${id}l" cx=".5" cy=".7"><stop offset="0" stop-color="#ffb35a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb35a" stop-opacity="0"/></radialGradient></defs>
      <rect width="200" height="200" fill="url(#${id}s)"/>
      ${[[30,40],[160,30],[140,60],[60,24],[178,80]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#fff" opacity=".8"/>`).join("")}
      <circle cx="100" cy="130" r="70" fill="url(#${id}l)"/>
      <rect x="0" y="160" width="200" height="40" fill="#2a2430"/>
      <path d="M140 160 V58" stroke="#8a7a66" stroke-width="3"/>
      <path d="M141 60 C156 56 166 66 184 60 V92 C166 98 156 88 141 92 Z" fill="#d23a2e"/>
      <path d="M154 74 l6 -6 l6 6 l-6 6 Z" fill="#fff" opacity=".85"/>
      <path d="M80 118 C74 100 90 96 86 80 C98 90 96 100 100 104 C102 92 110 90 108 76 C122 92 126 110 118 120 Z" fill="url(#${id}f)"/>
      <path d="M76 118 H124 L120 164 H80 Z" fill="#555c66"/>
      <path d="M78 130 H122 M79 146 H121" stroke="#3b4048" stroke-width="2"/>
      ${[[88,124],[100,124],[112,124],[94,138],[106,138],[88,152],[100,152],[112,152]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#ffb347"/>`).join("")}
      ${person(52, 162, 1.7, "#130f1c")}${person(34, 164, 1.5, "#130f1c")}${person(160, 164, 1.6, "#130f1c")}`
  },
  factory: {
    rim: "#6e6e6e", ink: "#2a2a2a",
    art: id => `
      <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a7a39a"/><stop offset="1" stop-color="#e9d9b8"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#${id}s)"/>
      <circle cx="150" cy="62" r="14" fill="#f2c56b" opacity=".6"/>
      <g fill="#6e6a64" opacity=".9">${[[64,40,14],[80,30,17],[98,38,13],[112,26,15],[128,34,12]].map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>
      <g fill="#8d8880" opacity=".9">${[[70,56,11],[82,48,12],[104,52,10],[116,46,11]].map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>
      ${[[66,60,12],[90,50,12],[114,62,12]].map(([x,top,w]) => `<rect x="${x}" y="${top}" width="${w}" height="${150 - top}" fill="#a4432e"/>` + [0,1,2].map(i => `<rect x="${x}" y="${top + 8 + i * 22}" width="${w}" height="6" fill="#f1ece2"/>`).join("")).join("")}
      <path d="M30 150 V116 L50 104 V116 L70 104 V116 L90 104 V116 L110 104 V116 L130 104 V116 L150 104 V116 L170 104 V150 Z" fill="#5b5046"/>
      ${[0,1,2,3,4,5,6].map(i => `<path d="M${50 + i * 20} 104 V116 L${30 + i * 20} 116 Z" fill="#8fb4c9" opacity=".6"/>`).join("")}
      <g fill="#f6c96a">${[0,1,2,3,4,5,6].map(i => `<rect x="${36 + i * 19}" y="124" width="9" height="11"/>`).join("")}</g>
      <rect x="0" y="150" width="200" height="50" fill="#3d3833"/>
      <path d="M0 164 H200" stroke="#6d665e" stroke-width="3" stroke-dasharray="14 8"/>
      <g transform="translate(118 158)"><rect x="0" y="0" width="30" height="12" rx="2" fill="#d9a21c"/><rect x="30" y="3" width="10" height="9" fill="#b98a14"/><circle cx="8" cy="14" r="3" fill="#222"/><circle cx="32" cy="14" r="3" fill="#222"/></g>`
  },
  customs: {
    rim: "#2d6f8e", ink: "#0e3345",
    art: id => `
      <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9bd0ea"/><stop offset="1" stop-color="#e6f3f8"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#${id}s)"/>
      <path d="M0 132 H200 V200 H0 Z" fill="#7d8d98"/>
      ${[[20,92,"#c0392b"],[20,112,"#2d6f8e"],[64,112,"#e0a526"],[64,92,"#3f7a3a"],[42,72,"#8e44ad"]].map(([x,y,c]) => `<rect x="${x}" y="${y}" width="44" height="20" fill="${c}" stroke="#1f2a30" stroke-width="1"/>` + [1,2,3,4,5,6,7].map(i => `<path d="M${x + i * 5.5} ${y + 2} V${y + 18}" stroke="#000" stroke-opacity=".22"/>`).join("")).join("")}
      <rect x="120" y="84" width="46" height="48" fill="#f3efe4" stroke="#39434a" stroke-width="1.5"/>
      <path d="M114 84 H172 L166 74 H120 Z" fill="#2d6f8e"/>
      <rect x="120" y="76" width="46" height="8" fill="#0e3345"/>
      <text x="143" y="82.5" text-anchor="middle" font-family="Geist, sans-serif" font-size="6.5" font-weight="700" fill="#fff">DOUANE</text>
      <rect x="126" y="92" width="34" height="18" fill="#a9d4ea" stroke="#39434a"/>
      <g transform="translate(143 108)"><path d="M-8 0 Q-8 -8 0 -8 Q8 -8 8 0 Z" fill="#1c3a5a"/><rect x="-9" y="-12" width="18" height="5" rx="1" fill="#0e2438"/><rect x="-10" y="-8" width="20" height="2" fill="#111"/><circle cx="0" cy="-3" r="3.5" fill="#e7b58c"/></g>
      <rect x="112" y="118" width="6" height="22" fill="#39434a"/>
      <g transform="rotate(-4 115 120)"><rect x="18" y="116" width="96" height="6" fill="#fff" stroke="#333" stroke-width=".8"/>${[0,1,2,3,4,5].map(i => `<rect x="${22 + i * 16}" y="116" width="8" height="6" fill="#d23a2e"/>`).join("")}</g>
      <path d="M100 200 L104 132 H112 L140 200 Z" fill="#646f78"/>`
  },
  tightrope: {
    rim: "#c46aa0", ink: "#5a1d43",
    art: id => `
      <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd7e8"/><stop offset="1" stop-color="#bfe2ff"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#${id}s)"/>
      ${cloud(20, 150, 1.4)}${cloud(120, 160, 1.6)}${cloud(70, 176, 1.2, 0.9)}${cloud(150, 40, 0.8, 0.8)}
      <rect x="16" y="104" width="8" height="96" fill="#b04a3a"/><rect x="176" y="104" width="8" height="96" fill="#2d6f8e"/>
      <path d="M20 106 Q100 118 180 106" stroke="#333" stroke-width="1.6" fill="none"/>
      <g transform="rotate(-7 100 112)">
        <path d="M40 80 Q100 88 160 80" stroke="#6b4a2e" stroke-width="2.4" fill="none"/>
        <circle cx="40" cy="80" r="3" fill="#d23a2e"/><circle cx="160" cy="80" r="3" fill="#2d6f8e"/>
        <circle cx="100" cy="62" r="6" fill="#e7b58c"/>
        <path d="M94 57 Q100 50 106 57 Z" fill="#333"/>
        <path d="M94 70 H106 L104 94 H96 Z" fill="#fff" stroke="#333"/>
        <path d="M94 70 L104 94 M100 70 L106 86" stroke="#c46aa0" stroke-width="2"/>
        <path d="M95 74 L70 84 M105 74 L130 84" stroke="#333" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M97 94 L96 116 M103 94 L106 116" stroke="#333" stroke-width="2.4" stroke-linecap="round"/></g>`
  },
  camarade: {
    rim: "#b3261e", ink: "#4d0c08",
    art: id => `
      <defs><radialGradient id="${id}s" cx=".5" cy=".3"><stop offset="0" stop-color="#ffcf6a"/><stop offset="1" stop-color="#e2582f"/></radialGradient></defs>
      <rect width="200" height="200" fill="url(#${id}s)"/>
      <g opacity=".25" fill="#fff">${Array.from({length: 16}, (_, i) => `<path d="M100 60 L${100 + 140 * Math.cos(i * Math.PI / 8)} ${60 + 140 * Math.sin(i * Math.PI / 8)} L${100 + 140 * Math.cos(i * Math.PI / 8 + 0.1)} ${60 + 140 * Math.sin(i * Math.PI / 8 + 0.1)} Z"/>`).join("")}</g>
      <path d="${star(100, 60, 20, 8)}" fill="#b3261e" stroke="#ffd35a" stroke-width="1.5"/>
      ${[-1, 1].map(s => `<g transform="translate(100 0) scale(${s} 1)">` + Array.from({length: 7}, (_, i) => `<ellipse cx="${30 + i * 2}" cy="${150 - i * 13}" rx="4" ry="9" fill="#f2c230" stroke="#a87a10" stroke-width=".8" transform="rotate(${30 - i * 6} ${30 + i * 2} ${150 - i * 13})"/>`).join("") + `<path d="M26 160 Q20 110 44 66" stroke="#a87a10" stroke-width="2" fill="none"/></g>`).join("")}
      <path d="M70 128 C74 118 86 116 92 122 L108 122 C114 116 126 118 130 128 L122 136 C116 132 110 132 106 136 L94 136 C90 132 84 132 78 136 Z" fill="#e7b58c" stroke="#9a6a44" stroke-width="1.2"/>
      <path d="M88 122 C92 118 100 118 104 124 M96 124 C100 120 108 120 112 126" stroke="#9a6a44" stroke-width="1.2" fill="none"/>
      <rect x="56" y="126" width="18" height="12" fill="#3a3a3a" transform="rotate(-18 65 132)"/><rect x="126" y="126" width="18" height="12" fill="#1f3a6a" transform="rotate(18 135 132)"/>
      <path d="M0 170 H200 V200 H0 Z" fill="#8e1c15"/>`
  }
};


const atomMark = (cx, cy, k, col) => `<g transform="translate(${cx} ${cy}) scale(${k})"><g fill="none" stroke="${col}" stroke-width="${2 / k * 1.1}">
  <ellipse rx="24" ry="8"/><ellipse rx="24" ry="8" transform="rotate(60)"/><ellipse rx="24" ry="8" transform="rotate(-60)"/></g>
  <circle r="4.5" fill="#fff"/><circle cx="24" r="2.4" fill="#fff"/><circle cx="-12" cy="-20.8" r="2.4" fill="#fff"/><circle cx="-12" cy="20.8" r="2.4" fill="#fff"/></g>`;

ART.atom.art = (id, t = 2) => {
  const towers = t === 1 ? tower(70, 104, 26, id) : t === 2 ? tower(64, 98, 28, id) + tower(96, 110, 20, id) : tower(52, 96, 26, id) + tower(80, 104, 22, id) + tower(104, 112, 18, id);
  return sky(id, t === 1 ? ["#8fbfe0", "#ffe3b8"] : t === 2 ? ["#2a4f7a", "#e98f5f", "#ffd59a"] : ["#0d0a26", "#3a1f5e", "#8a3f7a"]) + `
  <defs><radialGradient id="${id}g"><stop offset="0" stop-color="${t === 3 ? '#e8fff6' : '#fff7c2'}"/><stop offset=".4" stop-color="${t === 3 ? '#6fffd0' : '#ffe066'}" stop-opacity=".8"/><stop offset="1" stop-color="${t === 3 ? '#6fffd0' : '#ffe066'}" stop-opacity="0"/></radialGradient>
  <linearGradient id="${id}t" x1="0" x2="1"><stop offset="0" stop-color="#9aa4ad"/><stop offset=".45" stop-color="#e7ebee"/><stop offset="1" stop-color="#7d8790"/></linearGradient></defs>
  ${t === 3 ? starfield(22) : ""}
  ${t === 3 ? `<g stroke="#bfffe8" stroke-linecap="round" opacity=".55">${Array.from({length: 18}, (_, i) => { const a = i * 20 * Math.PI / 180, r0 = 34, r1 = i % 2 ? 50 : 62; return `<path d="M${130 + r0 * Math.cos(a)} ${64 + r0 * Math.sin(a)} L${130 + r1 * Math.cos(a)} ${64 + r1 * Math.sin(a)}" stroke-width="${i % 2 ? 1.5 : 2.5}"/>`; }).join("")}</g>` : ""}
  <circle cx="${t === 3 ? 130 : 128}" cy="${t === 3 ? 64 : 68}" r="${[22, 30, 44][t - 1]}" fill="url(#${id}g)"/>
  ${atomMark(t === 3 ? 130 : 128, t === 3 ? 64 : 68, [0.7, 1, 1.35][t - 1], t === 3 ? "#d8fff2" : "#fff4c4")}
  <g opacity=".95">${t === 1 ? cloud(60, 90, 0.8, 0.8) : t === 2 ? cloud(52, 86, 1.1) + cloud(40, 76, 0.8, 0.8) + cloud(84, 94, 0.9, 0.85)
     : `<g fill="#cfc3e8">${[[40,78,12],[54,70,15],[70,76,12],[82,86,11],[98,92,10]].map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}" opacity=".85"/>`).join("")}</g>`}</g>
  ${towers}
  ${t >= 2 ? `<rect x="112" y="136" width="44" height="24" fill="#c9d0d6"/><path d="M112 136 L134 124 L156 136 Z" fill="#aeb7bf"/>
  <g fill="${t === 3 ? '#8affd6' : '#ffe9a8'}">${[0,1,2,3].map(i => `<rect x="${116 + i * 10}" y="143" width="5" height="6"/>`).join("")}</g>` : ""}
  <path d="M0 158 Q60 150 100 156 T200 154 V200 H0 Z" fill="${t === 3 ? '#2a2a44' : '#4f6b3e'}"/>
  <path d="M0 168 Q50 162 110 168 T200 166 V200 H0 Z" fill="${t === 3 ? '#1c1c33' : '#3c5530'}"/>
  ${t === 3 ? `<g transform="translate(150 156)">
     <circle cx="0" cy="-30" r="10" fill="none" stroke="#ffe27a" stroke-width="1.8"/>
     <path d="M-14 0 L-9 -20 Q0 -26 9 -20 L14 0 Z" fill="#6b4428"/>
     <path d="M-9 -22 Q0 -42 9 -22 Q9 -15 0 -15 Q-9 -15 -9 -22 Z" fill="#5a3a22"/>
     <ellipse cx="-2" cy="-23" rx="4" ry="5" fill="#241509"/>
     <path d="M-10 -8 H10" stroke="#d9b36a" stroke-width="1.4"/>
     <path d="M-5 -14 L-10 -24 L-6 -14 Z" fill="#e7b58c"/></g>
     <g>${[[124,152],[176,152]].map(([x,y]) => `<rect x="${x - 1.5}" y="${y - 8}" width="3" height="8" fill="#f4efe2"/><ellipse cx="${x}" cy="${y - 10}" rx="1.6" ry="3" fill="#ffd35a"/><circle cx="${x}" cy="${y - 10}" r="6" fill="#ffd35a" opacity=".25"/>`).join("")}</g>` : ""}`;
};

ART.snail.art = (id, t = 2) => {
  const night = t === 3;
  return sky(id, night ? ["#141a3a", "#2e2c5c", "#51457a"] : t === 1 ? ["#dff1f8", "#fbf6e2"] : ["#cfe9f5", "#f6f1d8"]) + `
  <defs><radialGradient id="${id}sh" cx=".4" cy=".35"><stop offset="0" stop-color="#f7c982"/><stop offset=".7" stop-color="#c8793a"/><stop offset="1" stop-color="#8d4d1f"/></radialGradient>
  <radialGradient id="${id}lg"><stop offset="0" stop-color="#ffd98a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient></defs>
  ${night ? starfield(26, 3) + `<path d="M150 42 a14 14 0 1 0 10 24 a11 11 0 1 1 -10 -24 Z" fill="#fff4c8"/>` : `<circle cx="150" cy="58" r="${t === 1 ? 10 : 12}" fill="#ffd66b"/>`}
  <path d="M0 140 Q40 128 90 136 T200 132 V200 H0 Z" fill="${night ? '#2f4a3a' : '#9cc56a'}"/>
  <path d="M30 172 C60 120 130 110 176 142 C140 150 90 176 30 172 Z" fill="${night ? '#305c34' : '#5d9a3a'}"/>
  <path d="M36 170 C80 150 120 140 172 143" stroke="${night ? '#1f3f22' : '#3f7424'}" stroke-width="2" fill="none"/>
  ${t === 1 ? `<g>${[[44,128],[164,124],[176,130]].map(([x,y]) => `<path d="M${x} ${y} q-4 -10 0 -16 q4 6 0 16" fill="#7fb24f"/>`).join("")}</g>` : ""}
  <path d="M48 150 C60 146 120 146 140 150 C150 138 154 124 150 118 L144 118 C142 132 132 140 120 140 L60 142 C52 142 46 146 48 150 Z" fill="#c7b89a"/>
  <path d="M140 124 L150 100 M146 124 L160 104" stroke="#a89878" stroke-width="3" stroke-linecap="round"/>
  <circle cx="150" cy="99" r="3" fill="#3a3024"/><circle cx="160.5" cy="103" r="3" fill="#3a3024"/>
  ${night ? `<circle cx="96" cy="112" r="44" fill="url(#${id}lg)" opacity=".5"/>` : ""}
  <circle cx="96" cy="112" r="30" fill="url(#${id}sh)"/>
  <path d="M96 112 m-2 0 a4 4 0 1 1 6 3 a9 9 0 1 1 -14 -8 a15 15 0 1 1 20 20 a22 22 0 1 1 -30 -26" fill="none" stroke="#6b3a14" stroke-width="2.4" stroke-linecap="round"/>
  ${t >= 2 ? `<g transform="translate(104 64) rotate(12)"><rect x="-10" y="-4" width="20" height="16" fill="#f4efe2" stroke="#6b3a14" stroke-width="1.2"/><path d="M-13 -4 L0 -14 L13 -4 Z" fill="#b5462f"/><rect x="-3" y="4" width="6" height="8" fill="#6b3a14"/>
     ${night ? `<rect x="-8" y="-1" width="5" height="4" fill="#ffd35a"/><circle cx="-5.5" cy="1" r="6" fill="#ffd35a" opacity=".3"/><path d="M6 -10 v-6 h3 v4" fill="#8a8a8a"/><circle cx="8" cy="-20" r="2" fill="#bbb" opacity=".5"/>` : `<rect x="-8" y="-1" width="5" height="4" fill="#9fc3dd"/>`}</g>` : ""}
  ${night ? `<g transform="translate(170 112)"><path d="M0 -14 V-4" stroke="#6b5a42" stroke-width="1"/><circle cx="0" cy="4" r="22" fill="url(#${id}lg)"/>
     <path d="M-7 10 H7 L5 14 H-5 Z" fill="#8a6a2e"/><path d="M-5 10 Q-7 2 -3 -3 H3 Q7 2 5 10 Z" fill="#fff2c8" fill-opacity=".6" stroke="#b08a3a"/>
     <path d="M0 6 q-3 -4 0 -8 q3 4 0 8" fill="#ffb13a"/><path d="M-4 -4 H4 V-6 H-4 Z" fill="#8a6a2e"/></g>
     <path d="M150 99 Q160 90 170 98" stroke="#a89878" stroke-width="1" fill="none"/>
     ${[[60,120],[76,96],[132,90],[40,100]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#f6ff9a"/><circle cx="${x}" cy="${y}" r="4" fill="#f6ff9a" opacity=".3"/>`).join("")}` : ""}
  ${t === 1 ? "" : `<path d="M36 152 h-12 M20 152 h-6" stroke="#bfe0f0" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="3 5" opacity=".9"/>`}`;
};

ART.picket.art = (id, t = 2) => {
  const fire = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-20 0 C-26 -18 -10 -22 -14 -38 C-2 -28 -4 -18 0 -14 C2 -26 10 -28 8 -42 C22 -26 26 -8 18 2 Z" fill="url(#${id}f)"/></g>`;
  const barrel = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-24 0 H24 L20 46 H-20 Z" fill="#555c66"/><path d="M-22 12 H22 M-21 28 H21" stroke="#3b4048" stroke-width="2"/>
    ${[[-12,6],[0,6],[12,6],[-6,20],[6,20],[-12,34],[0,34],[12,34]].map(([a,b]) => `<circle cx="${a}" cy="${b}" r="2.4" fill="#ffb347"/>`).join("")}</g>`;
  const flag = (x, top, w, col = "#d23a2e") => `<path d="M${x} 162 V${top}" stroke="#8a7a66" stroke-width="2.5"/><path d="M${x + 1} ${top + 2} c${w * 0.35} -4 ${w * 0.6} 6 ${w} 0 v${w * 0.7} c-${w * 0.4} 6 -${w * 0.65} -4 -${w} 0 Z" fill="${col}"/>`;
  return sky(id, t === 1 ? ["#3c4a7a", "#b27a86", "#f0b07a"] : t === 2 ? ["#1c2340", "#48355a"] : ["#2a0c10", "#7a1c14", "#d2502a"]) + `
  <defs><radialGradient id="${id}f" cx=".5" cy=".8"><stop offset="0" stop-color="#fff2a0"/><stop offset=".5" stop-color="#ff9a2a"/><stop offset="1" stop-color="#e0401e"/></radialGradient>
  <radialGradient id="${id}l" cx=".5" cy=".7"><stop offset="0" stop-color="#ffb35a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb35a" stop-opacity="0"/></radialGradient></defs>
  ${t === 2 ? [[30,40],[160,30],[140,60],[60,24],[178,80]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#fff" opacity=".8"/>`).join("") : ""}
  ${t === 3 ? `<g fill="#1a0a0c">${[[40,70,10],[62,60,10],[138,64,10]].map(([x,top,w]) => `<rect x="${x}" y="${top}" width="${w}" height="${150 - top}"/>`).join("")}
     <path d="M20 150 V112 L44 100 V112 L68 100 V112 L92 100 V112 L116 100 V112 L140 100 V112 L164 100 V112 L184 104 V150 Z"/></g>` : ""}
  ${t >= 2 ? `<circle cx="100" cy="130" r="${t === 3 ? 90 : 70}" fill="url(#${id}l)"/>` : ""}
  <rect x="0" y="160" width="200" height="40" fill="${t === 3 ? '#1c0a0c' : '#2a2430'}"/>
  ${t === 1 ? flag(132, 84, 34) + `
     <g transform="translate(64 128) rotate(-10)"><rect x="-26" y="-16" width="52" height="32" rx="3" fill="#fbf7ee" stroke="#8a7a66"/><rect x="-26" y="-16" width="52" height="9" rx="3" fill="#d23a2e"/>
     <rect x="-20" y="-2" width="12" height="14" fill="#d6cdb8"/><path d="M-4 0 h22 M-4 5 h18 M-4 10 h20" stroke="#b7ab90" stroke-width="1.5"/><path d="M8 -12 l4 -2 l4 2" stroke="#fff" stroke-width="1.2" fill="none"/></g>`
    + person(116, 162, 1.6, "#2a1e2e") + person(150, 164, 1.5, "#2a1e2e") : ""}
  ${t === 2 ? flag(140, 58, 44) + fire(100, 118, 1) + barrel(100, 118, 1) + person(52, 162, 1.7, "#130f1c") + person(34, 164, 1.5, "#130f1c") + person(160, 164, 1.6, "#130f1c") : ""}
  ${t === 3 ? flag(30, 58, 30) + flag(172, 52, 26, "#b01f18") + `
     ${flag(58, 70, 28, "#c42a1c")}${flag(146, 66, 30)}
     ${fire(100, 136, 0.85)}${barrel(100, 136, 0.62)}
     ${[[24,160,1.5],[44,162,1.6],[64,158,1.4],[136,158,1.4],[156,162,1.6],[178,160,1.5],[80,166,1.5],[120,166,1.5]].map(([x,y,s]) => person(x, y, s, "#120406")).join("")}
     ${[[56,128],[146,128]].map(([x,y]) => `<path d="M${x} ${y} l-4 -12 M${x} ${y} l4 -12" stroke="#120406" stroke-width="2.4" stroke-linecap="round"/>`).join("")}` : ""}`;
};

ART.dove.art = (id, t = 2) => {
  const k = [0.85, 1, 1.12][t - 1];
  return sky(id, t === 3 ? ["#ffd66b", "#ffe9b0", "#e6f3ff"] : ["#9fcaf5", "#eef6ff"]) + `
  ${t === 3 ? `<g opacity=".5">${Array.from({length: 14}, (_, i) => { const a = (i * 360 / 14) * Math.PI / 180, b = a + 0.12; return `<path d="M104 92 L${104 + 150 * Math.cos(a)} ${92 + 150 * Math.sin(a)} L${104 + 150 * Math.cos(b)} ${92 + 150 * Math.sin(b)} Z" fill="#fff"/>`; }).join("")}</g>` : cloud(40, 70, 1) + cloud(140, 140, 1.2, 0.9)}
  <g transform="translate(100 96) scale(${k}) translate(-100 -96)${t === 3 ? " translate(6 -22)" : ""}">
  <path d="M58 104 C70 88 92 86 106 94 C114 70 132 54 160 50 C146 66 142 80 138 92 C150 90 158 94 164 100 C150 102 140 108 132 116 C122 128 100 132 86 126 L66 136 L72 122 C64 118 58 112 58 104 Z" fill="#fff" stroke="#b9cde3" stroke-width="1.2"/>
  <path d="M106 94 C114 84 124 78 134 76 M112 100 C122 92 134 88 146 86" stroke="#c7d7ea" stroke-width="1.4" fill="none"/>
  <circle cx="72" cy="101" r="1.8" fill="#223"/><path d="M58 104 L50 106 L58 108 Z" fill="#f0a64a"/>
  <path d="M50 107 C42 112 36 120 34 128" stroke="#5c7a2e" stroke-width="1.8" fill="none"/>
  ${[[46,110,-30],[41,116,20],[38,122,-40],[36,127,15]].map(([x,y,r]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="2.2" fill="#78a03a" transform="rotate(${r} ${x} ${y})"/>`).join("")}</g>
  ${t === 2 ? `<g transform="rotate(-18 100 162)"><rect x="46" y="158" width="46" height="7" rx="2" fill="#6b4a2e"/><rect x="92" y="159" width="20" height="4" fill="#555"/></g>
  <g transform="rotate(22 132 170)"><rect x="118" y="167" width="28" height="4" fill="#555"/><rect x="146" y="165" width="10" height="7" rx="1" fill="#6b4a2e"/></g>` : ""}
  ${t === 3 ? `<path d="M0 150 Q100 140 200 150 V200 H0 Z" fill="#8cb86a"/>
  <g transform="translate(52 150) scale(.85)"><rect x="-26" y="-6" width="52" height="12" rx="6" fill="#4a5a3a"/>${[-20,-10,0,10,20].map(x => `<circle cx="${x}" cy="0" r="3.6" fill="#2e3826"/>`).join("")}
    <path d="M-22 -6 L-16 -16 H18 L24 -6 Z" fill="#6b7a4a"/><path d="M-8 -16 Q0 -26 10 -16 Z" fill="#5d6c40"/>
    <rect x="8" y="-22" width="30" height="3.6" fill="#5d6c40" transform="rotate(-24 8 -20)"/>
    <path d="M34 -36 q-2 -8 4 -10" stroke="#3f7424" stroke-width="1.5" fill="none"/>${[0,72,144,216,288].map(a => `<ellipse cx="38" cy="-50" rx="2.4" ry="5" fill="#e0457a" transform="rotate(${a} 38 -45)"/>`).join("")}<circle cx="38" cy="-45" r="2.4" fill="#ffd35a"/></g>
  <g transform="translate(136 150)">${[[-16,-2,-20],[0,-6,12],[14,0,-8]].map(([x,y,r]) => `<g transform="rotate(${r} ${x} ${y})"><rect x="${x - 12}" y="${y - 2}" width="18" height="4" fill="#555"/><rect x="${x + 6}" y="${y - 3}" width="8" height="6" rx="1" fill="#6b4a2e"/></g>`).join("")}
    <path d="M-4 -12 q2 -8 8 -8 q-2 6 -8 8" fill="#78a03a"/><path d="M4 -14 q6 -4 10 0 q-6 3 -10 0" fill="#78a03a"/></g>` : ""}`;
};

ART.sheriff.art = (id, t = 2) => {
  const k = [0.72, 1, 0.98][t - 1], cy = t === 3 ? 92 : 104, cx = t === 3 ? 82 : 90;
  return sky(id, t === 3 ? ["#0c0f22", "#24204a", "#5a2e4a"] : t === 1 ? ["#9fd0f0", "#f4ecd6"] : ["#f28b4a", "#ffc56b", "#ffe0a0"]) + `
  <defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#e3b33a"/><stop offset="1" stop-color="#a8761a"/></linearGradient>
  <linearGradient id="${id}b" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff6b0" stop-opacity=".7"/><stop offset="1" stop-color="#fff6b0" stop-opacity="0"/></linearGradient></defs>
  ${t === 3 ? starfield(14, 11) + `<path d="M20 170 L60 0 L96 0 Z" fill="url(#${id}b)"/><path d="M184 170 L150 0 L112 0 Z" fill="url(#${id}b)"/>` : ""}
  ${t === 2 ? `<circle cx="100" cy="120" r="36" fill="#ffdf7a" opacity=".7"/>` : ""}
  <path d="M0 132 L30 118 L44 124 L60 106 L78 120 H200 V200 H0 Z" fill="${t === 3 ? '#2a1e2e' : t === 1 ? '#c9b48a' : '#c8693a'}"/>
  <path d="M0 150 Q100 140 200 150 V200 H0 Z" fill="${t === 3 ? '#3a2a36' : t === 1 ? '#dcc9a0' : '#d99155'}"/>
  ${t >= 2 ? `<g fill="${t === 3 ? '#1f3320' : '#3f6e3a'}"><rect x="152" y="112" width="9" height="46" rx="4.5"/><path d="M152 132 h-8 a4 4 0 0 1 -4 -4 v-12 a4 4 0 0 1 8 0 v8 h4 Z"/><path d="M161 126 h7 v-10 a4 4 0 0 1 8 0 v10 a8 8 0 0 1 -8 8 h-7 Z"/></g>` : ""}
  ${t === 1 ? `<g transform="translate(150 150)"><rect x="-1.5" y="-40" width="3" height="40" fill="#777"/><path d="M0 -58 L14 -44 L0 -30 L-14 -44 Z" fill="#fff" stroke="#c0392b" stroke-width="3"/><circle cx="0" cy="-44" r="4" fill="#c0392b"/></g>` : ""}
  ${t === 3 ? `<circle cx="${cx}" cy="${cy}" r="50" fill="#ffe27a" opacity=".18"/>` : ""}
  <g transform="translate(${cx} ${cy}) scale(${k}) translate(-90 -104)">
  <path d="${star(90, 104, 38, 18, 6)}" fill="url(#${id}g)" stroke="#8a5a10" stroke-width="1.5"/>
  ${Array.from({length: 6}, (_, i) => { const a = (-90 + i * 60) * Math.PI / 180; return `<circle cx="${90 + 38 * Math.cos(a)}" cy="${104 + 38 * Math.sin(a)}" r="5" fill="url(#${id}g)" stroke="#8a5a10" stroke-width="1.2"/>`; }).join("")}
  <circle cx="90" cy="104" r="15" fill="none" stroke="#8a5a10" stroke-width="1.5"/><path d="${star(90, 104, 9, 4)}" fill="#8a5a10"/></g>
  ${t === 3 ? `<g stroke="#9a9aa6" stroke-width="1.4" fill="none"><path d="M0 146 Q50 142 100 146 T200 144"/><path d="M0 154 Q50 150 100 154 T200 152"/></g>
    <g stroke="#9a9aa6" stroke-width="1.2">${Array.from({length: 12}, (_, i) => `<path d="M${10 + i * 17} ${143} l4 5 M${14 + i * 17} ${143} l-4 5"/>`).join("")}</g>
    <g transform="translate(126 140) scale(.8)">
      <circle cx="-2.5" cy="-17" r="9" fill="#ff4a4a" opacity=".35"/><circle cx="2.5" cy="-17" r="9" fill="#4a8aff" opacity=".35"/>
      <path d="M-28 4 V-4 Q-28 -8 -22 -8 L-14 -8 L-8 -16 H10 L18 -8 H24 Q30 -8 30 -2 V4 Z" fill="#f2f2f4" stroke="#1c1c24" stroke-width="1.2"/>
      <path d="M-28 -2 H30 V2 H-28 Z" fill="#2a4cc2"/>
      <path d="M-6 -14 L-2 -14 L-2 -9 L-12 -9 Z M1 -14 H9 L14 -9 H1 Z" fill="#8fb4d8"/>
      <rect x="-5" y="-19" width="5" height="4" rx="1" fill="#ff3b3b"/><rect x="0" y="-19" width="5" height="4" rx="1" fill="#3b7bff"/>
      <circle cx="-18" cy="4" r="4.5" fill="#111"/><circle cx="-18" cy="4" r="1.8" fill="#888"/><circle cx="20" cy="4" r="4.5" fill="#111"/><circle cx="20" cy="4" r="1.8" fill="#888"/>
      <path d="M28 -5 h2.5 v2.5 h-2.5 Z" fill="#fff6b0"/><path d="M30 -4 L46 -8 L46 2 Z" fill="#fff6b0" opacity=".35"/></g>` : ""}`;
};

