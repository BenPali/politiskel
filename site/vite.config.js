import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Pages are prerendered; addresses carrying an id fall back to
			// 200.html, which the Rust server hands out for any unknown path.
			adapter: adapter({ fallback: '200.html' })
		})
	],
	server: {
		// the model and the questionnaire live in ../tools, shared with Node
		fs: { allow: ['..'] },
		// in development, the API is the local Rust server. The Host header
		// is kept (changeOrigin false; the string shorthand sets it true):
		// the server refuses a write whose Origin does not match its Host.
		proxy: { '/api': { target: 'http://127.0.0.1:8080', changeOrigin: false } }
	}
});
