/**
 * Python grammar — indent-sensitive; postProcess synthesizes INDENT/DEDENT.
 * @module atlas/syntax/grammars/python
 */

import type { Grammar } from '../lexer-state-machine.js';
import type { Token } from '../tokenizer.js';
import type { CoarseExtractor } from '../coarse-ast.js';
import { consumeModifiers } from '../coarse-ast.js';

const KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for',
  'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not',
  'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield', 'match',
  'case',
]);

const MODIFIERS = new Set(['async']);

export const pythonGrammar: Grammar = {
  name: 'python',
  initialState: 'main',
  keywords: KEYWORDS,
  states: {
    main: {
      name: 'main',
      rules: [
        { re: /#[^\n]*/, action: { emit: 'comment' } },
        { re: /[ \t]+/, action: { emit: 'whitespace' } },
        { re: /\r?\n/, action: { emit: 'newline' } },
        // Triple-quoted strings (docstrings)
        { re: /"""[\s\S]*?"""/, action: { emit: 'doc-comment' } },
        { re: /'''[\s\S]*?'''/, action: { emit: 'doc-comment' } },
        // f/r/b prefixed strings
        { re: /[fFrRbBuU]?"(?:[^"\\\n]|\\.)*"/, action: { emit: 'string' } },
        { re: /[fFrRbBuU]?'(?:[^'\\\n]|\\.)*'/, action: { emit: 'string' } },
        { re: /@[A-Za-z_][\w.]*/, action: { emit: 'decorator' } },
        { re: /0[xX][0-9a-fA-F_]+/, action: { emit: 'number' } },
        { re: /0[bB][01_]+/, action: { emit: 'number' } },
        { re: /\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?j?/, action: { emit: 'number' } },
        { re: /[A-Za-z_][\w]*/, action: { emit: 'identifier' } },
        { re: /==|!=|<=|>=|->|\*\*|\/\/|<<|>>|:=/, action: { emit: 'operator' } },
        { re: /[+\-*/%=<>!&|^~]=?/, action: { emit: 'operator' } },
        { re: /[{}()[\];,.:@]/, action: { emit: 'punctuation' } },
        { re: /./, action: { emit: 'invalid' } },
      ],
    },
  },
  /**
   * After raw lex: synthesize INDENT/DEDENT by tracking column-of-first-token
   * on each line (columns inferred from leading whitespace tokens).
   */
  postProcess(tokens: Token[]): Token[] {
    const out: Token[] = [];
    const indentStack: number[] = [0];
    let atLineStart = true;
    let lineIndent = 0;

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]!;
      if (atLineStart) {
        if (t.kind === 'whitespace') {
          // Approximate width in columns (tab = 8 like CPython tokenize.py).
          for (const ch of t.value) lineIndent += ch === '\t' ? 8 - (lineIndent % 8) : 1;
          continue;
        }
        if (t.kind === 'newline' || t.kind === 'comment') {
          out.push(t);
          lineIndent = 0;
          continue;
        }
        // First real token on this line — compare indent.
        const top = indentStack[indentStack.length - 1]!;
        if (lineIndent > top) {
          indentStack.push(lineIndent);
          out.push({ kind: 'indent', value: '', start: t.start, end: t.start, line: t.line, col: 1 });
        } else {
          while (indentStack.length > 1 && indentStack[indentStack.length - 1]! > lineIndent) {
            indentStack.pop();
            out.push({ kind: 'dedent', value: '', start: t.start, end: t.start, line: t.line, col: 1 });
          }
        }
        atLineStart = false;
      }
      out.push(t);
      if (t.kind === 'newline') {
        atLineStart = true;
        lineIndent = 0;
      }
    }
    while (indentStack.length > 1) {
      indentStack.pop();
      const last = out[out.length - 1];
      const pos = last ? last.end : 0;
      out.push({ kind: 'dedent', value: '', start: pos, end: pos, line: last?.line ?? 1, col: 1 });
    }
    return out;
  },
};

const extractDef: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const { mods, declAt } = consumeModifiers(tokens, i, MODIFIERS);
  const t = tokens[declAt];
  if (!t || t.value !== 'def') return i;
  const nameT = tokens[declAt + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  pushNode({ kind: 'function', name: nameT.value, start: t.start, end: nameT.end, line: t.line, modifiers: mods });
  return declAt + 2;
};

const extractClass: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'class') return i;
  const nameT = tokens[i + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  pushNode({ kind: 'class', name: nameT.value, start: t.start, end: nameT.end, line: t.line });
  return i + 2;
};

const extractImport: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t) return i;
  if (t.value === 'from') {
    const modT = tokens[i + 1];
    if (!modT) return i;
    pushNode({ kind: 'import', name: modT.value, start: t.start, end: modT.end, line: t.line });
    return i + 2;
  }
  if (t.value === 'import') {
    const modT = tokens[i + 1];
    if (!modT) return i;
    pushNode({ kind: 'import', name: modT.value, start: t.start, end: modT.end, line: t.line });
    return i + 2;
  }
  return i;
};

export const pythonExtractors: CoarseExtractor[] = [extractImport, extractClass, extractDef];
