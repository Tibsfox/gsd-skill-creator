/**
 * @module atlas/syntax
 *
 * Public API: tokenize a source string and walk a coarse-AST in one pass.
 * Replaces Prism (highlight) + tree-sitter (parse) with one in-repo primitive.
 */

import type { Token } from './tokenizer.js';
import type { Grammar } from './lexer-state-machine.js';
import { runLexer } from './lexer-state-machine.js';
import type { CoarseAst, CoarseExtractor } from './coarse-ast.js';
import { walkCoarseAst } from './coarse-ast.js';
import { tsGrammar, tsExtractors } from './grammars/ts.js';
import { jsGrammar, jsExtractors } from './grammars/js.js';
import { rustGrammar, rustExtractors } from './grammars/rust.js';
import { pythonGrammar, pythonExtractors } from './grammars/python.js';
import { goGrammar, goExtractors } from './grammars/go.js';
import { javaGrammar, javaExtractors } from './grammars/java.js';
import { cppGrammar, cppExtractors } from './grammars/cpp.js';
import { bashGrammar, bashExtractors } from './grammars/bash.js';
import { glslGrammar, glslExtractors } from './grammars/glsl.js';

export type { Token, TokenKind, Tokenizer } from './tokenizer.js';
export type { Grammar, LexerState, LexerRule, RuleAction } from './lexer-state-machine.js';
export type { CoarseAst, CoarseNode, CoarseNodeKind, CoarseExtractor } from './coarse-ast.js';
export type { HighlightSpan, HighlightClass } from './highlight-tokens.js';
export { runLexer } from './lexer-state-machine.js';
export { walkCoarseAst, significant } from './coarse-ast.js';
export { highlightClass, toHighlightSpans, renderHtml } from './highlight-tokens.js';

export type LanguageId =
  | 'typescript'
  | 'tsx'
  | 'javascript'
  | 'jsx'
  | 'rust'
  | 'python'
  | 'go'
  | 'java'
  | 'cpp'
  | 'c'
  | 'bash'
  | 'sh'
  | 'glsl';

const LANG_TABLE: Record<LanguageId, { grammar: Grammar; extractors: CoarseExtractor[] }> = {
  typescript: { grammar: tsGrammar, extractors: tsExtractors },
  tsx: { grammar: tsGrammar, extractors: tsExtractors },
  javascript: { grammar: jsGrammar, extractors: jsExtractors },
  jsx: { grammar: jsGrammar, extractors: jsExtractors },
  rust: { grammar: rustGrammar, extractors: rustExtractors },
  python: { grammar: pythonGrammar, extractors: pythonExtractors },
  go: { grammar: goGrammar, extractors: goExtractors },
  java: { grammar: javaGrammar, extractors: javaExtractors },
  cpp: { grammar: cppGrammar, extractors: cppExtractors },
  c: { grammar: cppGrammar, extractors: cppExtractors },
  bash: { grammar: bashGrammar, extractors: bashExtractors },
  sh: { grammar: bashGrammar, extractors: bashExtractors },
  glsl: { grammar: glslGrammar, extractors: glslExtractors },
};

export const SUPPORTED_LANGUAGES: readonly LanguageId[] = Object.keys(LANG_TABLE) as LanguageId[];

const EXT_MAP: Record<string, LanguageId> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'jsx',
  rs: 'rust',
  py: 'python',
  pyi: 'python',
  go: 'go',
  java: 'java',
  cc: 'cpp',
  cpp: 'cpp',
  cxx: 'cpp',
  hh: 'cpp',
  hpp: 'cpp',
  hxx: 'cpp',
  h: 'cpp',
  c: 'c',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  glsl: 'glsl',
  vert: 'glsl',
  frag: 'glsl',
  vs: 'glsl',
  fs: 'glsl',
};

export function detectLanguage(filename: string): LanguageId | undefined {
  const dot = filename.lastIndexOf('.');
  if (dot < 0) return undefined;
  const ext = filename.slice(dot + 1).toLowerCase();
  return EXT_MAP[ext];
}

export function tokenize(source: string, language: LanguageId): Token[] {
  const entry = LANG_TABLE[language];
  if (!entry) throw new Error(`unsupported language: ${language}`);
  return runLexer(source, entry.grammar);
}

export function parse(source: string, language: LanguageId): { tokens: Token[]; ast: CoarseAst } {
  const entry = LANG_TABLE[language];
  if (!entry) throw new Error(`unsupported language: ${language}`);
  const tokens = runLexer(source, entry.grammar);
  const ast = walkCoarseAst(language, tokens, entry.extractors);
  return { tokens, ast };
}
