/* What the compass shows: the group on show and its members, and the
   viewer's preferences — country, reading, flags, what is drawn. The
   preferences are remembered in this browser under the keys the first
   version used, so nobody loses theirs. */

import { api } from '$lib/api.js';
import { session } from '$lib/session.svelte.js';
import { COUNTRIES, VIEWS, fromMember } from '$lib/compass/model.js';

const KEYS = {
	country: 'politicompass.country.v1',
	view: 'politicompass.view.v1',
	flags: 'politicompass.flags.v1',
	group: 'politicompass.group.v1',
	show: 'politiskel.show.v1'
};

const read = (k) => {
	try {
		return localStorage.getItem(k);
	} catch {
		return null;
	}
};
const write = (k, v) => {
	try {
		v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
	} catch {
		/* quota, or private browsing */
	}
};

export const board = $state({
	country: COUNTRIES[0].code,
	view: 'politiskel',
	/** "politiscales": a member's own PolitiScales flag where there is one; "politiskel": ours for all */
	flagMode: 'politiscales',
	show: { refs: true, refLabels: true, labels: true, centroid: false, trail: true },
	/** the group on show, or null for one's own profile alone */
	groupId: null,
	members: [],
	loaded: false,
	prefsRead: false
});

export function readPrefs() {
	if (board.prefsRead) return;
	const c = read(KEYS.country);
	if (COUNTRIES.some((x) => x.code === c)) board.country = c;
	const v = read(KEYS.view);
	if (VIEWS.some((x) => x.key === v && !x.planned)) board.view = v;
	board.flagMode = read(KEYS.flags) === 'politiskel' ? 'politiskel' : 'politiscales';
	try {
		Object.assign(board.show, JSON.parse(read(KEYS.show) || '{}'));
	} catch {
		/* a broken entry: the defaults */
	}
	board.prefsRead = true;
}

export function savePrefs() {
	write(KEYS.country, board.country);
	write(KEYS.view, board.view);
	write(KEYS.flags, board.flagMode);
	write(KEYS.show, JSON.stringify(board.show));
}

/* The group last chosen if one is still a member of it, else the first;
   `id === null` asks for one's own profile alone. */
export function chooseGroup(id) {
	const groups = session.me ? session.me.groups : [];
	let want = id;
	if (want === undefined) want = Number(read(KEYS.group));
	const found = groups.find((g) => g.id === want);
	board.groupId = found ? found.id : id === null ? null : groups[0] ? groups[0].id : null;
	write(KEYS.group, board.groupId === null ? null : String(board.groupId));
}

export const currentGroup = () =>
	session.me && board.groupId !== null ? session.me.groups.find((g) => g.id === board.groupId) || null : null;

/* The board's first load, once a member is signed in: the preferences, the
   group last chosen, its members. Pages call it whenever the session
   changes; it runs once. */
let starting = false;
export async function ensureBoard() {
	readPrefs();
	if (board.loaded || starting || !session.me) return;
	starting = true;
	chooseGroup();
	await loadMembers();
	starting = false;
}

/* Two switches in a row start two loads: only the latest may land. */
let seq = 0;
export async function loadMembers() {
	const mine = ++seq;
	if (!session.me) {
		board.members = [];
		board.loaded = true;
		return;
	}
	let list;
	if (board.groupId !== null) {
		const r = await api('GET', '/api/groups/' + board.groupId + '/profiles');
		if (mine !== seq) return;
		list = r.ok ? r.data : [];
	} else {
		const p = session.me.profile;
		list = [{ username: session.me.username, me: true, flag: p.flag, politiscales: p.politiscales, answers: p.answers }];
	}
	board.members = list.map(fromMember);
	board.loaded = true;
}
