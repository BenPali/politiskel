/* Passing messages — "X fait maintenant partie du groupe", "Mot de passe
   changé" — shown a few seconds at the bottom of the screen, then gone.
   They survive a page change, so a page can say what the last one did.
   An error stays until closed. */

export const toasts = $state({ list: [] });
let next = 1;

/** kind: 'info' | 'error'; ms: how long it stays (0: until closed);
    action: { label, href }, a link the message offers */
export function toast(text, { kind = 'info', ms = kind === 'error' ? 0 : 4500, action = null } = {}) {
	if (!text) return;
	const id = next++;
	toasts.list = [...toasts.list.filter((t) => t.text !== text), { id, text, kind, ms, action }].slice(-3);
	return id;
}

export function dismiss(id) {
	toasts.list = toasts.list.filter((t) => t.id !== id);
}
