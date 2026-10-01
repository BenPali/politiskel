/* Who is signed in, and how the server is set up — shared by every page.
   `ready` turns true once the first answer came back, so a page can wait for
   it rather than flash the signed-out view. */

import { api } from '$lib/api.js';

export const session = $state({
	ready: false,
	/** @type {null | { username: string, groups: any[], profile: any }} */
	me: null,
	/** who may sign up: "open" or "invite"; a closed but empty site is open */
	signup: 'open',
	/** a status line a page leaves for the next one ("Mot de passe changé") */
	status: ''
});

export async function refresh() {
	const [me, cfg] = await Promise.all([api('GET', '/api/me'), api('GET', '/api/config')]);
	session.me = me.ok ? me.data : null;
	session.signup = cfg.ok && cfg.data?.signup === 'invite' && !cfg.data.empty ? 'invite' : 'open';
	session.ready = true;
}

export async function signOut() {
	await api('POST', '/api/logout');
	/* nothing of this account's may be sent once it is gone */
	const { forgetPending } = await import('$lib/quiz/answers.svelte.js');
	forgetPending();
	session.me = null;
}
