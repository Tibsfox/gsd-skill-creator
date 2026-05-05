/**
 * TypeScript grammar (also drives JSX awareness when extension is .tsx).
 * @module atlas/syntax/grammars/ts
 */

import type { Grammar } from '../lexer-state-machine.js';
import type { Token } from '../tokenizer.js';
import type { CoarseExtractor, CoarseNode } from '../coarse-ast.js';
import { consumeModifiers, skipBalanced } from '../coarse-ast.js';

const KEYWORDS = new Set([
  'abstract', 'any', 'as', 'async', 'await', 'boolean', 'break', 'case', 'catch',
  'class', 'const', 'continue', 'debugger', 'declare', 'default', 'delete', 'do',
  'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function',
  'get', 'if', 'implements', 'import', 'in', 'instanceof', 'interface', 'is',
  'keyof', 'let', 'namespace', 'new', 'null', 'number', 'of', 'package', 'private',
  'protected', 'public', 'readonly', 'return', 'set', 'static', 'string', 'super',
  'switch', 'this', 'throw', 'true', 'try', 'type', 'typeof', 'undefined', 'var',
  'void', 'while', 'with', 'yield', 'satisfies', 'infer', 'never', 'unknown',
  'object', 'symbol', 'bigint',
]);

const MODIFIERS = new Set([
  'export', 'async', 'static', 'public', 'private', 'protected', 'readonly',
  'abstract', 'declare', 'default',
]);

export const tsGrammar: Grammar = {
  name: 'typescript',
  initialState: 'main',
  keywords: KEYWORDS,
  states: {
    main: {
      name: 'main',
      rules: [
        { re: /\/\/[^\n]*/, action: { emit: 'comment' } },
        { re: /\/\*\*[\s\S]*?\*\//, action: { emit: 'doc-comment' } },
        { re: /\/\*[\s\S]*?\*\//, action: { emit: 'block-comment' } },
        { re: /[ \t]+/, action: { emit: 'whitespace' } },
        { re: /\r?\n/, action: { emit: 'newline' } },
        { re: /"(?:[^"\\\n]|\\.)*"/, action: { emit: 'string' } },
        { re: /'(?:[^'\\\n]|\\.)*'/, action: { emit: 'string' } },
        { re: /`(?:[^`\\$]|\\.|\$(?!\{))*`/, action: { emit: 'template-string' } },
        // Multi-line / interpolated template strings — coarse approximation.
        { re: /`(?:[^`\\]|\\.)*`/, action: { emit: 'template-string' } },
        { re: /0[xX][0-9a-fA-F_]+n?/, action: { emit: 'number' } },
        { re: /0[bB][01_]+n?/, action: { emit: 'number' } },
        { re: /0[oO][0-7_]+n?/, action: { emit: 'number' } },
        { re: /\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?n?/, action: { emit: 'number' } },
        // Decorator
        { re: /@[A-Za-z_$][\w$]*/, action: { emit: 'decorator' } },
        // Identifier / keyword (engine reclassifies via keyword set).
        { re: /[A-Za-z_$][\w$]*/, action: { emit: 'identifier' } },
        // Multi-char operators first, then single.
        { re: /\.{3}|=>|<=|>=|===|!==|==|!=|&&|\|\||\?\?|\+\+|--|\*\*|<<|>>>|>>|\?\.|::/, action: { emit: 'operator' } },
        { re: /[+\-*/%=<>!&|^~?]=?/, action: { emit: 'operator' } },
        { re: /[{}()[\];,.:]/, action: { emit: 'punctuation' } },
        { re: /./, action: { emit: 'invalid' } },
      ],
    },
  },
};

export const jsGrammar: Grammar = { ...tsGrammar, name: 'javascript' };

// ---------------------------------------------------------------------------
// Coarse-AST extractors for TS/JS
// ---------------------------------------------------------------------------

const extractFunction: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const { mods, declAt } = consumeModifiers(tokens, i, MODIFIERS);
  const t = tokens[declAt];
  if (!t || t.value !== 'function') return i;
  const nameT = tokens[declAt + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  pushNode({
    kind: 'function',
    name: nameT.value,
    start: t.start,
    end: nameT.end,
    line: t.line,
    modifiers: mods,
  });
  return declAt + 2;
};

const extractClass: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const { mods, declAt } = consumeModifiers(tokens, i, MODIFIERS);
  const t = tokens[declAt];
  if (!t) return i;
  let kind: 'class' | 'interface' | 'enum' | undefined;
  if (t.value === 'class') kind = 'class';
  else if (t.value === 'interface') kind = 'interface';
  else if (t.value === 'enum') kind = 'enum';
  if (!kind) return i;
  const nameT = tokens[declAt + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  pushNode({
    kind,
    name: nameT.value,
    start: t.start,
    end: nameT.end,
    line: t.line,
    modifiers: mods,
  });
  // Walk into class body to extract methods.
  if (kind === 'class' || kind === 'interface') {
    const openIdx = findOpen(tokens, declAt + 2, '{');
    if (openIdx >= 0) {
      const endIdx = skipBalanced(tokens, openIdx, '{', '}');
      let j = openIdx + 1;
      while (j < endIdx - 1) {
        const m = tryMethod(tokens, j, nameT.value);
        if (m) {
          pushNode(m.node);
          j = m.next;
        } else {
          j++;
        }
      }
      return endIdx;
    }
  }
  return declAt + 2;
};

function findOpen(tokens: Token[], from: number, ch: string): number {
  for (let k = from; k < tokens.length; k++) {
    if (tokens[k]!.value === ch) return k;
    if (tokens[k]!.value === ';') return -1;
  }
  return -1;
}

function tryMethod(
  tokens: Token[],
  i: number,
  parent: string,
): { node: CoarseNode; next: number } | null {
  const { mods, declAt } = consumeModifiers(tokens, i, MODIFIERS);
  const t = tokens[declAt];
  if (!t || t.kind !== 'identifier') return null;
  // Method signature is `name(` or `name<...>(`.
  let j = declAt + 1;
  if (tokens[j]?.value === '<') {
    const c = skipBalanced(tokens, j, '<', '>');
    if (c <= j) return null;
    j = c;
  }
  if (tokens[j]?.value !== '(') return null;
  const close = skipBalanced(tokens, j, '(', ')');
  return {
    node: {
      kind: 'method',
      name: t.value,
      parent,
      start: t.start,
      end: t.end,
      line: t.line,
      modifiers: mods,
    },
    next: close,
  };
}

const extractImport: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'import') return i;
  // Find the source string.
  let j = i + 1;
  let src = '';
  while (j < tokens.length && tokens[j]!.value !== ';' && tokens[j]!.value !== '\n') {
    if (tokens[j]!.kind === 'string') {
      src = tokens[j]!.value.slice(1, -1);
      j++;
      break;
    }
    j++;
  }
  if (!src) return i;
  pushNode({ kind: 'import', name: src, start: t.start, end: t.end, line: t.line });
  return j;
};

