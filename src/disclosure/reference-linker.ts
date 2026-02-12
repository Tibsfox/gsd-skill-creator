/**
 * ReferenceLinker for progressive disclosure.
 * Generates @reference links and detects circular references using visited-set DFS.
 * Addresses DISC-04 requirement (circular reference detection).
 */

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

export class ReferenceLinker {
  /**
   * Generate an @reference link from one file to another within a skill directory.
   */
  generateLink(_fromFile: string, _toFile: string): string {
    throw new Error('Not implemented');
  }

  /**
   * Parse all @references/ and @scripts/ links from markdown content.
   * Ignores references inside fenced code blocks.
   */
  parseReferences(_content: string): ReferenceLink[] {
    throw new Error('Not implemented');
  }

  /**
   * Detect circular references in a file map using visited-set DFS.
   * @param fileMap Map of filename -> file content
   */
  detectCircularReferences(_fileMap: Map<string, string>): CycleDetectionResult {
    throw new Error('Not implemented');
  }

  /**
   * Validate all references in a skill directory.
   * Checks for circular references and dead links.
   * @param skillDir Path to skill directory
   */
  validateSkillReferences(_skillDir: string): Promise<ValidationResult> {
    throw new Error('Not implemented');
  }
}
