/**
 * ME-2 Per-Skill Model Affinity — CLI command.
 *
 * Provides:
 *   `skill-creator model-affinity <skill> [--model=<family>] [--tractability=<class>]`
 *     — evaluate affinity for a single skill
 *   `skill-creator model-affinity --audit [--model=<family>]`
 *     — repo-wide check: surface escalation suggestions across all skills
 *   `skill-creator model-affinity --json`
 *     — machine-readable output for both modes
 *
 * Acceptance gates implemented here:
 *   CF-ME2-01 — flag-off exits cleanly with "disabled" message.
 *   CF-ME2-03 — skills without model_affinity report "no affinity declared".
 *   SC-ME2-01 — flag-off verified via fixture (featureEnabled option).
 *   LS-40     — per-skill affinity declared in frontmatter; escalation surfaces
 *               when model family below skill's min/preferred; suggestion only.
 *
 * Pattern mirrors `src/tractability/cli.ts` (ME-1).
 *
 * @module model-affinity/cli
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { resolveModelAffinity } from './frontmatter.js';
import { evaluateMatch } from './policy.js';
import { readModelAffinityEnabledFlag } from './settings.js';
import type { ModelFamily } from './schema.js';
import type { TractabilityClass } from '../output-structure/schema.js';

// ---------------------------------------------------------------------------
// Default scan directories (mirrors tractability/audit.ts)
// ---------------------------------------------------------------------------

export const DEFAULT_SCAN_DIRS = [
  '.claude/skills',
  '.claude/agents',
  '.college/departments',
  'examples/skills',
  'examples/agents',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModelAffinityCliOptions {
  /** Emit JSON to stdout instead of human-readable text. */
  json?: boolean;
  /** Suppress non-essential output. */
  quiet?: boolean;
  /** Run repo-wide audit instead of single-skill inspection. */
  audit?: boolean;
  /** Session model family to evaluate against. Default 'sonnet'. */
  model?: ModelFamily;
  /**
   * Tractability class to use for escalation gating. Default 'unknown'.
   * Callers who have ME-1 wired should pass the actual class.
   */
  tractability?: TractabilityClass;
  /**
   * Override feature-flag; when false, command exits cleanly with message.
   * Useful for testing (SC-ME2-01).
   */
  featureEnabled?: boolean;
  /**
   * Directory to search for skills (single-skill mode).
   * Defaults to '.claude/skills'.
   */
  skillsDir?: string;
  /** Logger override for testing. */
  logger?: (line: string) => void;
  /** Override cwd for path resolution (testing). */
  cwd?: string;
}

const DEFAULT_LOG: (line: string) => void = (line) => {
  process.stdout.write(line + '\n');
};

// ---------------------------------------------------------------------------
// Feature-flag check
// ---------------------------------------------------------------------------

function isFeatureEnabled(options: ModelAffinityCliOptions): boolean {
  if (options.featureEnabled !== undefined) return options.featureEnabled;
  const cwd = options.cwd ?? process.cwd();
  return readModelAffinityEnabledFlag(join(cwd, '.claude/settings.json'));
}

// ---------------------------------------------------------------------------
// Frontmatter extraction (reuses same subset YAML parser as tractability/cli.ts)
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
    // Top-level key (no leading whitespace)
    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)/);
    if (!keyMatch) { i++; continue; }
    const key = keyMatch[1]!;
    const rest = (keyMatch[2] ?? '').trim();
    if (rest === '' || rest === '|' || rest === '>') {
      // Determine indentation of the block
      i++;
      const next = lines[i];
      if (!next || !/^\s+/.test(next)) {
        result[key] = undefined;
        continue;
      }
      // Detect block type from the first indented line
      const trimmedNext = next.trimStart();
      if (trimmedNext.startsWith('- ')) {
        // Top-level list
        const listItems = collectListItemsAt(lines, i, 1);
        result[key] = listItems.values;
        i = listItems.nextIndex;
      } else {
        // Nested object — sub-keys may themselves be lists
        const nested: Record<string, unknown> = {};
        while (i < lines.length && /^\s+/.test(lines[i]!)) {
          const subLine = lines[i]!;
          const subMatch = subLine.match(/^(\s+)([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)/);
          if (!subMatch) { i++; continue; }
          const subIndent = subMatch[1]!.length;
          const subKey = subMatch[2]!;
          const subRest = (subMatch[3] ?? '').trim();
          i++;
          if (subRest === '' || subRest === '|' || subRest === '>') {
            // Sub-key has no inline value — check if followed by a list
            if (i < lines.length) {
              const subNext = lines[i]!;
              const subNextTrimmed = subNext.trimStart();
              const subNextIndent = subNext.length - subNextTrimmed.length;
              if (subNextIndent > subIndent && subNextTrimmed.startsWith('- ')) {
                const listItems = collectListItemsAt(lines, i, subNextIndent);
                nested[subKey] = listItems.values;
                i = listItems.nextIndex;
              } else {
                nested[subKey] = undefined;
              }
            } else {
              nested[subKey] = undefined;
            }
          } else {
            nested[subKey] = parseScalar(subRest);
          }
        }
        result[key] = nested;
      }
    } else {
      result[key] = parseScalar(rest);
      i++;
    }
  }
  return result;
}

