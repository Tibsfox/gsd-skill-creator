/**
 * C02 — TSX language analyzer.
 *
 * Same logic as TypeScript but using the tsx grammar (supports JSX syntax).
 * Pure: no I/O inside analyze() (D-22-11).
 */

import Parser from 'tree-sitter';
import TSGrammar from 'tree-sitter-typescript';
import { walk, linesOfCode, cyclomaticComplexity } from './util.js';
import type { LanguageAnalyzer, AnalyzerInput, AnalyzerOutput, AnalyzerMetrics } from '../types.js';
import type { TSNode } from './util.js';

const TS_BRANCH_TYPES = [
  'if_statement',
  'else_clause',
  'while_statement',
  'do_statement',
  'for_statement',
  'for_in_statement',
  'switch_case',
  'catch_clause',
  'ternary_expression',
  '&&',
  '||',
  '??',
];

let _tsxParser: Parser | null = null;
function getTsxParser(): Parser {
  if (!_tsxParser) {
    _tsxParser = new Parser();
    // @ts-expect-error tree-sitter grammar shape
    _tsxParser.setLanguage(TSGrammar.tsx);
  }
  return _tsxParser;
}

function extractFunctions(root: TSNode, source: string): Array<{ name: string; startIndex: number; endIndex: number; complexity: number }> {
  const fns: Array<{ name: string; startIndex: number; endIndex: number; complexity: number }> = [];
  walk(root, () => true, (node) => {
    if (node.type === 'function_declaration' || node.type === 'method_definition' || node.type === 'arrow_function') {
      const nameNode = node.childForFieldName?.('name') ?? null;
      const name = nameNode?.text ?? '<anonymous>';
      const cc = cyclomaticComplexity(node, source, TS_BRANCH_TYPES);
      fns.push({ name, startIndex: node.startIndex, endIndex: node.endIndex, complexity: cc });
    }
  });
  return fns;
}

function computeMetrics(root: TSNode, source: string, fns: ReturnType<typeof extractFunctions>): AnalyzerMetrics {
  const loc = linesOfCode(source, '//');
  const complexities = fns.map(f => f.complexity);
  const ccMean = complexities.length > 0 ? complexities.reduce((a, b) => a + b, 0) / complexities.length : 1;
  const ccMax = complexities.length > 0 ? Math.max(...complexities) : 1;
  let exports = 0;
  walk(root, () => true, (node) => { if (node.type === 'export_statement') exports++; });
  return { loc, functions: fns.length, exports, cyclomatic_complexity_mean: ccMean, cyclomatic_complexity_max: ccMax };
}

export const tsxAnalyzer: LanguageAnalyzer = {
  language: 'tsx',

  async analyze(input: AnalyzerInput): Promise<AnalyzerOutput> {
    const parser = getTsxParser();
    const tree = parser.parse(input.source);
    const root = tree.rootNode as unknown as TSNode;
    const fns = extractFunctions(root, input.source);
    const metrics = computeMetrics(root, input.source, fns);
    const findings: AnalyzerOutput['findings'] = [];

    if (root.hasError) {
      findings.push({
        kind: 'parse_failed',
        severity: 'low',
        confidence: 1.0,
        title: `Parse error in ${input.filePath}`,
        rationale: `tree-sitter (TSX grammar) reported a parse error in ${input.filePath}.`,
        source_range: { start: 0, end: input.source.length },
      });
      return { filePath: input.filePath, parseStatus: 'failed', findings, metrics };
    }

    // Complexity outliers
    const fileMeanCC = metrics.cyclomatic_complexity_mean;
    for (const fn of fns) {
      if (fn.complexity > 25) {
        findings.push({ kind: 'complexity_outlier', severity: 'high', confidence: 0.9, title: `High complexity: ${fn.name} (CC=${fn.complexity}) in ${input.filePath}`, rationale: `Function '${fn.name}' in ${input.filePath} has cyclomatic complexity ${fn.complexity} (threshold: 25).`, source_range: { start: fn.startIndex, end: fn.endIndex } });
      } else if (fn.complexity > 15 || fn.complexity > 2 * fileMeanCC) {
        findings.push({ kind: 'complexity_outlier', severity: 'med', confidence: 0.8, title: `Elevated complexity: ${fn.name} (CC=${fn.complexity}) in ${input.filePath}`, rationale: `Function '${fn.name}' in ${input.filePath} has cyclomatic complexity ${fn.complexity} (file mean: ${fileMeanCC.toFixed(1)}).`, source_range: { start: fn.startIndex, end: fn.endIndex } });
      }
    }

    // Large file
    if (metrics.loc > 500) {
      findings.push({ kind: 'large_file', severity: 'low', confidence: 1.0, title: `Large file: ${input.filePath} (${metrics.loc} LOC)`, rationale: `${input.filePath} has ${metrics.loc} lines of code, exceeding the 500-LOC threshold.` });
    }

    // Unused export candidates
    const allIdents = new Set<string>();
    walk(root, () => true, (node) => { if (node.type === 'identifier') allIdents.add(node.text); });
    walk(root, () => true, (node) => {
      if (node.type === 'export_statement') {
        for (const child of node.namedChildren) {
          if (child.type === 'function_declaration' || child.type === 'class_declaration') {
            const nameNode = child.childForFieldName?.('name') ?? child.namedChildren[0];
            if (nameNode?.type === 'identifier' && !allIdents.has(nameNode.text)) {
              // Only push if it truly has no internal ref count > 1
            }
          }
        }
      }
    });

    return { filePath: input.filePath, parseStatus: 'ok', findings, metrics };
  },
};
