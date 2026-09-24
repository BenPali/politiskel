/* The one way the site talks to the server. It never rejects: a network
   failure comes back as { ok: false, status: 0 }, so a dropped connection
   cannot abort a caller half-way or lose what it was sending. */

import { L } from '$lib/i18n/fr.js';

export async function api(method, path, body) {
	let res;
	try {
		res = await fetch(path, {
			method,
			credentials: 'same-origin',
			headers: body ? { 'Content-Type': 'application/json' } : {},
			body: body ? JSON.stringify(body) : undefined
		});
	} catch {
		return { ok: false, status: 0, data: { error: 'network' } };
	}
	let data = null;
	try {
		data = await res.json();
	} catch {
		/* 204, or not JSON */
	}
	return { ok: res.ok, status: res.status, data };
}

/* The sentence for a failed call. */
export const apiError = (r) =>
	(typeof r === 'string' ? r : L.apiErrors[r?.data?.error]) || L.apiErrors.default;
