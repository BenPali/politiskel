<!-- What the questionnaire adds to a profile: the journey from its
     PolitiScales position, then each theme's readings, sub-dimensions and
     declared importance. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { signed } from '$lib/format.js';
	import { PolitiQuiz } from '$lib/model.js';
	import { nearestBase } from '$lib/compass/model.js';

	let { c, country } = $props();

	const show = (v) => (v === null || v === undefined ? L.readingNone : signed(v));
	const pair = (x, y) => '(' + (x === null ? '—' : signed(x)) + ', ' + (y === null ? '—' : signed(y)) + ')';
	const lvl = PolitiQuiz.SCALES.salience.fr;
	const scoreOf = (key) => (key === 'economy' ? c.quiz : key === 'society' ? c.soc : null);

	const themes = $derived(
		PolitiQuiz.THEMES.filter((t) => !t.planned)
			.map((theme) => {
				const q = scoreOf(theme.key);
				const any = q && (Object.values(q.n).some((n) => n > 0) || q.salience !== null || q.salienceAfter !== null);
				if (!any) return null;
				const items = PolitiQuiz.askedItems(theme.key);
				const count = (r) => items.filter((i) => i.reading === r).length;
				const rows = [
					{ label: L.readingAxis[theme.axis], value: show(q[theme.axis]), note: L.answeredOf(q.n[theme.axis], count(theme.axis)) + ' · ' + L.readingNotes[theme.axis] },
					...theme.dims.map((d) => ({ label: L.dims[d], value: show(q.dims[d]), sub: true }))
				];
				if (theme.key === 'economy') {
					rows.push(
						{ label: L.readingProtectionism, value: show(q.protectionism), note: L.answeredOf(q.n.protectionism, count('protectionism')) + ' · ' + L.readingNotes.protectionism },
						{ label: L.readingClass, value: q.class === null && q.n.class ? L.readingClassIncomplete(q.n.class) : show(q.class), note: q.class === null ? null : L.readingNotes.class },
						{ label: L.readingConflict, value: show(q.conflict), note: L.answeredOf(q.n.conflict, count('conflict')) + ' · ' + L.readingNotes.conflict },
						{ label: L.readingLabour, value: show(q.labour), note: L.answeredOf(q.n.labour, count('labour')) + ' · ' + L.readingNotes.labour }
					);
				}
				const salience =
					q.salience !== null && q.salienceAfter !== null
						? L.salienceMoved(lvl[q.salience], lvl[q.salienceAfter], q.salienceAfter - q.salience)
						: q.salience !== null || q.salienceAfter !== null
							? L.salienceOf(lvl[q.salience !== null ? q.salience : q.salienceAfter])
							: null;
				return { key: theme.key, name: L.themes[theme.key].name, rows, salience };
			})
			.filter(Boolean)
	);
	const journey = $derived.by(() => {
		if (c.native && (c.x !== null || c.y !== null)) return L.journeyNative(pair(c.x, c.y));
		if (!c.from) return null;
		const was = nearestBase(c.from.x, c.from.y, country), now = nearestBase(c.x, c.y, country);
		return L.journey(pair(c.from.x, c.from.y), pair(c.x, c.y), was.name, now.name);
	});
</script>

<div class="readings">
	<h3>{L.readingsTitle}</h3>
	{#if journey}<p class="journey">{journey}</p>{/if}
	{#each themes as t (t.key)}
		{#if themes.length > 1}<h4 class="readings-theme">{t.name}</h4>{/if}
		<dl>
			{#each t.rows as r}
				<dt style:padding-left={r.sub ? '12px' : null}>{r.label}</dt>
				<dd>{r.value}{#if r.note}<small> · {r.note}</small>{/if}</dd>
			{/each}
		</dl>
		{#if t.salience}<p class="hint">{t.salience}</p>{/if}
	{/each}
</div>
