// Every flow is known at build time: each is prerendered.
import { ALL, openThemes } from '$lib/quiz/flow.js';

export const prerender = true;
export const entries = () => [{ theme: ALL }, ...openThemes().map((t) => ({ theme: t.key }))];
