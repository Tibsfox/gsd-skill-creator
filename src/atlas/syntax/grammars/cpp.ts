/**
 * C++ grammar — templates handled to depth-1 (full template parsing out of scope).
 * @module atlas/syntax/grammars/cpp
 */

import type { Grammar } from '../lexer-state-machine.js';
import type { CoarseExtractor, CoarseNode } from '../coarse-ast.js';
import type { Token } from '../tokenizer.js';
import { skipBalanced } from '../coarse-ast.js';

const KEYWORDS = new Set([
  'alignas', 'alignof', 'and', 'and_eq', 'asm', 'auto', 'bitand', 'bitor',
  'bool', 'break', 'case', 'catch', 'char', 'char8_t', 'char16_t', 'char32_t',
  'class', 'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit',
  'const_cast', 'continue', 'co_await', 'co_return', 'co_yield', 'decltype',
  'default', 'delete', 'do', 'double', 'dynamic_cast', 'else', 'enum',
  'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend', 'goto',
  'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept',
  'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'private', 'protected',
  'public', 'register', 'reinterpret_cast', 'requires', 'return', 'short',
  'signed', 'sizeof', 'static', 'static_assert', 'static_cast', 'struct',
  'switch', 'template', 'this', 'thread_local', 'throw', 'true', 'try',
  'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using', 'virtual',
  'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq', 'override', 'final',
]);

export const cppGrammar: Grammar = {
  name: 'cpp',
  initialState: 'main',
  keywords: KEYWORDS,
  states: {
    main: {
      name: 'main',
      rules: [
        { re: /#\s*[a-z]+(?:[^\n\\]|\\\n)*/, action: { emit: 'preprocessor' } },
        { re: /\/\/[^\n]*/, action: { emit: 'comment' } },
        { re: /\/\*[\s\S]*?\*\//, action: { emit: 'block-comment' } },
        { re: /[ \t]+/, action: { emit: 'whitespace' } },
        { re: /\r?\n/, action: { emit: 'newline' } },
        { re: /R"\([\s\S]*?\)"/, action: { emit: 'string' } }, // raw string
        { re: /[uUL]?"(?:[^"\\\n]|\\.)*"/, action: { emit: 'string' } },
        { re: /[uUL]?'(?:[^'\\\n]|\\.)*'/, action: { emit: 'string' } },
        { re: /\[\[[^\]]*\]\]/, action: { emit: 'attribute' } },
        { re: /0[xX][0-9a-fA-F']+[uUlLfF]*/, action: { emit: 'number' } },
        { re: /\d[\d']*(?:\.\d[\d']*)?(?:[eE][+-]?\d+)?[uUlLfF]*/, action: { emit: 'number' } },
        { re: /[A-Za-z_][\w]*/, action: { emit: 'identifier' } },
        { re: /<<=|>>=|<=>|->\*|\.\*|::|\.\.\.|<<|>>|<=|>=|==|!=|&&|\|\||\+\+|--|->/, action: { emit: 'operator' } },
        { re: /[+\-*/%=<>!&|^~?]=?/, action: { emit: 'operator' } },
        { re: /[{}()[\];,.:]/, action: { emit: 'punctuation' } },
        { re: /./, action: { emit: 'invalid' } },
      ],
    },
  },
};

/**
 * Walk a class/struct body slice [bodyStart+1, bodyEnd) and emit methods
 * (and recursively nested classes) using parentQn as the qualified-name prefix.
 */
function walkClassBody(
  tokens: Token[],
  bodyStart: number,
  parentQn: string,
  pushNode: (n: CoarseNode) => void,
): void {
  const endIdx = skipBalanced(tokens, bodyStart, '{', '}');
  let p = bodyStart + 1;
  const lastEnd = endIdx > 0 ? endIdx - 1 : tokens.length;
  while (p < lastEnd) {
    const tv = tokens[p]!.value;
    if (tv === 'class' || tv === 'struct' || tv === 'union' || tv === 'enum') {
      const innerNameT = tokens[p + 1];
      if (innerNameT && innerNameT.kind === 'identifier') {
        const innerQn = `${parentQn}::${innerNameT.value}`;
        pushNode({
          kind: tv === 'enum' ? 'enum' : tv === 'struct' ? 'struct' : 'class',
          name: innerNameT.value,
          parent: parentQn,
          start: tokens[p]!.start,
          end: innerNameT.end,
          line: tokens[p]!.line,
        });
        // Find body opener for the nested class.
        let q = p + 2;
        while (q < lastEnd && tokens[q]!.value !== '{' && tokens[q]!.value !== ';') q++;
        if (tokens[q]?.value === '{') {
          walkClassBody(tokens, q, innerQn, pushNode);
          p = skipBalanced(tokens, q, '{', '}');
          continue;
        }
      }
    }
    const m = tryCppMethod(tokens, p, lastEnd, parentQn);
    if (m) {
      pushNode(m.node);
      p = m.next;
    } else {
      p++;
    }
  }
}

