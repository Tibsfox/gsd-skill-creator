/**
 * C/C++ adapter.
 * @module intelligence/symbols/extractors/cpp
 */

import type { ExtractorAdapter } from '../types.js';

export const cppAdapter: ExtractorAdapter = {
  language: 'cpp',
  kindMap: {
    function: 'function',
    method: 'method',
    class: 'class',
    struct: 'class',
    enum: 'enum',
    namespace: 'class',
    import: 'import',
  },
  qualifiedName(node, parentQn) {
    if (node.kind === 'method' && node.parent) return `${node.parent}::${node.name}`;
    if (parentQn) return `${parentQn}::${node.name}`;
    return node.name;
  },
};
