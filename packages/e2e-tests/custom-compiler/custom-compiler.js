import {
	compile as svelteCompile,
	compileModule as svelteCompileModule,
	preprocess as sveltePreprocess
} from 'svelte/compiler';

// a minimal custom compiler that delegates to svelte/compiler
// but replaces placeholders in the source before compiling, preprocessing or
// compiling modules, so tests can assert each of the three entry points was used
export { VERSION } from 'svelte/compiler';

/** @type {typeof svelteCompile} */
export function compile(source, options) {
	return svelteCompile(source.replaceAll('__COMPILER_NAME__', 'custom'), options);
}

/** @type {typeof svelteCompileModule} */
export function compileModule(source, options) {
	return svelteCompileModule(source.replaceAll('__MODULE_COMPILER_NAME__', 'custom'), options);
}

/** @type {typeof sveltePreprocess} */
export function preprocess(source, preprocessor, options) {
	return sveltePreprocess(
		source.replaceAll('__PREPROCESS_MARKER__', 'custom'),
		preprocessor,
		options
	);
}
