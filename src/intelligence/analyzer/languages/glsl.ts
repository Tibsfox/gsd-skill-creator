/**
 * C02 — GLSL language analyzer (.glsl, .vert, .frag, .comp files).
 *
 * Finds: declared uniforms/varyings never referenced (confidence 0.6),
 * large shaders (>300 LOC), parse errors.
 *
 * NOTE: tree-sitter-glsl requires tree-sitter ^0.22.x (older peer).
 * It is imported with --legacy-peer-deps. Falls back gracefully if parse fails.
 *
 * Pure: no I/O inside analyze() (D-22-11).
 */

import Parser from 'tree-sitter';
import { walk, linesOfCode } from './util.js';
import type { LanguageAnalyzer, AnalyzerInput, AnalyzerOutput, AnalyzerMetrics } from '../types.js';
import type { TSNode } from './util.js';

// Lazy-load GLSL grammar — peer version mismatch may cause issues at runtime
let _glslParser: Parser | null = null;
let _glslLoadFailed = false;

function getGlslParser(): Parser | null {
  if (_glslLoadFailed) return null;
  if (_glslParser) return _glslParser;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const GLSLGrammar = require('tree-sitter-glsl') as unknown;
    const p = new Parser();
    p.setLanguage(GLSLGrammar as Parameters<typeof p.setLanguage>[0]);
    _glslParser = p;
    return p;
  } catch {
    _glslLoadFailed = true;
    return null;
  }
}

function emptyMetrics(): AnalyzerMetrics {
  return { loc: 0, functions: 0, exports: 0, cyclomatic_complexity_mean: 1, cyclomatic_complexity_max: 1 };
}

function extractUniformsAndVaryings(root: TSNode): { name: string; qualifier: string; startIndex: number }[] {
  const items: { name: string; qualifier: string; startIndex: number }[] = [];

  walk(root, () => true, (node) => {
    if (node.type === 'declaration') {
      // Check for uniform/varying/attribute/in/out qualifier keyword
      const qualifiers = node.children.filter(c =>
        ['uniform', 'varying', 'attribute', 'in', 'out'].includes(c.type) ||
        (c.type === 'type_qualifier' && ['uniform', 'varying', 'attribute', 'in', 'out'].includes(c.text.trim()))
      );
      if (qualifiers.length > 0) {
        const nameNode = node.namedChildren.find(c => c.type === 'identifier');
        if (nameNode) {
          items.push({ name: nameNode.text, qualifier: qualifiers[0]!.text.trim(), startIndex: node.startIndex });
        }
      }
    }
  });

  return items;
}

export const glslAnalyzer: LanguageAnalyzer = {
  language: 'glsl',

  async analyze(input: AnalyzerInput): Promise<AnalyzerOutput> {
    const loc = linesOfCode(input.source, '//');
    const findings: AnalyzerOutput['findings'] = [];

    const parser = getGlslParser();

    if (!parser) {
      // Graceful degradation: grammar failed to load — report as parse_failed, continue
      findings.push({
        kind: 'parse_failed',
        severity: 'low',
        confidence: 1.0,
        title: `GLSL grammar unavailable for ${input.filePath}`,
        rationale: `tree-sitter-glsl failed to load (likely version mismatch). File ${input.filePath} analyzed with LOC-only heuristics.`,
      });

      if (loc > 300) {
        findings.push({ kind: 'large_file', severity: 'low', confidence: 1.0, title: `Large shader: ${input.filePath} (${loc} LOC)`, rationale: `${input.filePath} has ${loc} lines of GLSL code, exceeding the 300-LOC threshold.` });
      }

      return { filePath: input.filePath, parseStatus: 'failed', findings, metrics: { ...emptyMetrics(), loc } };
    }

    const tree = parser.parse(input.source);
    const root = tree.rootNode as unknown as TSNode;

    let functions = 0;
    walk(root, () => true, (node) => { if (node.type === 'function_definition') functions++; });

    const metrics: AnalyzerMetrics = { loc, functions, exports: 0, cyclomatic_complexity_mean: 1, cyclomatic_complexity_max: 1 };

    if (root.hasError) {
      findings.push({ kind: 'parse_failed', severity: 'low', confidence: 1.0, title: `Parse error in ${input.filePath}`, rationale: `tree-sitter (GLSL grammar) reported a parse error in ${input.filePath}.`, source_range: { start: 0, end: input.source.length } });
      return { filePath: input.filePath, parseStatus: 'failed', findings, metrics };
    }

    // Detect uniforms/varyings never referenced in the shader body
    const uniforms = extractUniformsAndVaryings(root);

    // Count identifier occurrences (declaration appears once; usage appears more)
    const identCounts = new Map<string, number>();
    walk(root, () => true, (node) => {
      if (node.type === 'identifier') {
        identCounts.set(node.text, (identCounts.get(node.text) ?? 0) + 1);
      }
    });

    for (const u of uniforms) {
      const count = identCounts.get(u.name) ?? 0;
      if (count <= 1) {
        findings.push({
          kind: 'unused_export',
          severity: 'low',
          confidence: 0.6,
          title: `Unused ${u.qualifier}: ${u.name} in ${input.filePath}`,
          rationale: `${u.qualifier} '${u.name}' is declared in ${input.filePath} but never referenced in the shader body.`,
          source_range: { start: u.startIndex, end: u.startIndex },
        });
      }
    }

    // Large shader
    if (loc > 300) {
      findings.push({ kind: 'large_file', severity: 'low', confidence: 1.0, title: `Large shader: ${input.filePath} (${loc} LOC)`, rationale: `${input.filePath} has ${loc} lines of GLSL code, exceeding the 300-LOC threshold.` });
    }

    return { filePath: input.filePath, parseStatus: 'ok', findings, metrics };
  },
};
