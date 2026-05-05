/**
 * Symbol Graph — filter pipeline applied before layout.
 *
 * Filters run in declaration order; each returns the surviving nodes/edges.
 * All predicates are pure and allocation-free beyond the output arrays.
 */

import type { AtlasSymbol, AtlasCallEdge, AtlasTypeRelation } from '../../../../src/intelligence/types.js';

export type EdgeTypeFilter = 'calls' | 'type-rels' | 'both';

export interface FilterConfig {
  hideTestFiles: boolean;
  hidePrivateSymbols: boolean;
  edgeType: EdgeTypeFilter;
  confidenceThreshold: number;
}

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  hideTestFiles: false,
  hidePrivateSymbols: false,
  edgeType: 'both',
  confidenceThreshold: 0.5,
};

function isTestFile(filePath: string): boolean {
  return (
    filePath.includes('__tests__') ||
    filePath.endsWith('.test.ts') ||
    filePath.endsWith('.test.tsx') ||
    filePath.endsWith('.spec.ts') ||
    filePath.endsWith('.spec.tsx')
  );
}

function isPrivateSymbol(sym: AtlasSymbol): boolean {
  return sym.name.startsWith('_') || sym.modifiers.includes('private');
}

export function filterSymbols(
  symbols: readonly AtlasSymbol[],
  config: FilterConfig,
): AtlasSymbol[] {
  return symbols.filter((sym) => {
    if (config.hideTestFiles && isTestFile(sym.file_path)) return false;
    if (config.hidePrivateSymbols && isPrivateSymbol(sym)) return false;
    return true;
  });
}

export function filterCallEdges(
  edges: readonly AtlasCallEdge[],
  survivingIds: ReadonlySet<string>,
  config: FilterConfig,
): AtlasCallEdge[] {
  if (config.edgeType === 'type-rels') return [];
  return edges.filter(
    (e) =>
      survivingIds.has(e.caller_symbol_id) &&
      survivingIds.has(e.callee_symbol_id) &&
      e.confidence >= config.confidenceThreshold,
  );
}

export function filterTypeRelations(
  rels: readonly AtlasTypeRelation[],
  survivingIds: ReadonlySet<string>,
  config: FilterConfig,
): AtlasTypeRelation[] {
  if (config.edgeType === 'calls') return [];
  return rels.filter(
    (r) =>
      survivingIds.has(r.from_symbol_id) &&
      survivingIds.has(r.to_symbol_id) &&
      r.confidence >= config.confidenceThreshold,
  );
}
