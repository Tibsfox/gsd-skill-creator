/**
 * Decision tree formatter: converts DecisionNode[] to readable prose.
 * Phase 406 Plan 01 -- formats algorithm selection as structured prose sections.
 */

import type { DecisionNode } from '../types.js';

/**
 * Format a decision tree as readable prose with section headings.
 *
 * Converts the binary yes/no decision tree into structured markdown prose:
 * - Each question becomes a ### heading
 * - Leaf nodes become "Use **VariantName**" recommendations
 * - Branch nodes recursively expand as nested subsections
 *
 * No ASCII tree diagrams (|---, +---) are produced.
 */
export function formatDecisionTree(nodes: DecisionNode[]): string {
  const parts: string[] = [];

  for (const node of nodes) {
    parts.push(formatNode(node, 3));
  }

  return parts.join('\n\n');
}

/**
 * Recursively format a single decision node into prose markdown.
 *
 * @param node - The decision node or leaf string to format
 * @param depth - Current heading depth (3 = ###, 4 = ####, etc.)
 */
function formatNode(node: DecisionNode | string, depth: number): string {
  if (typeof node === 'string') {
    return formatLeaf(node);
  }

  const heading = '#'.repeat(Math.min(depth, 6));
  const parts: string[] = [];

  parts.push(`${heading} ${node.question}`);
  parts.push('');

  // Format the "yes" branch
  if (typeof node.yes === 'string') {
    parts.push(`**Yes:** ${formatLeaf(node.yes)}`);
  } else {
    parts.push('**Yes:**');
    parts.push('');
    parts.push(formatNode(node.yes, depth + 1));
  }

  parts.push('');

  // Format the "no" branch
  if (typeof node.no === 'string') {
    parts.push(`**No:** ${formatLeaf(node.no)}`);
  } else {
    parts.push('**No:**');
    parts.push('');
    parts.push(formatNode(node.no, depth + 1));
  }

  return parts.join('\n');
}

/**
 * Format a leaf node (variant name) as a recommendation line.
 *
 * Extracts the class name from parentheses if present, e.g.,
 * "Forward-Backward DMD (FbDMD)" -> Use **Forward-Backward DMD** (`FbDMD`).
 */
function formatLeaf(value: string): string {
  const parenMatch = value.match(/^(.+?)\s*\((\w+)\)$/);
  if (parenMatch) {
    return `Use **${parenMatch[1].trim()}** (\`${parenMatch[2]}\`).`;
  }
  return `Use **${value}**.`;
}