/**
 * Collect YAML list items (`- value`) at the given minimum indentation level.
 */
function collectListItemsAt(
  lines: string[],
  startIdx: number,
  minIndent: number,
): { values: unknown[]; nextIndex: number } {
  const values: unknown[] = [];
  let i = startIdx;
  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;
    if (indent < minIndent) break;
    const listMatch = trimmed.match(/^-\s+(.*)/);
    if (!listMatch) break;
    values.push(parseScalar((listMatch[1] ?? '').trim()));
    i++;
  }
  return { values, nextIndex: i };
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
  options: ModelAffinityCliOptions,
): Promise<number> {
  const log = options.logger ?? DEFAULT_LOG;
  const skillsDir = options.skillsDir ?? '.claude/skills';
  const sessionModel: ModelFamily = options.model ?? 'sonnet';
  const tractabilityClass: TractabilityClass = options.tractability ?? 'unknown';

  const candidates = [
    join(skillsDir, skillName, 'SKILL.md'),
    join(skillsDir, skillName),
    skillName,
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
    log(`model-affinity: skill "${skillName}" not found`);
    log(`  Searched: ${candidates.slice(0, 2).join(', ')}`);
    return 1;
  }

  const rawFm = extractFrontmatterRaw(content);
  const rawAffinity = rawFm['model_affinity'];
  const resolved = resolveModelAffinity(rawAffinity);
  const decision = evaluateMatch(resolved.affinity, sessionModel, tractabilityClass);

  if (options.json) {
    log(JSON.stringify({
      skill: skillName,
      path: resolvedPath,
      sessionModel,
      tractabilityClass,
      affinity: resolved.affinity,
      affinitySource: resolved.source,
      warnings: resolved.warnings,
      decision: {
        ok: decision.ok,
        penalty: decision.penalty,
        shouldEscalate: decision.shouldEscalate,
        escalateTo: decision.escalateTo ?? null,
        reason: decision.reason ?? null,
      },
    }, null, 2));
    return 0;
  }

  log('');
  log(`Skill:           ${skillName}`);
  log(`Path:            ${resolvedPath}`);
  log(`Session model:   ${sessionModel}`);
  log(`Tractability:    ${tractabilityClass}`);
  if (resolved.affinity) {
    log(`Affinity:        reliable=[${resolved.affinity.reliable.join(', ')}]` +
      (resolved.affinity.unreliable?.length
        ? `, unreliable=[${resolved.affinity.unreliable.join(', ')}]`
        : ''));
  } else {
    log(`Affinity:        (none declared — zero penalty)`);
  }
  log(`Match:           ${decision.ok ? 'OK' : 'MISMATCH'}`);
  log(`Penalty:         ${decision.penalty.toFixed(2)}`);
  log(`Should escalate: ${decision.shouldEscalate ? 'YES' : 'no'}`);

  if (decision.shouldEscalate && decision.escalateTo) {
    log('');
    log(`  Escalation suggestion: upgrade session to "${decision.escalateTo}"`);
    log(`  Reason: ${decision.reason ?? ''}`);
  } else if (decision.reason && !options.quiet) {
    log('');
    log(`  Note: ${decision.reason}`);
  }

  if (resolved.warnings.length > 0 && !options.quiet) {
    log('');
    log('Warnings:');
    for (const w of resolved.warnings) {
      log(`  ! ${w}`);
    }
  }

  log('');
  return 0;
}

// ---------------------------------------------------------------------------
// Audit subcommand
// ---------------------------------------------------------------------------

interface AuditEntry {
  name: string;
  path: string;
  affinitySource: 'explicit' | 'absent';
  decision: {
    ok: boolean;
    penalty: number;
    shouldEscalate: boolean;
    escalateTo?: ModelFamily;
    reason?: string;
  };
  warnings: string[];
}

