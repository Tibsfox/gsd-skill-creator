/**
 * TypeScript adapter: coarse-AST kind -> atlas SymbolKind.
 * @module intelligence/symbols/extractors/ts
 */

import type { ExtractorAdapter } from '../types.js';

export const tsAdapter: ExtractorAdapter = {
  language: 'ts',
  kindMap: {
    function: 'function',
    method: 'method',
    class: 'class',
    interface: 'interface',
    enum: 'enum',
    'type-alias': 'type',
    variable: 'const',
    import: 'import',
    export: 'export',
    namespace: 'class',
  },
  qualifiedName(node, parentQn) {
    if (parentQn && node.kind === 'method') return `${parentQn}.${node.name}`;
    if (node.parent) return `${node.parent}.${node.name}`;
    return node.name;
  },
};
