/**
 * CollegeLoader -- progressive disclosure loader for the College Structure.
 *
 * Loads department content at three tiers:
 *   - Summary (~3K tokens) -- always loaded, lightweight overview
 *   - Active (~12K tokens) -- on demand per wing, full concept content
 *   - Deep (~50K+ tokens) -- on explicit request, reference material
 *
 * Departments are auto-discovered from the filesystem -- adding a new
 * department directory with a DEPARTMENT.md makes it discoverable
 * without any framework code changes (COLL-05).
 *
 * @module college/college-loader
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import type {
  RosettaConcept,
  DepartmentWing,
  TokenBudgetConfig,
  PanelId,
  PanelExpression,
} from '../rosetta-core/types.js';
import type { DepartmentSummary, WingContent, DeepReference } from './types.js';
import { countTokens, truncateToTokenBudget } from './token-counter.js';

// ─── Error Classes ───────────────────────────────────────────────────────────

export class DepartmentNotFoundError extends Error {
  constructor(id: string) {
    super(`Department not found: '${id}'`);
    this.name = 'DepartmentNotFoundError';
  }
}

export class WingNotFoundError extends Error {
  constructor(deptId: string, wingId: string) {
    super(`Wing '${wingId}' not found in department '${deptId}'`);
    this.name = 'WingNotFoundError';
  }
}

// ─── Department Markdown Parser ──────────────────────────────────────────────

interface ParsedDepartment {
  name: string;
  domain: string;
  description: string;
  wings: Array<{ id: string; name: string; description: string }>;
  entryPoint: string;
  rawContent: string;
}

/**
 * Parse a DEPARTMENT.md file into structured department metadata.
 */
function parseDepartmentMd(content: string): ParsedDepartment {
  const lines = content.split('\n');
  let name = '';
  let domain = '';
  let entryPoint = '';
  const wings: Array<{ id: string; name: string; description: string }> = [];

  let section = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Parse title
    if (trimmed.startsWith('# ') && !name) {
      name = trimmed.slice(2).trim();
      continue;
    }

    // Parse domain
    if (trimmed.startsWith('**Domain:**')) {
      domain = trimmed.replace('**Domain:**', '').trim();
      continue;
    }

    // Track section headers
    if (trimmed.startsWith('## ')) {
      section = trimmed.slice(3).trim().toLowerCase();
      continue;
    }

    // Parse wings
    if (section === 'wings' && trimmed.startsWith('- ')) {
      const wingText = trimmed.slice(2);
      const dashIndex = wingText.indexOf(' -- ');
      if (dashIndex >= 0) {
        const wingName = wingText.slice(0, dashIndex).trim();
        const wingDesc = wingText.slice(dashIndex + 4).trim();
        const wingId = wingName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        wings.push({ id: wingId, name: wingName, description: wingDesc });
      } else {
        // Wing with number prefix (e.g., "1. Food Science -- ...")
        const numbered = wingText.match(/^\d+\.\s*(.*)/);
        const cleanText = numbered ? numbered[1] : wingText;
        const dashIdx2 = cleanText.indexOf(' -- ');
        if (dashIdx2 >= 0) {
          const wingName = cleanText.slice(0, dashIdx2).trim();
          const wingDesc = cleanText.slice(dashIdx2 + 4).trim();
          const wingId = wingName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          wings.push({ id: wingId, name: wingName, description: wingDesc });
        } else {
          const wingName = cleanText.trim();
          const wingId = wingName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          wings.push({ id: wingId, name: wingName, description: '' });
        }
      }
      continue;
    }

    // Parse entry point
    if (section === 'entry point' && trimmed && !trimmed.startsWith('#')) {
      entryPoint = trimmed;
      section = ''; // Only take the first non-empty line
      continue;
    }
  }

  // Build description from non-structural lines between title and first section
  const descLines: string[] = [];
  let inPreamble = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ') && !inPreamble) {
      inPreamble = true;
      continue;
    }
    if (inPreamble) {
      if (trimmed.startsWith('## ')) break;
      if (trimmed.startsWith('**Domain:**') || trimmed.startsWith('**Source:**') || trimmed.startsWith('**Status:**') || trimmed.startsWith('**Purpose:**')) continue;
      if (trimmed) descLines.push(trimmed);
    }
  }

  return {
    name,
    domain: domain || name.toLowerCase().replace(/\s+/g, '-'),
    description: descLines.join(' '),
    wings,
    entryPoint,
    rawContent: content,
  };
}

// ─── CollegeLoader ───────────────────────────────────────────────────────────

export class CollegeLoader {
  private basePath: string;
  private defaultBudget: TokenBudgetConfig = {
    summaryLimit: 3000,
    activeLimit: 12000,
    deepLimit: 50000,
  };

  constructor(basePath: string = '.college/departments') {
    this.basePath = basePath;
  }

