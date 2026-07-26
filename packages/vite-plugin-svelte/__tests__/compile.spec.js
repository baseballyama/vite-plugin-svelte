import { describe, it, expect } from 'vitest';
import * as svelte from 'svelte/compiler';
import { createCompileSvelte } from '../src/utils/compile.js';

describe('createCompileSvelte', () => {
	it('returns function', () => {
		const compileSvelte = createCompileSvelte(svelte);
		expect(typeof compileSvelte).toBe('function');
	});

	describe('compileSvelte', async () => {
		it('removes dangling pure annotations', async () => {
			const code = `<script>
				const x=1;
				console.log('something',/* @__PURE__ */ new Date());
        console.log('something else');
        </script>
				<div>{x}</div>`;
			const compileSvelte = createCompileSvelte(svelte);
			const output = await compileSvelte(
				{
					cssId: 'svelte-xxxxx',
					query: {},
					raw: false,
					ssr: false,
					timestamp: Date.now(),
					id: 'id',
					filename: '/some/File.svelte',
					normalizedFilename: 'some/File.svelte'
				},
				code,
				{}
			);
			expect(output.compiled.js.code).not.toContain('/* @__PURE__ */\n');
		});

		it('detects script lang', async () => {
			const code = `<!-- this file uses typescript -->
			<!--
			<script lang="foo">
			</script>-->
			<script lang="ts" generics="T">
				const x = 1;
				console.log('something',/* @__PURE__ */ new Date());
				console.log('something else');
			</script>
			<div>{x}</div>`;

			const compileSvelte = createCompileSvelte(svelte);
			const output = await compileSvelte(
				{
					cssId: 'svelte-xxxxx',
					query: {},
					raw: false,
					ssr: false,
					timestamp: Date.now(),
					id: 'id',
					filename: '/some/File.svelte',
					normalizedFilename: 'some/File.svelte'
				},
				code,
				{}
			);

			expect(output.lang).toBe('ts');
		});
	});
});
