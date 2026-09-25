/* A questionnaire flow is a list of screens: how much each of its themes
   matters, its items mixed in the one fixed order politi-quiz.js defines,
   then how much each theme matters now. A theme's flow has one theme; the
   complete questionnaire ("all") has every open one. */

import { PolitiQuiz } from '$lib/model.js';

export const ALL = 'all';
export const openThemes = () => PolitiQuiz.THEMES.filter((t) => !t.planned);
export const flowThemes = (key) => (key === ALL ? openThemes().map((t) => t.key) : [key]);
export const isFlow = (key) => key === ALL || openThemes().some((t) => t.key === key);

export function screensFor(key) {
	const keys = flowThemes(key);
	const items = [].concat(...keys.map(PolitiQuiz.askedItems));
	return keys
		.map((k) => ({ kind: 'salience', theme: k, after: false }))
		.concat(PolitiQuiz.mixedOrder(items).map((item) => ({ kind: 'item', item })))
		.concat(keys.map((k) => ({ kind: 'salience', theme: k, after: true })));
}

export const screenKey = (sc) => (sc.kind === 'item' ? sc.item.id : 'salience.' + sc.theme + (sc.after ? '.after' : ''));

export const scoreOf = (c, key) => (key === 'economy' ? c.quiz : key === 'society' ? c.soc : null);

/* How far a flow has got: every screen that asks something counts, the
   importance questions as much as the survey items — the reader answers
   both, and a count that skipped one kind looked wrong. */
export function progressOf(key, answers) {
	const screens = screensFor(key);
	return { done: screens.filter((sc) => answers[screenKey(sc)] !== undefined).length, total: screens.length };
}
