/**
 * C02 — TypeScript language analyzer.
 *
 * Finds: unused export candidates (confidence 0.6), complexity outliers,
 * large files, parse errors.
 *
 * Pure: no I/O inside analyze() (D-22-11).
 */

import Parser from 'tree-sitter';
import TSGrammar from 'tree-sitter-typescript';
import { walk, linesOfCode, cyclomaticComplexity } from './util.js';
import type { LanguageAnalyzer, AnalyzerInput, AnalyzerOutput, AnalyzerMetrics } from '../types.js';
import type { TSNode } from './util.js';

// ─── TypeScript branch tokens ─────────────────────────────

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

// Cache parser per language — construction is expensive
let _tsParser: Parser | null = null;
function getTsParser(): Parser {
  if (!_tsParser) {
    _tsParser = new Parser();
    // @ts-expect-error tree-sitter grammar shape
    _tsParser.setLanguage(TSGrammar.typescript);
  }
  return _tsParser;
}

// ─── Extraction helpers ───────────────────────────────────

interface ExportedSymbol {
  name: string;
  isDefault: boolean;
  startIndex: number;
}

function extractExports(root: TSNode, source: string): ExportedSymbol[] {
  const exported: ExportedSymbol[] = [];

  walk(
    root,
    () => true,
    (node) => {
      if (node.type === 'export_statement') {
        // export default
        const defaultKw = node.children.find(c => c.type === 'default');
        if (defaultKw) {
          exported.push({ name: 'default', isDefault: true, startIndex: node.startIndex });
          return;
        }
        // export function foo / export class Foo / export const foo / export let foo
        for (const child of node.namedChildren) {
          if (child.type === 'function_declaration' || child.type === 'class_declaration') {
            const nameNode = child.childForFieldName?.('name') ?? child.namedChildren[0];
            if (nameNode?.type === 'identifier') {
              exported.push({ name: nameNode.text, isDefault: false, startIndex: node.startIndex });
            }
          } else if (child.type === 'lexical_declaration' || child.type === 'variable_declaration') {
            for (const decl of child.namedChildren) {
              if (decl.type === 'variable_declarator') {
                const nameNode = decl.childForFieldName?.('name') ?? decl.namedChildren[0];
                if (nameNode?.type === 'identifier') {
                  exported.push({ name: nameNode.text, isDefault: false, startIndex: node.startIndex });
                }
              }
            }
          } else if (child.type === 'export_clause') {
            // export { foo, bar }
            for (const spec of child.namedChildren) {
              if (spec.type === 'export_specifier') {
                const nameNode = spec.childForFieldName?.('name') ?? spec.namedChildren[0];
                if (nameNode?.type === 'identifier') {
                  exported.push({ name: nameNode.text, isDefault: false, startIndex: node.startIndex });
                }
              }
            }
          }
        }
      }
    },
  );

  return exported;
}

function extractImports(root: TSNode): string[] {
  const imported: string[] = [];

  walk(
    root,
    () => true,
    (node) => {
      if (node.type === 'import_statement') {
        const clause = node.namedChildren.find(c => c.type === 'import_clause');
        if (clause) {
          for (const child of clause.namedChildren) {
            if (child.type === 'named_imports') {
              for (const spec of child.namedChildren) {
                if (spec.type === 'import_specifier') {
                  const nameNode = spec.childForFieldName?.('name') ?? spec.namedChildren[0];
                  if (nameNode) imported.push(nameNode.text);
                }
              }
            } else if (child.type === 'identifier') {
              imported.push(child.text); // default import
            }
          }
        }
      }
    },
  );

  return imported;
}

interface FunctionInfo {
  name: string;
  startIndex: number;
  endIndex: number;
  complexity: number;
}

function extractFunctions(root: TSNode, source: string): FunctionInfo[] {
  const fns: FunctionInfo[] = [];

  walk(
    root,
    () => true,
    (node) => {
      if (
        node.type === 'function_declaration' ||
        node.type === 'method_definition' ||
        node.type === 'arrow_function'
      ) {
        const nameNode = node.childForFieldName?.('name') ?? null;
        const name = nameNode?.text ?? '<anonymous>';
        const cc = cyclomaticComplexity(node, source, TS_BRANCH_TYPES);
        fns.push({ name, startIndex: node.startIndex, endIndex: node.endIndex, complexity: cc });
      }
    },
  );

  return fns;
}