const extractExport: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'export') return i;
  // Bare re-export: `export { ... } from '...'` OR fall through to function/class.
  const next = tokens[i + 1];
  if (!next) return i;
  if (next.value === '{' || next.value === '*' || next.value === 'default') {
    // Find 'from'
    let j = i + 1;
    while (j < tokens.length && tokens[j]!.value !== ';' && j < i + 64) {
      if (tokens[j]!.value === 'from' && tokens[j + 1]?.kind === 'string') {
        const m = tokens[j + 1]!.value.slice(1, -1);
        pushNode({ kind: 'export', name: m, start: t.start, end: tokens[j + 1]!.end, line: t.line });
        return j + 2;
      }
      j++;
    }
    pushNode({ kind: 'export', name: '<*>', start: t.start, end: t.end, line: t.line });
    return i + 1;
  }
  return i;
};

const extractVar: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const { mods, declAt } = consumeModifiers(tokens, i, MODIFIERS);
  const t = tokens[declAt];
  if (!t) return i;
  if (t.value !== 'const' && t.value !== 'let' && t.value !== 'var') return i;
  const nameT = tokens[declAt + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  pushNode({
    kind: 'variable',
    name: nameT.value,
    start: t.start,
    end: nameT.end,
    line: t.line,
    modifiers: [...mods, t.value],
  });
  return declAt + 2;
};

const extractTypeAlias: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const { mods, declAt } = consumeModifiers(tokens, i, MODIFIERS);
  const t = tokens[declAt];
  if (!t || t.value !== 'type') return i;
  const nameT = tokens[declAt + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  pushNode({
    kind: 'type-alias',
    name: nameT.value,
    start: t.start,
    end: nameT.end,
    line: t.line,
    modifiers: mods,
  });
  return declAt + 2;
};

export const tsExtractors: CoarseExtractor[] = [
  extractImport,
  extractExport,
  extractClass,
  extractFunction,
  extractTypeAlias,
  extractVar,
];
