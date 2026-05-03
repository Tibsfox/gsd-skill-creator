/**
 * C02 — Rust language analyzer (.rs files).
 *
 * Finds: pub items with no internal references (candidate confidence 0.6),
 * complexity outliers, large files, parse errors.
 *
 * Pure: no I/O inside analyze() (D-22-11).
 */

import Parser from 'tree-sitter';
import RustGrammar from 'tree-sitter-rust';
import { walk, linesOfCode, cyclomaticComplexity } from './util.js';
import type { LanguageAnalyzer, AnalyzerInput, AnalyzerOutput, AnalyzerMetrics } from '../types.js';
import type { TSNode } from './util.js';

const RUST_BRANCH_TYPES = [
  'if_expression',
  'else_clause',
  'while_expression',
  'loop_expression',
  'for_expression',
  'match_arm',
  '&&',
  '||',
  '?',
];

let _rustParser: Parser | null = null;
function getRustParser(): Parser {
  if (!_rustParser) {
    _rustParser = new Parser();
    // @ts-expect-error tree-sitter grammar shape
    _rustParser.setLanguage(RustGrammar);
  }
  return _rustParser;
}

interface PubItem {
  name: string;
  startIndex: number;
}

function extractPubItems(root: TSNode): PubItem[] {
  const items: PubItem[] = [];

  walk(root, () => true, (node) => {
    // pub fn, pub struct, pub enum, pub trait, pub type
    if (
      node.type === 'function_item' ||
      node.type === 'struct_item' ||
      node.type === 'enum_item' ||
      node.type === 'trait_item' ||
      node.type === 'type_item' ||
      node.type === 'const_item' ||
      node.type === 'static_item'
    ) {
      // Check for pub visibility modifier
      const hasVis = node.children.some(c => c.type === 'visibility_modifier' && c.text.trim() === 'pub');
      if (hasVis) {
        // Get the name: identifier or type_identifier
        const nameNode = node.children.find(c => c.type === 'identifier' || c.type === 'type_identifier');
        if (nameNode) {
          items.push({ name: nameNode.text, startIndex: node.startIndex });
        }
      }
    }
  });

  return items;
}

function extractFunctions(root: TSNode, source: string) {
  const fns: { name: string; startIndex: number; endIndex: number; complexity: number }[] = [];
  walk(root, () => true, (node) => {
    if (node.type === 'function_item') {
      const nameNode = node.children.find(c => c.type === 'identifier');
      const name = nameNode?.text ?? '<anonymous>';
      const cc = cyclomaticComplexity(node, source, RUST_BRANCH_TYPES);
      fns.push({ name, startIndex: node.startIndex, endIndex: node.endIndex, complexity: cc });
    }
  });
  return fns;
}

export const rustAnalyzer: LanguageAnalyzer = {
  language: 'rust',

  async analyze(input: AnalyzerInput): Promise<AnalyzerOutput> {
    const parser = getRustParser();
    const tree = parser.parse(input.source);
    const root = tree.rootNode as unknown as TSNode;
    const fns = extractFunctions(root, input.source);
    const pubItems = extractPubItems(root);

    const loc = linesOfCode(input.source, '//');
    const complexities = fns.map(f => f.complexity);
    const ccMean = complexities.length > 0 ? complexities.reduce((a, b) => a + b, 0) / complexities.length : 1;
    const ccMax = complexities.length > 0 ? Math.max(...complexities) : 1;

    const metrics: AnalyzerMetrics = {
      loc,
      functions: fns.length,
      exports: pubItems.length,
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
        rationale: `tree-sitter (Rust grammar) reported a parse error in ${input.filePath}.`,
        source_range: { start: 0, end: input.source.length },
      });
      return { filePath: input.filePath, parseStatus: 'failed', findings, metrics };
    }

    // Pub item candidate detection (heuristic: pub item with identifier count = 1 = only declaration)
    const identCounts = new Map<string, number>();
    walk(root, () => true, (node) => {
      if (node.type === 'identifier' || node.type === 'type_identifier') {
        identCounts.set(node.text, (identCounts.get(node.text) ?? 0) + 1);
      }
    });

    for (const item of pubItems) {
      const count = identCounts.get(item.name) ?? 0;
      if (count <= 1) {
        findings.push({
          kind: 'unused_export',
          severity: 'low',
          confidence: 0.6,
          title: `Possible dead pub item: ${item.name} in ${input.filePath}`,
          rationale: `'pub ${item.name}' in ${input.filePath} has no in-file references. Awaiting cross-file (crate-level) confirmation.`,
          source_range: { start: item.startIndex, end: item.startIndex },
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