function computeMetrics(root: TSNode, source: string, fns: FunctionInfo[]): AnalyzerMetrics {
  const loc = linesOfCode(source, '//');
  const complexities = fns.map(f => f.complexity);
  const ccMean = complexities.length > 0
    ? complexities.reduce((a, b) => a + b, 0) / complexities.length
    : 1;
  const ccMax = complexities.length > 0 ? Math.max(...complexities) : 1;

  // Count exports
  let exports = 0;
  walk(root, () => true, (node) => {
    if (node.type === 'export_statement') exports++;
  });

  return {
    loc,
    functions: fns.length,
    exports,
    cyclomatic_complexity_mean: ccMean,
    cyclomatic_complexity_max: ccMax,
  };
}

// ─── TypeScript analyzer ──────────────────────────────────

export const typescriptAnalyzer: LanguageAnalyzer = {
  language: 'typescript',

  async analyze(input: AnalyzerInput): Promise<AnalyzerOutput> {
    const parser = getTsParser();
    const tree = parser.parse(input.source);
    const root = tree.rootNode as unknown as TSNode;

    const fns = extractFunctions(root, input.source);
    const metrics = computeMetrics(root, input.source, fns);
    const findings: AnalyzerOutput['findings'] = [];

    // Parse error detection
    if (root.hasError) {
      findings.push({
        kind: 'parse_failed',
        severity: 'low',
        confidence: 1.0,
        title: `Parse error in ${input.filePath}`,
        rationale: `tree-sitter reported a parse error in ${input.filePath}. The AST may be incomplete.`,
        source_range: { start: 0, end: input.source.length },
      });

      return {
        filePath: input.filePath,
        parseStatus: 'failed',
        findings,
        metrics,
      };
    }

    // Unused export candidates (heuristic, confidence 0.6 — C03 confirms cross-file)
    const exports = extractExports(root, input.source);

    // Count identifier occurrences throughout the file (declaration + uses)
    // An exported symbol that appears only ONCE (the declaration) has no internal uses.
    const identCounts = new Map<string, number>();
    walk(root, () => true, (node) => {
      if (node.type === 'identifier') {
        identCounts.set(node.text, (identCounts.get(node.text) ?? 0) + 1);
      }
    });

    for (const exp of exports) {
      if (exp.isDefault) continue; // default exports not flagged at this layer
      // If identifier count is 1, it only appears at the declaration site → no internal uses
      const count = identCounts.get(exp.name) ?? 0;
      if (count <= 1) {
        findings.push({
          kind: 'unused_export',
          severity: 'low',
          confidence: 0.6,
          title: `Possible unused export: ${exp.name} in ${input.filePath}`,
          rationale: `Symbol '${exp.name}' is exported from ${input.filePath} but has no internal references. Awaiting cross-file confirmation.`,
          source_range: { start: exp.startIndex, end: exp.startIndex },
        });
      }
    }

    // Complexity outliers
    const fileMeanCC = metrics.cyclomatic_complexity_mean;
    for (const fn of fns) {
      if (fn.complexity > 25) {
        findings.push({
          kind: 'complexity_outlier',
          severity: 'high',
          confidence: 0.9,
          title: `High complexity: ${fn.name} (CC=${fn.complexity}) in ${input.filePath}`,
          rationale: `Function '${fn.name}' in ${input.filePath} has cyclomatic complexity ${fn.complexity} (threshold: 25). File mean: ${fileMeanCC.toFixed(1)}.`,
          source_range: { start: fn.startIndex, end: fn.endIndex },
        });
      } else if (fn.complexity > 15 || fn.complexity > 2 * fileMeanCC) {
        findings.push({
          kind: 'complexity_outlier',
          severity: 'med',
          confidence: 0.8,
          title: `Elevated complexity: ${fn.name} (CC=${fn.complexity}) in ${input.filePath}`,
          rationale: `Function '${fn.name}' in ${input.filePath} has cyclomatic complexity ${fn.complexity} (file mean: ${fileMeanCC.toFixed(1)}, threshold: 15).`,
          source_range: { start: fn.startIndex, end: fn.endIndex },
        });
      }
    }

    // Large file
    if (metrics.loc > 500) {
      findings.push({
        kind: 'large_file',
        severity: 'low',
        confidence: 1.0,
        title: `Large file: ${input.filePath} (${metrics.loc} LOC)`,
        rationale: `${input.filePath} has ${metrics.loc} lines of code, exceeding the 500-LOC threshold. Consider splitting into smaller modules.`,
      });
    }

    return {
      filePath: input.filePath,
      parseStatus: 'ok',
      findings,
      metrics,
    };
  },
};
