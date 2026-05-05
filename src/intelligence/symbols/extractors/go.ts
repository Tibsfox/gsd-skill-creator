/**
 * Go adapter.
 * @module intelligence/symbols/extractors/go
 */

import type { ExtractorAdapter } from '../types.js';

export const goAdapter: ExtractorAdapter = {
  language: 'go',
  kindMap: {
    function: 'function',
    method: 'method',
    struct: 'class',
    interface: 'interface',
    'type-alias': 'type',
    namespace: 'class', // 'package' decl is namespace-shaped; surface as class for now
    import: 'import',
  },
  qualifiedName(node, parentQn) {
    if (node.parent) return `${node.parent}.${node.name}`;
    if (parentQn) return `${parentQn}.${node.name}`;
    return node.name;
  },
};