const extractClassOrStruct: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t) return i;
  let kind: 'class' | 'struct' | 'enum' | undefined;
  if (t.value === 'class') kind = 'class';
  else if (t.value === 'struct') kind = 'struct';
  else if (t.value === 'enum') kind = 'enum';
  if (!kind) return i;
  // Skip optional alignment/specifier between keyword and name.
  const nameT = tokens[i + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  // Heuristic: only emit if followed by `{`, `:`, `;`, or end-of-line context.
  const after = tokens[i + 2];
  const goodFollow = !after || ['{', ':', ';', 'final'].includes(after.value);
  if (!goodFollow) return i;
  pushNode({ kind, name: nameT.value, start: t.start, end: nameT.end, line: t.line });
  // Find the class body opener `{`, skipping base-spec `: public Foo, ...`.
  if (kind === 'class' || kind === 'struct') {
    let j = i + 2;
    while (j < tokens.length && tokens[j]!.value !== '{' && tokens[j]!.value !== ';') j++;
    if (tokens[j]?.value === '{') {
      walkClassBody(tokens, j, nameT.value, pushNode);
      return skipBalanced(tokens, j, '{', '}');
    }
  }
  return i + 2;
};

/**
 * Try to parse an operator overload starting at tokens[j] === 'operator'.
 * Returns { name, parenIdx } where name is e.g. `operator==` and parenIdx
 * is the index of the `(` opening the parameter list, or null if not an overload.
 */
function tryOperatorOverload(
  tokens: Token[],
  j: number,
  bodyEnd: number,
): { name: string; parenIdx: number } | null {
  let k = j + 1;
  const opParts: string[] = [];
  while (k < bodyEnd && opParts.length < 6) {
    const v = tokens[k]!.value;
    // `operator()` — function-call operator: ONLY when no prior op-tokens.
    // `operator[]` — subscript operator: ONLY when no prior op-tokens.
    if (opParts.length === 0) {
      if (v === '(' && tokens[k + 1]?.value === ')') {
        opParts.push('()');
        k += 2;
        continue;
      }
      if (v === '[' && tokens[k + 1]?.value === ']') {
        opParts.push('[]');
        k += 2;
        continue;
      }
    }
    // Parameter-list opener `(` — marks end of operator tokens.
    if (v === '(') break;
    // Structural stop tokens.
    if (v === '{' || v === '}' || v === ';' || v === ':') return null;
    opParts.push(v);
    k++;
  }
  if (tokens[k]?.value !== '(') return null;
  if (opParts.length === 0) return null;
  const name = `operator${opParts.join('')}`;
  return { name, parenIdx: k };
}

