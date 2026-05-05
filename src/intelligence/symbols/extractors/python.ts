/**
 * Python adapter.
 * @module intelligence/symbols/extractors/python
 */

import type { ExtractorAdapter } from '../types.js';

export const pythonAdapter: ExtractorAdapter = {
  language: 'python',
  kindMap: {
    function: 'function',
    method: 'method',
    class: 'class',
    import: 'import',
  },
  qualifiedName(node, parentQn) {
    if (parentQn) return `${parentQn}.${node.name}`;
    return node.name;
  },
};
