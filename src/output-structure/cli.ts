/**
 * ME-5 Output-Structure Declaration — CLI command.
 *
 * Provides `skill-creator output-structure <skill>` for inspecting a single
 * skill's declared `output_structure` frontmatter, and `--migrate-all` for a
 * batch dry-run (CF-ME5-01/02) or apply (with `--apply`) over a skills
 * directory.
 *
 * Acceptance gates implemented here:
 *   CF-ME5-01 — Dry-run by default; `--apply` must be passed explicitly.
 *   CF-ME5-02 — Report with classified count, flagged count, confidence
 *               histogram written to stdout (and optionally to a file).
 *   CF-ME5-04 — Skills without `output_structure` default to prose on apply.
 *   CF-ME5-05 — Idempotent: `--apply` twice → zero-diff second run.
 *   SC-ME5-01 — Feature-flag `cartridge.output_structure = false` makes the
 *               command report flag-disabled and exit 0.
 *
 * @module output-structure/cli
 */

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { resolveOutputStructure } from './frontmatter.js';
import { validateOutputStructure } from './validator.js';
import { migrateSkill, applyMigration, buildScanReport } from './migrate.js';
import { classifyTractability, TRACTABILITY_LABELS } from './schema.js';
import type { ScanEntry } from './migrate.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OutputStructureCliOptions {
  /**
   * Path to the directory to scan (required for `--migrate-all`).
   * Defaults to `.claude/skills` if not provided.
   */
  skillsDir?: string;
  /** Apply inferred values to skill files; default false (dry-run). */
  apply?: boolean;
  /** Run the migration across all skills in `skillsDir`. */
  migrateAll?: boolean;
  /** Suppress non-essential output. */
  quiet?: boolean;
  /** Emit JSON to stdout instead of human-readable text. */
  json?: boolean;
  /** Feature-flag override: when false, command reports flag-disabled and exits. */
  featureEnabled?: boolean;
  /** Logger override for testing. */
  logger?: (line: string) => void;
}

const DEFAULT_LOG: (line: string) => void = (line) => { process.stdout.write(line + '\n'); };

// ---------------------------------------------------------------------------
// Single-skill inspection
// ---------------------------------------------------------------------------

async function inspectSkill(
  skillName: string,
  skillsDir: string,
  options: OutputStructureCliOptions,
): Promise<number> {
  const log = options.logger ?? DEFAULT_LOG;

  // Try to locate the SKILL.md
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
      // try next candidate
    }
  }

  if (content === null) {
    log(`output-structure: skill "${skillName}" not found`);
    log(`  Searched: ${candidates.slice(0, 2).join(', ')}`);
    return 1;
  }

  // Parse frontmatter manually (gray-matter is available but we hand-roll
  // to stay zero-external-dep at the schema layer)
  const rawFm = extractFrontmatterRaw(content);
  const rawOutputStructure = rawFm['output_structure'];

  const resolved = resolveOutputStructure(rawOutputStructure);
  const tractability = classifyTractability(resolved.structure);

  if (options.json) {
    log(JSON.stringify({
      skill: skillName,
      path: resolvedPath,
      output_structure: resolved.structure,
      source: resolved.source,
      tractability,
      warnings: resolved.warnings,
    }, null, 2));
    return 0;
  }

  log('');
  log(`Skill:          ${skillName}`);
  log(`Path:           ${resolvedPath}`);
  log(`Source:         ${resolved.source}`);
  log(`Kind:           ${resolved.structure.kind}`);
  if (resolved.structure.kind === 'json-schema' && resolved.structure.schema) {
    log(`Schema:         ${resolved.structure.schema.slice(0, 80)}`);
  }
  if (resolved.structure.kind === 'markdown-template' && resolved.structure.template) {
    log(`Template:       ${resolved.structure.template.slice(0, 80)}`);
  }
  log(`Tractability:   ${TRACTABILITY_LABELS[tractability]}`);

  if (resolved.warnings.length > 0) {
    log('');
    log('Warnings:');
    for (const w of resolved.warnings) {
      log(`  ! ${w}`);
    }
  }

  // Also validate the raw value for detailed feedback
  if (rawOutputStructure !== undefined) {
    const validation = validateOutputStructure(rawOutputStructure);
    if (!validation.valid) {
      log('');
      log('Validation errors:');
      for (const e of validation.errors) {
        log(`  x ${e}`);
      }
    }
  }

  log('');
  return 0;
}

