import type { SvelteRequest } from './id.d.ts';
import type { ResolvedOptions } from './options.d.ts';
import type { PluginContext } from 'rollup';
import type { SourceMap } from 'magic-string';

export type TreeShakePreprocess = (
	svelteRequest: SvelteRequest,
	code: string,
	id: string,
	options: Partial<ResolvedOptions>,
	resolve: PluginContext['resolve']
) => Promise<{
	dependencies: string[];
	map: string | object | undefined;
	componentUsage: Record<ComponentId, Props[]>;
}>;

type DYNAMIC = symbol;
export type ComponentId = string;
export type Props = Record<PropName, PropValue> | DYNAMIC;
type PropName = string;
type PropValue = any;
