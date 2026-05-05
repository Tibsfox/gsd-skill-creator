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
  },
  qualifiedName(node, parentQn) {
    if (node.kind === 'impl') return node.name;
    if (parentQn) return `${parentQn}::${node.name}`;
    return node.name;
  },
};
