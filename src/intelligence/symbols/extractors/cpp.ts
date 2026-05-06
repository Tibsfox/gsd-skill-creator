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
    // Methods carry a pre-built `parent` that is already the full qualified-name
    // chain (e.g. "Outer::Inner") emitted by walkClassBody. Use it directly.
    if (node.kind === 'method' && node.parent) return `${node.parent}::${node.name}`;
    // Nested classes also carry a `parent` chain; compose with name.
    if ((node.kind === 'class' || node.kind === 'struct' || node.kind === 'enum') && node.parent) {
      return `${node.parent}::${node.name}`;
    }
    if (parentQn) return `${parentQn}::${node.name}`;
    return node.name;
  },
};
