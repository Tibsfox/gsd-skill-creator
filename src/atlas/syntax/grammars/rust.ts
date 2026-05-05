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

/**
 * Recursively emit `fn` declarations found inside a token range [from, limit).
 * `qualifiedPrefix` is the outer function's name for nested qualified_name assembly.
 * Depth-limited to avoid pathological nesting (max 8 levels).
 */
function extractNestedFns(
  tokens: Token[],
  from: number,
  limit: number,
  qualifiedPrefix: string,
  pushNode: (node: CoarseNode) => void,
  depth: number,
): void {
  if (depth > 8) return;
  let j = from;
  while (j < limit) {
    const { mods, declAt } = consumeModifiers(tokens, j, MODIFIERS);
    const t = tokens[declAt];
    if (t && t.value === 'fn') {
      const nameT = tokens[declAt + 1];
      if (nameT && nameT.kind === 'identifier') {
        const qualifiedName = `${qualifiedPrefix}::${nameT.value}`;
        pushNode({
          kind: 'function',
          name: nameT.value,
          parent: qualifiedPrefix,
          start: t.start,
          end: nameT.end,
          line: t.line,
          modifiers: mods,
        });
        // Skip generics + parameter list + return type to find the body.
        let k = declAt + 2;
        k = skipGenerics(tokens, k);
        if (tokens[k]?.value === '(') k = skipBalanced(tokens, k, '(', ')');
        // Skip return type / where clauses up to body or semicolon.
        while (k < limit && tokens[k]!.value !== '{' && tokens[k]!.value !== ';') k++;
        if (tokens[k]?.value === '{') {
          const bodyEnd = skipBalanced(tokens, k, '{', '}');
          extractNestedFns(tokens, k + 1, bodyEnd - 1, qualifiedName, pushNode, depth + 1);
          j = bodyEnd;
          continue;
        }
        j = k + 1;
        continue;
      }
    }
    j++;
  }
}

