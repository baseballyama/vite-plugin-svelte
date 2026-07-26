/** @import { Compiler } from '../public.js' */

import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

/**
 * node error codes that mean "the specifier could not be found at all", as opposed to
 * an error thrown while evaluating a module that was found. only these should trigger
 * the bare `import()` fallback below.
 */
const RESOLVE_NOT_FOUND_CODES = new Set([
	'MODULE_NOT_FOUND',
	'ERR_MODULE_NOT_FOUND',
	'ERR_PACKAGE_PATH_NOT_EXPORTED'
]);

/**
 * resolve the `compiler` option to a usable compiler module
 *
 * @param {Compiler | string | undefined} compiler
 * @param {string} root
 * @returns {Promise<Compiler>}
 */
export async function resolveCompiler(compiler, root) {
	if (compiler == null) {
		return await import('svelte/compiler');
	}
	if (typeof compiler === 'string') {
		return validateCompiler(await importCompiler(compiler, root), `"${compiler}"`);
	}
	return validateCompiler(compiler, 'the compiler option');
}

/**
 * import a compiler module specifier, preferring resolution from the project root
 *
 * relative (`./`, `../`) and absolute specifiers are imported directly from their path,
 * as `require.resolve` cannot be used for those the way vite-plugin-svelte needs it here.
 * any error while doing so is not a resolution failure and is thrown as-is.
 *
 * bare specifiers are resolved with `require.resolve` from the project root first, so
 * workspace-local installs are found the same way `svelte/compiler` is. only if that
 * resolution fails because the package could not be found at all do we fall back to a
 * plain `import()`, which can succeed for ESM-only packages that `require.resolve` cannot
 * see. errors thrown while loading a specifier that *did* resolve are not resolution
 * failures either and are re-thrown as-is, not swallowed into a "could not resolve" error.
 *
 * @param {string} specifier
 * @param {string} root
 * @returns {Promise<unknown>}
 */
async function importCompiler(specifier, root) {
	if (specifier.startsWith('./') || specifier.startsWith('../') || path.isAbsolute(specifier)) {
		const url = pathToFileURL(path.resolve(root, specifier)).href;
		try {
			return await import(url);
		} catch (e) {
			throw new Error(`Failed to load the compiler "${specifier}" from ${root}.`, { cause: e });
		}
	}

	/** @type {string | undefined} */
	let resolved;
	try {
		resolved = createRequire(path.join(root, 'package.json')).resolve(specifier);
	} catch (e) {
		const code = /** @type {NodeJS.ErrnoException} */ (e)?.code;
		if (code && RESOLVE_NOT_FOUND_CODES.has(code)) {
			try {
				return await import(specifier);
			} catch (e2) {
				throw new Error(
					`Failed to resolve the compiler "${specifier}" from ${root}. Make sure it is installed or reachable from your project root. Note that ESM-only packages can sometimes not be resolved this way even when installed; consider passing the compiler module object directly instead.`,
					{ cause: e2 }
				);
			}
		}
		// some other resolution error (eg a syntax error in the resolved package.json), not a "not found"
		throw new Error(`Failed to resolve the compiler "${specifier}" from ${root}.`, { cause: e });
	}

	try {
		return await import(pathToFileURL(resolved).href);
	} catch (e) {
		throw new Error(`Failed to load the compiler "${specifier}" from ${root}.`, { cause: e });
	}
}

/**
 * ensure the given value provides the exports vite-plugin-svelte needs
 *
 * note: the compiler can be a module namespace object or a plain object wrapping one,
 * so only the types of the required exports are checked here
 *
 * @param {unknown} compiler
 * @param {string} source used to describe where the compiler came from in error messages
 * @returns {Compiler}
 */
function validateCompiler(compiler, source) {
	/** @type {string[]} */
	const missing = [];
	if (compiler == null || typeof compiler !== 'object') {
		missing.push('compile', 'compileModule', 'preprocess', 'VERSION');
	} else {
		const c = /** @type {Record<string, unknown>} */ (compiler);
		for (const fn of ['compile', 'compileModule', 'preprocess']) {
			if (typeof c[fn] !== 'function') {
				missing.push(fn);
			}
		}
		if (typeof c.VERSION !== 'string') {
			missing.push('VERSION');
		}
	}
	if (missing.length > 0) {
		throw new Error(
			`The compiler provided by ${source} is missing the following exports required by vite-plugin-svelte: ${missing.join(', ')}.`
		);
	}
	return /** @type {Compiler} */ (compiler);
}
