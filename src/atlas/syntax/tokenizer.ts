/**
 * Tokenizer interface and shared types.
 * @module atlas/syntax/tokenizer
 *
 * Two parallel streams come out of one pass: HighlightToken (UI-coloring) and
 * the same token sequence drives the coarse-AST walker (symbol extraction).
 */

export type TokenKind =
  | 'keyword'
  | 'identifier'
  | 'string'
  | 'template-string'
  | 'number'
  | 'comment'
  | 'block-comment'
  | 'doc-comment'
  | 'regex'
  | 'operator'
  | 'punctuation'
  | 'whitespace'
  | 'newline'
  | 'indent'
  | 'dedent'
  | 'preprocessor'
  | 'attribute'
  | 'decorator'
  | 'type'
  | 'builtin'
  | 'invalid'
  | 'eof';

export interface Token {
  kind: TokenKind;
  value: string;
  /** Byte offset start (inclusive). */
  start: number;
  /** Byte offset end (exclusive). */
  end: number;
  /** 1-based line number at start. */
  line: number;
  /** 1-based column at start. */
  col: number;
}

export interface Tokenizer {
  language: string;
  tokenize(source: string): Token[];
}
