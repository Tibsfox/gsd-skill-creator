/**
 * ME-1 Tractability Classifier — repo-wide audit.
 *
 * Walks the standard skill directories (.claude/skills/, .college/departments/,
 * and optional extra directories) and classifies every skill.  Returns a
 * structured AuditReport for consumption by the CLI and downstream tools.
 *
 * Acceptance gates implemented here:
 *   CF-ME1-01 — every skill under .claude/skills/ and .college/departments/
 *               is classified (coverage ≥ 100% on trunk after ME-5 migration).
 *   CF-ME1-03 — classified_ratio and tractable_ratio computed without silent
 *               exclusions.
 *   IT-W1-ME1 — classified_ratio ≥ 95% gate (checked by audit consumers).
 *   SC-ME1-01 — feature-flag 'tractability.classifier = false' causes the
 *               audit to return early with isDisabled=true.
 *
 * @module tractability/audit
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { classifySkill } from './classifier.js';
import { resolveOutputStructure } from '../output-structure/frontmatter.js';
import type { ClassificationResult } from './classifier.js';
import type { TractabilityClass } from '../output-structure/schema.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One row in the audit: a single skill with its classification. */
export interface AuditEntry {
  /** Skill name (typically the directory name). */
  name: string;
  /** Absolute path to the skill file. */
  path: string;
  /** Classification result. */
  classification: ClassificationResult;
}

/** Summary counts per tractability class. */
export interface ClassCounts {
  tractable: number;
  'coin-flip': number;
  unknown: number;
}

/** Full audit report returned by `runAudit()`. */
export interface AuditReport {
  /** ISO timestamp of the audit run. */
  timestamp: string;
  /** Total number of skill files scanned. */
  total: number;
  /** Number of skills NOT classified as 'unknown'. */
  classifiedCount: number;
  /** Ratio of classified / total in [0, 1]. */
  classifiedRatio: number;
  /** Number of skills classified as 'tractable'. */
  tractableCount: number;
  /**
   * Ratio of tractable / classified (i.e. tractable / (total - unknown))
   * in [0, 1].  Zero when classifiedCount = 0.
   */
  tractableRatio: number;
  /** Per-class counts. */
  counts: ClassCounts;
  /** All individual entries, ordered by path. */
  entries: AuditEntry[];
  /** Skills that came back 'unknown' (missing output_structure). */
  unclassifiable: AuditEntry[];
  /**
   * Whether the feature flag disabled the audit.
   * When true, all counts are 0 and entries / unclassifiable are empty.
   */
  isDisabled: boolean;
}

// ---------------------------------------------------------------------------
// Feature-flag check (SC-ME1-01)
// ---------------------------------------------------------------------------

function isClassifierEnabled(): boolean {
  const env = process.env['SKILL_CREATOR_TRACTABILITY'];
  if (env === 'false' || env === '0') return false;
  return true;
}

// ---------------------------------------------------------------------------
// Frontmatter extraction (shared with output-structure/cli.ts pattern)
// ---------------------------------------------------------------------------

function extractFrontmatterRaw(content: string): Record<string, unknown> {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith('---')) return {};
  const afterOpen = trimmed.slice(3);
  const closeIdx = afterOpen.search(/^\s*---\s*$/m);
  if (closeIdx === -1) return {};
  const yamlText = afterOpen.slice(0, closeIdx);
  return parseSimpleYaml(yamlText);
}

function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)/);
    if (!keyMatch) { i++; continue; }
    const key = keyMatch[1]!;
    const rest = (keyMatch[2] ?? '').trim();
    if (rest === '' || rest === '|' || rest === '>') {
      const nested: Record<string, unknown> = {};
      i++;
      while (i < lines.length && /^\s+/.test(lines[i]!)) {
        const subLine = lines[i]!;
        const subMatch = subLine.match(/^\s+([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)/);
        if (subMatch) {
          nested[subMatch[1]!] = parseScalar((subMatch[2] ?? '').trim());
        }
        i++;
      }
      result[key] = Object.keys(nested).length > 0 ? nested : undefined;
    } else {
      result[key] = parseScalar(rest);
      i++;
    }
  }
  return result;
}

function parseScalar(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) return value.slice(1, -1);
  const num = Number(value);
  if (!isNaN(num) && value !== '') return num;
  return value;
}

// ---------------------------------------------------------------------------
// File collection
// ---------------------------------------------------------------------------

