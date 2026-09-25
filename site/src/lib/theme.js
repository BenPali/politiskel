/* The display settings: a palette, a mode and the motion, on <html> as
   data-theme, data-mode and data-motion, remembered in this browser. app.html applies them before the
   first paint; this module reads and changes them. */

export const PALETTES = ['classique', 'pop', 'lagune', 'riso', 'sepia', 'contraste'];
export const MODES = ['auto', 'clair', 'sombre'];
/* 'reduce' stills the site even where the system asks for nothing */
export const MOTIONS = ['full', 'reduce'];
const KEY = 'politiskel.display.v1';

export function readDisplay() {
	try {
		const d = JSON.parse(localStorage.getItem(KEY) || 'null');
		if (d && PALETTES.includes(d.palette) && MODES.includes(d.mode))
			return { palette: d.palette, mode: d.mode, motion: MOTIONS.includes(d.motion) ? d.motion : 'full' };
	} catch {
		/* private browsing, or a broken entry */
	}
	return { palette: 'classique', mode: 'auto', motion: 'full' };
}

export function applyDisplay(d) {
	document.documentElement.dataset.theme = d.palette;
	document.documentElement.dataset.mode = d.mode;
	if (d.motion === 'reduce') document.documentElement.dataset.motion = 'reduce';
	else delete document.documentElement.dataset.motion;
	try {
		localStorage.setItem(KEY, JSON.stringify(d));
	} catch {
		/* quota, or private browsing */
	}
}