const extractFn: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const { mods, declAt } = consumeModifiers(tokens, i, MODIFIERS);
  const t = tokens[declAt];
  if (!t || t.value !== 'fn') return i;
  const nameT = tokens[declAt + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  pushNode({ kind: 'function', name: nameT.value, start: t.start, end: nameT.end, line: t.line, modifiers: mods });
  // Descend into the function body to extract nested `fn` declarations.
  let j = declAt + 2;
  j = skipGenerics(tokens, j);
  if (tokens[j]?.value === '(') j = skipBalanced(tokens, j, '(', ')');
  while (j < tokens.length && tokens[j]!.value !== '{' && tokens[j]!.value !== ';') j++;
  if (tokens[j]?.value === '{') {
    const bodyEnd = skipBalanced(tokens, j, '{', '}');
    extractNestedFns(tokens, j + 1, bodyEnd - 1, nameT.value, pushNode, 1);
    return bodyEnd;
  }
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

/**
 * Parse the binding list after a `use foo::{...}` brace group.
 * Returns an array of { local, original } pairs. `braceAt` must be the index
 * of the `{` token; returns the index AFTER the matching `}`.
 */
function parseUseBraceGroup(
  tokens: Token[],
  braceAt: number,
): { bindings: Array<{ local: string; original: string }>; end: number } {
  const bindings: Array<{ local: string; original: string }> = [];
  let j = braceAt + 1;
  while (j < tokens.length && tokens[j]!.value !== '}') {
    const t = tokens[j]!;
    if (t.value === '*') {
      bindings.push({ local: '*', original: '*' });
      j++;
      continue;
    }
    if (t.kind === 'identifier') {
      const name = t.value;
      j++;
      if (tokens[j]?.value === 'as' && tokens[j + 1]?.kind === 'identifier') {
        bindings.push({ local: tokens[j + 1]!.value, original: name });
        j += 2;
      } else {
        bindings.push({ local: name, original: name });
      }
      if (tokens[j]?.value === ',') j++;
      continue;
    }
    j++;
  }
  return { bindings, end: j + 1 }; // j+1 past the '}'
}


const extractUse: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const { mods, declAt } = consumeModifiers(tokens, i, MODIFIERS);
  const t = tokens[declAt];
  if (!t || t.value !== 'use') return i;

  const isPub = mods.some((m) => m === 'pub' || m.startsWith('pub('));

  // Collect path segments up to ';', '{', or '*'.
  let j = declAt + 1;
  const segments: string[] = [];
  while (j < tokens.length) {
    const cur = tokens[j]!;
    if (cur.value === ';' || cur.value === '{' || cur.value === '*') break;
    if (
      cur.kind === 'identifier' ||
      cur.value === 'crate' ||
      cur.value === 'super' ||
      cur.value === 'self'
    ) {
      segments.push(cur.value);
      j++;
      if (tokens[j]?.value === '::') {
        const after = tokens[j + 1];
        if (!after || after.value === '{' || after.value === '*') {
          j++; // consume '::', stop before brace/glob
          break;
        }
        j++; // consume '::'
        continue;
      }
      break;
    }
    j++;
  }

  const nodeKind = isPub ? 'export' : 'import';
  const cur = tokens[j];

  if (cur?.value === '{') {
    // Group: `use foo::{bar, baz}` or `use foo::{bar as b, ...}`.
    const moduleSpec = segments.join('::');
    const { bindings, end } = parseUseBraceGroup(tokens, j);
    pushNode({
      kind: nodeKind,
      name: moduleSpec,
      start: t.start,
      end: tokens[end - 1]?.end ?? t.end,
      line: t.line,
      modifiers: mods.length ? mods : undefined,
      importedNames: bindings,
    });
    let k = end;
    while (k < tokens.length && tokens[k]!.value !== ';') k++;
    return k + 1;
  }

  if (cur?.value === '*') {
    // Glob: `use foo::*`.
    const moduleSpec = segments.join('::');
    pushNode({
      kind: nodeKind,
      name: moduleSpec,
      start: t.start,
      end: cur.end,
      line: t.line,
      modifiers: mods.length ? mods : undefined,
      importedNames: [{ local: '*', original: '*' }],
    });
    let k = j + 1;
    while (k < tokens.length && tokens[k]!.value !== ';') k++;
    return k + 1;
  }

  // Single or aliased binding: `use foo::bar` or `use foo::bar as baz`.
  const lastSeg = segments[segments.length - 1] ?? '';
  const moduleSpec = segments.slice(0, -1).join('::');
  let local = lastSeg;
  let original = lastSeg;
  let endTok = tokens[j - 1] ?? t;

  if (tokens[j]?.value === 'as' && tokens[j + 1]?.kind === 'identifier') {
    local = tokens[j + 1]!.value;
    endTok = tokens[j + 1]!;
    j += 2;
  }

  pushNode({
    kind: nodeKind,
    name: moduleSpec || lastSeg,
    start: t.start,
    end: endTok.end,
    line: t.line,
    modifiers: mods.length ? mods : undefined,
    importedNames: lastSeg ? [{ local, original }] : [],
  });

  let k = j;
  while (k < tokens.length && tokens[k]!.value !== ';') k++;
  return k + 1;
};

/**
 * Walk a `mod { ... }` body token range [from, limit), emitting nodes for
 * all recognized declarations with names prefixed by `parentPrefix`.
 * Descends recursively for nested mods.
 */
function walkRustModBody(
  tokens: Token[],
  from: number,
  limit: number,
  modName: string,
  parentPrefix: string,
  pushNode: (node: CoarseNode) => void,
  depth: number,
): void {
  if (depth > 8) return;
  const prefix = parentPrefix ? `${parentPrefix}::${modName}` : modName;
  let i = from;
  while (i < limit) {
    // Try mod (recursive).
    const modResult = tryExtractMod(tokens, i, limit, prefix, pushNode, depth + 1);
    if (modResult > i) { i = modResult; continue; }
    // Try fn.
    const fnResult = tryExtractFnWithPrefix(tokens, i, limit, prefix, pushNode);
    if (fnResult > i) { i = fnResult; continue; }
    // Try struct/enum/trait.
    const setResult = tryExtractStructEnumTrait(tokens, i, prefix, pushNode);
    if (setResult > i) { i = setResult; continue; }
    // Try use/pub use.
    const useResult = tryExtractUseWithPrefix(tokens, i, limit, prefix, pushNode);
    if (useResult > i) { i = useResult; continue; }
    // Try impl.
    const implResult = tryExtractImplInMod(tokens, i, limit, prefix, pushNode);
    if (implResult > i) { i = implResult; continue; }
    i++;
  }
}

