/**
 * Rust adapter.
 * @module intelligence/symbols/extractors/rust
 */

import type { ExtractorAdapter } from '../types.js';

export const rustAdapter: ExtractorAdapter = {
  language: 'rust',
  kindMap: {
    function: 'function',
    method: 'method',
    struct: 'class',
    enum: 'enum',
    trait: 'interface',
    impl: 'class',
    'type-alias': 'type',
    import: 'import',
    namespace: 'export',
  },
  qualifiedName(node, parentQn) {
    if (node.kind === 'impl') return node.name;
    // For nodes emitted from inside a mod body, node.parent already carries the
    // full qualified prefix (e.g. "outer::inner"). Use it directly so we don't
    // double-prefix when the indexer also threads parentQn.
    if (node.parent) return `${node.parent}::${node.name}`;
    if (parentQn) return `${parentQn}::${node.name}`;
    return node.name;
  },
};
