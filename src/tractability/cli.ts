/**
 * ME-1 Tractability Classifier — CLI command.
 *
 * Provides:
 *   `skill-creator tractability <skill>` — classify a single skill
 *   `skill-creator tractability --audit`  — repo-wide audit
 *   `skill-creator tractability --json`   — machine-readable output
 *
 * Acceptance gates implemented here:
 *   CF-ME1-01 — every skill is classified (via --audit); classified_ratio shown.
 *   CF-ME1-02 — structured requires non-empty schema; handled in classifier.
 *   CF-ME1-03 — classified_ratio and tractable_ratio computed and displayed.
 *   SC-ME1-01 — SKILL_CREATOR_TRACTABILITY=false exits cleanly with message.
 *   IT-W1-ME1 — classified_ratio ≥ 95% gate reported in audit output.
 *
 * Pattern mirrors `src/output-structure/cli.ts` as instructed.
 *
 * @module tractability/cli
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { classifySkill } from './classifier.js';
import { resolveOutputStructure } from '../output-structure/frontmatter.js';
import { TRACTABILITY_LABELS } from '../output-structure/schema.js';
import { runAudit, formatAuditReport, DEFAULT_SCAN_DIRS } from './audit.js';
import type { AuditOptions } from './audit.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TractabilityCliOptions {
  /** Emit JSON to stdout instead of human-readable text. */
  json?: boolean;
  /** Suppress non-essential output. */
  quiet?: boolean;
  /** Run repo-wide audit instead of single-skill inspection. */
  audit?: boolean;
  /**
   * Directory to search for skills (single-skill mode).
   * Defaults to '.claude/skills' relative to cwd.
   */
  skillsDir?: string;
  /**
   * Extra directories for the audit (in addition to defaults).
   */
  extraDirs?: string[];
  /**
   * Override feature-flag; when false, command exits cleanly with message.
   * Useful for testing.
   */
  featureEnabled?: boolean;
  /** Logger override for testing. */
  logger?: (line: string) => void;
  /**
   * Override cwd for path resolution (testing).
   */
  cwd?: string;
}

const DEFAULT_LOG: (line: string) => void = (line) => {
  process.stdout.write(line + '\n');
};

// ---------------------------------------------------------------------------
// Feature-flag check (SC-ME1-01)
// ---------------------------------------------------------------------------

function isFeatureEnabled(options: TractabilityCliOptions): boolean {
  if (options.featureEnabled !== undefined) return options.featureEnabled;
  const env = process.env['SKILL_CREATOR_TRACTABILITY'];
  if (env === 'false' || env === '0') return false;
  return true;
}

// ---------------------------------------------------------------------------
// Frontmatter extraction (same subset YAML parser as output-structure/cli.ts)
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
// Single-skill inspection
// ---------------------------------------------------------------------------

async function inspectSkill(
  skillName: string,
  skillsDir: string,
  options: TractabilityCliOptions,
): Promise<number> {
  const log = options.logger ?? DEFAULT_LOG;

  const candidates = [
    join(skillsDir, skillName, 'SKILL.md'),
    join(skillsDir, skillName),
    skillName, // allow passing a direct file path
  ];

  let content: string | null = null;
  let resolvedPath = '';
  for (const candidate of candidates) {
    try {
      content = await readFile(candidate, 'utf-8');
      resolvedPath = candidate;
      break;
    } catch {
      // try next
    }
  }

  if (content === null) {
    log(`tractability: skill "${skillName}" not found`);
    log(`  Searched: ${candidates.slice(0, 2).join(', ')}`);
    return 1;
  }

  const rawFm = extractFrontmatterRaw(content);
  const rawOutputStructure = rawFm['output_structure'];
  const resolved = resolveOutputStructure(rawOutputStructure);

  const structureForClassifier = resolved.source === 'default' ? null : resolved.structure;
  const body = content.replace(/^---[\s\S]*?---\s*/m, '');
  const result = classifySkill(structureForClassifier, body);

  if (resolved.warnings.length > 0) {
    result.warnings.push(...resolved.warnings);
  }

  if (options.json) {
    log(JSON.stringify({
      skill: skillName,
      path: resolvedPath,
      tractabilityClass: result.tractabilityClass,
      confidence: result.confidence,
      evidence: result.evidence,
      warnings: result.warnings,
      output_structure: resolved.structure,
      source: resolved.source,
    }, null, 2));
    return 0;
  }

  log('');
  log(`Skill:            ${skillName}`);
  log(`Path:             ${resolvedPath}`);
  log(`Output-structure: ${resolved.structure.kind} (source: ${resolved.source})`);
  log(`Tractability:     ${result.tractabilityClass}`);
  log(`Confidence:       ${(result.confidence * 100).toFixed(0)}%`);
  log(`Label:            ${TRACTABILITY_LABELS[result.tractabilityClass]}`);

  if (result.evidence.length > 0 && !options.quiet) {
    log('');
    log('Evidence:');
    for (const ev of result.evidence) {
      log(`  [${ev.direction.padEnd(10)} w=${ev.weight.toFixed(2)}] ${ev.signal}`);
    }
  }

  if (result.warnings.length > 0) {
    log('');
    log('Warnings:');
    for (const w of result.warnings) {
      log(`  ! ${w}`);
    }
  }

  log('');
  return 0;
}

// ---------------------------------------------------------------------------
// Audit subcommand
// ---------------------------------------------------------------------------

