/**
 * C02 — Bash language analyzer (.sh, .bash files).
 *
 * Intentionally limited per PRD: parse, extract function declarations,
 * count LOC, flag large scripts (>200 LOC), report parse errors.
 * Heuristic: functions never referenced in the script body → candidate.
 *
 * Pure: no I/O inside analyze() (D-22-11).
 */

import Parser from 'tree-sitter';
import BashGrammar from 'tree-sitter-bash';
import { walk, linesOfCode } from './util.js';
import type { LanguageAnalyzer, AnalyzerInput, AnalyzerOutput, AnalyzerMetrics } from '../types.js';
import type { TSNode } from './util.js';

let _bashParser: Parser | null = null;
function getBashParser(): Parser {
  if (!_bashParser) {
    _bashParser = new Parser();
    // @ts-expect-error tree-sitter grammar shape
    _bashParser.setLanguage(BashGrammar);
  }
  return _bashParser;
}

function extractFunctions(root: TSNode): { name: string; startIndex: number }[] {
  const fns: { name: string; startIndex: number }[] = [];
  walk(root, () => true, (node) => {
    if (node.type === 'function_definition') {
      const nameNode = node.namedChildren.find(c => c.type === 'word');
      if (nameNode) {
        fns.push({ name: nameNode.text, startIndex: node.startIndex });
      }
    }
  });
  return fns;
}

export const bashAnalyzer: LanguageAnalyzer = {
  language: 'bash',

  async analyze(input: AnalyzerInput): Promise<AnalyzerOutput> {
    const parser = getBashParser();
    const tree = parser.parse(input.source);
    const root = tree.rootNode as unknown as TSNode;
    const fns = extractFunctions(root);
    const loc = linesOfCode(input.source, '#');

    const metrics: AnalyzerMetrics = {
      loc,
      functions: fns.length,
      exports: 0, // Bash has no exports
      cyclomatic_complexity_mean: 1,
      cyclomatic_complexity_max: 1,
    };

    const findings: AnalyzerOutput['findings'] = [];

    if (root.hasError) {
      findings.push({
        kind: 'parse_failed',
        severity: 'low',
        confidence: 1.0,
        title: `Parse error in ${input.filePath}`,
        rationale: `tree-sitter (Bash grammar) reported a parse error in ${input.filePath}.`,
        source_range: { start: 0, end: input.source.length },
      });
      return { filePath: input.filePath, parseStatus: 'failed', findings, metrics };
    }

    // Heuristic: function defined but never called in same script
    // Count word occurrences (function names appear as words at call sites)
    const wordCounts = new Map<string, number>();
    walk(root, () => true, (node) => {
      if (node.type === 'word') {
        wordCounts.set(node.text, (wordCounts.get(node.text) ?? 0) + 1);
      }
    });

    for (const fn of fns) {
      // Count > 1 means the name appears at definition AND at a call site
      const count = wordCounts.get(fn.name) ?? 0;
      if (count <= 1) {
        findings.push({
          kind: 'unused_export',
          severity: 'low',
          confidence: 0.6,
          title: `Unreachable function: ${fn.name} in ${input.filePath}`,
          rationale: `Function '${fn.name}' is defined in ${input.filePath} but never called in the same script.`,
          source_range: { start: fn.startIndex, end: fn.startIndex },
        });
      }
    }

    // Large script
    if (loc > 200) {
      findings.push({
        kind: 'large_file',
        severity: 'low',
        confidence: 1.0,
        title: `Large script: ${input.filePath} (${loc} LOC)`,
        rationale: `${input.filePath} has ${loc} lines of code, exceeding the 200-LOC shell script threshold. Consider splitting into smaller scripts.`,
      });
    }

    return { filePath: input.filePath, parseStatus: 'ok', findings, metrics };
  },
};
