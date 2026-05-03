/**
 * C02 — Shared tree-sitter traversal utilities.
 *
 * All functions are pure (no I/O). Used by all 8 language analyzers.
 */

// ─── Tree-sitter node type (minimal) ─────────────────────

export interface TSNode {
  type: string;
  text: string;
  startIndex: number;
  endIndex: number;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  hasError: boolean;
  isNamed: boolean;
  childCount: number;
  children: TSNode[];
  namedChildren: TSNode[];
  childForFieldName(name: string): TSNode | null;
  firstChild: TSNode | null;
  lastChild: TSNode | null;
  parent: TSNode | null;
}

export interface TSTree {
  rootNode: TSNode;
}

// ─── Pre-order traversal ─────────────────────────────────

/**
 * Pre-order traversal of the tree-sitter syntax tree.
 * Calls `callback` on each node where `predicate` returns true.
 * If predicate returns false, children of that node are still visited.
 */
export function walk(
  node: TSNode,
  predicate: (node: TSNode) => boolean,
  callback: (node: TSNode) => void,
): void {
  if (predicate(node)) {
    callback(node);
  }
  for (const child of node.children) {
    walk(child, predicate, callback);
  }
}

// ─── Node text extraction ─────────────────────────────────

/**
 * Extract the source text for a tree-sitter node using its byte range.
 */
export function nodeText(source: string, node: TSNode): string {
  return source.slice(node.startIndex, node.endIndex);
}

// ─── Lines of code ───────────────────────────────────────

/**
 * Count non-blank, non-pure-comment lines.
 *
 * @param source - Source text.
 * @param lineCommentPrefix - Single-line comment prefix (e.g. '//' or '#').
 *                            Block comments (/* ... *\/) are also stripped.
 */
export function linesOfCode(source: string, lineCommentPrefix: string): number {
  if (!source.trim()) return 0;

  const lines = source.split('\n');
  let count = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue; // blank
    if (line.startsWith(lineCommentPrefix)) continue; // single-line comment
    if (line.startsWith('/*') || line.startsWith('*') || line.startsWith('*/')) continue; // block comment
    count++;
  }

  return count;
}

// ─── Cyclomatic complexity ───────────────────────────────

/**
 * Compute cyclomatic complexity of a function/method node.
 * Formula: 1 + count of branching constructs (specified by branchNodeTypes).
 *
 * @param fnNode - The function's root node (function_declaration, arrow_function, etc.)
 * @param source - Source text (used for named-token detection in branchTokens that are operators)
 * @param branchNodeTypes - Array of node types that increment the branch count
 *                          (e.g. 'if_statement', 'while_statement', '&&', '||')
 */
export function cyclomaticComplexity(
  fnNode: TSNode,
  source: string,
  branchNodeTypes: string[],
): number {
  const branchSet = new Set(branchNodeTypes);
  let branches = 0;

  walk(
    fnNode,
    () => true,
    (node) => {
      if (branchSet.has(node.type)) {
        branches++;
      }
    },
  );

  return 1 + branches;
}
