/**
 * Java grammar.
 * @module atlas/syntax/grammars/java
 */

import type { Grammar } from '../lexer-state-machine.js';
import type { CoarseExtractor } from '../coarse-ast.js';
import { consumeModifiers, skipBalanced } from '../coarse-ast.js';

const KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
  'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
  'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
  'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package',
  'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
  'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient',
  'try', 'void', 'volatile', 'while', 'true', 'false', 'null', 'record', 'var',
  'sealed', 'permits', 'yield', 'non-sealed',
]);

const MODIFIERS = new Set([
  'public', 'private', 'protected', 'static', 'final', 'abstract', 'synchronized',
  'native', 'strictfp', 'transient', 'volatile', 'default', 'sealed',
]);

export const javaGrammar: Grammar = {
  name: 'java',
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
        { re: /"""[\s\S]*?"""/, action: { emit: 'string' } }, // text block
        { re: /"(?:[^"\\\n]|\\.)*"/, action: { emit: 'string' } },
        { re: /'(?:[^'\\\n]|\\.)*'/, action: { emit: 'string' } },
        { re: /@[A-Za-z_][\w.]*/, action: { emit: 'attribute' } },
        { re: /0[xX][0-9a-fA-F_]+[lL]?/, action: { emit: 'number' } },
        { re: /\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?[fFdDlL]?/, action: { emit: 'number' } },
        { re: /[A-Za-z_$][\w$]*/, action: { emit: 'identifier' } },
        { re: /->|::|<<=|>>>=|>>=|>>>|>>|<<|<=|>=|==|!=|&&|\|\|/, action: { emit: 'operator' } },
        { re: /[+\-*/%=<>!&|^~?]=?/, action: { emit: 'operator' } },
        { re: /[{}()[\];,.:]/, action: { emit: 'punctuation' } },
        { re: /./, action: { emit: 'invalid' } },
      ],
    },
  },
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
  pushNode({ kind, name: nameT.value, start: t.start, end: nameT.end, line: t.line, modifiers: mods });
  // Walk body for methods.
  let j = declAt + 2;
  while (j < tokens.length && tokens[j]!.value !== '{') j++;
  if (j >= tokens.length) return declAt + 2;
  const endIdx = skipBalanced(tokens, j, '{', '}');
  let k = j + 1;
  while (k < endIdx - 1) {
    const m = tryMethod(tokens, k, nameT.value);
    if (m) {
      pushNode(m);
      k = m._next;
    } else {
      k++;
    }
  }
  return endIdx;
};

function tryMethod(tokens: any[], i: number, parent: string): any {
  const { mods, declAt } = consumeModifiers(tokens, i, MODIFIERS);
  // Skip generics `<...>` and type tokens until we find `IDENT (`.
  let j = declAt;
  // Skip type token(s).
  if (j >= tokens.length || tokens[j].kind !== 'identifier') return null;
  // Method name follows the (possibly qualified) return type.
  // Cheap approximation: scan up to 6 tokens for `IDENT (` pattern.
  for (let lookahead = 0; lookahead < 8 && j < tokens.length - 1; lookahead++) {
    if (tokens[j].kind === 'identifier' && tokens[j + 1]?.value === '(') {
      const close = skipBalanced(tokens, j + 1, '(', ')');
      const t = tokens[j];
      return {
        kind: 'method',
        name: t.value,
        parent,
        start: t.start,
        end: t.end,
        line: t.line,
        modifiers: mods,
        _next: close,
      };
    }
    j++;
  }
  return null;
}

const extractImport: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'import') return i;
  let j = i + 1;
  let path = '';
  while (j < tokens.length && tokens[j]!.value !== ';') {
    path += tokens[j]!.value;
    j++;
  }
  pushNode({ kind: 'import', name: path, start: t.start, end: t.end, line: t.line });
  return j + 1;
};

const extractPackage: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'package') return i;
  let j = i + 1;
  let name = '';
  while (j < tokens.length && tokens[j]!.value !== ';') {
    name += tokens[j]!.value;
    j++;
  }
  pushNode({ kind: 'namespace', name, start: t.start, end: t.end, line: t.line });
  return j + 1;
};

export const javaExtractors: CoarseExtractor[] = [extractPackage, extractImport, extractClass];
