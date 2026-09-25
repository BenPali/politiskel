/* The display settings: a palette, a mode and the motion, on <html> as
   data-theme, data-mode and data-motion, remembered in this browser. app.html applies them before the
   first paint; this module reads and changes them. */

export const PALETTES = ['classique', 'pop', 'journal', 'nuit', 'aurore', 'graphite', 'catppuccin', 'sepia', 'contraste'];
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

/* The change itself, crossfaded across the whole page where the browser can
   (a view transition), and otherwise by easing the colours for a moment.
   Neither when motion is reduced, by the setting or the system. */
export function applyDisplay(d) {
	const html = document.documentElement;
	const set = () => {
		html.dataset.theme = d.palette;
		html.dataset.mode = d.mode;
		if (d.motion === 'reduce') html.dataset.motion = 'reduce';
		else delete html.dataset.motion;
	};
	const still = d.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (still) set();
	else if (document.startViewTransition) document.startViewTransition(set);
	else {
		html.classList.add('theme-fading');
		set();
		setTimeout(() => html.classList.remove('theme-fading'), 420);
	}
	try {
		localStorage.setItem(KEY, JSON.stringify(d));
	} catch {
		/* quota, or private browsing */
	}
}