// ---------------------------------------------------------------------------
// Batch migration
// ---------------------------------------------------------------------------

/** Recursively collect all SKILL.md files under a directory. */
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

async function runMigrateAll(
  skillsDir: string,
  options: OutputStructureCliOptions,
): Promise<number> {
  const log = options.logger ?? DEFAULT_LOG;
  const apply = options.apply ?? false;

  if (!options.json) {
    log('');
    if (apply) {
      log(`output-structure --migrate-all --apply: scanning ${skillsDir}`);
    } else {
      log(`output-structure --migrate-all --dry-run: scanning ${skillsDir}`);
      log('  (pass --apply to write changes)');
    }
    log('');
  }

  const files = await collectSkillFiles(skillsDir);
  if (files.length === 0) {
    log(`No skill files found under ${skillsDir}`);
    return 0;
  }

  const entries: ScanEntry[] = [];
  for (const filePath of files) {
    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch {
      continue;
    }
    const patch = migrateSkill(content);
    entries.push({ path: relative(process.cwd(), filePath), patch });

    if (apply && !patch.alreadyClassified && patch.inferred) {
      // Only apply high-confidence or prose defaults; flag low-confidence for review
      if (patch.inference?.flaggedForReview) {
        // CF-ME5-04 + proposal: flagged skills still apply with prose default
        // but are reported separately for human review
      }
      const newContent = applyMigration(content, patch);
      if (newContent !== content) {
        await writeFile(filePath, newContent, 'utf-8');
      }
    }
  }

  const report = buildScanReport(entries);

  if (options.json) {
    log(JSON.stringify(report, null, 2));
    return 0;
  }

  // Human-readable report (CF-ME5-02)
  log('---');
  log(`Scanned: ${report.total} skill files`);
  log(`  Auto-classified (confidence >= 0.8): ${report.autoClassified}`);
  log(`  Flagged for review (confidence < 0.8): ${report.flaggedForReview}`);
  log(`  Already classified:                   ${report.alreadyClassified}`);

  if (report.flaggedForReview > 0 && !options.quiet) {
    log('');
    log('Flagged for review (low-confidence — verify and update manually):');
    for (const entry of report.entries) {
      if (!entry.patch.alreadyClassified && entry.patch.inference?.flaggedForReview) {
        const inf = entry.patch.inference;
        const pct = ((inf.confidence) * 100).toFixed(0);
        log(`  ${entry.path} (confidence ${pct}% → ${inf.structure.kind})`);
        if (inf.structuredSignals.length > 0) {
          log(`    structured signals: ${inf.structuredSignals.join(', ')}`);
        }
        if (inf.proseSignals.length > 0) {
          log(`    prose signals: ${inf.proseSignals.join(', ')}`);
        }
      }
    }
  }

  if (apply) {
    const applied = report.autoClassified + report.flaggedForReview;
    log('');
    log(`Applied: ${applied} skills updated.`);
    log(`No-op:   ${report.alreadyClassified} skills already classified.`);
  } else {
    log('');
    log('Dry-run complete. Pass --apply to write changes.');
  }
  log('');

  // Exit non-zero if flagged skills remain unreviewed and we are NOT applying
  if (!apply && report.flaggedForReview > 0) {
    return 2; // 2 = "review required" (not an error)
  }

  return 0;
}

// ---------------------------------------------------------------------------
// Feature-flag check (SC-ME5-01)
// ---------------------------------------------------------------------------

