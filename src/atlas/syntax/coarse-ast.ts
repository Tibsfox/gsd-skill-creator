/**
 * Coarse-AST walker — extracts top-level declaration shapes from the token stream.
 * @module atlas/syntax/coarse-ast
 *
 * NOT a full parser. Only recognizes the shapes the W1 indexer needs:
 *   - function / method declarations
 *   - class / struct / interface / trait / enum declarations
 *   - import / export / use statements
 *   - top-level const/let/var declarations (optional)
 * On unfamiliar shapes the walker advances one token and continues — never throws.
 */

import type { Token } from './tokenizer.js';

export type CoarseNodeKind =
  | 'function'
  | 'method'
  | 'class'
  | 'interface'
  | 'struct'
  | 'enum'
  | 'trait'
  | 'impl'
  | 'import'
  | 'export'
  | 'variable'
  | 'type-alias'
  | 'namespace';

export interface CoarseNode {
  kind: CoarseNodeKind;
  name: string;
  /** Optional parent name (e.g. method's enclosing class). */
  parent?: string;
  /** Source byte offset of the declaration's first significant token. */
  start: number;
  /** Source byte offset just past the declaration head (or block end where cheap). */
  end: number;
  line: number;
  /** Free-form modifiers: 'export', 'async', 'static', 'public', 'pub', etc. */
  modifiers?: string[];
  /**
   * Imported-name bindings for `kind: 'import'` nodes.
   * `original` is the export name in the source module ('default' for default
   * imports; '*' for namespace imports). `local` is the binding in the current
   * file. Empty / undefined for non-import nodes or pure side-effect imports.
   */
  importedNames?: Array<{ local: string; original: string }>;
}

export interface CoarseAst {
  language: string;
  nodes: CoarseNode[];
}

export interface ExtractorContext {
  tokens: Token[];
  i: number;
  pushNode(node: CoarseNode): void;
  /** Advances past balanced brackets/braces/parens starting at current token. */
  skipBalanced(open: string, close: string): number;
}

export type CoarseExtractor = (ctx: ExtractorContext) => number;

/**
 * Filter helper: significant tokens (drops whitespace/comments/newlines).
 */
export function significant(tokens: Token[]): Token[] {
  return tokens.filter(
    (t) =>
      t.kind !== 'whitespace' &&
      t.kind !== 'newline' &&
      t.kind !== 'comment' &&
      t.kind !== 'block-comment' &&
      t.kind !== 'doc-comment' &&
      t.kind !== 'eof',
  );
}

/**
 * Find next index where token matches predicate; -1 if none.
 */
export function findNext(
  tokens: Token[],
  from: number,
  pred: (t: Token) => boolean,
  stopAt?: (t: Token) => boolean,
): number {
  for (let i = from; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (stopAt && stopAt(t)) return -1;
    if (pred(t)) return i;
  }
  return -1;
}

/**
 * Skip balanced delimiter pairs like ( ... ) or { ... }; tokens[from] should
 * be the OPEN delimiter. Returns the index AFTER the matching close, or
 * tokens.length if unbalanced.
 */
export function skipBalanced(
  tokens: Token[],
  from: number,
  open: string,
  close: string,
): number {
  if (from >= tokens.length || tokens[from]!.value !== open) return from;
  let depth = 0;
  for (let i = from; i < tokens.length; i++) {
    const v = tokens[i]!.value;
    if (v === open) depth++;
    else if (v === close) {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return tokens.length;
}

/**
 * Extract coarse-AST nodes by running language-specific extractors over a
 * pre-significant-filtered token sequence.
 */
export function walkCoarseAst(
  language: string,
  tokens: Token[],
  extractors: CoarseExtractor[],
): CoarseAst {
  const sig = significant(tokens);
  const nodes: CoarseNode[] = [];
  let i = 0;
  while (i < sig.length) {
    let advanced = false;
    for (const ex of extractors) {
      const ctx: ExtractorContext = {
        tokens: sig,
        i,
        pushNode(node) {
          nodes.push(node);
        },
        skipBalanced(open, close) {
          return skipBalanced(sig, i, open, close);
        },
      };
      const next = ex(ctx);
      if (next > i) {
        i = next;
        advanced = true;
        break;
      }
    }
    if (!advanced) i++;
  }
  return { language, nodes };
}

/**
 * Common helper: detect modifier tokens before a declaration keyword.
 * Returns { mods, declAt } — declAt is index of the first non-modifier token.
 *
 * Rust visibility qualifiers: after `pub`, if the next token is `(` the helper
 * consumes the balanced paren group and appends the full visibility string
 * (e.g. `'pub(crate)'`, `'pub(super)'`, `'pub(in crate::a)'`) to `mods` so
 * that the following declaration keyword is visible to the caller.
 */
export function consumeModifiers(
  tokens: Token[],
  i: number,
  modSet: Set<string>,
): { mods: string[]; declAt: number } {
  const mods: string[] = [];
  let j = i;
  while (j < tokens.length && tokens[j]!.kind === 'keyword' && modSet.has(tokens[j]!.value)) {
    const kw = tokens[j]!.value;
    mods.push(kw);
    j++;
    // After `pub`, consume an optional `(crate)` / `(super)` / `(in <path>)`
    // visibility qualifier so the declaration keyword is not hidden behind the
    // open-paren token.
    if (kw === 'pub' && j < tokens.length && tokens[j]!.value === '(') {
      // Collect the raw text of the paren group.
      let depth = 0;
      let inner = '';
      while (j < tokens.length) {
        const v = tokens[j]!.value;
        if (v === '(') { depth++; inner += v; j++; }
        else if (v === ')') { depth--; inner += v; j++; if (depth === 0) break; }
        else { inner += v; j++; }
      }
      // Replace the bare 'pub' we already pushed with the qualified form.
      mods[mods.length - 1] = `pub${inner}`;
    }
  }
  return { mods, declAt: j };
}