  /**
   * List all discovered department IDs from the filesystem.
   *
   * Scans basePath for directories containing DEPARTMENT.md.
   * No hardcoded department list -- new departments are auto-discovered.
   */
  listDepartments(): string[] {
    if (!existsSync(this.basePath)) return [];

    return readdirSync(this.basePath)
      .filter((entry) => {
        const entryPath = join(this.basePath, entry);
        return (
          statSync(entryPath).isDirectory() &&
          existsSync(join(entryPath, 'DEPARTMENT.md'))
        );
      })
      .sort();
  }

  /**
   * Load summary tier (<3K tokens) for a department.
   *
   * Reads DEPARTMENT.md, parses wings, counts concepts per wing,
   * enforces summaryLimit token budget.
   */
  async loadSummary(departmentId: string): Promise<DepartmentSummary> {
    const deptPath = join(this.basePath, departmentId);
    const deptMdPath = join(deptPath, 'DEPARTMENT.md');

    if (!existsSync(deptMdPath)) {
      throw new DepartmentNotFoundError(departmentId);
    }

    const content = readFileSync(deptMdPath, 'utf-8');
    const parsed = parseDepartmentMd(content);

    // Count concepts per wing by scanning concept directories
    const wingsWithCounts = parsed.wings.map((w) => {
      const wingConceptDir = join(deptPath, 'concepts', w.id);
      let conceptCount = 0;
      if (existsSync(wingConceptDir)) {
        conceptCount = readdirSync(wingConceptDir).filter(
          (f) => f.endsWith('.ts') && !f.endsWith('.test.ts'),
        ).length;
      }
      return { ...w, conceptCount };
    });

    // Scan try-sessions directory
    const trySessionsDir = join(deptPath, 'try-sessions');
    const trySessions: Array<{ id: string; name: string; estimatedDuration: string }> = [];
    if (existsSync(trySessionsDir)) {
      for (const file of readdirSync(trySessionsDir)) {
        if (file.endsWith('.json')) {
          try {
            const sessionData = JSON.parse(readFileSync(join(trySessionsDir, file), 'utf-8'));
            trySessions.push({
              id: sessionData.id || basename(file, '.json'),
              name: sessionData.title || sessionData.name || basename(file, '.json'),
              estimatedDuration: sessionData.estimatedMinutes
                ? `${sessionData.estimatedMinutes} min`
                : sessionData.estimatedDuration || 'unknown',
            });
          } catch {
            // Skip unparseable sessions
          }
        }
      }
    }

    // Build the summary text for token counting
    const summaryText = [
      parsed.name,
      parsed.description,
      ...wingsWithCounts.map((w) => `${w.name}: ${w.description} (${w.conceptCount} concepts)`),
      ...trySessions.map((s) => `${s.name} (${s.estimatedDuration})`),
    ].join('\n');

    let description = parsed.description;
    let totalTokenCost = countTokens(summaryText);

    // Enforce summary limit
    if (totalTokenCost > this.defaultBudget.summaryLimit) {
      const result = truncateToTokenBudget(summaryText, this.defaultBudget.summaryLimit);
      description = result.content;
      totalTokenCost = result.tokenCost;
    }

    return {
      id: departmentId,
      name: parsed.name,
      description,
      wings: wingsWithCounts,
      entryPoint: parsed.entryPoint,
      trySessions,
      tokenCost: totalTokenCost,
    };
  }

  /**
   * Load wing at active tier (<12K tokens).
   *
   * Reads concept files from the wing's concept directory.
   * Enforces activeLimit token budget.
   */
  async loadWing(departmentId: string, wingId: string): Promise<WingContent> {
    const deptPath = join(this.basePath, departmentId);
    const deptMdPath = join(deptPath, 'DEPARTMENT.md');

    if (!existsSync(deptMdPath)) {
      throw new DepartmentNotFoundError(departmentId);
    }

    const content = readFileSync(deptMdPath, 'utf-8');
    const parsed = parseDepartmentMd(content);
    const wingDef = parsed.wings.find((w) => w.id === wingId);

    if (!wingDef) {
      throw new WingNotFoundError(departmentId, wingId);
    }

    // Load concept files from the wing's directory
    const wingConceptDir = join(deptPath, 'concepts', wingId);
    const concepts: RosettaConcept[] = [];

    if (existsSync(wingConceptDir)) {
      const conceptFiles = readdirSync(wingConceptDir).filter(
        (f) => f.endsWith('.ts') && !f.endsWith('.test.ts'),
      );

      for (const file of conceptFiles) {
        try {
          const filePath = join(wingConceptDir, file);
          const fileContent = readFileSync(filePath, 'utf-8');

          // Parse concept from the file content by evaluating the export
          const concept = this.parseConceptFile(fileContent, file);
          if (concept) {
            concepts.push(concept);
          }
        } catch {
          // Skip unparseable concept files
        }
      }
    }

    const wing: DepartmentWing = {
      id: wingDef.id,
      name: wingDef.name,
      description: wingDef.description,
      concepts: concepts.map((c) => c.id),
    };

    // Calculate token cost from concept descriptions
    const conceptText = concepts
      .map((c) => `${c.name}: ${c.description}`)
      .join('\n');
    const tokenCost = countTokens(conceptText + wingDef.description);

    return {
      departmentId,
      wing,
      concepts,
      tokenCost: Math.min(tokenCost, this.defaultBudget.activeLimit),
    };
  }

