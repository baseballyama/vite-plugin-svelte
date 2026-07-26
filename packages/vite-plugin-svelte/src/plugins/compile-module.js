/** @import { ModuleIdParser } from '../types/id.js' */
/** @import { ResolvedOptions } from '../types/options.js' */
/** @import { PluginAPI } from '../types/plugin-api.js' */
/** @import { CompileOptions, ModuleCompileOptions } from 'svelte/compiler' */
/** @import { Plugin } from 'vite' */

import { buildModuleIdFilter, buildModuleIdParser } from '../utils/id.js';
import { log, logCompilerWarnings } from '../utils/log.js';
import { toRollupError } from '../utils/error.js';
import { gte } from '../utils/svelte-version.js';

/**
 * @param {PluginAPI} api
 * @returns {Plugin}
 */
export function compileModule(api) {
	/**
	 * @type {ResolvedOptions}
	 */
	let options;
	/**
	 * @type {ModuleIdParser}
	 */
	let idParser;

	/**
	 * @type {ModuleCompileOptions}
	 */
	let staticModuleCompileOptions;

	/**
	 * @type {boolean}
	 */
	let supportsAsync;

	/** @type {Plugin} */
	const plugin = {
		name: 'vite-plugin-svelte:compile-module',
		enforce: 'post',
		async configResolved() {
			options = api.options;
			//@ts-expect-error transform defined below but filter not in type
			plugin.transform.filter = buildModuleIdFilter(options);
			idParser = buildModuleIdParser(options);
			supportsAsync = gte(options.compiler.VERSION, '5.36.0');
			staticModuleCompileOptions = filterNonModuleCompilerOptions(
				options.compilerOptions,
				supportsAsync
			);
		},
		transform: {
			async handler(code, id) {
				const ssr = this.environment.config.consumer === 'server';
				const moduleRequest = idParser(id, ssr);
				if (!moduleRequest) {
					return;
				}
				const filename = moduleRequest.filename;
				/** @type {CompileOptions} */
				const compileOptions = {
					...staticModuleCompileOptions,
					dev: !this.environment.config.isProduction,
					generate: ssr ? 'server' : 'client',
					filename
				};
				const dynamicCompileOptions = await options?.dynamicCompileOptions?.({
					filename,
					code,
					compileOptions
				});
				if (dynamicCompileOptions && log.debug.enabled) {
					log.debug(
						`dynamic compile options for  ${filename}: ${JSON.stringify(dynamicCompileOptions)}`,
						undefined,
						'compileModule'
					);
				}
				const finalCompileOptions = dynamicCompileOptions
					? {
							...compileOptions,
							...dynamicCompileOptions
						}
					: compileOptions;
				if (dynamicCompileOptions?.experimental) {
					finalCompileOptions.experimental = {
						...compileOptions.experimental,
						...dynamicCompileOptions.experimental
					};
				}
				const finalModuleCompileOptions = filterNonModuleCompilerOptions(
					finalCompileOptions,
					supportsAsync
				);
				if (log.debug.enabled) {
					log.debug(
						`final ModuleCompileOptions for  ${filename}: ${JSON.stringify(finalModuleCompileOptions)}`,
						undefined,
						'compileModule'
					);
				}
				try {
					const compileResult = options.compiler.compileModule(code, finalModuleCompileOptions);
					logCompilerWarnings(moduleRequest, compileResult.warnings, options);
					return compileResult.js;
				} catch (e) {
					throw toRollupError(e, options);
				}
			}
		}
	};
	return plugin;
}

/**
 *
 * @param {CompileOptions} compilerOptions
 * @param {boolean} supportsAsync whether the compiler in use knows the experimental async option
 * @return {ModuleCompileOptions}
 */
function filterNonModuleCompilerOptions(compilerOptions, supportsAsync) {
	/** @type {Array<keyof ModuleCompileOptions>} */
	const knownModuleCompileOptionNames = ['dev', 'generate', 'filename', 'rootDir', 'warningFilter'];
	if (supportsAsync) {
		knownModuleCompileOptionNames.push('experimental');
	}
	// not typed but this is temporary until svelte itself ignores CompileOptions passed to compileModule
	const experimentalModuleCompilerOptionNames = ['async'];

	/** @type {ModuleCompileOptions} */
	const filtered = filterByPropNames(compilerOptions, knownModuleCompileOptionNames);
	if (filtered.experimental) {
		filtered.experimental = filterByPropNames(
			filtered.experimental,
			experimentalModuleCompilerOptionNames
		);
	}
	return filtered;
}

/**
 *
 * @param {object} o
 * @param {string[]} names
 * @returns {object}
 */
function filterByPropNames(o, names) {
	return Object.fromEntries(Object.entries(o).filter(([name]) => names.includes(name)));
}
