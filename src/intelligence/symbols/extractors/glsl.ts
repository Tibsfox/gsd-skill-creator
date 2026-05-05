/**
 * GLSL adapter.
 * @module intelligence/symbols/extractors/glsl
 */

import type { ExtractorAdapter } from '../types.js';

export const glslAdapter: ExtractorAdapter = {
  language: 'glsl',
  kindMap: {
    function: 'function',
    struct: 'class',
    variable: 'const',
  },
  qualifiedName(node) {
    return node.name;
  },
};
