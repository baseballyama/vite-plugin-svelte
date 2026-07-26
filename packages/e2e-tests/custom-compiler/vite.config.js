import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig(() => {
	return {
		plugins: [
			svelte({
				compiler: './custom-compiler.js',
				// a no-op preprocessor so the plugin actually calls compiler.preprocess,
				// which it only does when at least one preprocessor is configured
				preprocess: [{ markup: ({ content }) => ({ code: content }) }]
			})
		],
		build: {
			// make build faster by skipping transforms and minification
			target: 'esnext',
			minify: false
		}
	};
});
