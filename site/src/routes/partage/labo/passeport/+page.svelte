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
	/* the guilloche that runs over the photo's edge */
	const overLines = waves(120, 80, 7, 4).map((l, i) => l);

	/* on a phone, one page at a time: `at` counts faces, 0 the cover to 7 the back */
	let narrow = $state(false);
	let at = $state(0);
	onMount(() => {
		const q = matchMedia('(max-width: 699px)');
		const set = () => {
			narrow = q.matches;
			at = narrow ? (turned === 0 ? 0 : turned * 2 - 1) : at;
		};
		set();
		q.addEventListener('change', set);
		return () => q.removeEventListener('change', set);
	});
	/* which half of the spread a face is on: odd faces are left pages */
	const leftSide = $derived(narrow && at % 2 === 1);

	/* The security laminate of the data page: an iridescent film that follows
	   the pointer (or the phone's tilt, when the browser gives it without
	   asking), faint at rest and bright while it moves. Frozen when motion
	   is reduced. */
	let holo = $state({ mx: 0.35, my: 0.3, ang: 125, e: 0 });
	/* the data page itself: the pointer is read in its own box as shown, after the booklet's turns and slides */
	let dataFace = $state(null);
	let calm;
	function shine(mx, my) {
		const ang = Math.round((Math.atan2(my - 0.5, mx - 0.5) * 180) / Math.PI + 180);
		holo = { mx, my, ang, e: 1 };
		clearTimeout(calm);
		calm = setTimeout(() => (holo = { ...holo, e: 0 }), 700);
	}
	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const move = (e) => {
			if (!dataFace) return;
			const r = dataFace.getBoundingClientRect();
			if (!r.width || !r.height) return;
			/* not clamped: the glare's centre stays under the pointer even past the page's edge */
			shine((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
		};
		const tilt = (e) => {
			if (e.gamma === null || e.beta === null) return;
			shine(Math.min(1, Math.max(0, 0.5 + e.gamma / 60)), Math.min(1, Math.max(0, 0.5 + (e.beta - 40) / 60)));
		};
		addEventListener('pointermove', move);
		addEventListener('deviceorientation', tilt);
		return () => {
			removeEventListener('pointermove', move);
			removeEventListener('deviceorientation', tilt);
		};
	});
	/* the film's motif: the compass and the country code, repeated, as a mask */
	const MOTIF = 'url("data:image/svg+xml,' + encodeURIComponent(
		'<svg xmlns="http://www.w3.org/2000/svg" width="46" height="40" viewBox="0 0 46 40">' +
		'<g fill="none" stroke="#000" stroke-width=".9"><rect x="15" y="4" width="16" height="16" rx="1"/><path d="M23 4 V20 M15 12 H31"/><circle cx="23" cy="12" r="10.5"/></g>' +
		'<text x="23" y="34" font-family="Arial, sans-serif" font-size="7.5" font-weight="700" text-anchor="middle" letter-spacing="1.5">PSK</text></svg>'
	) + '")';

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
	const FACES = LEAVES * 2;
	function go(m) {
		if (m < 0 || m >= FACES) return;
		at = m;
		turn(Math.ceil(m / 2));
	}
	const next = () => (narrow ? go(at + 1) : turn(turned + 1));
	const prev = () => (narrow ? go(at - 1) : turn(turned - 1));
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
			if (narrow || turned === 0 || e.clientX > r.left + r.width / 2) next();
			else prev();
		}
	}
</script>

<svelte:head><title>{COPY.title} · Politiskel</title></svelte:head>
<svelte:window onkeydown={key} />