async function collectSkillFiles(
  dirs: string[],
  cwd: string,
): Promise<Array<{ name: string; path: string }>> {
  const { readdir } = await import('node:fs/promises');
  const { existsSync } = await import('node:fs');
  const skills: Array<{ name: string; path: string }> = [];

  for (const dir of dirs) {
    const absDir = join(cwd, dir);
    if (!existsSync(absDir)) continue;
    try {
      const entries = await readdir(absDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillPath = join(absDir, entry.name, 'SKILL.md');
          if (existsSync(skillPath)) {
            skills.push({ name: entry.name, path: skillPath });
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          skills.push({ name: entry.name.replace(/\.md$/, ''), path: join(absDir, entry.name) });
        }
      }
    } catch {
      // skip unreadable dirs
    }
  }

  return skills;
}

async function runAuditCommand(options: ModelAffinityCliOptions): Promise<number> {
  const log = options.logger ?? DEFAULT_LOG;
  const cwd = options.cwd ?? process.cwd();
  const sessionModel: ModelFamily = options.model ?? 'sonnet';
  const tractabilityClass: TractabilityClass = options.tractability ?? 'unknown';

  const skillFiles = await collectSkillFiles(DEFAULT_SCAN_DIRS, cwd);
  const entries: AuditEntry[] = [];

  for (const { name, path } of skillFiles) {
    try {
      const content = await readFile(path, 'utf-8');
      const rawFm = extractFrontmatterRaw(content);
      const rawAffinity = rawFm['model_affinity'];
      const resolved = resolveModelAffinity(rawAffinity);
      const decision = evaluateMatch(resolved.affinity, sessionModel, tractabilityClass);
      entries.push({
        name,
        path,
        affinitySource: resolved.source,
        decision: {
          ok: decision.ok,
          penalty: decision.penalty,
          shouldEscalate: decision.shouldEscalate,
          escalateTo: decision.escalateTo,
          reason: decision.reason,
        },
        warnings: resolved.warnings,
      });
    } catch {
      // skip unreadable files
    }
  }

  const total = entries.length;
  const withAffinity = entries.filter((e) => e.affinitySource === 'explicit').length;
  const escalations = entries.filter((e) => e.decision.shouldEscalate);
  const penalised = entries.filter((e) => !e.decision.shouldEscalate && e.decision.penalty > 0);
  const allModels = entries.filter(
    (e) =>
      e.affinitySource === 'explicit' &&
      e.decision.ok &&
      e.decision.penalty === 0,
  );

  if (options.json) {
    log(JSON.stringify({
      sessionModel,
      tractabilityClass,
      total,
      withAffinity,
      coverageRatio: total > 0 ? withAffinity / total : 0,
      escalationCount: escalations.length,
      penalisedCount: penalised.length,
      entries: entries.map((e) => ({
        name: e.name,
        path: e.path,
        affinitySource: e.affinitySource,
        ok: e.decision.ok,
        penalty: e.decision.penalty,
        shouldEscalate: e.decision.shouldEscalate,
        escalateTo: e.decision.escalateTo ?? null,
      })),
    }, null, 2));
    return 0;
  }

  log('');
  log('Model Affinity Audit (ME-2)');
  log('============================');
  log(`Session model:     ${sessionModel}`);
  log(`Tractability:      ${tractabilityClass}`);
  log(`Skills scanned:    ${total}`);
  log(`With affinity:     ${withAffinity} (${total > 0 ? ((withAffinity / total) * 100).toFixed(1) : '0.0'}%)`);
  log(`Escalations:       ${escalations.length}`);
  log(`Penalised (no esc):${penalised.length}`);
  log(`Fully covered:     ${allModels.length}`);

  if (escalations.length > 0) {
    log('');
    log('Escalation suggestions:');
    for (const e of escalations) {
      log(`  ${e.name}: escalate "${sessionModel}" → "${e.decision.escalateTo}"`);
      if (e.decision.reason && !options.quiet) {
        log(`    ${e.decision.reason}`);
      }
    }
  }

  if (penalised.length > 0 && !options.quiet) {
    log('');
    log('Penalised (no escalation):');
    for (const e of penalised) {
      log(`  ${e.name}: penalty=${e.decision.penalty.toFixed(2)}`);
    }
  }

  // Warn about skills that declare all models reliable (may be misdeclared)
  const allReliable = entries.filter(
    (e) =>
      e.affinitySource === 'explicit' &&
      e.decision.penalty === 0 &&
      e.decision.ok,
  );
  if (allReliable.length > 5 && !options.quiet) {
    log('');
    log(
      `NOTE: ${allReliable.length} skills report no penalty for "${sessionModel}". ` +
      `If many declare all models reliable, consider auditing declarations.`,
    );
  }

  log('');
  return 0;
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

export function modelAffinityHelp(): string {
  return [
    '',
    'Usage: skill-creator model-affinity [skill] [options]',
    '       skill-creator aff [skill] [options]',
    '',
    'Evaluate per-skill model affinity and surface escalation suggestions (ME-2).',
    '',
    'Arguments:',
    '  skill                  Skill name or path to SKILL.md',
    '',
    'Options:',
    '  --audit                Scan all skills and emit a repo-wide report',
    '  --model=<family>       Session model family to evaluate against',
    '                         (haiku | sonnet | opus | unknown; default: sonnet)',
    '  --tractability=<class> ME-1 tractability class for escalation gating',
    '                         (tractable | coin-flip | unknown; default: unknown)',
    '  --skills-dir=<path>    Base directory for single-skill search',
    '                         (default: .claude/skills)',
    '  --json                 Emit JSON output',
    '  --quiet, -q            Suppress non-essential output',
    '  --help, -h             Show this help',
    '',
    'Examples:',
    '  skill-creator model-affinity gsd-workflow',
    '  skill-creator model-affinity beautiful-commits --model=haiku',
    '  skill-creator model-affinity beautiful-commits --model=haiku --tractability=tractable',
    '  skill-creator model-affinity --audit --model=haiku',
    '  skill-creator model-affinity --audit --json',
    '  skill-creator aff gsd-workflow --model=opus',
    '',
    'Feature flag:',
    '  Set gsd-skill-creator.model_affinity.enabled = true in .claude/settings.json',
    '  to enable this feature. Default: OFF (flag-off is byte-identical to v1.49.561).',
    '',
    'Escalation policy:',
    '  - Session model in reliable[]  → no penalty, no escalation',
    '  - Session model in unreliable[], tractable skill → penalty 0.5, escalate',
    '  - Session model in unreliable[], coin-flip skill → penalty 0.1, no escalate',
    '  - Session model not mentioned  → penalty 0.2, no escalation (neutral)',
    '  - No affinity declared         → no penalty (CF-ME2-03)',
    '',
    'Default scan dirs (--audit):',
    ...DEFAULT_SCAN_DIRS.map((d) => `  ${d}`),
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Execute the `model-affinity` subcommand.
 *
 * @param args    - Raw CLI arguments after `model-affinity` (i.e. `args.slice(1)`).
 * @param options - Pre-parsed options (for testing).
 * @returns exit code (0 = success, 1 = error).
 */
export async function modelAffinityCommand(
  args: string[],
  options: ModelAffinityCliOptions = {},
): Promise<number> {
  const log = options.logger ?? DEFAULT_LOG;

  // Help
  if (args.includes('--help') || args.includes('-h')) {
    log(modelAffinityHelp());
    return 0;
  }

  // Feature flag (CF-ME2-01)
  if (!isFeatureEnabled(options)) {
    if (!options.quiet) {
      log('model-affinity: feature flag disabled');
      log('  Set gsd-skill-creator.model_affinity.enabled = true in .claude/settings.json to enable.');
    }
    return 0;
  }

  // Parse flags
  const audit = options.audit ?? args.includes('--audit');
  const json = options.json ?? args.includes('--json');
  const quiet = options.quiet ?? (args.includes('--quiet') || args.includes('-q'));

  // --model flag
  const modelArg = args.find((a) => a.startsWith('--model='));
  const modelRaw = options.model ?? (modelArg ? modelArg.slice('--model='.length) : undefined);
  const sessionModel: ModelFamily =
    modelRaw && ['haiku', 'sonnet', 'opus', 'unknown'].includes(modelRaw)
      ? (modelRaw as ModelFamily)
      : 'sonnet';

  // --tractability flag
  const tractArg = args.find((a) => a.startsWith('--tractability='));
  const tractRaw = options.tractability ?? (tractArg ? tractArg.slice('--tractability='.length) : undefined);
  const tractabilityClass: TractabilityClass =
    tractRaw && ['tractable', 'coin-flip', 'unknown'].includes(tractRaw)
      ? (tractRaw as TractabilityClass)
      : 'unknown';

  // --skills-dir flag
  const skillsDirArg = args.find((a) => a.startsWith('--skills-dir='));
  const skillsDir =
    options.skillsDir ??
    (skillsDirArg ? skillsDirArg.slice('--skills-dir='.length) : '.claude/skills');

  const mergedOptions: ModelAffinityCliOptions = {
    ...options,
    json,
    quiet,
    model: sessionModel,
    tractability: tractabilityClass,
    skillsDir,
  };

  if (audit) {
    return runAuditCommand(mergedOptions);
  }

  // Single-skill inspection
  const positional = args.filter((a) => !a.startsWith('-'));
  const skillName = positional[0];

  if (!skillName) {
    log(modelAffinityHelp());
    return 1;
  }

  return inspectSkill(skillName, mergedOptions);
}