  /**
   * Load deep reference material (on explicit request).
   *
   * Reads from references/ directory. No token truncation for deep tier,
   * but reports tokenCost.
   */
  async loadDeep(departmentId: string, topic: string): Promise<DeepReference> {
    const deptPath = join(this.basePath, departmentId);

    if (!existsSync(join(deptPath, 'DEPARTMENT.md'))) {
      throw new DepartmentNotFoundError(departmentId);
    }

    const refPath = join(deptPath, 'references', `${topic}.md`);

    if (!existsSync(refPath)) {
      return {
        departmentId,
        topic,
        content: `No deep reference available for '${topic}'. This topic has no deep reference available yet.`,
        relatedConcepts: [],
        tokenCost: countTokens(`no deep reference available for '${topic}'`),
      };
    }

    const refContent = readFileSync(refPath, 'utf-8');

    // Extract concept IDs referenced in the content (look for patterns like concept-id)
    const relatedConcepts: string[] = [];
    const conceptIdPattern = /\b[a-z]+-[a-z-]+\b/g;
    const matches = refContent.match(conceptIdPattern);
    if (matches) {
      // Deduplicate
      for (const m of new Set(matches)) {
        relatedConcepts.push(m);
      }
    }

    return {
      departmentId,
      topic,
      content: refContent,
      relatedConcepts,
      tokenCost: countTokens(refContent),
    };
  }

  /**
   * Get the raw DEPARTMENT.md content for a department.
   * Used by DepartmentExplorer for pedagogical context.
   */
  getDepartmentContent(departmentId: string): string {
    const deptMdPath = join(this.basePath, departmentId, 'DEPARTMENT.md');
    if (!existsSync(deptMdPath)) {
      throw new DepartmentNotFoundError(departmentId);
    }
    return readFileSync(deptMdPath, 'utf-8');
  }

  /**
   * Get the base path for a department.
   * Used by TrySessionRunner to locate try-session files.
   */
  getDepartmentPath(departmentId: string): string {
    const deptPath = join(this.basePath, departmentId);
    if (!existsSync(join(deptPath, 'DEPARTMENT.md'))) {
      throw new DepartmentNotFoundError(departmentId);
    }
    return deptPath;
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Parse a concept from a TypeScript file by extracting the object literal.
   * This is a simple parser that extracts id, name, domain, description.
   */
  private parseConceptFile(content: string, filename: string): RosettaConcept | null {
    // Extract id
    const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
    const nameMatch = content.match(/name:\s*['"]([^'"]+)['"]/);
    const domainMatch = content.match(/domain:\s*['"]([^'"]+)['"]/);

    // Extract description -- handle multiline string concatenation
    let description = '';
    const descMatch = content.match(/description:\s*['"]([^'"]*)['"]/);
    if (descMatch) {
      description = descMatch[1];
    } else {
      // Try multiline concatenation: description: 'part1' +\n    'part2'
      const multiDescMatch = content.match(/description:\s*((?:['"][^'"]*['"]\s*\+?\s*\n?\s*)+)/);
      if (multiDescMatch) {
        const parts = multiDescMatch[1].match(/['"]([^'"]*)['"]/g);
        if (parts) {
          description = parts.map((p) => p.slice(1, -1)).join('');
        }
      }
    }

    // Extract relationships
    const relationships: Array<{ type: 'dependency' | 'analogy' | 'cross-reference'; targetId: string; description: string }> = [];
    const relMatch = content.match(/relationships:\s*\[([\s\S]*?)\]/);
    if (relMatch) {
      const relContent = relMatch[1];
      const relEntries = relContent.match(/\{[\s\S]*?\}/g);
      if (relEntries) {
        for (const entry of relEntries) {
          const typeM = entry.match(/type:\s*['"]([^'"]+)['"]/);
          const targetM = entry.match(/targetId:\s*['"]([^'"]+)['"]/);
          const descM = entry.match(/description:\s*['"]([^'"]+)['"]/);
          if (typeM && targetM && descM) {
            relationships.push({
              type: typeM[1] as 'dependency' | 'analogy' | 'cross-reference',
              targetId: targetM[1],
              description: descM[1],
            });
          }
        }
      }
    }

    if (!idMatch) return null;

    return {
      id: idMatch[1],
      name: nameMatch ? nameMatch[1] : basename(filename, '.ts'),
      domain: domainMatch ? domainMatch[1] : 'unknown',
      description,
      panels: new Map(),
      relationships,
    };
  }
}
