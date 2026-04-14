/**
 * CLI command for publishing skill packages.
 *
 * Delegates to packSkill to create a distributable .tar.gz archive.
 *
 * Publish gate:
 *   When a skill has `requires-critique: true` in its frontmatter, publishCommand
 *   reads `.critique-status.json` from the skill directory and enforces:
 *     - File must exist (exit 1 if missing)
 *     - status must be 'converged' (exit 1 otherwise)
 *     - skillHash must match sha256(SKILL.md body) (exit 1 on mismatch)
 *   Pass --override-critique <reason> to bypass the gate; override is logged to
 *   .local/critique-logs/overrides.log (T-CRIT-07).
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { join } from 'path';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { packSkill } from '../../mcp/index.js';
import { SkillStore } from '../../storage/skill-store.js';
import { getSkillsBasePath } from '../../types/scope.js';

// ============================================================================
// Public interface
// ============================================================================

export interface PublishOptions {
  skillsDir?: string;
  output?: string;
  /** Bypass critique gate with a mandatory reason string (logged to overrides.log). */
  overrideCritique?: string;
  /** Injected store (for testing; production uses SkillStore). */
  _store?: { exists: (name: string) => Promise<boolean> };
}

// ============================================================================
// Gate helpers
// ============================================================================

interface CritiqueStatus {
  skillHash: string;
  status: string;
  findings: number;
  lastRun: string;
}

/** Compute sha256 of skill body (mirrors critiqueCommand hash logic). */
function hashBody(body: string): string {
  return createHash('sha256').update(body).digest('hex');
}

/**
 * Enforce the requires-critique publish gate.
 *
 * Returns null on pass, or an error message string on failure.
 * When overrideCritique is set, writes to overrides.log and returns null.
 */
async function enforceGate(
  skillName: string,
  skillDir: string,
  skillBody: string,
  overrideCritique: string | undefined,
): Promise<string | null> {
  const statusPath = join(skillDir, '.critique-status.json');
  const overridesLog = join('.local', 'critique-logs', 'overrides.log');

  // Override path — bypass gate, write audit log (T-CRIT-07)
  if (overrideCritique) {
    const timestamp = new Date().toISOString();
    const entry = `${timestamp} | skill=${skillName} | reason=${overrideCritique}\n`;
    try {
      await mkdir(join('.local', 'critique-logs'), { recursive: true });
      // Append to existing log (read + append pattern, robust to concurrent writes)
      let existing = '';
      try {
        existing = await readFile(overridesLog, 'utf-8');
      } catch {
        // File doesn't exist yet — that's fine
      }
      await writeFile(overridesLog, existing + entry);
    } catch (err) {
      // Non-fatal — log to stderr but don't block publish
      p.log.warn(`Could not write override log: ${err instanceof Error ? err.message : String(err)}`);
    }
    p.log.warn(pc.yellow(`Critique gate bypassed for "${skillName}" — override reason recorded`));
    return null;
  }

  // Read .critique-status.json
  let statusRaw: string;
  try {
    statusRaw = await readFile(statusPath, 'utf-8');
  } catch {
    return (
      `Skill "${skillName}" requires critique before publishing.\n` +
      `  Run: skill-creator critique ${skillName}\n` +
      `  Missing: ${statusPath}`
    );
  }

  // Parse status
  let status: CritiqueStatus;
  try {
    status = JSON.parse(statusRaw) as CritiqueStatus;
  } catch {
    return `Malformed .critique-status.json for "${skillName}" — re-run critique`;
  }

  // Check converged
  if (status.status !== 'converged') {
    return (
      `Skill "${skillName}" critique has not converged (status: ${status.status}).\n` +
      `  Run: skill-creator critique ${skillName}`
    );
  }

  // Check hash match
  const currentHash = hashBody(skillBody);
  if (status.skillHash !== currentHash) {
    return (
      `Skill "${skillName}" has changed since last critique — hashes do not match.\n` +
      `  Re-run: skill-creator critique ${skillName}`
    );
  }

  return null;
}

// ============================================================================
// publishCommand
// ============================================================================

/**
 * Package a skill for distribution as a .tar.gz archive.
 *
 * @param skillName - Name of the skill to publish
 * @param options - Publish options
 * @returns Exit code (0 success, 1 error)
 */
export async function publishCommand(
  skillName: string | undefined,
  options: PublishOptions,
): Promise<number> {
  // No skill name provided -- show help
  if (!skillName) {
    showPublishHelp();
    return 1;
  }

  const skillsDir = options.skillsDir ?? getSkillsBasePath('user');
  const store = options._store ?? new SkillStore(skillsDir);

  // Verify skill exists
  const exists = await store.exists(skillName);
  if (!exists) {
    p.log.error(`Skill "${skillName}" not found in ${skillsDir}/`);
    return 1;
  }

  const skillDir = join(skillsDir, skillName);

  // --- Read SKILL.md to check requires-critique and compute hash ---
  let skillBody: string;
  try {
    skillBody = await readFile(join(skillDir, 'SKILL.md'), 'utf-8');
  } catch (err) {
    p.log.error(`Could not read SKILL.md: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }

  // --- Parse frontmatter (lightweight check, no full gray-matter needed) ---
  const requiresCritique = extractRequiresCritique(skillBody);

  // --- Enforce gate if requires-critique: true ---
  if (requiresCritique) {
    const gateError = await enforceGate(skillName, skillDir, skillBody, options.overrideCritique);
    if (gateError) {
      p.log.error(gateError);
      return 1;
    }
  }

  // Determine output path
  const outputPath = options.output ?? `./${skillName}.skill.tar.gz`;

  try {
    p.intro(pc.bgCyan(pc.black(' Publishing skill... ')));

    const manifest = await packSkill(skillDir, skillName, outputPath);

    p.log.success(`Published "${skillName}"`);
    p.log.message(pc.dim(`Name: ${manifest.name}`));
    p.log.message(pc.dim(`Format version: ${manifest.formatVersion}`));
    p.log.message(pc.dim(`Files: ${manifest.files.length}`));
    p.log.message(pc.dim(`Archive: ${outputPath}`));

    return 0;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    p.log.error(`Publish failed: ${errMsg}`);
    return 1;
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract `requires-critique` boolean from SKILL.md frontmatter.
 * Lightweight YAML key scanner — does not parse full frontmatter.
 */
function extractRequiresCritique(body: string): boolean {
  // Frontmatter is between first and second --- delimiters
  const match = body.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return false;
  const fm = match[1];
  // Look for `requires-critique: true`
  return /^\s*requires-critique\s*:\s*true\s*$/m.test(fm);
}

function showPublishHelp(): void {
  console.log(`
skill-creator publish - Package a skill for distribution

Usage:
  skill-creator publish <skill-name> [options]

Options:
  --output, -o <path>            Output file path (default: ./<skill-name>.skill.tar.gz)
  --project, -p                  Read from project-level scope
  --override-critique <reason>   Bypass critique gate (reason is logged to overrides.log)
  --help, -h                     Show this help message

The published package uses portable format (extension fields stripped).

Critique gate:
  Skills with "requires-critique: true" must pass the critique loop before publishing.
  Run: skill-creator critique <skill-name>
`);
}
