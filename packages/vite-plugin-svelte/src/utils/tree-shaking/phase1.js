/**
 * Traverse Svelte component files to collect Svelte component usage information for tree shaking.
 */

import * as svelte from 'svelte/compiler';
import { checkPreprocessDependencies } from '../preprocess.js';
import { mapToRelative } from '../sourcemaps.js';
import { walk } from 'zimmerframe';
import { DYNAMIC } from './shared.js';

/**
 * @param {string} id
 * @param {import ('estree').ImportDeclaration} node
 * @param {import('rollup').PluginContext["resolve"]} resolve
 * @returns {Promise<{ id: import('rollup').ResolvedId | null, symbol: string} | undefined>}
 */
async function resolveImport(id, node, resolve) {
	const { source, specifiers } = node;
	const { value } = source;
	if (typeof value !== 'string' || !value.endsWith('.svelte')) {
		return;
	}

	const resolved = await resolve(value, id);
	const defaultSpecifier = specifiers.find(
		(specifier) => specifier.type === 'ImportDefaultSpecifier'
	);
	if (defaultSpecifier) {
		return { id: resolved, symbol: defaultSpecifier.local.name };
	}
	return undefined;
}

/**
 * @param {string} id
 * @param {string} svelteCode
 * @param {import('rollup').PluginContext["resolve"]} resolve
 * @returns {Promise<Record<import('../../types/tree-shaking.js').ComponentId, import('../../types/tree-shaking.js').Props[]>>}
 */
async function traverse(id, svelteCode, resolve) {
	const ast = svelte.parse(svelteCode, { modern: true });

	/** @type {ReturnType<typeof resolveImport>[]} */
	const resolvedImportPromises = [];

	/**
	 * @param {any} script
	 */
	async function walkScript(script) {
		walk(script, /** @type {{imports: string[]}} */ ({ imports: [] }), {
			ImportDeclaration(/** @type {import('estree').ImportDeclaration} */ node, { next }) {
				resolvedImportPromises.push(resolveImport(id, node, resolve));
				next();
			}
		});
	}

	ast.instance && walkScript(ast.instance);
	ast.module && walkScript(ast.module);

	/** @type {Record<string, import('rollup').ResolvedId>} */
	const symbolToId = {};
	for (const result of await Promise.all(resolvedImportPromises)) {
		if (result && result.id) {
			symbolToId[result.symbol] = result.id;
		}
	}

	/** @type {Record<import('../../types/tree-shaking.js').ComponentId, import('../../types/tree-shaking.js').Props[]>} */
	const result = {};

	walk(
		/** @type {any} */ (ast.fragment),
		{},
		{
			Component(node, { next }) {
				const componentSymbol = node.name;
				/** @type {import('../../types/tree-shaking.js').Props} */
				const props = {};
				for (const attribute of node.attributes) {
					if (attribute.type === 'Attribute') {
						const { name } = attribute;
						for (const value of attribute.value) {
							if (value.type === 'Text') {
								props[name] = value.raw;
							} else if (value.type === 'ExpressionTag') {
								const { expression } = value;
								if (expression.type === 'Literal') {
									props[name] = expression.value;
								} else {
									props[name] = DYNAMIC;
								}
							}
						}
					}
				}

				const componentId = symbolToId[componentSymbol];
				if (componentId) {
					result[componentId.id] ??= [];
					result[componentId.id].push(props);
				}
				next();
			}
		}
	);

	return result;
}

/**
 * @returns {import('../../types/tree-shaking.js').TreeShakePreprocess}
 */
export function createTreeShakePreprocess() {
	/** @type {import('../../types/tree-shaking.js').TreeShakePreprocess} */
	return async function treeShakePreprocess(svelteRequest, code, id, options, resolve) {
		/** @type {string[]} */
		const dependencies = [];
		/** @type {import('svelte/compiler').Warning[]} */
		const warnings = [];

		let preprocessed;
		if (svelteRequest) {
			const { filename } = svelteRequest;
			const preprocessors = options.preprocess;
			if (preprocessors) {
				try {
					preprocessed = await svelte.preprocess(code, preprocessors, { filename }); // full filename here so postcss works
				} catch (e) {
					e.message = `Error while preprocessing ${filename}${e.message ? ` - ${e.message}` : ''}`;
					throw e;
				}

				if (preprocessed.dependencies?.length) {
					const checked = checkPreprocessDependencies(filename, preprocessed.dependencies);
					if (checked.warnings.length) {
						warnings.push(...checked.warnings);
					}
					if (checked.dependencies.length) {
						dependencies.push(...checked.dependencies);
					}
				}
			}
			if (typeof preprocessed?.map === 'object') {
				mapToRelative(preprocessed?.map, filename);
			}
		}

		const finalCode = preprocessed ? preprocessed.code : code;
		const componentUsage = await traverse(id, finalCode, resolve);

		return {
			dependencies,
			map: preprocessed?.map,
			componentUsage
		};
	};
}
