/**
 * JavaScript adapter — same coarse-AST shape as TS.
 * @module intelligence/symbols/extractors/js
 */

import type { ExtractorAdapter } from '../types.js';

export const jsAdapter: ExtractorAdapter = {
  language: 'js',
  kindMap: {
    function: 'function',
    method: 'method',
    class: 'class',
    enum: 'enum',
    variable: 'const',
    import: 'import',
    export: 'export',
  },
  qualifiedName(node, parentQn) {
    if (parentQn && node.kind === 'method') return `${parentQn}.${node.name}`;
    if (node.parent) return `${node.parent}.${node.name}`;
    return node.name;
  },
};
