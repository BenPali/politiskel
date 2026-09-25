<!-- A PolitiScales result, from a screenshot read in the browser (it never
     leaves it) or typed by hand. A capture fills the form, which is checked
     and then saved: onsave({ politiscales, flag }) resolves to an error
     sentence, or to nothing when it went through. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	import { toast } from '$lib/toast.svelte.js';
	import { AXES } from '$lib/compass/model.js';
	import { PolitiExtract } from '$lib/model.js';

	/** initial: the percentages already held, if any */
	let { initial = null, onsave } = $props();

	const blank = () => Object.fromEntries(AXES.flatMap((a) => [[a.neg[0], ''], [a.pos[0], '']]));
	let values = $state({ ...blank(), ...(initial || {}) });
	let flag = $state(null);
	let open = $state(false);
	let over = $state(false);
	let feedback = $state(null);
	let busy = $state(false);

	const num = (v) => (v === '' || v === null || v === undefined ? 0 : Number(v));
	const overAxes = $derived(AXES.filter((a) => num(values[a.neg[0]]) + num(values[a.pos[0]]) > 100));

	function read(file) {
		feedback = null;
		const fr = new FileReader();
		fr.onerror = () => toast(L.errUnreadable, { kind: 'error' });
		fr.onload = () => {
			const img = new Image();
			img.onerror = () => toast(L.errNotImage, { kind: 'error' });
			img.onload = () => {
				const c = document.createElement('canvas');
				c.width = img.naturalWidth;
				c.height = img.naturalHeight;
				const ctx = c.getContext('2d', { willReadFrequently: true });
				ctx.drawImage(img, 0, 0);
				let data, res;
				try {
					data = ctx.getImageData(0, 0, c.width, c.height);
				} catch {
					return toast(L.errPixels, { kind: 'error' });
				}
				try {
					res = PolitiExtract.extract(data);
				} catch (e) {
					return toast(L.errExtract(e.message), { kind: 'error' });
				}
				if (!res.ok) return toast(L.errUnrecognised(res.warnings.join(' ; ')), { kind: 'error' });
				/* the flag, re-cropped from the canvas */
				flag = null;
				const g = res.geometry;
				if (g.flag) {
					const fc = document.createElement('canvas');
					fc.width = 160;
					fc.height = Math.max(24, Math.round((160 * g.flag.h) / g.flag.w));
					fc.getContext('2d').drawImage(c, g.flag.x, g.flag.y, g.flag.w, g.flag.h, 0, 0, fc.width, fc.height);
					try {
						flag = fc.toDataURL('image/png');
					} catch {
						flag = null;
					}
				}
				values = { ...blank(), ...Object.fromEntries(AXES.flatMap((a) => [[a.neg[0], res.values[a.neg[0]] ?? 0], [a.pos[0], res.values[a.pos[0]] ?? 0]])) };
				open = true;
				const concepts = PolitiExtract.keyConcepts(res.values, 3).map((x) => L.pole[x.key]).join(' · ');
				feedback = { ok: true, text: L.captureRead(concepts) + (res.warnings.length ? ' (' + res.warnings.join(' ; ') + ')' : '') };
			};
			img.src = fr.result;
		};
		fr.readAsDataURL(file);
	}
	function pick(e) {
		const f = e.currentTarget.files?.[0];
		if (f) read(f);
		e.currentTarget.value = '';
	}
	function dropped(e) {
		e.preventDefault();
		over = false;
		const f = e.dataTransfer?.files?.[0];
		if (f) read(f);
	}

	async function save(e) {
		e.preventDefault();
		if (overAxes.length) return toast(L.errOverHundred(overAxes.map((a) => L.pole[a.neg[0]] + ' / ' + L.pole[a.pos[0]]).join(', ')), { kind: 'error' });
		const politiscales = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Math.max(0, Math.min(100, Math.round(num(v))))]));
		busy = true;
		const err = await onsave({ politiscales, flag });
		busy = false;
		if (err) toast(err, { kind: 'error' });
		else toast(L.captureSaved);
	}
</script>

<div class="capture">
	<label class="dropzone" class:over ondragenter={(e) => { e.preventDefault(); over = true; }} ondragover={(e) => { e.preventDefault(); over = true; }}
		ondragleave={() => (over = false)} ondrop={dropped}>
		<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><rect x="3" y="5" width="22" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2.2" /><circle cx="10" cy="11.5" r="2.4" fill="currentColor" /><path d="M5 21l6-6 4 4 3-3 5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" /></svg>
		<strong>{L.dropTitleShort}</strong>
		<span>{L.dropFormats}</span>
		<input type="file" accept="image/png,image/jpeg,image/webp" onchange={pick} />
	</label>
	{#if feedback}
		<p class={feedback.ok ? 'status' : 'error'} role="status">
			{#if flag && feedback.ok}<img class="flag row" src={flag} alt="" />{/if}{feedback.text}
		</p>
	{/if}

	<details bind:open>
		<summary>{L.manualEntry}</summary>
		<form onsubmit={save}>
			<div class="axes">
				{#each AXES as a (a.neg[0])}
					<div class="axis" class:bad={num(values[a.neg[0]]) + num(values[a.pos[0]]) > 100}>
						<label>{L.pole[a.neg[0]]}<input type="number" min="0" max="100" inputmode="numeric" bind:value={values[a.neg[0]]} /></label>
						<label>{L.pole[a.pos[0]]}<input type="number" min="0" max="100" inputmode="numeric" bind:value={values[a.pos[0]]} /></label>
					</div>
				{/each}
			</div>
			<button type="submit" class="primary" disabled={busy}>{L.captureSave}</button>
		</form>
	</details>
</div>

<style>
	.dropzone { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center;
		min-height: 150px; padding: 20px; border-radius: var(--r-lg); border: 2px dashed var(--border-strong); background: var(--surface-2);
		color: var(--text-2); cursor: pointer; transition: border-color var(--dur-instant), background-color var(--dur-instant); }
	.dropzone:hover, .dropzone.over { border-color: var(--accent); background: var(--accent-soft); }
	.dropzone svg { color: var(--accent); }
	.dropzone strong { color: var(--text); font-size: 15.5px; }
	.dropzone span { font-size: 13.5px; color: var(--text-3); }
	.dropzone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
	.dropzone:focus-within { box-shadow: var(--focus-ring); }
	.status, .error { margin: 12px 0 0; display: flex; align-items: center; gap: 10px; }
	details { margin-top: 14px; }
	summary { cursor: pointer; color: var(--accent-ink); font-weight: 650; min-height: 44px; display: flex; align-items: center; }
	.axes { display: flex; flex-direction: column; gap: 6px; margin: 8px 0 14px; }
	.axis { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 6px 8px; border-radius: var(--r-sm); }
	.axis.bad { background: var(--danger-soft); }
	.axis label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 600; color: var(--text-2); }
	.axis input { width: 100%; box-sizing: border-box; min-height: 40px; font-variant-numeric: tabular-nums; }
</style>
