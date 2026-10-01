/* An invitation followed while signed out is kept for this tab only, so
   signing up (or in) can come back to it. */

const KEY = 'politiskel.join.v1';

export function keepInvite(code) {
	try {
		code ? sessionStorage.setItem(KEY, code) : sessionStorage.removeItem(KEY);
	} catch {
		/* private browsing */
	}
}

export function pendingInvite() {
	try {
		return sessionStorage.getItem(KEY);
	} catch {
		return null;
	}
}
