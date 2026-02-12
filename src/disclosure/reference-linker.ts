/**
 * ReferenceLinker for progressive disclosure.
 * Generates @reference links and detects circular references using visited-set DFS.
 * Addresses DISC-04 requirement (circular reference detection).
 *
 * Parallels DependencyGraph in src/composition/ but uses visited-set DFS instead
 * of Kahn's algorithm because the file reference graph is simpler (files reference
 * other files, not a formal DAG with in-degrees). Self-contained -- no imports from
 * dependency-graph.ts.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

export interface ReferenceLink {
  path: string;    // e.g., 'references/guidelines.md'
  line: number;    // Line number where reference appears
}

export interface CycleDetectionResult {
  hasCycle: boolean;
  cycle?: string[];   // Files involved in the cycle
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];     // Cycle errors
  warnings: string[];   // Dead link warnings
}

export class CircularReferenceError extends Error {
  constructor(public cycle: string[]) {
    super(`Circular reference detected: ${cycle.join(' -> ')}`);
    this.name = 'CircularReferenceError';
  }
}

/**
 * Reference pattern: matches @references/... and @scripts/... paths.
 * Captures the full relative path after the @.
 * Must end with a word character (not a period) to avoid capturing
 * sentence-ending punctuation like "See @references/guide.md."
 */
const REFERENCE_PATTERN = /@((?:references|scripts)\/[\w.\-/]*[\w])/g;

export class ReferenceLinker {
  /**
   * Generate an @reference link from one file to another within a skill directory.
   * Both files are within the same skill directory, so return @{toFile}.
   */
  generateLink(_fromFile: string, toFile: string): string {
    return `@${toFile}`;
  }

  /**
   * Parse all @references/ and @scripts/ links from markdown content.
   * Ignores references inside fenced code blocks.
   */
  parseReferences(content: string): ReferenceLink[] {
    const refs: ReferenceLink[] = [];
    const lines = content.split('\n');
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Toggle code block state on fence markers
      if (line.trimStart().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      // Skip lines inside code blocks
      if (inCodeBlock) {
        continue;
      }

      // Find all reference matches in this line
      const lineNum = i + 1; // 1-based line numbers
      let match: RegExpExecArray | null;
      const regex = new RegExp(REFERENCE_PATTERN.source, 'g');
      while ((match = regex.exec(line)) !== null) {
        refs.push({
          path: match[1],
          line: lineNum,
        });
      }
    }

    return refs;
  }

  /**
   * Detect circular references in a file map using visited-set DFS.
   * @param fileMap Map of filename -> file content
   */
  detectCircularReferences(fileMap: Map<string, string>): CycleDetectionResult {
    if (fileMap.size === 0) {
      return { hasCycle: false };
    }

    // Build adjacency list: for each file, parse its references to other files
    const adjacency = new Map<string, string[]>();

    for (const [filename, content] of fileMap) {
      const refs = this.parseReferences(content);
      const targets = refs
        .map(r => r.path)
        // Only consider references to files that exist in the fileMap
        .filter(path => fileMap.has(path));
      adjacency.set(filename, targets);
    }

    // DFS with recursion stack for cycle detection
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const parent = new Map<string, string>(); // For reconstructing cycle path

    const dfs = (node: string): string[] | null => {
      visited.add(node);
      recStack.add(node);

      const neighbors = adjacency.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          parent.set(neighbor, node);
          const cycle = dfs(neighbor);
          if (cycle) return cycle;
        } else if (recStack.has(neighbor)) {
          // Found a cycle - reconstruct it
          return this.extractCycle(neighbor, node, parent);
        }
      }

      recStack.delete(node);
      return null;
    };

    // Run DFS from each unvisited node
    for (const filename of fileMap.keys()) {
      if (!visited.has(filename)) {
        parent.clear();
        const cycle = dfs(filename);
        if (cycle) {
          return { hasCycle: true, cycle };
        }
      }
    }

    return { hasCycle: false };
  }

  /**
   * Validate all references in a skill directory.
   * Checks for circular references and dead links.
   * @param skillDir Path to skill directory
   */
  async validateSkillReferences(skillDir: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Collect all .md files recursively
    const fileMap = await this.readSkillFiles(skillDir);

    // Check for circular references
    const cycleResult = this.detectCircularReferences(fileMap);
    if (cycleResult.hasCycle && cycleResult.cycle) {
      errors.push(
        `Circular reference detected: ${cycleResult.cycle.join(' -> ')}`
      );
    }

    // Check for dead links (references to files that don't exist)
    for (const [filename, content] of fileMap) {
      const refs = this.parseReferences(content);
      for (const ref of refs) {
        if (!fileMap.has(ref.path)) {
          // Check if it's a script (scripts aren't in fileMap since they're not .md)
          if (!ref.path.startsWith('scripts/')) {
            warnings.push(
              `Dead link in ${filename} (line ${ref.line}): ${ref.path} not found`
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Extract the cycle path from DFS parent tracking.
   * Walks back from `current` to `cycleStart` using parent map,
   * then includes cycleStart to form the full cycle.
   */
  private extractCycle(
    cycleStart: string,
    current: string,
    parent: Map<string, string>,
  ): string[] {
    const cycle: string[] = [current];
    let node = current;

    // Walk back through parents until we reach cycleStart
    while (node !== cycleStart) {
      node = parent.get(node)!;
      if (node === undefined) break; // Safety valve
      cycle.unshift(node);
    }

    // For self-references, the cycle is just the single node
    if (cycleStart === current) {
      return [cycleStart];
    }

    return cycle;
  }

  /**
   * Read all .md files from a skill directory (recursively).
   * Returns a Map of relative path -> content.
   */
  private async readSkillFiles(skillDir: string): Promise<Map<string, string>> {
    const fileMap = new Map<string, string>();
    await this.walkDir(skillDir, skillDir, fileMap);
    return fileMap;
  }

  /**
   * Recursively walk a directory, collecting .md files.
   */
  private async walkDir(
    baseDir: string,
    currentDir: string,
    fileMap: Map<string, string>,
  ): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await this.walkDir(baseDir, fullPath, fileMap);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const relPath = relative(baseDir, fullPath);
        const content = await readFile(fullPath, 'utf-8');
        fileMap.set(relPath, content);
      }
    }
  }
}
