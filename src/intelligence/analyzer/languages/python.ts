/**
 * C02 — Python language analyzer (.py files).
 *
 * Finds: unused top-level def/class candidates (confidence 0.6),
 * complexity outliers, large files, parse errors.
 *
 * Pure: no I/O inside analyze() (D-22-11).
 */

import Parser from 'tree-sitter';
import PythonGrammar from 'tree-sitter-python';
import { walk, linesOfCode, cyclomaticComplexity } from './util.js';
import type { LanguageAnalyzer, AnalyzerInput, AnalyzerOutput, AnalyzerMetrics } from '../types.js';
import type { TSNode } from './util.js';

const PY_BRANCH_TYPES = [
  'if_statement',
  'elif_clause',
  'else_clause',
  'while_statement',
  'for_statement',
  'try_statement',
  'except_clause',
  'boolean_operator',  // and / or
  'conditional_expression', // ternary
];

let _pyParser: Parser | null = null;
function getPyParser(): Parser {
  if (!_pyParser) {
    _pyParser = new Parser();
    // @ts-expect-error tree-sitter grammar shape
    _pyParser.setLanguage(PythonGrammar);
  }
  return _pyParser;
}

function extractTopLevelDefs(root: TSNode): { name: string; startIndex: number }[] {
  const defs: { name: string; startIndex: number }[] = [];
  // Only direct children of the module node
  for (const child of root.namedChildren) {
    if (child.type === 'function_definition' || child.type === 'class_definition') {
      const nameNode = child.childForFieldName?.('name') ?? child.namedChildren.find(c => c.type === 'identifier');
      if (nameNode) {
        defs.push({ name: nameNode.text, startIndex: child.startIndex });
      }
    }
  }
  return defs;
}

function extractAllFunctions(root: TSNode, source: string) {
  const fns: { name: string; startIndex: number; endIndex: number; complexity: number }[] = [];
  walk(root, () => true, (node) => {
    if (node.type === 'function_definition') {
      const nameNode = node.childForFieldName?.('name') ?? node.namedChildren.find(c => c.type === 'identifier');
      const name = nameNode?.text ?? '<anonymous>';
      const cc = cyclomaticComplexity(node, source, PY_BRANCH_TYPES);
      fns.push({ name, startIndex: node.startIndex, endIndex: node.endIndex, complexity: cc });
    }
  });
  return fns;
}

export const pythonAnalyzer: LanguageAnalyzer = {
  language: 'python',

  async analyze(input: AnalyzerInput): Promise<AnalyzerOutput> {
    const parser = getPyParser();
    const tree = parser.parse(input.source);
    const root = tree.rootNode as unknown as TSNode;
    const fns = extractAllFunctions(root, input.source);
    const topDefs = extractTopLevelDefs(root);

    const loc = linesOfCode(input.source, '#');
    const complexities = fns.map(f => f.complexity);
    const ccMean = complexities.length > 0 ? complexities.reduce((a, b) => a + b, 0) / complexities.length : 1;
    const ccMax = complexities.length > 0 ? Math.max(...complexities) : 1;

    const metrics: AnalyzerMetrics = {
      loc,
      functions: fns.length,
      exports: topDefs.length, // Python "exports" = top-level defs
      cyclomatic_complexity_mean: ccMean,
      cyclomatic_complexity_max: ccMax,
    };

    const findings: AnalyzerOutput['findings'] = [];

    if (root.hasError) {
      findings.push({
        kind: 'parse_failed',
        severity: 'low',
        confidence: 1.0,
        title: `Parse error in ${input.filePath}`,
        rationale: `tree-sitter (Python grammar) reported a parse error in ${input.filePath}.`,
        source_range: { start: 0, end: input.source.length },
      });
      return { filePath: input.filePath, parseStatus: 'failed', findings, metrics };
    }

    // Unused top-level def/class candidates (heuristic: identifier count = 1 = declaration only)
    const identCounts = new Map<string, number>();
    walk(root, () => true, (node) => {
      if (node.type === 'identifier') {
        identCounts.set(node.text, (identCounts.get(node.text) ?? 0) + 1);
      }
    });

    for (const def of topDefs) {
      const count = identCounts.get(def.name) ?? 0;
      if (count <= 1) {
        findings.push({
          kind: 'unused_export',
          severity: 'low',
          confidence: 0.6,
          title: `Possible unused definition: ${def.name} in ${input.filePath}`,
          rationale: `'${def.name}' is defined at the top level of ${input.filePath} but has no in-file references. Awaiting cross-file confirmation.`,
          source_range: { start: def.startIndex, end: def.startIndex },
        });
      }
    }

    // Complexity outliers
    const fileMeanCC = metrics.cyclomatic_complexity_mean;
    for (const fn of fns) {
      if (fn.complexity > 25) {
        findings.push({ kind: 'complexity_outlier', severity: 'high', confidence: 0.9, title: `High complexity: ${fn.name} (CC=${fn.complexity}) in ${input.filePath}`, rationale: `Function '${fn.name}' in ${input.filePath} has cyclomatic complexity ${fn.complexity} (threshold: 25, file mean: ${fileMeanCC.toFixed(1)}).`, source_range: { start: fn.startIndex, end: fn.endIndex } });
      } else if (fn.complexity > 15 || fn.complexity > 2 * fileMeanCC) {
        findings.push({ kind: 'complexity_outlier', severity: 'med', confidence: 0.8, title: `Elevated complexity: ${fn.name} (CC=${fn.complexity}) in ${input.filePath}`, rationale: `Function '${fn.name}' in ${input.filePath} has cyclomatic complexity ${fn.complexity} (file mean: ${fileMeanCC.toFixed(1)}, threshold: 15).`, source_range: { start: fn.startIndex, end: fn.endIndex } });
      }
    }

    // Large file
    if (metrics.loc > 500) {
      findings.push({ kind: 'large_file', severity: 'low', confidence: 1.0, title: `Large file: ${input.filePath} (${metrics.loc} LOC)`, rationale: `${input.filePath} has ${metrics.loc} lines of code, exceeding the 500-LOC threshold.` });
    }

    return { filePath: input.filePath, parseStatus: 'ok', findings, metrics };
  },
};
