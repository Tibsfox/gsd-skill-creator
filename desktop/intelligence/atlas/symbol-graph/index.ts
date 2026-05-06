/**
 * Symbol Graph — public API.
 * @module desktop/intelligence/atlas/symbol-graph
 */

export { SymbolGraphView } from './symbol-graph.js';
export type { FocusTarget, GraphSelection } from './symbol-graph.js';

export {
  filterSymbols,
  filterCallEdges,
  filterTypeRelations,
  DEFAULT_FILTER_CONFIG,
} from './filter-pipeline.js';
export type { FilterConfig, EdgeTypeFilter } from './filter-pipeline.js';
