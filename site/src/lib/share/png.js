/* A card's SVG made into a PNG in the browser: nothing leaves it. An SVG
   drawn as an image cannot reach the page's fonts, so Geist is embedded in
   it first, as a data URL, fetched once. */
let fontCss = null;
async function fontFace() {
	if (fontCss !== null) return fontCss;
	try {
		const r = await fetch('/fonts/Geist-normal-latin.woff2');
		const buf = new Uint8Array(await r.arrayBuffer());
		let bin = '';
		for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
		fontCss = `@font-face{font-family:Geist;src:url(data:font/woff2;base64,${btoa(bin)}) format("woff2");font-weight:100 900;}`;
	} catch {
		/* offline: the image falls back on a system font */
		fontCss = '';
	}
	return fontCss;
}

export async function cardPng(svg, w, h) {
	const css = await fontFace();
	const withFont = css ? svg.replace(/^<svg([^>]*)>/, `<svg$1><style>${css}</style>`) : svg;
	const url = URL.createObjectURL(new Blob([withFont], { type: 'image/svg+xml' }));
	try {
		const img = new Image();
		img.decoding = 'async';
		await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = url; });
		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		canvas.getContext('2d').drawImage(img, 0, 0, w, h);
		return await new Promise((ok) => canvas.toBlob(ok, 'image/png'));
	} finally {
		URL.revokeObjectURL(url);
	}
}
