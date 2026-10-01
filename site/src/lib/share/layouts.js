/* Every card the share dialog offers, in its order: the plain layouts,
   which take the export theme, then the fun ones, which mostly keep their
   own paper and ink (`themed` says which follow the dots). */
import { LAYOUTS, THEMES, drawCard } from './card.js';
import { FUN } from './fun.js';

export const SHARE_LAYOUTS = [
	...LAYOUTS.map((l) => ({ key: l.key, w: l.w, h: l.h, themed: true, draw: (d, ART, theme) => drawCard(l, d, ART, theme) })),
	...FUN.map((l) => ({ key: l.key, w: l.w, h: l.h, themed: l.key === 'boarding', draw: (d, ART, theme) => l.draw(d, ART, THEMES[theme] || THEMES.clair) }))
];
