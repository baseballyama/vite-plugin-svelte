import type { CompileOptions } from 'svelte/compiler';
import type { ViteDevServer } from 'vite';
// eslint-disable-next-line n/no-missing-import
import { VitePluginSvelteStats } from '../utils/vite-plugin-svelte-stats.js';
import type { Compiler, Options } from '../public.d.ts';

export interface PreResolvedOptions extends Options {
	// these options are non-nullable after resolve
	compilerOptions: CompileOptions;
	compiler: Compiler;
	// extra options
	root: string;
	isBuild: boolean;
	isServe: boolean;
	isDebug: boolean;
	// stable identifier for the requested compiler, used to invalidate the prebundle cache
	// when switching between compilers that report the same VERSION
	compilerSpecifier: string;
}

export interface ResolvedOptions extends PreResolvedOptions {
	isProduction: boolean;
	server?: ViteDevServer;
	stats?: VitePluginSvelteStats;
}
