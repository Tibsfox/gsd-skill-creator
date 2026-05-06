/**
 * Go grammar.
 * @module atlas/syntax/grammars/go
 */

import type { Grammar } from '../lexer-state-machine.js';
import type { CoarseExtractor } from '../coarse-ast.js';

const KEYWORDS = new Set([
  'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
  'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface',
  'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type',
  'var', 'true', 'false', 'nil', 'iota',
]);

export const goGrammar: Grammar = {
  name: 'go',
  initialState: 'main',
  keywords: KEYWORDS,
  states: {
    main: {
      name: 'main',
      rules: [
        { re: /\/\/[^\n]*/, action: { emit: 'comment' } },
        { re: /\/\*[\s\S]*?\*\//, action: { emit: 'block-comment' } },
        { re: /[ \t]+/, action: { emit: 'whitespace' } },
        { re: /\r?\n/, action: { emit: 'newline' } },
        { re: /`[^`]*`/, action: { emit: 'string' } }, // raw string
        { re: /"(?:[^"\\\n]|\\.)*"/, action: { emit: 'string' } },
        { re: /'(?:[^'\\\n]|\\.)*'/, action: { emit: 'string' } },
        { re: /0[xX][0-9a-fA-F_]+i?/, action: { emit: 'number' } },
        { re: /\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?i?/, action: { emit: 'number' } },
        { re: /[A-Za-z_][\w]*/, action: { emit: 'identifier' } },
        { re: /<<=|>>=|<-|:=|<<|>>|<=|>=|==|!=|&&|\|\||\.\.\./, action: { emit: 'operator' } },
        { re: /[+\-*/%=<>!&|^~]=?/, action: { emit: 'operator' } },
        { re: /[{}()[\];,.:]/, action: { emit: 'punctuation' } },
        { re: /./, action: { emit: 'invalid' } },
      ],
    },
  },
};

const extractFunc: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'func') return i;
  // Two shapes: `func Name(...)` and `func (recv T) Name(...)`.
  let j = i + 1;
  let parent: string | undefined;
  if (tokens[j]?.value === '(') {
    // Receiver — find ')' then the next identifier is the method name.
    let depth = 1;
    j++;
    while (j < tokens.length && depth > 0) {
      if (tokens[j]!.value === '(') depth++;
      else if (tokens[j]!.value === ')') depth--;
      if (depth > 0 && tokens[j]!.kind === 'identifier') {
        // Best-effort receiver-type capture (last identifier in receiver clause).
        parent = tokens[j]!.value;
      }
      j++;
    }
  }
  const nameT = tokens[j];
  if (!nameT || nameT.kind !== 'identifier') return i;
  pushNode({
    kind: parent ? 'method' : 'function',
    name: nameT.value,
    parent,
    start: t.start,
    end: nameT.end,
    line: t.line,
  });
  return j + 1;
};

const extractType: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'type') return i;
  const nameT = tokens[i + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  // Determine struct/interface/alias.
  const next = tokens[i + 2];
  let kind: 'struct' | 'interface' | 'type-alias' = 'type-alias';
  if (next?.value === 'struct') kind = 'struct';
  else if (next?.value === 'interface') kind = 'interface';
  pushNode({ kind, name: nameT.value, start: t.start, end: nameT.end, line: t.line });
  return i + 2;
};

const extractImport: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'import') return i;
  // Single-line: `import "path"` or grouped: `import ( ... )`.
  const next = tokens[i + 1];
  if (next?.kind === 'string') {
    pushNode({ kind: 'import', name: next.value.slice(1, -1), start: t.start, end: next.end, line: t.line });
    return i + 2;
  }
  if (next?.value === '(') {
    let j = i + 2;
    while (j < tokens.length && tokens[j]!.value !== ')') {
      if (tokens[j]!.kind === 'string') {
        pushNode({ kind: 'import', name: tokens[j]!.value.slice(1, -1), start: tokens[j]!.start, end: tokens[j]!.end, line: tokens[j]!.line });
      }
      j++;
    }
    return j + 1;
  }
  return i + 1;
};

const extractPackage: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'package') return i;
  const nameT = tokens[i + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  pushNode({ kind: 'namespace', name: nameT.value, start: t.start, end: nameT.end, line: t.line });
  return i + 2;
};

export const goExtractors: CoarseExtractor[] = [extractPackage, extractImport, extractType, extractFunc];
