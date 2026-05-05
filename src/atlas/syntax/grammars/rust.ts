/**
 * Rust grammar.
 * @module atlas/syntax/grammars/rust
 */

import type { Grammar } from '../lexer-state-machine.js';
import type { CoarseExtractor } from '../coarse-ast.js';
import { consumeModifiers } from '../coarse-ast.js';

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

const extractImpl: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'impl') return i;
  // Find first identifier after 'impl' (or after generics).
  let j = i + 1;
  if (tokens[j]?.value === '<') {
    let depth = 0;
    while (j < tokens.length) {
      if (tokens[j]!.value === '<') depth++;
      else if (tokens[j]!.value === '>') {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
      j++;
    }
  }
  if (tokens[j]?.kind === 'identifier') {
    pushNode({ kind: 'impl', name: tokens[j]!.value, start: t.start, end: tokens[j]!.end, line: t.line });
    return j + 1;
  }
  return i + 1;
};

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
