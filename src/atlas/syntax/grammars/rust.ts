/**
 * Rust grammar.
 * @module atlas/syntax/grammars/rust
 */

import type { Grammar } from '../lexer-state-machine.js';
import type { CoarseExtractor, CoarseNode } from '../coarse-ast.js';
import type { Token } from '../tokenizer.js';
import { consumeModifiers, skipBalanced } from '../coarse-ast.js';

const KEYWORDS = new Set([
  'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else',
  'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop',
  'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static',
  'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while',
  'box', 'do', 'final', 'macro', 'override', 'priv', 'try', 'typeof', 'unsized',
  'virtual', 'yield',
]);

const MODIFIERS = new Set(['pub', 'async', 'unsafe', 'extern', 'const', 'static']);

export const rustGrammar: Grammar = {
  name: 'rust',
  initialState: 'main',
  keywords: KEYWORDS,
  states: {
    main: {
      name: 'main',
      rules: [
        { re: /\/\/\/[^\n]*/, action: { emit: 'doc-comment' } },
        { re: /\/\/[^\n]*/, action: { emit: 'comment' } },
        { re: /\/\*[\s\S]*?\*\//, action: { emit: 'block-comment' } },
        { re: /[ \t]+/, action: { emit: 'whitespace' } },
        { re: /\r?\n/, action: { emit: 'newline' } },
        // Raw string r"..." / r#"..."#
        { re: /r#+"[\s\S]*?"#+/, action: { emit: 'string' } },
        { re: /r"[^"]*"/, action: { emit: 'string' } },
        { re: /b?"(?:[^"\\\n]|\\.)*"/, action: { emit: 'string' } },
        { re: /b?'(?:[^'\\\n]|\\.)*'/, action: { emit: 'string' } },
        // Attribute #[...]
        { re: /#!\[[^\]]*\]/, action: { emit: 'attribute' } },
        { re: /#\[[^\]]*\]/, action: { emit: 'attribute' } },
        { re: /0[xX][0-9a-fA-F_]+(?:[iuf](?:8|16|32|64|128|size))?/, action: { emit: 'number' } },
        { re: /0[bB][01_]+(?:[iuf](?:8|16|32|64|128|size))?/, action: { emit: 'number' } },
        { re: /\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?(?:[iuf](?:8|16|32|64|128|size))?/, action: { emit: 'number' } },
        { re: /[A-Za-z_][\w]*!/, action: { emit: 'builtin' } }, // macro!
        { re: /[A-Za-z_][\w]*/, action: { emit: 'identifier' } },
        { re: /->|=>|::|<<|>>|<=|>=|==|!=|&&|\|\||\.\.=|\.\./, action: { emit: 'operator' } },
        { re: /[+\-*/%=<>!&|^~?]=?/, action: { emit: 'operator' } },
        { re: /[{}()[\];,.:]/, action: { emit: 'punctuation' } },
        { re: /./, action: { emit: 'invalid' } },
      ],
    },
  },
};

const extractFn: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const { mods, declAt } = consumeModifiers(tokens, i, MODIFIERS);
  const t = tokens[declAt];
  if (!t || t.value !== 'fn') return i;
  const nameT = tokens[declAt + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  pushNode({ kind: 'function', name: nameT.value, start: t.start, end: nameT.end, line: t.line, modifiers: mods });
  return declAt + 2;
};

const extractStructEnumTrait: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const { mods, declAt } = consumeModifiers(tokens, i, MODIFIERS);
  const t = tokens[declAt];
  if (!t) return i;
  let kind: 'struct' | 'enum' | 'trait' | undefined;
  if (t.value === 'struct') kind = 'struct';
  else if (t.value === 'enum') kind = 'enum';
  else if (t.value === 'trait') kind = 'trait';
  if (!kind) return i;
  const nameT = tokens[declAt + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  pushNode({ kind, name: nameT.value, start: t.start, end: nameT.end, line: t.line, modifiers: mods });
  return declAt + 2;
};

function skipGenerics(tokens: Token[], j: number): number {
  if (tokens[j]?.value !== '<') return j;
  let depth = 0;
  while (j < tokens.length) {
    if (tokens[j]!.value === '<') depth++;
    else if (tokens[j]!.value === '>') {
      depth--;
      if (depth === 0) return j + 1;
    }
    j++;
  }
  return j;
}

const extractImpl: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'impl') return i;
  // impl [<generics>] (Trait for)? Type [<generics>] (where ...)? { ... }
  let j = skipGenerics(tokens, i + 1);
  // Capture first identifier — could be Trait or Type.
  if (tokens[j]?.kind !== 'identifier') return i + 1;
  let firstIdent = tokens[j]!;
  let firstEnd = j;
  // Walk past `::Path::Segments` and inner generics on the first type ref.
  let k = j + 1;
  while (tokens[k]?.value === '::' && tokens[k + 1]?.kind === 'identifier') {
    firstIdent = tokens[k + 1]!;
    k += 2;
  }
  k = skipGenerics(tokens, k);
  firstEnd = k;
  // If we see `for`, the first identifier was the trait — second is the target type.
  let targetIdent = firstIdent;
  let targetEnd = firstEnd;
  if (tokens[k]?.value === 'for') {
    k++;
    if (tokens[k]?.kind === 'identifier') {
      targetIdent = tokens[k]!;
      let m = k + 1;
      while (tokens[m]?.value === '::' && tokens[m + 1]?.kind === 'identifier') {
        targetIdent = tokens[m + 1]!;
        m += 2;
      }
      m = skipGenerics(tokens, m);
      targetEnd = m;
      k = m;
    }
  }
  // Skip optional `where` clause.
  if (tokens[k]?.value === 'where') {
    while (k < tokens.length && tokens[k]!.value !== '{' && tokens[k]!.value !== ';') k++;
  }
  pushNode({ kind: 'impl', name: targetIdent.value, start: t.start, end: targetIdent.end, line: t.line });
  // Walk into impl body to extract methods.
  if (tokens[k]?.value === '{') {
    const endIdx = skipBalanced(tokens, k, '{', '}');
    let p = k + 1;
    const lastEnd = endIdx > 0 ? endIdx - 1 : tokens.length;
    while (p < lastEnd) {
      const m = tryImplMethod(tokens, p, targetIdent.value);
      if (m) {
        pushNode(m.node);
        p = m.next;
      } else {
        p++;
      }
    }
    return endIdx;
  }
  return targetEnd;
};

