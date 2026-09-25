/* The display settings: a palette, a mode and the motion, on <html> as
   data-theme, data-mode and data-motion, remembered in this browser. app.html applies them before the
   first paint; this module reads and changes them. */

export const PALETTES = ['classique', 'pop', 'journal', 'nuit', 'aurore', 'graphite', 'catppuccin', 'sepia', 'contraste'];
export const MODES = ['auto', 'clair', 'sombre'];
/* 'reduce' stills the site even where the system asks for nothing */
export const MOTIONS = ['full', 'reduce'];
const KEY = 'politiskel.display.v1';

/* the first version's single setting, carried over once */
const OLD_KEY = 'politicompass.theme.v1';
const OLD = { light: ['classique', 'clair'], dark: ['classique', 'sombre'], contrast: ['contraste', 'clair'], sepia: ['sepia', 'clair'] };

/* What app.html applies before the first paint must be what this returns,
   or the page and the pickers disagree: both read the same entry, keep a
   palette only if it still exists (Riso and Lagune are gone), and carry
   the old setting over. */
export function readDisplay() {
	try {
		const d = JSON.parse(localStorage.getItem(KEY) || 'null');
		if (d && MODES.includes(d.mode))
			return {
				palette: PALETTES.includes(d.palette) ? d.palette : 'classique',
				mode: d.mode,
				motion: MOTIONS.includes(d.motion) ? d.motion : 'full'
			};
		const old = OLD[localStorage.getItem(OLD_KEY)];
		if (old) return { palette: old[0], mode: old[1], motion: 'full' };
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
