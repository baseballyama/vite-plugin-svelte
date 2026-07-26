import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import * as svelte from 'svelte/compiler';
import { resolveCompiler } from '../src/utils/compiler.js';

const root = path.resolve(fileURLToPath(import.meta.url), '../..');

describe('resolveCompiler', () => {
	it('returns svelte/compiler by default', async () => {
		const compiler = await resolveCompiler(undefined, root);
		expect(compiler.VERSION).toBe(svelte.VERSION);
		expect(compiler.compile).toBe(svelte.compile);
	});

	it('returns a passed compiler object as is', async () => {
		const custom = {
			compile: () => {},
			compileModule: () => {},
			preprocess: () => {},
			VERSION: '5.0.0'
		};
		// @ts-expect-error not a full compiler
		expect(await resolveCompiler(custom, root)).toBe(custom);
	});

	it('imports a compiler passed as module specifier', async () => {
		// not identical to the statically imported module here because vite loads that one
		const compiler = await resolveCompiler('svelte/compiler', root);
		expect(compiler.VERSION).toBe(svelte.VERSION);
		expect(compiler.compile('<div>hello</div>', { filename: 'Foo.svelte' }).js.code).toContain(
			'hello'
		);
	});

	it('throws for a compiler object without the required exports', async () => {
		await expect(
			// @ts-expect-error not a compiler
			resolveCompiler({ compile: () => {} }, root)
		).rejects.toThrow(/missing the following exports.*compileModule, preprocess, VERSION/);
	});

	it('throws for a relative specifier whose file does not exist', async () => {
		await expect(resolveCompiler('./does-not-exist-compiler.js', root)).rejects.toThrow(
			/Failed to load the compiler "\.\/does-not-exist-compiler\.js"/
		);
	});

	it('throws for a bare specifier that cannot be resolved as a package', async () => {
		await expect(resolveCompiler('does-not-exist-compiler-xyz', root)).rejects.toThrow(
			/Failed to resolve the compiler "does-not-exist-compiler-xyz"/
		);
	});

	it('throws for a string specifier that resolves but is missing required exports', async () => {
		await expect(
			resolveCompiler('./__tests__/fixtures/compiler/missing-exports.js', root)
		).rejects.toThrow(
			/"\.\/__tests__\/fixtures\/compiler\/missing-exports\.js".*missing the following exports.*compileModule, preprocess, VERSION/
		);
	});
});
