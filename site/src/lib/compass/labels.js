/* Where each label goes on the compass: the first free spot around its
   point, given every box already taken (markers first, then labels). */

export const overlaps = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

export const CANDIDATES = [
	{ dx: 11, dy: 3.5, anchor: 'start' },
	{ dx: -11, dy: 3.5, anchor: 'end' },
	{ dx: 0, dy: -12, anchor: 'middle' },
	{ dx: 0, dy: 17, anchor: 'middle' },
	{ dx: 11, dy: -8, anchor: 'start' },
	{ dx: -11, dy: -8, anchor: 'end' },
	{ dx: 11, dy: 15, anchor: 'start' },
	{ dx: -11, dy: 15, anchor: 'end' },
	/* wider ring: in dense areas all eight tight positions are taken */
	{ dx: 0, dy: -23, anchor: 'middle' },
	{ dx: 0, dy: 28, anchor: 'middle' },
	{ dx: 22, dy: -18, anchor: 'start' },
	{ dx: -22, dy: -18, anchor: 'end' },
	{ dx: 22, dy: 24, anchor: 'start' },
	{ dx: -22, dy: 24, anchor: 'end' },
	{ dx: 18, dy: -30, anchor: 'start' },
	{ dx: -18, dy: -30, anchor: 'end' }
];

export function placeLabel(item, taken) {
	const w = item.w + 3;
	const h = item.size;
	for (const c of CANDIDATES) {
		let x0 = item.x + c.dx;
		if (c.anchor === 'end') x0 -= w;
		else if (c.anchor === 'middle') x0 -= w / 2;
		const box = { x0, x1: x0 + w, y0: item.y + c.dy - h * 0.8, y1: item.y + c.dy + h * 0.3 };
		if (box.x0 < 52 || box.x1 > 548 || box.y0 < 52 || box.y1 > 548) continue;
		if (taken.some((t) => overlaps(t, box))) continue;
		taken.push(box);
		return c;
	}
	return null;
}

/* A ring's figure: the top of the ring unless something sits there, then
   the first free spot further round. */
export function ringCapSpot(ox, oy, r, text, taken) {
	const w = text.length * 5.5 + 2,
		h = 9;
	for (const deg of [-90, -65, -115, -40, -140, -15, -165, 15, 165, 90]) {
		const a = (deg * Math.PI) / 180;
		const x = ox + (r + 5) * Math.cos(a),
			y = oy + (r + 5) * Math.sin(a) + 3;
		const box = { x0: x - w / 2, x1: x + w / 2, y0: y - h * 0.8, y1: y + h * 0.3 };
		if (box.x0 < 52 || box.x1 > 548 || box.y0 < 52 || box.y1 > 548) continue;
		if (taken.some((t) => overlaps(t, box))) continue;
		taken.push(box);
		return { x, y };
	}
	return { x: ox, y: oy - r - 3 };
}

/* Text width in the chart's own units, measured by the engine with the
   labels' font: estimating from the character count was off by a third on
   short capitalised names. In the chart's 600-unit box one unit is one px of
   this font size. Before the browser runs (prerender), an estimate. */
let ctx = null;
export function textWidth(text, sizePx, weight = 400) {
	if (typeof document === 'undefined') return text.length * sizePx * 0.56;
	ctx ||= document.createElement('canvas').getContext('2d');
	const family = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
	ctx.font = `${weight} ${sizePx}px ${family}`;
	return ctx.measureText(text).width;
}