function tryExtractMod(
  tokens: Token[],
  i: number,
  limit: number,
  parentPrefix: string,
  pushNode: (node: CoarseNode) => void,
  depth: number,
): number {
  const { mods, declAt } = consumeModifiers(tokens, i, MODIFIERS);
  const t = tokens[declAt];
  if (!t || t.value !== 'mod') return i;
  const nameT = tokens[declAt + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  const modName = nameT.value;
  const qualifiedName = parentPrefix ? `${parentPrefix}::${modName}` : modName;
  const next = tokens[declAt + 2];
  if (!next) return i;
  // Declaration-only: `mod foo;`
  if (next.value === ';') {
    pushNode({
      kind: 'namespace',
      name: modName,
      parent: parentPrefix || undefined,
      start: t.start,
      end: nameT.end,
      line: t.line,
      modifiers: mods,
    });
    return declAt + 3;
  }
  // Inline body: `mod foo { ... }`
  if (next.value === '{') {
    const bodyEnd = skipBalanced(tokens, declAt + 2, '{', '}');
    pushNode({
      kind: 'namespace',
      name: modName,
      parent: parentPrefix || undefined,
      start: t.start,
      end: nameT.end,
      line: t.line,
      modifiers: mods,
    });
    const innerLimit = Math.min(bodyEnd - 1, limit);
    walkRustModBody(tokens, declAt + 3, innerLimit, modName, parentPrefix, pushNode, depth);
    return bodyEnd;
  }
  return i;
}

function tryExtractFnWithPrefix(
  tokens: Token[],
  i: number,
  limit: number,
  parentPrefix: string,
  pushNode: (node: CoarseNode) => void,
): number {
  const { mods, declAt } = consumeModifiers(tokens, i, MODIFIERS);
  const t = tokens[declAt];
  if (!t || t.value !== 'fn') return i;
  const nameT = tokens[declAt + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  const qualifiedName = `${parentPrefix}::${nameT.value}`;
  pushNode({
    kind: 'function',
    name: nameT.value,
    parent: parentPrefix,
    start: t.start,
    end: nameT.end,
    line: t.line,
    modifiers: mods,
  });
  let j = declAt + 2;
  j = skipGenerics(tokens, j);
  if (tokens[j]?.value === '(') j = skipBalanced(tokens, j, '(', ')');
  while (j < limit && tokens[j]!.value !== '{' && tokens[j]!.value !== ';') j++;
  if (tokens[j]?.value === '{') {
    const bodyEnd = skipBalanced(tokens, j, '{', '}');
    extractNestedFns(tokens, j + 1, bodyEnd - 1, qualifiedName, pushNode, 1);
    return bodyEnd;
  }
  return declAt + 2;
}

function tryExtractStructEnumTrait(
  tokens: Token[],
  i: number,
  parentPrefix: string,
  pushNode: (node: CoarseNode) => void,
): number {
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
  pushNode({
    kind,
    name: nameT.value,
    parent: parentPrefix,
    start: t.start,
    end: nameT.end,
    line: t.line,
    modifiers: mods,
  });
  return declAt + 2;
}

function tryExtractUseWithPrefix(
  tokens: Token[],
  i: number,
  limit: number,
  _parentPrefix: string,
  pushNode: (node: CoarseNode) => void,
): number {
  // Delegate to the same logic as extractUse but via a one-shot ctx.
  void limit;
  let advanced = i;
  const ctx = {
    tokens,
    i,
    pushNode,
    skipBalanced(open: string, close: string) { return skipBalanced(tokens, i, open, close); },
  };
  advanced = extractUse(ctx);
  return advanced;
}

function tryExtractImplInMod(
  tokens: Token[],
  i: number,
  _limit: number,
  _parentPrefix: string,
  pushNode: (node: CoarseNode) => void,
): number {
  void _limit; void _parentPrefix;
  const ctx = {
    tokens,
    i,
    pushNode,
    skipBalanced(open: string, close: string) { return skipBalanced(tokens, i, open, close); },
  };
  return extractImpl(ctx);
}

const extractMod: CoarseExtractor = ({ tokens, i, pushNode }) => {
  return tryExtractMod(tokens, i, tokens.length, '', pushNode, 0);
};

export const rustExtractors: CoarseExtractor[] = [
  extractMod,
  extractUse,
  extractImpl,
  extractStructEnumTrait,
  extractFn,
];
