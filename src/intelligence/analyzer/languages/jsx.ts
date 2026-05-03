/**
 * C02 — JSX language analyzer (.jsx files).
 *
 * Uses the tree-sitter-javascript grammar (JSX is a superset of JS).
 * Pure: no I/O inside analyze() (D-22-11).
 */

import Parser from 'tree-sitter';
import JSGrammar from 'tree-sitter-javascript';
import { walk, linesOfCode, cyclomaticComplexity } from './util.js';
import type { LanguageAnalyzer, AnalyzerInput, AnalyzerOutput, AnalyzerMetrics } from '../types.js';
import type { TSNode } from './util.js';

const JS_BRANCH_TYPES = ['if_statement', 'else_clause', 'while_statement', 'for_statement', 'switch_case', 'catch_clause', 'ternary_expression', '&&', '||', '??'];

let _jsxParser: Parser | null = null;
function getJsxParser(): Parser {
  if (!_jsxParser) {
    _jsxParser = new Parser();
    // @ts-expect-error tree-sitter grammar shape
    _jsxParser.setLanguage(JSGrammar);
  }
  return _jsxParser;
}

function computeMetrics(root: TSNode, source: string): AnalyzerMetrics {
  const fns: number[] = [];
  let functions = 0;
  let exports = 0;
  walk(root, () => true, (node) => {
    if (node.type === 'function_declaration' || node.type === 'arrow_function') {
      functions++;
      fns.push(cyclomaticComplexity(node, source, JS_BRANCH_TYPES));
    }
    if (node.type === 'export_statement') exports++;
  });
  const ccMean = fns.length > 0 ? fns.reduce((a, b) => a + b, 0) / fns.length : 1;
  const ccMax = fns.length > 0 ? Math.max(...fns) : 1;
  return { loc: linesOfCode(source, '//'), functions, exports, cyclomatic_complexity_mean: ccMean, cyclomatic_complexity_max: ccMax };
}

export const jsxAnalyzer: LanguageAnalyzer = {
  language: 'jsx',
  async analyze(input: AnalyzerInput): Promise<AnalyzerOutput> {
    const parser = getJsxParser();
    const tree = parser.parse(input.source);
    const root = tree.rootNode as unknown as TSNode;
    const metrics = computeMetrics(root, input.source);
    const findings: AnalyzerOutput['findings'] = [];

    if (root.hasError) {
      findings.push({ kind: 'parse_failed', severity: 'low', confidence: 1.0, title: `Parse error in ${input.filePath}`, rationale: `tree-sitter (JSX grammar) reported a parse error in ${input.filePath}.`, source_range: { start: 0, end: input.source.length } });
      return { filePath: input.filePath, parseStatus: 'failed', findings, metrics };
    }

    if (metrics.loc > 500) {
      findings.push({ kind: 'large_file', severity: 'low', confidence: 1.0, title: `Large file: ${input.filePath} (${metrics.loc} LOC)`, rationale: `${input.filePath} has ${metrics.loc} lines of code, exceeding the 500-LOC threshold.` });
    }

    return { filePath: input.filePath, parseStatus: 'ok', findings, metrics };
  },
};
