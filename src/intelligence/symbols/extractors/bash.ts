/**
 * Bash adapter.
 * @module intelligence/symbols/extractors/bash
 */

import type { ExtractorAdapter } from '../types.js';

export const bashAdapter: ExtractorAdapter = {
  language: 'bash',
  kindMap: {
    function: 'function',
    import: 'import',
  },
  qualifiedName(node) {
    return node.name;
  },
};
