/**
 * Highlight-token classification helpers.
 * @module atlas/syntax/highlight-tokens
 *
 * Maps the lexer's TokenKind into a smaller set of CSS-friendly classes that
 * the code-view UI can style. Kept deliberately narrow — atlas v1 ships a
 * neutral palette; theme variations live one layer up.
 */

import type { Token, TokenKind } from './tokenizer.js';

export type HighlightClass =
  | 'hl-keyword'
  | 'hl-identifier'
  | 'hl-string'
  | 'hl-number'
  | 'hl-comment'
  | 'hl-regex'
  | 'hl-operator'
  | 'hl-punctuation'
  | 'hl-type'
  | 'hl-builtin'
  | 'hl-preprocessor'
  | 'hl-decorator'
  | 'hl-attribute'
  | 'hl-invalid'
  | 'hl-default';

const MAP: Record<TokenKind, HighlightClass> = {
  keyword: 'hl-keyword',
  identifier: 'hl-identifier',
  string: 'hl-string',
  'template-string': 'hl-string',
  number: 'hl-number',
  comment: 'hl-comment',
  'block-comment': 'hl-comment',
  'doc-comment': 'hl-comment',
  regex: 'hl-regex',
  operator: 'hl-operator',
  punctuation: 'hl-punctuation',
  whitespace: 'hl-default',
  newline: 'hl-default',
  indent: 'hl-default',
  dedent: 'hl-default',
  preprocessor: 'hl-preprocessor',
  attribute: 'hl-attribute',
  decorator: 'hl-decorator',
  type: 'hl-type',
  builtin: 'hl-builtin',
  invalid: 'hl-invalid',
  eof: 'hl-default',
};

export function highlightClass(kind: TokenKind): HighlightClass {
  return MAP[kind] ?? 'hl-default';
}

export interface HighlightSpan {
  cls: HighlightClass;
  start: number;
  end: number;
  text: string;
}

/**
 * Convert the raw token stream into a flat array of highlight spans suitable
 * for incremental rendering. EOF and whitespace are dropped from the output;
 * the consumer pads with raw source between spans.
 */
export function toHighlightSpans(tokens: Token[]): HighlightSpan[] {
  const out: HighlightSpan[] = [];
  for (const t of tokens) {
    if (t.kind === 'eof') continue;
    if (t.kind === 'whitespace' || t.kind === 'newline') continue;
    if (t.kind === 'indent' || t.kind === 'dedent') continue;
    out.push({ cls: highlightClass(t.kind), start: t.start, end: t.end, text: t.value });
  }
  return out;
}

/**
 * Render an HTML string with class-tagged spans. Caller is responsible for the
 * stylesheet. Useful for the code-view UI's static render path.
 */
export function renderHtml(source: string, tokens: Token[]): string {
  const spans = toHighlightSpans(tokens);
  let pos = 0;
  let html = '';
  const escape = (s: string): string =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  for (const sp of spans) {
    if (sp.start > pos) html += escape(source.slice(pos, sp.start));
    html += `<span class="${sp.cls}">${escape(sp.text)}</span>`;
    pos = sp.end;
  }
  if (pos < source.length) html += escape(source.slice(pos));
  return html;
}
