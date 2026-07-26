/** @import { PreResolvedOptions } from '../src/types/options.js' */
/** @import { ResolvedConfig } from 'vite' */

import { describe, it, expect, vi, afterEach } from 'vitest';
import * as svelte from 'svelte/compiler';

// log.warn.once (src/utils/log.js) is defined via a non-configurable getter, so it can't be
// replaced with vi.spyOn(log.warn, 'once') directly, and the underlying console.warn sink is
// captured into a closure at module-evaluation time, before any spy set up inside a test body
// could take effect. Mocking the whole log module (hoisted above the real import) is the way
// to observe calls to `warn.once` here.
const { onceMock } = vi.hoisted(() => ({ onceMock: vi.fn() }));
vi.mock('../src/utils/log.js', async (importOriginal) => {
	const actual = /** @type {typeof import('../src/utils/log.js')} */ (await importOriginal());
	return {
		...actual,
		log: {
			...actual.log,
			warn: Object.assign(vi.fn(), { once: onceMock })
		}
	};
});

const { resolveOptions } = await import('../src/utils/options.js');

/**
 * builds the minimal PreResolvedOptions resolveOptions() needs to run without touching
 * unrelated warnings, with a swappable compiler so tests can control its VERSION.
 *
 * @param {typeof svelte} compiler
 * @returns {PreResolvedOptions}
 */
function buildPreResolvedOptions(compiler) {
	return /** @type {PreResolvedOptions} */ (
		/** @type {unknown} */ ({
			extensions: ['.svelte'],
			emitCss: true,
			prebundleSvelteLibraries: true,
			compilerSpecifier: 'svelte/compiler',
			compiler,
			root: '/root',
			isBuild: false,
			isServe: true,
			isDebug: false
		})
	);
}

/**
 * @returns {ResolvedConfig}
 */
function buildViteConfig() {
	return /** @type {ResolvedConfig} */ (
		/** @type {unknown} */ ({
			root: '/root',
			isProduction: false,
			server: { hmr: true },
			plugins: []
		})
	);
}

describe('warnOnCompilerVersionMismatch (via resolveOptions)', () => {
	afterEach(() => {
		onceMock.mockClear();
	});

	it('does not warn when the compiler VERSION matches the installed svelte', () => {
		resolveOptions(buildPreResolvedOptions(svelte), buildViteConfig());
		expect(onceMock).not.toHaveBeenCalled();
	});

	it('warns when the compiler VERSION does not match the installed svelte', () => {
		const mismatchedCompiler = /** @type {typeof svelte} */ ({
			...svelte,
			VERSION: '0.0.1-mismatch-test-only'
		});
		resolveOptions(buildPreResolvedOptions(mismatchedCompiler), buildViteConfig());
		expect(onceMock).toHaveBeenCalledTimes(1);
		expect(onceMock.mock.calls[0][0]).toContain('0.0.1-mismatch-test-only');
	});
});
