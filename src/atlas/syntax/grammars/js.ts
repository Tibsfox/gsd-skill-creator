/**
 * JavaScript grammar — TS minus type-only keywords; we share the lexer.
 * @module atlas/syntax/grammars/js
 */

import { jsGrammar, tsExtractors } from './ts.js';

export { jsGrammar };
export const jsExtractors = tsExtractors;