function tryImplMethod(
  tokens: Token[],
  i: number,
  parent: string,
): { node: CoarseNode; next: number } | null {
  const { mods, declAt } = consumeModifiers(tokens, i, MODIFIERS);
  const t = tokens[declAt];
  if (!t || t.value !== 'fn') return null;
  const nameT = tokens[declAt + 1];
  if (!nameT || nameT.kind !== 'identifier') return null;
  // Skip name, optional generics, and the parameter list.
  let j = declAt + 2;
  j = skipGenerics(tokens, j);
  if (tokens[j]?.value !== '(') return null;
  const closeParens = skipBalanced(tokens, j, '(', ')');
  // Skip return type / where clauses up to `{` or `;`.
  let k = closeParens;
  while (k < tokens.length && tokens[k]!.value !== '{' && tokens[k]!.value !== ';') k++;
  let next = k;
  if (tokens[k]?.value === '{') next = skipBalanced(tokens, k, '{', '}');
  else if (tokens[k]?.value === ';') next = k + 1;
  return {
    node: {
      kind: 'method',
      name: nameT.value,
      parent,
      start: t.start,
      end: nameT.end,
      line: t.line,
      modifiers: mods,
    },
    next,
  };
}

const extractUse: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'use') return i;
  // Capture path text up to ';' (cheap approximation).
  let j = i + 1;
  let path = '';
  while (j < tokens.length && tokens[j]!.value !== ';' && j < i + 32) {
    path += tokens[j]!.value;
    j++;
  }
  pushNode({ kind: 'import', name: path, start: t.start, end: t.end, line: t.line });
  return j + 1;
};

export const rustExtractors: CoarseExtractor[] = [
  extractUse,
  extractImpl,
  extractStructEnumTrait,
  extractFn,
];
