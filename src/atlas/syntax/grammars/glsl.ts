/**
 * GLSL grammar — functions, uniforms, struct decls. Sufficient for shader files.
 * @module atlas/syntax/grammars/glsl
 */

import type { Grammar } from '../lexer-state-machine.js';
import type { CoarseExtractor } from '../coarse-ast.js';
import { skipBalanced } from '../coarse-ast.js';

const KEYWORDS = new Set([
  'attribute', 'const', 'uniform', 'varying', 'buffer', 'shared', 'coherent',
  'volatile', 'restrict', 'readonly', 'writeonly', 'atomic_uint', 'layout',
  'centroid', 'flat', 'smooth', 'noperspective', 'patch', 'sample', 'invariant',
  'precise', 'break', 'continue', 'do', 'for', 'while', 'switch', 'case',
  'default', 'if', 'else', 'subroutine', 'in', 'out', 'inout', 'true', 'false',
  'discard', 'return', 'lowp', 'mediump', 'highp', 'precision', 'struct',
  'void', 'bool', 'int', 'uint', 'float', 'double',
]);

const TYPES = new Set([
  'vec2', 'vec3', 'vec4', 'ivec2', 'ivec3', 'ivec4', 'uvec2', 'uvec3', 'uvec4',
  'bvec2', 'bvec3', 'bvec4', 'dvec2', 'dvec3', 'dvec4',
  'mat2', 'mat3', 'mat4', 'mat2x2', 'mat2x3', 'mat2x4', 'mat3x2', 'mat3x3',
  'mat3x4', 'mat4x2', 'mat4x3', 'mat4x4',
  'sampler2D', 'sampler3D', 'samplerCube', 'sampler2DArray', 'sampler2DShadow',
  'image2D', 'image3D', 'imageCube',
]);

export const glslGrammar: Grammar = {
  name: 'glsl',
  initialState: 'main',
  keywords: KEYWORDS,
  types: TYPES,
  states: {
    main: {
      name: 'main',
      rules: [
        { re: /#[^\n]*/, action: { emit: 'preprocessor' } },
        { re: /\/\/[^\n]*/, action: { emit: 'comment' } },
        { re: /\/\*[\s\S]*?\*\//, action: { emit: 'block-comment' } },
        { re: /[ \t]+/, action: { emit: 'whitespace' } },
        { re: /\r?\n/, action: { emit: 'newline' } },
        { re: /0[xX][0-9a-fA-F]+[uU]?/, action: { emit: 'number' } },
        { re: /\d+\.\d*(?:[eE][+-]?\d+)?[fFlL]?/, action: { emit: 'number' } },
        { re: /\.\d+(?:[eE][+-]?\d+)?[fFlL]?/, action: { emit: 'number' } },
        { re: /\d+(?:[eE][+-]?\d+)?[uUfFlL]?/, action: { emit: 'number' } },
        { re: /[A-Za-z_][\w]*/, action: { emit: 'identifier' } },
        { re: /<<=|>>=|<<|>>|<=|>=|==|!=|&&|\|\||\+\+|--/, action: { emit: 'operator' } },
        { re: /[+\-*/%=<>!&|^~?]=?/, action: { emit: 'operator' } },
        { re: /[{}()[\];,.:]/, action: { emit: 'punctuation' } },
        { re: /./, action: { emit: 'invalid' } },
      ],
    },
  },
};

const extractFn: CoarseExtractor = ({ tokens, i, pushNode }) => {
  // Pattern: `<type> IDENT ( ... ) {` (optionally preceded by qualifiers).
  // Find `IDENT ( ... ) {` window from current position.
  const t = tokens[i];
  if (!t) return i;
  // Need a type-ish token at i (keyword/builtin/type/identifier returning).
  if (t.kind !== 'keyword' && t.kind !== 'type' && t.kind !== 'identifier') return i;
  const nameT = tokens[i + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  if (tokens[i + 2]?.value !== '(') return i;
  const close = skipBalanced(tokens, i + 2, '(', ')');
  if (tokens[close]?.value !== '{') return i;
  pushNode({ kind: 'function', name: nameT.value, start: nameT.start, end: nameT.end, line: nameT.line });
  return close + 1;
};

const extractStruct: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'struct') return i;
  const nameT = tokens[i + 1];
  if (!nameT || nameT.kind !== 'identifier') return i;
  pushNode({ kind: 'struct', name: nameT.value, start: t.start, end: nameT.end, line: t.line });
  return i + 2;
};

const extractUniform: CoarseExtractor = ({ tokens, i, pushNode }) => {
  const t = tokens[i];
  if (!t || t.value !== 'uniform') return i;
  // Skip optional layout(...) or qualifiers. Type token then identifier.
  let j = i + 1;
  if (tokens[j]?.value === 'layout' && tokens[j + 1]?.value === '(') {
    const close = skipBalanced(tokens, j + 1, '(', ')');
    j = close;
  }
  // Skip type token.
  if (tokens[j] && (tokens[j]!.kind === 'type' || tokens[j]!.kind === 'keyword' || tokens[j]!.kind === 'identifier')) j++;
  const nameT = tokens[j];
  if (!nameT || nameT.kind !== 'identifier') return i + 1;
  pushNode({ kind: 'variable', name: nameT.value, start: t.start, end: nameT.end, line: t.line, modifiers: ['uniform'] });
  return j + 1;
};

export const glslExtractors: CoarseExtractor[] = [extractUniform, extractStruct, extractFn];
