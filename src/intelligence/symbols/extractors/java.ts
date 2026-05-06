/**
 * Java adapter.
 * @module intelligence/symbols/extractors/java
 */

import type { ExtractorAdapter } from '../types.js';

export const javaAdapter: ExtractorAdapter = {
  language: 'java',
  kindMap: {
    function: 'function',
    method: 'method',
    class: 'class',
    interface: 'interface',
    enum: 'enum',
    namespace: 'class', // package decl
    import: 'import',
  },
  qualifiedName(node, parentQn) {
    if (parentQn && node.kind === 'method') return `${parentQn}.${node.name}`;
    if (node.parent) return `${node.parent}.${node.name}`;
    return node.name;
  },
};
