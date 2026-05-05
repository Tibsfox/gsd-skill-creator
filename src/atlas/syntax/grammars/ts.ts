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
  // Parse import clause shapes between `import` and the source string:
  //   import 'side-effect';
  //   import D from 'mod';
  //   import * as N from 'mod';
  //   import { a, b as c } from 'mod';
  //   import D, { a, b as c } from 'mod';
  //   import D, * as N from 'mod';
  //   import type { T } from 'mod';   (type-only imports — same shape)
  const importedNames: Array<{ local: string; original: string }> = [];
  let j = i + 1;
  // Skip an optional `type` keyword (TS type-only import).
  if (tokens[j]?.value === 'type') j++;
  let sawClause = false;
  // Default import: `D` (identifier) before `,` or `from`.
  if (tokens[j]?.kind === 'identifier' && tokens[j]!.value !== 'from') {
    importedNames.push({ local: tokens[j]!.value, original: 'default' });
    sawClause = true;
    j++;
    if (tokens[j]?.value === ',') j++;
  }
  // Namespace import: `* as N`.
  if (tokens[j]?.value === '*') {
    j++;
    if (tokens[j]?.value === 'as') j++;
    if (tokens[j]?.kind === 'identifier') {
      importedNames.push({ local: tokens[j]!.value, original: '*' });
      sawClause = true;
      j++;
    }
  }
  // Named imports: `{ a, b as c }`.
  if (tokens[j]?.value === '{') {
    j++;
    while (j < tokens.length && tokens[j]!.value !== '}') {
      // Skip optional `type` modifier on individual specifier.
      if (tokens[j]!.value === 'type') {
        j++;
        continue;
      }
      if (tokens[j]!.kind === 'identifier') {
        const original = tokens[j]!.value;
        let local = original;
        j++;
        if (tokens[j]?.value === 'as') {
          j++;
          if (tokens[j]?.kind === 'identifier') {
            local = tokens[j]!.value;
            j++;
          }
        }
        importedNames.push({ local, original });
        sawClause = true;
      } else {
        j++;
      }
      if (tokens[j]?.value === ',') j++;
    }
    if (tokens[j]?.value === '}') j++;
  }
  // Find the `from` keyword (when there's an import clause) and the source string.
  let src = '';
  let endIdx = j;
  if (sawClause) {
    if (tokens[j]?.value === 'from') j++;
  }
  while (j < tokens.length && tokens[j]!.value !== ';' && j < i + 256) {
    if (tokens[j]!.kind === 'string') {
      src = tokens[j]!.value.slice(1, -1);
      endIdx = j + 1;
      break;
    }
    j++;
  }
  if (!src) return i;
  pushNode({
    kind: 'import',
    name: src,
    start: t.start,
    end: t.end,
    line: t.line,
    importedNames: importedNames.length > 0 ? importedNames : undefined,
  });
  return endIdx;
};

const extractExport: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'export') return i;
  // Re-export forms: `export { ... } from '...'`, `export * from '...'`,
  // `export * as N from '...'`. These carry no `from` when it's a plain
  // `export { x }` (non-re-export) — we only emit import-routing for the
  // `from`-clause variant.
  const next = tokens[i + 1];
  if (!next) return i;
  if (next.value === '{' || next.value === '*') {
    const importedNames: Array<{ local: string; original: string }> = [];
    let j = i + 1;
    // Star re-export: `export * from '...'` or `export * as N from '...'`
    if (tokens[j]?.value === '*') {
      j++;
      if (tokens[j]?.value === 'as') {
        j++;
        if (tokens[j]?.kind === 'identifier') {
          // export * as N from '...' — emit a namespace export binding
          importedNames.push({ local: tokens[j]!.value, original: '*' });
          j++;
        }
      } else {
        // bare star — re-export all; sentinel binding
        importedNames.push({ local: '*', original: '*' });
      }
    } else if (tokens[j]?.value === '{') {
      // Named re-export: `export { foo, bar as baz } from '...'`
      j++;
      while (j < tokens.length && tokens[j]!.value !== '}') {
        if (tokens[j]!.value === 'type') { j++; continue; }
        if (tokens[j]!.kind === 'identifier') {
          const original = tokens[j]!.value;
          let local = original;
          j++;
          if (tokens[j]?.value === 'as') {
            j++;
            if (tokens[j]?.kind === 'identifier') { local = tokens[j]!.value; j++; }
          }
          importedNames.push({ local, original });
        } else { j++; }
        if (tokens[j]?.value === ',') j++;
      }
      if (tokens[j]?.value === '}') j++;
    }
    // Look for `from 'spec'`
    while (j < tokens.length && tokens[j]!.value !== ';' && j < i + 64) {
      if (tokens[j]!.value === 'from' && tokens[j + 1]?.kind === 'string') {
        const src = tokens[j + 1]!.value.slice(1, -1);
        const endTok = tokens[j + 1]!;
        // Emit an import-flavoured export node carrying re-export binding data.
        pushNode({
          kind: 'export',
          name: src,
          start: t.start,
          end: endTok.end,
          line: t.line,
          importedNames: importedNames.length > 0 ? importedNames : undefined,
        });
        // Also emit individual export symbols for named re-exports (so downstream
        // files that import from THIS file can resolve against it).
        for (const b of importedNames) {
          if (b.local === '*') continue;
          pushNode({ kind: 'export', name: b.local, start: t.start, end: endTok.end, line: t.line });
        }
        return j + 2;
      }
      j++;
    }
    // No `from` clause — plain export object; not a re-export.
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
