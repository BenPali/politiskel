/* The display settings: a palette and a mode, on <html> as data-theme and
   data-mode, remembered in this browser. app.html applies them before the
   first paint; this module reads and changes them. */

export const PALETTES = ['classique', 'pop', 'lagune', 'riso', 'sepia', 'contraste'];
export const MODES = ['auto', 'clair', 'sombre'];
const KEY = 'politiskel.display.v1';

export function readDisplay() {
	try {
		const d = JSON.parse(localStorage.getItem(KEY) || 'null');
		if (d && PALETTES.includes(d.palette) && MODES.includes(d.mode)) return d;
	} catch {
		/* private browsing, or a broken entry */
	}
	return { palette: 'classique', mode: 'auto' };
}

export function applyDisplay(d) {
	document.documentElement.dataset.theme = d.palette;
	document.documentElement.dataset.mode = d.mode;
	try {
		localStorage.setItem(KEY, JSON.stringify(d));
	} catch {
		/* quota, or private browsing */
	}
}
