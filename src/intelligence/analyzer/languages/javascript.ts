/**
 * C02 — JavaScript language analyzer (.js, .mjs, .cjs).
 *
 * Finds: unused export candidates (confidence 0.6), complexity outliers,
 * large files, parse errors.
 *
 * Pure: no I/O inside analyze() (D-22-11).
 */

import Parser from 'tree-sitter';
import JSGrammar from 'tree-sitter-javascript';
import { walk, linesOfCode, cyclomaticComplexity } from './util.js';
import type { LanguageAnalyzer, AnalyzerInput, AnalyzerOutput, AnalyzerMetrics } from '../types.js';
import type { TSNode } from './util.js';

const JS_BRANCH_TYPES = [
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

let _jsParser: Parser | null = null;
function getJsParser(): Parser {
  if (!_jsParser) {
    _jsParser = new Parser();
    // @ts-expect-error tree-sitter grammar shape
    _jsParser.setLanguage(JSGrammar);
  }
  return _jsParser;
}

function extractFunctions(root: TSNode, source: string) {
  const fns: { name: string; startIndex: number; endIndex: number; complexity: number }[] = [];
  walk(root, () => true, (node) => {
    if (node.type === 'function_declaration' || node.type === 'method_definition' || node.type === 'arrow_function') {
      const nameNode = node.childForFieldName?.('name') ?? null;
      const name = nameNode?.text ?? '<anonymous>';
      const cc = cyclomaticComplexity(node, source, JS_BRANCH_TYPES);
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

function buildAnalyzer(language: 'javascript', getParser: () => Parser): LanguageAnalyzer {
  return {
    language,
    async analyze(input: AnalyzerInput): Promise<AnalyzerOutput> {
      const parser = getParser();
      const tree = parser.parse(input.source);
      const root = tree.rootNode as unknown as TSNode;
      const fns = extractFunctions(root, input.source);
      const metrics = computeMetrics(root, input.source, fns);
      const findings: AnalyzerOutput['findings'] = [];

      if (root.hasError) {
        findings.push({ kind: 'parse_failed', severity: 'low', confidence: 1.0, title: `Parse error in ${input.filePath}`, rationale: `tree-sitter reported a parse error in ${input.filePath}.`, source_range: { start: 0, end: input.source.length } });
        return { filePath: input.filePath, parseStatus: 'failed', findings, metrics };
      }

      // Unused export candidates
      const identCounts = new Map<string, number>();
      walk(root, () => true, (node) => { if (node.type === 'identifier') identCounts.set(node.text, (identCounts.get(node.text) ?? 0) + 1); });
      walk(root, () => true, (node) => {
        if (node.type === 'export_statement') {
          for (const child of node.namedChildren) {
            if (child.type === 'function_declaration' || child.type === 'class_declaration') {
              const nameNode = child.childForFieldName?.('name') ?? child.namedChildren[0];
              if (nameNode?.type === 'identifier' && (identCounts.get(nameNode.text) ?? 0) <= 1) {
                findings.push({ kind: 'unused_export', severity: 'low', confidence: 0.6, title: `Possible unused export: ${nameNode.text} in ${input.filePath}`, rationale: `Symbol '${nameNode.text}' is exported from ${input.filePath} but has no internal references.`, source_range: { start: node.startIndex, end: node.startIndex } });
              }
            }
          }
        }
      });

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
}

export const javascriptAnalyzer: LanguageAnalyzer = buildAnalyzer('javascript', getJsParser);
