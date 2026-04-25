/**
 * Skilldex Auditor — UIP-13 T1a (Phase 765, CAPCOM hard preservation Gate G10).
 *
 * ZFC compliance auditor for SKILL.md spec-conformance, fusing the Skilldex
 * catalog schema (arXiv:2604.16911 / Saha & Hemanth, ACL Findings 2026) and
 * the Structural Verification for EDA static-only methodology
 * (arXiv:2604.18834 / Jayasuriya et al.).
 *
 * ## Opt-in mechanism
 *
 * This module is **default-OFF**. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "upstream-intelligence": {
 *       "skilldex-auditor": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * With the flag absent or false, every public entry point returns an empty
 * AuditReport with `disabled: true` and reads zero skill files. This is the
 * Gate G10 hard-preservation invariant: byte-identical to phase-764 tip.
 *
 * ## Hard preservation invariants (Gate G10)
 *
 * 1. Read-only relative to skill library: zero writes into `.claude/skills/`,
 *    `.agents/skills/`, or `examples/`.
 * 2. No CAPCOM/orchestrator/DACP imports: this module is a leaf observer.
 * 3. No skill-DAG topology mutation.
 * 4. Default-off byte-identical to phase-764 tip.
 *
 * @module skilldex-auditor
 */

import fs from 'node:fs';
import path from 'node:path';

import { parseSkillFile, scoreSpec } from './conformance-scorer.js';
import { summarise } from './finding-emitter.js';
import { isSkilldexAuditorEnabled } from './settings.js';
import type { AuditFinding, AuditReport } from './types.js';

export type {
  AuditFinding,
  AuditReport,
  AuditSeverity,
  RegistryEntry,
  SkillSpec,
} from './types.js';

export type { SkilldexAuditorConfig } from './settings.js';

export {
  DEFAULT_SKILLDEX_AUDITOR_CONFIG,
  isSkilldexAuditorEnabled,
  readSkilldexAuditorConfig,
} from './settings.js';

export {
  REQUIRED_FRONTMATTER,
  RECOMMENDED_FRONTMATTER,
  REQUIRED_HEADINGS,
  parseSkillContent,
  parseSkillFile,
  scoreSpec,
} from './conformance-scorer.js';

export type {
  FindingEnvelope,
  ReportEnvelope,
} from './finding-emitter.js';

export {
  emitFinding,
  emitReport,
  parseFinding,
  parseReport,
  summarise,
} from './finding-emitter.js';

export { findInRegistry, listRegistry } from './registry.js';

/**
 * Build an empty disabled report. Used whenever the opt-in flag is off.
 */
function disabledReport(): AuditReport {
  return {
    timestamp: new Date(0).toISOString(),
    inspected: 0,
    findings: [],
    disabled: true,
    summary: { pass: 0, warn: 0, fail: 0 },
  };
}

/**
 * Audit a single SKILL.md file.
 *
 * Returns an array of findings. When the flag is off, returns an empty array
 * and reads zero files (byte-identical to phase-764 tip).
 *
 * @param skillPath Absolute path to a SKILL.md file.
 * @param settingsPath Optional override for the config file location (test).
 */
export async function auditSkill(
  skillPath: string,
  settingsPath?: string,
): Promise<ReadonlyArray<AuditFinding>> {
  if (!isSkilldexAuditorEnabled(settingsPath)) {
    return [];
  }
  const spec = parseSkillFile(skillPath);
  return scoreSpec(spec);
}

/**
 * Audit every SKILL.md under `skillsDir` (one level deep).
 *
 * Returns a complete AuditReport. When the flag is off, returns
 * `disabledReport()` and reads zero files.
 *
 * @param skillsDir Directory whose immediate children are skill folders.
 * @param settingsPath Optional override for the config file location (test).
 */
export async function auditAll(
  skillsDir: string,
  settingsPath?: string,
): Promise<AuditReport> {
  if (!isSkilldexAuditorEnabled(settingsPath)) {
    return disabledReport();
  }
  if (!fs.existsSync(skillsDir)) {
    return {
      timestamp: new Date().toISOString(),
      inspected: 0,
      findings: [],
      disabled: false,
      summary: { pass: 0, warn: 0, fail: 0 },
    };
  }
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  } catch {
    return {
      timestamp: new Date().toISOString(),
      inspected: 0,
      findings: [],
      disabled: false,
      summary: { pass: 0, warn: 0, fail: 0 },
    };
  }
  const allFindings: AuditFinding[] = [];
  let inspected = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;
    const spec = parseSkillFile(skillPath);
    for (const f of scoreSpec(spec)) allFindings.push(f);
    inspected += 1;
  }
  return {
    timestamp: new Date().toISOString(),
    inspected,
    findings: allFindings,
    disabled: false,
    summary: summarise(allFindings),
  };
}