{#snippet leather(back)}
	{@const k = back ? 'b' : 'f'}
	<svg class="bg" viewBox="0 0 300 426" preserveAspectRatio="none" aria-hidden="true">
		<defs>
			<linearGradient id="lth{k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a171c" /><stop offset=".5" stop-color="#561c22" /><stop offset="1" stop-color="#3e1317" /></linearGradient>
			<!-- the grain: fine noise lit from the top left, pebbled like a hide -->
			<filter id="grain{k}" x="0" y="0" width="100%" height="100%">
				<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="3" seed={back ? 5 : 3} result="n" />
				<feDiffuseLighting in="n" surfaceScale="2.2" lighting-color="#ffffff" result="l"><feDistantLight azimuth="225" elevation="48" /></feDiffuseLighting>
				<feColorMatrix in="l" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" />
			</filter>
			<!-- the hide's own unevenness, in broad patches -->
			<filter id="tone{k}" x="0" y="0" width="100%" height="100%">
				<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed={back ? 11 : 2} />
				<feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.22  0 0 0 0 0.22  0 0 0 -1.4 0.9" />
			</filter>
			<!-- worn edges: a lighter rim, eaten by noise -->
			<filter id="wear{k}" x="-5%" y="-5%" width="110%" height="110%">
				<feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" seed="9" result="w" />
				<feColorMatrix in="w" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2" result="m" />
				<feComposite in="SourceGraphic" in2="m" operator="in" />
			</filter>
		</defs>
		<rect width="300" height="426" fill="url(#lth{k})" />
		<rect width="300" height="426" filter="url(#tone{k})" opacity=".22" />
		<rect width="300" height="426" filter="url(#grain{k})" style="mix-blend-mode: multiply" opacity=".75" />
		<rect x="1.5" y="1.5" width="297" height="423" rx="5" fill="none" stroke="#b07a72" stroke-width="3" opacity=".45" filter="url(#wear{k})" />
		<!-- a blind rule and its stitching, pressed into the leather -->
		<rect x="11" y="11" width="278" height="404" rx="5" fill="none" stroke="#2a0b0e" stroke-width="1.2" opacity=".7" />
		<rect x="11" y="12" width="278" height="404" rx="5" fill="none" stroke="#c08a80" stroke-width=".6" opacity=".25" />
		<rect x="17" y="17" width="266" height="392" rx="4" fill="none" stroke="#7a3a38" stroke-width="1.1" stroke-dasharray="4 3" opacity=".8" />
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
			<div class="book" class:narrow class:left={leftSide} class:closed={!narrow && turned === 0} class:end={!narrow && turned === LEAVES} onpointerdown={down} onpointerup={up} role="group" aria-label={COPY.title}>
				<!-- leaf 0: cover / inside cover -->
				<div class="leaf" class:turned={0 < turned} class:moving={moving === 0} style="z-index: {z(0)}">
					<div class="face front cover">
						{@render leather(false)}
						<div class="cover-in">
							<p class="blind union">{COPY.union}</p>
							<p class="blind rep">{COPY.republic}</p>
							<div class="emblem">
								{#if d.flag}<img src={d.flag} alt="" />{/if}
							</div>
							<p class="blind sub">{COPY.passport}</p>
							<svg class="chip" viewBox="0 0 40 28" aria-hidden="true"><g fill="none" stroke-width="1.6"><g stroke="#c89088" opacity=".3" transform="translate(0 .8)"><rect x="1" y="1" width="38" height="26" rx="4" /><circle cx="20" cy="14" r="6" /><path d="M1 14 H14 M26 14 H39" /></g><g stroke="#260a0d" opacity=".8"><rect x="1" y="1" width="38" height="26" rx="4" /><circle cx="20" cy="14" r="6" /><path d="M1 14 H14 M26 14 H39" /></g></g></svg>
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
					<div class="face front data" bind:this={dataFace} style="--mx: {holo.mx}; --my: {holo.my}; --ang: {holo.ang}deg; --e: {holo.e}; --motif: {MOTIF}">
						{@render paper('#eef2f0')}
						<div class="pad">
							<div class="head"><span>{COPY.republic}</span><span>P · PSK</span></div>
							<div class="grid">
								<div class="photo">
									{#if d.flag}<img src={d.flag} alt="" />{/if}
									<svg class="over" viewBox="0 0 120 80" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#6d8aa6" stroke-width=".6" opacity=".55">{#each overLines as l}<path d={l} />{/each}</g></svg>
									<span class="dry" aria-hidden="true"></span>
								</div>
								<div class="sign"><span>{COPY.signature}</span><b>{d.alias}</b></div>
								<dl>
									<div class="row2">
										<div><dt>{COPY.type}</dt><dd>P</dd></div>
										<div><dt>{COPY.code}</dt><dd>PSK</dd></div>
									</div>
									<div><dt>{COPY.docNo}</dt><dd>{docNumber(d.alias)}</dd></div>
									<div><dt>{COPY.surname}</dt><dd class="name">{d.alias}</dd></div>
									<div><dt>{COPY.nationality}</dt><dd>{nationalityOf(d)}</dd></div>
									<div><dt>{COPY.position}</dt><dd>{d.placed ? 'X ' + signed(Math.round(d.x)) + ' · Y ' + signed(Math.round(d.y)) : '?'}</dd></div>
									<div><dt>{COPY.country}</dt><dd>{d.country}</dd></div>
									<div><dt>{COPY.issued}</dt><dd>{date}</dd></div>
									<div><dt>{COPY.expires}</dt><dd>{COPY.expiresValue}</dd></div>
									<div><dt>{COPY.authority}</dt><dd>{COPY.authorityValue}</dd></div>
								</dl>
							</div>
							
							<div class="mrz" aria-hidden="true"><div>{zone[0]}</div><div>{zone[1]}</div></div>
							{#if d.flag}
								<!-- the ghost image: the photo again, small and iridescent, as on real passports -->
								<div class="ghost-photo" aria-hidden="true"><img src={d.flag} alt="" /><span></span></div>
							{/if}
						</div>
						<div class="film" aria-hidden="true"></div>
						<div class="glare" aria-hidden="true"></div>
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
							<div class="head"><span>{COPY.authorityPage}</span><span>4</span></div>
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
							<p class="blind rep small">{COPY.backNote}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="pp-nav">
			<button type="button" class="button ghost" onclick={prev} disabled={narrow ? at === 0 : turned === 0} aria-label={COPY.prev}>←</button>
			<span class="count">{narrow ? at + 1 + ' / ' + FACES : turned + ' / ' + LEAVES}</span>
			<button type="button" class="button ghost" onclick={next} disabled={narrow ? at === FACES - 1 : turned === LEAVES} aria-label={COPY.next}>→</button>
		</div>
		<p class="hint">{COPY.hint}</p>
	{/if}
</SignedIn>

<style>
	.lab { margin: 0 0 16px; font-size: 14px; color: var(--text-3); }
	.stage { --w: min(300px, calc((100vw - 32px) / 2)); --x: 0px; display: flex; justify-content: center; padding: 36px 0 20px; perspective: 2200px; overflow-x: clip; }
	.book { position: relative; flex: none; width: calc(var(--w) * 2); height: calc(var(--w) * 1.42); font-size: calc(var(--w) * 0.043);
		transform-style: preserve-3d; transition: transform 0.8s cubic-bezier(0.3, 0.7, 0.2, 1); touch-action: pan-y; user-select: none; cursor: pointer; }
	.book.closed { transform: translateX(-25%); }
	.book.end { transform: translateX(25%); }
	/* one page on a phone: the book is two pages wide, the stage one, and the book slides to the half on show */
	@media (max-width: 699px) {
		.stage { --w: min(340px, calc(100vw - 32px)); justify-content: flex-start; width: var(--w); margin: 0 auto; }
		.book.narrow { transform: translateX(-50%); }
		.book.narrow.left { transform: translateX(0); }
		.face { box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2), 0 6px 14px rgba(0, 0, 0, 0.14); }
	}
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

	/* cover: leather, everything pressed into it, tone on tone */
	.cover-in { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.7em; text-align: center; padding: 12% 10%; }
	.blind { margin: 0; color: #3c1115; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
		text-shadow: 0 1px 0 rgba(214, 150, 140, 0.28), 0 -1px 1px rgba(0, 0, 0, 0.55); }
	.union { font-size: 0.72em; letter-spacing: 0.2em; }
	.rep { font-size: 1.02em; }
	.rep.small { font-size: 0.72em; text-transform: none; letter-spacing: 0.08em; }
	.sub { font-size: 1.5em; letter-spacing: 0.32em; margin-top: 0.3em; }
	.emblem { width: 52%; aspect-ratio: 3 / 2; margin: 1.1em 0 0.7em; border-radius: 0.2em; overflow: hidden; position: relative;
		box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.6), inset 0 -1px 0 rgba(214, 150, 140, 0.25), 0 1px 0 rgba(214, 150, 140, 0.2), 0 -1px 0 rgba(0, 0, 0, 0.4); }
	.emblem img { width: 100%; height: 100%; object-fit: cover; display: block; filter: grayscale(1) contrast(1.35) brightness(1.05); mix-blend-mode: multiply; opacity: 0.5; }
	.chip { width: 15%; margin-top: 1.2em; }
	.end-in { justify-content: flex-end; padding-bottom: 12%; }

	/* inner pages */
	.head { display: flex; justify-content: space-between; font-size: 0.72em; letter-spacing: 0.1em; color: #5a6a78; border-bottom: 1px solid rgba(90, 106, 120, 0.3); padding-bottom: 0.4em; margin-bottom: 0.9em; }
	.small-cap { margin: 0 0 0.6em; font-size: 0.78em; letter-spacing: 0.1em; color: #5a6a78; font-weight: 650; }
	.prose { margin: 0.6em 0; font-size: 0.92em; line-height: 1.45; font-family: Georgia, 'Times New Roman', serif; font-style: italic; color: #2f3a44; }
	.prose.small { font-size: 0.82em; }
	.note { margin: 0.8em 0 0; font-size: 0.72em; color: #5a6a78; line-height: 1.4; }

	.grid { display: grid; grid-template-columns: 44% 1fr; grid-template-rows: auto 1fr; gap: 0.5em 0.8em; align-items: start; }
	.grid .photo { grid-column: 1; grid-row: 1; }
	.grid dl { grid-column: 2; grid-row: 1 / 3; }
	.grid .sign { grid-column: 1; grid-row: 2; margin-top: 2.2em; }
	/* the flag as the holder's photo: a print with a thin border, the page's guilloche running over its edge, a dry seal biting its corner */
	.photo { position: relative; aspect-ratio: 3 / 2; margin-top: 0.3em; padding: 0.18em; background: #fbfaf6; border-radius: 0.15em; box-shadow: 0 0 0 1px rgba(40, 60, 80, 0.25); }
	.photo img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 0.08em; filter: saturate(0.85); }
	.photo .over { position: absolute; left: -12%; top: -10%; width: 124%; height: 120%; pointer-events: none; }
	.dry { position: absolute; right: -14%; bottom: -26%; width: 44%; aspect-ratio: 1; border-radius: 50%; pointer-events: none;
		background: repeating-conic-gradient(rgba(255, 255, 255, 0.18) 0 6deg, rgba(0, 0, 0, 0.05) 6deg 12deg);
		box-shadow: inset 1px 1px 1px rgba(255, 255, 255, 0.7), inset -1px -1px 2px rgba(0, 0, 0, 0.22), 0 0 0 0.35em rgba(0, 0, 0, 0.03);
		-webkit-mask: radial-gradient(circle, transparent 38%, #000 40%, #000 58%, transparent 60%, transparent 68%, #000 70%);
		mask: radial-gradient(circle, transparent 38%, #000 40%, #000 58%, transparent 60%, transparent 68%, #000 70%); }
	dl { margin: 0; display: flex; flex-direction: column; gap: 0.35em; min-width: 0; }
	.row2 { display: grid; grid-template-columns: auto 1fr; gap: 1em; }
	dt { font-size: 0.5em; color: #5a6a78; letter-spacing: 0.05em; }
	dd { margin: 0; font-size: 0.72em; font-weight: 650; font-family: ui-monospace, 'SF Mono', Menlo, monospace; overflow-wrap: anywhere; line-height: 1.2; }
	dd.name { font-size: 1.05em; font-family: Geist, system-ui, sans-serif; font-weight: 800; }
	.sign { margin-top: auto; display: flex; flex-direction: column; gap: 0.1em; padding-bottom: 0.4em; }
	.sign span { font-size: 0.56em; color: #5a6a78; }
	.sign b { font-family: 'Brush Script MT', 'Snell Roundhand', 'Segoe Script', cursive; font-size: 1.7em; font-weight: 400; color: #1c3a7a; transform: rotate(-4deg); transform-origin: left; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
	.sign b.official { color: #a3262e; }
	.mrz { position: absolute; left: 0; right: 0; bottom: 0; padding-bottom: 0.9em !important; font-family: ui-monospace, 'OCR B', 'SF Mono', Menlo, monospace; font-size: 0.6em; letter-spacing: 0.02em; line-height: 1.5; color: #1f2a33;
		background: rgba(255, 255, 255, 0.55); margin: 0; padding: 0.5em 8% 0; white-space: pre; overflow: hidden; }
	/* the laminate: a film of the motif in rainbow ink, a ghost photo, and a glare that follows the pointer */
	.data .film, .data .glare { position: absolute; inset: 0; z-index: 2; pointer-events: none; transition: opacity 0.6s ease; }
	.data .film {
		background: linear-gradient(var(--ang), #ff5f9e, #ffd35a, #5fffb0, #5fb8ff, #c46bff, #ff5f9e);
		background-size: 220% 220%; background-position: calc(var(--mx) * 100%) calc(var(--my) * 100%);
		-webkit-mask: var(--motif) repeat; mask: var(--motif) repeat; -webkit-mask-size: 2.3em 2em; mask-size: 2.3em 2em;
		mix-blend-mode: color-dodge; opacity: calc(0.1 + var(--e) * 0.24); }
	.data .glare {
		background:
			conic-gradient(from var(--ang) at calc(var(--mx) * 100%) calc(var(--my) * 100%), rgba(255, 90, 160, 0.5), rgba(255, 220, 90, 0.5), rgba(90, 255, 180, 0.5), rgba(90, 170, 255, 0.5), rgba(200, 110, 255, 0.5), rgba(255, 90, 160, 0.5)),
			radial-gradient(circle at calc(var(--mx) * 100%) calc(var(--my) * 100%), rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0) 32%);
		mix-blend-mode: overlay; opacity: calc(0.04 + var(--e) * 0.3);
		-webkit-mask: radial-gradient(circle at calc(var(--mx) * 100%) calc(var(--my) * 100%), #000, transparent 70%);
		mask: radial-gradient(circle at calc(var(--mx) * 100%) calc(var(--my) * 100%), #000, transparent 70%); }
	.ghost-photo { position: absolute; right: 9%; bottom: 17%; width: 22%; aspect-ratio: 3 / 2; pointer-events: none; transform: rotate(-3deg); }
	.ghost-photo img { width: 100%; height: 100%; object-fit: cover; display: block; filter: grayscale(1) contrast(1.6); mix-blend-mode: multiply; opacity: 0.16; }
	.ghost-photo span { position: absolute; inset: 0; background: linear-gradient(var(--ang), #ff7ab0, #ffe07a, #7affc4, #7ac4ff, #d08aff);
		mix-blend-mode: color-dodge; opacity: calc(0.25 + var(--e) * 0.5); transition: opacity 0.6s ease;
		-webkit-mask: linear-gradient(#000, #000); }

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
