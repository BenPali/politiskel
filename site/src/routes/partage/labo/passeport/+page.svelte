<!-- A prototype: one's profile as a political passport, a booklet leafed
     through with a page turn. Four leaves, eight faces: cover, inside
     cover, the data page, two visa pages of badges as stamps, the
     observations, the authority's seal, the back cover. -->
<script>
	import { onMount } from 'svelte';
	import { session } from '$lib/session.svelte.js';
	import { board } from '$lib/compass/board.svelte.js';
	import { COUNTRIES, fromMember, hasPolitiscales } from '$lib/compass/model.js';
	import { guestMember } from '$lib/quiz/answers.svelte.js';
	import { cardData } from '$lib/share/card.js';
	import { COPY, nationalityOf, mrz, docNumber, stampDate, guilloche, waves, stampSvg, sealSvg, stampSlots, seedOf } from '$lib/share/passport.js';
	import { signed } from '$lib/format.js';
	import SignedIn from '$lib/components/SignedIn.svelte';

	let ART = $state(null);
	onMount(async () => {
		ART = (await import('$lib/badges/scenes/index.js')).ART;
	});

	const me = $derived(
		session.me
			? fromMember({ username: session.me.username, me: true, flag: session.me.profile.flag, politiscales: session.me.profile.politiscales, answers: session.me.profile.answers })
			: session.ready ? (guestMember() ? fromMember(guestMember()) : null) : null
	);
	const country = $derived(COUNTRIES.find((c) => c.code === board.country) || COUNTRIES[0]);
	const has = $derived(!!me && (hasPolitiscales(me) || Object.keys(me.answers || {}).length > 0));
	const d = $derived(has ? cardData(me, country) : null);

	const today = new Date();
	const date = stampDate(today);
	const zone = $derived(d ? mrz(d, today) : ['', '']);
	const stamps = $derived(d ? d.badges.slice(0, 12) : []);
	const slots = $derived(d ? stampSlots(6, seedOf(d.alias)) : []);
	const stampArt = $derived(ART && d ? stamps.map((b, i) => stampSvg(ART, b, i, date)) : []);
	const rings = guilloche(150, 200, 130, 16, 9, 1);
	const lines = waves(300, 426, 30, 2);

	/* the booklet: leaves turned so far, and the one turning now, drawn above the rest */
	const LEAVES = 4;
	let turned = $state(0);
	let moving = $state(-1);
	let timer;
	function turn(to) {
		if (to < 0 || to > LEAVES || to === turned) return;
		moving = to > turned ? turned : to;
		turned = to;
		clearTimeout(timer);
		timer = setTimeout(() => (moving = -1), 900);
	}
	const next = () => turn(turned + 1);
	const prev = () => turn(turned - 1);
	const z = (i) => (i === moving ? 20 : i < turned ? i + 1 : LEAVES - i + 1);

	function key(e) {
		if (e.key === 'ArrowRight') next();
		if (e.key === 'ArrowLeft') prev();
	}
	let startX = null, startY = null;
	function down(e) {
		startX = e.clientX;
		startY = e.clientY;
	}
	function up(e) {
		if (startX === null) return;
		const dx = e.clientX - startX, dy = e.clientY - startY;
		startX = null;
		if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) return dx < 0 ? next() : prev();
		if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
			/* a tap: the right half turns forward, the left half back */
			const r = e.currentTarget.getBoundingClientRect();
			if (turned === 0 || e.clientX > r.left + r.width / 2) next();
			else prev();
		}
	}
</script>

<svelte:head><title>{COPY.title} · Politiskel</title></svelte:head>
<svelte:window onkeydown={key} />