function tryCppMethod(
  tokens: Token[],
  i: number,
  bodyEnd: number,
  parent: string,
): { node: CoarseNode; next: number } | null {
  // Pattern: walk forward up to 16 tokens looking for `IDENT(` whose closing
  // paren is followed by `{ | ; | const | noexcept | override | final | =`.
  let j = i;
  for (let look = 0; look < 16 && j < bodyEnd - 1; look++) {
    const v = tokens[j]!.value;
    if (v === '{' || v === '}' || v === ':' || v === ',') return null;
    if (v === ';') return null;

    // Operator overload: `operator <op-tokens> (`
    if (v === 'operator') {
      const op = tryOperatorOverload(tokens, j, bodyEnd);
      if (op) {
        const close = skipBalanced(tokens, op.parenIdx, '(', ')');
        const after = tokens[close];
        if (!after) return null;
        if (
          after.value === '{' ||
          after.value === ';' ||
          after.value === 'const' ||
          after.value === 'noexcept' ||
          after.value === 'override' ||
          after.value === 'final' ||
          after.value === '='
        ) {
          const tOp = tokens[j]!;
          let next = close;
          while (next < bodyEnd && tokens[next]!.value !== '{' && tokens[next]!.value !== ';') next++;
          if (tokens[next]?.value === '{') next = skipBalanced(tokens, next, '{', '}');
          else if (tokens[next]?.value === ';') next = next + 1;
          return {
            node: {
              kind: 'method',
              name: op.name,
              parent,
              start: tOp.start,
              end: tOp.end,
              line: tOp.line,
            },
            next,
          };
        }
      }
      j++;
      continue;
    }

    if (tokens[j]!.kind === 'identifier' && tokens[j + 1]?.value === '(') {
      const close = skipBalanced(tokens, j + 1, '(', ')');
      const after = tokens[close];
      if (!after) return null;
      if (
        after.value === '{' ||
        after.value === ';' ||
        after.value === 'const' ||
        after.value === 'noexcept' ||
        after.value === 'override' ||
        after.value === 'final' ||
        after.value === '='
      ) {
        const tIdent = tokens[j]!;
        if (!/^[A-Za-z_~][\w]*$/.test(tIdent.value)) return null;
        let next = close;
        // Skip post-qualifiers up to `{` or `;`.
        while (next < bodyEnd && tokens[next]!.value !== '{' && tokens[next]!.value !== ';') next++;
        if (tokens[next]?.value === '{') next = skipBalanced(tokens, next, '{', '}');
        else if (tokens[next]?.value === ';') next = next + 1;
        return {
          node: {
            kind: 'method',
            name: tIdent.value,
            parent,
            start: tIdent.start,
            end: tIdent.end,
            line: tIdent.line,
          },
          next,
        };
      }
      // Not a method (probably a function call or initializer); advance past parens.
      j = close;
      continue;
    }
    j++;
  }
  return null;
}

const extractFunction: CoarseExtractor = ({ tokens, i, pushNode }) => {
  // Pattern (very rough): `... IDENT ( ... ) [const|noexcept|override]* {`.
  // Walk forward up to 16 tokens looking for `IDENT(`. Bail if a `;` precedes `{`.
  const start = tokens[i];
  if (!start || start.kind !== 'identifier') return i;
  // Strip leading template <...> — handled at depth 1.
  let j = i;
  if (tokens[j]?.value === 'template') {
    const lt = j + 1;
    if (tokens[lt]?.value === '<') {
      let depth = 0;
      let k = lt;
      while (k < tokens.length) {
        if (tokens[k]!.value === '<') depth++;
        else if (tokens[k]!.value === '>') {
          depth--;
          if (depth === 0) {
            k++;
            break;
          }
        }
        k++;
      }
      j = k;
    }
  }
  // Find `IDENT(` within a short window.
  for (let look = 0; look < 16 && j < tokens.length - 1; look++) {
    if (tokens[j]!.value === ';' || tokens[j]!.value === '{' || tokens[j]!.value === '}') break;
    if (tokens[j]!.kind === 'identifier' && tokens[j + 1]?.value === '(') {
      const close = skipBalanced(tokens, j + 1, '(', ')');
      // Confirm body or specifier follows (not assignment/initializer).
      const after = tokens[close];
      if (!after) return i + 1;
      if (after.value === '{' || after.value === ';' || after.value === 'const' || after.value === 'noexcept' || after.value === 'override' || after.value === 'final' || after.value === '=') {
        const tIdent = tokens[j]!;
        // Skip operator-overload identifiers heuristically (they contain non-letters).
        if (/^[A-Za-z_~][\w]*$/.test(tIdent.value)) {
          pushNode({ kind: 'function', name: tIdent.value, start: tIdent.start, end: tIdent.end, line: tIdent.line });
          return close;
        }
      }
    }
    j++;
  }
  return i;
};

const extractInclude: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.kind !== 'preprocessor') return i;
  const m = t.value.match(/include\s*[<"]([^>"]+)[>"]/);
  if (m) {
    pushNode({ kind: 'import', name: m[1]!, start: t.start, end: t.end, line: t.line });
  }
  return i + 1;
};

const extractNamespace: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'namespace') return i;
  const nameT = tokens[i + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  pushNode({ kind: 'namespace', name: nameT.value, start: t.start, end: nameT.end, line: t.line });
  return i + 2;
};

export const cppExtractors: CoarseExtractor[] = [
  extractInclude,
  extractNamespace,
  extractClassOrStruct,
  extractFunction,
];