/** Recursively collect all SKILL.md or *.md files under a directory. */
async function collectSkillFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let s;
    try {
      s = await stat(full);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      const sub = await collectSkillFiles(full);
      results.push(...sub);
    } else if (entry === 'SKILL.md' || entry.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Derive a human-readable skill name from a file path.
 * For `SKILL.md` files: use the parent directory name.
 * For other `.md` files: use the filename without extension.
 */
function skillNameFromPath(filePath: string): string {
  const parts = filePath.split('/');
  const filename = parts[parts.length - 1]!;
  if (filename === 'SKILL.md' && parts.length >= 2) {
    return parts[parts.length - 2]!;
  }
  return filename.replace(/\.md$/, '');
}

// ---------------------------------------------------------------------------
// Main audit function
// ---------------------------------------------------------------------------

export interface AuditOptions {
  /**
   * Extra directories to scan in addition to the default ones
   * (.claude/skills and .college/departments relative to cwd, or absolute paths).
   */
  extraDirs?: string[];
  /**
   * Override the base directory for resolving relative paths.
   * Defaults to process.cwd().
   */
  cwd?: string;
  /**
   * Override feature-flag check; when false, returns a disabled report.
   * Useful for testing.
   */
  featureEnabled?: boolean;
}

/** Default skill directories to scan (relative to cwd). */
export const DEFAULT_SCAN_DIRS = ['.claude/skills', '.college/departments'] as const;

/**
 * Run the full tractability audit across all discoverable skills.
 *
 * @param options - Optional configuration.
 * @returns A structured `AuditReport`.
 */
export async function runAudit(options: AuditOptions = {}): Promise<AuditReport> {
  const flagEnabled = options.featureEnabled ?? isClassifierEnabled();

  const disabledReport: AuditReport = {
    timestamp: new Date().toISOString(),
    total: 0,
    classifiedCount: 0,
    classifiedRatio: 0,
    tractableCount: 0,
    tractableRatio: 0,
    counts: { tractable: 0, 'coin-flip': 0, unknown: 0 },
    entries: [],
    unclassifiable: [],
    isDisabled: true,
  };

  if (!flagEnabled) {
    return disabledReport;
  }

  const cwd = options.cwd ?? process.cwd();

  // Build directory list
  const dirs = [
    ...DEFAULT_SCAN_DIRS.map((d) => (d.startsWith('/') ? d : join(cwd, d))),
    ...(options.extraDirs ?? []).map((d) => (d.startsWith('/') ? d : join(cwd, d))),
  ];

  // Collect all skill files
  const allFiles: string[] = [];
  for (const dir of dirs) {
    const files = await collectSkillFiles(dir);
    allFiles.push(...files);
  }

  // Deduplicate by path
  const uniqueFiles = [...new Set(allFiles)].sort();

  // Classify each skill
  const entries: AuditEntry[] = [];
  for (const filePath of uniqueFiles) {
    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch {
      // Skip unreadable files
      continue;
    }

    const rawFm = extractFrontmatterRaw(content);
    const rawOutputStructure = rawFm['output_structure'];

    // Resolve via ME-5
    const resolved = resolveOutputStructure(rawOutputStructure);

    // Classify (pass null when source=default so classifier records 'absent')
    const structureForClassifier =
      resolved.source === 'default' ? null : resolved.structure;

    // Pass the body (after frontmatter) for implicit-hint detection
    const body = content.replace(/^---[\s\S]*?---\s*/m, '');
    const classification = classifySkill(structureForClassifier, body);

    // Propagate resolver warnings
    if (resolved.warnings.length > 0) {
      classification.warnings.push(...resolved.warnings);
    }

    entries.push({
      name: skillNameFromPath(filePath),
      path: filePath,
      classification,
    });
  }

  // Compute summary stats
  const counts: ClassCounts = { tractable: 0, 'coin-flip': 0, unknown: 0 };
  for (const entry of entries) {
    const cls = entry.classification.tractabilityClass;
    counts[cls]++;
  }

  const total = entries.length;
  const classifiedCount = total - counts.unknown;
  const classifiedRatio = total > 0 ? classifiedCount / total : 0;
  const tractableCount = counts.tractable;
  const tractableRatio = classifiedCount > 0 ? tractableCount / classifiedCount : 0;
  const unclassifiable = entries.filter(
    (e) => e.classification.tractabilityClass === 'unknown',
  );

  return {
    timestamp: new Date().toISOString(),
    total,
    classifiedCount,
    classifiedRatio,
    tractableCount,
    tractableRatio,
    counts,
    entries,
    unclassifiable,
    isDisabled: false,
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers (used by CLI)
// ---------------------------------------------------------------------------

/**
 * Format an AuditReport as a human-readable text summary.
 * Mirrors the sample output format from the ME-1 proposal.
 */
export function formatAuditReport(report: AuditReport, cwd?: string): string {
  if (report.isDisabled) {
    return [
      'skill-creator tractability --audit: classifier disabled',
      '  Set SKILL_CREATOR_TRACTABILITY=true or remove the env var to enable.',
    ].join('\n');
  }

  const base = cwd ?? process.cwd();
  const rel = (p: string) => p.startsWith(base) ? p.slice(base.length + 1) : p;

  const lines: string[] = [
    '',
    `Scanned: ${report.total} skills`,
    `  tractable: ${report.counts.tractable} (${pct(report.counts.tractable, report.total)})`,
    `  coin-flip: ${report.counts['coin-flip']} (${pct(report.counts['coin-flip'], report.total)})`,
    `  unknown:   ${report.counts.unknown} (${pct(report.counts.unknown, report.total)})`,
    `Classified ratio:  ${report.classifiedCount}/${report.total} (${fmtRatio(report.classifiedRatio)})`,
    `Tractable ratio:   ${report.tractableCount}/${report.classifiedCount} (${fmtRatio(report.tractableRatio)})`,
  ];

  if (report.unclassifiable.length > 0) {
    lines.push('');
    lines.push(`Unclassified (${report.unclassifiable.length}):`);
    for (const entry of report.unclassifiable) {
      lines.push(`  - ${entry.name.padEnd(30)} [${rel(entry.path)}]`);
    }
  }

  return lines.join('\n');
}

function pct(count: number, total: number): string {
  if (total === 0) return '0.0%';
  return ((count / total) * 100).toFixed(1) + '%';
}

function fmtRatio(r: number): string {
  return (r * 100).toFixed(1) + '%';
}

export type { TractabilityClass };
