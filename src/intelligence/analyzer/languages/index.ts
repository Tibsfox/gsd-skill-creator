/**
 * C02 — Language analyzers barrel.
 *
 * allLanguageAnalyzers: all 8 LanguageAnalyzer instances in the canonical order
 * (per PRD §Language Coverage).
 */

export { typescriptAnalyzer } from './typescript.js';
export { tsxAnalyzer } from './tsx.js';
export { javascriptAnalyzer } from './javascript.js';
export { jsxAnalyzer } from './jsx.js';
export { rustAnalyzer } from './rust.js';
export { pythonAnalyzer } from './python.js';
export { bashAnalyzer } from './bash.js';
export { glslAnalyzer } from './glsl.js';

import { typescriptAnalyzer } from './typescript.js';
import { tsxAnalyzer } from './tsx.js';
import { javascriptAnalyzer } from './javascript.js';
import { jsxAnalyzer } from './jsx.js';
import { rustAnalyzer } from './rust.js';
import { pythonAnalyzer } from './python.js';
import { bashAnalyzer } from './bash.js';
import { glslAnalyzer } from './glsl.js';
import type { LanguageAnalyzer } from '../types.js';

/**
 * All 8 language analyzers in canonical order.
 * Use this when constructing AnalyzerCore.
 */
export const allLanguageAnalyzers: LanguageAnalyzer[] = [
  typescriptAnalyzer,    // .ts
  tsxAnalyzer,           // .tsx
  javascriptAnalyzer,    // .js, .mjs, .cjs
  jsxAnalyzer,           // .jsx
  rustAnalyzer,          // .rs
  pythonAnalyzer,        // .py
  bashAnalyzer,          // .sh, .bash
  glslAnalyzer,          // .glsl, .vert, .frag, .comp
];