{#snippet leather(back)}
	<svg class="bg" viewBox="0 0 300 426" preserveAspectRatio="none" aria-hidden="true">
		<defs>
			<linearGradient id="lth{back ? 'b' : 'f'}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a1418" /><stop offset=".55" stop-color="#5a1d24" /><stop offset="1" stop-color="#2a0e12" /></linearGradient>
			<filter id="grain{back ? 'b' : 'f'}"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="3" seed="7" /><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 0" /><feComposite in2="SourceGraphic" operator="in" /></filter>
		</defs>
		<rect width="300" height="426" fill="url(#lth{back ? 'b' : 'f'})" />
		<rect width="300" height="426" fill="#000" filter="url(#grain{back ? 'b' : 'f'})" opacity=".55" />
		<rect x="12" y="12" width="276" height="402" rx="6" fill="none" stroke="#c9a24a" stroke-width="1" stroke-dasharray="3 3" opacity=".6" />
	</svg>
{/snippet}

{#snippet paper(tint)}
	<svg class="bg" viewBox="0 0 300 426" preserveAspectRatio="none" aria-hidden="true">
		<rect width="300" height="426" fill={tint} />
		<g fill="none" stroke="#7a9ab8" stroke-width=".5" opacity=".35">{#each lines as l}<path d={l} />{/each}</g>
		<g fill="none" stroke="#b58a9a" stroke-width=".5" opacity=".3">{#each rings as r}<path d={r} />{/each}</g>
	</svg>
{/snippet}

<SignedIn guest>
	<p class="lab">Prototype · <a href="/partage">retour au partage</a></p>
	{#if !d}
		<p class="lead">Pas encore de profil : réponds à un questionnaire.</p>
	{:else}
		<div class="stage">
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="book" class:closed={turned === 0} class:end={turned === LEAVES} onpointerdown={down} onpointerup={up} role="group" aria-label={COPY.title}>
				<!-- leaf 0: cover / inside cover -->
				<div class="leaf" class:turned={0 < turned} class:moving={moving === 0} style="z-index: {z(0)}">
					<div class="face front cover">
						{@render leather(false)}
						<div class="cover-in">
							<p class="rep">{COPY.republic}</p>
							<div class="emblem">
								{#if d.flag}<img src={d.flag} alt="" />{/if}
							</div>
							<h1>{COPY.title}</h1>
							<p class="sub">{COPY.passport}</p>
							<svg class="chip" viewBox="0 0 40 28" aria-hidden="true"><rect x="1" y="1" width="38" height="26" rx="4" fill="none" stroke="#c9a24a" stroke-width="1.6" /><circle cx="20" cy="14" r="6" fill="none" stroke="#c9a24a" stroke-width="1.6" /><path d="M1 14 H14 M26 14 H39" stroke="#c9a24a" stroke-width="1.6" /></svg>
						</div>
					</div>
					<div class="face back inside">
						{@render paper('#f3ecdf')}
						<div class="pad">
							<p class="small-cap">{COPY.republic}</p>
							<p class="prose">{COPY.insideLead}</p>
							<p class="note">{COPY.insideNote}</p>
						</div>
					</div>
				</div>

				<!-- leaf 1: data page / visas I -->
				<div class="leaf" class:turned={1 < turned} class:moving={moving === 1} style="z-index: {z(1)}">
					<div class="face front data">
						{@render paper('#eef2f0')}
						<div class="pad">
							<div class="head"><span>{COPY.passport}</span><span>{COPY.republic}</span></div>
							<div class="grid">
								<div class="photo">{#if d.flag}<img src={d.flag} alt="" />{/if}</div>
								<dl>
									<div class="row3">
										<div><dt>{COPY.type}</dt><dd>P</dd></div>
										<div><dt>{COPY.code}</dt><dd>PSK</dd></div>
										<div><dt>{COPY.docNo}</dt><dd>{docNumber(d.alias)}</dd></div>
									</div>
									<div><dt>{COPY.surname}</dt><dd class="name">{d.alias}</dd></div>
									<div><dt>{COPY.nationality}</dt><dd>{nationalityOf(d)}</dd></div>
									<div><dt>{COPY.position}</dt><dd>{d.placed ? 'X ' + signed(Math.round(d.x)) + ' · Y ' + signed(Math.round(d.y)) : '?'}</dd></div>
									<div><dt>{COPY.country}</dt><dd>{d.country}</dd></div>
									<div><dt>{COPY.issued}</dt><dd>{date}</dd></div>
									<div><dt>{COPY.expires}</dt><dd>{COPY.expiresValue}</dd></div>
									<div><dt>{COPY.authority}</dt><dd>{COPY.authorityValue}</dd></div>
								</dl>
							</div>
							<div class="sign"><span>{COPY.signature}</span><b>{d.alias}</b></div>
							<div class="mrz" aria-hidden="true"><div>{zone[0]}</div><div>{zone[1]}</div></div>
							{#if d.flag}<img class="watermark" src={d.flag} alt="" />{/if}
						</div>
					</div>
					<div class="face back visas">
						{@render paper('#f6efe2')}
						<div class="pad">
							<div class="head"><span>{COPY.visas}</span><span>1</span></div>
							{#if !stamps.length}<p class="note">{COPY.noStamp}</p>{/if}
							{#each stamps.slice(0, 6) as b, i (b.key)}
								<div class="stamp" style="left: {slots[i].x}%; top: {slots[i].y}%; width: {slots[i].size}%; transform: translate(-50%, -50%) rotate({slots[i].rot}deg)">{@html stampArt[i] || ''}</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- leaf 2: visas II / observations -->
				<div class="leaf" class:turned={2 < turned} class:moving={moving === 2} style="z-index: {z(2)}">
					<div class="face front visas">
						{@render paper('#f6efe2')}
						<div class="pad">
							<div class="head"><span>{COPY.visas}</span><span>2</span></div>
							{#each stamps.slice(6, 12) as b, i (b.key)}
								<div class="stamp" style="left: {slots[5 - i].x}%; top: {slots[5 - i].y}%; width: {slots[5 - i].size}%; transform: translate(-50%, -50%) rotate({-slots[5 - i].rot}deg)">{@html stampArt[i + 6] || ''}</div>
							{/each}
						</div>
					</div>
					<div class="face back obs">
						{@render paper('#f3ecdf')}
						<div class="pad">
							<div class="head"><span>{COPY.observations}</span><span>3</span></div>
							<p class="prose small">{COPY.obsLead}</p>
							{#if !d.readings.length && !d.axes.length}<p class="note">{COPY.noReading}</p>{/if}
							<ol class="readings">
								{#each [...d.axes, ...d.readings].slice(0, 8) as r (r.k)}
									<li>
										<span class="rl">{r.label}</span>
										<span class="rv">{r.v >= 0 ? r.ends[1] : r.ends[0]} <b>{signed(Math.round(r.v))}</b></span>
										<span class="rbar"><span style="left: {(r.v + 100) / 2}%"></span></span>
									</li>
								{/each}
							</ol>
						</div>
					</div>
				</div>

				<!-- leaf 3: seal / back cover -->
				<div class="leaf" class:turned={3 < turned} class:moving={moving === 3} style="z-index: {z(3)}">
					<div class="face front seal">
						{@render paper('#f6efe2')}
						<div class="pad">
							<div class="head"><span>{COPY.authority}</span><span>4</span></div>
							<div class="seal-art">{@html sealSvg(d)}</div>
							<p class="small-cap">{COPY.consulate}</p>
							<p class="consulate">{d.nearest ? d.nearest.name : COPY.consulateNone}</p>
							{#if d.nearest}<p class="note">{d.nearest.fit}, {d.nearest.d} pts</p>{/if}
							<div class="sign"><span>{COPY.authorityValue}</span><b class="official">Politiskel</b></div>
						</div>
					</div>
					<div class="face back cover">
						{@render leather(true)}
						<div class="cover-in end-in">
							<svg class="chip" viewBox="0 0 40 28" aria-hidden="true"><rect x="1" y="1" width="38" height="26" rx="4" fill="none" stroke="#c9a24a" stroke-width="1.6" /><circle cx="20" cy="14" r="6" fill="none" stroke="#c9a24a" stroke-width="1.6" /></svg>
							<p class="rep">{COPY.backNote}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="pp-nav">
			<button type="button" class="button ghost" onclick={prev} disabled={turned === 0} aria-label={COPY.prev}>←</button>
			<span class="count">{turned} / {LEAVES}</span>
			<button type="button" class="button ghost" onclick={next} disabled={turned === LEAVES} aria-label={COPY.next}>→</button>
		</div>
		<p class="hint">{COPY.hint}</p>
	{/if}
</SignedIn>

<style>
	.lab { margin: 0 0 16px; font-size: 14px; color: var(--text-3); }
	.stage { --w: min(300px, calc((100vw - 32px) / 2)); display: flex; justify-content: center; padding: 36px 0 20px; perspective: 2200px; overflow-x: clip; }
	.book { position: relative; width: calc(var(--w) * 2); height: calc(var(--w) * 1.42); font-size: calc(var(--w) * 0.043);
		transform-style: preserve-3d; transition: transform 0.8s cubic-bezier(0.3, 0.7, 0.2, 1); touch-action: pan-y; user-select: none; cursor: pointer; }
	.book.closed { transform: translateX(-25%); }
	.book.end { transform: translateX(25%); }
	.leaf { position: absolute; left: 50%; top: 0; width: 50%; height: 100%; transform-origin: left center; transform-style: preserve-3d;
		transition: transform 0.9s cubic-bezier(0.45, 0.05, 0.25, 1); }
	.leaf.turned { transform: rotateY(-180deg); }
	.face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; overflow: hidden; border-radius: 0 6px 6px 0;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2), 0 10px 24px rgba(0, 0, 0, 0.18); color: #1f2a33; }
	.face.back { transform: rotateY(180deg); border-radius: 6px 0 0 6px; }
	/* the fold: a shade near the spine, and a light sweep while the page turns */
	.face::after { content: ''; position: absolute; inset: 0; pointer-events: none; }
	.face.front::after { background: linear-gradient(90deg, rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0) 12%); }
	.face.back::after { background: linear-gradient(270deg, rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0) 12%); }
	.leaf.moving .face::before { content: ''; position: absolute; inset: 0; z-index: 3; pointer-events: none;
		background: linear-gradient(90deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.22) 50%, rgba(255, 255, 255, 0.12)); animation: sweep 0.9s ease-in-out both; }
	@keyframes sweep { 0% { opacity: 0; } 45% { opacity: 1; } 100% { opacity: 0; } }
	.bg { position: absolute; inset: 0; width: 100%; height: 100%; }
	.pad { position: absolute; inset: 0; padding: 7% 8%; display: flex; flex-direction: column; }

	/* cover */
	.cover .face, .cover { color: #e9c874; }
	.cover-in { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.8em; text-align: center; padding: 10%; }
	.rep { margin: 0; font-size: 0.95em; letter-spacing: 0.12em; font-weight: 600; color: #d8b35a; text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 220, 140, 0.25); }
	.emblem { width: 44%; aspect-ratio: 1; border-radius: 50%; overflow: hidden; border: 0.25em solid #c9a24a;
		box-shadow: inset 0 0 0 0.2em rgba(0, 0, 0, 0.35), 0 0 0 0.12em rgba(0, 0, 0, 0.4); filter: sepia(0.55) saturate(0.8) brightness(0.9); }
	.emblem img { width: 100%; height: 100%; object-fit: cover; }
	.cover h1 { margin: 0.4em 0 0; font-size: 2.1em; line-height: 1.05; font-weight: 800; color: #e2bd62;
		text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.7), 0 1px 0 rgba(255, 230, 160, 0.35); letter-spacing: 0.02em; }
	.sub { margin: 0; font-size: 1.05em; letter-spacing: 0.3em; color: #c9a24a; }
	.chip { width: 16%; margin-top: 1em; }
	.end-in { justify-content: flex-end; padding-bottom: 14%; }

	/* inner pages */
	.head { display: flex; justify-content: space-between; font-size: 0.72em; letter-spacing: 0.1em; color: #5a6a78; border-bottom: 1px solid rgba(90, 106, 120, 0.3); padding-bottom: 0.4em; margin-bottom: 0.9em; }
	.small-cap { margin: 0 0 0.6em; font-size: 0.78em; letter-spacing: 0.1em; color: #5a6a78; font-weight: 650; }
	.prose { margin: 0.6em 0; font-size: 0.92em; line-height: 1.45; font-family: Georgia, 'Times New Roman', serif; font-style: italic; color: #2f3a44; }
	.prose.small { font-size: 0.82em; }
	.note { margin: 0.8em 0 0; font-size: 0.72em; color: #5a6a78; line-height: 1.4; }

	.grid { display: grid; grid-template-columns: 34% 1fr; gap: 0.8em; }
	.photo { aspect-ratio: 3 / 4; overflow: hidden; border-radius: 0.2em; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2); }
	.photo img { width: 100%; height: 100%; object-fit: cover; }
	dl { margin: 0; display: flex; flex-direction: column; gap: 0.35em; min-width: 0; }
	.row3 { display: grid; grid-template-columns: auto auto 1fr; gap: 0.6em; }
	dt { font-size: 0.56em; color: #5a6a78; letter-spacing: 0.05em; }
	dd { margin: 0; font-size: 0.8em; font-weight: 650; font-family: ui-monospace, 'SF Mono', Menlo, monospace; overflow-wrap: anywhere; line-height: 1.2; }
	dd.name { font-size: 1.05em; font-family: Geist, system-ui, sans-serif; font-weight: 800; }
	.sign { margin-top: auto; display: flex; flex-direction: column; gap: 0.1em; padding-bottom: 0.4em; }
	.sign span { font-size: 0.56em; color: #5a6a78; }
	.sign b { font-family: 'Brush Script MT', 'Snell Roundhand', 'Segoe Script', cursive; font-size: 1.7em; font-weight: 400; color: #1c3a7a; transform: rotate(-4deg); transform-origin: left; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
	.sign b.official { color: #a3262e; }
	.mrz { font-family: ui-monospace, 'OCR B', 'SF Mono', Menlo, monospace; font-size: 0.6em; letter-spacing: 0.02em; line-height: 1.5; color: #1f2a33;
		background: rgba(255, 255, 255, 0.55); margin: 0 -9%; padding: 0.4em 9% 0; white-space: pre; overflow: hidden; }
	.watermark { position: absolute; right: 6%; bottom: 20%; width: 34%; opacity: 0.08; filter: grayscale(1); pointer-events: none; transform: rotate(-12deg); }

	.stamp { position: absolute; mix-blend-mode: multiply; }
	.stamp :global(svg) { display: block; width: 100%; height: auto; }

	.readings { list-style: none; margin: 0.6em 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.55em; }
	.readings li { display: grid; grid-template-columns: 1fr auto; gap: 0.1em 0.5em; font-size: 0.78em; }
	.rl { font-weight: 650; }
	.rv { font-family: Georgia, serif; font-style: italic; color: #2f3a44; text-align: right; }
	.rv b { font-style: normal; font-family: ui-monospace, Menlo, monospace; }
	.rbar { grid-column: 1 / -1; position: relative; height: 0.2em; background: repeating-linear-gradient(90deg, #9aa8b4 0 3px, transparent 3px 6px); }
	.rbar span { position: absolute; top: 50%; width: 0.6em; height: 0.6em; border-radius: 50%; background: #1c3a7a; transform: translate(-50%, -50%); }

	.seal-art { width: 78%; margin: 0.4em auto 0.6em; mix-blend-mode: multiply; }
	.seal-art :global(svg) { display: block; width: 100%; height: auto; }
	.consulate { margin: 0; font-size: 1.15em; font-weight: 800; }

	.pp-nav { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 18px; }
	.pp-nav button { min-width: 44px; min-height: 44px; font-size: 18px; }
	.count { font-size: 14px; color: var(--text-3); font-variant-numeric: tabular-nums; }
	.hint { text-align: center; font-size: 13px; color: var(--text-3); margin: 10px 0 0; }
	.lead { color: var(--text-2); }

	@media (prefers-reduced-motion: reduce) {
		.book, .leaf { transition: none; }
		.leaf.moving .face::before { animation: none; }
	}
</style>
