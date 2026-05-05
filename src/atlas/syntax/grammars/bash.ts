/**
 * Bash grammar — function declarations + sourced scripts.
 * @module atlas/syntax/grammars/bash
 */

import type { Grammar } from '../lexer-state-machine.js';
import type { CoarseExtractor } from '../coarse-ast.js';

const KEYWORDS = new Set([
  'if', 'then', 'else', 'elif', 'fi', 'case', 'esac', 'for', 'while', 'until',
  'do', 'done', 'function', 'return', 'in', 'select', 'time', 'coproc', 'break',
  'continue', 'declare', 'local', 'export', 'readonly', 'unset', 'eval', 'exec',
  'source', 'true', 'false', 'set', 'shift', 'trap',
]);

export const bashGrammar: Grammar = {
  name: 'bash',
  initialState: 'main',
  keywords: KEYWORDS,
  states: {
    main: {
      name: 'main',
      rules: [
        { re: /#[^\n]*/, action: { emit: 'comment' } },
        { re: /[ \t]+/, action: { emit: 'whitespace' } },
        { re: /\r?\n/, action: { emit: 'newline' } },
        // Heredoc start — coarse: match marker line up to newline.
        { re: /<<-?\s*['"]?[A-Za-z_][\w]*['"]?/, action: { emit: 'operator' } },
        { re: /"(?:[^"\\]|\\.)*"/, action: { emit: 'string' } },
        { re: /'[^']*'/, action: { emit: 'string' } },
        { re: /\$\{[^}]*\}/, action: { emit: 'string' } },
        { re: /\$[A-Za-z_][\w]*/, action: { emit: 'identifier' } },
        { re: /\$\d+/, action: { emit: 'identifier' } },
        { re: /\d+/, action: { emit: 'number' } },
        // Bash identifier — allows hyphens in commands like `set -e`.
        { re: /[A-Za-z_][\w]*/, action: { emit: 'identifier' } },
        { re: /&&|\|\||<<|>>|==|!=|<=|>=|=~/, action: { emit: 'operator' } },
        { re: /[+\-*/%=<>!&|^~?]=?/, action: { emit: 'operator' } },
        { re: /[{}()[\];,]/, action: { emit: 'punctuation' } },
        { re: /./, action: { emit: 'invalid' } },
      ],
    },
  },
};

const extractFunction: CoarseExtractor = ({ tokens, i, pushNode }) => {
  // Two shapes: `function name { ... }` or `name() { ... }`.
  const t = tokens[i];
  if (!t) return i;
  if (t.value === 'function') {
    const nameT = tokens[i + 1];
    if (!nameT || nameT.kind !== 'identifier') return i;
    pushNode({ kind: 'function', name: nameT.value, start: t.start, end: nameT.end, line: t.line });
    return i + 2;
  }
  if (t.kind === 'identifier' && tokens[i + 1]?.value === '(' && tokens[i + 2]?.value === ')') {
    pushNode({ kind: 'function', name: t.value, start: t.start, end: t.end, line: t.line });
    return i + 3;
  }
  return i;
};

const extractSource: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t) return i;
  if (t.value === 'source' || t.value === '.') {
    const nameT = tokens[i + 1];
    if (nameT) {
      pushNode({ kind: 'import', name: nameT.value, start: t.start, end: nameT.end, line: t.line });
    }
    return i + 2;
  }
  return i;
};

export const bashExtractors: CoarseExtractor[] = [extractSource, extractFunction];
