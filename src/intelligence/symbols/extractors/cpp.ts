/**
 * C/C++ adapter.
 * @module intelligence/symbols/extractors/cpp
 */

import type { ExtractorAdapter } from '../types.js';

export const cppAdapter: ExtractorAdapter = {
  language: 'cpp',
  kindMap: {
    function: 'function',
    class: 'class',
    struct: 'class',
    enum: 'enum',
    namespace: 'class',
    import: 'import',
  },
  qualifiedName(node, parentQn) {
    if (parentQn) return `${parentQn}::${node.name}`;
    return node.name;
  },
};