async function runAuditCommand(options: TractabilityCliOptions): Promise<number> {
  const log = options.logger ?? DEFAULT_LOG;
  const cwd = options.cwd ?? process.cwd();

  const auditOptions: AuditOptions = {
    extraDirs: options.extraDirs,
    cwd,
    featureEnabled: options.featureEnabled,
  };

  const report = await runAudit(auditOptions);

  if (report.isDisabled) {
    if (!options.quiet) {
      log('tractability: classifier disabled (SKILL_CREATOR_TRACTABILITY=false)');
      log('  Set SKILL_CREATOR_TRACTABILITY=true or remove the env var to enable.');
    }
    return 0;
  }

  if (options.json) {
    log(JSON.stringify({
      timestamp: report.timestamp,
      total: report.total,
      classifiedCount: report.classifiedCount,
      classifiedRatio: report.classifiedRatio,
      tractableCount: report.tractableCount,
      tractableRatio: report.tractableRatio,
      counts: report.counts,
      unclassifiable: report.unclassifiable.map((e) => ({
        name: e.name,
        path: e.path,
        confidence: e.classification.confidence,
      })),
      entries: report.entries.map((e) => ({
        name: e.name,
        path: e.path,
        tractabilityClass: e.classification.tractabilityClass,
        confidence: e.classification.confidence,
      })),
    }, null, 2));
    return 0;
  }

  const text = formatAuditReport(report, cwd);
  log(text);

  // IT-W1-ME1: warn when classified_ratio < 95%
  if (report.classifiedRatio < 0.95) {
    log('');
    log(
      `WARNING (IT-W1-ME1): classified_ratio ${(report.classifiedRatio * 100).toFixed(1)}% < 95%.` +
      ` Run 'skill-creator output-structure --migrate-all --apply' to classify remaining skills.`,
    );
  }

  return 0;
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

/** Help text for the `tractability` command. */
export function tractabilityHelp(): string {
  return [
    '',
    'Usage: skill-creator tractability [skill] [options]',
    '       skill-creator tract [skill] [options]',
    '',
    'Classify skill tractability from output_structure frontmatter (ME-1).',
    '',
    'Arguments:',
    '  skill              Skill name or path to SKILL.md',
    '',
    'Options:',
    '  --audit            Scan all skills and emit a repo-wide report',
    '  --skills-dir=<p>   Base directory for single-skill search (default: .claude/skills)',
    '  --extra-dirs=<p>   Comma-separated extra dirs for --audit',
    '  --json             Emit JSON output',
    '  --quiet, -q        Suppress non-essential output',
    '  --help, -h         Show this help',
    '',
    'Examples:',
    '  skill-creator tractability gsd-workflow',
    '  skill-creator tractability beautiful-commits --json',
    '  skill-creator tractability --audit',
    '  skill-creator tractability --audit --json',
    '  skill-creator tract gsd-workflow',
    '',
    'Feature flag:',
    '  Set SKILL_CREATOR_TRACTABILITY=false to disable this command.',
    '',
    'Classes:',
    '  tractable  — structured output declared; optimization has reliable effect',
    '  coin-flip  — prose output declared; optimization is statistically unreliable',
    '  unknown    — no output_structure declared; treated as coin-flip conservatively',
    '',
    'Default scan dirs:',
    ...DEFAULT_SCAN_DIRS.map((d) => `  ${d}`),
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Execute the `tractability` subcommand.
 *
 * @param args    - Raw CLI arguments after `tractability` (i.e. `args.slice(1)`).
 * @param options - Pre-parsed options (for testing).
 * @returns exit code (0 = success, 1 = error).
 */
export async function tractabilityCommand(
  args: string[],
  options: TractabilityCliOptions = {},
): Promise<number> {
  const log = options.logger ?? DEFAULT_LOG;

  // Help
  if (args.includes('--help') || args.includes('-h')) {
    log(tractabilityHelp());
    return 0;
  }

  // Feature flag (SC-ME1-01)
  if (!isFeatureEnabled(options)) {
    if (!options.quiet) {
      log('tractability: feature flag disabled (SKILL_CREATOR_TRACTABILITY=false)');
      log('  Set SKILL_CREATOR_TRACTABILITY=true or remove the env var to enable.');
    }
    return 0;
  }

  // Parse flags
  const audit = options.audit ?? args.includes('--audit');
  const json = options.json ?? args.includes('--json');
  const quiet = options.quiet ?? (args.includes('--quiet') || args.includes('-q'));

  const skillsDirArg = args.find((a) => a.startsWith('--skills-dir='));
  const skillsDir =
    options.skillsDir ??
    (skillsDirArg ? skillsDirArg.slice('--skills-dir='.length) : '.claude/skills');

  const extraDirsArg = args.find((a) => a.startsWith('--extra-dirs='));
  const extraDirs =
    options.extraDirs ??
    (extraDirsArg ? extraDirsArg.slice('--extra-dirs='.length).split(',') : undefined);

  if (audit) {
    return runAuditCommand({ ...options, json, quiet, extraDirs });
  }

  // Single-skill inspection
  const positional = args.filter((a) => !a.startsWith('-'));
  const skillName = positional[0];

  if (!skillName) {
    log(tractabilityHelp());
    return 1;
  }

  return inspectSkill(skillName, skillsDir, { ...options, json, quiet });
}