function isFeatureEnabled(options: OutputStructureCliOptions): boolean {
  if (options.featureEnabled !== undefined) return options.featureEnabled;
  // Read from process.env as a simple feature-flag mechanism
  const envFlag = process.env['SKILL_CREATOR_OUTPUT_STRUCTURE'];
  if (envFlag === 'false' || envFlag === '0') return false;
  return true;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/** Help text for the `output-structure` command. */
export function outputStructureHelp(): string {
  return [
    '',
    'Usage: skill-creator output-structure [skill] [options]',
    '',
    'Inspect or migrate the output_structure frontmatter field.',
    '',
    'Arguments:',
    '  skill              Skill name or path to SKILL.md (optional with --migrate-all)',
    '',
    'Options:',
    '  --migrate-all      Scan all skills in --skills-dir and infer output_structure',
    '  --apply            Write inferred values to disk (default: dry-run)',
    '  --skills-dir=<p>   Directory to scan (default: .claude/skills)',
    '  --quiet, -q        Suppress non-essential output',
    '  --json             Emit JSON output',
    '  --help, -h         Show this help',
    '',
    'Examples:',
    '  skill-creator output-structure my-skill',
    '  skill-creator output-structure --migrate-all --dry-run',
    '  skill-creator output-structure --migrate-all --apply',
    '  skill-creator output-structure my-skill --json',
    '',
    'Feature flag:',
    '  Set SKILL_CREATOR_OUTPUT_STRUCTURE=false to disable this command.',
    '',
  ].join('\n');
}

/**
 * Execute the `output-structure` subcommand.
 *
 * @param args   - Raw CLI arguments after `output-structure` (i.e. `args.slice(1)`).
 * @param options - Pre-parsed options (for testing); overrides arg parsing when provided.
 * @returns exit code (0 = success, 1 = error, 2 = review required).
 */
export async function outputStructureCommand(
  args: string[],
  options: OutputStructureCliOptions = {},
): Promise<number> {
  const log = options.logger ?? DEFAULT_LOG;

  // Help
  if (args.includes('--help') || args.includes('-h')) {
    log(outputStructureHelp());
    return 0;
  }

  // Feature flag (SC-ME5-01)
  if (!isFeatureEnabled(options)) {
    if (!options.quiet) {
      log('output-structure: feature flag disabled (SKILL_CREATOR_OUTPUT_STRUCTURE=false)');
      log('Set SKILL_CREATOR_OUTPUT_STRUCTURE=true or remove the env var to enable.');
    }
    return 0;
  }

  // Parse flags
  const migrateAll = options.migrateAll ?? args.includes('--migrate-all');
  const apply = options.apply ?? args.includes('--apply');
  const quiet = options.quiet ?? (args.includes('--quiet') || args.includes('-q'));
  const json = options.json ?? args.includes('--json');

  const skillsDirArg = args.find(a => a.startsWith('--skills-dir='));
  const skillsDir = options.skillsDir
    ?? (skillsDirArg ? skillsDirArg.slice('--skills-dir='.length) : '.claude/skills');

  if (migrateAll) {
    return runMigrateAll(skillsDir, { ...options, apply, quiet, json });
  }

  // Single-skill inspection
  const positional = args.filter(a => !a.startsWith('-'));
  const skillName = positional[0];

  if (!skillName) {
    log(outputStructureHelp());
    return 1;
  }

  return inspectSkill(skillName, skillsDir, { ...options, quiet, json });
}

// ---------------------------------------------------------------------------
// Lightweight frontmatter extraction (no gray-matter dep in schema layer)
// ---------------------------------------------------------------------------

/**
 * Extract frontmatter as a flat string-keyed record.  Only handles simple
 * scalar values (strings, booleans) and nested `output_structure:` objects.
 * This is intentionally minimal — full YAML parsing is in the cartridge layer.
 */
function extractFrontmatterRaw(content: string): Record<string, unknown> {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith('---')) return {};

  const afterOpen = trimmed.slice(3);
  const closeIdx = afterOpen.search(/^\s*---\s*$/m);
  if (closeIdx === -1) return {};

  const yamlText = afterOpen.slice(0, closeIdx);
  return parseSimpleYaml(yamlText);
}

/**
 * Parse a minimal subset of YAML frontmatter to extract scalar and nested
 * `output_structure` values.  For full YAML parsing the cartridge layer uses
 * gray-matter; this helper exists only for the output-structure CLI's self-
 * contained inspection path.
 */
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
      // Possible nested block — collect indented lines
      const nested: Record<string, unknown> = {};
      i++;
      while (i < lines.length && /^\s+/.test(lines[i]!)) {
        const subLine = lines[i]!;
        const subMatch = subLine.match(/^\s+([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)/);
        if (subMatch) {
          const subKey = subMatch[1]!;
          const subVal = (subMatch[2] ?? '').trim();
          nested[subKey] = parseScalar(subVal);
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
  // Quoted strings
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  // Numeric
  const num = Number(value);
  if (!isNaN(num) && value !== '') return num;
  return value;
}
